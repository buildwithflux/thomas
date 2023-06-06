import { GroupProps } from '@react-three/fiber'
import * as React from 'react'
import { useEffect, useLayoutEffect, useMemo, useRef } from 'react'
import { Box3, Color, Sphere, Vector3 } from 'three'

import { TextInstancesPtr } from './instancedTextBuffers'
import { InstancedTextPlaceholder } from './InstancedTextPlaceholder'
import { useInstancedTextAPI } from './InstancedTextProvider'
import { Font3D, TextAlignment } from './types'

const defaultColor = new Color('white')

export function InstancedText({
  text,
  thickness,
  fontSize,
  textAlign,
  scale,
  color,
  opacity,
  font,
  ...rest
}: {
  text: string
  thickness: number
  fontSize: number
  textAlign?: TextAlignment
  scale?: Vector3
  color?: Color
  opacity?: number
  font: Font3D
} & GroupProps) {
  const unknownGlyphIndex = (font.fontMetadata.charToIndex as Record<string, number>)['?']

  const api = useInstancedTextAPI()

  const groupRef = useRef<InstancedTextPlaceholder | null>(null)
  const myPtrRef = useRef<TextInstancesPtr | null>(null)

  useLayoutEffect(() => {
    const group = groupRef.current
    if (!group) return

    const fontScale = font.fontMetadata.fontScale
    const lineHeight =
      (font.fontMetadata.boundingBox.yMax - font.fontMetadata.boundingBox.yMin + font.fontMetadata.underlineThickness) *
      fontScale

    const scales = new Float32Array(text.length)
    const shifts = new Float32Array(text.length * 2)
    let xPos = 0
    let yPos = 0
    const totalWidths: number[] = []
    Array.from(text).forEach((char, i) => {
      if (char === '\n') {
        totalWidths.push(xPos)
        xPos = 0
        yPos -= lineHeight
      } else {
        // THREE.js's TextGeometry will use "?" as fallback, so we have to use it as well
        const glyphIndex = (font.fontMetadata.charToIndex as Record<string, number>)[char]
        const ha = font.fontMetadata.advances[glyphIndex] ?? font.fontMetadata.advances[unknownGlyphIndex]
        scales[i] = fontScale
        shifts[i * 2] = xPos
        shifts[i * 2 + 1] = yPos
        xPos += ha * fontScale
      }
    })
    totalWidths.push(xPos)

    // Since we can have multiple lines, we take the widest one
    const totalWidth = Math.max(...totalWidths)
    const yShift =
      -(
        (font.fontMetadata.boundingBox.yMax - font.fontMetadata.boundingBox.yMin) / 2 +
        font.fontMetadata.boundingBox.yMin
      ) * fontScale

    // Set alignment
    Array.from(text).forEach((_, i) => {
      if (scales[i] > 0) {
        if (textAlign === TextAlignment.left) {
          shifts[i * 2 + 1] += yShift
        }
        if (textAlign === TextAlignment.right) {
          shifts[i * 2] -= totalWidth
          shifts[i * 2 + 1] += yShift
        }
        if (textAlign === TextAlignment.center) {
          shifts[i * 2] -= totalWidth / 2
          shifts[i * 2 + 1] += yShift
        }
      }
    })

    // Compute the bounding box and sphere
    if (!group.geometry.boundingBox) group.geometry.boundingBox = new Box3()
    if (!group.geometry.boundingSphere) group.geometry.boundingSphere = new Sphere()
    group.geometry.boundingBox.setFromPoints([
      new Vector3(0, font.fontMetadata.boundingBox.yMin * fontScale, 0),
      new Vector3(totalWidth, font.fontMetadata.boundingBox.yMax * fontScale, thickness),
    ])
    group.geometry.boundingSphere.setFromPoints([
      new Vector3(0, font.fontMetadata.boundingBox.yMin * fontScale, 0),
      new Vector3(totalWidth, font.fontMetadata.boundingBox.yMax * fontScale, thickness),
    ])
    if (textAlign === TextAlignment.left) {
      group.geometry.boundingBox.translate(new Vector3(0, yShift, 0))
      group.geometry.boundingSphere.translate(new Vector3(0, yShift, 0))
    }
    if (textAlign === TextAlignment.right) {
      group.geometry.boundingBox.translate(new Vector3(-totalWidth, yShift, 0))
      group.geometry.boundingSphere.translate(new Vector3(-totalWidth, yShift, 0))
    }
    if (textAlign === TextAlignment.center) {
      group.geometry.boundingBox.translate(new Vector3(-totalWidth / 2, yShift, 0))
      group.geometry.boundingSphere.translate(new Vector3(-totalWidth / 2, yShift, 0))
    }

    const myPtr = api.addInstances(text, font, color ?? defaultColor, shifts, group)
    if (myPtr) {
      myPtrRef.current = myPtr
      return () => api.removeInstances(myPtr)
    }
  }, [text, color, font.fontMetadata, unknownGlyphIndex, thickness, textAlign, api])

  useEffect(() => {
    if (myPtrRef.current) {
      api.setOpacity(myPtrRef.current, opacity ?? 1)
    }
  }, [api, opacity])

  const textAPI = useMemo(
    () => ({
      getBuffers: () => myPtrRef.current && api.getBuffers(myPtrRef.current),
      getPtr: () => myPtrRef.current,
      setGlyphs: (text: string) => {
        if (!myPtrRef.current) return
        const buffers = api.getBuffers(myPtrRef.current)
        if (!buffers) return

        const glyphIds = Array.from(text).map((c) => font.fontMetadata.charToIndex[c])
        buffers.instanceGIndexBuffer.set(glyphIds, myPtrRef.current.start)
        buffers.instanceGIndexBufferAttribute.needsUpdate = true
      },
    }),
    [font.fontMetadata.charToIndex]
  )

  return (
    // @ts-ignore
    <instancedTextPlaceholder
      scale={[fontSize * (scale?.x ?? 1), fontSize * (scale?.y ?? 1), thickness * (scale?.z ?? 1)]}
      {...rest}
      textAPI={textAPI}
      ref={groupRef}
      frustumCulled={false}
    />
  )
}
