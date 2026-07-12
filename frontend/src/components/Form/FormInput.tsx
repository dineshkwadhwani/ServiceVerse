import { forwardRef } from 'react';
import { AlertCircle } from 'lucide-react';
import type { InputHTMLAttributes } from 'react';

interface FormInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  required?: boolean;
  helperText?: string;
  containerClassName?: string;
}

export const FormInput = forwardRef<HTMLInputElement, FormInputProps>(
  ({ label, error, required, helperText, containerClassName = '', className = '', ...props }, ref) => {
    const hasError = !!error;

    return (
      <div className={containerClassName}>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
        <div className="relative">
          <input
            ref={ref}
            className={`
              w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 transition
              ${hasError
                ? 'border-red-500 focus:ring-red-400 bg-red-50'
                : 'border-gray-300 focus:ring-blue-500'
              }
              ${className}
            `}
            {...props}
          />
          {hasError && (
            <AlertCircle className="absolute right-3 top-2.5 w-5 h-5 text-red-500" />
          )}
        </div>
        {error && (
          <p className="text-red-600 text-sm mt-1 flex items-center gap-1">
            {error}
          </p>
        )}
        {helperText && !error && (
          <p className="text-gray-500 text-sm mt-1">{helperText}</p>
        )}
      </div>
    );
  }
);

FormInput.displayName = 'FormInput';
