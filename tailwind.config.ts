module.exports = {
    content: [
        "./src/**/*.{js,ts,jsx,tsx,mdx}",
        "./components/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
        extend: {
            fontFamily: {
                sans: ['var(--font-poppins)', 'system-ui', 'sans-serif'],
            },
            animation: {
                enter: 'enter 0.2s ease-out',
                leave: 'leave 0.2s ease-in',
                'slide-in': 'slide-in 0.5s ease-out',
                'fade-in': 'fadeIn 0.6s ease-out',
                'slide-up': 'slideUp 0.6s ease-out',
                'scale-in': 'scaleIn 0.4s ease-out',
                'float': 'float 6s ease-in-out infinite',
                'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                'bounce-slow': 'bounce 2s infinite',
                'shimmer': 'shimmer 2s linear infinite',
                'gradient': 'gradient 3s ease infinite',
                'wiggle': 'wiggle 1s ease-in-out infinite',
                'heartbeat': 'heartbeat 1.5s ease-in-out infinite',
                'gradient-move': 'gradientMove 20s ease-in-out infinite',
                'gradient-move-reverse': 'gradientMoveReverse 25s ease-in-out infinite',
                'gradient-move-slow': 'gradientMoveSlow 30s ease-in-out infinite',
            },
            keyframes: {
                enter: {
                    '0%': { transform: 'scale(0.9)', opacity: 0 },
                    '100%': { transform: 'scale(1)', opacity: 1 },
                },
                leave: {
                    '0%': { transform: 'scale(1)', opacity: 1 },
                    '100%': { transform: 'scale(0.9)', opacity: 0 },
                },
                'slide-in': {
                    '0%': { transform: 'translateY(-100%)' },
                    '100%': { transform: 'translateY(0)' },
                },
                fadeIn: {
                    from: { opacity: 0, transform: 'translateY(20px)' },
                    to: { opacity: 1, transform: 'translateY(0)' },
                },
                slideUp: {
                    from: { opacity: 0, transform: 'translateY(30px)' },
                    to: { opacity: 1, transform: 'translateY(0)' },
                },
                scaleIn: {
                    from: { opacity: 0, transform: 'scale(0.9)' },
                    to: { opacity: 1, transform: 'scale(1)' },
                },
                float: {
                    '0%, 100%': { transform: 'translateY(0px)' },
                    '50%': { transform: 'translateY(-10px)' },
                },
                shimmer: {
                    '0%': { transform: 'translateX(-100%)' },
                    '100%': { transform: 'translateX(100%)' },
                },
                gradient: {
                    '0%, 100%': { backgroundPosition: '0% 50%' },
                    '50%': { backgroundPosition: '100% 50%' },
                },
                wiggle: {
                    '0%, 100%': { transform: 'rotate(-3deg)' },
                    '50%': { transform: 'rotate(3deg)' },
                },
                heartbeat: {
                    '0%, 100%': { transform: 'scale(1)' },
                    '50%': { transform: 'scale(1.1)' },
                },
            },
            backgroundImage: {
                'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
                'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
                'gradient-hero': 'linear-gradient(135deg, oklch(0.25 0.01 0) 0%, oklch(0.35 0.01 0) 100%)',
                'gradient-card': 'linear-gradient(135deg, oklch(1 0 0) 0%, oklch(0.99 0.002 0) 100%)',
                'gradient-glass': 'linear-gradient(135deg, oklch(1 0 0 / 0.8) 0%, oklch(1 0 0 / 0.6) 100%)',
                'gradient-text': 'linear-gradient(135deg, oklch(0.25 0.01 0) 0%, oklch(0.35 0.01 0) 50%, oklch(0.45 0.01 0) 100%)',
            },
            boxShadow: {
                'soft': '0 4px 20px oklch(0.15 0.02 0 / 0.04)',
                'soft-hover': '0 12px 40px oklch(0.15 0.02 0 / 0.08)',
                'glow': '0 0 30px oklch(0.25 0.01 0 / 0.1)',
                'upload': '0 8px 32px oklch(0.25 0.01 0 / 0.08)',
                'hover': '0 12px 40px oklch(0.15 0.02 0 / 0.08)',
                'dark-soft': '0 4px 20px oklch(0 0 0 / 0.15)',
                'dark-hover': '0 12px 40px oklch(0 0 0 / 0.25)',
            },
            colors: {
                // Minimalist color palette
                primary: {
                    50: 'oklch(0.98 0.01 0)',
                    100: 'oklch(0.95 0.02 0)',
                    200: 'oklch(0.9 0.05 0)',
                    300: 'oklch(0.8 0.1 0)',
                    400: 'oklch(0.7 0.15 0)',
                    500: 'oklch(0.25 0.01 0)',
                    600: 'oklch(0.2 0.01 0)',
                    700: 'oklch(0.15 0.01 0)',
                    800: 'oklch(0.1 0.01 0)',
                    900: 'oklch(0.05 0.01 0)',
                    950: 'oklch(0.02 0.01 0)',
                },
                accent: {
                    50: 'oklch(0.98 0.01 0)',
                    100: 'oklch(0.95 0.02 0)',
                    200: 'oklch(0.9 0.05 0)',
                    300: 'oklch(0.8 0.1 0)',
                    400: 'oklch(0.7 0.15 0)',
                    500: 'oklch(0.35 0.01 0)',
                    600: 'oklch(0.3 0.01 0)',
                    700: 'oklch(0.25 0.01 0)',
                    800: 'oklch(0.2 0.01 0)',
                    900: 'oklch(0.15 0.01 0)',
                    950: 'oklch(0.1 0.01 0)',
                },
            },
            spacing: {
                '18': '4.5rem',
                '88': '22rem',
                '128': '32rem',
            },
            borderRadius: {
                '4xl': '2rem',
                '5xl': '2.5rem',
            },
            backdropBlur: {
                xs: '2px',
            },
        },
    },
    plugins: [
        function ({ addUtilities, addComponents, theme }: { addUtilities: any; addComponents: any; theme: any }) {
            const newUtilities = {
                '.bg-gradient-hero': {
                    background: 'linear-gradient(135deg, oklch(0.25 0.01 0) 0%, oklch(0.35 0.01 0) 100%)',
                },
                '.bg-gradient-card': {
                    background: 'linear-gradient(135deg, oklch(1 0 0) 0%, oklch(0.99 0.002 0) 100%)',
                },
                '.dark .bg-gradient-card': {
                    background: 'linear-gradient(135deg, oklch(0.12 0.005 0 / 0.95) 0%, oklch(0.15 0.005 0 / 0.85) 100%)',
                },
                '.bg-gradient-glass': {
                    background: 'linear-gradient(135deg, oklch(1 0 0 / 0.8) 0%, oklch(1 0 0 / 0.6) 100%)',
                    backdropFilter: 'blur(20px)',
                },
                '.dark .bg-gradient-glass': {
                    background: 'linear-gradient(135deg, oklch(0.12 0.005 0 / 0.8) 0%, oklch(0.15 0.005 0 / 0.6) 100%)',
                    backdropFilter: 'blur(20px)',
                },
                '.shadow-glow': {
                    boxShadow: '0 0 30px oklch(0.25 0.01 0 / 0.1)',
                },
                '.shadow-upload': {
                    boxShadow: '0 8px 32px oklch(0.25 0.01 0 / 0.08)',
                },

                '.text-gradient': {
                    background: 'linear-gradient(135deg, oklch(0.25 0.01 0) 0%, oklch(0.35 0.01 0) 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                },
                '.dark .text-gradient': {
                    background: 'linear-gradient(135deg, oklch(0.98 0.005 0) 0%, oklch(0.85 0.005 0) 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                },
                '.text-gradient-hero': {
                    background: 'linear-gradient(135deg, oklch(0.25 0.01 0) 0%, oklch(0.35 0.01 0) 50%, oklch(0.45 0.01 0) 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                },
                '.dark .text-gradient-hero': {
                    background: 'linear-gradient(135deg, oklch(0.98 0.005 0) 0%, oklch(0.85 0.005 0) 50%, oklch(0.75 0.005 0) 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                },
                '.card-hover': {
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                },
                '.card-hover:hover': {
                    transform: 'scale(1.02)',
                    boxShadow: '0 4px 20px oklch(0.15 0.02 0 / 0.04)',
                },
                '.dark .card-hover:hover': {
                    boxShadow: '0 4px 20px oklch(0 0 0 / 0.15)',
                },
                '.glass': {
                    background: 'oklch(1 0 0 / 0.06)',
                    backdropFilter: 'blur(20px)',
                    border: '1px solid oklch(1 0 0 / 0.1)',
                },
                '.dark .glass': {
                    background: 'oklch(0.12 0.005 0 / 0.06)',
                    border: '1px solid oklch(0.96 0.005 0 / 0.1)',
                },
                '.btn-modern': {
                    position: 'relative',
                    overflow: 'hidden',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                },
                '.btn-modern::before': {
                    content: '""',
                    position: 'absolute',
                    inset: '0',
                    background: 'linear-gradient(to right, oklch(0.25 0.01 0 / 0.1), oklch(0.25 0.01 0 / 0.05))',
                    opacity: '0',
                    transition: 'opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                },
                '.btn-modern:hover::before': {
                    opacity: '1',
                },
                '.loading-dots': {
                    display: 'inline-block',
                },
                '.loading-dots::after': {
                    content: '""',
                    animation: 'loading-dots 1.5s infinite',
                },
            }
            addUtilities(newUtilities)
        }
    ],
}