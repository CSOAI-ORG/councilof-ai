const fs = require('fs');
let code = fs.readFileSync('src/app/leaderboard/page.tsx', 'utf8');

code = code.replace("  name?: string;\n  id?: string;\n  name: string;", "  id?: string;\n  name?: string;");
code = code.replace("  n: number;\n  questions?: number;", "  n?: number;\n  questions?: number;");

fs.writeFileSync('src/app/leaderboard/page.tsx', code);
