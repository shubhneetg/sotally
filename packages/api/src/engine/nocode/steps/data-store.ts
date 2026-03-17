import { eq, and } from 'drizzle-orm';
import { db } from '../../../db/client';
import { toolUserData } from '../../../db/schema/index';

export interface DataStoreStepConfig {
  operation: 'read' | 'write' | 'append' | 'delete';
  key: string;
  value?: any;
  toolId: string;
  userId: string;
}

/**
 * Executes a data_store pipeline step.
 * Allows tools to persist per-user data between executions.
 */
export async function executeDataStoreStep(config: DataStoreStepConfig): Promise<any> {
  const { operation, key, value, toolId, userId } = config;

  switch (operation) {
    case 'read': {
      const [data] = await db
        .select({ value: toolUserData.value })
        .from(toolUserData)
        .where(and(eq(toolUserData.toolId, toolId), eq(toolUserData.userId, userId), eq(toolUserData.key, key)))
        .limit(1);
      return data?.value ?? null;
    }

    case 'write': {
      await db
        .insert(toolUserData)
        .values({ toolId, userId, key, value: value ?? null, updatedAt: new Date() })
        .onConflictDoUpdate({
          target: [toolUserData.toolId, toolUserData.userId, toolUserData.key],
          set: { value: value ?? null, updatedAt: new Date() },
        });
      return value;
    }

    case 'append': {
      // Read existing, append if array, or create new array
      const [existing] = await db
        .select({ value: toolUserData.value })
        .from(toolUserData)
        .where(and(eq(toolUserData.toolId, toolId), eq(toolUserData.userId, userId), eq(toolUserData.key, key)))
        .limit(1);

      const current = Array.isArray(existing?.value) ? existing.value : [];
      const updated = [...current, value];

      await db
        .insert(toolUserData)
        .values({ toolId, userId, key, value: updated, updatedAt: new Date() })
        .onConflictDoUpdate({
          target: [toolUserData.toolId, toolUserData.userId, toolUserData.key],
          set: { value: updated, updatedAt: new Date() },
        });
      return updated;
    }

    case 'delete': {
      await db
        .delete(toolUserData)
        .where(and(eq(toolUserData.toolId, toolId), eq(toolUserData.userId, userId), eq(toolUserData.key, key)));
      return null;
    }

    default:
      throw new Error(`Unknown data_store operation: ${operation}`);
  }
}
