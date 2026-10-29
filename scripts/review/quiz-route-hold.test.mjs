import {test} from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';
const app=readFileSync(new URL('../../client/src/App.tsx',import.meta.url),'utf8');
test('type and scoring repairs do not reactivate retired course or regulator journeys',()=>{
 for(const path of ['/free-course/:courseId','/courses/:id/learn','/regulator/:id'])assert.ok(app.includes(`<Route path="${path}" component={ContentReviewNotice} />`),path);
 assert.ok(!app.includes('ui-polish-fixture'));
});
