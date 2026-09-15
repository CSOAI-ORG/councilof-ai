// Vite `?inline` CSS imports resolve to the stylesheet text (used to style shadow roots).
declare module "*.css?inline" {
  const css: string;
  export default css;
}
