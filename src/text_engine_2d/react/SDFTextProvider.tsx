import { useTexture } from '@react-three/drei'
import { MeshProps, useFrame, useLoader } from '@react-three/fiber'
import * as React from 'react'
import { PropsWithChildren, useLayoutEffect, useMemo, useState } from 'react'
import { Color, Matrix4, Texture } from 'three'
import { Font, FontLoader } from 'three/examples/jsm/loaders/FontLoader'

import MSDFTextGeometry from '../MSDFTextGeometry'
import { registerTextEngineToR3F } from '../register'

import { SDFTextProviderContext } from './context'
import { ISDFTextStyle, ISDFTextInstance, ISDFTextServices, ISDFFont } from './types'
import { makeStyleId } from './utils'

// Since the outline is done with two meshes, we hardcode two render order values
// to ensure the foreground is rendered after the outline
const foreRenderOrder = 99999
const outlineRenderOrder = 99998

interface ISDFTextStyleGroup {
  textStyle: ISDFTextStyle
  instances: ISDFTextInstance[]
}

const temp = new Matrix4()
const transformFinal = new Matrix4()
const white = new Color('#ffffff')
const black = new Color('#000000')

const scaleFactor = 0.01

function StyleGroupRenderer({
  instances,
  textStyle,
  atlas,
  font,
  atlasBold,
  fontBold,
  ...rest
}: {
  instances: ISDFTextInstance[]
  textStyle: ISDFTextStyle
  atlas: Texture
  font: Font
  atlasBold: Texture
  fontBold: Font
} & MeshProps) {
  const fontData = textStyle.bold ? fontBold.data : font.data

  const geometry = useState(() => new MSDFTextGeometry({ font: fontData, texts: [] }))[0]
  useLayoutEffect(() => () => geometry.dispose(), [geometry])

  useLayoutEffect(() => {
    const texts = instances.map((is) => is.config)
    geometry.update({ font: fontData, texts })
  }, [geometry, instances, fontData])

  useFrame(() => {
    // TODO: Revisit this to avoid calculating the matrix every frame
    instances.forEach((inst, index) => {
      inst.config.onBeforeUpdate?.()

      transformFinal.identity()

      const placeholder = instances[index].object
      if (placeholder) {
        placeholder.updateMatrixWorld()
        transformFinal.multiply(placeholder.matrixWorld)
      }

      transformFinal.multiply(inst.transform)

      temp.makeScale(scaleFactor, scaleFactor, scaleFactor)
      transformFinal.multiply(temp)

      const layout = geometry._layouts[index]
      if (layout) {
        const width = layout.width ?? 0
        const height = layout.height ?? 0
        const lineHeight = layout.lineHeight ?? 0
        const optYShift = layout._options.yShift ?? 0
        const bottomShift = -height + lineHeight / 4
        const topShift = lineHeight / 2
        let xShift = 0
        if (layout._options.alignX === 'center') xShift = -width / 2
        if (layout._options.alignX === 'right') xShift = -width
        let yShift = bottomShift + optYShift
        if (layout._options.alignY === 'middle') yShift = (bottomShift + topShift) / 2 - layout.ascender + optYShift
        if (layout._options.alignY === 'bottom') yShift = topShift + optYShift
        temp.makeTranslation(xShift, yShift, 0)
        transformFinal.multiply(temp)
      }

      temp.makeRotationX(Math.PI)
      transformFinal.multiply(temp)

      geometry.setTransform(transformFinal, index)
    })
  })

  const uniforms = useMemo(() => {
    return {
      uMap: { value: textStyle.bold ? atlasBold : atlas },
      uColor: { value: textStyle.color ?? white },
      uOpacity: { value: textStyle.opacity ?? 1.0 },
      uOffset: { value: 0 },
    }
  }, [textStyle.bold, textStyle.opacity, textStyle.color, atlas, atlasBold])
  const uniformsOutline = useMemo(() => {
    return {
      uMap: { value: textStyle.bold ? atlasBold : atlas },
      uColor: { value: textStyle.outlineColor ?? black },
      uOpacity: { value: textStyle.outlineOpacity ?? 0.4 },
      uOffset: { value: textStyle.outlineWidth },
    }
  }, [textStyle.bold, textStyle.outlineOpacity, textStyle.outlineColor, textStyle.outlineWidth, atlas, atlasBold])

  return (
    <>
      <mesh geometry={geometry} frustumCulled={false} renderOrder={foreRenderOrder} {...rest}>
        <mSDFTextMaterial uniforms={uniforms} />
      </mesh>
      {(textStyle.outlineWidth ?? 0) > 0 && (
        <mesh geometry={geometry} frustumCulled={false} renderOrder={outlineRenderOrder} {...rest}>
          <mSDFTextMaterial uniforms={uniformsOutline} depthWrite={false} />
        </mesh>
      )}
    </>
  )
}

export function SDFTextProvider({
  children,
  fontPathRegular,
  fontPathBold,
}: PropsWithChildren<{ fontPathRegular: ISDFFont; fontPathBold: ISDFFont }>) {
  useMemo(registerTextEngineToR3F, [])

  const atlas = useTexture(fontPathRegular.sdfPath)
  const font = useLoader(FontLoader, fontPathRegular.fontPath) as Font
  const atlasBold = useTexture(fontPathBold.sdfPath)
  const fontBold = useLoader(FontLoader, fontPathBold.fontPath) as Font

  // We have a mutable map of immutable arrays, so we are using a force update
  const instancesGroups = useState<Map<string, ISDFTextStyleGroup>>(() => new Map())[0]
  const forceUpdate = useState(0)[1]

  const api = useMemo<ISDFTextServices>(
    () => ({
      insertInstance(styleId, textStyle, instanceKey, config, object) {
        const newInst = { instanceKey, config, object, transform: new Matrix4() }
        const prevRecord = instancesGroups.get(styleId)
        instancesGroups.set(styleId, { textStyle, instances: [...(prevRecord?.instances ?? []), newInst] })
        forceUpdate((i) => i + 1)
        return newInst
      },
      removeInstance(styleId, instanceKey) {
        const prevRecord = instancesGroups.get(styleId)
        if (prevRecord) {
          const without = prevRecord.instances.filter((inst) => inst.instanceKey !== instanceKey)
          if (without.length === 0) {
            instancesGroups.delete(styleId)
          } else {
            instancesGroups.set(styleId, {
              textStyle: prevRecord.textStyle,
              instances: without,
            })
          }
          forceUpdate((i) => i + 1)
        }
      },
    }),
    []
  )

  return (
    <SDFTextProviderContext.Provider value={api}>
      <>
        {children}

        {Array.from(instancesGroups.values()).map((ig) => (
          <StyleGroupRenderer
            key={makeStyleId(ig.textStyle)}
            textStyle={ig.textStyle}
            instances={ig.instances}
            atlas={atlas}
            font={font}
            atlasBold={atlasBold}
            fontBold={fontBold}
          />
        ))}
      </>
    </SDFTextProviderContext.Provider>
  )
}
