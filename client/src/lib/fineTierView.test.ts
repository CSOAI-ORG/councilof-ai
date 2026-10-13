import {describe,it,expect} from 'vitest';import {fineTierView} from './fineTierView';
describe('fine metadata is not a finding of liability or exemption',()=>{
 it.each([null,undefined,{}])('absence remains unrecorded: %s',v=>expect(fineTierView(v)).toEqual({state:'NOT_RECORDED',entries:[]}));
 it.each([false,0,'none',[],{a:null},{a:{statutory_maximum:'fixture maximum'}}])('incomplete record is uncheckable: %s',v=>expect(fineTierView(v).state).toBe('UNCHECKABLE'));
 it('preserves all cited text without inventing a value',()=>{const v={a:{statutory_maximum:'fixture, not a real fine',cited_to:'fixture source',applies_to:'fixture scope'}};expect(fineTierView(v)).toEqual({state:'RECORDED',entries:Object.entries(v)});});
 it('one malformed row cannot create a partial reassuring panel',()=>expect(fineTierView({good:{statutory_maximum:'fixture',cited_to:'fixture',applies_to:'fixture'},bad:{}}).state).toBe('UNCHECKABLE'));
});
