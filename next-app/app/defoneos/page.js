import fs from 'fs';
import path from 'path';
export const metadata = { title: 'DEFONEOS — Sovereign Defence AI OS' };
export default function DefoneosPage() {
  const html = fs.readFileSync(path.join(process.cwd(), '../csoai.org/defoneos-next-level-ultimate.html'), 'utf-8');
  return <div dangerouslySetInnerHTML={{ __html: html }} />;
}
