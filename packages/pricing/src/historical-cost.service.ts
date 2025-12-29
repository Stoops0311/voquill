/**
 * Historical Cost Calculation Service
 *
 * Provides utilities for calculating costs on-demand for historical transcriptions
 * that may not have stored cost data. Uses current pricing rates to retroactively
 * calculate costs from stored metadata.
 */

import { Transcription } from "@repo/types";
import {
  calculateAudioCost,
  calculateTokenCost,
  getTranscriptionPricing,
  getTextGenerationPricing,
} from "./model-prices";

export type TranscriptionCosts = {
  transcriptionCostUsd: number | null;
  postProcessingCostUsd: number | null;
  totalCostUsd: number;
};

/**
 * Get cost for a transcription - uses stored cost if available,
 * otherwise calculates from metadata (for historical data)
 *
 * @param transcription The transcription record to get costs for
 * @returns Object with breakdown of costs
 */
export function getTranscriptionCostWithFallback(
  transcription: Transcription,
): TranscriptionCosts {
  // If costs already stored, use them
  if (transcription.totalCostUsd !== null && transcription.totalCostUsd !== undefined) {
    return {
      transcriptionCostUsd: transcription.transcriptionCostUsd || null,
      postProcessingCostUsd: transcription.postProcessingCostUsd || null,
      totalCostUsd: transcription.totalCostUsd,
    };
  }

  // Otherwise, calculate from metadata
  let transcriptionCostUsd: number | null = null;
  let postProcessingCostUsd: number | null = null;

  // Calculate transcription cost from audio duration
  if (transcription.transcriptionMode && transcription.audio?.durationMs) {
    const pricing = getTranscriptionPricing(
      transcription.postProcessDevice || transcription.inferenceDevice || "",
      transcription.modelSize || undefined,
    );
    if (pricing) {
      transcriptionCostUsd = calculateAudioCost(transcription.audio.durationMs, pricing);
    }
  }

  // Calculate post-processing cost from tokens
  if (
    transcription.postProcessMode &&
    transcription.postProcessingInputTokens &&
    transcription.postProcessingOutputTokens
  ) {
    const pricing = getTextGenerationPricing(
      transcription.postProcessDevice || "",
      undefined, // We don't have the model name stored for lookup
    );
    if (pricing) {
      postProcessingCostUsd = calculateTokenCost(
        transcription.postProcessingInputTokens,
        transcription.postProcessingOutputTokens,
        pricing,
      );
    }
  }

  return {
    transcriptionCostUsd,
    postProcessingCostUsd,
    totalCostUsd: (transcriptionCostUsd || 0) + (postProcessingCostUsd || 0),
  };
}

/**
 * Get total costs for a list of transcriptions
 * Uses stored costs when available, calculates for historical data
 *
 * @param transcriptions Array of transcription records
 * @returns Aggregate cost breakdown
 */
export function aggregateTranscriptionCosts(
  transcriptions: Transcription[],
): {
  total: number;
  transcriptionTotal: number;
  postProcessingTotal: number;
  count: number;
  averageCostPerTranscription: number;
} {
  let total = 0;
  let transcriptionTotal = 0;
  let postProcessingTotal = 0;

  for (const t of transcriptions) {
    const costs = getTranscriptionCostWithFallback(t);
    total += costs.totalCostUsd;
    transcriptionTotal += costs.transcriptionCostUsd || 0;
    postProcessingTotal += costs.postProcessingCostUsd || 0;
  }

  return {
    total,
    transcriptionTotal,
    postProcessingTotal,
    count: transcriptions.length,
    averageCostPerTranscription: transcriptions.length > 0 ? total / transcriptions.length : 0,
  };
}

/**
 * Format a cost value as a readable USD string
 *
 * @param costUsd Cost in USD
 * @param decimals Number of decimal places (default: 4)
 * @returns Formatted string like "$0.0125"
 */
export function formatCostUsd(costUsd: number | null | undefined, decimals: number = 4): string {
  if (costUsd === null || costUsd === undefined) {
    return "$0.00";
  }

  const formatted = costUsd.toFixed(decimals);
  // Remove trailing zeros but keep at least 2 decimal places
  const trimmed = parseFloat(formatted).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: decimals,
  });

  return `$${trimmed}`;
}

/**
 * Check if a transcription has calculated cost data
 * (either stored or can be calculated from metadata)
 *
 * @param transcription Transcription to check
 * @returns true if cost data is available or can be calculated
 */
export function hasCostData(transcription: Transcription): boolean {
  // Has stored cost
  if (transcription.totalCostUsd !== null && transcription.totalCostUsd !== undefined) {
    return true;
  }

  // Can calculate transcription cost
  if (transcription.transcriptionMode && transcription.audio?.durationMs) {
    const pricing = getTranscriptionPricing(
      transcription.postProcessDevice || transcription.inferenceDevice || "",
      transcription.modelSize || undefined,
    );
    if (pricing) {
      return true;
    }
  }

  // Can calculate post-processing cost
  if (
    transcription.postProcessMode &&
    transcription.postProcessingInputTokens &&
    transcription.postProcessingOutputTokens
  ) {
    const pricing = getTextGenerationPricing(
      transcription.postProcessDevice || "",
      undefined,
    );
    if (pricing) {
      return true;
    }
  }

  return false;
}
