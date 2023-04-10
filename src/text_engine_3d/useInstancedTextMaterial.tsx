import { useMemo } from 'react'
import { NearestFilter, RawShaderMaterial, Texture, Vector3 } from 'three'

import { FontInfo3D } from './types'
import { useTexture } from '@react-three/drei'

export function useInstancedTextMaterial(fontTexture: Texture, fontMetadata: FontInfo3D) {
  const textMat = useMemo(() => {
    const material = new RawShaderMaterial()
    material.uniforms = {
      offsets: { value: fontTexture },
      shift: { value: new Vector3(fontMetadata.xShift, fontMetadata.yShift, fontMetadata.zShift) },
      scale: { value: new Vector3(fontMetadata.xScale, fontMetadata.yScale, fontMetadata.zScale) },
    }

    material.vertexShader = `#version 300 es
        precision highp int;
        precision highp float;
        uniform mat4 modelViewMatrix;
        uniform mat4 projectionMatrix;
        uniform sampler2D offsets;
        uniform vec3 shift;
        uniform vec3 scale;
        in vec3 position;
        in mat4 instanceMatrix;
        in float instanceGIndex;
        in vec4 instanceColor;
        out vec4 vColor;
        void main() {
            vColor = instanceColor;
            vec3 offset = texelFetch(offsets, ivec2(gl_VertexID, instanceGIndex), 0).rgb * scale + shift;
            gl_Position = projectionMatrix * modelViewMatrix * instanceMatrix * vec4(offset, 1.0);
        }`

    // TODO: support generic shading
    material.fragmentShader = `#version 300 es
        precision highp float;
        layout(location = 0) out highp vec4 pc_fragColor;
        in vec4 vColor;
        void main() {
            if (vColor.a == 0.0) discard;
            pc_fragColor = vColor;
        }`

    return material
  }, [fontTexture, fontMetadata])

  return textMat
}

export function useFontTexture(texPath: string) {
  const fontTexture = useTexture<string>(texPath)
  fontTexture.flipY = false
  fontTexture.magFilter = NearestFilter
  fontTexture.minFilter = NearestFilter
  return fontTexture
}
