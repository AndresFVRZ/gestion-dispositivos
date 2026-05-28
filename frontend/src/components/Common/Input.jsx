import React from 'react';

const Input = ({ 
  label, 
  name, 
  value, 
  onChange, 
  type = 'text', 
  placeholder = '',
  required = false,
  disabled = false,
  error = '',
  className = ''
}) => {
  return (
    <div className={`mb-4 ${className}`}>
      {label && (
        <label htmlFor={name} className="label">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      <input
        id={name}
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        className={`input ${error ? 'border-red-500' : ''} ${disabled ? 'bg-gray-100' : ''}`}
      />
      {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
    </div>
  );
};

export default Input;