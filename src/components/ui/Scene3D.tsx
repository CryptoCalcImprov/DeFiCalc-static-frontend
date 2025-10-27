 'use client';

import { useEffect, useMemo, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { Line, AdaptiveDpr } from '@react-three/drei';

/**
 * Midnight aurora network background:
 * - Richer violet ↔ aqua gradients to match the refreshed brand
 * - Floating aurora bands + stardust halo for a more cinematic hero moment
 * - Retains lightweight runtime (pure Three primitives, no extra deps)
 */

// ---- Palette ----
const COLORS = {
  darks: ['#030B18', '#061522', '#0C2537', '#17354C'] as const,
  streamPalette: ['#3AC6FF', '#36D6C3', '#7A40FF', '#8E58FF'] as const,
  pulsePalette: ['#36D6C3', '#8E58FF', '#BFEAFF'] as const,
} as const;

// ---- Helpers ----
function seeded(i: number) {
  const x = Math.sin(i * 177.7) * 10000;
  return x - Math.floor(x);
}

function torusPoint(i: number, n: number, R = 34, r = 14, p = 2, q = 3) {
  const t = (i / n) * Math.PI * 2;
  const ct = Math.cos(q * t);
  const st = Math.sin(q * t);
  const u = p * t;
  const cu = Math.cos(u);
  const su = Math.sin(u);
  const x = (R + r * ct) * cu;
  const y = (R + r * ct) * su;
  const z = r * st;
  return new THREE.Vector3(x, y * 0.8, z);
}

function lerpVec(a: THREE.Vector3, b: THREE.Vector3, t: number) {
  return new THREE.Vector3().copy(a).lerp(b, t);
}

// ---- Nodes ----
function Node({ position, idx }: { position: THREE.Vector3; idx: number }) {
  const mesh = useRef<THREE.Mesh>(null);
  const core = useRef<THREE.Mesh>(null);
  const rim = useRef<THREE.Mesh>(null);

  const baseColor = COLORS.darks[idx % COLORS.darks.length];
  const accentColor = COLORS.pulsePalette[idx % COLORS.pulsePalette.length];
  const haloColor = COLORS.streamPalette[(idx + 1) % COLORS.streamPalette.length];

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
      const material = rim.current.material as THREE.MeshBasicMaterial | undefined;
      if (material) {
        material.opacity = 0.08 + Math.sin(t * 0.7 + idx) * 0.04;
      }
    }
  });

  return (
    <group position={position}>
      <mesh ref={mesh} castShadow>
        <icosahedronGeometry args={[1.05, 0]} />
        <meshStandardMaterial
          color={baseColor}
          metalness={0.35}
          roughness={0.55}
          emissive={haloColor}
          emissiveIntensity={0.45}
        />
      </mesh>
      <mesh ref={core}>
        <sphereGeometry args={[0.24, 16, 16]} />
        <meshStandardMaterial
          color={accentColor}
          emissive={accentColor}
          emissiveIntensity={1.5}
          transparent
          opacity={0.92}
        />
      </mesh>
      <mesh ref={rim}>
        <sphereGeometry args={[1.15, 32, 32]} />
        <meshBasicMaterial
          color={haloColor}
          transparent
          opacity={0.12}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
    </group>
  );
}

