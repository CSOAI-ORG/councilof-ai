"""Prepare an owner-review patch from the exact installed UI; never deploy it.

Usage: python prepare_ui_candidate.py /path/to/original/memory_ui.py /new/candidate
Only the named original is read. The output directory must not already exist.
The memory_readiness.py file alongside this helper is added to the new directory.
"""
import ast
import difflib
import hashlib
import json
from pathlib import Path
import shutil
import sys

BASELINE_SHA256='f4f2db5f5e03937ede2157183a1bc61e391a19c977fc633f957f0ebd7c14a7f8'


def replace_once(source, old, new):
    if source.count(old)!=1:raise ValueError('PATCH_CONTEXT_MISMATCH')
    return source.replace(old,new)


def build(source):
    s=replace_once(source,'from memory_store import MemoryService, MemoryStoreError\n',
        'from memory_store import MemoryService, MemoryStoreError\nfrom memory_readiness import assess_storage\n')
    s=replace_once(s,'def create_controls():\n',
        'def create_controls():\n    readiness = assess_storage()\n    available = readiness["can_attempt"]\n')
    s=replace_once(s,'"Optionally keep a text snapshot in this private workspace and restore it "',
        '"When private storage is available, optionally keep a text snapshot and restore it "')
    s=replace_once(s,'"Copies are available to your verified Hugging Face account and workspace "',
        '"Saved copies are scoped to your verified Hugging Face account and workspace "')
    s=replace_once(s,'opt_in = gr.Checkbox(value=False, label="Save this conversation text in the private workspace.")',
        'opt_in = gr.Checkbox(value=False, interactive=available, label="Save this conversation text in the private workspace.")')
    for var,label in [('save','Save a copy'),('refresh','List my saved copies'),('restore','Restore selected copy'),('remove','Remove selected saved copy')]:
        s=replace_once(s,f'{var} = gr.Button("{label}")',f'{var} = gr.Button("{label}", interactive=available)')
    old='''    status = gr.Markdown(
        "Sign in to use saved copies. If sign-in or persistent storage is unavailable, "
        "you can still chat and export on your device."
    )
'''
    s=replace_once(s,old,'''    availability = gr.Button("Check saved-copy availability")
    status = gr.Markdown(readiness["message"])
''')
    s=replace_once(s,'status=status, receipt=receipt)',
        'status=status, receipt=receipt, availability=availability)')
    marker='    common = dict(api_visibility="undocumented", concurrency_limit=1,\n'
    addition='''    def refresh_availability():
        # A current configuration hint, never account identity or permission.
        readiness = assess_storage()
        available = readiness["can_attempt"]
        return (gr.Button(interactive=available), gr.Button(interactive=available),
                gr.Button(interactive=available), gr.Button(interactive=available),
                gr.Checkbox(value=False, interactive=available),
                gr.Dropdown(choices=[], value=None), readiness["message"],
                dict(operation="readiness", **readiness))

    controls["availability"].click(
        refresh_availability, [],
        [controls[name] for name in ("save", "refresh", "restore", "remove",
                                     "opt_in", "selection", "status", "receipt")],
        queue=False, api_name="memory_readiness", api_visibility="undocumented")

'''
    s=replace_once(s,marker,addition+marker)
    s=replace_once(s,'remove=remove_copy, clear=clear_saved_view, components=controls)',
        'remove=remove_copy, clear=clear_saved_view, availability=refresh_availability, components=controls)')
    # Authentication and store operations must stay byte-for-byte semantically intact.
    before={n.name:ast.dump(n,include_attributes=False) for n in ast.walk(ast.parse(source)) if isinstance(n,ast.FunctionDef)}
    after={n.name:ast.dump(n,include_attributes=False) for n in ast.walk(ast.parse(s)) if isinstance(n,ast.FunctionDef)}
    protected=('save_copy','list_copies','restore_copy','remove_copy','clear_saved_view','_refused','_label','bind_clear_events')
    if any(before[n]!=after[n] for n in protected):raise ValueError('PROTECTED_FUNCTION_CHANGED')
    return s,protected


def main():
    original=Path(sys.argv[1]);output=Path(sys.argv[2])
    raw=original.read_bytes()
    if hashlib.sha256(raw).hexdigest()!=BASELINE_SHA256:raise ValueError('BASELINE_HASH_MISMATCH')
    source=raw.decode('utf-8');candidate,protected=build(source)
    if output.exists():raise ValueError('OUTPUT_EXISTS')
    if output.resolve().is_relative_to(original.resolve().parent):raise ValueError('OUTPUT_INSIDE_BASELINE_DIRECTORY')
    output.mkdir(parents=True)
    (output/'memory_ui.py').write_text(candidate)
    gate=Path(__file__).with_name('memory_readiness.py')
    shutil.copyfile(gate,output/'memory_readiness.py')
    diff=''.join(difflib.unified_diff(source.splitlines(True),candidate.splitlines(True),
        fromfile='a/scripts/hf-meok/memory_ui.py',tofile='b/scripts/hf-meok/memory_ui.py'))
    (output/'memory_ui.patch').write_text(diff)
    receipt={'baseline_ui_sha256':BASELINE_SHA256,
        'candidate_ui_sha256':hashlib.sha256(candidate.encode()).hexdigest(),
        'readiness_module_sha256':hashlib.sha256(gate.read_bytes()).hexdigest(),
        'protected_functions_unchanged':list(protected),
        'syntax_valid':True,'runtime_import_tests':'NOT_RUN_BY_THIS_HELPER',
        'deployed':False,'source_original_unchanged':original.read_bytes()==raw}
    (output/'preparation.json').write_text(json.dumps(receipt,indent=2)+'\n')
    print(json.dumps(receipt,indent=2))

if __name__=='__main__':main()
