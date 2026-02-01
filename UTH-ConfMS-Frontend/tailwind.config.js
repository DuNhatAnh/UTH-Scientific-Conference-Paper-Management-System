/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    darkMode: 'class',
    theme: {
        extend: {
            colors: {
                primary: {
                    DEFAULT: '#0056b3',
                    hover: '#004494',
                    foreground: '#ffffff'
                },
                accent: {
                    DEFAULT: '#007bff', // Electric Blue placeholder
                    foreground: '#ffffff'
                },
                background: {
                    light: '#f8f9fa',
                    dark: '#1a1d21'
                },
                card: {
                    light: '#ffffff',
                    dark: '#212529'
                },
                text: {
                    main: {
                        light: '#212529',
                        dark: '#e9ecef'
                    },
                    sec: {
                        light: '#6c757d',
                        dark: '#adb5bd'
                    }
                },
                border: {
                    light: '#dee2e6',
                    dark: '#343a40'
                }
            },
            fontFamily: {
                sans: ['Inter', 'sans-serif'],
                display: ['Inter', 'sans-serif'],
            },
            borderRadius: {
                DEFAULT: '0.25rem',
                lg: '0.5rem',
                xl: '0.75rem',
                full: '9999px'
            }
        },
    },
    plugins: [],
}