// ---- Curved link line ----
function CurvedLink({ a, b, opacity = 0.18 }: { a: THREE.Vector3; b: THREE.Vector3; opacity?: number }) {
  const color = useMemo(
    () => COLORS.streamPalette[Math.floor(Math.random() * COLORS.streamPalette.length)],
    []
  );

  const mid = useMemo(() => {
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

  return <Line points={points} lineWidth={1.4} color={color} transparent opacity={opacity} />;
}

// ---- Data pulse ----
function DataPulse({ a, b, speed, phase }: { a: THREE.Vector3; b: THREE.Vector3; speed: number; phase: number }) {
  const ref = useRef<THREE.Mesh>(null);
  const ctrl = useRef({ t: phase });
  const mid = useMemo(() => lerpVec(a, b, 0.5).add(new THREE.Vector3(0, 6, 0)), [a, b]);
  const curve = useMemo(() => new THREE.QuadraticBezierCurve3(a, mid, b), [a, b, mid]);
  const color = useMemo(
    () => COLORS.pulsePalette[Math.floor(Math.random() * COLORS.pulsePalette.length)],
    []
  );

  useFrame((_, delta) => {
    ctrl.current.t += speed * delta;
    if (ctrl.current.t > 1) ctrl.current.t = 0;
    const p = curve.getPoint(ctrl.current.t);
    ref.current?.position.copy(p);
    const fade = Math.sin(ctrl.current.t * Math.PI);
    const mat = ref.current?.material as THREE.MeshStandardMaterial | undefined;
    if (mat) {
      mat.opacity = 0.2 + 0.6 * fade;
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

// ---- Aurora halo ----
function AuroraWave({
  radius,
  color,
  height,
  speed,
}: {
  radius: number;
  color: string;
  height: number;
  speed: number;
}) {
  const mesh = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    const t = state.clock.getElapsedTime() * speed;
    const local = mesh.current;
    if (!local) return;
    local.rotation.x = -Math.PI / 2;
    local.rotation.z = Math.sin(t) * 0.35;
    const material = local.material as THREE.MeshBasicMaterial | undefined;
    if (material) {
      material.opacity = 0.16 + Math.sin(t * 1.2) * 0.04;
    }
  });

  return (
    <mesh ref={mesh} position={[0, height, 0]}>
      <ringGeometry args={[radius * 0.55, radius, 160]} />
      <meshBasicMaterial
        color={color}
        transparent
        opacity={0.18}
        blending={THREE.AdditiveBlending}
        side={THREE.DoubleSide}
        depthWrite={false}
      />
    </mesh>
  );
}

// ---- Stardust ----
function Stardust() {
  const pointsRef = useRef<THREE.Points>(null);
  const geometry = useMemo(() => {
    const count = 280;
    const positions = new Float32Array(count * 3);
    const colorArray = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const radius = 28 + Math.random() * 26;
      const y = (Math.random() - 0.5) * 26;
      positions[i * 3] = Math.cos(angle) * radius;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = Math.sin(angle) * radius;
      const tint = COLORS.streamPalette[i % COLORS.streamPalette.length];
      const c = new THREE.Color(tint);
      colorArray[i * 3] = c.r;
      colorArray[i * 3 + 1] = c.g;
      colorArray[i * 3 + 2] = c.b;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colorArray, 3));
    return geo;
  }, []);

  useEffect(() => () => geometry.dispose(), [geometry]);

  useFrame((state) => {
    const t = state.clock.getElapsedTime() * 0.05;
    const group = pointsRef.current;
    if (!group) return;
    group.rotation.y = t;
    group.rotation.x = Math.sin(t * 0.5) * 0.05;
  });

  return (
    <points ref={pointsRef} geometry={geometry}>
      <pointsMaterial
        size={0.2}
        vertexColors
        transparent
        opacity={0.55}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        sizeAttenuation
      />
    </points>
  );
}

// ---- Network Graph ----
function NetworkGraph() {
  const group = useRef<THREE.Group>(null);
  const { viewport } = useThree();

  const scale = useMemo(() => {
    const w = viewport.width;
    return THREE.MathUtils.clamp(w / 14, 1, 2.2);
  }, [viewport.width]);

  const { positions, links } = useMemo(() => {
    const count = 56;
    const pos: THREE.Vector3[] = [];
    for (let i = 0; i < count; i++) {
      const p = torusPoint(i, count);
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

  useFrame((state) => {
    if (!group.current) return;
    const t = state.clock.getElapsedTime();
    const { x: mx, y: my } = state.pointer;
    group.current.rotation.y = t * 0.12 + mx * 0.25;
    group.current.rotation.x = Math.sin(t * 0.25) * 0.18 + my * 0.2;
    group.current.position.z = -6 + Math.sin(t * 0.5) * 1.5;
  });

  return (
    <group ref={group} scale={scale}>
      {links.map(([i, j], k) => (
        <CurvedLink key={`link-${k}`} a={positions[i]} b={positions[j]} opacity={0.14 + (k % 5) * 0.025} />
      ))}

      {links.map(([i, j], k) => (
        <DataPulse key={`pulse-${k}`} a={positions[i]} b={positions[j]} speed={0.35 + (k % 7) * 0.03} phase={seeded(k)} />
      ))}

      {positions.map((p, i) => (
        <Node key={`node-${i}`} position={p} idx={i} />
      ))}

      <AuroraWave radius={38} color="#7A40FF" height={-6} speed={0.18} />
      <AuroraWave radius={32} color="#3AC6FF" height={-4} speed={0.22} />
    </group>
  );
}

// ---- Camera controller ----
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

// ---- Fog + tone ----
function SceneTone() {
  const { scene } = useThree();
  useEffect(() => {
    const originalFog = scene.fog;
    scene.fog = new THREE.FogExp2('#040e18', 0.012);
    scene.background = null;
    return () => {
      scene.fog = originalFog ?? null;
    };
  }, [scene]);
  return null;
}

// ---- Scene wrapper ----
function SceneContent() {
  return (
    <>
      <SceneTone />
      <ambientLight intensity={0.12} color={'#0C2537'} />
      <pointLight position={[18, 22, 12]} intensity={0.7} color={'#7A40FF'} />
      <pointLight position={[-18, -14, -16]} intensity={0.5} color={'#3AC6FF'} />
      <Stardust />
      <NetworkGraph />
    </>
  );
}

export function Scene3D() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden">
      <Canvas
        gl={{ antialias: true, alpha: true }}
        camera={{ position: [0, 0, 90], fov: 78, near: 0.1, far: 500 }}
      >
        <CameraRig />
        <SceneContent />
        <AdaptiveDpr pixelated={false} />
      </Canvas>
      <div
        className="pointer-events-none absolute inset-0 opacity-70 mix-blend-screen"
        style={{
          background:
            'radial-gradient(circle at 22% 28%, rgba(122,64,255,0.28), transparent 55%), radial-gradient(circle at 78% 65%, rgba(58,198,255,0.26), transparent 56%)',
        }}
      />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-background via-transparent" />
    </div>
  );
}
