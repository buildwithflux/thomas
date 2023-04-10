// @ts-ignore-next-line
import createIndices from 'quad-indices'
import { BufferGeometry, Sphere, Box3, BufferAttribute, Matrix4, Vector3 } from 'three'

import TextLayout, { createLayout } from './TextLayout'
import { computeSphere, computeBox } from './utils'
import { generateAttributes } from './vertices'

export interface IInstance {
  text: string
  lineHeight?: number
  letterSpacing?: number
  alignX?: string
  alignY?: string
  width?: number
  yShift?: number
}

export interface IOptions {
  texts: IInstance[]
  flipY?: boolean
  font?: any
  tabSize?: number
  width?: number
  lineHeight?: number
  letterSpacing?: number
  alignX?: string
  alignY?: string
  yShift?: number
}

export interface IGlyph {
  position: [number, number]
  data: any
  index: number
  // Line
  linesTotal: number
  lineIndex: number
  lineLettersTotal: number
  lineLetterIndex: number
  lineWordsTotal: number
  lineWordIndex: number
  // Word
  wordsTotal: number
  wordIndex: number
  // Letter
  lettersTotal: number
  letterIndex: number
}

// TEMP for optimizing allocations
const pointA = new Vector3()
const pointB = new Vector3()
const pointC = new Vector3()
const pointD = new Vector3()

export default class MSDFTextGeometry extends BufferGeometry {
  _layouts: TextLayout[]

  originalPositionsArray: Float32Array = new Float32Array()
  positionsArray: Float32Array = new Float32Array()
  positionsAttribute: BufferAttribute | null = null

  instancesOffsetsCache: number[] = []
  instancesLengthsCache: number[] = []

  constructor(options: IOptions) {
    super()

    this._layouts = []

    this.update(options)
  }

  setTransform(transform: Matrix4, instance = 0) {
    const instanceOffset = this.instancesOffsetsCache[instance]
    const instanceLength = this.instancesLengthsCache[instance]

    for (let i = 0; i < instanceLength; i++) {
      const instanceGlyphOffset = instanceOffset * 12 + i * 12

      const originalXA = this.originalPositionsArray[instanceGlyphOffset]
      const originalYA = this.originalPositionsArray[instanceGlyphOffset + 1]
      const originalZA = this.originalPositionsArray[instanceGlyphOffset + 2]
      const originalXB = this.originalPositionsArray[instanceGlyphOffset + 3]
      const originalYB = this.originalPositionsArray[instanceGlyphOffset + 4]
      const originalZB = this.originalPositionsArray[instanceGlyphOffset + 5]
      const originalXC = this.originalPositionsArray[instanceGlyphOffset + 6]
      const originalYC = this.originalPositionsArray[instanceGlyphOffset + 7]
      const originalZC = this.originalPositionsArray[instanceGlyphOffset + 8]
      const originalXD = this.originalPositionsArray[instanceGlyphOffset + 9]
      const originalYD = this.originalPositionsArray[instanceGlyphOffset + 10]
      const originalZD = this.originalPositionsArray[instanceGlyphOffset + 11]

      pointA.set(originalXA, originalYA, originalZA).applyMatrix4(transform)
      pointB.set(originalXB, originalYB, originalZB).applyMatrix4(transform)
      pointC.set(originalXC, originalYC, originalZC).applyMatrix4(transform)
      pointD.set(originalXD, originalYD, originalZD).applyMatrix4(transform)

      this.positionsArray[instanceGlyphOffset] = pointA.x
      this.positionsArray[instanceGlyphOffset + 1] = pointA.y
      this.positionsArray[instanceGlyphOffset + 2] = pointA.z
      this.positionsArray[instanceGlyphOffset + 3] = pointB.x
      this.positionsArray[instanceGlyphOffset + 4] = pointB.y
      this.positionsArray[instanceGlyphOffset + 5] = pointB.z
      this.positionsArray[instanceGlyphOffset + 6] = pointC.x
      this.positionsArray[instanceGlyphOffset + 7] = pointC.y
      this.positionsArray[instanceGlyphOffset + 8] = pointC.z
      this.positionsArray[instanceGlyphOffset + 9] = pointD.x
      this.positionsArray[instanceGlyphOffset + 10] = pointD.y
      this.positionsArray[instanceGlyphOffset + 11] = pointD.z
    }

    if (this.positionsAttribute) {
      this.positionsAttribute.needsUpdate = true
    }
  }

