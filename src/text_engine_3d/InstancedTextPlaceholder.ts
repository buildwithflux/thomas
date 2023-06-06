import { ReactThreeFiber, extend } from '@react-three/fiber'
import { Box3, Group, Intersection, Matrix4, Ray, Raycaster, Sphere, Vector3 } from 'three'
import { InstancedTextAPI } from './types'

export function registerInstancedTextPlaceholderToR3F() {
  extend({ InstancedTextPlaceholder })
}

declare global {
  namespace JSX {
    interface IntrinsicElements {
      instancedTextPlaceholder: ReactThreeFiber.Object3DNode<InstancedTextPlaceholder, typeof InstancedTextPlaceholder>
    }
  }
}

class InstancedTextPlaceholderGeometry {
  boundingBox: Box3 | null = null
  boundingSphere: Sphere | null = null
  computeBoundingBox(): void {
    // Will be computed in InstancedText.tsx
    if (!this.boundingBox) this.boundingBox = new Box3()
  }
  computeBoundingSphere(): void {
    // Will be computed in InstancedText.tsx
    if (!this.boundingSphere) this.boundingSphere = new Sphere()
  }
}

const _inverseMatrix = new Matrix4()
const _ray = new Ray()
const _sphere = new Sphere()
const _vA = new Vector3()

export class InstancedTextPlaceholder extends Group {
  textAPI?: InstancedTextAPI = undefined

  // For correct bounding box
  geometry: InstancedTextPlaceholderGeometry = new InstancedTextPlaceholderGeometry()

  override raycast(raycaster: Raycaster, intersects: Intersection[]) {
    const geometry = this.geometry
    const matrixWorld = this.matrixWorld
    // Checking boundingSphere distance to ray
    if (geometry.boundingSphere === null) geometry.computeBoundingSphere()
    _sphere.copy(geometry.boundingSphere!)
    _sphere.applyMatrix4(matrixWorld)
    if (raycaster.ray.intersectsSphere(_sphere) === false) return
    _inverseMatrix.copy(matrixWorld).invert()
    _ray.copy(raycaster.ray).applyMatrix4(_inverseMatrix)
    // Check boundingBox before continuing
    if (geometry.boundingBox !== null && _ray.intersectBox(geometry.boundingBox, _vA) === null) return
    intersects.push({
      distance: _vA.distanceTo(raycaster.ray.origin),
      point: _vA.clone(),
      object: this,
    })
  }
}
