import { describe, expect, it } from 'vitest';
import { createHash } from 'node:crypto';
import { isResearchQuery, researchRead } from './researchRead.mjs';
import INDEX from './research-publication-index.json';
import { routeIntent, talk } from './talkRouter';
import { routerReadResult } from './talkReads';

const question = 'Find the latest research evidence on Memory Venturi and source revision changes';
const clone = () => JSON.parse(JSON.stringify(INDEX));

describe('public research user journey', () => {
  it('routes the previously unmatched real question', () => {
    expect(routeIntent(question)).toEqual({kind:'tools',intent:'search retained public research',calls:[{tool:'research_evidence_search',args:{query:question}}]});
  });
  it('completes the real in-process talk path with source-linked notes', async () => {
    const answer = await talk(question, 'https://councilof.ai');
    expect(answer.tool_calls).toHaveLength(1);
    expect(answer.tool_calls[0].tool).toBe('research_evidence_search');
    expect(answer.tool_calls[0].paid).toBe(false);
    expect(answer.label).toBe('RETAINED_PUBLIC_RESEARCH');
    expect(answer.answer).toContain('Measured reuse: refresh and retain');
    expect(answer.answer).toContain(INDEX.source_revision);
    expect(answer.answer).toContain('not an exhaustive or live search');
    expect(answer.citations[0].url).toMatch(/^https:\/\/github.com\/CSOAI-ORG\/councilof-ai\/blob\//);
  });
  it('keeps existing board routing', () => expect(routeIntent('What does the leaderboard show?')).toMatchObject({calls:[{tool:'board_totals'}]}));
  it('keeps actual paid requests behind the existing payment route', () => expect(routeIntent('commission a card for https://example.com/mcp research')).toMatchObject({calls:[{tool:'commission_card'}]}));
  it('keeps explicit endpoint questions ahead of research keywords', () => expect(routeIntent('research evidence for https://example.com/mcp')).toMatchObject({calls:[{tool:'server_evidence'}]}));
  it('does not turn ordinary English eat into research', () => expect(isResearchQuery('What should I eat?')).toBe(false));
  it('finds research in the established reader dispatcher', async () => {
    const result = await routerReadResult('research_evidence_search',{query:'Memory Venturi'},'https://councilof.ai');
    expect(result.isError).toBe(false);
    expect(result.structuredContent.results.length).toBeGreaterThan(0);
  });
});

describe('public research source and refusal contract', () => {
  it('keeps internal aliases out of the served publication data', () => expect(JSON.stringify(INDEX)).not.toMatch(/\b(venturi|sovos|sov6|owem)\b/i));
  it('all bundled excerpts match their recorded bytes', () => {
    for (const row of INDEX.records) expect(createHash('sha256').update(row.text).digest('hex')).toBe(row.text_sha256);
  });
  it('returns at most three real pinned records', async () => {
    const result = await researchRead(INDEX,{query:question});
    expect(result.results.length).toBeGreaterThan(0);
    expect(result.results.length).toBeLessThanOrEqual(3);
    for (const row of result.results) expect(INDEX.records.some(x => x.url===row.url && x.source_sha256===row.source_sha256)).toBe(true);
    expect(result.grants_authority).toBe(false);
    expect(result.model_called).toBe(false);
    expect(result.new_measurement).toBe(false);
    expect(result.signature_verification).toBe('NOT_RUN');
  });
  it('never claims an exhaustive latest result', async () => {
    const result = await researchRead(INDEX,{query:'latest research Memory Venturi'});
    expect(result.note).toContain('not an exhaustive or live search');
    expect(result).not.toHaveProperty('measured_at');
    expect(result).not.toHaveProperty('accuracy');
  });
  it('does not manufacture an unknown result', async () => expect((await researchRead(INDEX,{query:'zzqxvnotinrecords'})).state).toBe('NO_RETAINED_MATCH'));
  it('asks for a topic rather than pretending an empty query is evidence', async () => expect((await researchRead(INDEX,{query:'find the latest research evidence'})).state).toBe('NEEDS_TOPIC'));
  it('refuses changed bytes', async () => {
    const index=clone();index.records[0].text+=' changed';
    expect((await researchRead(index,{query:'memory'})).state).toBe('UNCHECKABLE');
  });
  it('refuses an arbitrary external source URL', async () => {
    const index=clone();index.records[0].url='https://evil.example/source';
    expect((await researchRead(index,{query:'memory'})).state).toBe('UNCHECKABLE');
  });
  it('refuses private or traversal paths', async () => {
    for (const path of ['private/secret.md','harness/../private/secret.md']) {
      const index=clone();index.records[0].path=path;
      expect((await researchRead(index,{query:'memory'})).state).toBe('UNCHECKABLE');
    }
  });
  it('refuses duplicate rows', async () => {
    const index=clone();index.records.push(index.records[0]);
    expect((await researchRead(index,{query:'memory'})).state).toBe('UNCHECKABLE');
  });
  it('refuses invalid or extra query arguments', async () => {
    for (const args of [null,[],{query:''},{query:'x'.repeat(1001)},{query:'memory',url:'https://evil.example'},{query:'memory',x_payment:'fake'}]) expect((await researchRead(INDEX,args)).state).toBe('INVALID_QUERY');
  });
  it('treats query text as literal data', async () => {
    const result=await researchRead(INDEX,{query:'Memory Venturi $(touch /tmp/not-created)'});
    expect(result.state).toBe('RETAINED_PUBLIC_RESEARCH');
    expect(result.grants_authority).toBe(false);
  });
});
