'use client';

import { useEffect, Suspense } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

/**
 * NavigationTracker component that tracks route changes and sends PostMessage updates
 * to the parent frame for route navigation tracking in the PreviewFrame.
 */
function NavigationTrackerComponent() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Function to send navigation update to parent frame
    const sendNavigationUpdate = () => {
      // Construct the full path including search params
      const fullPath = searchParams.toString() ? `${pathname}?${searchParams.toString()}` : pathname;
      
      // Send PostMessage to parent frame
      try {
        window.parent.postMessage({
          type: 'ROUTE_NAVIGATION',
          path: pathname, // Send just the pathname for route matching
          fullPath: fullPath, // Full path with query params for reference
          timestamp: Date.now()
        }, '*');
        
        console.log('🚀 [NavigationTracker] Sent navigation update:', {
          path: pathname,
          fullPath: fullPath
        });
      } catch (error) {
        console.warn('⚠️ [NavigationTracker] Failed to send navigation update:', error);
      }
    };

    // Send navigation update when pathname or search params change
    sendNavigationUpdate();
  }, [pathname, searchParams]);

  // Send initial navigation update on mount
  useEffect(() => {
    const sendInitialUpdate = () => {
      const fullPath = searchParams.toString() ? `${pathname}?${searchParams.toString()}` : pathname;
      
      try {
        window.parent.postMessage({
          type: 'ROUTE_NAVIGATION',
          path: pathname,
          fullPath: fullPath,
          timestamp: Date.now(),
          initial: true
        }, '*');
        
        console.log('🎯 [NavigationTracker] Sent initial navigation update:', {
          path: pathname,
          fullPath: fullPath
        });
      } catch (error) {
        console.warn('⚠️ [NavigationTracker] Failed to send initial navigation update:', error);
      }
    };

    // Small delay to ensure the parent frame is ready
    const timer = setTimeout(sendInitialUpdate, 100);
    return () => clearTimeout(timer);
  }, [pathname, searchParams]); // Run when navigation changes

  // This component doesn't render anything
  return null;
}

export default function NavigationTracker() {
  return (
    <Suspense fallback={null}>
      <NavigationTrackerComponent />
    </Suspense>
  );
}