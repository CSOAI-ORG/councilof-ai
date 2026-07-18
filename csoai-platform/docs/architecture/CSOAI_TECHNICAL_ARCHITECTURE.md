# CSOAI Platform: Technical Architecture & Implementation Guide

**Document Version:** 1.0  
**Date:** December 26, 2024  
**Author:** Technical Team, CSOAI  
**Status:** Production Architecture

---

## System Architecture Overview

The CSOAI platform is built on a modern, scalable architecture designed to handle millions of users while maintaining security, performance, and reliability. The system follows a **three-tier architecture** with clear separation between presentation, application logic, and data persistence layers.

### Technology Stack

| Layer | Technology | Version | Purpose |
|-------|-----------|---------|---------|
| **Frontend** | React | 19.2.1 | UI component library with concurrent rendering |
| **Styling** | Tailwind CSS | 4.1.14 | Utility-first CSS framework with custom design tokens |
| **Routing** | Wouter | 3.3.5 | Lightweight client-side routing |
| **State Management** | React Query | 5.90.2 | Server state management and caching |
| **Backend Runtime** | Node.js | 22.13.0 | JavaScript runtime for server execution |
| **API Framework** | Express | 4.21.2 | HTTP server framework |
| **API Layer** | tRPC | 11.6.0 | End-to-end type-safe API |
| **Database** | PostgreSQL | Latest | Relational database for structured data |
| **ORM** | Drizzle | 0.44.5 | Type-safe database queries |
| **Authentication** | JWT + OAuth | jose 6.1.0 | Secure authentication and authorization |
| **Payment Processing** | Stripe | 20.1.0 | Subscription and payment management |
| **File Storage** | AWS S3 | SDK 3.693.0 | Secure document and media storage |
| **AI Integration** | Google Gemini | API 0.24.1 | AI-powered features and analysis |

### Deployment Architecture

The platform is deployed on a cloud infrastructure with the following components:

**Application Servers**: Node.js instances running behind a load balancer for horizontal scaling. Each instance handles HTTP requests, executes business logic, and communicates with the database.

**Database Cluster**: PostgreSQL primary with read replicas for query distribution. Automated failover ensures high availability. Daily backups with 30-day retention provide disaster recovery capability.

**CDN & Static Assets**: Vite-built frontend assets served via CDN for global low-latency access. Images and documents stored in S3 with CloudFront distribution.

**Background Jobs**: Separate worker processes handle asynchronous tasks including email notifications, payment processing, and compliance report generation.

---

## Database Schema

The database schema is designed to support all platform features while maintaining data integrity and query performance.

### Core Tables

**users**: Stores user account information including authentication credentials, profile data, and role assignments.

```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  open_id VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255),
  email VARCHAR(255) UNIQUE NOT NULL,
  login_method VARCHAR(50),
  role VARCHAR(50) DEFAULT 'user',
  stripe_customer_id VARCHAR(255),
  stripe_subscription_id VARCHAR(255),
  subscription_tier VARCHAR(50) DEFAULT 'free',
  subscription_status VARCHAR(50) DEFAULT 'none',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  last_signed_in TIMESTAMP
);
```

**courses**: Defines training courses with metadata, pricing, and content structure.

**course_enrollments**: Tracks user enrollment in courses with progress and completion status.

**course_progress**: Records granular progress through course modules and lessons.

**certifications**: Stores certification exam results and issued certificates.

**ai_systems**: Registry of AI systems submitted for compliance monitoring.

**compliance_assessments**: Results of compliance evaluations across multiple frameworks.

**watchdog_reports**: Public incident reports submitted through the Watchdog system.

**analyst_cases**: Work assignments for certified analysts reviewing AI systems.

**council_votes**: Records of 33-Agent Council voting on safety decisions.

**payments**: Transaction history for course purchases, subscriptions, and analyst earnings.

### Relationships

The schema uses foreign keys to maintain referential integrity:

- Users → Course Enrollments (one-to-many)
- Courses → Course Progress (one-to-many through enrollments)
- Users → Certifications (one-to-many)
- Users → AI Systems (one-to-many for enterprise customers)
- AI Systems → Compliance Assessments (one-to-many)
- AI Systems → Analyst Cases (one-to-many)
- Analyst Cases → Council Votes (one-to-many)
- Users → Watchdog Reports (one-to-many)

### Indexing Strategy

Critical indexes for query performance:

