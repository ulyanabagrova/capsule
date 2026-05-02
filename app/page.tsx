'use client'
import React, { Suspense, useMemo } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, useGLTF, Environment, ContactShadows, MeshTransmissionMaterial } from '@react-three/drei'
import * as THREE from 'three'

function Model() {
  const { scene } = useGLTF('/model.glb')

  useMemo(() => {
    scene.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh
        const name = mesh.name.toLowerCase()
        
        // Логируем, чтобы точно видеть, что нашел код
        console.log("Checking mesh:", mesh.name)

        // СТЕКЛО (ищем 'capsule')
        if (name.includes('capsule')) {
          mesh.material = new THREE.MeshPhysicalMaterial({
            transmission: 1,
            thickness: 2,
            roughness: 0.1,
            ior: 1.5,
            clearcoat: 1,
            transparent: true,
            opacity: 1, // При transmission 1 opacity работает иначе, оставляем так
            color: '#474660',
          })
        }

        // ЖИДКОСТЬ (ищем 'liquid')
        if (name.includes('liquid')) {
          mesh.material = new THREE.MeshStandardMaterial({
            color: "#ff7b00",
            emissive: "#ff3c00",
            emissiveIntensity: 2.5,
            roughness: 0.1,
          })
        }
      }
    })
  }, [scene])

  return <primitive object={scene} scale={2} position={[0, -1, 0]} />
}

export default function Home() {
  return (
    <main className="h-screen w-full bg-black">
      <Canvas camera={{ position: [0, 0, 7], fov: 35 }} dpr={[1, 2]}>
        <color attach="background" args={['#050505']} />
        
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} intensity={2} />
        <spotLight position={[-10, 10, 10]} angle={0.2} intensity={3} penumbra={1} />

        <Suspense fallback={null}>
          <Model />
          <Environment preset="city" />
          <ContactShadows position={[0, -1.5, 0]} opacity={0.6} scale={10} blur={2} />
        </Suspense>

        <OrbitControls makeDefault />
      </Canvas>
    </main>
  )
}
