// Authentication utility functions for Campus Carpool Coordinator

/**
 * Clear all authentication-related storage
 * This helps resolve inconsistency issues between localhost and network
 */
export const clearAllAuthState = () => {
  try {
    // Clear localStorage
    const keysToRemove = []
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key && (
        key.includes('supabase') ||
        key.includes('auth') ||
        key.includes('sb-') ||
        key.includes('session') ||
        key.includes('token')
      )) {
        keysToRemove.push(key)
      }
    }
    keysToRemove.forEach(key => localStorage.removeItem(key))

    // Clear sessionStorage
    sessionStorage.clear()

    // Clear any cookies related to auth (if any)
    document.cookie.split(";").forEach((c) => {
      const eqPos = c.indexOf("=")
      const name = eqPos > -1 ? c.substr(0, eqPos) : c
      if (name.trim().includes('auth') || name.trim().includes('session')) {
        document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`
      }
    })

    console.log('All authentication state cleared')
    return true
  } catch (error) {
    console.error('Error clearing auth state:', error)
    return false
  }
}

/**
 * Force logout and clear all state
 * Useful for resolving stuck authentication states
 */
export const forceLogout = () => {
  clearAllAuthState()
  // Force navigation to home
  window.location.href = '/'
}

/**
 * Check if we're running on localhost vs network
 */
export const getHostType = () => {
  const hostname = window.location.hostname
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return 'localhost'
  } else if (hostname.startsWith('192.168.') || hostname.startsWith('10.') || hostname.startsWith('172.')) {
    return 'network'
  }
  return 'unknown'
}

/**
 * Debug function to log current auth state
 */
export const debugAuthState = () => {
  console.group('🔐 Authentication Debug Info')
  console.log('Host type:', getHostType())
  console.log('Current URL:', window.location.href)
  
  console.group('📦 LocalStorage Auth Keys')
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (key && (key.includes('supabase') || key.includes('auth') || key.includes('sb-'))) {
      console.log(`${key}:`, localStorage.getItem(key))
    }
  }
  console.groupEnd()
  
  console.group('🗂 SessionStorage')
  for (let i = 0; i < sessionStorage.length; i++) {
    const key = sessionStorage.key(i)
    if (key) {
      console.log(`${key}:`, sessionStorage.getItem(key))
    }
  }
  console.groupEnd()
  
  console.groupEnd()
}

// Export for console debugging
if (typeof window !== 'undefined') {
  window.authUtils = {
    clearAllAuthState,
    forceLogout,
    getHostType,
    debugAuthState
  }
}