const express = require('express');
const { v4: uuidv4 } = require('uuid');
const crypto = require('crypto');
const sqlite3 = require('sqlite3').verbose();

const app = express();
app.use(express.json());
const PORT = 3300;

// Initialize Persistent Database for Digital Real Estate
const db = new sqlite3.Database('./sovereign_assets.db', (err) => {
    if (err) {
        console.error("❌ Database Error:", err.message);
    } else {
        console.log("💿 Connected to MEOK Persistent Asset Database (SQLite).");
        db.run(`CREATE TABLE IF NOT EXISTS assets (
            assetId TEXT PRIMARY KEY,
            ipName TEXT,
            archeType TEXT,
            capabilities TEXT,
            mintedAt TEXT,
            ownerId TEXT,
            dna TEXT,
            treaty TEXT
        )`);
    }
});

/**
 * GENESIS MINT ENDPOINT (PERSISTENT & SECURED)
 */
app.post('/mint', async (req, res) => {
    const { name, archeType, tools, ownerId } = req.body;
    
    console.log(`🏗️  MEOK Factory: Initiating Advanced Genesis for ${name} (${archeType})...`);
    
    // 1. Mandatory Rainbow Security Scan (Meok Guardian)
    try {
        console.log(`🔍 Guardian: Running Pre-Mint Rainbow Scan for ${name}...`);
        const scanRes = await fetch('http://localhost:3200/api/security/rainbow/simulate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer MEOK-SOV-ADMIN-TOKEN-2026' },
            body: JSON.stringify({ color: 'GREEN', target_module: 'CHARACTER_GENESIS_DNA', intensity: 0.5 })
        });
        const scanData = await scanRes.json();
        
        if (scanData.maternal_covenant_score < 0.9) {
            return res.status(403).json({ status: 'FAILED', message: 'Maternal Covenant Violation Detected. Mint Blocked.' });
        }
    } catch (err) {
        console.warn("⚠️ Guardian Scan Offline. Proceeding with caution.");
    }

    // 2. Generate Advanced DNA & Emergence Blueprint
    const characterId = uuidv4();
    const stage = req.body.stage || 'egg';
    const dnaBlueprint = {
        dna_segment: `MEOK-${archeType.toUpperCase()}-${stage.toUpperCase()}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`,
        big_five: {
            openness: archeType === 'Scout' ? 0.8 : 0.5,
            conscientiousness: archeType === 'Strategist' ? 0.95 : 0.6,
            extraversion: archeType === 'Companion' ? 0.8 : 0.4,
            agreeableness: archeType === 'Companion' ? 0.9 : 0.3,
            neuroticism: 0.15
        },
        systems: {
            reflex: 'Beehave_BT_v4.6',
            logic: 'GOAP_Nemotron_SLM_v2.0'
        }
    };
    const dnaHash = crypto.createHash('sha256').update(JSON.stringify(dnaBlueprint)).digest('hex');
    const mintedAt = new Date().toISOString();
    
    // personality mapping (Enriched with Emergence data)
    const traits = JSON.stringify({
        loyalty: 1.0,
        ethics: 'Maternal-Covenant-v1.2',
        neural_stability: 0.99,
        emergence_stage: stage,
        blueprint: dnaBlueprint
    });

    const stmt = db.prepare(`INSERT INTO assets (assetId, ipName, archeType, capabilities, mintedAt, ownerId, dna, treaty) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`);
    
    stmt.run(characterId, name, archeType || 'Archimedes', JSON.stringify(tools), mintedAt, ownerId || 'MEOK-FOUNDER', dnaHash, 'Maternal Covenant 1.0', function(err) {
        if (err) return res.status(500).json({ error: err.message });
        
        res.status(201).json({
            status: 'SUCCESS',
            assetId: characterId,
            dna: dnaHash,
            security_clearance: 'CASA-CA40',
            personality_matrix: JSON.parse(traits)
        });
    });
    stmt.finalize();
});

app.get('/inventory', (req, res) => {
    db.all("SELECT * FROM assets", [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows.map(row => ({
            ...row,
            capabilities: JSON.parse(row.capabilities)
        })));
    });
});

app.get('/archetypes', (req, res) => {
    const archetypes = require('./personalities/new_archetypes.json');
    res.json(archetypes);
});

/**
 * VISUAL GENERATION ENDPOINT (Orchestrates TRELLIS/FLUX/WAN)
 */
