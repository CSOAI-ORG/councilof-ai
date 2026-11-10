"""One additive tab in the existing research workspace; no new application or account."""
import gradio as gr
from learning_bridge import _data
from learning_tools import academy_catalogue,academy_lesson,academy_reading,academy_attempt,academy_correction,question_view

def mount_learning_tab(json_tool):
    registry,cases,_=_data()
    with gr.Tab('Academy and human-review practice'):
        gr.Markdown('**34 dated axis paths; synthetic practice, not professional qualification.** This reuses the Council five-stage paths and reading checks. Proposed industry contexts are not industry validations. No named reviewer is contacted, no public HITL completion is written, and points never grant tool or training authority.')
        with gr.Row():
            axis=gr.Dropdown([r['axis'] for r in registry['rows']],value='claim-maintenance',label='Canonical GSPC axis')
            industry=gr.Dropdown([(p['title'],pid) for pid,p in registry['industry_profiles'].items()],value='ai-software',label='Proposed educational context')
        case=gr.Dropdown([(c['title'],c['id']) for c in cases],value='xp-not-authority',label='Original synthetic exercise')
        question=gr.Textbox(label='Exercise and answer choices',lines=13,interactive=False)
        revision=gr.Textbox(label='Displayed scoped lesson revision',interactive=False,value='')
        packet=gr.Code(language='json',label='Original path, source-reading check and limits',interactive=False)
        def show(a,i,c):
            try:return question_view(a,i,c)
            except ValueError as exc:raise gr.Error(str(exc)) from None
        gr.Button('Read exercise and bind its revision',variant='primary').click(show,[axis,industry,case],[question,revision,packet],api_name=False)
        def clear_binding(*_):return '', '', '{}'
        for control in [axis,industry,case]:control.change(clear_binding,[],[question,revision,packet],api_name=False)
        with gr.Row():
            answer=gr.Radio(['A','B','C','D'],value=None,label='Your exercise answer')
            read_answer=gr.Radio(['A','B','C','D'],value=None,label='Source-reading answer from the original module above')
        feedback=gr.Code(language='json',label='Practice feedback and unsigned execution record',interactive=False)
        gr.Button('Check this exercise attempt').click(json_tool(academy_attempt),[axis,industry,case,answer,revision],feedback,api_name='academy_attempt')
        gr.Button('Check original source-reading answer').click(json_tool(academy_reading),[axis,industry,read_answer,revision],feedback,api_name='academy_reading')
        gr.Markdown('Each correct distinct exercise can display 10 practice points. This panel checks one attempt at a time: points are not added across clicks, no ORB rank is awarded, and no progress is retained after reconnect. The five existing ORB datasets remain separate and unchanged. Use the non-game source-reading route without points.')
        with gr.Accordion('Coverage, corrections, SAFE and service boundaries',open=False):
            catalogue=gr.Code(language='json',label='Full dated roster and proposed industry mapping',interactive=False)
            gr.Button('Inspect all paths and existing MOOC references').click(json_tool(academy_catalogue),[],catalogue,api_name='academy_catalogue')
            gr.Button('Inspect selected lesson via API').click(json_tool(academy_lesson),[axis,industry],catalogue,api_name='academy_lesson')
            gr.Button('Rehearse a source correction').click(json_tool(academy_correction),[axis,industry],catalogue,api_name='academy_correction')
            gr.Markdown('Human review remains **not sent** without a named authenticated receiver and scope. SAFE references are a local research crosswalk, not endorsement or automatic incident disclosure. RAS follow-up remains an unsent scoped request; no purchase, payment, fresh measurement or model update is triggered.')
