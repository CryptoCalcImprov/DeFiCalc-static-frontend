const DEFAULT_MODEL = "gpt-5-mini";
const NOVA_DISABLED =
  typeof process !== "undefined" &&
  process.env.NEXT_PUBLIC_DISABLE_NOVA?.trim().toLowerCase() === "true";

export type RequestNovaResult = {
  reply: string;
  rawBody: string;
  status: number;
  headers: Record<string, string>;
};

export type RequestNovaOptions = {
  refId?: string;
};

const DEFAULT_BODY = {
  model: DEFAULT_MODEL,
  verbosity: "medium",
  max_tokens: 8000,
  reasoning: false,
  reasoning_params: {},
  image_urls: [] as string[],
  streaming: false,
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

function appendRefIdToBody(body: BodyInit, refId: string): BodyInit {
  if (typeof body === "string") {
    try {
      const parsed = body ? JSON.parse(body) : {};
      if (parsed && typeof parsed === "object") {
        (parsed as Record<string, unknown>).ref_id = refId;
        return JSON.stringify(parsed);
      }
    } catch (error) {
      console.warn("[Nova] Failed to parse request body while appending ref_id:", error);
    }
    return body;
  }

  if (body instanceof URLSearchParams) {
    const params = new URLSearchParams(body.toString());
    params.set("ref_id", refId);
    return params;
  }

  if (typeof FormData !== "undefined" && body instanceof FormData) {
    const clone = new FormData();
    body.forEach((value, key) => {
      clone.append(key, value);
    });
    clone.set("ref_id", refId);
    return clone;
  }

  return body;
}

async function executeNovaFetch(
  requestUrl: string,
  options: Partial<RequestInit>,
  headers: Headers,
  body: BodyInit,
) {
  return fetch(requestUrl, {
    method: "POST",
    ...options,
    headers,
    body,
  });
}

export async function requestNova(
  prompt: string,
  options: Partial<RequestInit> = {},
  { refId }: RequestNovaOptions = {},
): Promise<RequestNovaResult> {
  if (NOVA_DISABLED) {
    console.info("[Nova] Requests are disabled via NEXT_PUBLIC_DISABLE_NOVA.");
    return {
      reply: "Nova AI calls are disabled. Set NEXT_PUBLIC_DISABLE_NOVA=false to re-enable.",
      rawBody: "",
      status: 0,
      headers: {},
    };
  }

  const trimmedPrompt = prompt.trim();
  const requestUrl = createRequestUrl();
  const headers = buildHeaders(options);

  let body: BodyInit =
    options.body ??
    JSON.stringify({
      input: trimmedPrompt,
      ...DEFAULT_BODY,
    });

  if (refId) {
    body = appendRefIdToBody(body, refId);
  }

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

  const response = await executeNovaFetch(requestUrl, options, headers, body);

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

export async function clearNovaHistory(refId: string, options: Partial<RequestInit> = {}): Promise<void> {
  const requestUrl = createRequestUrl();
  const headers = buildHeaders(options);
  let deleteUrl: string;

  try {
    const parsed = new URL(
      requestUrl,
      requestUrl.startsWith("http")
        ? undefined
        : typeof window !== "undefined"
          ? window.location.origin
          : undefined,
    );
    parsed.searchParams.set("ref_id", refId);
    deleteUrl = parsed.toString();
  } catch (error) {
    console.warn("[Nova] Failed to build DELETE URL via URL API, falling back to manual construction:", error);
    const separator = requestUrl.includes("?") ? "&" : "?";
    deleteUrl = `${requestUrl}${separator}ref_id=${encodeURIComponent(refId)}`;
  }

  const response = await fetch(deleteUrl, {
    method: "DELETE",
    ...options,
    headers,
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `Failed to clear Nova history (status ${response.status})`);
  }
}
