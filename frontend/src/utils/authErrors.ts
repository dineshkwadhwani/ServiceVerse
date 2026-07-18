const FIREBASE_AUTH_ERROR_MESSAGES: Record<string, string> = {
  'auth/invalid-verification-code': 'The code you entered is incorrect. Please check and try again.',
  'auth/code-expired': 'This code has expired. Please request a new one.',
  'auth/invalid-verification-id': 'Your verification session has expired. Please request a new code.',
  'auth/missing-verification-id': 'Your verification session has expired. Please request a new code.',
  'auth/missing-verification-code': 'Please enter the verification code.',
  'auth/too-many-requests': 'Too many attempts. Please wait a few minutes and try again.',
  'auth/invalid-phone-number': "That phone number doesn't look right. Please check and try again.",
  'auth/missing-phone-number': 'Please enter a phone number.',
  'auth/network-request-failed': 'Network error. Please check your connection and try again.',
  'auth/quota-exceeded': "We're unable to send an SMS right now. Please try again later.",
  'auth/captcha-check-failed': 'Verification check failed. Please refresh the page and try again.',
  'auth/user-disabled': 'This account has been disabled. Please contact support.',
  'auth/internal-error': 'Something went wrong on our end. Please try again.',
};

/**
 * Firebase's raw error.message (e.g. "Firebase: Error (auth/invalid-verification-code).")
 * isn't meaningful to end users. Map known auth error codes to plain-language copy,
 * falling back to a generic message rather than surfacing the SDK's internal string.
 */
export function getAuthErrorMessage(error: any): string {
  const code = error?.code || '';
  return FIREBASE_AUTH_ERROR_MESSAGES[code] || 'Something went wrong. Please try again.';
}
