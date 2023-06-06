import * as React from 'react'
import { withKnobs } from '@storybook/addon-knobs'
import { Canvas, useFrame } from '@react-three/fiber'
import { MapControls } from '@react-three/drei'
import { Perf } from 'r3f-perf/dist/components/Perf.js'
import { Matrix4, Color } from 'three'
import { uniqueId } from 'lodash'

import { SDFText, SDFTextProvider, SDFTextRefType } from '../../src'

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

function RotatingText() {
  const textRef = React.useRef<SDFTextRefType>(null)

  const uid = React.useState(() => uniqueId().split('-')[0])[0]!

  useFrame(({ clock }) => {
    const transform = new Matrix4()
    const temp = new Matrix4()

    temp.makeRotationZ(clock.elapsedTime)
    transform.multiply(temp)

    const size = Math.abs(Math.sin(clock.elapsedTime))
    temp.makeScale(size, size, 1)
    transform.multiply(temp)

    textRef.current?.setTransform(transform)
  })

  return <SDFText ref={textRef} text={uid} instanceKey={uid} />
}

function RotatingTextScene() {
  return (
    <SDFTextProvider fontPathRegular={fontPathRegular}>
      <RotatingText />

      <group position={[3, 2, 0]}>
        <RotatingText />
      </group>
    </SDFTextProvider>
  )
}
export const RotatingTextSt = () => <RotatingTextScene />
RotatingTextSt.storyName = 'RotatingText'

function StaticScene() {
  const side = 32
  return (
    <SDFTextProvider fontPathRegular={fontPathRegular}>
      {new Array(side * side).fill(0).map((_, i) => (
        <group key={`Text ${i}`} position={[(i % side) * 2.5, Math.floor(i / side), 0]}>
          <SDFText text={`Text ${i}`} instanceKey={`Text ${i}`} />
        </group>
      ))}
    </SDFTextProvider>
  )
}
export const StaticSt = () => <StaticScene />
StaticSt.storyName = 'Static'

function SmallerScene() {
  const side = 32
  const scale = 0.2
  return (
    <SDFTextProvider fontPathRegular={fontPathRegular}>
      {new Array(side * side).fill(0).map((_, i) => (
        <group key={`Text ${i}`} position={[(i % side) * 2.5, Math.floor(i / side), 0]} scale={[scale, scale, scale]}>
          <SDFText text={`Text ${i}`} instanceKey={`Text ${i}`} />
        </group>
      ))}
    </SDFTextProvider>
  )
}
export const SmallerSt = () => <SmallerScene />
SmallerSt.storyName = 'Smaller'

function AlignmentsScene() {
  return (
    <>
      <SDFTextProvider fontPathRegular={fontPathRegular}>
        <group position={[0, 0, 0]}>
          <SDFText text="Left Aligned" instanceKey="left" alignX="left" />
        </group>
        <group position={[0, -2, 0]}>
          <SDFText text="Center Aligned" instanceKey="center" alignX="center" />
        </group>
        <group position={[0, -4, 0]}>
          <SDFText text="Right Aligned" instanceKey="right" alignX="right" />
        </group>
        <group position={[0, -6, 0]}>
          <SDFText text="Wide spacing" instanceKey="wide" alignX="center" letterSpacing={32} />
        </group>
        <group position={[0, -10, 0]}>
          <SDFText
            text="Multiline test is supposed to wrap after with a given width (top)"
            instanceKey="multiline_top"
            alignX="left"
            alignY="top"
            width={500}
          />
        </group>
        <group position={[6, -10, 0]}>
          <SDFText
            text="Multiline test is supposed to wrap after with a given width (middle)"
            instanceKey="multiline_middle"
            alignX="left"
            alignY="middle"
            width={500}
          />
        </group>
        <group position={[12, -10, 0]}>
          <SDFText
            text="Multiline test is supposed to wrap after with a given width (bottom)"
            instanceKey="multiline_bottom"
            alignX="left"
            alignY="bottom"
            width={500}
          />
        </group>
        <group position={[8, 0, 0]}>
          <SDFText text="Top Aligned" instanceKey="left_top" alignX="left" alignY="top" />
        </group>
        <group position={[16, 0, 0]}>
          <SDFText text="Middle Aligned" instanceKey="left_middle" alignX="left" alignY="middle" />
        </group>
        <group position={[24, 0, 0]}>
          <SDFText text="Bottom Aligned" instanceKey="left_bottom" alignX="left" alignY="bottom" />
        </group>
      </SDFTextProvider>
      <mesh position-z={-2} scale={[0.05, 100, 1]}>
        <boxGeometry />
        <meshBasicMaterial color="#ff0000" />
      </mesh>
      <mesh position-z={-2} scale={[100, 0.05, 1]}>
        <boxGeometry />
        <meshBasicMaterial color="#ff0000" />
      </mesh>
      <mesh position-x={8} position-y={-10} position-z={-2} scale={[20, 0.05, 1]}>
        <boxGeometry />
        <meshBasicMaterial color="#ff0000" />
      </mesh>
    </>
  )
}
export const AlignmentsSt = () => <AlignmentsScene />
AlignmentsSt.storyName = 'Alignments'

