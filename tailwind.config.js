export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                obsidian: '#0b0b0b',
                charcoal: '#121212',
                neonBlue: '#00f3ff',
                neonPurple: '#bc13fe',
            },
            fontFamily: {
                sans: ['Unbounded', 'sans-serif'],
            },
            keyframes: {
                'fade-in': {
                    '0%': { opacity: '0' },
                    '100%': { opacity: '1' },
                },
                'fade-in-right': {
                    '0%': { opacity: '0', transform: 'translateX(20px)' },
                    '100%': { opacity: '1', transform: 'translateX(0)' },
                }
            },
            animation: {
                'spin-slow': 'spin 10s linear infinite',
                'fade-in': 'fade-in 0.8s ease-out forwards',
                'fade-in-right': 'fade-in-right 0.8s ease-out forwards',
            }
        },
    },
    plugins: [],
}
