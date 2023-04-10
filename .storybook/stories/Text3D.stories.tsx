import * as React from 'react'
import { withKnobs } from '@storybook/addon-knobs'
import { Canvas } from '@react-three/fiber'
import { MapControls } from '@react-three/drei'
import { Perf } from 'r3f-perf/dist/components/Perf.js'

import { InstancedTextProvider, InstancedText } from '../../src'
// @ts-ignore
import robotoRegular3DInfo from '../public/robotoRegular3D/info.json'

export default {
  title: 'Text3D',
  decorators: [
    withKnobs,
    (storyFn) => (
      <Canvas orthographic camera={{ position: [-8, -8, 50], zoom: 10, up: [0, 0, 1], far: 10000 }}>
        {storyFn()}
        <MapControls />
        <Perf />
      </Canvas>
    ),
  ],
}

const styles = [
  {
    fontMetadata: robotoRegular3DInfo,
    texturePath: '/robotoRegular3D/font.png',
  },
]

function Text3DScene() {
  const side = 32
  return (
    <InstancedTextProvider styles={styles}>
      {new Array(side * side).fill(0).map((_, i) => (
        <group key={`Text ${i}`} position={[(i % side) * 8, Math.floor(i / side) * 2, 0]}>
          <InstancedText text={`Text ${i}`} font={styles[0]} thickness={1} fontSize={1} />
        </group>
      ))}
    </InstancedTextProvider>
  )
}

export const Text3DSt = () => <Text3DScene />
Text3DSt.storyName = 'Default'
