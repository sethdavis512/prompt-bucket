import { forwardRef } from 'react';

interface TextFieldProps {
    label?: string;
    labelClassName?: string;
    error?: string;
    helpText?: string;
    required?: boolean;
    type?: 'text' | 'email' | 'password' | 'url' | 'tel' | 'search';
    className?: string;
    inputClassName?: string;
    placeholder?: string;
    value?: string;
    defaultValue?: string;
    onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void;
    onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
    name?: string;
    id?: string;
    autoComplete?: string;
    disabled?: boolean;
    readOnly?: boolean;
    minLength?: number;
    maxLength?: number;
    pattern?: string;
    size?: 'sm' | 'md' | 'lg';
    'data-cy'?: string;
}

const TextField = forwardRef<HTMLInputElement, TextFieldProps>(
    (
        {
            label,
            labelClassName,
            error,
            helpText,
            required,
            type = 'text',
            className = '',
            inputClassName = '',
            placeholder,
            value,
            defaultValue,
            onChange,
            onBlur,
            onKeyDown,
            name,
            id,
            autoComplete,
            disabled,
            readOnly,
            minLength,
            maxLength,
            pattern,
            size = 'md',
            'data-cy': dataCy
        },
        ref
    ) => {
        const sizeClasses = {
            sm: 'px-3 py-1.5 text-sm',
            md: 'px-3 py-2 text-sm',
            lg: 'px-4 py-3 text-base'
        };

        const baseInputClasses = `
            block w-full rounded-md border-0 py-1.5 text-zinc-900 shadow-sm ring-1 ring-inset ring-zinc-300 
            placeholder:text-zinc-400 focus:ring-2 focus:ring-inset focus:ring-primary-600 
            disabled:cursor-not-allowed disabled:bg-zinc-50 disabled:text-zinc-500 disabled:ring-zinc-200
            ${sizeClasses[size]}
            ${error ? 'ring-red-300 focus:ring-red-600' : ''}
            ${inputClassName}
        `
            .trim()
            .replace(/\s+/g, ' ');

        return (
            <div className={className}>
                {label && (
                    <label
                        htmlFor={id}
                        className={`block text-sm font-medium leading-6 text-zinc-900 mb-2 ${
                            labelClassName || ''
                        }`}
                    >
                        {label}
                        {required && (
                            <span className="text-red-500 ml-1">*</span>
                        )}
                    </label>
                )}
                <div>
                    <input
                        ref={ref}
                        type={type}
                        name={name}
                        id={id}
                        value={value}
                        defaultValue={defaultValue}
                        onChange={onChange}
                        onBlur={onBlur}
                        onKeyDown={onKeyDown}
                        autoComplete={autoComplete}
                        disabled={disabled}
                        readOnly={readOnly}
                        required={required}
                        minLength={minLength}
                        maxLength={maxLength}
                        pattern={pattern}
                        className={baseInputClasses}
                        placeholder={placeholder}
                        data-cy={dataCy}
                    />
                </div>
                {error && (
                    <p className="mt-2 text-sm text-red-600" id={`${id}-error`}>
                        {error}
                    </p>
                )}
                {helpText && !error && (
                    <p
                        className="mt-2 text-sm text-zinc-500"
                        id={`${id}-description`}
                    >
                        {helpText}
                    </p>
                )}
            </div>
        );
    }
);

TextField.displayName = 'TextField';

export default TextField;
