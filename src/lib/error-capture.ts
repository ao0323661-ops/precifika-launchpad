let lastError: Error | null = null;

export function captureError(error: Error) {
  lastError = error;
}

export function consumeLastCapturedError(): Error | null {
  const error = lastError;
  lastError = null;
  return error;
}

if (typeof process !== "undefined") {
  process.on("uncaughtException", captureError);
  process.on("unhandledRejection", (reason) => {
    if (reason instanceof Error) {
      captureError(reason);
    } else {
      captureError(new Error(String(reason)));
    }
  });
}
