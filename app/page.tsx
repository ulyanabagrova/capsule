'use client'

import React, { Suspense, useMemo, useRef, useState, useEffect } from 'react'
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
  const lidRef = useRef<THREE.Mesh>(null!)
  const modelRef = useRef<THREE.Group>(null!)

  useMemo(() => {
    scene.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh
        const name = mesh.name.toLowerCase()

        console.log('Checking mesh:', mesh.name)

        // 🫧 СТЕКЛО
        if (name.includes('capsule')) {
          mesh.material = new THREE.MeshPhysicalMaterial({
            transmission: 1,
            thickness: 2,
            roughness: 0.1,
            ior: 1.5,
            clearcoat: 1,
            transparent: true,
            opacity: 1,
            color: '#474660',
          })
        }

        // 🔥 ЖИДКОСТЬ
        if (name.includes('liquid')) {
          mesh.material = new THREE.MeshStandardMaterial({
            color: '#ff7b00',
            emissive: '#ff3c00',
            emissiveIntensity: 2.5,
            roughness: 0.1,
          })
        }

        // 🟡 LID (крышка)
        if (name.includes('lid')) {
          lidRef.current = mesh
        }
      }
    })
  }, [scene])

  // 🔄 вращение всей модели
  useFrame(() => {
    if (modelRef.current) {
      modelRef.current.rotation.y += 0.005
    }

    // 📦 движение крышки по скроллу
    if (lidRef.current) {
      lidRef.current.position.y = THREE.MathUtils.lerp(
        0,
        2, // насколько поднимается крышка
        scroll
      )
    }
  })

  return (
    <primitive
      ref={modelRef}
      object={scene}
      scale={2}
      position={[0, -1, 0]}
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

      setScroll(Math.min(1, Math.max(0, progress)))
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
        <spotLight
          position={[-10, 10, 10]}
          angle={0.2}
          intensity={3}
          penumbra={1}
        />

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

        <OrbitControls makeDefault />
      </Canvas>
    </main>
  )
}