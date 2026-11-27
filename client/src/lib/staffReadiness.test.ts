import {describe,it,expect} from 'vitest';
import {staffStoreState,reportedStaffDid} from './staffReadiness';
describe('staff readiness registry',()=>{
 it('distinguishes unbound, reported binding and unknown',()=>{
   expect(staffStoreState({provisioned_store_bound:false})).toBe('UNBOUND');
   expect(staffStoreState({provisioned_store_bound:true})).toBe('BOUND_REPORTED');
   for(const v of [undefined,null,{},[],{provisioned_store_bound:'true'},{provisioned_store_bound:1}])expect(staffStoreState(v)).toBe('UNKNOWN');
 });
 it('never promotes a did shaped string without explicit signing state',()=>{
   const did='did:key:z6MksvqVuqPXddC3h1BEJ3WNXVfhMMnr3tpGMwoXikcPNqZb';
   expect(reportedStaffDid({did,signed:false})).toBe('');
   expect(reportedStaffDid({did})).toBe('');
   expect(reportedStaffDid({did,signed:'true'})).toBe('');
   expect(reportedStaffDid({did:'https://invalid.test',signed:true})).toBe('');
   expect(reportedStaffDid({did,signed:true})).toBe(did);
 });
});
