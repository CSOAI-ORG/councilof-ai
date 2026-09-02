const fs = require('fs');
const content = fs.readFileSync('src/app/page.tsx', 'utf8');

// I will just use `git show d8f6f2a2:src/app/page.tsx` as a base, but keep the current content's "We verify facts on the ledger" and "Built for the people who get audited" sections.
