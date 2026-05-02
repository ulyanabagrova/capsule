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

  const lidStartY = useRef(0) // 🧠 сохраняем стартовую позицию крышки

  useMemo(() => {
    scene.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh
        const name = mesh.name.toLowerCase()

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

        if (name.includes('liquid')) {
          mesh.material = new THREE.MeshStandardMaterial({
            color: '#ff7b00',
            emissive: '#ff3c00',
            emissiveIntensity: 2.5,
            roughness: 0.1,
          })
        }

        if (name.includes('lid')) {
          lidRef.current = mesh
          lidStartY.current = mesh.position.y // 💡 фиксируем старт
        }
      }
    })
  }, [scene])

  useFrame(() => {
    if (modelRef.current) {
      modelRef.current.rotation.y += 0.005
    }

    // 🔥 ВАЖНО: движение ОТ стартовой позиции
    if (lidRef.current) {
      const openOffset = 2 // насколько открывается

      lidRef.current.position.y = THREE.MathUtils.lerp(
        lidStartY.current,
        lidStartY.current + openOffset,
        scroll
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