- `users.email` - B-tree index for login queries
- `users.stripe_customer_id` - B-tree index for payment webhook lookups
- `course_enrollments.user_id` - B-tree index for user dashboard queries
- `ai_systems.enterprise_id` - B-tree index for enterprise dashboard
- `compliance_assessments.ai_system_id` - B-tree index for compliance history
- `watchdog_reports.created_at` - B-tree index for chronological listing
- `analyst_cases.analyst_id, status` - Composite index for workbench queries

---

## API Architecture

The platform uses **tRPC** for end-to-end type-safe API communication between frontend and backend. This eliminates the need for API documentation generation and prevents runtime type errors.

### API Routers

**auth.router**: Authentication and authorization endpoints
- `login` - Email/password or OAuth login
- `signup` - New user registration
- `logout` - Session termination
- `me` - Current user profile
- `updateProfile` - Profile modification

**courses.router**: Training course management
- `list` - Available courses with filtering
- `getById` - Course details
- `enroll` - Course enrollment with payment
- `getProgress` - User progress tracking
- `completeLesson` - Mark lesson complete
- `submitQuiz` - Quiz submission and grading

**certification.router**: Certification exam system
- `startExam` - Initialize exam session
- `submitAnswer` - Record exam answers
- `completeExam` - Finalize and grade exam
- `getCertificates` - User's earned certificates
- `verifyCertificate` - Public certificate verification

**aiSystems.router**: AI system registry
- `register` - Register new AI system
- `list` - User's registered systems
- `getById` - System details
- `updateCompliance` - Update compliance status
- `requestAssessment` - Request analyst review

**watchdog.router**: Incident reporting system
- `submitReport` - File new incident report
- `listReports` - Public report listing
- `getReportById` - Report details
- `voteOnReport` - Analyst voting (requires certification)

**analyst.router**: Analyst workbench
- `getCases` - Assigned cases for review
- `submitReview` - Complete case review
- `getEarnings` - Earnings history and pending payments

**admin.router**: Administrative functions
- `getUsers` - User management
- `updateUserRole` - Role assignment
- `getAnalytics` - Platform metrics
- `moderateReports` - Watchdog moderation

### Authentication & Authorization

All API endpoints require authentication via JWT tokens. Role-based access control (RBAC) restricts sensitive endpoints:

- **Public**: No authentication required (course listing, Watchdog public reports)
- **User**: Authenticated users (course enrollment, profile management)
- **Analyst**: Certified analysts (case review, voting)
- **Enterprise**: Enterprise customers (AI system registration, compliance dashboard)
- **Admin**: Platform administrators (user management, content moderation)

Middleware validates JWT tokens on every request and attaches user context to the request object. Authorization checks occur at the router level before executing business logic.

---

## Frontend Architecture

The frontend is a **single-page application (SPA)** built with React 19, leveraging modern features including concurrent rendering, automatic batching, and transitions for smooth UX.

### Component Structure

**Pages**: Top-level route components (`Home.tsx`, `About.tsx`, `Training.tsx`, etc.) that compose smaller components into full views.

**Components**: Reusable UI elements organized by function:
- `ui/` - shadcn/ui components (Button, Card, Dialog, etc.)
- `layout/` - Layout components (Header, Footer, DashboardLayout)
- `features/` - Feature-specific components (CourseCard, CertificateDisplay, ComplianceGauge)

**Contexts**: React contexts for global state:
- `AuthContext` - User authentication state
- `ThemeContext` - Dark/light theme preference

**Hooks**: Custom React hooks for reusable logic:
- `useAuth` - Authentication state and methods
- `useCourse` - Course enrollment and progress
- `useCompliance` - Compliance status queries

### State Management

**Server State**: React Query manages all server data with automatic caching, background refetching, and optimistic updates. Queries are invalidated on mutations to keep UI synchronized with backend.

**Client State**: React's built-in `useState` and `useReducer` handle local UI state (form inputs, modal visibility, etc.). Context API provides global client state where needed.

**Form State**: React Hook Form manages form validation and submission with Zod schema validation for type safety.

### Styling System

Tailwind CSS provides utility-first styling with custom design tokens defined in `client/src/index.css`:

```css
@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;
    --primary: 142.1 76.2% 36.3%; /* Emerald-600 */
    --primary-foreground: 355.7 100% 97.3%;
    /* ... additional tokens */
  }
}
```

The emerald/green color scheme is consistently applied across all components using semantic tokens (`bg-primary`, `text-primary`, etc.) that automatically adapt to light/dark themes.

### Build & Optimization

