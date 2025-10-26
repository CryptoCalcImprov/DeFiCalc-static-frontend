'use client';

import { useMemo, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { Line, AdaptiveDpr, Html } from '@react-three/drei';

/**
 * Beautiful, curved, screen‑reactive network background
 * - Preserves your blues/teals + deep midnight palette
 * - Curved connections (Bezier arcs) that gently ebb
 * - Parallax + pointer reactivity; adapts to viewport
 * - Mild bloom & vignette for tasteful polish
 * - Single‑file, drop‑in replacement for your Scene3D
 */

// ---- Palette (kept from your concept) ----
const COLORS = {
  darks: ['#0f172a', '#1e1b4b', '#1e293b', '#1e3a8a'] as const, // nodes
  streamA: '#06b6d4', // cyan
  streamB: '#2dd4bf', // teal
  accent: '#3b82f6', // blue
};

// ---- Helpers ----
function seeded(i: number) {
  // lightweight deterministic RNG for repeatable layout
  const x = Math.sin(i * 177.7) * 10000;
  return x - Math.floor(x);
}

function torusPoint(i: number, n: number, R = 34, r = 14, p = 2, q = 3) {
  // torus‑knot style distribution for graceful curvature
  const t = (i / n) * Math.PI * 2;
  const ct = Math.cos(q * t);
  const st = Math.sin(q * t);
  const u = p * t;
  const cu = Math.cos(u);
  const su = Math.sin(u);
  const x = (R + r * ct) * cu;
  const y = (R + r * ct) * su;
  const z = r * st;
  return new THREE.Vector3(x, y * 0.8, z); // slight squash for widescreens
}

function lerpVec(a: THREE.Vector3, b: THREE.Vector3, t: number) {
  return new THREE.Vector3().copy(a).lerp(b, t);
}

// ---- Node (with Fresnel-ish rim and inner glow) ----
function Node({ position, idx }: { position: THREE.Vector3; idx: number }) {
  const mesh = useRef<THREE.Mesh>(null);
  const core = useRef<THREE.Mesh>(null);
  const rim = useRef<THREE.Mesh>(null);

  const baseColor = COLORS.darks[idx % COLORS.darks.length];

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    if (mesh.current) {
      mesh.current.rotation.x += 0.004;
      mesh.current.rotation.y -= 0.006;
    }
    if (core.current) {
      core.current.scale.setScalar(1 + Math.sin(t * 1.4 + idx) * 0.05);
    }
    if (rim.current) {
      const s = 1 + Math.sin(t * 0.9 + idx * 0.7) * 0.08;
      rim.current.scale.setScalar(s * 1.12);
    }
  });

  return (
    <group position={position}>
      {/* body */}
      <mesh ref={mesh} castShadow>
        <icosahedronGeometry args={[1.05, 0]} />
        <meshStandardMaterial
          color={baseColor}
          metalness={0.45}
          roughness={0.5}
          emissive={COLORS.darks[0]}
          emissiveIntensity={0.7}
        />
      </mesh>
      {/* inner glow */}
      <mesh ref={core}>
        <sphereGeometry args={[0.24, 16, 16]} />
        <meshStandardMaterial
          color={COLORS.accent}
          emissive={COLORS.accent}
          emissiveIntensity={1.4}
          transparent
          opacity={0.95}
        />
      </mesh>
      {/* soft rim (Fresnel-ish) */}
      <mesh ref={rim}>
        <sphereGeometry args={[1.15, 32, 32]} />
        <meshBasicMaterial
          color={COLORS.streamB}
          transparent
          opacity={0.12}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
    </group>
  );
}

// ---- Curved link line (Bezier) ----
function CurvedLink({ a, b, opacity = 0.18 }: { a: THREE.Vector3; b: THREE.Vector3; opacity?: number }) {
  const mid = useMemo(() => {
    // elevated midpoint to create a graceful arc; jitter per‑link
    const m = lerpVec(a, b, 0.5);
    const n = new THREE.Vector3().copy(b).sub(a).normalize();
    const up = new THREE.Vector3(0, 1, 0);
    const side = new THREE.Vector3().crossVectors(n, up).normalize();
    const lift = 4 + Math.random() * 6;
    const sway = (Math.random() - 0.5) * 4;
    return m.add(new THREE.Vector3().copy(up).multiplyScalar(lift)).add(side.multiplyScalar(sway));
  }, [a, b]);

  const points = useMemo(() => {
    const curve = new THREE.QuadraticBezierCurve3(a, mid, b);
    return curve.getPoints(24);
  }, [a, b, mid]);

  return (
    <Line
      points={points}
      lineWidth={1}
      color={COLORS.streamA}
      transparent
      opacity={opacity}
    />
  );
}

