// PostCSS pipeline — runs AFTER @tailwindcss/vite emits its CSS.
// Goal: emit sRGB fallback declarations before every `oklch()` and
// `color-mix()` value so iOS Safari <= 16.1 (which can parse neither)
// falls back to valid colors instead of dropping the whole declaration
// and rendering the page as a black screen.
//
// preserve: true keeps the original modern-syntax declaration so modern
// browsers still get the wide-gamut color; old Safari just uses the sRGB
// line above it via the normal cascade.
import postcssOklabFunction from '@csstools/postcss-oklab-function';
import postcssColorMixFunction from '@csstools/postcss-color-mix-function';

export default {
  plugins: [
    postcssOklabFunction({ preserve: true, subFeatures: { displayP3: false } }),
    postcssColorMixFunction({ preserve: true }),
  ],
};
