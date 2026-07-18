declare module '@react-three/fiber' {
  import * as React from 'react';
  import * as THREE from 'three';

  export interface ThreeElements {
    mesh: any;
    boxGeometry: any;
    meshStandardMaterial: any;
    meshBasicMaterial: any;
    ambientLight: any;
    directionalLight: any;
    pointLight: any;
    group: any;
    line: any;
    lineBasicMaterial: any;
    bufferGeometry: any;
    points: any;
    pointsMaterial: any;
    cylinderGeometry: any;
    circleGeometry: any;
    sphereGeometry: any;
    ringGeometry: any;
    textGeometry: any;
    planeGeometry: any;
    bufferAttribute: any;
    orbitControls: any;
    [key: string]: any;
  }

  export const Canvas: React.FC<{
    children?: React.ReactNode;
    camera?: any;
    shadows?: boolean;
    style?: React.CSSProperties;
    className?: string;
    gl?: any;
  }>;

  export function useFrame(callback: (state: any, delta: number) => void): void;
  export function useThree(): any;

  export type ThreeEvent<T> = T;
}
