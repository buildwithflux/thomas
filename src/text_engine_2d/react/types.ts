import { Color, Matrix4, Object3D } from 'three'

export interface ISDFTextStyle {
  bold?: boolean
  color?: Color
  opacity?: number
  outlineWidth?: number
  outlineOpacity?: number
  outlineColor?: Color
}

export interface ISDFTextInstance {
  config: ISDFTextConfig
  instanceKey: string
  object?: Object3D
  transform: Matrix4
}

export interface ISDFTextConfig {
  text: string
  alignX?: 'left' | 'center' | 'right'
  alignY?: 'top' | 'middle' | 'bottom'
  letterSpacing?: number
  width?: number
  lineHeight?: number
  yShift?: number
  onBeforeUpdate?: () => void
}

export interface ISDFTextServices {
  insertInstance(
    styleId: string,
    textStyle: ISDFTextStyle,
    instanceKey: string,
    config: ISDFTextConfig,
    object?: Object3D
  ): ISDFTextInstance
  removeInstance(styleId: string, instanceKey: string): void
}

export interface ISDFFont {
  sdfPath: string
  fontPath: string
}
