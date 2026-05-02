'use client'

import React, { Suspense, useMemo, useRef, useEffect, useState } from 'react'
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

        if (name.includes('lid')) {
          lidRef.current = mesh
        }

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

        if (name.includes('liquid')) {
          mesh.material = new THREE.MeshStandardMaterial({
            color: '#ff7b00',
            emissive: '#ff3c00',
            emissiveIntensity: 2.5,
          })
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
    // 🔄 вращение модели
    if (modelRef.current) {
      modelRef.current.rotation.y += 0.004
    }

    // 🚀 ВЫСОКОЕ ПЛАВНОЕ ОТКРЫТИЕ
    if (lidRef.current) {
      const maxLift = 6 // 👈 ВОТ ЭТО ДЕЛАЕТ "ВЫСОКО ПОДНИМАЕТСЯ"

      const targetY =
        lidStartY.current + scroll * maxLift

      lidRef.current.position.y = THREE.MathUtils.lerp(
        lidRef.current.position.y,
        targetY,
        0.08 // 👈 меньше = более плавно
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
  const [scroll, setScroll] = useState(0)

  useEffect(() => {
    const handleScroll = () => {
      const maxScroll =
        document.body.scrollHeight - window.innerHeight

      const progress = window.scrollY / maxScroll

      // 🧠 стабилизация 0 → 1
      setScroll(Math.min(1, Math.max(0, progress)))
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <main className="h-[200vh] w-full bg-black">
      <Canvas camera={{ position: [0, 0, 10], fov: 35 }}>
        <color attach="background" args={['#050505']} />

        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} intensity={2} />
        <spotLight position={[-10, 10, 10]} intensity={3} />

        <Suspense fallback={null}>
          <Model scroll={scroll} />

          <Environment preset="city" />

          <ContactShadows
            position={[0, -1.5, 0]}
            opacity={0.6}
            scale={10}
            blur={2}
          />
        </Suspense>

        <OrbitControls
          enableZoom={false}
          enablePan={false}
          enableRotate={false}
        />
      </Canvas>
    </main>
  )
}