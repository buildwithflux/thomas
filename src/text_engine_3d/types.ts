export enum TextAlignment {
  left = 'left',
  right = 'right',
  center = 'center',
}

export interface FontInfo3D {
  fontScale: number
  underlineThickness: number
  boundingBox: BoundingBox
  advances: number[]
  maxVertices: number
  charToIndex: Record<string, number>
  xShift: number
  yShift: number
  zShift: number
  xScale: number
  yScale: number
  zScale: number
}

export interface Font3D {
  fontMetadata: FontInfo3D
  texturePath: string
}

interface BoundingBox {
  xMin: number
  yMin: number
  xMax: number
  yMax: number
}
