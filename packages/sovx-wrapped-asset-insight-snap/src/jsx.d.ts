/**
 * @metamask/snaps-sdk ships a JSX runtime but no JSX namespace. MetaMask template repos get
 * `ElementChildrenAttribute` from a hoisted @types/react; this package has no React, so it declares
 * the one member TypeScript needs to check `children` against each component's props.
 */
export {};

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace JSX {
    interface ElementChildrenAttribute {
      children: unknown;
    }
  }
}
