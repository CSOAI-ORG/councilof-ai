import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  try {
    const rwaCardsDir = path.join(process.cwd(), 'harness', 'rwa-attest', 'cards');
    const cards = [];
    if (fs.existsSync(rwaCardsDir)) {
      const files = fs.readdirSync(rwaCardsDir).filter(f => f.endsWith('.json'));
      for (const file of files) {
        try {
          const cardContent = JSON.parse(fs.readFileSync(path.join(rwaCardsDir, file), 'utf8'));
          cards.push({ file, ...cardContent });
        } catch {}
      }
    }
    return NextResponse.json({
      schema: "csoai.cards-index/1.0",
      total_loaded: cards.length,
      cards
    }, {
      headers: { 'Access-Control-Allow-Origin': '*' }
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
