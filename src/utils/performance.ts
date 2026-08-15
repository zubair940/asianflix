import React, { useEffect, useRef } from 'react';

export function PerformanceMonitor() {
  const metricsRef = useRef({
    fcp: 0,
    lcp: 0,
    fid: 0,
    cls: 0,
    ttfb: 0,
  });

  useEffect(() => {
    // First Contentful Paint
    const paintObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.name === 'first-contentful-paint') {
          metricsRef.current.fcp = entry.startTime;
          console.log(`FCP: ${entry.startTime.toFixed(2)}ms`);
        }
      }
    });
    paintObserver.observe({ type: 'paint', buffered: true });

    // Largest Contentful Paint
    const lcpObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const lastEntry = entries[entries.length - 1];
      metricsRef.current.lcp = lastEntry.startTime;
      console.log(`LCP: ${lastEntry.startTime.toFixed(2)}ms`);
    });
    lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true });

    // First Input Delay
    const fidObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        const fidEntry = entry as PerformanceEventTiming;
        metricsRef.current.fid = fidEntry.processingStart - fidEntry.startTime;
        console.log(`FID: ${metricsRef.current.fid.toFixed(2)}ms`);
      }
    });
    fidObserver.observe({ type: 'first-input', buffered: true });

    // Cumulative Layout Shift
    let clsValue = 0;
    const clsObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        const clsEntry = entry as PerformanceEntry & { hadRecentInput?: boolean; value?: number };
        if (!clsEntry.hadRecentInput && clsEntry.value !== undefined) {
          clsValue += clsEntry.value;
        }
      }
      metricsRef.current.cls = clsValue;
      console.log(`CLS: ${clsValue.toFixed(4)}`);
    });
    clsObserver.observe({ type: 'layout-shift', buffered: true });

    // TTFB
    const navObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.entryType === 'navigation') {
          const navEntry = entry as PerformanceNavigationTiming;
          metricsRef.current.ttfb = navEntry.responseStart - navEntry.requestStart;
          console.log(`TTFB: ${metricsRef.current.ttfb.toFixed(2)}ms`);
        }
      }
    });
    navObserver.observe({ type: 'navigation', buffered: true });

    return () => {
      paintObserver.disconnect();
      lcpObserver.disconnect();
      fidObserver.disconnect();
      clsObserver.disconnect();
      navObserver.disconnect();
    };
  }, []);

  return null;
}

export function useRenderPerformance(componentName: string) {
  const renderStart = performance.now();
  const renderCount = useRef(0);

  useEffect(() => {
    renderCount.current++;
    const renderTime = performance.now() - renderStart;
    if (renderTime > 16) {
      console.warn(`[Perf] ${componentName} render #${renderCount.current} took ${renderTime.toFixed(2)}ms`);
    }
  });

  return { renderCount: renderCount.current };
}