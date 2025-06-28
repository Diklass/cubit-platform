// src/global.d.ts
import type { LightProps, Object3DNode } from '@react-three/fiber'
import type { AmbientLight as ThreeAmbientLight, DirectionalLight as ThreeDirectionalLight, Mesh } from 'three'

declare global {
  namespace JSX {
    interface IntrinsicElements {
      ambientLight: LightProps<ThreeAmbientLight>
      directionalLight: LightProps<ThreeDirectionalLight>
      pointLight: LightProps
      spotLight: LightProps
      primitive: Object3DNode<Mesh | any, typeof Mesh>
    }
  }
}
