'use client'
import React, { Suspense, useRef, useEffect, useState } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { useGLTF, Environment, ContactShadows } from '@react-three/drei'
import * as THREE from 'three'

function Model({ scrollProgress }: { scrollProgress: number }) {
  const { scene } = useGLTF('/model.glb')

  const groupRef = useRef<THREE.Group>(null)
  const lidRef = useRef<THREE.Object3D | null>(null)
  const initialY = useRef(0)

  useEffect(() => {
    // ✅ центрируем модель
    const box = new THREE.Box3().setFromObject(scene)
    const center = box.getCenter(new THREE.Vector3())
    scene.position.sub(center)

    // ✅ ищем крышку
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

  return (
    <group ref={groupRef} position={[0, 2, 0]}>
      {/* ⬆️ поднимаем ВСЮ модель */}
      <primitive object={scene} scale={2.5} />
    </group>
  )
}

function CameraController({ scrollProgress }: { scrollProgress: number }) {
  useFrame((state) => {
    const radius = 12
    const angle = scrollProgress * Math.PI * 2

    // ✅ полноценное вращение вокруг объекта
    state.camera.position.x = Math.sin(angle) * radius
    state.camera.position.z = Math.cos(angle) * radius
    state.camera.position.y = 2

    state.camera.lookAt(0, 2, 0)
  })

  return null
}

export default function Home() {
  const [scrollProgress, setScrollProgress] = useState(0)

  useEffect(() => {
    const updateScroll = () => {
      const scrollTop = window.scrollY
      const height = document.body.scrollHeight - window.innerHeight

      const progress = height > 0 ? scrollTop / height : 0
      setScrollProgress(progress)
    }

    // ✅ работает везде
    window.addEventListener('scroll', updateScroll)
    window.addEventListener('wheel', updateScroll)
    window.addEventListener('touchmove', updateScroll)

    return () => {
      window.removeEventListener('scroll', updateScroll)
      window.removeEventListener('wheel', updateScroll)
      window.removeEventListener('touchmove', updateScroll)
    }
  }, [])

  return (
    <main className="h-[300vh] w-full bg-black">
      <Canvas camera={{ position: [0, 2, 12], fov: 40 }} dpr={[1, 2]}>
        <color attach="background" args={['#050505']} />

        <ambientLight intensity={0.6} />
        <pointLight position={[10, 10, 10]} intensity={2} />
        <spotLight position={[-10, 10, 10]} angle={0.25} intensity={3} penumbra={1} />

        <Suspense fallback={null}>
          <Model scrollProgress={scrollProgress} />
          <CameraController scrollProgress={scrollProgress} />
          <Environment preset="city" />
          <ContactShadows position={[0, 0, 0]} opacity={0.5} scale={15} blur={2} />
        </Suspense>
      </Canvas>
    </main>
  )
}