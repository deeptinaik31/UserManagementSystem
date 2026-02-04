"use client";

import { useEffect, useRef, useState } from "react";
import { Copy, RefreshCw } from "lucide-react";

type ReporterProps = {
  error?: Error & { digest?: string };
  reset?: () => void;
};

interface BuildError {
  message: string;
  stack?: string;
  file?: string;
  loc?: { line?: number };
}

interface NetworkError {
  url: string;
  status?: number;
  statusText?: string;
  message?: string;
}

export default function ErrorReporter({ error }: ReporterProps) {
  const lastOverlayMsg = useRef("");
  const [buildError, setBuildError] = useState<BuildError | null>(null);
  const [networkError, setNetworkError] = useState<NetworkError | null>(null);
  const [copied, setCopied] = useState(false);

  // 🔹 Listen for build/compiler errors
  useEffect(() => {
    if (process.env.NODE_ENV === "development") {
      const protocol = window.location.protocol === "https:" ? "wss" : "ws";
      const host = window.location.host;
      const ws = new WebSocket(`${protocol}://${host}/_next/webpack-hmr`);

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          if (data.type === "error" && data.errors?.length) {
            const err = data.errors[0]; // take first error
            if (lastOverlayMsg.current !== err.message) {
              lastOverlayMsg.current = err.message;
              setBuildError(err);
            }
          }
        } catch {
          // ignore unrelated messages
        }
      };

      return () => ws.close();
    }
  }, []);

  // 🔹 Intercept fetch for Next.js API errors
  useEffect(() => {
    const originalFetch = window.fetch;
    
    // URL patterns to ignore (webpack HMR, source maps, dev assets)
    const ignoredUrlPatterns = [
      /\.hot-update\.json$/,      // Webpack HMR updates
      /\/_next\/webpack-hmr/,     // Next.js webpack HMR
      /__nextjs_original-stack-frame/, // Next.js dev stack frames
      /\.map$/,                   // Source maps
      /\/_next\/static\/webpack/, // Webpack static assets
      /favicon\.ico$/,            // Favicon requests
    ];
    
    const shouldIgnoreUrl = (url: string): boolean => {
      return ignoredUrlPatterns.some(pattern => pattern.test(url));
    };
    
    window.fetch = async (...args) => {
      const url = typeof args[0] === 'string' ? args[0] : args[0] instanceof Request ? args[0].url : String(args[0]);
      
      try {
        const res = await originalFetch(...args);

        // Skip reporting for ignored URLs, 401 (Unauthorized), and 400 (Bad Request)
        if (!res.ok && res.status !== 401 && res.status !== 400 && !shouldIgnoreUrl(url)) {
          const errorObj = {
            url,
            status: res.status,
            statusText: res.statusText,
          };
          setNetworkError(errorObj);

          if (window.parent !== window) {
            window.parent.postMessage(
              {
                type: "NETWORK_ERROR",
                error: errorObj,
                timestamp: Date.now(),
              },
              "*"
            );
          }
        }

        return res;
      } catch (err: unknown) {
        // Skip reporting for ignored URLs (dev-only requests that may fail during HMR)
        if (shouldIgnoreUrl(url)) {
          throw err;
        }
        
        const errorObj = {
          url,
          message: err instanceof Error ? err.message : 'Unknown error',
        };
        setNetworkError(errorObj);

        if (window.parent !== window) {
          window.parent.postMessage(
            {
              type: "NETWORK_ERROR",
              error: errorObj,
              timestamp: Date.now(),
            },
            "*"
          );
        }
        throw err;
      }
    };

    return () => {
      window.fetch = originalFetch;
    };
  }, []);

  // Network errors are handled by the parent BuilderSidebar component
  // They show as a popup above the input, not in this error overlay
  const message =
    error?.message ||
    buildError?.message;

  if (!message) return null;

  // Determine a concise error type for the UI
  // Network errors are excluded - they're shown in BuilderSidebar popup
  const errorType = buildError
    ? "Build error"
    : error
    ? "Runtime error"
    : "Error";

  const stack = error?.stack || buildError?.stack || "";

  // 🔹 Handler for AI Fix button
  const handleFix = () => {
    if (window.parent !== window) {
      let filePath = "unknown file";
      let line = "unknown line";

      if (buildError?.file) {
        filePath = buildError.file;
        line = buildError.loc?.line?.toString() || "unknown line";
      } else if (error?.stack) {
        // Try multiple patterns to extract file and line from stack trace
        const stackPatterns = [
          // Pattern for webpack-internal paths
          /webpack-internal:\/\/\/(src\/[^\s:]+):(\d+):(\d+)/,
          // Pattern for direct src paths
          /(\/src\/[^\s:]+):(\d+):(\d+)/,
          // Pattern for relative src paths
          /at\s+\w+\s+\([^)]*\/([^)]+):(\d+):(\d+)\)/,
          // Pattern for function names with file references
          /at\s+(\w+)\s+\(.*?\/([^/)]+)\.js:(\d+):(\d+)\)/,
          // Pattern for Next.js chunk files (extract function name)
          /at\s+(\w+)\s+\(http:\/\/[^)]+\)/,
        ];

        for (const pattern of stackPatterns) {
          const match = error.stack.match(pattern);
          if (match) {
            if (pattern.source.includes('chunk')) {
              // For chunk files, use function name and try to map to source
              filePath = `src/app/test-errors/page.tsx (${match[1]} function)`;
              line = "runtime error";
            } else {
              filePath = match[1] || match[2] || "unknown file";
              line = match[2] || match[3] || "unknown line";
            }
            break;
          }
        }

        // If no pattern matched, try to extract function name at least
        if (filePath === "unknown file") {
          const functionMatch = error.stack.match(/at\s+(\w+)\s+\(/);
          if (functionMatch) {
            filePath = `JavaScript function: ${functionMatch[1]}`;
            line = "runtime error";
          }
        }
      }

      const descriptiveMsg = networkError
        ? `This is a network error while calling ${networkError.url}: ${
            networkError.statusText || networkError.message
          } (status: ${networkError.status || "N/A"}). Please fix this issue.`
        : `This is the error in ${filePath} at line ${line}: ${message}. Please fix this error.`;

      window.parent.postMessage(
        {
          type: "FIX_WITH_APPOPEN",
          error: {
            message: descriptiveMsg,
            rawMessage: message,
            stack: error?.stack || buildError?.stack,
            file: filePath,
            line: line,
            url: networkError?.url,
            status: networkError?.status,
          },
          timestamp: Date.now(),
        },
        "*"
      );
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  };

  const handleRefresh = () => {
    window.location.reload();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-auto bg-[#0f0f0f] text-gray-400 font-mono">
      <div className="min-h-svh max-w-5xl mx-auto flex items-center justify-center p-8">
        <div className="w-full">
          <div className="flex items-start justify-between mb-6">
          <h1 className="relative text-4xl font-normal text-gray-300">
            <span className="relative z-10">{errorType}</span>
            <span
              aria-hidden
              className="pointer-events-none absolute inset-0 text-transparent bg-clip-text animate-shiny-text"
              style={{
                backgroundImage:
                  'linear-gradient(90deg, rgba(0,0,0,0), rgba(59,130,246,0.9), rgba(34,211,238,0.9), rgba(0,0,0,0))'
              } as React.CSSProperties}
            >
              {errorType}
            </span>
          </h1>
          <div className="flex items-center gap-3">
            <button
              onClick={handleFix}
              title="Fix Now"
              className="h-10 rounded-full bg-neutral-900 cursor-pointer text-neutral-200 hover:bg-neutral-800 border border-neutral-700 px-5 py-2 text-sm font-medium transition-colors"
            >
              Fix Now!
            </button>
            <span className="rounded-full border border-neutral-800 bg-neutral-900/90 px-2.5 py-1 text-sm text-gray-300">
              Free (0 credits required)
            </span>
          </div>
          </div>

          <div className="bg-[#1a1a1a] rounded-lg p-6 border border-gray-800">
            <p className="text-sm leading-relaxed text-gray-400 whitespace-pre-wrap break-words">{message}</p>

            {stack ? (
              <div className="mt-6">
                <div className="mb-2 text-xs uppercase tracking-wide text-gray-500">Stack trace</div>
                <pre className="bg-black/40 border border-gray-800 rounded-lg p-4 text-xs text-gray-400 overflow-auto max-h-80 whitespace-pre-wrap break-words">
                  {stack}
                </pre>
              </div>
            ) : null}

            <div className="flex gap-3 mt-6">
              <button
                className="h-8 w-8 inline-flex items-center justify-center rounded-md text-gray-500 hover:text-gray-300 hover:bg-gray-800 transition-colors"
                onClick={handleCopy}
                title={copied ? "Copied!" : "Copy error"}
              >
                <Copy className="h-4 w-4" />
              </button>
              <button
                className="h-8 w-8 inline-flex items-center justify-center rounded-md text-gray-500 hover:text-gray-300 hover:bg-gray-800 transition-colors"
                onClick={handleRefresh}
                title="Refresh"
              >
                <RefreshCw className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
