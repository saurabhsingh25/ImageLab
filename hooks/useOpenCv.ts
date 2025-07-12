import { useEffect, useRef, useState } from 'react';

/**
 * useOpenCv - React hook to detect when OpenCV.js is loaded and ready.
 *
 * Usage:
 *   const { isReady, error, cv } = useOpenCv();
 *   if (!isReady) return <div>Loading OpenCV...</div>;
 *   // Use cv for image processing
 */
export function useOpenCv() {
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cv, setCv] = useState<any>(null);
  const isReadyRef = useRef(false);

  useEffect(() => {
    let timeout: NodeJS.Timeout;
    function checkReady() {
      if (typeof window !== 'undefined' && (window as any).cv && (window as any).cv.Mat) {
        setIsReady(true);
        setCv((window as any).cv);
        isReadyRef.current = true;
      } else {
        timeout = setTimeout(checkReady, 100);
      }
    }
    checkReady();
    // Timeout after 10 seconds
    const failTimeout = setTimeout(() => {
      if (!isReadyRef.current) setError('Failed to load OpenCV.js');
    }, 10000);
    return () => {
      clearTimeout(timeout);
      clearTimeout(failTimeout);
    };
  }, []);

  return { isReady, error, cv };
} 