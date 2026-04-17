export interface EvaluationResult {
  prompt_adherence: number;
  temporal_consistency: number;
  physical_logic: number;
  overall: number;
  failure_reasons: string[];
  repair_suggestions: string[];
}

export interface IterationResult {
  iteration: number;
  prompt: string;
  videoUrl: string;
  scores: EvaluationResult;
  healed: boolean;
}

export interface PipelineEvent {
  type:
    | "iteration_start"
    | "generating"
    | "evaluating"
    | "healing"
    | "iteration_done"
    | "done"
    | "error";
  iteration?: number;
  prompt?: string;
  videoUrl?: string;
  scores?: EvaluationResult;
  repairedPrompt?: string;
  bestIteration?: IterationResult;
  allIterations?: IterationResult[];
  message?: string;
}

export interface BenchmarkPrompt {
  id: string;
  label: string;
  prompt: string;
  threshold: number;
}

export interface PromptResult {
  promptId: string;
  label: string;
  prompt: string;
  videos: string[];
  scores: EvaluationResult[];
  avgScore: number;
  baselineDelta: number | null;
  status: "pass" | "fail";
  threshold: number;
}

export interface SuiteRun {
  id: string;
  timestamp: string;
  results: PromptResult[];
  passed: number;
  failed: number;
  status: "pass" | "fail";
}

export interface SuiteBaseline {
  [promptId: string]: number;
}

export interface SuiteEvent {
  type: "prompt_start" | "prompt_done" | "done" | "error";
  promptId?: string;
  label?: string;
  result?: PromptResult;
  run?: SuiteRun;
  message?: string;
}
