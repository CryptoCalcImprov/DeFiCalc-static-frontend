export type UtcClockInfo = {
  currentUtcDate: string;
  currentUtcIso: string;
};

export function getCurrentUtcClockInfo(): UtcClockInfo {
  const now = new Date();
  const currentUtcIso = now.toISOString();
  return {
    currentUtcIso,
    currentUtcDate: currentUtcIso.slice(0, 10),
  };
}
