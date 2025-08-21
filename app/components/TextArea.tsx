import { forwardRef } from 'react';

interface TextAreaProps {
    label?: string;
    labelClassName?: string;
    error?: string;
    helpText?: string;
    required?: boolean;
    className?: string;
    textAreaClassName?: string;
    placeholder?: string;
    value?: string;
    defaultValue?: string;
    onChange?: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
    name?: string;
    id?: string;
    disabled?: boolean;
    readOnly?: boolean;
    rows?: number;
    cols?: number;
    minLength?: number;
    maxLength?: number;
    resize?: boolean;
}

const TextArea = forwardRef<HTMLTextAreaElement, TextAreaProps>(
    (
        {
            label,
            labelClassName,
            error,
            helpText,
            required,
            className = '',
            textAreaClassName = '',
            placeholder,
            value,
            defaultValue,
            onChange,
            name,
            id,
            disabled,
            readOnly,
            rows = 4,
            cols,
            minLength,
            maxLength,
            resize = true
        },
        ref
    ) => {
        const baseTextAreaClasses = `
            block p-2.5 w-full text-sm text-gray-900 bg-gray-50 rounded-lg border border-gray-300 focus:ring-blue-500 focus:border-blue-500
            ${error ? 'border-red-300 focus:ring-red-500 focus:border-red-500 bg-red-50' : ''}
            ${!resize ? 'resize-none' : 'resize-y'}
            ${textAreaClassName}
        `
            .trim()
            .replace(/\s+/g, ' ');

        return (
            <div className={className}>
                {label && (
                    <label
                        htmlFor={id}
                        className={`block mb-2 text-sm font-medium text-gray-900 dark:text-white ${
                            error ? 'text-red-700 dark:text-red-500' : ''
                        } ${labelClassName || ''}`}
                    >
                        {label}
                        {required && (
                            <span className="text-red-500 ml-1">*</span>
                        )}
                    </label>
                )}
                <div>
                    <textarea
                        ref={ref}
                        name={name}
                        id={id}
                        value={value}
                        defaultValue={defaultValue}
                        onChange={onChange}
                        disabled={disabled}
                        readOnly={readOnly}
                        required={required}
                        minLength={minLength}
                        maxLength={maxLength}
                        rows={rows}
                        cols={cols}
                        className={baseTextAreaClasses}
                        placeholder={placeholder}
                    />
                </div>
                {error && (
                    <p
                        className="mt-2 text-sm text-red-600 dark:text-red-400 flex items-center"
                        id={`${id}-error`}
                    >
                        <svg
                            className="w-4 h-4 mr-1"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                        >
                            <path
                                fillRule="evenodd"
                                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                                clipRule="evenodd"
                            />
                        </svg>
                        {error}
                    </p>
                )}
                {helpText && !error && (
                    <p
                        className="mt-2 text-sm text-gray-500 dark:text-gray-400"
                        id={`${id}-description`}
                    >
                        {helpText}
                    </p>
                )}
            </div>
        );
    }
);

TextArea.displayName = 'TextArea';

export default TextArea;
