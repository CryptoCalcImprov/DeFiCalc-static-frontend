const DEFAULT_MODEL = "gpt-5-mini";

export type RequestNovaResult = {
  reply: string;
  rawBody: string;
  status: number;
  headers: Record<string, string>;
};

const DEFAULT_BODY = {
  model: DEFAULT_MODEL,
  temperature: 0.7,
  verbosity: "medium",
  max_tokens: 2000,
  reasoning: false,
  reasoning_params: {},
  image_urls: [] as string[],
};

function createRequestUrl() {
  const baseUrl =
    process.env.NODE_ENV !== "development" ? process.env.NEXT_PUBLIC_NOVA_API_URL?.trim() : undefined;
  let requestUrl = "/ai";

  if (baseUrl) {
    const sanitized = baseUrl.endsWith("/ai") ? baseUrl : `${baseUrl.replace(/\/$/, "")}/ai`;
    requestUrl = sanitized;
  }

  try {
    const parsedUrl = new URL(
      requestUrl,
      requestUrl.startsWith("http") ? undefined : typeof window !== "undefined" ? window.location.origin : undefined,
    );
    return parsedUrl.toString();
  } catch (error) {
    return requestUrl;
  }
}

function buildHeaders(options?: Partial<RequestInit>) {
  const headers = new Headers({
    "Content-Type": "application/json",
  });

  if (options?.headers) {
    const extraHeaders = new Headers(options.headers as HeadersInit);
    extraHeaders.forEach((value, key) => {
      headers.set(key, value);
    });
  }

  const apiKey = process.env.NEXT_PUBLIC_NOVA_API_KEY?.trim();
  if (apiKey && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${apiKey}`);
  }

  return headers;
}

export async function requestNova(
  prompt: string,
  options: Partial<RequestInit> = {},
): Promise<RequestNovaResult> {
  const trimmedPrompt = prompt.trim();
  const requestUrl = createRequestUrl();
  const headers = buildHeaders(options);

  const body =
    options.body ??
    JSON.stringify({
      input: trimmedPrompt,
      ...DEFAULT_BODY,
    });

  const response = await fetch(requestUrl, {
    method: "POST",
    ...options,
    headers,
    body,
  });

  const contentType = response.headers.get("content-type") ?? "";
  const rawBody = await response.text();
  let assistantReply: unknown = rawBody;

  if (contentType.includes("application/json")) {
    try {
      const data = rawBody ? JSON.parse(rawBody) : null;
      assistantReply =
        data?.output ??
        data?.message ??
        data?.content ??
        data?.reply ??
        data?.text ??
        data?.choices?.[0]?.message?.content ??
        (typeof data === "string" ? data : data ? JSON.stringify(data) : "");
    } catch (jsonError) {
      assistantReply = rawBody;
    }
  }

  const resolvedReply = typeof assistantReply === "string" ? assistantReply : String(assistantReply ?? "");
  const trimmedReply = resolvedReply.trim();

  if (!response.ok) {
    throw new Error(trimmedReply || rawBody || `Nova responded with status ${response.status}`);
  }

  return {
    reply: resolvedReply,
    rawBody,
    status: response.status,
    headers: Object.fromEntries(response.headers.entries()),
  };
}
