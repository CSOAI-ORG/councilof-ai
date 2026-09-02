const fs = require('fs');
let code = fs.readFileSync('src/app/leaderboard/page.tsx', 'utf8');

// Change interface Axis to match board.json
code = code.replace(/id: string;/, "axis: string;\n  name?: string;\n  id?: string;");
code = code.replace(/questions: number;/, "n: number;\n  questions?: number;");

// Change rendering
code = code.replace(/{axis.name}/, "{axis.name || axis.axis}");
code = code.replace(/{axis.id}/, "{axis.id || axis.axis}");
code = code.replace(/{axis.questions}/, "{axis.questions || axis.n}");
code = code.replace(/key={axis.id}/g, "key={axis.id || axis.axis}");
code = code.replace(/csoai\/{axis.id}/, "csoai/{axis.id || axis.axis}");

fs.writeFileSync('src/app/leaderboard/page.tsx', code);
