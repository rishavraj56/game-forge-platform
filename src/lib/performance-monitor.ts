/**
 * Performance monitoring and optimization utilities
 */

interface PerformanceMetric {
  name: string;
  duration: number;
  timestamp: number;
  metadata?: Record<string, any>;
}

interface APIPerformanceData {
  endpoint: string;
  method: string;
  duration: number;
  statusCode: number;
  cacheHit?: boolean;
  timestamp: number;
}

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private apiMetrics: APIPerformanceData[] = [];
  private readonly maxMetrics = 1000; // Keep last 1000 metrics

  /**
   * Time a function execution
   */
  async timeFunction<T>(
    name: string,
    fn: () => Promise<T>,
    metadata?: Record<string, any>
  ): Promise<T> {
    const start = performance.now();
    
    try {
      const result = await fn();
      const duration = performance.now() - start;
      
      this.addMetric({
        name,
        duration,
        timestamp: Date.now(),
        metadata: { ...metadata, success: true }
      });
      
      return result;
    } catch (error) {
      const duration = performance.now() - start;
      
      this.addMetric({
        name,
        duration,
        timestamp: Date.now(),
        metadata: { ...metadata, success: false, error: error instanceof Error ? error.message : 'Unknown error' }
      });
      
      throw error;
    }
  }

  /**
   * Time a synchronous function
   */
  timeSync<T>(
    name: string,
    fn: () => T,
    metadata?: Record<string, any>
  ): T {
    const start = performance.now();
    
    try {
      const result = fn();
      const duration = performance.now() - start;
      
      this.addMetric({
        name,
        duration,
        timestamp: Date.now(),
        metadata: { ...metadata, success: true }
      });
      
      return result;
    } catch (error) {
      const duration = performance.now() - start;
      
      this.addMetric({
        name,
        duration,
        timestamp: Date.now(),
        metadata: { ...metadata, success: false, error: error instanceof Error ? error.message : 'Unknown error' }
      });
      
      throw error;
    }
  }

  /**
   * Record API performance data
   */
  recordAPICall(data: APIPerformanceData): void {
    this.apiMetrics.push(data);
    
    // Keep only the last maxMetrics entries
    if (this.apiMetrics.length > this.maxMetrics) {
      this.apiMetrics = this.apiMetrics.slice(-this.maxMetrics);
    }

    // Log slow API calls
    if (data.duration > 1000) { // More than 1 second
      console.warn(`Slow API call detected: ${data.method} ${data.endpoint} took ${data.duration.toFixed(2)}ms`);
    }
  }

  /**
   * Add a performance metric
   */
  private addMetric(metric: PerformanceMetric): void {
    this.metrics.push(metric);
    
    // Keep only the last maxMetrics entries
    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(-this.maxMetrics);
    }

    // Log slow operations
    if (metric.duration > 500) { // More than 500ms
      console.warn(`Slow operation detected: ${metric.name} took ${metric.duration.toFixed(2)}ms`);
    }
  }

  /**
   * Get performance statistics
   */
  getStats(): {
    totalMetrics: number;
    averageDuration: number;
    slowestOperations: PerformanceMetric[];
    apiStats: {
      totalCalls: number;
      averageDuration: number;
      cacheHitRate: number;
      slowestEndpoints: APIPerformanceData[];
    };
  } {
    const totalMetrics = this.metrics.length;
    const averageDuration = totalMetrics > 0 
      ? this.metrics.reduce((sum, m) => sum + m.duration, 0) / totalMetrics 
      : 0;

    const slowestOperations = [...this.metrics]
      .sort((a, b) => b.duration - a.duration)
      .slice(0, 10);

    const totalAPICalls = this.apiMetrics.length;
    const apiAverageDuration = totalAPICalls > 0
      ? this.apiMetrics.reduce((sum, m) => sum + m.duration, 0) / totalAPICalls
      : 0;

    const cacheHits = this.apiMetrics.filter(m => m.cacheHit).length;
    const cacheHitRate = totalAPICalls > 0 ? (cacheHits / totalAPICalls) * 100 : 0;

    const slowestEndpoints = [...this.apiMetrics]
      .sort((a, b) => b.duration - a.duration)
      .slice(0, 10);

    return {
      totalMetrics,
      averageDuration,
      slowestOperations,
      apiStats: {
        totalCalls: totalAPICalls,
        averageDuration: apiAverageDuration,
        cacheHitRate,
        slowestEndpoints,
      },
    };
  }

  /**
   * Get metrics for a specific operation
   */
  getMetricsForOperation(name: string): PerformanceMetric[] {
    return this.metrics.filter(m => m.name === name);
  }

  /**
   * Get API metrics for a specific endpoint
   */
  getAPIMetricsForEndpoint(endpoint: string): APIPerformanceData[] {
    return this.apiMetrics.filter(m => m.endpoint === endpoint);
  }

  /**
   * Clear all metrics
   */
  clear(): void {
    this.metrics = [];
    this.apiMetrics = [];
  }

  /**
   * Export metrics for analysis
   */
  exportMetrics(): {
    metrics: PerformanceMetric[];
    apiMetrics: APIPerformanceData[];
    exportedAt: number;
  } {
    return {
      metrics: [...this.metrics],
      apiMetrics: [...this.apiMetrics],
      exportedAt: Date.now(),
    };
  }
}

