import * as React from 'react'
import { withKnobs } from '@storybook/addon-knobs'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, Text3D } from '@react-three/drei'
import { Perf } from 'r3f-perf/dist/components/Perf.js'

import { InstancedTextProvider, InstancedText } from '../../src'
// @ts-ignore
import robotoRegular3DInfo from '../public/robotoRegular3D/info.json'
import { useRef } from 'react'
import { Group, Mesh } from 'three'
import { TextAlignment } from '../../src/text_engine_3d/types'
import { TextGeometry, FontLoader } from 'three-stdlib'
import { suspend } from 'suspend-react'

export default {
  title: 'Demo3D',
  decorators: [
    withKnobs,
    (storyFn) => (
      <Canvas>
        {storyFn()}
        <OrbitControls />
        <Perf logsPerSecond={1} />
      </Canvas>
    ),
  ],
}

const styles = [
  {
    fontMetadata: robotoRegular3DInfo,
    offsetsPath: '/robotoRegular3D/font.png',
    normalsPath: '/robotoRegular3D/normals.png',
  },
]

function Demo3DScene() {
  const width = 32
  const height = 128
  const ratio = width / height

  const groupRef = useRef<Group>(null)

  useFrame(({ clock }) => {
    groupRef.current?.children.forEach((c) => {
      const px = (c.position.x / 6 - width / 2) / ratio
      const pz = c.position.z / 1.8 - height / 2
      const dist = Math.sqrt(px ** 2 + pz ** 2)
      const py = Math.sin(dist / 3 + clock.elapsedTime) * 3
      c.position.y = py
      ;(c as any).textAPI.setGlyphs(py.toFixed(4))
    })
  })

  return (
    <InstancedTextProvider styles={styles}>
      <group ref={groupRef}>
        {new Array(width * height).fill(0).map((_, i) => (
          <InstancedText
            key={`${i % width},${Math.floor(i / width)}`}
            position={[(i % width) * 6, 0, Math.floor(i / width) * 1.8]}
            rotation={[-Math.PI / 2, 0, 0]}
            text={`AAAAA`}
            font={styles[0]}
            thickness={0.5}
            fontSize={1}
            textAlign={TextAlignment.center}
          />
        ))}
      </group>

      <pointLight position={[(width / 2) * 6, 30, (height / 2) * 1.8]} color="white" />
      <pointLight position={[(width / 2) * 6, 30, 0]} color="red" />
      <pointLight position={[0, 30, (height / 2) * 1.8]} color="blue" />
      <pointLight position={[(width / 2) * 6, 30, height * 1.8]} color="green" />
    </InstancedTextProvider>
  )
}

export const Demo3DSt = () => <Demo3DScene />
Demo3DSt.storyName = 'Default'

function Demo3DNoInstancingScene() {
  const width = 8
  const height = 32
  const ratio = width / height

  const groupRef = useRef<Group>(null)

  const font = suspend(async () => {
    let data = await (await fetch('/robotoRegular3D/Roboto_Regular.json' as string)).json()
    let loader = new FontLoader()
    return loader.parse(data as any)
  }, [])

  useFrame(({ clock }) => {
    groupRef.current?.children.forEach((c) => {
      const px = (c.position.x / 6 - width / 2) / ratio
      const pz = c.position.z / 1.8 - height / 2
      const dist = Math.sqrt(px ** 2 + pz ** 2)
      const py = Math.sin(dist / 3 + clock.elapsedTime) * 3
      c.position.y = py

      const prevGeom = (c.children[0] as Mesh).geometry as any
      ;((c.children[0] as Mesh).geometry as TextGeometry) = new TextGeometry(py.toFixed(4), {
        font,
        letterSpacing: 0,
        lineHeight: 1,
        size: 1,
        height: 0.2,
        bevelThickness: 0.1,
        bevelSize: 0.01,
        bevelEnabled: false,
        bevelOffset: 0,
        curveSegments: 8,
      })
      prevGeom.dispose()
    })
  })

  return (
    <>
      <group ref={groupRef}>
        {new Array(width * height).fill(0).map((_, i) => (
          <group
            key={`${i % width},${Math.floor(i / width)}`}
            position={[(i % width) * 6, 0, Math.floor(i / width) * 1.8]}
            rotation={[-Math.PI / 2, 0, 0]}
          >
            <Text3D font="/robotoRegular3D/Roboto_Regular.json" frustumCulled={false}>
              AAAAA
              <meshPhongMaterial />
            </Text3D>
          </group>
        ))}
      </group>

      <pointLight position={[(width / 2) * 6, 30, (height / 2) * 1.8]} color="white" />
      <pointLight position={[(width / 2) * 6, 30, 0]} color="red" />
      <pointLight position={[0, 30, (height / 2) * 1.8]} color="blue" />
      <pointLight position={[(width / 2) * 6, 30, height * 1.8]} color="green" />
    </>
  )
}

export const Demo3DNoInstancingSt = () => <Demo3DNoInstancingScene />
Demo3DNoInstancingSt.storyName = 'No Instancing'
