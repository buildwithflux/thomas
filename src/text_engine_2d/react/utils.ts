import { ISDFTextStyle } from './types'

export const makeStyleId = (style: ISDFTextStyle) =>
  [
    style.bold,
    style.color?.getHexString(),
    style.opacity,
    style.outlineWidth,
    style.outlineOpacity,
    style.outlineColor?.getHexString(),
  ].join('_')
