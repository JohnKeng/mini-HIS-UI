let lastTs = 0;
let seq = 0;

export function createId(prefix: string): string {
  const now = Date.now();
  if (now === lastTs) {
    seq += 1;
  } else {
    lastTs = now;
    seq = 0;
  }
  const suffix = seq > 0 ? `${now}${String(seq).padStart(2,'0')}` : `${now}`;
  return `${prefix}-${suffix}`;
}

