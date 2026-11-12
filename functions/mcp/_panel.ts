/** Native MCP Apps view for existing tools. No extra tool, authority or catalog count. */
import type { McpServer, Tool } from '@modelcontextprotocol/server';
import RESOURCE from '../../public/native-panel/resource.json';
export const PANEL_URI = 'ui://council/live-panel/2';
const PRESENTED = new Set(['board_totals', 'get_axis', 'verify_card', 'server_evidence']);
export function withCouncilPanel<T extends Tool>(definition: T): T {
  if (!PRESENTED.has(definition.name)) return definition;
  return { ...definition, ...(definition.name === 'board_totals' ? { title: 'Council of AI · MEOK companion' } : {}), _meta: {
    ...definition._meta,
    ui: { resourceUri: PANEL_URI },
    ...(definition.name === 'board_totals' ? { 'openai/ui': { entrypoints: [{ type: 'global' }, { type: 'thread' }] } } : {}),
  } };
}
export function registerCouncilPanel(server: McpServer): void {
  server.registerResource('council-live-panel', PANEL_URI, {
    title: 'Council of AI · MEOK companion',
    description: 'Task-local activity and evidence. No platform-wide monitoring, private reasoning, autonomous repair or human authorization.',
    mimeType: 'text/html;profile=mcp-app',
    cacheHint: { ttlMs: 300_000, cacheScope: 'public' },
  }, async uri => ({ contents: [{ uri: uri.href, mimeType: RESOURCE.mimeType, text: RESOURCE.text,
    _meta: { ui: { csp: { connectDomains: ['https://councilof.ai'], resourceDomains: [], frameDomains: [] } } },
  }] }));
}
