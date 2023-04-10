import { useMemo } from 'react'
import { MeshPhongMaterial, NearestFilter, Texture, Vector3 } from 'three'
import { useTexture } from '@react-three/drei'

import { FontInfo3D } from './types'

export function useInstancedTextMaterial(offsetsTexture: Texture, normalsTexture: Texture, fontMetadata: FontInfo3D) {
  const textMat = useMemo(() => {
    const material = new MeshPhongMaterial()
    material.onBeforeCompile = (shader) => {
      shader.uniforms = {
        ...shader.uniforms,
        offsets: { value: offsetsTexture },
        normals: { value: normalsTexture },
        shift: { value: new Vector3(fontMetadata.xShift, fontMetadata.yShift, fontMetadata.zShift) },
        scale: { value: new Vector3(fontMetadata.xScale, fontMetadata.yScale, fontMetadata.zScale) },
      }

      // Strip out features we definitely don't need
      // Strip morph targets
      shader.vertexShader = shader.vertexShader.replace(/#include <morphtarget_pars_vertex>/gi, '')
      shader.vertexShader = shader.vertexShader.replace(/#include <morphtarget_vertex>/gi, '')
      shader.vertexShader = shader.vertexShader.replace(/#include <morphcolor_vertex>/gi, '')
      shader.vertexShader = shader.vertexShader.replace(/#include <morphnormal_vertex>/gi, '')

      // Strip animated vertex skinning
      shader.vertexShader = shader.vertexShader.replace(/#include <skinning_pars_vertex>/gi, '')
      shader.vertexShader = shader.vertexShader.replace(/#include <skinbase_vertex>/gi, '')
      shader.vertexShader = shader.vertexShader.replace(/#include <skinning_vertex>/gi, '')
      shader.vertexShader = shader.vertexShader.replace(/#include <skinnormal_vertex>/gi, '')

      // Strip displacement mapping
      shader.vertexShader = shader.vertexShader.replace(/#include <displacementmap_pars_vertex>/gi, '')
      shader.vertexShader = shader.vertexShader.replace(/#include <displacementmap_vertex>/gi, '')

      // Insert global chunk
      shader.vertexShader = shader.vertexShader.replace(
        />[\n]*void/,
        `>
        uniform sampler2D offsets;
        uniform sampler2D normals;
        uniform vec3 shift;
        uniform vec3 scale;
        in float instanceGIndex;

        void`
      )

      // Insert program chunk
      shader.vertexShader = shader.vertexShader.replace(
        /void main\(\) {/,
        `void main() { vec3 offset = texelFetch(offsets, ivec2(gl_VertexID, instanceGIndex), 0).rgb * scale + shift;`
      )

      // Replace normal init
      shader.vertexShader = shader.vertexShader.replace(
        /#include <beginnormal_vertex>/,
        `vec3 objectNormal = (texelFetch(normals, ivec2(gl_VertexID, instanceGIndex), 0).rgb) - 0.5;`
      )
      // Replace position init
      shader.vertexShader = shader.vertexShader.replace(/#include <begin_vertex>/, `vec3 transformed = offset;`)
    }

    return material
  }, [offsetsTexture, normalsTexture, fontMetadata])

  return textMat
}

export function useFontTexture(texPath: string) {
  const fontTexture = useTexture<string>(texPath)
  fontTexture.flipY = false
  fontTexture.magFilter = NearestFilter
  fontTexture.minFilter = NearestFilter
  return fontTexture
}
