import React from 'react';
import { cn } from '@/lib/utils';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'success';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  children: React.ReactNode;
  fullWidth?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      isLoading = false,
      leftIcon,
      rightIcon,
      className,
      disabled,
      children,
      fullWidth = false,
      ...props
    },
    ref
  ) => {
    const variants = {
      primary:
        'bg-black text-white hover:bg-gray-800 active:bg-gray-900 focus:ring-gray-600 shadow-sm hover:shadow-md border border-black',
      secondary:
        'bg-white text-black border-2 border-black hover:bg-gray-100 active:bg-gray-200 focus:ring-gray-600',
      outline:
        'border-2 border-black text-black bg-white hover:bg-gray-50 active:bg-gray-100 focus:ring-gray-600',
      ghost:
        'text-black hover:bg-gray-100 active:bg-gray-200 focus:ring-gray-600',
      danger:
        'bg-black text-white hover:bg-gray-800 active:bg-gray-900 focus:ring-gray-600 shadow-sm hover:shadow-md border border-black',
      success:
        'bg-gray-800 text-white hover:bg-gray-700 active:bg-black focus:ring-gray-600 shadow-sm hover:shadow-md border border-gray-800',
    };

    const sizes = {
      sm: 'px-3 py-1.5 text-sm gap-1.5',
      md: 'px-4 py-2 text-base gap-2',
      lg: 'px-6 py-3 text-lg gap-2',
      xl: 'px-8 py-4 text-xl gap-3',
    };

    return (
      <button
        ref={ref}
        className={cn(
          'btn-base',
          variants[variant],
          sizes[size],
          fullWidth && 'w-full',
          className
        )}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading ? (
          <span className="flex items-center justify-center">
            <svg
              className="animate-spin h-4 w-4 mr-2"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            Loading...
          </span>
        ) : (
          <span className="flex items-center justify-center">
            {leftIcon && <span className="flex-shrink-0">{leftIcon}</span>}
            {children}
            {rightIcon && <span className="flex-shrink-0">{rightIcon}</span>}
          </span>
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';

export default Button;