  update(options: IOptions) {
    const { texts, ...optionsWithoutTexts } = options

    this._layouts = texts.map((txt) => createLayout(txt.text, { ...optionsWithoutTexts, ...txt }))

    // get vec2 texcoords
    const flipY = options.flipY !== false

    // the desired BMFont data
    const font = options.font

    // determine texture size from font file
    const texWidth = font.common.scaleW
    const texHeight = font.common.scaleH

    const glyphs = this._layouts.map((lay) =>
      lay.glyphs.filter((glyph) => {
        const bitmap = glyph.data
        return bitmap.width * bitmap.height > 0
      })
    )

    // Keep a cache of each text instance offset and length for attributes
    this.instancesOffsetsCache = []
    this.instancesLengthsCache = []
    let offsetSoFar = 0
    glyphs.forEach((t, i) => {
      this.instancesLengthsCache[i] = t.length
      this.instancesOffsetsCache[i] = offsetSoFar
      offsetSoFar += t.length
    })
    const totalGlyphsLength = offsetSoFar

    const indices = createIndices([], {
      clockwise: true,
      type: 'uint16',
      count: totalGlyphsLength,
    })
    this.setIndex(indices)

    const attributes = glyphs.map((glyph) => generateAttributes(glyph, texWidth, texHeight, flipY))

    const positionsTotalLength = attributes.reduce((sum, at) => sum + at.positions.length, 0)
    const centersTotalLength = attributes.reduce((sum, at) => sum + at.centers.length, 0)
    const uvsTotalLength = attributes.reduce((sum, at) => sum + at.uvs.length, 0)

    const positions = new Float32Array(positionsTotalLength)
    const centers = new Float32Array(centersTotalLength)
    const uvs = new Float32Array(uvsTotalLength)
    let positionsPos = 0
    let centersPos = 0
    let uvsPos = 0
    attributes.forEach((at) => {
      positions.set(at.positions, positionsPos)
      positionsPos += at.positions.length
      centers.set(at.centers, centersPos)
      centersPos += at.centers.length
      uvs.set(at.uvs, uvsPos)
      uvsPos += at.uvs.length
    })

    this.positionsArray = positions
    this.originalPositionsArray = new Float32Array(positionsTotalLength)
    this.originalPositionsArray.set(positions)

    this.positionsAttribute = new BufferAttribute(positions, 3)
    this.setAttribute('position', this.positionsAttribute)
    this.setAttribute('center', new BufferAttribute(centers, 2))
    this.setAttribute('uv', new BufferAttribute(uvs, 2))
  }

  override computeBoundingSphere() {
    if (this.boundingSphere === null) this.boundingSphere = new Sphere()

    const positions = (this.attributes.position as BufferAttribute).array
    const itemSize = this.attributes.position.itemSize

    if (!positions || !itemSize || positions.length < 2) {
      this.boundingSphere.radius = 0
      this.boundingSphere.center.set(0, 0, 0)
      return
    }

    computeSphere(positions, this.boundingSphere)

    if (isNaN(this.boundingSphere.radius)) {
      // eslint-disable-next-line no-console
      console.error(
        'BufferGeometry.computeBoundingSphere(): Computed radius is NaN. The "position" attribute is likely to have NaN values.'
      )
    }
  }

  override computeBoundingBox() {
    if (this.boundingBox === null) {
      this.boundingBox = new Box3()
    }

    const bbox = this.boundingBox
    const positions = (this.attributes.position as BufferAttribute).array
    const itemSize = this.attributes.position.itemSize

    if (!positions || !itemSize || positions.length < 2) {
      bbox.makeEmpty()
      return
    }

    const box = computeBox(positions, bbox)

    return box
  }
}