// Create singleton instance
export const performanceMonitor = new PerformanceMonitor();

/**
 * Decorator for timing class methods
 */
export function timed(name?: string) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    const methodName = name || `${target.constructor.name}.${propertyKey}`;

    descriptor.value = async function (...args: any[]) {
      return performanceMonitor.timeFunction(
        methodName,
        () => originalMethod.apply(this, args),
        { className: target.constructor.name, methodName: propertyKey }
      );
    };

    return descriptor;
  };
}

/**
 * Higher-order function for timing functions
 */
export function withTiming<T extends (...args: any[]) => any>(
  fn: T,
  name: string
): T {
  return (async (...args: any[]) => {
    return performanceMonitor.timeFunction(name, () => fn(...args));
  }) as T;
}

/**
 * Middleware for timing API routes
 */
export function withAPITiming(
  handler: (req: any, res?: any) => Promise<Response>
) {
  return async (req: any, res?: any): Promise<Response> => {
    const start = performance.now();
    const url = new URL(req.url);
    const endpoint = url.pathname;
    const method = req.method;

    try {
      const response = await handler(req, res);
      const duration = performance.now() - start;

      performanceMonitor.recordAPICall({
        endpoint,
        method,
        duration,
        statusCode: response.status,
        timestamp: Date.now(),
      });

      return response;
    } catch (error) {
      const duration = performance.now() - start;

      performanceMonitor.recordAPICall({
        endpoint,
        method,
        duration,
        statusCode: 500,
        timestamp: Date.now(),
      });

      throw error;
    }
  };
}

/**
 * Bundle size analyzer helper
 */
export const BundleAnalyzer = {
  /**
   * Analyze component bundle impact
   */
  analyzeComponent: (componentName: string) => {
    if (typeof window !== 'undefined' && 'performance' in window) {
      const entries = performance.getEntriesByType('navigation');
      if (entries.length > 0) {
        const navigation = entries[0] as PerformanceNavigationTiming;
        console.log(`Component ${componentName} - Page load time:`, {
          domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
          loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
          totalTime: navigation.loadEventEnd - navigation.fetchStart,
        });
      }
    }
  },

  /**
   * Log resource loading times
   */
  logResourceTiming: () => {
    if (typeof window !== 'undefined' && 'performance' in window) {
      const resources = performance.getEntriesByType('resource');
      const slowResources = resources
        .filter((resource: any) => resource.duration > 100)
        .sort((a: any, b: any) => b.duration - a.duration)
        .slice(0, 10);

      if (slowResources.length > 0) {
        console.log('Slow loading resources:', slowResources.map((r: any) => ({
          name: r.name,
          duration: r.duration,
          size: r.transferSize,
        })));
      }
    }
  },
};

/**
 * Memory usage monitor
 */
export const MemoryMonitor = {
  /**
   * Get current memory usage (if available)
   */
  getCurrentUsage: () => {
    if (typeof window !== 'undefined' && 'performance' in window && 'memory' in (window.performance as any)) {
      const memory = (window.performance as any).memory;
      return {
        used: memory.usedJSHeapSize,
        total: memory.totalJSHeapSize,
        limit: memory.jsHeapSizeLimit,
        usagePercentage: (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100,
      };
    }
    return null;
  },

  /**
   * Log memory usage
   */
  logUsage: () => {
    const usage = MemoryMonitor.getCurrentUsage();
    if (usage) {
      console.log('Memory usage:', {
        used: `${(usage.used / 1024 / 1024).toFixed(2)} MB`,
        total: `${(usage.total / 1024 / 1024).toFixed(2)} MB`,
        limit: `${(usage.limit / 1024 / 1024).toFixed(2)} MB`,
        percentage: `${usage.usagePercentage.toFixed(2)}%`,
      });

      if (usage.usagePercentage > 80) {
        console.warn('High memory usage detected!');
      }
    }
  },
};

export { PerformanceMonitor };