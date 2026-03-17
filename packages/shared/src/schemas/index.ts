import { z } from "zod";

// ─── Auth Schemas ────────────────────────────────────────────────────────────

export const registerSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(128, "Password must be at most 128 characters")
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      "Password must contain at least one uppercase letter, one lowercase letter, and one number"
    ),
  name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name must be at most 100 characters")
    .trim(),
  referralCode: z.string().max(50).optional(),
});

export type RegisterInput = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export type LoginInput = z.infer<typeof loginSchema>;

// ─── Tool Pricing Schemas ────────────────────────────────────────────────────

const freePricingSchema = z.object({
  model: z.literal("free"),
});

const perRunPricingSchema = z.object({
  model: z.literal("per_run"),
  creditsPerRun: z.number().int().min(1, "Must charge at least 1 credit"),
});

const pricingTierSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  credits: z.number().int().min(1),
  description: z.string().optional(),
});

const tieredPricingSchema = z.object({
  model: z.literal("tiered"),
  tiers: z
    .array(pricingTierSchema)
    .min(1, "At least one pricing tier is required"),
});

const subscriptionPricingSchema = z.object({
  model: z.literal("subscription"),
  creditsPerMonth: z.number().int().min(1),
  includedExecutions: z.number().int().min(1),
  overageCreditsPerRun: z.number().int().min(1),
});

const toolPricingSchema = z.discriminatedUnion("model", [
  freePricingSchema,
  perRunPricingSchema,
  tieredPricingSchema,
  subscriptionPricingSchema,
]);

// ─── Tool Schemas ────────────────────────────────────────────────────────────

export const createToolSchema = z.object({
  name: z
    .string()
    .min(3, "Tool name must be at least 3 characters")
    .max(80, "Tool name must be at most 80 characters")
    .trim(),
  slug: z
    .string()
    .min(3, "Slug must be at least 3 characters")
    .max(80, "Slug must be at most 80 characters")
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must be lowercase alphanumeric with hyphens"),
  description: z
    .string()
    .min(10, "Description must be at least 10 characters")
    .max(300, "Description must be at most 300 characters")
    .trim(),
  longDescription: z
    .string()
    .max(5000, "Long description must be at most 5000 characters")
    .trim()
    .optional(),
  categoryId: z.string().uuid("Invalid category ID").optional(),
  executionType: z.enum(["prompt", "pipeline", "docker", "external_api"]),
  pricing: toolPricingSchema,
  inputSchema: z.record(z.unknown()).optional(),
  outputSchema: z.record(z.unknown()).optional(),
  config: z.record(z.unknown()).optional(),
  iconUrl: z.string().url().nullable().optional(),
  tags: z.array(z.string().max(30)).max(10, "Maximum 10 tags").optional(),
});

export type CreateToolInput = z.infer<typeof createToolSchema>;

// ─── Execution Schemas ───────────────────────────────────────────────────────

export const executeToolSchema = z.object({
  toolId: z.string().uuid("Invalid tool ID"),
  input: z.record(z.unknown()).default({}),
});

export type ExecuteToolInput = z.infer<typeof executeToolSchema>;

// ─── Credit Schemas ──────────────────────────────────────────────────────────

export const purchaseCreditsSchema = z.object({
  packageId: z.string().min(1, "Package ID is required"),
});

export type PurchaseCreditsInput = z.infer<typeof purchaseCreditsSchema>;

// ─── Review Schemas ──────────────────────────────────────────────────────────

export const createReviewSchema = z.object({
  toolId: z.string().uuid("Invalid tool ID"),
  rating: z
    .number()
    .int()
    .min(1, "Rating must be at least 1")
    .max(5, "Rating must be at most 5"),
  comment: z
    .string()
    .max(2000, "Comment must be at most 2000 characters")
    .trim()
    .optional(),
});

export type CreateReviewInput = z.infer<typeof createReviewSchema>;