Vite builds the frontend with:
- **Code Splitting**: Automatic route-based splitting for faster initial load
- **Tree Shaking**: Removes unused code from production bundles
- **Minification**: Compresses JavaScript and CSS for smaller file sizes
- **Asset Hashing**: Cache-busting for static assets

Production builds achieve:
- First Contentful Paint < 1.5s
- Time to Interactive < 3.5s
- Lighthouse Performance Score > 90

---

## Security Architecture

Security is paramount for a platform handling sensitive compliance data and financial transactions.

### Authentication Security

**JWT Tokens**: Short-lived access tokens (15 minutes) with longer-lived refresh tokens (7 days) stored in httpOnly cookies to prevent XSS attacks.

**OAuth Integration**: Google OAuth for passwordless authentication, reducing credential theft risk. OAuth tokens are never exposed to the frontend.

**Password Security**: Passwords hashed with bcrypt (12 rounds) before storage. Password reset requires email verification with time-limited tokens.

### Data Protection

**Encryption at Rest**: All database data encrypted using AES-256. Encryption keys rotated quarterly and stored in secure key management service.

**Encryption in Transit**: TLS 1.3 for all HTTP traffic. HSTS headers enforce HTTPS. Certificate pinning prevents man-in-the-middle attacks.

**PII Handling**: Personally identifiable information (names, emails, payment data) encrypted with additional field-level encryption. Access logged for audit trails.

### API Security

**Rate Limiting**: Per-user and per-IP rate limits prevent abuse:
- Authentication endpoints: 5 requests/minute
- API endpoints: 100 requests/minute
- Public endpoints: 1000 requests/minute

**CORS Configuration**: Strict CORS policies allow only whitelisted domains to make API requests.

**Input Validation**: All API inputs validated with Zod schemas. SQL injection prevented by parameterized queries via Drizzle ORM.

**CSRF Protection**: CSRF tokens required for state-changing operations. SameSite cookie attribute prevents cross-site request forgery.

### Compliance & Auditing

**GDPR Compliance**: Data export, deletion, and consent management features. Data processing agreements with all third-party services.

**Audit Logging**: All sensitive operations logged with user ID, timestamp, IP address, and action details. Logs retained for 1 year for compliance investigations.

**Penetration Testing**: Quarterly third-party security audits identify vulnerabilities. Bug bounty program rewards responsible disclosure.

---

## Integration Points

### Stripe Payment Integration

Stripe handles all payment processing with webhooks for event-driven updates:

**Checkout Flow**:
1. Frontend creates Stripe Checkout session via API
2. User redirected to Stripe-hosted payment page
3. Upon successful payment, Stripe webhook notifies backend
4. Backend grants course access and updates subscription status

**Webhook Events**:
- `checkout.session.completed` - Payment successful, grant access
- `customer.subscription.updated` - Subscription tier change
- `customer.subscription.deleted` - Subscription cancelled
- `invoice.payment_failed` - Payment failure, notify user

**Security**: Webhook signatures verified using Stripe secret to prevent spoofing.

### AWS S3 Storage Integration

S3 stores all user-generated content and platform assets:

**Upload Flow**:
1. Backend generates presigned POST URL with expiration
2. Frontend uploads directly to S3 using presigned URL
3. Backend records S3 key in database for retrieval

**Access Control**: Presigned GET URLs with 1-hour expiration provide temporary access without exposing S3 credentials.

**Organization**: Files organized by type:
- `/certificates/{userId}/{certId}.pdf` - Certification PDFs
- `/documents/{systemId}/{docId}` - Compliance documentation
- `/evidence/{reportId}/{fileId}` - Watchdog report evidence

### Google Gemini AI Integration

Gemini API provides AI-powered features:

**Compliance Gap Analysis**: Analyzes uploaded compliance documentation and identifies missing requirements across EU AI Act, NIST AI RMF, and TC260.

**Course Recommendations**: Suggests relevant training modules based on user's role, industry, and existing knowledge.

**Watchdog Report Classification**: Processes natural language incident reports and assigns severity scores, risk categories, and recommended actions.

**API Usage**: Requests rate-limited to 60/minute per API key. Responses cached for 24 hours to reduce costs.

---

## Performance Optimization

### Database Optimization

**Connection Pooling**: Database connection pool (max 20 connections) reuses connections across requests, reducing overhead.

**Query Optimization**: Complex queries use EXPLAIN ANALYZE to identify slow operations. Indexes added for frequently queried columns.

**Read Replicas**: Read-heavy queries (course listings, public Watchdog reports) directed to read replicas, reducing primary database load.

**Caching**: Redis cache for frequently accessed data (course catalog, user profiles) with 5-minute TTL.

