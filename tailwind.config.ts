import type { Config } from 'tailwindcss';
export default { content: ['./src/**/*.{ts,tsx}'], theme: { extend: { colors: { pitch:'#72f238', ink:'#070b0e', panel:'#11181d', muted:'#91a0a9' }, boxShadow:{glow:'0 0 30px rgba(114,242,56,.13)'} } }, plugins: [] } satisfies Config;
