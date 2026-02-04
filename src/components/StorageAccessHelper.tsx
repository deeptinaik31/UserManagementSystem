'use client';

import { useEffect, useState } from 'react';

export default function StorageAccessHelper() {
  const [isInIframe, setIsInIframe] = useState(false);
  const [showPrompt, setShowPrompt] = useState(false);
  const [hasInitialized, setHasInitialized] = useState(false);

  useEffect(() => {
    // Check if running in iframe
    const inIframe = typeof window !== 'undefined' && window.self !== window.top;
    setIsInIframe(inIframe);

    if (!inIframe || hasInitialized) return;
    setHasInitialized(true);

    console.log('[StorageAccess] Running in iframe, initializing cookie/storage helper');

    // === COOKIE INTERCEPTION ===
    // Override document.cookie to also store in localStorage as backup
    const originalCookieDescriptor = Object.getOwnPropertyDescriptor(Document.prototype, 'cookie');
    
    if (originalCookieDescriptor) {
      Object.defineProperty(document, 'cookie', {
        get: function() {
          // First try to get from actual cookies
          const realCookies = originalCookieDescriptor.get?.call(document) || '';
          
          // Also check localStorage for any auth tokens we've backed up
          try {
            const backedUpTokens = localStorage.getItem('__cookie_backup__');
            if (backedUpTokens) {
              const tokens = JSON.parse(backedUpTokens);
              // Merge backed up tokens with real cookies
              let mergedCookies = realCookies;
              for (const [name, value] of Object.entries(tokens)) {
                if (!realCookies.includes(`${name}=`)) {
                  mergedCookies += (mergedCookies ? '; ' : '') + `${name}=${value}`;
                }
              }
              return mergedCookies;
            }
          } catch {
            // localStorage might be blocked too
          }
          
          return realCookies;
        },
        set: function(value: string) {
          // Set the actual cookie
          originalCookieDescriptor.set?.call(document, value);
          
          // Also backup auth-related cookies to localStorage
          try {
            const cookieParts = value.split(';')[0]; // Get name=value part
            const [name, ...valueParts] = cookieParts.split('=');
            const cookieValue = valueParts.join('=');
            
            // Backup auth-related cookies
            const authCookiePatterns = ['token', 'auth', 'session', 'jwt', 'access', 'refresh', 'user'];
            const isAuthCookie = authCookiePatterns.some(pattern => 
              name.toLowerCase().includes(pattern)
            );
            
            if (isAuthCookie && cookieValue && !value.toLowerCase().includes('max-age=0') && !value.toLowerCase().includes('expires=thu, 01 jan 1970')) {
              console.log(`[StorageAccess] Backing up auth cookie to localStorage: ${name}`);
              const backup = JSON.parse(localStorage.getItem('__cookie_backup__') || '{}');
              backup[name.trim()] = cookieValue.trim();
              localStorage.setItem('__cookie_backup__', JSON.stringify(backup));
            } else if (isAuthCookie && (value.toLowerCase().includes('max-age=0') || value.toLowerCase().includes('expires=thu, 01 jan 1970'))) {
              // Cookie is being deleted, remove from backup too
              console.log(`[StorageAccess] Removing auth cookie from backup: ${name}`);
              const backup = JSON.parse(localStorage.getItem('__cookie_backup__') || '{}');
              delete backup[name.trim()];
              localStorage.setItem('__cookie_backup__', JSON.stringify(backup));
            }
          } catch (e) {
            console.warn('[StorageAccess] Failed to backup cookie to localStorage:', e);
          }
        },
        configurable: true
      });
      
      console.log('[StorageAccess] Cookie interception enabled - auth cookies will be backed up to localStorage');
    }

    // === STORAGE ACCESS API ===
    const checkAndRequestStorageAccess = async () => {
      try {
        if (!document.hasStorageAccess) {
          console.log('[StorageAccess] Storage Access API not available');
          return;
        }

        const hasAccess = await document.hasStorageAccess();
        console.log('[StorageAccess] Current storage access:', hasAccess);

        if (!hasAccess) {
          // Test if localStorage actually works
          try {
            localStorage.setItem('__test__', '1');
            localStorage.removeItem('__test__');
            console.log('[StorageAccess] localStorage works, cookie backup will function');
          } catch {
            console.log('[StorageAccess] localStorage also blocked, showing prompt');
            setShowPrompt(true);
          }
        }
      } catch (error) {
        console.warn('[StorageAccess] Error checking access:', error);
      }
    };

    checkAndRequestStorageAccess();

    // Restore backed up cookies on page load
    try {
      const backup = localStorage.getItem('__cookie_backup__');
      if (backup) {
        const tokens = JSON.parse(backup);
        console.log('[StorageAccess] Found backed up auth tokens:', Object.keys(tokens));
        // The cookie getter will automatically merge these
      }
    } catch {
      // Ignore
    }

    // Listen for messages from parent frame
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'STORAGE_ACCESS_HELPER') {
        console.log('[StorageAccess] Received helper message from parent');
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [hasInitialized]);

  // Request storage access - must be triggered by user gesture
  const requestAccess = async () => {
    if (!document.requestStorageAccess) {
      setShowPrompt(false);
      return;
    }

    try {
      await document.requestStorageAccess();
      console.log('[StorageAccess] Access granted!');
      setShowPrompt(false);
      window.location.reload();
    } catch (error) {
      console.warn('[StorageAccess] Access denied:', error);
      setShowPrompt(false);
    }
  };

  // Don't render anything if not in iframe or don't need to show prompt
  if (!isInIframe || !showPrompt) return null;

  return (
    <div 
      onClick={requestAccess}
      className="fixed bottom-0 left-0 right-0 bg-blue-600 text-white text-center py-2 px-4 text-sm cursor-pointer hover:bg-blue-700 transition-colors z-[9999]"
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && requestAccess()}
    >
      <span>🔐 Click anywhere to enable login persistence</span>
      <button 
        onClick={(e) => { e.stopPropagation(); setShowPrompt(false); }}
        className="ml-4 text-blue-200 hover:text-white underline"
      >
        Dismiss
      </button>
    </div>
  );
}
