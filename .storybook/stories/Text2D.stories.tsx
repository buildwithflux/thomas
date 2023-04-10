import * as React from 'react'
import { withKnobs } from '@storybook/addon-knobs'
import { Canvas } from '@react-three/fiber'
import { MapControls } from '@react-three/drei'
import { Perf } from 'r3f-perf/dist/components/Perf.js'

import { SDFText, SDFTextProvider } from '../../src'

export default {
  title: 'Text2D',
  decorators: [
    withKnobs,
    (storyFn) => (
      <Canvas orthographic camera={{ position: [0, 0, 50], zoom: 10, up: [0, 0, 1], far: 10000 }}>
        {storyFn()}
        <MapControls />
        <Perf />
      </Canvas>
    ),
  ],
}

const fontPathRegular = {
  sdfPath: '/robotoRegular2D/roboto-regular.png',
  fontPath: '/robotoRegular2D/roboto-regular.fnt',
}
const fontPathBold = {
  sdfPath: '/robotoBold2D/roboto-bold.png',
  fontPath: '/robotoBold2D/roboto-bold.fnt',
}

function Text2DScene() {
  const side = 32
  return (
    <SDFTextProvider fontPathRegular={fontPathRegular} fontPathBold={fontPathBold}>
      {new Array(side * side).fill(0).map((_, i) => (
        <group key={`Text ${i}`} position={[(i % side) * 2.5, Math.floor(i / side), 0]}>
          <SDFText text={`Text ${i}`} instanceKey={`Text ${i}`} />
        </group>
      ))}
    </SDFTextProvider>
  )
}

export const Text2DSt = () => <Text2DScene />
Text2DSt.storyName = 'Default'
