import {
  Color,
  Float32BufferAttribute,
  InstancedBufferAttribute,
  InstancedBufferGeometry,
  Matrix4,
  Object3D,
} from 'three'
import { Font3D } from './types'

export type TextInstancesPtr = {
  start: number
  length: number
  text: string
  font: Font3D
  parentGroup: Object3D
}

export type InstancedTextBuffers = {
  instanceAllocated: number
  geometry: InstancedBufferGeometry

  // Temp buffers for easier realloc
  currentInstances: TextInstancesPtr[]
  currentGlyphs: number[]
  currentShifts: number[]
  currentColors: number[]

  // TODO: refactor into a single interleaved buffer
  instanceMatrixBuffer: Float32Array
  instanceMatrixBufferAttribute: InstancedBufferAttribute
  instanceGIndexBuffer: Float32Array
  instanceGIndexBufferAttribute: InstancedBufferAttribute
  instanceColorBuffer: Float32Array
  instanceColorBufferAttribute: InstancedBufferAttribute
}

/** Reallocates a new geometry, a new set of buffers and attributes with a given size */
export function reallocInstancedTextBuffers(
  buffers: InstancedTextBuffers | null,
  instanceAllocated: number,
  maxVertices: number
): InstancedTextBuffers {
  buffers?.geometry.dispose()

  const geom = new InstancedBufferGeometry()
  geom.instanceCount = instanceAllocated

  const positionBuffer = new Float32Array(maxVertices * 3)
  const positionBufferAttribute = new Float32BufferAttribute(positionBuffer, 3, false)
  geom.setAttribute('position', positionBufferAttribute)

  const instanceMatrixBuffer = new Float32Array(geom.instanceCount * 16)
  const instanceMatrixBufferAttribute = new InstancedBufferAttribute(instanceMatrixBuffer, 16, false, 1)
  geom.setAttribute('instanceMatrix', instanceMatrixBufferAttribute)

  const instanceGIndexBuffer = new Float32Array(geom.instanceCount)
  buffers && instanceGIndexBuffer.set(buffers.currentGlyphs)
  const instanceGIndexBufferAttribute = new InstancedBufferAttribute(instanceGIndexBuffer, 1, false, 1)
  geom.setAttribute('instanceGIndex', instanceGIndexBufferAttribute)

  const instanceColorBuffer = new Float32Array(geom.instanceCount * 4)
  buffers && instanceColorBuffer.set(buffers.currentColors)
  const instanceColorBufferAttribute = new InstancedBufferAttribute(instanceColorBuffer, 4, true, 1)
  geom.setAttribute('instanceColor', instanceColorBufferAttribute)

  return {
    instanceAllocated,
    geometry: geom,
    currentInstances: buffers?.currentInstances ?? [],
    currentGlyphs: buffers?.currentGlyphs ?? [],
    currentShifts: buffers?.currentShifts ?? [],
    currentColors: buffers?.currentColors ?? [],

    instanceMatrixBuffer,
    instanceMatrixBufferAttribute,
    instanceGIndexBuffer,
    instanceGIndexBufferAttribute,
    instanceColorBuffer,
    instanceColorBufferAttribute,
  }
}

/** Adds new instances to the temp buffers, without affecting the geometry. You will need to update the attributes manually after this call. */
export function addTextInstances(
  buffers: InstancedTextBuffers,
  charToIndex: Record<string, number>,
  text: string,
  font: Font3D,
  color: Color,
  shifts: Float32Array,
  parentGroup: Object3D
): TextInstancesPtr {
  const start = buffers.currentGlyphs.length
  const length = text.length

  const glyphIds = Array.from(text).map((c) => charToIndex[c])
  const colors = Array.from(text).flatMap(() => [color.r, color.g, color.b, 1])
  buffers.currentGlyphs.push(...glyphIds)
  buffers.currentShifts.push(...shifts)
  buffers.currentColors.push(...colors)

  const instance = { start, length, text, parentGroup, font }
  buffers.currentInstances.push(instance)
  return instance
}

export function updateTextInstancingBuffersAfterAdd(buffers: InstancedTextBuffers) {
  buffers.instanceGIndexBuffer.set(buffers.currentGlyphs)
  buffers.instanceGIndexBufferAttribute.needsUpdate = true
  buffers.instanceColorBuffer.set(buffers.currentColors)
  buffers.instanceColorBufferAttribute.needsUpdate = true
}

/** Removes instances from both the temp buffers and attribute buffers. */
export function removeTextInstances(buffers: InstancedTextBuffers, ptr: TextInstancesPtr) {
  const index = buffers.currentInstances.indexOf(ptr)
  if (index === -1) return

  // Update all the indices after the element to remove
  for (let i = 0; i < buffers.currentInstances.length; i++) {
    if (i > index) {
      buffers.currentInstances[i].start -= ptr.length
    }
  }

  buffers.currentInstances.splice(index, 1)
  buffers.currentGlyphs.splice(ptr.start, ptr.length)
  buffers.currentShifts.splice(ptr.start * 2, ptr.length * 2)
  buffers.currentColors.splice(ptr.start * 4, ptr.length * 4)

  buffers.instanceGIndexBuffer.fill(0)
  buffers.instanceGIndexBuffer.set(buffers.currentGlyphs)
  buffers.instanceGIndexBufferAttribute.needsUpdate = true
  buffers.instanceColorBuffer.fill(0)
  buffers.instanceColorBuffer.set(buffers.currentColors)
  buffers.instanceColorBufferAttribute.needsUpdate = true
  buffers.instanceMatrixBuffer.fill(0)
  buffers.instanceMatrixBufferAttribute.needsUpdate = true
}

const tempMatrix = new Matrix4()
const tempMatrixWorld = new Matrix4()
export function textInstancingUpdateTransforms(buffers: InstancedTextBuffers) {
  buffers.currentInstances.forEach((inst) => {
    for (let j = 0; j < inst.length; j++) {
      const xShift = buffers.currentShifts[(inst.start + j) * 2]
      const yShift = buffers.currentShifts[(inst.start + j) * 2 + 1]
      tempMatrixWorld.copy(inst.parentGroup.matrixWorld)
      tempMatrix.identity().setPosition(xShift, yShift, 0)
      tempMatrixWorld.multiply(tempMatrix)
      tempMatrixWorld.toArray(buffers.instanceMatrixBuffer, (inst.start + j) * 16)
    }
  })
  buffers.instanceMatrixBufferAttribute.needsUpdate = true
}
