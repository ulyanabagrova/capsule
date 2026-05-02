'use client'

import React, { Suspense, useRef, useEffect, useMemo } from 'react'
import { Canvas, useFrame, useGraph } from '@react-three/fiber'
import {
  useGLTF,
  Environment,
  ContactShadows,
  OrbitControls,
} from '@react-three/drei'
import * as THREE from 'three'

function Model({ scroll }: { scroll: number }) {
  // Загружаем модель
  const { scene } = useGLTF('/model.glb')
  // useGraph создает удобный словарь объектов по именам
  const { nodes } = useGraph(scene)
  
  const modelRef = useRef<THREE.Group>(null!)
  const lidRef = useRef<THREE.Object3D | null>(null)
  
  // Храним начальную позицию крышки, чтобы не "улетела" в космос
  const initialY = useRef<number | null>(null)

  // Настройка материалов и поиск крышки
  useMemo(() => {
    Object.values(nodes).forEach((node) => {
      if ((node as THREE.Mesh).isMesh) {
        const mesh = node as THREE.Mesh
        const name = mesh.name.toLowerCase()

        // Находим крышку (lid)
        if (name.includes('lid')) {
          lidRef.current = mesh
          if (initialY.current === null) {
            initialY.current = mesh.position.y
          }
        }

        // Материал капсулы (High-end Noir Glass)
        if (name.includes('capsule')) {
          mesh.material = new THREE.MeshPhysicalMaterial({
            transmission: 1,
            thickness: 2,
            roughness: 0.05,
            ior: 1.5,
            clearcoat: 1,
            transparent: true,
            color: new THREE.Color('#474660'),
            attenuationColor: new THREE.Color('#474660'),
            attenuationDistance: 0.5,
          })
        }

        // Материал жидкости
        if (name.includes('liquid')) {
          mesh.material = new THREE.MeshStandardMaterial({
            color: '#ff7b00',
            emissive: '#ff3c00',
            emissiveIntensity: 3,
          })
        }
      }
    })
  }, [nodes])

  useFrame((state, delta) => {
    // Вращение всей модели
    if (modelRef.current) {
      modelRef.current.rotation.y += 0.5 * delta // Более стабильное вращение через delta
    }

    // Анимация поднятия крышки
    if (lidRef.current && initialY.current !== null) {
      const maxLift = 5 // На сколько единиц поднимается крышка
      const targetY = initialY.current + (scroll * maxLift)

      // Плавный переход (lerp)
      lidRef.current.position.y = THREE.MathUtils.lerp(
        lidRef.current.position.y,
        targetY,
        0.1
      )
    }
  })

  return <primitive ref={modelRef} object={scene} scale={2.5} position={[0, -1, 0]} />
}

export default function Home() {
  const [scroll, setScroll] = React.useState(0)

  useEffect(() => {
    const handleScroll = () => {
      // Вычисляем процент прокрутки от 0 до 1
      const height = document.documentElement.scrollHeight - window.innerHeight
      const scrolled = window.scrollY
      const progress = THREE.MathUtils.clamp(scrolled / height, 0, 1)
      setScroll(progress)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <main className="relative w-full bg-[#050505]">
      {/* Контейнер для Canvas фиксируем, чтобы модель была видна при скролле */}
      <div className="fixed inset-0 h-screen w-full">
        <Canvas camera={{ position: [0, 2, 12], fov: 35 }}>
          <color attach="background" args={['#050505']} />
          
          <ambientLight intensity={0.2} />
          <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} intensity={2} />
          <pointLight position={[-10, -10, -10]} intensity={1} color="#474660" />

          <Suspense fallback={null}>
            <Model scroll={scroll} />
            <Environment preset="city" />
            <ContactShadows 
              position={[0, -2, 0]} 
              opacity={0.4} 
              scale={20} 
              blur={2.5} 
              far={4} 
            />
          </Suspense>

          <OrbitControls enableZoom={false} enablePan={false} makeDefault />
        </Canvas>
      </div>

    </main>
  )
}
