import React, { createContext, useContext, useCallback, useMemo } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

// Enterprise-level QueryClient configuration
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Aggressive caching for better performance
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes
      refetchOnWindowFocus: false,
      refetchOnReconnect: 'always',
      retry: (failureCount, error) => {
        // Don't retry on 4xx errors
        if (error?.status >= 400 && error?.status < 500) return false
        return failureCount < 3
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000)
    },
    mutations: {
      retry: 1,
      retryDelay: 1000
    }
  }
})

// Performance context for global loading states
const PerformanceContext = createContext()

export const usePerformance = () => {
  const context = useContext(PerformanceContext)
  if (!context) {
    throw new Error('usePerformance must be used within PerformanceProvider')
  }
  return context
}

// Memoized performance provider
export const PerformanceProvider = React.memo(({ children }) => {
  // Global loading state management
  const [globalLoading, setGlobalLoading] = React.useState(false)
  const [loadingStates, setLoadingStates] = React.useState({})

  // Optimized loading state functions
  const setLoading = useCallback((key, isLoading) => {
    setLoadingStates(prev => {
      if (isLoading) {
        return { ...prev, [key]: true }
      } else {
        const { [key]: _, ...rest } = prev
        return rest
      }
    })
  }, [])

  const isLoading = useCallback((key) => {
    return !!loadingStates[key]
  }, [loadingStates])

  const hasAnyLoading = useMemo(() => {
    return Object.keys(loadingStates).length > 0 || globalLoading
  }, [loadingStates, globalLoading])

  // Performance monitoring
  const trackPageLoad = useCallback((pageName) => {
    const startTime = performance.now()
    
    return () => {
      const endTime = performance.now()
      const loadTime = endTime - startTime
      
      // Log slow page loads (> 2 seconds)
      if (loadTime > 2000) {
        console.warn(`Slow page load detected: ${pageName} took ${loadTime.toFixed(2)}ms`)
      }
      
      // Analytics tracking would go here
      console.log(`Page ${pageName} loaded in ${loadTime.toFixed(2)}ms`)
    }
  }, [])

  // Debounced search function for better UX
  const debouncedSearch = useCallback((searchFn, delay = 300) => {
    let timeoutId
    return (...args) => {
      clearTimeout(timeoutId)
      timeoutId = setTimeout(() => searchFn(...args), delay)
    }
  }, [])

  // Memoized context value
  const contextValue = useMemo(() => ({
    // Loading states
    globalLoading,
    setGlobalLoading,
    setLoading,
    isLoading,
    hasAnyLoading,
    
    // Performance utilities
    trackPageLoad,
    debouncedSearch,
    
    // Query client for manual cache manipulation
    queryClient
  }), [
    globalLoading,
    setGlobalLoading,
    setLoading,
    isLoading,
    hasAnyLoading,
    trackPageLoad,
    debouncedSearch
  ])

  return (
    <PerformanceContext.Provider value={contextValue}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </PerformanceContext.Provider>
  )
})

PerformanceProvider.displayName = 'PerformanceProvider'

// HOC for performance monitoring
export const withPerformanceTracking = (WrappedComponent, componentName) => {
  return React.memo((props) => {
    const { trackPageLoad } = usePerformance()
    
    React.useEffect(() => {
      const endTracking = trackPageLoad(componentName)
      return endTracking
    }, [trackPageLoad])
    
    return <WrappedComponent {...props} />
  })
}

// Custom hook for optimized component updates
export const useOptimizedCallback = (callback, deps) => {
  return useCallback(callback, deps)
}

export const useOptimizedMemo = (factory, deps) => {
  return useMemo(factory, deps)
}

// Error boundary for better error handling
export class PerformanceErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error('Performance Error Boundary caught an error:', error, errorInfo)
    // Error tracking service would go here
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100">
          <div className="text-center p-8 bg-white rounded-lg shadow-lg max-w-md">
            <h2 className="text-xl font-semibold text-red-600 mb-4">
              Something went wrong
            </h2>
            <p className="text-gray-600 mb-4">
              We apologize for the inconvenience. Please refresh the page and try again.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
            >
              Refresh Page
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}