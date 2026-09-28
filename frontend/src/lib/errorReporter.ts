let installed = false;

function deriveAppId(): string | undefined {
  if (process.env.NEXT_PUBLIC_APP_ID) return process.env.NEXT_PUBLIC_APP_ID;
  if (typeof window === 'undefined') return undefined;
  const m = window.location.hostname.match(/^preview-([^.]+)\./);
  return m ? m[1] : undefined;
}

function send(message: string, stack?: string) {
  const url = process.env.NEXT_PUBLIC_RUNTIME_ERROR_REPORT_URL;
  if (!url || typeof window === 'undefined') return;
  try {
    fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        app_id: deriveAppId(),
        message: String(message).slice(0, 2000),
        stack: stack ? String(stack).slice(0, 5000) : undefined,
        url: window.location.href,
        user_agent: navigator.userAgent,
      }),
      keepalive: true,
    }).catch(() => undefined);
  } catch {
    /* never throw from reporter */
  }
}

export function installErrorReporter() {
  if (installed || typeof window === 'undefined') return;
  installed = true;
  window.onerror = (msg, _src, _l, _c, err) => {
    send(String(msg), err?.stack);
    return false;
  };
  window.onunhandledrejection = (ev: PromiseRejectionEvent) => {
    const r: any = ev.reason;
    send(r?.message || String(r), r?.stack);
  };
  const orig = console.error;
  console.error = (...args: any[]) => {
    try {
      const err = args.find((a) => a instanceof Error);
      send(args.map((a) => (a instanceof Error ? a.message : typeof a === 'string' ? a : JSON.stringify(a))).join(' '), err?.stack);
    } catch {
      /* ignore */
    }
    orig.apply(console, args);
  };
}