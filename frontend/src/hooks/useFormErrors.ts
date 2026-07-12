import { useEffect, useRef } from 'react';
import { UseFormSetFocus } from 'react-hook-form';

interface FormErrorsConfig {
  errors: Record<string, any>;
  setFocus: UseFormSetFocus<any>;
}

/**
 * Hook to focus on first error field and handle error display
 * Usage: useFormErrors({ errors, setFocus })
 */
export function useFormErrors({ errors, setFocus }: FormErrorsConfig) {
  const hasBeenFocused = useRef(false);

  useEffect(() => {
    const errorFields = Object.keys(errors).filter((field) => errors[field]);

    if (errorFields.length > 0 && !hasBeenFocused.current) {
      const firstErrorField = errorFields[0];
      setFocus(firstErrorField);
      hasBeenFocused.current = true;
    }
  }, [errors, setFocus]);

  // Reset focus flag when errors clear
  useEffect(() => {
    const hasErrors = Object.values(errors).some((error) => error);
    if (!hasErrors) {
      hasBeenFocused.current = false;
    }
  }, [errors]);

  return {
    hasErrors: Object.values(errors).some((error) => error),
    errorCount: Object.values(errors).filter((error) => error).length,
  };
}
