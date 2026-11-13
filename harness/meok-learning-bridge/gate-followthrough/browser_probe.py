"""Real rendered browser check of synthetic Academy UI; token stays host-bound."""
import os,json,time,re,urllib.request,urllib.parse,base64,hashlib,sys
from datetime import datetime,timezone
from playwright.sync_api import sync_playwright,expect
TOKEN=os.environ['HF_TOKEN'];REPO='Nicholastempleman/meok-hf-runtime';EXPECTED=os.environ['EXPECTED_SPACE_SHA']
class NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self,*a,**k):return None
opener=urllib.request.build_opener(NoRedirect)
def meta():
    req=urllib.request.Request('https://huggingface.co/api/spaces/'+REPO,headers={'Authorization':'Bearer '+TOKEN})
    with opener.open(req,timeout=20) as r:return json.load(r)
record={'state':'STARTING','revision':EXPECTED,'started_at':datetime.now(timezone.utc).isoformat(),'browser':'Chromium via Playwright 1.64.1','checks':[],'model_calls_requested':0,'real_learner_count':0};shot=None
try:
    m=meta();assert m['sha']==EXPECTED and m['private'] and m['runtime']['sha']==EXPECTED
    origin=m['host'];target=urllib.parse.urlsplit(origin).netloc
    with sync_playwright() as p:
        browser=p.chromium.launch(headless=True,args=['--disable-dev-shm-usage'])
        context=browser.new_context(viewport={'width':1440,'height':1050},service_workers='block')
        def intercept(route):
            # Never use context-wide auth headers: third-party fonts/CDNs get no credential.
            headers={k:v for k,v in route.request.headers.items() if k.lower()!='authorization'}
            u=urllib.parse.urlsplit(route.request.url)
            if u.scheme=='https' and u.netloc==target:headers['Authorization']='Bearer '+TOKEN
            route.continue_(headers=headers)
        context.route('**/*',intercept)
        page=context.new_page();page.set_default_timeout(20000)
        response=page.goto(origin+'/',wait_until='domcontentloaded',timeout=60000)
        assert urllib.parse.urlsplit(page.url).netloc==target,'Unexpected login/redirect origin'
        assert response and response.status==200
        record['checks'].append('private_page_loaded_on_expected_origin')
        accordion=page.get_by_text('MEOK laboratory · models, geometry, compact records and GSPC',exact=True)
        accordion.click();page.get_by_role('tab',name='Academy and human-review practice',exact=True).click()
        page.get_by_role('button',name='Read exercise and bind its revision',exact=True).click()
        revision=page.get_by_label('Displayed scoped lesson revision',exact=True)
        expect(revision).to_have_value(re.compile(r'^lesson-v1:[0-9a-f]{64}$'),timeout=30000)
        token=revision.input_value();record['checks'].append('rendered_lesson_bound_to_scoped_revision')
        page.get_by_role('radio',name='D',exact=True).first.check()
        page.get_by_role('button',name='Check this exercise attempt',exact=True).click()
        page.wait_for_function("document.body.innerText.includes('SCOPED_LESSON') && document.body.innerText.includes('THIS_ATTEMPT_ONLY_NOT_CUMULATIVE_ORB_RANK')",timeout=30000)
        def feedback():
            for text in page.locator('.cm-content').all_text_contents():
                if 'THIS_ATTEMPT_ONLY_NOT_CUMULATIVE_ORB_RANK' in text:
                    try:return json.loads(text)
                    except json.JSONDecodeError:pass
            raise ValueError('Rendered feedback JSON not found')
        out=feedback();assert out['educational_xp']==10 and out['binding_kind']=='SCOPED_LESSON' and not any(out['boundaries'].values())
        record['checks'].append('correct_rendered_feedback_10_points_no_authority')
        page.get_by_role('button',name='Check this exercise attempt',exact=True).click();page.wait_for_timeout(1500)
        assert feedback()['educational_xp']==10;record['checks'].append('repeat_does_not_accumulate_rank')
        shot=page.screenshot(full_page=False)
        dropdown=page.get_by_label('Original synthetic exercise',exact=True)
        dropdown.click();page.get_by_role('option',name='Acknowledging a stop request is not observing a stop',exact=True).click()
        expect(revision).to_have_value('');record['checks'].append('changed_exercise_clears_revision_binding')
        page.get_by_role('button',name='Check this exercise attempt',exact=True).click()
        page.get_by_text('Stale or missing lesson revision; reopen the lesson before submitting',exact=False).wait_for(timeout=15000)
        record['checks'].append('unbound_attempt_visibly_refused')
        page.get_by_role('button',name='Read exercise and bind its revision',exact=True).click();expect(revision).to_have_value(re.compile('^lesson-v1:'),timeout=20000)
        question=page.get_by_label('Exercise and answer choices',exact=True).input_value();assert 'execution state unconfirmed' in question
        record['checks'].append('new_monitoring_case_renders')
        record['horizontal_document_overflow']=page.evaluate('document.documentElement.scrollWidth > window.innerWidth + 2')
        assert not record['horizontal_document_overflow']
        browser.close()
    after=meta();assert after['sha']==EXPECTED and after['runtime']['sha']==EXPECTED
    record.update(state='LIVE_RENDERED_ACADEMY_ACCEPTANCE_PASSED',source_before_after_equal=True)
except Exception as e:
    record.update(state='BROWSER_ACCEPTANCE_INCOMPLETE',error_type=type(e).__name__,error=str(e)[:400])
finally:
    record['finished_at']=datetime.now(timezone.utc).isoformat()
    if shot is not None:record['screenshot_sha256']=hashlib.sha256(shot).hexdigest();record['screenshot_bytes']=len(shot)
    assert TOKEN not in json.dumps(record)
    print('BROWSER_REPORT_JSON='+json.dumps(record),flush=True)
    if shot is not None:
        txt=base64.b64encode(shot).decode()
        for offset in range(0,len(txt),7000):print('BROWSER_SCREENSHOT_CHUNK='+str(offset//7000)+':'+txt[offset:offset+7000],flush=True)
    if record['state']!='LIVE_RENDERED_ACADEMY_ACCEPTANCE_PASSED':sys.exit(1)
