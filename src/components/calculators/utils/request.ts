type NovaRequestOverrides = Partial<{
  model: string;
  temperature: number;
  verbosity: string;
  max_tokens: number;
  reasoning: boolean;
  reasoning_params: Record<string, unknown>;
  image_urls: string[];
  bodyExtras: Record<string, unknown>;
  refId: string;
}>;

const DEFAULT_NOVA_PAYLOAD = {
  model: "gpt-5-mini",
  temperature: 0.0,
  verbosity: "low",
  max_tokens: 50000,
  reasoning: true,
  reasoning_params: {},
  image_urls: [] as string[],
};

export function buildNovaRequestOptions(prompt: string, overrides: NovaRequestOverrides = {}) {
  const {
    model,
    temperature,
    verbosity,
    max_tokens,
    reasoning,
    reasoning_params,
    image_urls,
    bodyExtras,
    refId,
  } = overrides;

  const payload = {
    input: prompt.trim(),
    ...DEFAULT_NOVA_PAYLOAD,
    ...(model !== undefined ? { model } : {}),
    ...(temperature !== undefined ? { temperature } : {}),
    ...(verbosity !== undefined ? { verbosity } : {}),
    ...(max_tokens !== undefined ? { max_tokens } : {}),
    ...(reasoning !== undefined ? { reasoning } : {}),
    ...(reasoning_params !== undefined ? { reasoning_params } : {}),
    ...(image_urls !== undefined ? { image_urls } : {}),
    ...(refId ? { ref_id: refId } : {}),
    ...bodyExtras,
  };

  return {
    prompt,
    options: {
      body: JSON.stringify(payload),
    } satisfies Partial<RequestInit>,
  };
}
