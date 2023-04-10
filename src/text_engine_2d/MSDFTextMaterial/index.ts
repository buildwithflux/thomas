import { ShaderMaterial, FrontSide, Color } from 'three'

// @ts-ignore
import fragmentShader from './fragment.glsl'
// @ts-ignore
import vertexShader from './vertex.glsl'

export default class MSDFTextMaterial extends ShaderMaterial {
  constructor(options = {}) {
    const defaultOptions = {
      side: FrontSide,
      transparent: true,
      extensions: {
        derivatives: true,
      },
      uniforms: {
        uOpacity: { value: 1 },
        uOffset: { value: 0 },
        uColor: { value: new Color('#ffffff') },
        uMap: { value: null },
      },
      vertexShader,
      fragmentShader,
    }

    options = { ...defaultOptions, ...options }
    super(options)
  }
}
