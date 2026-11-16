import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Paleta extraída diretamente da Logo Oficial da Artes em Aroma:
        creme: "#F5EFE3",        // Fundo pergaminho/creme suave da logo
        salvia: "#8B9270",       // Verde sálvia suave da folhagem e tipografia "Aroma"
        oliva: "#697151",        // Verde oliva botânico principal ("Aroma" e folhas)
        dourado: "#9E8458",      // Dourado/bronze do medalhão circular, gota, pilão e "em"
        marrom: "#563822",       // Marrom café/cacau rico da palavra "Artes"
        brancoQuente: "#FAF7F0", // Tom claro quente do interior do selo
      },
      fontFamily: {
        serif: ["var(--font-cormorant)", "Georgia", "serif"],
        sans: ["var(--font-dm-sans)", "system-ui", "sans-serif"],
        script: ["var(--font-script)", "cursive"],
      },
    },
  },
  plugins: [],
};

export default config;
