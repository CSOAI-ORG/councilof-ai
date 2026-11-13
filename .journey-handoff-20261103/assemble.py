from pathlib import Path
import shutil,hashlib,json,subprocess
s=Path(__file__).resolve().parent
c=s/'candidate'; b=s/'base';shutil.copytree(b,c,dirs_exist_ok=True)
def edit(path,*rules):
 p=c/path; t=p.read_text()
 for old,new in rules:
  assert t.count(old)==1,(path,old[:90],t.count(old)); t=t.replace(old,new)
 p.write_text(t)
card=(s/'card.json').read_bytes();assert hashlib.sha256(card).hexdigest()=='41c2959f4b7d7149e348c48391721e4e3ea450fa59c620d56f74dd2685aea318'
lib='client/src/lib/'; page='client/src/pages/GSPCVerify.tsx';p=c/(lib+'fixtures/governance-e9bc92b7.json.txt');p.parent.mkdir(exist_ok=True,parents=True);p.write_bytes(card)
edit(lib+'publicCardExample.ts',('import { CARD_PARAM_MAX_BYTES', 'import governanceExample from "./fixtures/governance-e9bc92b7.json.txt?raw";\nimport { CARD_PARAM_MAX_BYTES'),('): Promise<{ raw: string; href: string }> {','): Promise<{ raw: string; href: string; file: Blob }> {'),('  const response = await fetchImpl(source.url, {','''  // This deliberately historical teaching specimen is shipped byte-for-byte.
  // The live publication may move to a mirror. Do not follow an arbitrary
  // redirect for user input, or present a saved specimen as a new observation.
  if (new URL(source.url).pathname === GOVERNANCE_RETRIEVE) {
    return { raw: governanceExample, href: source.href, file: new Blob([governanceExample], {type: "application/json"}) };
  }
  const response = await fetchImpl(source.url, {'''),('    raw: new TextDecoder().decode(bytes),','    raw: new TextDecoder("utf-8", {fatal: true}).decode(bytes),\n    file: new Blob([bytes], {type: "application/json"}),'))
edit(lib+'publicCardExample.test.ts',('import { describe,','import { createHash } from "node:crypto";\nimport { describe,'),('      raw,\n      href: verifyCardHref','      raw, file: expect.any(Blob),\n      href: verifyCardHref'),('  it("does not fetch pasted private JSON",','''  it("loads the original historical governance specimen without following a mirror redirect", async () => {
    const { mock, fetchImpl } = fakeFetch(new Response("changed upstream bytes", {status: 503}));
    const item = await loadPublicCardExample(GOVERNANCE_RETRIEVE, ORIGIN, new AbortController().signal, fetchImpl);
    expect(mock).not.toHaveBeenCalled();
    const bytes = new Uint8Array(await item.file.arrayBuffer());
    expect(createHash("sha256").update(bytes).digest("hex")).toBe("41c2959f4b7d7149e348c48391721e4e3ea450fa59c620d56f74dd2685aea318");
    expect(await item.file.text()).toBe(item.raw);
    expect(JSON.parse(item.raw).id).toBe("e9bc92b7b39be3dda65573dc571fd5fd544d17aab7b875783f78f082234ee294");
    expect(item.href).toBe(verifyCardHref(ORIGIN+GOVERNANCE_RETRIEVE));
  });

  it("keeps the source bytes even when text decoding strips a BOM", async () => {
    const data = new Uint8Array([239,187,191,123,125,10]);
    const { fetchImpl } = fakeFetch(new Response(data));
    const item = await loadPublicCardExample(CARD, ORIGIN, new AbortController().signal, fetchImpl);
    expect(item.raw).toBe("{}\\n");
    expect(new Uint8Array(await item.file.arrayBuffer())).toEqual(data);
  });

  it("does not fetch pasted private JSON",'''))
edit(page,('export function LinkedCardActions({ href }: { href: string }) {','''function DownloadRecord({ file, name }: { file: Blob; name: string }) {
  const [failed, setFailed] = useState(false);
  const save = () => {
    let url: string | undefined;
    let a: HTMLAnchorElement | undefined;
    try {
      url = URL.createObjectURL(file);
      a = document.createElement("a"); a.href = url; a.download = name;
      document.body.appendChild(a); a.click(); setFailed(false);
    } catch { setFailed(true); }
    finally { a?.remove(); if (url) { const captured = url; setTimeout(() => URL.revokeObjectURL(captured), 30_000); } }
  };
  return <><button type="button" data-testid="linked-download" onClick={save}
    className="inline-flex min-h-[44px] items-center rounded-lg border border-emerald-400/40 px-3 py-2 font-semibold text-emerald-100 hover:bg-white/5">Save loaded JSON</button>
    {failed && <span role="alert">Download unavailable. Your record is still in the box.</span>}</>;
}

export function LinkedCardActions({ href, file }: { href: string; file: Blob }) {'''),('<a className={btn} href={href} download={name} data-testid="linked-download">Download the record</a>','<DownloadRecord file={file} name={name} />'),('| { state: "loading" | "loaded"; href: string; bytes?: number; sha256?: string }','| { state: "loading"; href: string }\n    | { state: "loaded"; href: string; bytes: number; sha256?: string; file: Blob }'),('const [publicReopenHref, setPublicReopenHref] = useState<string | null>(null);','const [publicExample, setPublicExample] = useState<{ href: string; file: Blob } | null>(null);'),('    setPublicReopenHref(null);','    setPublicExample(null);'),('const raw = new TextDecoder().decode(buf);','const raw = new TextDecoder("utf-8", {fatal: true}).decode(buf);'),('bytes: buf.byteLength, sha256: digest });','bytes: buf.byteLength, sha256: digest, file: new Blob([buf], {type: "application/json"}) });'),('setPublicReopenHref(example.href);','setPublicExample({href: example.href, file: example.file});'),('Each loads one published card into the box, unaltered. Both are free.','The first button reads a published card. The governance example is a fixed historical record, not a new measurement. Both are free.'),('{publicReopenHref && (','{publicExample && ('),('href={publicReopenHref}', 'href={publicExample.href}'),('in a new tab. Share that tab&apos;s address to let someone check the published record again.','in a new tab to check the current publication, or keep exactly what was loaded here. {" "}\n              <DownloadRecord file={publicExample.file} name="gspc-measurement-card.json" />'),('<LinkedCardActions href={linked.href} />','<LinkedCardActions href={linked.href} file={linked.file} />'),('Linked record loaded unaltered and checked below.','Linked record loaded. Read the verification result below.'))
edit('client/src/pages/GSPCVerify.deeplink.test.tsx',('<LinkedCardActions href={href} />','<LinkedCardActions href={href} file={new Blob(["{}"])} />'),('offers copy, download of the exact URL, and verify again','offers copy, save from captured bytes rather than a second fetch, and verify again'),('    expect(html).toMatch(new RegExp(`<a[^>]*href="${href}"[^>]*download="example.json"`));','    expect(html).toContain(\'data-testid="linked-download"\');\n    expect(html).toContain("Save loaded JSON");\n    expect(html).not.toContain(`href="${href}" download=`);'))
print('created files',len([p for p in c.rglob('*') if p.is_file()]))
