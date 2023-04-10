import * as React from 'react'
import { forwardRef, useContext, useImperativeHandle, useLayoutEffect, useRef } from 'react'
import { Group, Matrix4 } from 'three'

import { SDFTextProviderContext } from './context'
import { makeStyleId } from './utils'
import { ISDFTextConfig, ISDFTextStyle, ISDFTextInstance } from './types'

export type SDFTextRefType = {
  setTransform(transform: Matrix4): void
}

export const SDFText = forwardRef<SDFTextRefType, { instanceKey: string } & ISDFTextConfig & ISDFTextStyle>(
  function SDFText(
    {
      instanceKey,
      bold,
      color,
      opacity,
      outlineWidth,
      outlineOpacity,
      outlineColor,
      text,
      alignX,
      alignY,
      letterSpacing,
      yShift,
      width,
      lineHeight,
      onBeforeUpdate,
    },
    ref
  ) {
    const services = useContext(SDFTextProviderContext)
    if (!services) throw new Error('No SDFTextProvider')

    const groupRef = useRef<Group>(null)
    const instanceRef = useRef<ISDFTextInstance | null>(null)

    useImperativeHandle<SDFTextRefType, SDFTextRefType>(
      ref,
      () => ({
        setTransform(transform: Matrix4) {
          if (instanceRef.current) {
            instanceRef.current.transform = transform
          }
        },
      }),
      []
    )

    useLayoutEffect(() => {
      const textStyle = { bold, color, opacity, outlineWidth, outlineOpacity, outlineColor }
      const textConfig = { text, alignX, alignY, letterSpacing, yShift, width, lineHeight, onBeforeUpdate }
      const styleId = makeStyleId(textStyle)
      instanceRef.current = services.insertInstance(
        styleId,
        textStyle,
        instanceKey,
        textConfig,
        groupRef.current ?? undefined
      )
      return () => services.removeInstance(styleId, instanceKey)
    }, [
      services,
      instanceKey,
      text,
      alignX,
      alignY,
      letterSpacing,
      yShift,
      width,
      lineHeight,
      bold,
      color,
      opacity,
      outlineWidth,
      outlineOpacity,
      outlineColor,
      onBeforeUpdate,
    ])

    return <group ref={groupRef} />
  }
)
