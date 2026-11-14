import {CONTROL_MAP_VERSION,controlsForLens} from '@/data/gspcControlMap';
export default function ControlEvidencePanel({lens}:{lens:string}){
 const controls=controlsForLens(lens);if(!controls.length)return null;
 return <details className="mt-3 rounded-xl border border-slate-200 p-4" data-testid="control-evidence-map">
 <summary className="min-h-[44px] cursor-pointer font-bold">Requirements and evidence plan · {controls.length} mapped references</summary>
 <p className="my-3 text-sm text-slate-700">CSOAI mapping {CONTROL_MAP_VERSION}. Partial, versioned evidence plan—not an official crosswalk, legal advice, applicability decision or compliance result. NIST 1.0 is under revision; the EU source identifies the published 2024 text. A qualified reviewer must check current amendments, dates, role and deployment context.</p>
 <div className="space-y-3">{controls.map(c=><article key={c.id} className="rounded-lg border border-slate-200 p-3"><h3 className="font-semibold">{c.id} · {c.title}</h3><p className="mt-1 text-xs">{c.scope}</p><p className="mt-2 text-sm"><strong>Evidence required: </strong>{c.requiredEvidence.join('; ')}.</p><p className="mt-2 text-sm">{c.evaluation}</p><p className="mt-1 text-xs font-semibold">NOT ASSESSED · no organisation supplied evidence to this map.</p><div className="mt-2 flex flex-wrap gap-2"><a className="inline-flex min-h-[44px] items-center px-2 text-sm font-semibold text-emerald-800 underline" href={c.source}>Requirement source</a>{c.axes.map(a=><a key={a} className="inline-flex min-h-[44px] items-center px-2 text-sm text-emerald-800 underline" href={`/gspc/${a}`}>{a} instrument</a>)}</div></article>)}</div>
 </details>;
}
