// TEMPORARY lane-local dev config. Not committed. Isolates this lane's ports
// from the other worktrees already holding 5173/3001.
import base from './vite.config';
export default { ...base, server: { ...(base as any).server, port: 5199, strictPort: true,
  proxy: { '^/api/': { target: 'http://localhost:3099', changeOrigin: true } } } } as any;
