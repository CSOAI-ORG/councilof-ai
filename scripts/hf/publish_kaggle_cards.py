#!/usr/bin/env python3
"""Metadata-only publication with complete settings, conflict and file guards.

Uses the installed, qualified Kaggle SDK. No file upload, version creation,
repository creation or visibility change. Sequential, throttled; stop on error.
"""
import argparse
import json
import time
from pathlib import Path

SETTINGS = ('title','subtitle','description','isPrivate','keywords','licenses',
            'collaborators','data','expectedUpdateFrequency','userSpecifiedSources')


def settings(value):
    if any(k not in value for k in SETTINGS):
        raise ValueError('typed metadata with all settings and defaults is required')
    return {k:value[k] for k in SETTINGS}


def validate(before, current, proposed):
    if before.get('isPrivate') is not False or current.get('isPrivate') is not False:
        raise ValueError('public visibility required')
    if {k:v for k,v in settings(before).items() if k!='description'} != {k:v for k,v in settings(proposed).items() if k!='description'}:
        raise ValueError('only the description may change')
    if settings(current) == settings(proposed):
        return False
    if settings(current) != settings(before):
        raise ValueError('metadata changed since review; regenerate the preview')
    return True


def main():
    ap=argparse.ArgumentParser(description=__doc__)
    ap.add_argument('--preview',type=Path,required=True)
    ap.add_argument('--publish',action='store_true')
    a=ap.parse_args()
    from kaggle.api.kaggle_api_extended import KaggleApi
    from kagglesdk.datasets.types.dataset_api_service import ApiGetDatasetMetadataRequest
    api=KaggleApi();api.authenticate()
    def metadata(ref):
        time.sleep(2)
        req=ApiGetDatasetMetadataRequest();req.owner_slug,req.dataset_slug=ref.split('/',1)
        with api.build_kaggle_client() as client:
            response=client.datasets.dataset_api_client.get_dataset_metadata(req)
        return json.loads(response.to_json(ignore_defaults=False))['info']
    def files(ref):
        result=[];token=None
        while True:
            time.sleep(2)
            page=api.dataset_list_files(ref,page_token=token,page_size=200)
            result.extend(dict(name=f.name,bytes=f.total_bytes) for f in page.files)
            token=page.next_page_token
            if not token:return sorted(result,key=lambda f:f['name'])
    for entry in json.loads((a.preview/'manifest.json').read_text()):
        if entry['status']!='PREVIEW':continue
        folder=a.preview/entry['folder'];ref=entry['ref']
        before=json.loads((folder/'before.json').read_text())
        proposed=json.loads((folder/'dataset-metadata.json').read_text())
        current=metadata(ref);changed=validate(before['metadata'],current,proposed)
        record=dict(ref=ref,status='PREVIEW',changed=changed)
        if a.publish and changed:
            time.sleep(2)
            api.dataset_metadata_update(ref,str(folder))
            record['status']='UPDATED_PENDING_VERIFICATION'
            with (a.preview/'publication-receipt.jsonl').open('a') as f:f.write(json.dumps(record)+'\n')
            after=metadata(ref)
            if settings(after)!=settings(proposed):raise ValueError(f'{ref}: metadata readback differs')
            if files(ref)!=sorted(before['files'],key=lambda f:f['name']):raise ValueError(f'{ref}: file inventory changed')
            record.update(status='PUBLISHED_VERIFIED',unchanged_files=len(before['files']),usability=after.get('usabilityRating'))
        elif a.publish:
            if files(ref)!=sorted(before['files'],key=lambda f:f['name']):raise ValueError(f'{ref}: file inventory changed')
            record.update(status='ALREADY_PRESENT_VERIFIED',unchanged_files=len(before['files']))
        with (a.preview/'publication-receipt.jsonl').open('a') as f:f.write(json.dumps(record)+'\n')
        print(json.dumps(record),flush=True)


if __name__=='__main__':main()
