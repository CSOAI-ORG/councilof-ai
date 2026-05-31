const fs = require('fs');
const path = require('path');
const axios = require('axios');

const PACK_FILES = [
    '../../meok/ui/src/lib/character-packs/mythological.ts',
    '../../meok/ui/src/lib/character-packs/historical.ts',
    '../../meok/ui/src/lib/character-packs/archetypes.ts',
    '../../meok/ui/src/lib/character-packs/literary.ts'
];

const FACTORY_URL = 'http://localhost:3300/mint';

async function syncPacks() {
    console.log("🚀 Starting Mass Character Sync...");

    for (const file of PACK_FILES) {
        const filePath = path.resolve(__dirname, file);
        if (!fs.existsSync(filePath)) {
            console.warn(`⚠️ Skipping missing file: ${file}`);
            continue;
        }

        console.log(`📦 Processing ${file}...`);
        const content = fs.readFileSync(filePath, 'utf-8');
        
        // Match character ID followed by its object
        const regex = /([a-z0-9_]+): {([\s\S]*?)}[ \t]*,?\n/g;
        let match;
        let count = 0;

        while ((match = regex.exec(content)) !== null) {
            const charId = match[1];
            const charBody = match[2];
            
            if (charId === 'id' || charId === 'dimensions' || charId === 'visual' || charId === 'evolutionAxes') continue;

            try {
                // VERY aggressive cleaning to turn TS object literal into JSON
                let jsonStr = '{' + charBody
                    .replace(/\/\/.*$/gm, '') // Remove comments
                    .replace(/([a-zA-Z0-9_]+):/g, '"$1":') // Quote keys
                    .replace(/'/g, '"') // Single quotes to double
                    .replace(/,(\s*[\]}])/g, '$1') // Trailing commas
                    .replace(/\\"/g, '"') // Unescape double quotes
                    .replace(/\n/g, ' ') + '}';

                const charData = JSON.parse(jsonStr);
                
                if (charData.name) {
                    const payload = {
                        name: charData.name,
                        archeType: charData.archetype,
                        ownerId: 'MEOK-FOUNDER',
                        tools: charData.tags || [],
                        dimensions: charData.dimensions,
                        mbti: charData.tags?.find(t => /^[IE][SN][TF][JP]$/.test(t)) || 'INTJ',
                        enneagram: charData.tags?.find(t => /^[1-9]w[1-9]$/.test(t)) || '5w6'
                    };

                    console.log(`  ✨ Minting ${charData.name}...`);
                    await axios.post(FACTORY_URL, payload);
                    count++;
                }
            } catch (e) {
                // Ignore parse errors for non-character matches
            }
        }
        console.log(`  ✅ Finished ${file} (${count} characters)`);
    }

    console.log("✅ Mass Sync Complete.");
}

syncPacks().catch(console.error);
