'use client'

import React, { Suspense, useRef, useEffect, useMemo, useState } from 'react'
import { Canvas, useFrame, useGraph } from '@react-three/fiber'
import {
  useGLTF,
  Environment,
  ContactShadows,
} from '@react-three/drei'
import * as THREE from 'three'

function Model({ scroll }: { scroll: number }) {
  const { scene } = useGLTF('/model.glb')
  const { nodes } = useGraph(scene)
  const modelRef = useRef<THREE.Group>(null!)
  const lidRef = useRef<THREE.Object3D | null>(null)
  const initialY = useRef<number | null>(null)

  // Определяем, мобилка это или нет (упрощенная проверка)
  const [isMobile, setIsMobile] = useState(false)
  useEffect(() => {
    setIsMobile(window.innerWidth < 768)
  }, [])

  useMemo(() => {
    Object.values(nodes).forEach((node) => {
      if ((node as THREE.Mesh).isMesh) {
        const mesh = node as THREE.Mesh
        const name = mesh.name.toLowerCase()

        if (name.includes('lid')) {
          lidRef.current = mesh
          if (initialY.current === null) initialY.current = mesh.position.y
        }

        if (name.includes('capsule')) {
          mesh.material = new THREE.MeshPhysicalMaterial({
            transmission: 1,
            thickness: isMobile ? 1 : 2, // Тоньше на мобилках для скорости
            roughness: 0.08,
            ior: 1.4,
            clearcoat: 0.5,
            transparent: true,
            color: new THREE.Color('#474660'),
          })
        }

        if (name.includes('liquid')) {
          mesh.material = new THREE.MeshStandardMaterial({
            color: '#ff7b00',
            emissive: '#ff3c00',
            emissiveIntensity: isMobile ? 1.5 : 3, // Снижаем яркость для мобильных GPU
          })
        }
      }
    })
  }, [nodes, isMobile])

  useFrame((state, delta) => {
    if (modelRef.current) {
      modelRef.current.rotation.y += 0.3 * delta
    }

    if (lidRef.current && initialY.current !== null) {
      // На мобилках ход крышки можно сделать чуть меньше, чтобы она не улетала за экран
      const maxLift = isMobile ? 4 : 6 
      const targetY = initialY.current + (scroll * maxLift)
      lidRef.current.position.y = THREE.MathUtils.lerp(
        lidRef.current.position.y,
        targetY,
        0.08
      )
    }
  })

  // На мобилках увеличиваем масштаб, чтобы капсула была во весь экран
  return (
    <primitive 
      ref={modelRef} 
      object={scene} 
      scale={isMobile ? 2.8 : 2.5} 
      position={[0, isMobile ? -0.5 : -1, 0]} 
    />
  )
}

export default function Home() {
  const [scroll, setScroll] = useState(0)

  useEffect(() => {
    const handleScroll = () => {
      const height = document.documentElement.scrollHeight - window.innerHeight
      const progress = THREE.MathUtils.clamp(window.scrollY / height, 0, 1)
      setScroll(progress)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <main className="relative w-full bg-[#050505] selection:bg-orange-500">
      {/* Canvas фиксирован, чтобы не дергался при скролле на мобилках */}
      <div className="fixed inset-0 h-screen w-full touch-none overflow-hidden">
        <Canvas 
          flat // Отключает лишнюю постобработку для скорости
          dpr={[1, 2]} // Ограничиваем разрешение (на iPhone может быть 3, что тормозит)
          camera={{ position: [0, 2, 12], fov: 45 }}
        >
          <color attach="background" args={['#050505']} />
          
          <ambientLight intensity={0.4} />
          <pointLight position={[5, 5, 5]} intensity={1} />

          <Suspense fallback={null}>
            <Model scroll={scroll} />
            <Environment preset="city" />
            <ContactShadows 
              position={[0, -2.5, 0]} 
              opacity={0.4} 
              scale={15} 
              blur={3} 
              far={5} 
            />
          </Suspense>
        </Canvas>
      </div>

      {/* Контент поверх для скролла */}
      <div className="relative z-10">
        <section className="h-[100vh] flex flex-col items-center justify-end pb-20">
          <p className="text-white/30 text-xs uppercase tracking-[0.3em] animate-pulse">
            Scroll to explore
          </p>
        </section>
        
        <section className="h-[100vh] flex items-center justify-center pointer-events-none">
          <div className="px-6 text-center">
            <h2 className="text-white text-3xl font-thin tracking-tighter mb-4">
              GENEMI OS
            </h2>
            <p className="text-white/50 text-sm max-w-[250px] mx-auto leading-relaxed">
              Automated marketing systems for high-end digital entrepreneurs.
            </p>
          </div>
        </section>

        <section className="h-[100vh]" />
      </div>
    </main>
  )
}
