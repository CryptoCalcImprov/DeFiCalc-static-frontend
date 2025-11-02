const STORAGE_KEYS = {
  calculator: "cryptocalc_nova_ref_id_calculator",
  assistant: "cryptocalc_nova_ref_id_assistant",
} as const;

export type NovaSessionScope = keyof typeof STORAGE_KEYS;

const memoryFallback = new Map<NovaSessionScope, string>();

function getStorage(): Storage | null {
  if (typeof window === "undefined" || typeof window.localStorage === "undefined") {
    return null;
  }

  return window.localStorage;
}

function generateRefId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return `nova-${Math.random().toString(36).slice(2)}-${Date.now()}`;
}

export function ensureNovaRefId(scope: NovaSessionScope): string {
  const storage = getStorage();
  const storageKey = STORAGE_KEYS[scope];

  if (storage) {
    const existing = storage.getItem(storageKey);
    if (existing) {
      return existing;
    }

    const fresh = generateRefId();
    storage.setItem(storageKey, fresh);
    return fresh;
  }

  if (memoryFallback.has(scope)) {
    return memoryFallback.get(scope)!;
  }

  const fresh = generateRefId();
  memoryFallback.set(scope, fresh);
  return fresh;
}

export function resetNovaRefId(scope: NovaSessionScope): string {
  const storage = getStorage();
  const storageKey = STORAGE_KEYS[scope];

  if (storage) {
    storage.removeItem(storageKey);
  }

  memoryFallback.delete(scope);

  return ensureNovaRefId(scope);
}

export function clearStoredNovaRefId(scope: NovaSessionScope): void {
  const storage = getStorage();
  const storageKey = STORAGE_KEYS[scope];

  if (storage) {
    storage.removeItem(storageKey);
  }

  memoryFallback.delete(scope);
}

