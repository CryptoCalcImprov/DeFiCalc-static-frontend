const IMGBB_API_ENDPOINT = "https://api.imgbb.com/1/upload";

type ImgbbSuccessResponse = {
  data?: {
    url?: string;
  };
  success?: boolean;
  error?: {
    message?: string;
  };
};

function extractBase64Payload(dataUrl: string): string {
  if (!dataUrl.includes(",")) {
    return dataUrl;
  }
  const [, base64] = dataUrl.split(",", 2);
  return base64;
}

/**
 * Uploads a base64-encoded PNG to imgBB and returns the hosted URL.
 */
export async function uploadImageToImgbb(dataUrl: string): Promise<string> {
  const apiKey = process.env.NEXT_PUBLIC_IMGBB_API_KEY;
  if (!apiKey) {
    throw new Error("Missing NEXT_PUBLIC_IMGBB_API_KEY");
  }

  const formData = new FormData();
  formData.set("key", apiKey);
  formData.set("image", extractBase64Payload(dataUrl));

  const response = await fetch(IMGBB_API_ENDPOINT, {
    method: "POST",
    body: formData,
  });

  const payload = (await response.json()) as ImgbbSuccessResponse;
  if (!response.ok || !payload?.success || !payload?.data?.url) {
    const message = payload?.error?.message ?? `imgBB upload failed with status ${response.status}`;
    throw new Error(message);
  }

  return payload.data.url;
}
