// Tool for generating a data texture for the 3D instanced text engine
// There are no cli parameters, please edit the file here
// Run it using yarn ts-node -O '{"module":"commonjs","esModuleInterop":true,"resolveJsonModule":true}' tools/genFontTexture.ts

import fs from 'fs'

import Jimp from 'jimp'
import { Box3 } from 'three'
import { TextGeometry, FontLoader } from 'three-stdlib'

import RobotoItalic from '../frontend/src/resources/assets/fonts/roboto/Roboto_Italic.json'
import Roboto from '../frontend/src/resources/assets/fonts/roboto/Roboto_Regular.json'

function generate(font: any) {
  const fontData = font.data as any
  const glypsArray = Object.keys(fontData.glyphs)
  const advances = glypsArray.map((char) => fontData.glyphs[char].ha)
  const geometries = glypsArray.map((char) => new TextGeometry(char, { font, height: 1, size: 1, curveSegments: 4 }))

  const charToIndex = Object.fromEntries(glypsArray.map<[string, number]>((c, i) => [c, i]))
  const positions = geometries.map((g) => g.getAttribute('position'))
  const maxVertices = Math.max(...positions.map((p) => p.count))

  const finalBB = new Box3()
  geometries.forEach((g) => {
    g.computeBoundingBox()
    finalBB.union(g.boundingBox!)
  })
  const width = finalBB.max.x - finalBB.min.x
  const height = finalBB.max.y - finalBB.min.y
  const depth = finalBB.max.z - finalBB.min.z

  const offsetsBuffer = new Uint8ClampedArray(maxVertices * geometries.length * 4)
  offsetsBuffer.fill(0)
  geometries.forEach((geom, i) => {
    const positions = geom.getAttribute('position')
    const baseOffset = i * maxVertices * 4
    for (let j = 0; j < maxVertices; j++) {
      if (j < positions.count) {
        offsetsBuffer[baseOffset + j * 4 + 0] = ((positions.getX(j) - finalBB.min.x) / width) * 255
        offsetsBuffer[baseOffset + j * 4 + 1] = ((positions.getY(j) - finalBB.min.y) / height) * 255
        offsetsBuffer[baseOffset + j * 4 + 2] = ((positions.getZ(j) - finalBB.min.z) / depth) * 255
      } else {
        offsetsBuffer[baseOffset + j * 4 + 0] = ((positions.getX(positions.count - 1) - finalBB.min.x) / width) * 255
        offsetsBuffer[baseOffset + j * 4 + 1] = ((positions.getY(positions.count - 1) - finalBB.min.y) / height) * 255
        offsetsBuffer[baseOffset + j * 4 + 2] = ((positions.getX(positions.count - 1) - finalBB.min.x) / depth) * 255
      }
      offsetsBuffer[baseOffset + j * 4 + 3] = 255
    }
  })

  return {
    buffer: offsetsBuffer,
    width: maxVertices,
    height: geometries.length,
    metadata: {
      fontScale: 1 / fontData.resolution,
      underlineThickness: fontData.underlineThickness,
      boundingBox: {
        xMin: fontData.boundingBox.xMin,
        yMin: fontData.boundingBox.yMin,
        xMax: fontData.boundingBox.xMax,
        yMax: fontData.boundingBox.yMax,
      },
      advances,
      maxVertices,
      charToIndex,
      xShift: finalBB.min.x,
      yShift: finalBB.min.y,
      zShift: finalBB.min.z,
      xScale: width,
      yScale: height,
      zScale: depth,
    },
  }
}

function loadFont(italic = false) {
  const fl = new FontLoader()
  if (italic) {
    return fl.parse(RobotoItalic as any)
  } else {
    return fl.parse(Roboto as any)
  }
}

const font = loadFont()
const { buffer, width, height, metadata } = generate(font)
fs.writeFileSync('info.json', JSON.stringify(metadata), 'utf-8')
new Jimp({ data: buffer, width, height }, (err: any, image: any) => {
  image.write('font.png')
})
