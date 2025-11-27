const readyOnce: { done?: boolean } = {};

// PUBLIC_INTERFACE
export function healthcheck(): void {
  /** Logs a ready message when environment vars are present; no-op otherwise. */
  if (readyOnce.done) return;
  const logLevel = process.env.EXPO_PUBLIC_LOG_LEVEL;
  const path = process.env.EXPO_PUBLIC_HEALTHCHECK_PATH;
  if (logLevel === 'verbose') {
    // console output allowed in verbose mode
    console.debug(`[calc] app-ready${path ? ` healthcheck-path=${path}` : ''}`);
  }
  readyOnce.done = true;
}
