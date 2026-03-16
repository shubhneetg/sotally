import { Hono } from 'hono';
import { eq, and } from 'drizzle-orm';
import { randomBytes, scrypt, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';
import { db } from '../db/client.js';
import { users, apiKeys } from '../db/schema/index.js';
import { authMiddleware, type AuthUser } from '../middleware/auth.js';
import { encrypt, decrypt, maskKey } from '../lib/encryption.js';
import { env } from '../lib/env.js';

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString('hex');
  const derived = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${salt}:${derived.toString('hex')}`;
}

async function verifyPassword(password: string, hash: string): Promise<boolean> {
  const [salt, key] = hash.split(':');
  const derived = (await scryptAsync(password, salt, 64)) as Buffer;
  const keyBuffer = Buffer.from(key, 'hex');
  return timingSafeEqual(derived, keyBuffer);
}

const settingsRoutes = new Hono();

// All settings routes require auth
settingsRoutes.use('*', authMiddleware);

// GET /settings/profile — Get current user profile
settingsRoutes.get('/profile', async (c) => {
  const authUser = c.get('user') as AuthUser;

  const [user] = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      avatarUrl: users.avatarUrl,
      role: users.role,
      creditBalance: users.creditBalance,
      earningsBalance: users.earningsBalance,
      referralCode: users.referralCode,
      createdAt: users.createdAt,
    })
    .from(users)
    .where(eq(users.id, authUser.id))
    .limit(1);

  if (!user) {
    return c.json(
      { success: false, data: null, error: { code: 'NOT_FOUND', message: 'User not found' } },
      404,
    );
  }

  return c.json({ success: true, data: { user }, error: null });
});

// PATCH /settings/profile — Update name, avatarUrl
settingsRoutes.patch('/profile', async (c) => {
  const authUser = c.get('user') as AuthUser;
  const body = await c.req.json();
  const { name, avatarUrl } = body;

  const updates: Record<string, any> = { updatedAt: new Date() };

  if (name !== undefined) {
    if (typeof name !== 'string' || name.trim().length < 1 || name.trim().length > 255) {
      return c.json(
        { success: false, data: null, error: { code: 'VALIDATION_ERROR', message: 'Name must be 1-255 characters' } },
        400,
      );
    }
    updates.name = name.trim();
  }

  if (avatarUrl !== undefined) {
    if (avatarUrl !== null && (typeof avatarUrl !== 'string' || avatarUrl.length > 500)) {
      return c.json(
        { success: false, data: null, error: { code: 'VALIDATION_ERROR', message: 'Invalid avatar URL' } },
        400,
      );
    }
    updates.avatarUrl = avatarUrl;
  }

  const [updated] = await db
    .update(users)
    .set(updates)
    .where(eq(users.id, authUser.id))
    .returning({
      id: users.id,
      name: users.name,
      email: users.email,
      avatarUrl: users.avatarUrl,
    });

  return c.json({ success: true, data: { user: updated }, error: null });
});

// POST /settings/change-password — Change password
settingsRoutes.post('/change-password', async (c) => {
  const authUser = c.get('user') as AuthUser;
  const body = await c.req.json();
  const { currentPassword, newPassword } = body;

  if (!currentPassword || !newPassword) {
    return c.json(
      {
        success: false,
        data: null,
        error: { code: 'VALIDATION_ERROR', message: 'currentPassword and newPassword are required' },
      },
      400,
    );
  }

  if (typeof newPassword !== 'string' || newPassword.length < 8) {
    return c.json(
      {
        success: false,
        data: null,
        error: { code: 'VALIDATION_ERROR', message: 'New password must be at least 8 characters' },
      },
      400,
    );
  }

  // Fetch current password hash
  const [user] = await db
    .select({ passwordHash: users.passwordHash })
    .from(users)
    .where(eq(users.id, authUser.id))
    .limit(1);

  if (!user || !user.passwordHash) {
    return c.json(
      {
        success: false,
        data: null,
        error: { code: 'BAD_REQUEST', message: 'Password change not available for this account' },
      },
      400,
    );
  }

  const valid = await verifyPassword(currentPassword, user.passwordHash);
  if (!valid) {
    return c.json(
      {
        success: false,
        data: null,
        error: { code: 'INVALID_CREDENTIALS', message: 'Current password is incorrect' },
      },
      401,
    );
  }

  const newHash = await hashPassword(newPassword);
  await db
    .update(users)
    .set({ passwordHash: newHash, updatedAt: new Date() })
    .where(eq(users.id, authUser.id));

  return c.json({ success: true, data: { changed: true }, error: null });
});

// GET /settings/api-keys — List BYOM API keys (masked)
settingsRoutes.get('/api-keys', async (c) => {
  const authUser = c.get('user') as AuthUser;

  const keys = await db
    .select({
      id: apiKeys.id,
      provider: apiKeys.provider,
      label: apiKeys.label,
      serviceType: apiKeys.serviceType,
      encryptedKey: apiKeys.encryptedKey,
      createdAt: apiKeys.createdAt,
    })
    .from(apiKeys)
    .where(eq(apiKeys.userId, authUser.id));

  // Decrypt and mask keys
  const masked = keys.map((k) => {
    let maskedValue = '****';
    try {
      const decrypted = decrypt(k.encryptedKey, env.API_KEY_ENCRYPTION_KEY);
      maskedValue = maskKey(decrypted);
    } catch {
      // If decryption fails, show generic mask
    }

    return {
      id: k.id,
      provider: k.provider,
      label: k.label,
      serviceType: k.serviceType,
      maskedKey: maskedValue,
      createdAt: k.createdAt,
    };
  });

  return c.json({ success: true, data: { keys: masked }, error: null });
});

// POST /settings/api-keys — Add new BYOM key
settingsRoutes.post('/api-keys', async (c) => {
  const authUser = c.get('user') as AuthUser;
  const body = await c.req.json();
  const { provider, apiKey, label, serviceType } = body;

  if (!provider || !apiKey) {
    return c.json(
      {
        success: false,
        data: null,
        error: { code: 'VALIDATION_ERROR', message: 'provider and apiKey are required' },
      },
      400,
    );
  }

  if (typeof apiKey !== 'string' || apiKey.length < 4) {
    return c.json(
      {
        success: false,
        data: null,
        error: { code: 'VALIDATION_ERROR', message: 'apiKey must be at least 4 characters' },
      },
      400,
    );
  }

  // Encrypt the key with AES-256-GCM
  const encryptedKey = encrypt(apiKey, env.API_KEY_ENCRYPTION_KEY);

  const [created] = await db
    .insert(apiKeys)
    .values({
      userId: authUser.id,
      provider,
      encryptedKey,
      label: label ?? null,
      serviceType: serviceType ?? null,
    })
    .returning({
      id: apiKeys.id,
      provider: apiKeys.provider,
      label: apiKeys.label,
      serviceType: apiKeys.serviceType,
      createdAt: apiKeys.createdAt,
    });

  return c.json(
    {
      success: true,
      data: {
        ...created,
        maskedKey: maskKey(apiKey),
      },
      error: null,
    },
    201,
  );
});

// DELETE /settings/api-keys/:id — Delete a BYOM key (must own)
settingsRoutes.delete('/api-keys/:id', async (c) => {
  const authUser = c.get('user') as AuthUser;
  const id = c.req.param('id')!;

  const [existing] = await db
    .select({ id: apiKeys.id, userId: apiKeys.userId })
    .from(apiKeys)
    .where(eq(apiKeys.id, id))
    .limit(1);

  if (!existing) {
    return c.json(
      { success: false, data: null, error: { code: 'NOT_FOUND', message: 'API key not found' } },
      404,
    );
  }

  if (existing.userId !== authUser.id) {
    return c.json(
      { success: false, data: null, error: { code: 'FORBIDDEN', message: 'You can only delete your own API keys' } },
      403,
    );
  }

  await db.delete(apiKeys).where(eq(apiKeys.id, id));

  return c.json({ success: true, data: { deleted: true }, error: null });
});

export default settingsRoutes;
