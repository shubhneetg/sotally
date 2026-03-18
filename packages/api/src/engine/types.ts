// ============================================================
// V2 App Generation Engine — Type Definitions
// ============================================================

export const APP_TYPES = [
  'tracker',
  'calculator',
  'quiz',
  'generator',
  'planner',
  'diary',
  'dashboard',
  'form',
] as const;

export type AppType = (typeof APP_TYPES)[number];

// ─── Intent Parsing ──────────────────────────────────────────

export interface AppIntent {
  app_type: AppType;
  title: string;
  description: string;
  features: string[];
  data_model: DataModelField[];
  ui_style: UiStyle;
  niche: string | null;
  template_id: string | null;
  confidence: number;
}

export interface DataModelField {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'date' | 'array' | 'object';
  required: boolean;
  description: string;
}

export interface UiStyle {
  layout: 'single-page' | 'tabbed' | 'wizard' | 'dashboard';
  colorScheme: 'light' | 'dark' | 'auto';
  primaryColor: string;
  rounded: boolean;
}

// ─── App Spec (architecture output) ─────────────────────────

export interface AppSpec {
  components: ComponentSpec[];
  routes: RouteSpec[];
  state: StateSpec;
  styling: StylingSpec;
}

export interface ComponentSpec {
  name: string;
  file_path: string;
  props: PropSpec[];
  description: string;
}

export interface PropSpec {
  name: string;
  type: string;
  required: boolean;
}

export interface RouteSpec {
  path: string;
  component: string;
  label: string;
}

export interface StateSpec {
  stores: Record<string, string>;
  persistence: 'localStorage' | 'none';
}

export interface StylingSpec {
  framework: 'tailwind';
  theme: Record<string, string>;
}

// ─── Code Generation ────────────────────────────────────────

export interface GenerationResult {
  success: boolean;
  files: Record<string, string>;
  errors?: string[];
  tokenUsage?: {
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
  };
}

export interface IterationRequest {
  app_id: string;
  prompt: string;
  edit_type: 'add_feature' | 'fix_bug' | 'restyle' | 'iterate';
  current_source: Record<string, string>;
}

// ─── Validation ─────────────────────────────────────────────

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

// ─── Bundling ───────────────────────────────────────────────

export interface BundleResult {
  html: string;
  bundleSizeBytes: number;
}

// ─── Pipeline ───────────────────────────────────────────────

export interface PipelineParams {
  prompt: string;
  creatorId: string;
  appId?: string;
  type: 'initial' | 'iterate';
  existingSource?: Record<string, string>;
}

export interface PipelineResult {
  success: boolean;
  appId: string;
  versionNumber: number;
  bundleUrl: string;
  generationId: string;
  tokenUsage?: {
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
  };
  errors?: string[];
}

// ─── Worker Job Data ────────────────────────────────────────

export interface GenerationJobData {
  generationId: string;
  appId: string;
  creatorId: string;
  prompt: string;
  type: 'initial' | 'iterate';
  existingSource?: Record<string, string>;
  niche?: string;
}