### Frontend Optimization

**Lazy Loading**: Route-based code splitting loads only necessary JavaScript for current page.

**Image Optimization**: Images served in WebP format with responsive sizes. Lazy loading for below-fold images.

**Prefetching**: React Query prefetches likely next pages (e.g., course details when hovering over course card).

**Memoization**: React.memo prevents unnecessary re-renders of expensive components.

### CDN Strategy

**Static Assets**: All JavaScript, CSS, images, and fonts served via CloudFront CDN with edge caching.

**Cache Headers**: Aggressive caching for immutable assets (1 year) with content hashing for cache busting.

**Geographic Distribution**: CDN edge locations in North America, Europe, and Asia for global low-latency access.

---

## Monitoring & Observability

### Application Monitoring

**Error Tracking**: Sentry captures frontend and backend errors with stack traces, user context, and breadcrumbs for debugging.

**Performance Monitoring**: Application performance monitoring (APM) tracks request latency, database query time, and external API calls.

**Uptime Monitoring**: Synthetic monitors ping critical endpoints every minute from multiple geographic locations.

### Logging

**Structured Logging**: JSON-formatted logs with consistent fields (timestamp, level, user_id, request_id, message).

**Log Aggregation**: Logs centralized in log management system for search and analysis.

**Alerting**: Automated alerts for error rate spikes, slow queries, and service degradation.

### Analytics

**User Analytics**: Track user behavior (page views, course completions, certification pass rates) for product insights.

**Business Metrics**: Real-time dashboards for revenue, user growth, and engagement metrics.

**Compliance Metrics**: Track AI systems registered, compliance assessments completed, and Watchdog reports filed.

---

## Scalability Considerations

### Horizontal Scaling

**Stateless Application**: Application servers are stateless, allowing horizontal scaling by adding more instances behind load balancer.

**Database Scaling**: Read replicas handle read traffic. Sharding strategy planned for >10M users.

**Background Jobs**: Job queue (e.g., BullMQ) distributes asynchronous tasks across worker processes.

### Caching Strategy

**Application Cache**: Redis caches frequently accessed data (user sessions, course catalog) with TTL-based invalidation.

**CDN Cache**: Static assets cached at edge locations for global low-latency delivery.

**Browser Cache**: Aggressive browser caching for immutable assets reduces server requests.

### Load Testing

**Baseline Performance**: Current architecture handles 1,000 concurrent users with <200ms average response time.

**Target Performance**: Architecture designed to scale to 100,000 concurrent users with <500ms response time.

**Bottleneck Identification**: Regular load testing identifies performance bottlenecks before they impact users.

---

## Disaster Recovery

### Backup Strategy

**Database Backups**: Automated daily full backups with 30-day retention. Point-in-time recovery available for last 7 days.

**S3 Versioning**: S3 versioning enabled for all buckets, allowing recovery of deleted or overwritten files.

**Code Repository**: Git repository with multiple remote backups ensures code is never lost.

### Failover Procedures

**Database Failover**: Automated failover to read replica promoted to primary within 60 seconds of primary failure.

**Application Failover**: Load balancer automatically routes traffic away from unhealthy instances.

**DNS Failover**: Route 53 health checks failover to backup region if primary region is unavailable.

### Recovery Time Objectives

**RTO (Recovery Time Objective)**: Maximum 1 hour to restore full service after catastrophic failure.

**RPO (Recovery Point Objective)**: Maximum 5 minutes of data loss in worst-case scenario (time since last database transaction log).

---

## Development Workflow

### Local Development

**Environment Setup**: Docker Compose provides local PostgreSQL database and Redis cache matching production environment.

**Hot Reload**: Vite dev server provides instant hot module replacement for frontend changes. tsx watch restarts backend on file changes.

**Database Migrations**: Drizzle Kit generates type-safe migrations from schema changes. `pnpm db:push` applies migrations to local database.

### Code Quality

**TypeScript**: Strict type checking prevents runtime type errors. `pnpm check` runs TypeScript compiler without emitting files.

**Linting**: ESLint enforces code style and catches common errors. Prettier formats code consistently.

**Testing**: Vitest runs unit and integration tests. `pnpm test` executes test suite with coverage reporting.

### CI/CD Pipeline

**Continuous Integration**: GitHub Actions runs on every pull request:
1. Install dependencies
2. Run TypeScript type checking
3. Run linter
4. Run test suite
5. Build production bundle

**Continuous Deployment**: Merges to main branch trigger automated deployment:
1. Build Docker image
2. Push to container registry
3. Deploy to staging environment
4. Run smoke tests
5. Deploy to production with blue-green deployment

