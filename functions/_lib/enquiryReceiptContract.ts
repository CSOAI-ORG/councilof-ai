/** Shared response contract. A stored enquiry is not delivery, review or paid execution. */
export interface EnquiryConfirmation {ok:true;stored:true;state:'STORED_READBACK_CONFIRMED';receipt_id:string;submission_id:string;received_at:string;email_sent:false;reviewed:false;work_started:false;reused:boolean}
export function isEnquiryConfirmation(value:unknown):value is EnquiryConfirmation{
 if(!value||typeof value!=='object'||Array.isArray(value))return false;
 const r=value as Record<string,unknown>;
 return r.ok===true&&r.stored===true&&r.state==='STORED_READBACK_CONFIRMED'&&typeof r.receipt_id==='string'&&/^[a-f0-9]{64}$/.test(r.receipt_id)&&typeof r.submission_id==='string'&&/^[a-f0-9-]{36}$/.test(r.submission_id)&&typeof r.received_at==='string'&&Number.isFinite(Date.parse(r.received_at))&&r.email_sent===false&&r.reviewed===false&&r.work_started===false&&typeof r.reused==='boolean';
}
