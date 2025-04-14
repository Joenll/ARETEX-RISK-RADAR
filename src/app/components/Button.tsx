import React from 'react';

// Define the props the Button component will accept
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode; // Content inside the button (text, icons, etc.)
  variant?: 'primary' | 'secondary' | 'danger' | 'outline' | 'submit' | 'edit' | 'back' | 'delete'; // Added new variants
  className?: string; // Allow passing additional custom classes
  isLoading?: boolean; // Optional loading state
  // You can add other specific props if needed, like 'icon'
}

const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary', // Default variant
  className = '',
  type = 'button', // Default type
  disabled = false,
  isLoading = false, // Default loading state
  ...props // Pass down any other standard button props (like onClick)
}) => {
  // Base styles for all buttons
  const baseStyles = 'inline-flex items-center justify-center px-4 py-2 rounded-md font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 transition ease-in-out duration-150 disabled:opacity-50 disabled:cursor-not-allowed';

  // Variant-specific styles
  const variantStyles = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500',
    secondary: 'bg-gray-600 text-white hover:bg-gray-700 focus:ring-gray-500',
    danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
    outline: 'border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 focus:ring-indigo-500',
    // --- New Variants ---
    submit: 'bg-green-600 text-white hover:bg-green-700 focus:ring-green-500', // Often green for submit/save
    edit: 'bg-yellow-500 text-white hover:bg-yellow-600 focus:ring-yellow-400', // Yellow or orange for edit
    back: 'bg-gray-200 text-gray-800 hover:bg-gray-300 focus:ring-gray-400', // Lighter gray for back/cancel
    delete: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500', // Same as danger, but explicit name
    // Add more variants as needed
  };

  // Combine base, variant, and custom classes
  // Add loading styles if isLoading is true
  const combinedClassName = `
    ${baseStyles}
    ${variantStyles[variant]}
    ${isLoading ? 'cursor-wait' : ''}
    ${className}
  `.trim();

  return (
    <button
      type={type}
      className={combinedClassName}
      disabled={disabled || isLoading} // Disable button when loading
      {...props} // Spread the rest of the props (like onClick)
    >
      {isLoading && (
        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      )}
      {children}
    </button>
  );
};

export default Button;
