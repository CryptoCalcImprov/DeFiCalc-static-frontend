const DEFAULT_MODEL = "gpt-5-mini";

export type RequestNovaResult = {
  reply: string;
  rawBody: string;
  status: number;
  headers: Record<string, string>;
};

const TIME_TOOL_NAME = "get_current_time" as const;

const TIME_TOOL_CONFIG = Object.freeze({
  type: TIME_TOOL_NAME,
});

const TIME_TOOL_GUIDANCE =
  "You can call the get_current_time tool to retrieve the current date and time. " +
  "Whenever the user asks about the current date, current time, or anything that requires real-time awareness, " +
  "call the tool first and incorporate the returned timestamp in your final response.";

const DEFAULT_BODY = {
  model: DEFAULT_MODEL,
  temperature: 0.7,
  verbosity: "medium",
  max_tokens: 2000,
  reasoning: false,
  reasoning_params: {},
  image_urls: [] as string[],
  tools: [TIME_TOOL_CONFIG] as const,
  tool_choice: "auto" as const,
};

type NovaPayload = {
  input: string;
  tools?: unknown;
  tool_choice?: unknown;
  [key: string]: unknown;
};

type RequestNovaOptions = Omit<RequestInit, "body"> & {
  payloadOverrides?: Record<string, unknown>;
  body?: BodyInit | null;
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
  options: RequestNovaOptions = {},
): Promise<RequestNovaResult> {
  const trimmedPrompt = prompt.trim();
  const promptWithToolGuidance =
    TIME_TOOL_GUIDANCE + (trimmedPrompt.length > 0 ? `\n\n${trimmedPrompt}` : "");
  const requestUrl = createRequestUrl();
  const headers = buildHeaders(options);

  const { payloadOverrides, body: overrideBody, ...requestOptions } = options;

  let mergedPayload: NovaPayload = {
    input: promptWithToolGuidance,
    ...DEFAULT_BODY,
    ...(payloadOverrides ?? {}),
  };

  if (overrideBody != null) {
    if (typeof overrideBody === "string") {
      try {
        const parsed = JSON.parse(overrideBody);
        if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
          mergedPayload = {
            ...mergedPayload,
            ...(parsed as Record<string, unknown>),
          };
        }
      } catch (error) {
        console.warn("[Nova] Failed to parse override body as JSON. Using merged payload instead.", error);
      }
    } else {
      console.warn("[Nova] Received unsupported override body type. Using merged payload instead.");
    }
  }

  const potentialInput = mergedPayload["input"];
  const selectedInput =
    typeof potentialInput === "string" && potentialInput.trim().length > 0
      ? potentialInput.trim()
      : promptWithToolGuidance;

  const finalInput =
    selectedInput.includes(TIME_TOOL_GUIDANCE) || selectedInput === TIME_TOOL_GUIDANCE
      ? selectedInput
      : `${TIME_TOOL_GUIDANCE}\n\n${selectedInput}`.trim();

  const finalPayload: NovaPayload = {
    ...mergedPayload,
    input: finalInput,
  };

  if (!Array.isArray(finalPayload.tools)) {
    finalPayload.tools = [...DEFAULT_BODY.tools];
  } else {
    const hasTimeTool = finalPayload.tools.some((tool) => {
      if (typeof tool !== "object" || tool === null) {
        return false;
      }

      const toolType = (tool as { type?: unknown }).type;
      return toolType === TIME_TOOL_NAME;
    });

    if (!hasTimeTool) {
      finalPayload.tools = [...finalPayload.tools, TIME_TOOL_CONFIG];
    }
  }

  if (typeof finalPayload.tool_choice !== "string") {
    finalPayload.tool_choice = DEFAULT_BODY.tool_choice;
  }

  const body = JSON.stringify(finalPayload);

  console.log('[Nova] Request body:', body);
  console.log('[Nova] Request details:', {
    url: requestUrl,
    method: 'POST',
    headers: Object.fromEntries(headers.entries()),
    bodyLength: body.length,
  });

  const response = await fetch(requestUrl, {
    method: "POST",
    ...requestOptions,
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
