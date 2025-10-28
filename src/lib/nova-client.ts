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

  let bodyPreview = "";
  let bodyLength: number | undefined;

  if (typeof body === "string") {
    bodyPreview = body;
    bodyLength = new TextEncoder().encode(body).length;
  } else if (body instanceof URLSearchParams) {
    const serialized = body.toString();
    bodyPreview = serialized;
    bodyLength = new TextEncoder().encode(serialized).length;
  } else if (body instanceof Blob) {
    bodyPreview = `[Blob ${body.type || "unknown"}]`;
    bodyLength = body.size;
  } else if (body instanceof ArrayBuffer) {
    bodyPreview = `[ArrayBuffer length=${body.byteLength}]`;
    bodyLength = body.byteLength;
  } else if (ArrayBuffer.isView(body)) {
    bodyPreview = `[TypedArray length=${body.byteLength}]`;
    bodyLength = body.byteLength;
  } else {
    bodyPreview = "[Body stream]";
  }

  console.log("[Nova] Request body:", bodyPreview);
  console.log("[Nova] Request details:", {
    url: requestUrl,
    method: "POST",
    headers: Object.fromEntries(headers.entries()),
    bodyLength,
  });

  const response = await fetch(requestUrl, {
    method: "POST",
    ...options,
    headers,
    body,
  });

  const contentType = response.headers.get("content-type") ?? "";
  const rawBody = await response.text();
  
  console.log('[Nova] Response received');
  console.log('[Nova] Status:', response.status);
  console.log('[Nova] Content-Type:', contentType);
  console.log('[Nova] Raw body:', rawBody);
  
  let assistantReply: unknown = rawBody;

  if (contentType.includes("application/json")) {
    try {
      const data = rawBody ? JSON.parse(rawBody) : null;
      
      console.log('[Nova] Parsed JSON data:', JSON.stringify(data, null, 2));
      
      // Check if text field exists but is empty - this might be an error
      if (data?.text === "") {
        console.warn('[Nova] Empty text field detected. Checking for alternative fields...');
        console.log('[Nova] Full response structure:', Object.keys(data || {}));
        
        // If we have other fields that might contain data, log them
        if (data.tool_calls && Array.isArray(data.tool_calls) && data.tool_calls.length > 0) {
          console.log('[Nova] Tool calls detected:', data.tool_calls);
        }
      }
      
      // Try to find content in various fields
      assistantReply =
        data?.text ?? // Check text first for Nova gateway responses
        data?.output ??
        data?.message ??
        data?.content ??
        data?.reply ??
        data?.choices?.[0]?.message?.content ??
        (typeof data === "string" ? data : data ? JSON.stringify(data) : "");
      
      console.log('[Nova] Extracted assistant reply:', typeof assistantReply, assistantReply?.toString().substring(0, 200));
    } catch (jsonError) {
      console.error('[Nova] Failed to parse JSON:', jsonError);
      assistantReply = rawBody;
    }
  }

  const resolvedReply = typeof assistantReply === "string" ? assistantReply : String(assistantReply ?? "");
  const trimmedReply = resolvedReply.trim();
  
  console.log('[Nova] Resolved reply:', trimmedReply.substring(0, 200));
  console.log('[Nova] Trimmed reply length:', trimmedReply.length);

  if (!response.ok) {
    throw new Error(trimmedReply || rawBody || `Nova responded with status ${response.status}`);
  }

  // If we got a successful response but no content, log it as a warning
  if (trimmedReply.length === 0) {
    console.warn('[Nova] Empty reply received from successful response. Raw body:', rawBody);
  }

  return {
    reply: resolvedReply,
    rawBody,
    status: response.status,
    headers: Object.fromEntries(response.headers.entries()),
  };
}
