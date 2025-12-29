import { PostProcessingMode, TranscriptionMode } from "./common.types";

export type Transcription = {
  id: string;
  createdAt: string;
  createdByUserId: string;
  transcript: string;
  isDeleted: boolean;
  audio?: TranscriptionAudioSnapshot;
  modelSize?: string | null;
  inferenceDevice?: string | null;
  rawTranscript?: string | null;
  transcriptionPrompt?: string | null;
  postProcessPrompt?: string | null;
  transcriptionApiKeyId?: string | null;
  postProcessApiKeyId?: string | null;
  transcriptionMode?: TranscriptionMode | null;
  postProcessMode?: PostProcessingMode | null;
  postProcessDevice?: string | null;
  transcriptionDurationMs?: number | null;
  postprocessDurationMs?: number | null;
  warnings?: string[] | null;

  // Token tracking (for API-based transcription/post-processing)
  transcriptionInputTokens?: number | null;
  transcriptionOutputTokens?: number | null;
  postProcessingInputTokens?: number | null;
  postProcessingOutputTokens?: number | null;
  totalTokens?: number | null;

  // Cost tracking (USD)
  transcriptionCostUsd?: number | null;
  postProcessingCostUsd?: number | null;
  totalCostUsd?: number | null;
};

export type TranscriptionAudioSnapshot = {
  filePath: string;
  durationMs: number;
};
