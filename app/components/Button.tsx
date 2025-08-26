import { forwardRef } from 'react';
import { Link } from 'react-router';

type BaseProps = {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  className?: string;
};

type ButtonProps = BaseProps & React.ButtonHTMLAttributes<HTMLButtonElement> & {
  as?: 'button';
  href?: never;
  to?: never;
};

type LinkProps = BaseProps & {
  as: 'link';
  to: string;
  href?: never;
} & Omit<React.ComponentProps<typeof Link>, 'to' | 'children'>;

type AnchorProps = BaseProps & React.AnchorHTMLAttributes<HTMLAnchorElement> & {
  as: 'a';
  href: string;
  to?: never;
};

type Props = ButtonProps | LinkProps | AnchorProps;

const Button = forwardRef<HTMLButtonElement | HTMLAnchorElement, Props>(
  ({ 
    children, 
    variant = 'primary', 
    size = 'md', 
    disabled = false, 
    loading = false,
    className = '',
    as = 'button',
    ...props 
  }, ref) => {
    const baseClasses = 'inline-flex items-center justify-center font-medium rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2';
    
    const variantClasses = {
      primary: 'border border-transparent text-white bg-indigo-600 hover:bg-indigo-700 focus:ring-indigo-500 disabled:bg-gray-300',
      secondary: 'border border-gray-300 shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:ring-indigo-500 disabled:bg-gray-50',
      outline: 'border border-indigo-600 text-indigo-600 bg-transparent hover:bg-indigo-50 focus:ring-indigo-500 disabled:border-gray-300 disabled:text-gray-300'
    };
    
    const sizeClasses = {
      sm: 'px-3 py-2 text-sm leading-4',
      md: 'px-4 py-2 text-sm',
      lg: 'px-6 py-3 text-base'
    };
    
    const disabledClasses = disabled || loading ? 'disabled:opacity-50 disabled:cursor-not-allowed' : '';
    
    const classes = `${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${disabledClasses} ${className}`.trim();

    if (as === 'link') {
      const { to, ...linkProps } = props as LinkProps;
      return (
        <Link
          ref={ref as React.Ref<HTMLAnchorElement>}
          to={to}
          className={classes}
          {...linkProps}
        >
          {loading && <span className="animate-spin mr-2">⟳</span>}
          {children}
        </Link>
      );
    }

    if (as === 'a') {
      const { href, ...anchorProps } = props as AnchorProps;
      return (
        <a
          ref={ref as React.Ref<HTMLAnchorElement>}
          href={href}
          className={classes}
          {...anchorProps}
        >
          {loading && <span className="animate-spin mr-2">⟳</span>}
          {children}
        </a>
      );
    }

    const { type = 'button', ...buttonProps } = props as ButtonProps;
    return (
      <button
        ref={ref as React.Ref<HTMLButtonElement>}
        type={type}
        disabled={disabled || loading}
        className={classes}
        {...buttonProps}
      >
        {loading && <span className="animate-spin mr-2">⟳</span>}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';

export default Button;