type Glyph = {
  data: { x: number; y: number; width: number; height: number; page: number; xoffset: number; yoffset: number }
  position: [number, number]
  linesTotal: number
  lineIndex: number
  lineLettersTotal: number
  lineLetterIndex: number
  lineWordsTotal: number
  lineWordIndex: number
  wordsTotal: number
  wordIndex: number
  lettersTotal: number
  letterIndex: number
}

export function generateAttributes(glyphs: Glyph[], texWidth: number, texHeight: number, flipY: boolean) {
  const uvs = new Float32Array(glyphs.length * 4 * 2)
  const positions = new Float32Array(glyphs.length * 4 * 3)
  const centers = new Float32Array(glyphs.length * 4 * 2)

  let i = 0
  let j = 0
  let k = 0

  glyphs.forEach(function (glyph) {
    const bitmap = glyph.data

    // UV
    const bw = bitmap.x + bitmap.width
    const bh = bitmap.y + bitmap.height

    // top left position
    const u0 = bitmap.x / texWidth
    let v1 = bitmap.y / texHeight
    const u1 = bw / texWidth
    let v0 = bh / texHeight

    if (flipY) {
      v1 = (texHeight - bitmap.y) / texHeight
      v0 = (texHeight - bh) / texHeight
    }

    // BL
    uvs[i++] = u0
    uvs[i++] = v1
    // TL
    uvs[i++] = u0
    uvs[i++] = v0
    // TR
    uvs[i++] = u1
    uvs[i++] = v0
    // BR
    uvs[i++] = u1
    uvs[i++] = v1

    /// Positions, Centers

    // bottom left position
    const x = glyph.position[0] + bitmap.xoffset
    const y = glyph.position[1] + bitmap.yoffset

    // quad size
    const w = bitmap.width
    const h = bitmap.height

    // Position

    // BL
    positions[j++] = x
    positions[j++] = y
    positions[j++] = 0
    // TL
    positions[j++] = x
    positions[j++] = y + h
    positions[j++] = 0
    // TR
    positions[j++] = x + w
    positions[j++] = y + h
    positions[j++] = 0
    // BR
    positions[j++] = x + w
    positions[j++] = y
    positions[j++] = 0

    // Center
    centers[k++] = x + w / 2
    centers[k++] = y + h / 2

    centers[k++] = x + w / 2
    centers[k++] = y + h / 2

    centers[k++] = x + w / 2
    centers[k++] = y + h / 2

    centers[k++] = x + w / 2
    centers[k++] = y + h / 2
  })

  return { uvs, positions, centers }
}
