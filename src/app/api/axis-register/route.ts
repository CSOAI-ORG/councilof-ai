import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  try {
    const filePath = path.join(process.cwd(), 'public', 'gspc', 'board.json');
    if (fs.existsSync(filePath)) {
      const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      return NextResponse.json({
        schema: "csoai.axis-register/1.0",
        totals: data.totals,
        axes: data.axes
      }, {
        headers: { 'Access-Control-Allow-Origin': '*' }
      });
    }
    return NextResponse.json({ error: 'board.json not found' }, { status: 404 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
