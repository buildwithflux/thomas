import { extend, ReactThreeFiber } from '@react-three/fiber'

import MSDFTextGeometry from './MSDFTextGeometry'
import MSDFTextMaterial from './MSDFTextMaterial'

export function registerTextEngineToR3F() {
  extend({ MSDFTextMaterial, MSDFTextGeometry })
}

declare global {
  namespace JSX {
    interface IntrinsicElements {
      mSDFTextMaterial: ReactThreeFiber.MaterialNode<MSDFTextMaterial, typeof MSDFTextMaterial>
      mSDFTextGeometry: ReactThreeFiber.BufferGeometryNode<MSDFTextGeometry, typeof MSDFTextGeometry>
    }
  }
}
