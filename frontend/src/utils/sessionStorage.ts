/**
 * Secure session storage utilities for sensitive registration data
 * Keeps sensitive IDs out of URL params to prevent exposure in:
 * - Browser history
 * - Server logs
 * - Analytics platforms
 * - CDN caches
 */

const REGISTRATION_SESSION_KEY = 'serviceverse_registration_context';

interface RegistrationContext {
  serviceId?: string;
  role?: 'SERVICE_PROVIDER' | 'CUSTOMER';
  timestamp: number;
}

/**
 * Store registration context (e.g., serviceId) in sessionStorage
 * Data is cleared when the browser tab/window closes
 */
export function setRegistrationContext(data: Partial<RegistrationContext>) {
  try {
    const existing = getRegistrationContext();
    const context: RegistrationContext = {
      ...existing,
      ...data,
      timestamp: Date.now(),
    };
    sessionStorage.setItem(REGISTRATION_SESSION_KEY, JSON.stringify(context));
  } catch (error) {
    console.warn('Failed to set registration context:', error);
  }
}

/**
 * Retrieve registration context from sessionStorage
 */
export function getRegistrationContext(): RegistrationContext | null {
  try {
    const data = sessionStorage.getItem(REGISTRATION_SESSION_KEY);
    if (!data) return null;

    const context: RegistrationContext = JSON.parse(data);

    // Clear if older than 30 minutes (prevent stale data)
    if (Date.now() - context.timestamp > 30 * 60 * 1000) {
      clearRegistrationContext();
      return null;
    }

    return context;
  } catch (error) {
    console.warn('Failed to get registration context:', error);
    return null;
  }
}

/**
 * Get serviceId from session storage
 */
export function getRegistrationServiceId(): string | null {
  const context = getRegistrationContext();
  return context?.serviceId || null;
}

/**
 * Get role from session storage
 */
export function getRegistrationRole(): 'SERVICE_PROVIDER' | 'CUSTOMER' | null {
  const context = getRegistrationContext();
  return context?.role || null;
}

/**
 * Clear registration context from sessionStorage
 */
export function clearRegistrationContext() {
  try {
    sessionStorage.removeItem(REGISTRATION_SESSION_KEY);
  } catch (error) {
    console.warn('Failed to clear registration context:', error);
  }
}