function StylesScene() {
  const [state, setState] = React.useState(false)

  React.useEffect(() => {
    setInterval(() => {
      setState((a) => !a)
    }, 1000)
  }, [])

  return (
    <SDFTextProvider fontPathRegular={fontPathRegular} fontPathBold={fontPathBold}>
      <group position={[-5, 4, 0]}>
        <SDFText
          alignX="center"
          text="Test"
          instanceKey="test1_bold"
          color={React.useMemo(() => new Color('white').convertLinearToSRGB(), [])}
          bold={state}
          opacity={0.5}
        />
      </group>
      <group position={[-5, 2, 0]}>
        <SDFText
          alignX="center"
          text="Test"
          instanceKey="test2_bold"
          color={React.useMemo(() => new Color('#ff0000').convertLinearToSRGB(), [])}
          bold={state}
        />
      </group>
      <group position={[-5, 0, 0]}>
        <SDFText
          alignX="center"
          text="Test"
          instanceKey="test3_bold"
          color={React.useMemo(() => new Color('#00ff00').convertLinearToSRGB(), [])}
          bold={state}
        />
      </group>
      <group position={[-5, -2, 0]}>
        <SDFText
          alignX="center"
          text="Test"
          instanceKey="test4_bold"
          color={React.useMemo(() => new Color('#0000ff').convertLinearToSRGB(), [])}
          bold={state}
        />
      </group>
      <group position={[-5, -4, 0]}>
        <SDFText
          alignX="center"
          text="Test"
          instanceKey="test5_bold"
          color={React.useMemo(() => new Color('white').convertLinearToSRGB(), [])}
          bold={state}
        />
      </group>
      <group position={[0, 4, 0]}>
        <SDFText
          alignX="center"
          text="Test"
          instanceKey="test1"
          color={React.useMemo(() => new Color('white').convertLinearToSRGB(), [])}
          opacity={0.5}
        />
      </group>
      <group position={[0, 2, 0]}>
        <SDFText
          alignX="center"
          text="Test"
          instanceKey="test2"
          color={React.useMemo(() => new Color('#ff0000').convertLinearToSRGB(), [])}
        />
      </group>
      <group position={[0, 0, 0]}>
        <SDFText
          alignX="center"
          text="Test"
          instanceKey="test3"
          color={React.useMemo(() => new Color('#00ff00').convertLinearToSRGB(), [])}
        />
      </group>
      <group position={[0, -2, 0]}>
        <SDFText
          alignX="center"
          text="Test"
          instanceKey="test4"
          color={React.useMemo(() => new Color('#0000ff').convertLinearToSRGB(), [])}
        />
      </group>
      <group position={[0, -4, 0]}>
        <SDFText
          alignX="center"
          text="Test"
          instanceKey="test5"
          color={React.useMemo(() => new Color('white').convertLinearToSRGB(), [])}
        />
      </group>
      <group position={[5, 4, 0]}>
        <SDFText
          alignX="center"
          text="Test"
          instanceKey="test6"
          color={React.useMemo(() => new Color('white').convertLinearToSRGB(), [])}
          opacity={0.5}
          outlineWidth={0.05}
          outlineColor={React.useMemo(() => new Color('#ff0000').convertLinearToSRGB(), [])}
        />
      </group>
      <group position={[5, 2, 0]}>
        <SDFText
          alignX="center"
          text="Test"
          instanceKey="test7"
          color={React.useMemo(() => new Color('#ff0000').convertLinearToSRGB(), [])}
          outlineWidth={0.1}
          outlineColor={React.useMemo(() => new Color('purple').convertLinearToSRGB(), [])}
        />
      </group>
      <group position={[5, 0, 0]}>
        <SDFText
          alignX="center"
          text="Test"
          instanceKey="test8"
          color={React.useMemo(() => new Color('#00ff00').convertLinearToSRGB(), [])}
          outlineWidth={0.2}
          outlineColor={React.useMemo(() => new Color('#0000ff').convertLinearToSRGB(), [])}
        />
      </group>
      <group position={[5, -2, 0]}>
        <SDFText
          alignX="center"
          text="Test"
          instanceKey="test9"
          color={React.useMemo(() => new Color('#0000ff').convertLinearToSRGB(), [])}
          outlineWidth={0.25}
          outlineColor={React.useMemo(() => new Color('#ff0000').convertLinearToSRGB(), [])}
        />
      </group>
      <group position={[5, -4, 0]}>
        <SDFText
          alignX="center"
          text="Test"
          instanceKey="test10"
          color={React.useMemo(() => new Color('white').convertLinearToSRGB(), [])}
          outlineWidth={0.4}
          outlineColor={React.useMemo(() => new Color('black').convertLinearToSRGB(), [])}
        />
      </group>
    </SDFTextProvider>
  )
}
export const StylesSt = () => <StylesScene />
StylesSt.storyName = 'Styles'

function MemLeakTextScene() {
  const [state, setState] = React.useState(0)
  React.useEffect(() => {
    setInterval(() => {
      setState((a) => a + 1)
    }, 1000)
  }, [])

  const side = 32
  return (
    <SDFTextProvider fontPathRegular={fontPathRegular} fontPathBold={fontPathBold}>
      {new Array(side * side).fill(0).map((_, i) => (
        <group key={`Text ${i}`} position={[(i % side) * 2.5, Math.floor(i / side), 0]}>
          <SDFText
            text={`Text ${(Math.random() * 100).toFixed(0)}`}
            instanceKey={`Text ${(Math.random() * 100).toFixed(0)}`}
            opacity={Number(Math.random().toFixed(1))}
            bold={state % 2 === 0}
          />
        </group>
      ))}
    </SDFTextProvider>
  )
}
export const MemLeakTextSt = () => <MemLeakTextScene />
MemLeakTextSt.storyName = 'MemLeakText'
