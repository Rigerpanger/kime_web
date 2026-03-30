import React from 'react';

const Button = ({ children, variant = 'primary', className = '', ...props }) => {
    // Pixar-ish style: Rounded, bubbly, gradient
    const baseStyles = "px-6 py-3 rounded-full font-bold tracking-wide transition-all duration-300 flex items-center justify-center active:scale-95";

    const variants = {
        primary: "bg-gradient-to-r from-neonBlue to-neonPurple text-white shadow-[0_4px_14px_0_rgba(188,19,254,0.39)] hover:shadow-[0_6px_20px_rgba(188,19,254,0.23)] hover:-translate-y-1 block relative overflow-hidden",
        outline: "border-2 border-neonBlue text-neonBlue hover:bg-neonBlue/10 hover:shadow-[0_0_20px_rgba(0,243,255,0.3)]",
        ghost: "text-gray-400 hover:text-white"
    };

    return (
        <button className={`${baseStyles} ${variants[variant]} ${className}`} {...props}>
            {children}
        </button>
    );
};

export default Button;
