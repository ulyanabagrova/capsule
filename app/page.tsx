'use client'

import React, { Suspense, useMemo, useRef, useEffect } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import {
  OrbitControls,
  useGLTF,
  Environment,
  ContactShadows,
} from '@react-three/drei'
import * as THREE from 'three'

function Model({ scroll }: { scroll: number }) {
  const { scene } = useGLTF('/model.glb')

  const modelRef = useRef<THREE.Group>(null!)
  const lidRef = useRef<THREE.Object3D | null>(null)
  const lidStartY = useRef(0)

  useMemo(() => {
    scene.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh
        const name = mesh.name.toLowerCase()

        // 🫧 стекло
        if (name.includes('capsule')) {
          mesh.material = new THREE.MeshPhysicalMaterial({
            transmission: 1,
            thickness: 2,
            roughness: 0.1,
            ior: 1.5,
            clearcoat: 1,
            transparent: true,
            color: '#474660',
          })
        }

        // 🔥 жидкость
        if (name.includes('liquid')) {
          mesh.material = new THREE.MeshStandardMaterial({
            color: '#ff7b00',
            emissive: '#ff3c00',
            emissiveIntensity: 2.5,
            roughness: 0.1,
          })
        }

        // 🟡 крышка
        if (name.includes('lid')) {
          lidRef.current = mesh
        }
      }
    })
  }, [scene])

  useEffect(() => {
    if (lidRef.current) {
      lidStartY.current = lidRef.current.position.y
    }
  }, [])

  useFrame(() => {
    // 🔄 вращение всей модели
    if (modelRef.current) {
      modelRef.current.rotation.y += 0.005
    }

    // 📦 крышка поднимается от скролла
    if (lidRef.current) {
      const openDistance = 2

      const targetY =
        lidStartY.current + scroll * openDistance

      lidRef.current.position.y = THREE.MathUtils.lerp(
        lidRef.current.position.y,
        targetY,
        0.12
      )
    }
  })

  return (
    <primitive
      ref={modelRef}
      object={scene}
      scale={2}
      position={[0, 1, 0]}
    />
  )
}

export default function Home() {
  const scrollRef = useRef(0)

  useEffect(() => {
    const handleScroll = () => {
      const max =
        document.body.scrollHeight - window.innerHeight

      scrollRef.current = window.scrollY / max
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <main className="h-[200vh] w-full bg-black">
      <Canvas camera={{ position: [0, 0, 7], fov: 35 }} dpr={[1, 2]}>
        <color attach="background" args={['#050505']} />

        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} intensity={2} />
        <spotLight position={[-10, 10, 10]} intensity={3} />

        <Suspense fallback={null}>
          <Model scroll={scrollRef.current} />

          <Environment preset="city" />

          <ContactShadows
            position={[0, -1.5, 0]}
            opacity={0.6}
            scale={10}
            blur={2}
          />
        </Suspense>

        {/* фиксируем камеру */}
        <OrbitControls
          enableZoom={false}
          enablePan={false}
          enableRotate={false}
        />
      </Canvas>
    </main>
  )
}