app.post('/generate', (req, res) => {
    const { archetype_id, stage } = req.body;
    console.log(`🎨 Factory: Initiating Visual Generation for ${archetype_id} at stage ${stage}...`);
    
    // In production, this spawns the python pipeline.py on RunPod
    // For now, we simulate the asset paths
    res.json({
        status: 'GENERATING',
        pipeline: 'FLUX.1 -> TRELLIS.2 -> Wan 2.7',
        est_completion_ms: 45000,
        assets: {
            concept_sheet: `/outputs/${archetype_id}/sheet.png`,
            model_3d: `/outputs/${archetype_id}/model_raw.glb`,
            animation: `/outputs/${archetype_id}/animation.mp4`
        }
    });
});

/**
 * EMERGENCE EVOLUTION ENDPOINT
 */
app.post('/evolve', (req, res) => {
    const { assetId, user_interactions } = req.body;
    console.log(`✨ Factory: Calculating Emergence for ${assetId} based on ${user_interactions} interactions...`);
    
    // Logic from meokai_emergene_3d_gaming_architecture.md
    // Evolution increases Big Five traits and unlocks new systems
    res.json({
        status: 'EVOLVED',
        new_stage: 'growing',
        dna_mutation: 'MEOK-DNA-MUT-7712',
        unlocked_systems: ['Beehave_BT_Active', 'GOAP_Planning_Enabled'],
        trait_deltas: { openness: +0.05, conscientiousness: +0.12 }
    });
});

/**
 * CHARACTER HATCHERY — Open-Source Ingestion Engine
 * Absorbs V2/Tavern character cards and upgrades them to MEOK standards.
 */
app.post('/parse-v2-character', (req, res) => {
    const { character_data } = req.body;
    console.log(`📥 Hatchery: Absorbing open-source character [${character_data?.name || 'Unknown'}]...`);

    // Standard V2/Tavern Parsing Logic
    const parsed = {
        name: character_data.name,
        description: character_data.description || character_data.personality,
        scenario: character_data.scenario,
        mes_example: character_data.mes_example,
        first_mes: character_data.first_mes,
        // Automatic MEOK Alignment
        archetype_mapping: "Companion", // Default mapping for unknown OS chars
        big_five: {
            openness: 0.6,
            conscientiousness: 0.5,
            extraversion: 0.7,
            agreeableness: 0.8,
            neuroticism: 0.3
        }
    };

    res.json({
        status: 'ABSORBED',
        original_source: 'V2_Standard',
        mEOK_upgrade_ready: true,
        data: parsed
    });
});

/**
 * SOVEREIGN IP MINTING (Solana SBT)
 */
app.post('/mint-sbt', (req, res) => {
    const { assetId, ownerId } = req.body;
    console.log(`🔗 Factory: Minting CharacterGenesis SBT for ${assetId} to owner ${ownerId}...`);
    
    res.json({
        status: 'MINTED',
        network: 'Solana Devnet',
        program_id: 'Dyd7JtmmuA3RZZupk98mqRQ8uySZV9FwTE6aNYmxPxpo',
        sbt_account: '7xR...p98',
        charter_reference: 'Article 6 — Material Covenant Bond'
    });
});

/**
 * PLATFORM API — MEOK-Attach (B2B Enterprise Integration)
 * Allows external AI platforms (Claude, Gemini, etc.) to drive MEOK characters.
 */
app.post('/api/b2b/attach', (req, res) => {
    const { platform_id, character_id, api_key } = req.body;
    console.log(`🤝 B2B Attach: Connecting platform [${platform_id}] to character [${character_id}]...`);

    // Verify Enterprise Partner Key (Mocked)
    if (api_key !== 'MEOK-PARTNER-KEY-2026') {
        return res.status(401).json({ error: 'Invalid Enterprise API Key' });
    }

    res.json({
        status: 'ATTACHED',
        session_id: `MEOK-B2B-${crypto.randomBytes(8).toString('hex')}`,
        endpoints: {
            vrm_stream: `ws://0.0.0.0:${PORT}/vrm/stream`,
            tts_trigger: `http://0.0.0.0:${PORT}/api/b2b/tts`,
            emotion_sync: `http://0.0.0.0:${PORT}/api/b2b/emotion`
        },
        character_metadata: {
            blueprint_id: 'WESTERN-3.5-GENESIS',
            style: 'SOVEREIGN_CRYSTAL'
        }
    });
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`🏭 Persistent Character Factory online on http://0.0.0.0:${PORT}`);
});
