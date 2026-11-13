"""Conversation adapter over the existing MEOK worker and read-only lab.
No new provider, weights, external authority or durable server memory.
"""
from __future__ import annotations
import copy, hashlib, json, re
from datetime import datetime, timezone
import core
VERSION='2026-11-10.chat.1'
MAX_MESSAGES=80
MAX_SNAPSHOT_BYTES=600000
GOAL=('Have a clear, useful conversation. Answer the latest message directly and naturally, using the recent conversation when relevant. '
      'You are the MEOK assistant in this private Hugging Face workspace, using the selected model worker. Be concise and complete. '
      'Do not claim you have executed tools, saved durable memories, trained yourself or performed external actions.')

def canonical(x):
    return json.dumps(x,ensure_ascii=False,sort_keys=True,separators=(',',':'),allow_nan=False).encode()

def messages_checked(value):
    if not isinstance(value,list) or len(value)>MAX_MESSAGES:raise ValueError('Invalid conversation history')
    out=[]
    for item in value:
        if not isinstance(item,dict) or item.get('role') not in ('user','assistant'):raise ValueError('Only user and assistant text messages can be restored')
        text=item.get('content')
        if not isinstance(text,str) or not text.strip() or len(text)>14000:raise ValueError('Invalid or oversized conversation message')
        out.append({'role':item['role'],'content':text})
    return out

def state_copy(state):
    state=core.validate_session(state)
    state['chat_messages']=messages_checked(state.get('chat_messages',[]))
    return state

def command_for(message,allow_tools):
    if type(allow_tools) is not bool:raise ValueError('Tool setting must be boolean')
    if not allow_tools:return None
    text=message.strip();low=text.lower().rstrip('?.! ')
    if text.startswith('/calc '):return ('calc',text[6:].strip())
    if low in ('/help','what can you do','help me get started'):return ('help',None)
    if low in ('/status','check your runtime','show runtime status','what is running'):return ('status',None)
    if low in ('/axes','list the gspc axes','show the gspc axes','list gspc axes','show all axes'):return ('axes',None)
    if low in ('/memory','what do you remember','show session memory'):return ('memory',None)
    if low in ('run a q.ant cpu check','run the qant cpu check'):return ('qant',17)
    m=re.fullmatch(r'/axis\s+([a-z0-9-]{1,80})',low)
    if m:return ('axis',m.group(1))
    m=re.fullmatch(r'/qant(?:\s+(\d{1,5}))?',low)
    if m:
        seed=int(m.group(1) or 17)
        if seed>10000:raise ValueError('Q.ANT seed must be 0..10000')
        return ('qant',seed)
    m=re.fullmatch(r'/process\s+(.+)',text,flags=re.S)
    if m:return ('process',m.group(1))
    if text.startswith('/'):raise ValueError('Unknown command. Use /help, /calc EXPRESSION, /status, /axes, /axis NAME, /qant, /process JSON or /memory.')
    return None

def tool_result(command,state,tools):
    name,arg=command
    if name=='help':
        data={'kind':'declared_capabilities','external_action_authority':False}
        answer=('You can chat with me, ask follow-up questions, or attach an image for the Cosmos worker. I use the recent six exchanges, not an unlimited memory.\n\n'
                'Connected read-only tools: **/calc 0.1 + 0.2**, **/status**, **/axes**, **/axis safety**, **/qant 17**, **/process [11 numeric features]**, and **/memory**. The full laboratory is below.\n\n'
                'Use **Export conversation** to keep a copy and restore it later. I do not automatically train on our conversation, save it to a durable server store, or control your computer.')
    elif name=='calc':
        data=tools['calculate_exact'](arg)
        if data['status']=='COMPUTED':
            answer='Exact result: **'+data['result']['value']+'**.\n\nCalculated from your explicit expression, without a model call. This does not verify the assumptions behind a word problem.'
        else:
            answer='Calculation refused: **'+data['error']+'**. No result was computed. Use explicit arithmetic, not prose or executable Python.'
    elif name=='memory':
        data={'visible_messages':len(state['chat_messages']),'context_messages':len(state['turns'][-12:]),'server_memory':'temporary session only','imported_text':state.get('chat_imported',False)}
        answer=(f"This session has {data['visible_messages']} chat messages. The worker receives up to the last 12 context messages—six exchanges. "
                'Export before closing the session to keep a copy. There is no automatic durable memory or weight training.')
    elif name=='status':
        data=tools['lab_status']()
        answer=(f"The MEOK process component is **{data['process_model']}**, with **{data['parameters']} trained parameters**, pinned to `{data['process_model_revision'][:12]}`. "
                f"It is a synthetic research predictor.\n\nThe retained GSPC snapshot contains **{data['gspc_snapshot']['count']} axes**. "
                'Q.ANT tools use the CPU backend, not a physical optical processor. Conversation generation uses the model selected in chat settings. This lookup did not test or retrain that provider.')
    elif name=='axes':
        data=tools['axis_snapshot']('all')
        answer=f"The retained GSPC snapshot contains **{data['count']} axes**:\n\n"+', '.join(data['axis_names'])+f".\n\nSnapshot retrieved: `{data['snapshot']['retrieved_at']}`. "
        answer+='This reads the canonical snapshot; it does not run 34 new measurements or create 34 specialist models.'
    elif name=='axis':
        data=tools['axis_snapshot'](arg);a=data['axis']
        answer=(f"**{arg}**\n\nTask: {a.get('task','See the source record below.')}\n\nRecorded status: **{a.get('status','Unspecified')}**. "
                f"Separation: **{a.get('separation','Not applicable or unspecified')}**.\n\nSnapshot retrieved: `{data['snapshot']['retrieved_at']}`. "
                'Reading this record does not remeasure the model. Full details are in the evidence panel.')
    elif name=='qant':
        data=tools['photonic_cpu_probe'](arg)
        checks=['finite','reused_weights_match','managed_memory_matches','within_declared_0_03_tolerance']
        answer=(f"The **Q.ANT {data['sdk_version']} CPU probe** finished with **{sum(bool(data[k]) for k in checks)}/4 checks satisfied** for seed {arg}. "
                f"Relative L2 error against float32: **{data['relative_l2_vs_float32']:.6f}**.\n\n"
                'This is actual CPU execution of the vendor software. No physical photonic or quantum processor was used, and no physical speed or energy advantage was measured.')
    elif name=='process':
        data=tools['predict_process'](arg,True)
        answer='The pinned MEOK process model returned these next-state proportions: **'+', '.join(f'{v:.6f}' for v in data['prediction'])+'**.\n\n'
        answer+='This is a prediction in the synthetic procurement task, not an observation, permission to act or a general world-model result. Its recorded worst-case error remains large.'
    else:raise ValueError('Unsupported tool')
    return answer,data