// ---- Data pulse that travels along a curve ----
function DataPulse({ a, b, speed, phase }: { a: THREE.Vector3; b: THREE.Vector3; speed: number; phase: number }) {
  const ref = useRef<THREE.Mesh>(null);
  const ctrl = useRef({ t: phase });
  const mid = useMemo(() => lerpVec(a, b, 0.5).add(new THREE.Vector3(0, 6, 0)), [a, b]);
  const curve = useMemo(() => new THREE.QuadraticBezierCurve3(a, mid, b), [a, b, mid]);
  const color = useMemo(() => (Math.random() > 0.5 ? COLORS.streamA : COLORS.streamB), []);

  useFrame((_, delta) => {
    ctrl.current.t += speed * delta;
    if (ctrl.current.t > 1) ctrl.current.t = 0;
    const p = curve.getPoint(ctrl.current.t);
    ref.current?.position.copy(p);
    const fade = Math.sin(ctrl.current.t * Math.PI);
    if (ref.current?.material && 'opacity' in ref.current.material) {
      (ref.current.material as THREE.MeshStandardMaterial).opacity = 0.2 + 0.6 * fade;
    }
  });

  return (
    <mesh ref={ref}>
      <sphereGeometry args={[0.17, 16, 16]} />
      <meshStandardMaterial
        color={color}
        emissive={color}
        emissiveIntensity={1.25}
        transparent
        depthWrite={false}
      />
    </mesh>
  );
}

// ---- Network Graph (curved + reactive) ----
function NetworkGraph() {
  const group = useRef<THREE.Group>(null);
  const { viewport } = useThree();

  // Layout scales with viewport (screen‑reactive)
  const scale = useMemo(() => {
    const w = viewport.width;
    return THREE.MathUtils.clamp(w / 14, 1, 2.2);
  }, [viewport.width]);

  // Build nodes on a torus‑knot; connect near neighbors
  const { positions, links } = useMemo(() => {
    const count = 56; // sweet spot for density vs perf
    const pos: THREE.Vector3[] = [];
    for (let i = 0; i < count; i++) {
      const p = torusPoint(i, count);
      // small deterministic drift so it doesn't look too perfect
      p.x += (seeded(i) - 0.5) * 6;
      p.y += (seeded(i + 7) - 0.5) * 6;
      p.z += (seeded(i + 13) - 0.5) * 6;
      pos.push(p);
    }

    const pairs: Array<[number, number]> = [];
    const maxDist = 22;
    const maxPer = 3;
    for (let i = 0; i < pos.length; i++) {
      const cand: Array<{ j: number; d: number }> = [];
      for (let j = 0; j < pos.length; j++) {
        if (i === j) continue;
        const d = pos[i].distanceTo(pos[j]);
        if (d < maxDist) cand.push({ j, d });
      }
      cand.sort((a, b) => a.d - b.d);
      for (let k = 0; k < Math.min(cand.length, maxPer); k++) {
        const j = cand[k].j;
        if (i < j) pairs.push([i, j]);
      }
    }
    return { positions: pos, links: pairs };
  }, []);

  // gentle orbit + pointer parallax
  useFrame((state) => {
    if (!group.current) return;
    const t = state.clock.getElapsedTime();
    const { x: mx, y: my } = state.pointer; // -1..1
    group.current.rotation.y = t * 0.12 + mx * 0.25;
    group.current.rotation.x = Math.sin(t * 0.25) * 0.18 + my * 0.2;
    group.current.position.z = -6 + Math.sin(t * 0.5) * 1.5;
  });

  return (
    <group ref={group} scale={scale}>
      {/* curved links */}
      {links.map(([i, j], k) => (
        <CurvedLink key={`link-${k}`} a={positions[i]} b={positions[j]} opacity={0.16} />
      ))}

      {/* flowing data pulses */}
      {links.map(([i, j], k) => (
        <DataPulse key={`pulse-${k}`} a={positions[i]} b={positions[j]} speed={0.35 + (k % 7) * 0.03} phase={seeded(k) * 1} />
      ))}

      {/* nodes */}
      {positions.map((p, i) => (
        <Node key={`node-${i}`} position={p} idx={i} />
      ))}
    </group>
  );
}

// ---- Camera controller (soft orbital) ----
function CameraRig() {
  const { camera } = useThree();
  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    const r = 78;
    camera.position.x = Math.sin(t * 0.08) * r;
    camera.position.z = Math.cos(t * 0.08) * r;
    camera.position.y = Math.sin(t * 0.12) * 16;
    camera.lookAt(0, 0, 0);
  });
  return <></>;
}

// ---- Scene wrapper ----
function SceneContent() {
  return (
    <>
      {/* lights tuned to palette */}
      <ambientLight intensity={0.12} color={'#1e293b'} />
      <pointLight position={[18, 22, 12]} intensity={0.7} color={'#1e40af'} />
      <pointLight position={[-18, -14, -16]} intensity={0.5} color={COLORS.accent} />

      <NetworkGraph />
    </>
  );
}

export function Scene3D() {
  return (
    <div className="fixed inset-0 -z-10">
      <Canvas
        gl={{ antialias: true, alpha: true }}
        camera={{ position: [0, 0, 90], fov: 78, near: 0.1, far: 500 }}
      >
        <CameraRig />
        <SceneContent />
        {/* adapt to device performance & viewport */}
        <AdaptiveDpr pixelated={false} />
      </Canvas>
    </div>
  );
}
