/**
 * CSOAI Platform - Main Server Entry Point
 *
 * Council of Safety of AI (CSOAI) - The World's First AI Safety Infrastructure
 *
 * This server provides:
 * - tRPC API for type-safe frontend communication
 * - REST API for enterprise integrations
 * - 33-Agent Council Byzantine fault-tolerant voting system
 * - Multi-framework compliance (EU AI Act, NIST AI RMF, ISO 42001, TC260)
 * - Watchdog incident reporting and analyst workbench
 * - Training and certification system
 *
 * @version 1.0.0
 * @author CSOAI Team
 */

import express from 'express';
import cors from 'cors';
import { createExpressMiddleware } from '@trpc/server/adapters/express';
import { appRouter } from './routers';
import { createContext } from './db/context';
import { webhookHandler } from './db/webhookHandler';

const app = express();
const PORT = process.env.PORT || 3001;

// CORS configuration for frontend
app.use(cors({
  origin: process.env.NODE_ENV === 'production'
    ? ['https://councilof.ai', 'https://safetyof.ai', 'https://csoai.org']
    : ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true,
}));

// Parse JSON for non-webhook routes
app.use((req, res, next) => {
  if (req.path === '/api/webhooks/stripe') {
    next();
  } else {
    express.json()(req, res, next);
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'CSOAI Platform',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    features: {
      euAiActCompliance: true,
      nistAiRmf: true,
      iso42001: true,
      tc260: true,
      agentCouncil: true,
      watchdog: true,
      training: true,
    }
  });
});

// Stripe webhook (raw body needed)
app.post('/api/webhooks/stripe',
  express.raw({ type: 'application/json' }),
  webhookHandler
);

// tRPC API endpoint
app.use('/api/trpc', createExpressMiddleware({
  router: appRouter,
  createContext,
  onError: ({ path, error }) => {
    console.error(`[tRPC Error] ${path}:`, error.message);
  },
}));

// Public API endpoints for enterprise integrations
app.get('/api/v1/health', (req, res) => {
  res.json({ status: 'ok', version: '1.0.0' });
});

// Static file serving in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static('dist/client'));
  app.get('*', (req, res) => {
    res.sendFile('index.html', { root: 'dist/client' });
  });
}

// Error handling middleware
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('[Server Error]', err);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`
╔══════════════════════════════════════════════════════════════╗
║                                                              ║
║     ██████╗███████╗ ██████╗  █████╗ ██╗                     ║
║    ██╔════╝██╔════╝██╔═══██╗██╔══██╗██║                     ║
║    ██║     ███████╗██║   ██║███████║██║                     ║
║    ██║     ╚════██║██║   ██║██╔══██║██║                     ║
║    ╚██████╗███████║╚██████╔╝██║  ██║██║                     ║
║     ╚═════╝╚══════╝ ╚═════╝ ╚═╝  ╚═╝╚═╝                     ║
║                                                              ║
║     Council of Safety of AI - Platform Server                ║
║     The World's First AI Safety Infrastructure               ║
║                                                              ║
╠══════════════════════════════════════════════════════════════╣
║  🚀 Server running on http://localhost:${PORT}                   ║
║  📡 tRPC API: http://localhost:${PORT}/api/trpc                  ║
║  🔗 REST API: http://localhost:${PORT}/api/v1                    ║
║                                                              ║
║  Features Enabled:                                           ║
║  ✅ EU AI Act Compliance (113 Articles)                      ║
║  ✅ NIST AI RMF (72 Requirements)                            ║
║  ✅ ISO 42001 (56 Requirements)                              ║
║  ✅ TC260 AI Safety Governance                               ║
║  ✅ 33-Agent Council (Byzantine Fault Tolerant)              ║
║  ✅ Watchdog Incident Reporting                              ║
║  ✅ Training & Certification System                          ║
║  ✅ PDCA Continuous Improvement                              ║
╚══════════════════════════════════════════════════════════════╝
  `);
});

export { app };
