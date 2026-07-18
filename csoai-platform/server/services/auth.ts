/**
 * CSOAI Authentication Service
 *
 * Handles JWT token generation, verification, and user authentication.
 * Supports both database-backed and mock authentication for development.
 */

import * as jose from 'jose';
import type { User } from '../db/schema';
import { nanoid } from 'nanoid';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'csoai-development-secret-change-in-production'
);

const JWT_ISSUER = 'csoai';
const JWT_AUDIENCE = 'csoai-platform';

// In-memory user store for development (when no database is available)
const mockUsers = new Map<string, User & { passwordHash: string }>();

// Initialize with demo users
const initMockUsers = async () => {
  if (mockUsers.size === 0) {
    const demoPasswordHash = await hashPassword('demo123');
    const adminPasswordHash = await hashPassword('admin123');

    // Demo user
    mockUsers.set('demo@csoai.com', {
      id: 1,
      openId: nanoid(),
      email: 'demo@csoai.com',
      name: 'Demo User',
      role: 'user',
      loginMethod: 'email',
      stripeCustomerId: null,
      stripeSubscriptionId: null,
      subscriptionTier: 'free',
      subscriptionStatus: 'none',
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
      passwordHash: demoPasswordHash,
    });

    // Admin user
    mockUsers.set('admin@csoai.com', {
      id: 2,
      openId: nanoid(),
      email: 'admin@csoai.com',
      name: 'Admin User',
      role: 'admin',
      loginMethod: 'email',
      stripeCustomerId: null,
      stripeSubscriptionId: null,
      subscriptionTier: 'enterprise',
      subscriptionStatus: 'active',
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
      passwordHash: adminPasswordHash,
    });

    // Analyst user
    mockUsers.set('analyst@csoai.com', {
      id: 3,
      openId: nanoid(),
      email: 'analyst@csoai.com',
      name: 'AI Safety Analyst',
      role: 'watchdog_analyst',
      loginMethod: 'email',
      stripeCustomerId: null,
      stripeSubscriptionId: null,
      subscriptionTier: 'pro',
      subscriptionStatus: 'active',
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
      passwordHash: demoPasswordHash,
    });

    // Enterprise user
    mockUsers.set('enterprise@csoai.com', {
      id: 4,
      openId: nanoid(),
      email: 'enterprise@csoai.com',
      name: 'Enterprise Admin',
      role: 'enterprise_admin',
      loginMethod: 'email',
      stripeCustomerId: null,
      stripeSubscriptionId: null,
      subscriptionTier: 'enterprise',
      subscriptionStatus: 'active',
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
      passwordHash: demoPasswordHash,
    });
  }
};

// Initialize mock users on module load
initMockUsers();

/**
 * Generate a JWT token for a user
 */
export async function generateToken(user: User): Promise<string> {
  const token = await new jose.SignJWT({
    sub: user.id.toString(),
    email: user.email,
    role: user.role,
    name: user.name,
    tier: user.subscriptionTier,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setIssuer(JWT_ISSUER)
    .setAudience(JWT_AUDIENCE)
    .setExpirationTime('24h')
    .sign(JWT_SECRET);

  return token;
}

/**
 * Verify a JWT token and return the user
 */
export async function verifyToken(token: string): Promise<User | null> {
  try {
    const { payload } = await jose.jwtVerify(token, JWT_SECRET, {
      issuer: JWT_ISSUER,
      audience: JWT_AUDIENCE,
    });

    // Return a partial user object from the token payload
    return {
      id: parseInt(payload.sub as string),
      openId: '',
      email: payload.email as string,
      name: payload.name as string || null,
      role: payload.role as User['role'],
      loginMethod: null,
      stripeCustomerId: null,
      stripeSubscriptionId: null,
      subscriptionTier: (payload.tier as User['subscriptionTier']) || 'free',
      subscriptionStatus: 'none',
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    };
  } catch (error) {
    console.error('[Auth] Token verification failed:', error);
    return null;
  }
}

/**
 * Hash a password using Web Crypto API with salt
 */
export async function hashPassword(password: string): Promise<string> {
  // Add a salt for better security
  const salt = 'csoai_salt_v1_';
  const encoder = new TextEncoder();
  const data = encoder.encode(salt + password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
}

/**
 * Verify a password against a hash
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  const passwordHash = await hashPassword(password);
  return passwordHash === hash;
}

/**
 * Authenticate a user by email and password
 * Returns user and token if successful, null otherwise
 */
export async function authenticateUser(
  email: string,
  password: string
): Promise<{ user: User; token: string } | null> {
  await initMockUsers();

  // Check mock users first (for development)
  const mockUser = mockUsers.get(email.toLowerCase());
  if (mockUser) {
    const isValid = await verifyPassword(password, mockUser.passwordHash);
    if (isValid) {
      const { passwordHash, ...user } = mockUser;
      const token = await generateToken(user);
      return { user, token };
    }
  }

  // TODO: Check database for real users when DATABASE_URL is configured
  // const db = await getDb();
  // if (db) {
  //   const [dbUser] = await db.select().from(users).where(eq(users.email, email));
  //   if (dbUser && await verifyPassword(password, dbUser.passwordHash)) {
  //     const token = await generateToken(dbUser);
  //     return { user: dbUser, token };
  //   }
  // }

  return null;
}

/**
 * Register a new user
 * Returns user and token if successful
 */
export async function registerUser(
  email: string,
  password: string,
  name: string
): Promise<{ user: User; token: string } | null> {
  await initMockUsers();

  // Check if user already exists
  if (mockUsers.has(email.toLowerCase())) {
    return null;
  }

  const passwordHash = await hashPassword(password);
  const newUser: User & { passwordHash: string } = {
    id: mockUsers.size + 1,
    openId: nanoid(),
    email: email.toLowerCase(),
    name,
    role: 'user',
    loginMethod: 'email',
    stripeCustomerId: null,
    stripeSubscriptionId: null,
    subscriptionTier: 'free',
    subscriptionStatus: 'none',
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
    passwordHash,
  };

  mockUsers.set(email.toLowerCase(), newUser);

  const { passwordHash: _, ...user } = newUser;
  const token = await generateToken(user);

  return { user, token };
}

/**
 * Get user by email (for password reset, etc.)
 */
export async function getUserByEmail(email: string): Promise<User | null> {
  await initMockUsers();

  const mockUser = mockUsers.get(email.toLowerCase());
  if (mockUser) {
    const { passwordHash, ...user } = mockUser;
    return user;
  }

  return null;
}

/**
 * Get all available demo accounts (for development UI)
 */
export function getDemoAccounts() {
  return [
    { email: 'demo@csoai.com', password: 'demo123', role: 'user', description: 'Standard user account' },
    { email: 'admin@csoai.com', password: 'admin123', role: 'admin', description: 'Administrator account' },
    { email: 'analyst@csoai.com', password: 'demo123', role: 'watchdog_analyst', description: 'AI Safety Analyst' },
    { email: 'enterprise@csoai.com', password: 'demo123', role: 'enterprise_admin', description: 'Enterprise admin' },
  ];
}
