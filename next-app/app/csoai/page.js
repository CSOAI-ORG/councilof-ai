import fs from 'fs';
import path from 'path';
export const metadata = { title: 'CSOAI — Layer 0 Trust Infrastructure' };
export default function CsoaiPage() {
  const html = fs.readFileSync(path.join(process.cwd(), '../csoai.org/next-level-ultimate.html'), 'utf-8');
  return <div dangerouslySetInnerHTML={{ __html: html }} />;
}
