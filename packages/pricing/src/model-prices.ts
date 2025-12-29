/**
 * API Provider Pricing Constants
 *
 * Hardcoded pricing rates for transcription and text generation across all providers.
 * OpenRouter returns costs directly from their API, so no hardcoded rates needed for them.
 */

// Token-based pricing (for text generation models)
export type TokenPricing = {
  inputPerMTok: number; // per 1M tokens
  outputPerMTok: number; // per 1M tokens
};

// Time-based pricing (for transcription/audio models)
export type TimePricing = {
  perHour: number; // per hour of audio
};

// Per-minute pricing (OpenAI Whisper)
export type PerMinutePricing = {
  perMinute: number; // per minute of audio
};

// Union type for any pricing
export type PricingInfo = TokenPricing | TimePricing | PerMinutePricing;

/**
 * Provider pricing database
 * All prices in USD
 * Token prices per 1M tokens
 * Audio prices per hour or per minute
 */
export const PROVIDER_PRICING = {
  openai: {
    transcription: {
      'whisper-1': { perMinute: 0.006 } as PerMinutePricing,
    },
    textGeneration: {
      'gpt-4o': { inputPerMTok: 2.5, outputPerMTok: 10.0 } as TokenPricing,
      'gpt-4o-mini': { inputPerMTok: 0.15, outputPerMTok: 0.6 } as TokenPricing,
      'gpt-4-turbo': { inputPerMTok: 0.01, outputPerMTok: 0.03 } as TokenPricing,
      'gpt-3.5-turbo': { inputPerMTok: 0.0005, outputPerMTok: 0.0015 } as TokenPricing,
    },
  },
  groq: {
    transcription: {
      'whisper-large-v3-turbo': { perHour: 0.04 } as TimePricing,
      'whisper-v3-large': { perHour: 0.111 } as TimePricing,
    },
    textGeneration: {
      'meta-llama/llama-4-scout-17b-16e-instruct': {
        inputPerMTok: 0.11,
        outputPerMTok: 0.34,
      } as TokenPricing,
      'openai/gpt-oss-120b': { inputPerMTok: 0.15, outputPerMTok: 0.6 } as TokenPricing,
      'openai/gpt-oss-20b': { inputPerMTok: 0.075, outputPerMTok: 0.3 } as TokenPricing,
    },
  },
  aldea: {
    transcription: {
      default: { perHour: 0.09 } as TimePricing,
    },
  },
  assemblyai: {
    transcription: {
      default: { perHour: 0.15 } as TimePricing,
    },
  },
  // OpenRouter: Costs come from API response via usage.cost field when usage.include=true
  // No hardcoded rates needed
} as const;

/**
 * Calculate cost for token-based pricing
 * @param inputTokens Number of input tokens
 * @param outputTokens Number of output tokens
 * @param pricing Token pricing rates
 * @returns Cost in USD
 */
export function calculateTokenCost(
  inputTokens: number,
  outputTokens: number,
  pricing: TokenPricing
): number {
  const inputCost = (inputTokens / 1_000_000) * pricing.inputPerMTok;
  const outputCost = (outputTokens / 1_000_000) * pricing.outputPerMTok;
  return inputCost + outputCost;
}

/**
 * Calculate cost for audio-based pricing (per hour or per minute)
 * @param durationMs Audio duration in milliseconds
 * @param pricing Time-based pricing rates
 * @returns Cost in USD
 */
export function calculateAudioCost(
  durationMs: number,
  pricing: TimePricing | PerMinutePricing
): number {
  if ('perMinute' in pricing) {
    const minutes = durationMs / (1000 * 60);
    return minutes * pricing.perMinute;
  } else {
    const hours = durationMs / (1000 * 60 * 60);
    return hours * pricing.perHour;
  }
}

/**
 * Get transcription pricing for a provider
 * @param provider Provider name (groq, openai, aldea, assemblyai)
 * @param model Optional model name (if provider has multiple models)
 * @returns Pricing info or null if not found
 */
export function getTranscriptionPricing(
  provider: string,
  model?: string
): TimePricing | PerMinutePricing | null {
  const normalizedProvider = provider.toLowerCase().trim();

  if (normalizedProvider.includes('groq')) {
    const pricing =
      PROVIDER_PRICING.groq.transcription[
        (model as keyof typeof PROVIDER_PRICING.groq.transcription) ||
          'whisper-large-v3-turbo'
      ];
    return pricing || null;
  }

  if (normalizedProvider.includes('openai')) {
    const pricing =
      PROVIDER_PRICING.openai.transcription[
        (model as keyof typeof PROVIDER_PRICING.openai.transcription) || 'whisper-1'
      ];
    return pricing || null;
  }

  if (normalizedProvider.includes('aldea')) {
    return PROVIDER_PRICING.aldea.transcription.default;
  }

  if (normalizedProvider.includes('assemblyai') || normalizedProvider.includes('assembly')) {
    return PROVIDER_PRICING.assemblyai.transcription.default;
  }

  return null;
}

/**
 * Get text generation pricing for a provider
 * @param provider Provider name (groq, openai)
 * @param model Optional model name (if provider has multiple models)
 * @returns Token pricing info or null if not found
 */
export function getTextGenerationPricing(
  provider: string,
  model?: string
): TokenPricing | null {
  const normalizedProvider = provider.toLowerCase().trim();

  if (normalizedProvider.includes('groq')) {
    // Default to Llama 4 Scout if no model specified
    const modelKey =
      (model as keyof typeof PROVIDER_PRICING.groq.textGeneration) ||
      'meta-llama/llama-4-scout-17b-16e-instruct';

    const pricing = PROVIDER_PRICING.groq.textGeneration[modelKey];
    return pricing || null;
  }

  if (normalizedProvider.includes('openai')) {
    // Default to gpt-4o-mini if no model specified
    const modelKey =
      (model as keyof typeof PROVIDER_PRICING.openai.textGeneration) || 'gpt-4o-mini';

    const pricing = PROVIDER_PRICING.openai.textGeneration[modelKey];
    return pricing || null;
  }

  // OpenRouter returns costs from API, so no hardcoded rates
  if (normalizedProvider.includes('openrouter')) {
    return null;
  }

  // Ollama is local, no cost
  if (normalizedProvider.includes('ollama')) {
    return null;
  }

  return null;
}

/**
 * Check if a provider returns costs from API (doesn't need calculation)
 * @param provider Provider name
 * @returns true if provider returns costs directly
 */
export function providerReturnsDirectCosts(provider: string): boolean {
  const normalizedProvider = provider.toLowerCase().trim();
  return normalizedProvider.includes('openrouter');
}

/**
 * Check if a provider is free (local inference)
 * @param provider Provider name
 * @returns true if provider is free
 */
export function isProviderFree(provider: string): boolean {
  const normalizedProvider = provider.toLowerCase().trim();
  return normalizedProvider.includes('local') || normalizedProvider.includes('ollama');
}
