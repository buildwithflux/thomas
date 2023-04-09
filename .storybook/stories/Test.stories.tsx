import * as React from 'react'
import { withKnobs } from '@storybook/addon-knobs'
import { Vector3 } from 'three'

import { Setup } from '../Setup'

export default {
  title: 'Test',
  decorators: [withKnobs, (storyFn) => <Setup cameraPosition={new Vector3(2, 2, 2)}>{storyFn()}</Setup>],
}

function TestScene() {
  return (
    <mesh>
      <boxBufferGeometry />
      <meshBasicMaterial />
    </mesh>
  )
}

export const TestSt = () => <TestScene />
TestSt.storyName = 'Default'