def send(message,image,provider,consent,allow_tools,state,engine,tools):
    if consent is not True:raise ValueError('Tick the consent box before sending inputs to this private workspace.')
    message=core.bounded(message,core.MAX_OBSERVATION,'Message')
    if provider not in core.PROVIDERS:raise ValueError('Choose an installed provider')
    state=state_copy(state);cmd=command_for(message,allow_tools)
    if cmd and image is not None:raise ValueError('Remove the image to run a text command, or switch off chat tools to discuss the image.')
    if cmd:
        answer,data=tool_result(cmd,state,tools);now=datetime.now(timezone.utc).isoformat()
        receipt={'schema':'meok.chat-tool-result/1','tool':cmd[0],'at':now,'input_sha256':hashlib.sha256(message.encode()).hexdigest(),
                 'output_sha256':hashlib.sha256(canonical(data)).hexdigest(),'authorises_execution':False,'signature':None,
                 'scope':'Records a read-only tool return, not independent correctness verification.'}
        state['turns']=(state['turns']+[{'role':'user','content':message},{'role':'assistant','content':'[Read-only tool result] '+answer}])[-12:]
        state['events']=(state['events']+[{'at':now,'stage':'CHAT_TOOL_RETURNED','tool':cmd[0],'output_sha256':receipt['output_sha256']}])[-32:]
        details={'kind':'READ_ONLY_TOOL_RESULT','tool':cmd[0],'output':data,'receipt':receipt};card=receipt
    else:
        state,answer,events,card,review=engine(GOAL,message,image,provider,True,state)
        details={'kind':'MODEL_RESPONSE','provider':provider,'events':events,'review':review,'context_limit_messages':12,'memory':'temporary session'}
        state=state_copy(state)
    state['chat_messages']=(state['chat_messages']+[{'role':'user','content':message+('\n\n*[An image was supplied for this turn.]*' if image is not None else '')},
                            {'role':'assistant','content':answer}])[-MAX_MESSAGES:]
    state['chat_version']=VERSION;state['chat_last_details']=details
    return state,state['chat_messages'],answer,details,card

def export_text(state):
    state=state_copy(state)
    body={'schema':'meok.chat-export/1','created_at':datetime.now(timezone.utc).isoformat(),'messages':state['chat_messages'],'images_included':False,
          'trust':'Conversation text only; no authority, verified evidence or training approval.'}
    body['content_sha256']=hashlib.sha256(canonical(body)).hexdigest()
    data=json.dumps(body,ensure_ascii=False,indent=2,allow_nan=False)
    if len(data.encode())>MAX_SNAPSHOT_BYTES:raise ValueError('Conversation exceeds export size bound')
    return data

def restore_text(text):
    if not isinstance(text,str) or len(text.encode())>MAX_SNAPSHOT_BYTES:raise ValueError('Conversation file exceeds 600,000 bytes')
    def reject(x):raise ValueError('Nonfinite JSON not accepted')
    def unique(pairs):
        d={}
        for k,v in pairs:
            if k in d:raise ValueError('Duplicate JSON key')
            d[k]=v
        return d
    obj=json.loads(text,parse_constant=reject,object_pairs_hook=unique)
    if not isinstance(obj,dict) or obj.get('schema')!='meok.chat-export/1':raise ValueError('Not a MEOK conversation export')
    body={k:v for k,v in obj.items() if k!='content_sha256'}
    if obj.get('content_sha256')!=hashlib.sha256(canonical(body)).hexdigest():raise ValueError('Conversation checksum does not match')
    messages=messages_checked(obj.get('messages'))
    if any(m['role']!=('user' if i%2==0 else 'assistant') for i,m in enumerate(messages)) or len(messages)%2:raise ValueError('Expected complete alternating user/assistant exchanges')
    state=core.fresh_session();state['chat_messages']=copy.deepcopy(messages);state['turns']=copy.deepcopy(messages[-12:]);state['chat_imported']=True;state['chat_version']=VERSION
    return state