### Version Control

**Branching Strategy**: Git Flow with main (production), develop (staging), and feature branches.

**Commit Conventions**: Conventional Commits format for clear change history and automated changelog generation.

**Code Review**: All changes require peer review before merging to main branch.

---

## API Documentation

### REST API Endpoints

While tRPC provides type-safe API access for the frontend, REST endpoints are available for third-party integrations:

**Authentication**:
- `POST /api/auth/login` - User login
- `POST /api/auth/signup` - User registration
- `POST /api/auth/logout` - User logout

**Courses**:
- `GET /api/courses` - List available courses
- `GET /api/courses/:id` - Get course details
- `POST /api/courses/:id/enroll` - Enroll in course

**Certifications**:
- `GET /api/certifications/verify/:id` - Verify certificate authenticity

**AI Systems**:
- `POST /api/ai-systems` - Register AI system
- `GET /api/ai-systems/:id` - Get system details
- `POST /api/ai-systems/:id/assess` - Request compliance assessment

**Watchdog**:
- `GET /api/watchdog/reports` - List public reports
- `POST /api/watchdog/reports` - Submit incident report

### SDK Documentation

**JavaScript/TypeScript SDK**:

```typescript
import { CSOAIClient } from '@csoai/sdk';

const client = new CSOAIClient({
  apiKey: process.env.CSOAI_API_KEY
});

// Register AI system
const system = await client.aiSystems.register({
  name: 'Customer Service Chatbot',
  description: 'AI-powered customer support',
  riskCategory: 'high',
  frameworks: ['eu-ai-act', 'nist-ai-rmf']
});

// Check compliance
const assessment = await client.compliance.assess(system.id);
console.log(assessment.status); // 'compliant' | 'non-compliant' | 'pending'
```

**Python SDK** (planned for Q1 2025):

```python
from csoai import CSOAIClient

client = CSOAIClient(api_key=os.environ['CSOAI_API_KEY'])

# Register AI system
system = client.ai_systems.register(
    name='Customer Service Chatbot',
    description='AI-powered customer support',
    risk_category='high',
    frameworks=['eu-ai-act', 'nist-ai-rmf']
)

# Check compliance
assessment = client.compliance.assess(system.id)
print(assessment.status)  # 'compliant' | 'non-compliant' | 'pending'
```

---

## Deployment Guide

### Production Deployment

**Prerequisites**:
- Node.js 22+ installed
- PostgreSQL 15+ database
- Redis 7+ cache
- AWS S3 bucket configured
- Stripe account with API keys
- Domain with SSL certificate

**Environment Variables**:

```bash
# Database
DATABASE_URL=postgresql://user:pass@host:5432/csoai

# Authentication
JWT_SECRET=your-secret-key
OAUTH_SERVER_URL=https://oauth.example.com

# Stripe
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# AWS S3
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
AWS_S3_BUCKET=csoai-production

# Google Gemini
GEMINI_API_KEY=...

# Application
NODE_ENV=production
PORT=3000
VITE_APP_TITLE=CSOAI
```

**Build & Deploy**:

```bash
# Install dependencies
pnpm install

# Build frontend and backend
pnpm build

# Start production server
pnpm start
```

**Health Checks**:
- `GET /health` - Application health status
- `GET /health/db` - Database connectivity
- `GET /health/cache` - Redis connectivity

---

## Future Technical Roadmap

### Q1 2025

**33-Agent Council Implementation**: Complete Byzantine consensus voting system with agent simulation and tie-breaking logic.

**Real-time Notifications**: WebSocket integration for live updates on case assignments, exam results, and compliance changes.

**Mobile App**: React Native application for iOS and Android with push notifications and offline support.

### Q2 2025

**Advanced Analytics**: Machine learning models for predictive risk scoring, compliance trend analysis, and fraud detection.

**API v2**: GraphQL API for more flexible querying and reduced over-fetching.

**Multi-language Support**: Internationalization (i18n) for Spanish, French, German, and Chinese interfaces.

### Q3 2025

**Blockchain Integration**: Immutable audit trail for compliance assessments and Watchdog reports using blockchain technology.

**Video Conferencing**: Integrated video calls for analyst-enterprise consultations and training webinars.

**White-label Solution**: Rebrandable platform for governments and large enterprises to run their own CSOAI instances.

---

*This technical documentation provides a comprehensive overview of the CSOAI platform architecture. For specific implementation details, refer to inline code comments and API specifications.*
