import { useFrame } from '@react-three/fiber'
import * as React from 'react'
import {
  createContext,
  forwardRef,
  PropsWithChildren,
  useCallback,
  useContext,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react'
import { Color, InstancedBufferGeometry, Object3D } from 'three'

import {
  addTextInstances,
  InstancedTextBuffers,
  reallocInstancedTextBuffers,
  removeTextInstances,
  TextInstancesPtr,
  textInstancingUpdateTransforms,
  updateTextInstancingBuffersAfterAdd,
} from './instancedTextBuffers'
import { registerInstancedTextPlaceholderToR3F } from './InstancedTextPlaceholder'
import { useFontTexture, useInstancedTextMaterial } from './useInstancedTextMaterial'
import { Font3D } from './types'

interface IInstancedTextAPI {
  addInstances: (
    text: string,
    font: Font3D,
    color: Color,
    shifts: Float32Array,
    parentGroup: Object3D
  ) => TextInstancesPtr | undefined
  removeInstances: (ptr: TextInstancesPtr) => void
  setOpacity: (ptr: TextInstancesPtr, opacity: number) => void
}

const instancedTextContext = createContext<IInstancedTextAPI | null>(null)

export function useInstancedTextAPI() {
  const contextValue = useContext(instancedTextContext)
  if (!contextValue) throw new Error('No instanced text context')
  return contextValue
}

// To be able to support italic and regular, we segment our instances managers into several style groups
const StyleGroup = forwardRef<IInstancedTextAPI & { font: Font3D }, { font: Font3D }>(function StyleGroup(
  { font },
  ref
) {
  const textMat = useInstancedTextMaterial(
    useFontTexture(font.offsetsPath),
    useFontTexture(font.normalsPath),
    font.fontMetadata
  )

  const [{ instanceAllocated, geometry }, setInstanceData] = useState({
    // Starts as 0 to force an initial realloc
    instanceAllocated: 0,
    geometry: null as InstancedBufferGeometry | null,
  })

  const buffersRef = useRef<InstancedTextBuffers | null>(null)

  const realloc = useCallback(
    (instanceAllocated: number) => {
      buffersRef.current = reallocInstancedTextBuffers(
        buffersRef.current,
        instanceAllocated,
        font.fontMetadata.maxVertices
      )
      setInstanceData({ instanceAllocated, geometry: buffersRef.current.geometry })
      return buffersRef.current
    },
    [font.fontMetadata.maxVertices]
  )

  useImperativeHandle(
    ref,
    () => ({
      font,
      addInstances: (text, font, color, shifts, parentGroup) => {
        // Initial alloc
        const buffers = buffersRef.current ?? realloc(text.length * 2)

        const instance = addTextInstances(
          buffers,
          font.fontMetadata.charToIndex as Record<string, number>,
          text,
          font,
          color,
          shifts,
          parentGroup
        )

        if (buffers.currentGlyphs.length > buffers.instanceAllocated) {
          // Grow only, doubles every time
          realloc(buffers.currentGlyphs.length * 2)
        } else {
          updateTextInstancingBuffersAfterAdd(buffers)
        }
        // Realloc already updates the buffers

        return instance
      },
      removeInstances: (ptr) => {
        const buffers = buffersRef.current
        if (!buffers) return
        removeTextInstances(buffers, ptr)
      },
      setOpacity: (ptr, opacity) => {
        const buffers = buffersRef.current
        if (!buffers) return

        if (!buffers.instanceColorBuffer || !buffers.instanceColorBufferAttribute) return
        for (let index = 0; index < ptr.length; index++) {
          buffers.currentColors[(ptr.start + index) * 4 + 3] = opacity
          buffers.instanceColorBuffer[(ptr.start + index) * 4 + 3] = opacity
        }
        buffers.instanceColorBufferAttribute.needsUpdate = true
      },
    }),
    [font, realloc]
  )

  useFrame(() => {
    const buffers = buffersRef.current
    if (buffers) {
      textInstancingUpdateTransforms(buffers)
    }
  })

  if (!geometry) return null
  return <instancedMesh args={[geometry, textMat, instanceAllocated]} />
})

export function InstancedTextProvider({ children, styles }: PropsWithChildren<{ styles: Font3D[] }>) {
  useMemo(registerInstancedTextPlaceholderToR3F, [])

  const stylesApisRef = useRef(new WeakMap<Font3D, IInstancedTextAPI>())
  const setApiRefFn = useCallback((v: (IInstancedTextAPI & { font: Font3D }) | null) => {
    if (v) {
      stylesApisRef.current.set(v.font, v)
    }
  }, [])

  const api = useMemo<IInstancedTextAPI>(
    () => ({
      addInstances: (text, font, color, shifts, parentGroup) => {
        const api = stylesApisRef.current.get(font)
        return api?.addInstances(text, font, color, shifts, parentGroup)
      },
      removeInstances: (ptr: TextInstancesPtr) => {
        const api = stylesApisRef.current.get(ptr.font)
        api?.removeInstances(ptr)
      },
      setOpacity: (ptr, opacity) => {
        const api = stylesApisRef.current.get(ptr.font)
        api?.setOpacity(ptr, opacity)
      },
    }),
    []
  )

  return (
    <instancedTextContext.Provider value={api}>
      {styles.map((font) => (
        <StyleGroup key={font.offsetsPath} font={font} ref={setApiRefFn} />
      ))}
      {children}
    </instancedTextContext.Provider>
  )
}
