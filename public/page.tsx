'use client'
import React, { Suspense, useRef, useEffect, useState } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { useGLTF, Environment, ContactShadows } from '@react-three/drei'
import * as THREE from 'three'

function Model({ scrollProgress }: { scrollProgress: number }) {
  const { scene } = useGLTF('/model.glb')
  const lidRef = useRef<THREE.Object3D | null>(null)

  // Найти Lid один раз
  useEffect(() => {
    scene.traverse((child) => {
      if (child.name.toLowerCase().includes('lid')) {
        lidRef.current = child
      }
    })
  }, [scene])

  // Анимация
  useFrame((state, delta) => {
    // Вращение всей модели (медленное, премиум-эффект)
    scene.rotation.y += delta * 0.3

    // Поднятие крышки (через scroll)
    if (lidRef.current) {
      const targetY = scrollProgress * 1.5 // насколько вверх
      lidRef.current.position.y = THREE.MathUtils.lerp(
        lidRef.current.position.y,
        targetY,
        0.1
      )
    }
  })

  return <primitive object={scene} scale={2} position={[0, -1, 0]} />
}

function CameraController({ scrollProgress }: { scrollProgress: number }) {
  useFrame((state) => {
    const t = state.clock.getElapsedTime()

    const radius = 7
    const speed = 0.3

    // Камера крутится + реагирует на scroll
    const angle = t * speed + scrollProgress * Math.PI

    state.camera.position.x = Math.sin(angle) * radius
    state.camera.position.z = Math.cos(angle) * radius
    state.camera.position.y = 2

    state.camera.lookAt(0, 0, 0)
  })

  return null
}

export default function Home() {
  const [scrollProgress, setScrollProgress] = useState(0)

  useEffect(() => {
    let timeout: NodeJS.Timeout

    // авто-анимация через 5 сек
    timeout = setTimeout(() => {
      setScrollProgress(1)
    }, 5000)

    const handleScroll = () => {
      const scrollTop = window.scrollY
      const height = document.body.scrollHeight - window.innerHeight
      const progress = scrollTop / height

      setScrollProgress(progress)
    }

    // mobile + desktop
    window.addEventListener('scroll', handleScroll)
    window.addEventListener('touchmove', handleScroll)

    return () => {
      window.removeEventListener('scroll', handleScroll)
      window.removeEventListener('touchmove', handleScroll)
      clearTimeout(timeout)
    }
  }, [])

  return (
    <main className="h-[200vh] w-full bg-black">
      <Canvas camera={{ position: [0, 0, 7], fov: 35 }} dpr={[1, 2]}>
        <color attach="background" args={['#050505']} />

        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} intensity={2} />
        <spotLight position={[-10, 10, 10]} angle={0.2} intensity={3} penumbra={1} />

        <Suspense fallback={null}>
          <Model scrollProgress={scrollProgress} />
          <CameraController scrollProgress={scrollProgress} />
          <Environment preset="city" />
          <ContactShadows position={[0, -1.5, 0]} opacity={0.6} scale={10} blur={2} />
        </Suspense>
      </Canvas>
    </main>
  )
}