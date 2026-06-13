# CSOAI - Council of Safety of AI

**The World's First AI Safety Infrastructure Platform**

CSOAI is a comprehensive AI safety governance platform providing multi-framework compliance, Byzantine fault-tolerant decision-making, and workforce development for the AI safety industry.

## Overview

CSOAI serves three core functions:

1. **Enterprise Compliance** - Multi-framework AI compliance automation (EU AI Act, NIST AI RMF, ISO 42001, TC260)
2. **33-Agent Council** - Byzantine fault-tolerant voting system for AI safety decisions
3. **Training & Certification** - Professional development for AI safety analysts

## Features

### Multi-Framework Compliance
- **EU AI Act** - 113 articles, full compliance mapping
- **NIST AI RMF** - 72 requirements across GOVERN, MAP, MEASURE, MANAGE
- **ISO 42001** - AI Management System standard
- **TC260** - Chinese AI Safety Governance Framework

### 33-Agent Council (Byzantine Fault Tolerant)
- 33 independent AI agents across 3 providers
- 11 Guardian agents (safety, security, privacy)
- 11 Arbiter agents (fairness, transparency, accountability)
- 11 Scribe agents (documentation, compliance, reporting)
- 22/33 consensus threshold
- Tolerates up to 10 faulty/malicious agents

### Training & Certification
- 8-module courses for each framework (24 total modules)
- Professional certification exams
- Analyst workbench for case management
- Job marketplace for AI safety professionals

### Watchdog System
- Public incident reporting
- AI model safety leaderboard
- Community-driven accountability

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, TypeScript, TailwindCSS, Wouter |
| Backend | Node.js, Express, tRPC |
| Database | PostgreSQL/MySQL, Drizzle ORM |
| AI | OpenAI, Anthropic, Google Gemini |
| Payments | Stripe |
| Storage | AWS S3 |

## Project Structure

\`\`\`
CSOAI/
├── client/                  # React frontend
│   ├── src/
│   │   ├── components/      # Reusable UI components
│   │   ├── pages/           # Page components
│   │   ├── contexts/        # React contexts
│   │   ├── hooks/           # Custom hooks
│   │   ├── lib/             # Utilities and tRPC client
│   │   └── styles/          # CSS styles
│   ├── index.html
│   └── vite.config.ts
├── server/                  # Node.js backend
│   ├── routers/             # tRPC routers
│   ├── services/            # Business logic
│   │   ├── council.ts       # 33-Agent Council
│   │   ├── auth.ts          # Authentication
│   │   └── ...
│   ├── db/                  # Database schema and config
│   ├── content/             # Training module content
│   └── index.ts             # Server entry point
├── shared/                  # Shared types and schemas
├── docs/                    # Documentation
│   ├── architecture/        # Technical architecture
│   ├── compliance/          # Compliance frameworks
│   ├── courses/             # Training content
│   └── business/            # Business docs
├── tests/                   # Test files
└── assets/                  # Static assets
\`\`\`

## Getting Started

### Prerequisites

- Node.js 20+
- pnpm
- PostgreSQL or MySQL database
- API keys for OpenAI, Anthropic, and Google AI

### Installation

1. Clone the repository
\`\`\`bash
git clone https://github.com/csoai/platform.git
cd CSOAI
\`\`\`

2. Install dependencies
\`\`\`bash
pnpm install
\`\`\`

3. Configure environment
\`\`\`bash
cp .env.example .env
# Edit .env with your configuration
\`\`\`

4. Set up database
\`\`\`bash
pnpm db:push
\`\`\`

5. Start development server
\`\`\`bash
pnpm dev
\`\`\`

The frontend will be available at http://localhost:5173
The API will be available at http://localhost:3001

### Available Scripts

- \`pnpm dev\` - Start development servers
- \`pnpm build\` - Build for production
- \`pnpm start\` - Run production server
- \`pnpm test\` - Run tests
- \`pnpm db:push\` - Push schema changes to database
- \`pnpm db:studio\` - Open Drizzle Studio

## API Documentation

### Authentication
- \`POST /api/trpc/auth.login\` - User login
- \`POST /api/trpc/auth.register\` - User registration
- \`GET /api/trpc/auth.me\` - Get current user

### Compliance
- \`GET /api/trpc/compliance.getFrameworks\` - List frameworks
- \`POST /api/trpc/compliance.startAssessment\` - Start assessment
- \`GET /api/trpc/compliance.getAssessment\` - Get assessment

### 33-Agent Council
- \`GET /api/trpc/council.getAgents\` - List all agents
- \`GET /api/trpc/council.getSessions\` - List voting sessions
- \`POST /api/trpc/council.triggerVoting\` - Trigger council vote

### Watchdog
- \`GET /api/trpc/watchdog.getReports\` - List reports
- \`POST /api/trpc/watchdog.submitReport\` - Submit report
- \`GET /api/trpc/watchdog.getLeaderboard\` - Safety leaderboard

### Training
- \`GET /api/trpc/training.getCourses\` - List courses
- \`POST /api/trpc/training.enrollInCourse\` - Enroll in course

## Compliance Frameworks

### EU AI Act (2024)
The EU AI Act is the world's first comprehensive legal framework on AI. CSOAI maps all 113 articles and provides:
- Risk classification (Unacceptable, High, Limited, Minimal)
- Conformity assessment workflows
- Technical documentation generation
- Human oversight verification

### NIST AI RMF 1.0
The NIST AI Risk Management Framework provides:
- GOVERN: Policies and procedures
- MAP: Risk identification
- MEASURE: Risk assessment
- MANAGE: Risk treatment

### ISO/IEC 42001
AI Management System standard covering:
- Leadership and planning
- Risk assessment
- Operational controls
- Performance evaluation

### TC260 (China)
Chinese AI Safety Governance Framework:
- Inherent Risk assessment
- Application Risk evaluation
- Derivative Risk monitoring

## License

MIT License - see LICENSE file for details.

## Contact

- Website: https://councilof.ai
- Email: contact@councilof.ai
