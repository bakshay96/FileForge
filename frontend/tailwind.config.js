/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        display: ["Outfit", "sans-serif"],
      },
      colors: {
        brand: {
          50:  "#f0f4ff",
          100: "#e0e9ff",
          200: "#c1d3fe",
          300: "#93b4fd",
          400: "#6090fa",
          500: "#3b6ef6",
          600: "#2550eb",
          700: "#1d3fd8",
          800: "#1e35af",
          900: "#1e318a",
        },
        accent: {
          400: "#a78bfa",
          500: "#8b5cf6",
          600: "#7c3aed",
        },
        surface: {
          900: "#0a0b0f",
          800: "#111318",
          700: "#181b22",
          600: "#1e2230",
          500: "#252a38",
        },
      },
      backgroundImage: {
        "hero-gradient": "linear-gradient(135deg, #0a0b0f 0%, #111827 50%, #0f172a 100%)",
        "card-gradient": "linear-gradient(135deg, rgba(59,110,246,0.08) 0%, rgba(139,92,246,0.05) 100%)",
        "glow-brand": "radial-gradient(circle at 50% 0%, rgba(59,110,246,0.25) 0%, transparent 70%)",
      },
      animation: {
        "float": "float 6s ease-in-out infinite",
        "pulse-slow": "pulse 4s cubic-bezier(0.4,0,0.6,1) infinite",
        "gradient-shift": "gradient-shift 8s ease infinite",
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%":       { transform: "translateY(-12px)" },
        },
        "gradient-shift": {
          "0%, 100%": { backgroundPosition: "0% 50%" },
          "50%":       { backgroundPosition: "100% 50%" },
        },
      },
      boxShadow: {
        "brand-glow": "0 0 40px rgba(59,110,246,0.35)",
        "card-hover":  "0 20px 60px rgba(0,0,0,0.4), 0 0 0 1px rgba(59,110,246,0.2)",
      },
    },
  },
  plugins: [],
};
