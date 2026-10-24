"""Document the existing enquiry handlers from their declared field limits; no new endpoint."""
import hashlib,re
from pathlib import Path

def apply_enquiry_contract(spec,repo:Path):
    source=(repo/'functions/_lib/enquiryReceipt.ts').read_text()
    declaration=re.search(r"const limits:Record<string,number>=kind==='contact'\?\{([^}]+)\}:\{([^}]+)\};",source)
    maximum=re.search(r'const MAX_BYTES=([0-9_]+);',source)
    if not declaration or not maximum:raise ValueError('Enquiry input contract changed; update its reviewed documentation')
    limit=int(maximum.group(1).replace('_',''))
    ack={'type':'object','required':['ok','stored','state','receipt_id','submission_id','received_at','reused','email_sent','reviewed','work_started'],'properties':{'ok':{'const':True},'stored':{'const':True},'state':{'const':'STORED_READBACK_CONFIRMED'},'receipt_id':{'type':'string','pattern':'^[a-f0-9]{64}$'},'submission_id':{'type':'string','format':'uuid'},'received_at':{'type':'string','format':'date-time'},'reused':{'type':'boolean'},'email_sent':{'const':False},'reviewed':{'const':False},'work_started':{'const':False},'limits':{'type':'string'}}}
    for kind,part in zip(('contact','lead'),declaration.groups()):
        path='/api/'+kind
        if path not in spec['paths'] or 'post' not in spec['paths'][path]:raise ValueError('Existing enquiry route missing')
        fields=dict((k,int(v)) for k,v in re.findall(r'(\w+):(\d+)',part))
        if ','.join(f'{k}:{v}' for k,v in fields.items())!=part:raise ValueError('Unrecognised field limit expression')
        properties={k:{'type':'string','maxLength':v} for k,v in fields.items()}
        properties['email']['format']='email'
        properties['submission_id']={'type':'string','format':'uuid','description':'Retain this caller-generated UUID and the exact request content when retrying after an uncertain response. Omission generates an ID but cannot deduplicate a retry that lost the response entirely.'}
        if kind=='lead':properties['result_id']['description']='Alias of report_id; when both are supplied they must agree. Retained caller context, not a verified report or new assessment.'
        op=spec['paths'][path]['post'];op['requestBody']={'required':True,'content':{'application/json':{'schema':{'type':'object','additionalProperties':False,'required':['email','message'] if kind=='contact' else ['email'],'properties':properties}}}}
        op['description']='Record an enquiry in the existing private store. A success is returned only after exact readback or retrieval of the same retained record. No email, review, booking, payment or model evaluation is performed. If receipt storage is unconfirmed, preserve the message and retry the unchanged submission identity; do not assume it was lost or pay again. Global durability and exactly-once processing are not established.'
        op['x-csoai-enquiry']={'request_body_max_bytes':limit,'same_origin_required_when_origin_header_present':True,'missing_origin_authenticates_caller':False,'global_exactly_once':False,'source_sha256':hashlib.sha256(source.encode()).hexdigest()}
        op['responses']={str(code):{'description':description,'content':{'application/json':{'schema':ack if code in (200,201) else {'type':'object','required':['ok','stored','state','email_sent'],'properties':{'ok':{'const':False},'stored':{'type':['boolean','null'],'description':'False for requests not stored; null when persistence is uncertain.'},'state':{'type':'string'},'email_sent':{'const':False},'receipt_id':{'type':['string','null']},'submission_id':{'type':['string','null']}}}}}} for code,description in [(200,'Same stored enquiry read back; reused is true.'),(201,'New enquiry stored and read back; not reviewed or emailed.'),(400,'Malformed, unsupported or conflicting input fields; no write.'),(403,'Cross-origin browser submission rejected.'),(409,'Conflicting or unreadable record already exists; not overwritten.'),(413,'Input exceeds the declared byte or content-length bound.'),(503,'Storage unavailable or persistence unconfirmed. Keep the message and identifiers.') ]}
    diagnostic=spec['paths']['/api/lead'].get('get')
    if diagnostic is not None:diagnostic['responses']={'200':{'description':'Binding shape only. Does not query or list private records or demonstrate global storage health.','content':{'application/json':{'schema':{'type':'object','additionalProperties':False,'required':['bound','state','records_exposed'],'properties':{'bound':{'type':'boolean'},'state':{'const':'CONFIGURATION_ONLY_NOT_STORAGE_OR_DELIVERY_PROOF'},'records_exposed':{'const':False}}}}}}}
    return spec
