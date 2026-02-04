"use client";

import ErrorReporter from "@/components/ErrorReporter";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  // Forward runtime errors into the same ErrorReporter overlay
  return <ErrorReporter error={error} reset={reset} />;
}
