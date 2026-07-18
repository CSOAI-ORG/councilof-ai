/// <reference path="./react-three-fiber.d.ts" />
/// <reference path="./framer-motion.d.ts" />
/// <reference path="./zustand.d.ts" />

import type { ThreeElements } from '@react-three/fiber'

declare global {
  namespace JSX {
    interface IntrinsicElements extends ThreeElements {}
  }
}

export {}
