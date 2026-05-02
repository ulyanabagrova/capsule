'use client'
import React, { Suspense, useRef, useEffect, useState } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { useGLTF, Environment, ContactShadows } from '@react-three/drei'
import * as THREE from 'three'

function Model({ scrollProgress }: { scrollProgress: number }) {
  const { scene } = useGLTF('/model.glb')

  const lidRef = useRef<THREE.Object3D | null>(null)
  const initialY = useRef(0)

  useEffect(() => {
    scene.traverse((child) => {
      if (child.name.toLowerCase().includes('lid')) {
        lidRef.current = child
        initialY.current = child.position.y
      }
    })
  }, [scene])

  useFrame(() => {
    if (lidRef.current) {
      const lift = scrollProgress * 0.03
      const targetY = initialY.current + lift

      lidRef.current.position.y = THREE.MathUtils.lerp(
        lidRef.current.position.y,
        targetY,
        0.15
      )
    }
  })

  // ⬆️ ПРОСТО поднимаем модель (без Box3)
  return <primitive object={scene} scale={1.5} position={[0, 4, 0]} />
}

function CameraController({ scrollProgress }: { scrollProgress: number }) {
  useFrame((state) => {
    const radius = 8
    const angle = scrollProgress * Math.PI * 2

    state.camera.position.x = Math.sin(angle) * radius
    state.camera.position.z = Math.cos(angle) * radius

    // ⬇️ камера чуть ниже → модель видна сверху
    state.camera.position.y = 1.5

    // ⬆️ смотрим туда, где реально модель
    state.camera.lookAt(0, 4, 0)
  })

  return null
}

export default function Home() {
  const [scrollProgress, setScrollProgress] = useState(0)

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY
      const height = document.body.scrollHeight - window.innerHeight
      const progress = height > 0 ? scrollTop / height : 0

      setScrollProgress(progress)
    }

    window.addEventListener('scroll', handleScroll)

    return () => {
      window.removeEventListener('scroll', handleScroll)
    }
  }, [])

  return (
    <main className="h-[200vh] w-full bg-black">
      <Canvas camera={{ position: [0, 1.5, 8], fov: 40 }} dpr={[1, 2]}>
        <color attach="background" args={['#050505']} />

        <ambientLight intensity={0.6} />
        <pointLight position={[10, 10, 10]} intensity={2} />
        <spotLight position={[-10, 10, 10]} angle={0.25} intensity={3} penumbra={1} />

        <Suspense fallback={null}>
          <Model scrollProgress={scrollProgress} />
          <CameraController scrollProgress={scrollProgress} />
          <Environment preset="city" />
          <ContactShadows position={[0, 0, 0]} opacity={0.5} scale={10} blur={2} />
        </Suspense>
      </Canvas>
    </main>
  )
}