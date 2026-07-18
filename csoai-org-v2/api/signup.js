// CSOAI Signup API — Vercel serverless function
// POST /api/signup — Creates a new free-tier account, returns API key
// Storage: Vercel KV (upgrade from JSON file for production)
import { createClient } from '@vercel/kv';
import crypto from 'crypto';

// Initialize Vercel KV (graceful fallback to in-memory if not configured)
let kv = null;
try {
    kv = createClient({
        url: process.env.KV_REST_API_URL,
        token: process.env.KV_REST_API_TOKEN,
    });
} catch (e) {
    // Fallback: in-memory store (for local dev / demo)
    console.log('Vercel KV not configured, using in-memory store');
}

const memoryStore = new Map();

function validateEmail(email) {
    return /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email);
}

function generateApiKey() {
    return `csoai_${crypto.randomBytes(16).toString('hex')}`;
}

function hashApiKey(key) {
    return crypto.createHash('sha256').update(key).digest('hex');
}

async function findByEmail(email) {
    const key = `signup:${email.toLowerCase()}`;
    if (kv) return await kv.get(key);
    return memoryStore.get(key);
}

async function createSignup(record) {
    const key = `signup:${record.email}`;
    if (kv) await kv.set(key, record);
    else memoryStore.set(key, record);
}

export default async function handler(req, res) {
    // CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') {
        return res.status(405).json({error: 'Method not allowed'});
    }

    try {
        const {email, name = '', company = ''} = req.body || {};
        if (!email || !validateEmail(email)) {
            return res.status(400).json({error: 'Invalid email format', valid: false});
        }

        const emailLower = email.toLowerCase().trim();

        // Check existing
        const existing = await findByEmail(emailLower);
        if (existing) {
            return res.status(200).json({
                status: 'existing',
                email: emailLower,
                tier: existing.tier || 'free',
                message: 'Email already registered.',
            });
        }

        // Create new
        const apiKey = generateApiKey();
        const apiKeyHash = hashApiKey(apiKey);
        const record = {
            email: emailLower,
            name: name.trim(),
            company: company.trim(),
            apiKeyHash,
            tier: 'free',
            dailyLimit: 3,
            monthlyUsed: 0,
            lifetimeUsed: 0,
            firstSeen: new Date().toISOString(),
            lastSeen: null,
            status: 'active',
        };

        await createSignup(record);

        return res.status(201).json({
            status: 'created',
            email: emailLower,
            apiKey, // SHOWN ONCE
            tier: 'free',
            dailyLimit: 3,
            verifyUrl: 'https://csoai-org-v2.vercel.app/verify',
            nextSteps: [
                `Test: curl -H "X-API-Key: ${apiKey}" https://csoai-org-v2.vercel.app/api/assess -d '{...}'`,
                'Dashboard: https://os.meok.ai/dashboard',
                'Upgrade: https://os.meok.ai/upgrade',
            ],
            message: 'Save this key — it cannot be recovered.',
        });
    } catch (err) {
        console.error('Signup error:', err);
        return res.status(500).json({error: 'Internal server error'});
    }
}
