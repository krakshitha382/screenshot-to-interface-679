import { Canvas, useThree, type ThreeEvent } from "@react-three/fiber";
import { CameraControls, Environment, Lightformer, Html, ContactShadows } from "@react-three/drei";
import { memo, useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { BUILDING, CORRIDOR, DEPARTMENTS, FLOORS, FLOOR_HEIGHT, type Department } from "@/lib/hospital-data";
import { DeptInterior } from "./Interiors";
import { Ambulance, MAT, Plant, Person } from "./Furniture";

export interface SceneState {
  focusFloor: number | null;
  selectedDept: string | null;
  hidden: boolean[];
  exploded: boolean;
}
interface Props extends SceneState {
  onSelectDept: (id: string | null) => void;
  cameraKey: number;
}

const HW = BUILDING.w / 2, HD = BUILDING.d / 2;
const WALL_H = 2.5;
const floorY = (i: number, exploded: boolean) => i * (exploded ? FLOOR_HEIGHT * 1.7 : FLOOR_HEIGHT);

/* ----------------------------- textures ----------------------------- */
function useTileTexture(base: string, line: string, tiles = 1, size = 256) {
  return useMemo(() => {
    if (typeof document === "undefined") return null;
    const c = document.createElement("canvas");
    c.width = c.height = size;
    const g = c.getContext("2d")!;
    g.fillStyle = base;
    g.fillRect(0, 0, size, size);
    // subtle speckle (terrazzo / vinyl)
    for (let i = 0; i < 1400; i++) {
      g.fillStyle = `rgba(0,0,0,${Math.random() * 0.05})`;
      g.fillRect(Math.random() * size, Math.random() * size, 2, 2);
    }
    g.strokeStyle = line;
    g.lineWidth = 2;
    const step = size / 4;
    for (let k = 0; k <= 4; k++) {
      g.beginPath(); g.moveTo(k * step, 0); g.lineTo(k * step, size); g.stroke();
      g.beginPath(); g.moveTo(0, k * step); g.lineTo(size, k * step); g.stroke();
    }
    const t = new THREE.CanvasTexture(c);
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(tiles, tiles);
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 4;
    return t;
  }, [base, line, tiles, size]);
}

const DEPT_FLOOR: Record<string, string> = {
  reception: "#dfe6ea", waiting: "#e6e1d8", erbays: "#d6e4e8", diagnostics: "#e3e7ea", bloodbank: "#e9e4e4",
  icu: "#d5e5e6", surgprep: "#d8e8e2", theatre: "#cfe3dc", recovery: "#dbe8ea",
  wardA: "#e4e8ec", wardB: "#ebe5da", daycare: "#e3ecdf",
  maternity: "#efe2e2", paediatrics: "#f3ead2", nicu: "#e5e9f0",
};
const DEPT_ACCENT: Record<string, string> = {
  paediatrics: "#f2b84b", maternity: "#e49aa8", nicu: "#9bb4e8", theatre: "#5fb59a", surgprep: "#5fb59a",
  icu: "#38c7d6", erbays: "#e05a5a", reception: "#e05a5a", bloodbank: "#b8323a", daycare: "#8cc06e",
};

/* ----------------------------- room shell ----------------------------- */
const wallMat = new THREE.MeshStandardMaterial({ color: "#f3f2ee", roughness: 0.85 });
const wallCap = new THREE.MeshStandardMaterial({ color: "#c9d1d6", roughness: 0.6 });
const highlightMat = new THREE.MeshStandardMaterial({ color: "#7ff3ff", emissive: "#22d3ee", emissiveIntensity: 2.2, toneMapped: false });
const hoverMat = new THREE.MeshStandardMaterial({ color: "#b8f6ff", emissive: "#22d3ee", emissiveIntensity: 0.8, toneMapped: false, transparent: true, opacity: 0.8 });
const accentMats: Record<string, THREE.MeshStandardMaterial> = {};
const accentMat = (c: string) => (accentMats[c] ??= new THREE.MeshStandardMaterial({ color: c, roughness: 0.7 }));

function Wall({ a, b, h = WALL_H, mat = wallMat }: { a: [number, number]; b: [number, number]; h?: number; mat?: THREE.Material }) {
  const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
  const ang = Math.atan2(b[1] - a[1], b[0] - a[0]);
  return (
    <group position={[(a[0] + b[0]) / 2, 0, (a[1] + b[1]) / 2]} rotation={[0, -ang, 0]}>
      <mesh position={[0, h / 2, 0]} material={mat} castShadow receiveShadow>
        <boxGeometry args={[len, h, 0.14]} />
      </mesh>
      <mesh position={[0, h + 0.015, 0]} material={wallCap}>
        <boxGeometry args={[len, 0.03, 0.16]} />
      </mesh>
    </group>
  );
}

const Room = memo(function Room({ dept, selected, onSelect }: { dept: Department; selected: boolean; onSelect: (id: string) => void }) {
  const [hover, setHover] = useState(false);
  const w = dept.x1 - dept.x0, d = dept.z1 - dept.z0;
  const tex = useTileTexture(DEPT_FLOOR[dept.kind] ?? "#e5e5e5", "rgba(120,130,140,0.25)", Math.round(w / 2.5));
  const floorMat = useMemo(() => new THREE.MeshStandardMaterial({ map: tex ?? undefined, roughness: 0.55, metalness: 0.02 }), [tex]);
  if (tex) tex.repeat.set(w / 2.5, d / 2.5);
  const backRow = dept.z1 <= CORRIDOR.z0 + 0.01;
  const corrZ = backRow ? dept.z1 : dept.z0;
  const accent = DEPT_ACCENT[dept.kind];
  const doorW = 2.2;
  const doorX = dept.x0 + Math.min(3, w / 2);
  const doorX2 = dept.x1 - Math.min(3, w / 2);

  const click = (e: ThreeEvent<MouseEvent>) => { e.stopPropagation(); onSelect(dept.id); };
  return (
    <group>
      <mesh
        position={[(dept.x0 + dept.x1) / 2, 0.011, (dept.z0 + dept.z1) / 2]}
        rotation={[-Math.PI / 2, 0, 0]}
        material={floorMat}
        receiveShadow
        onClick={click}
        onPointerOver={(e) => { e.stopPropagation(); setHover(true); document.body.style.cursor = "pointer"; }}
        onPointerOut={() => { setHover(false); document.body.style.cursor = "auto"; }}
      >
        <planeGeometry args={[w - 0.1, d - 0.1]} />
      </mesh>
      {/* partition walls: side walls + corridor wall with door openings */}
      <Wall a={[dept.x0, dept.z0]} b={[dept.x0, dept.z1]} />
      <Wall a={[dept.x1, dept.z0]} b={[dept.x1, dept.z1]} />
      <Wall a={[dept.x0, corrZ]} b={[doorX - doorW / 2, corrZ]} />
      <Wall a={[doorX + doorW / 2, corrZ]} b={[doorX2 - doorW / 2, corrZ]} mat={accent ? accentMat(accent) : wallMat} />
      <Wall a={[doorX2 + doorW / 2, corrZ]} b={[dept.x1, corrZ]} />
      {/* door headers */}
      {[doorX, doorX2].map((x) => (
        <mesh key={x} position={[x, WALL_H - 0.2, corrZ]} material={wallMat}>
          <boxGeometry args={[doorW, 0.4, 0.14]} />
        </mesh>
      ))}
      <DeptInterior dept={dept} />
      {(selected || hover) && <Outline dept={dept} mat={selected ? highlightMat : hoverMat} />}
    </group>
  );
});

function Outline({ dept, mat }: { dept: Department; mat: THREE.Material }) {
  const w = dept.x1 - dept.x0, d = dept.z1 - dept.z0;
  const cx = (dept.x0 + dept.x1) / 2, cz = (dept.z0 + dept.z1) / 2;
  const t = 0.12, y = 0.03;
  return (
    <group position={[cx, y, cz]}>
      <mesh position={[0, 0, -d / 2]} material={mat}><boxGeometry args={[w, 0.04, t]} /></mesh>
      <mesh position={[0, 0, d / 2]} material={mat}><boxGeometry args={[w, 0.04, t]} /></mesh>
      <mesh position={[-w / 2, 0, 0]} material={mat}><boxGeometry args={[t, 0.04, d]} /></mesh>
      <mesh position={[w / 2, 0, 0]} material={mat}><boxGeometry args={[t, 0.04, d]} /></mesh>
      <mesh position={[0, WALL_H + 0.06, -d / 2]} material={mat}><boxGeometry args={[w, 0.04, 0.05]} /></mesh>
      <mesh position={[0, WALL_H + 0.06, d / 2]} material={mat}><boxGeometry args={[w, 0.04, 0.05]} /></mesh>
      <mesh position={[-w / 2, WALL_H + 0.06, 0]} material={mat}><boxGeometry args={[0.05, 0.04, d]} /></mesh>
      <mesh position={[w / 2, WALL_H + 0.06, 0]} material={mat}><boxGeometry args={[0.05, 0.04, d]} /></mesh>
    </group>
  );
}

/* ----------------------------- floor slab & facade ----------------------------- */
const slabMat = new THREE.MeshStandardMaterial({ color: "#d7dbde", roughness: 0.8 });
const slabEdge = new THREE.MeshStandardMaterial({ color: "#eef0f1", roughness: 0.4 });
const frameMat = new THREE.MeshStandardMaterial({ color: "#3a4650", metalness: 0.7, roughness: 0.35 });
const facadeGlass = new THREE.MeshPhysicalMaterial({ color: "#9fd6e3", transparent: true, opacity: 0.32, roughness: 0.05, metalness: 0.3 });
const cyanStrip = new THREE.MeshStandardMaterial({ color: "#7ff3ff", emissive: "#22d3ee", emissiveIntensity: 1.4, toneMapped: false });
const corridorMat = new THREE.MeshStandardMaterial({ color: "#c9d3d9", roughness: 0.45 });
const columnMat = new THREE.MeshStandardMaterial({ color: "#e8e9ea", roughness: 0.7 });

function Facade({ top }: { top: boolean }) {
  const h = top ? 3.2 : FLOOR_HEIGHT - 0.3;
  const mullions = 16;
  return (
    <group>
      {/* back glazed curtain wall (full height) */}
      <mesh position={[0, h / 2, -HD + 0.05]} material={facadeGlass}><boxGeometry args={[BUILDING.w, h, 0.06]} /></mesh>
      {Array.from({ length: mullions + 1 }).map((_, i) => (
        <mesh key={i} position={[-HW + (BUILDING.w / mullions) * i, h / 2, -HD + 0.05]} material={frameMat} castShadow>
          <boxGeometry args={[0.12, h, 0.14]} />
        </mesh>
      ))}
      <mesh position={[0, 1.0, -HD + 0.05]} material={frameMat}><boxGeometry args={[BUILDING.w, 0.08, 0.14]} /></mesh>
      {/* side walls: solid with window bands */}
      {[-1, 1].map((s) => (
        <group key={s} position={[s * HW, 0, 0]}>
          <mesh position={[0, 0.5, 0]} material={wallMat} castShadow><boxGeometry args={[0.3, 1, BUILDING.d]} /></mesh>
          <mesh position={[0, 1.7, 0]} material={facadeGlass}><boxGeometry args={[0.1, 1.4, BUILDING.d]} /></mesh>
          {Array.from({ length: 9 }).map((_, i) => (
            <mesh key={i} position={[0, 1.7, -HD + (BUILDING.d / 8) * i]} material={frameMat}><boxGeometry args={[0.16, 1.4, 0.1]} /></mesh>
          ))}
          <mesh position={[0, h - (h - 2.4) / 2, 0]} material={wallMat}><boxGeometry args={[0.3, h - 2.4, BUILDING.d]} /></mesh>
        </group>
      ))}
      {/* front cutaway: low glass balustrade */}
      <mesh position={[0, 0.55, HD - 0.05]} material={facadeGlass}><boxGeometry args={[BUILDING.w, 1.1, 0.05]} /></mesh>
      <mesh position={[0, 1.1, HD - 0.05]} material={frameMat}><boxGeometry args={[BUILDING.w, 0.05, 0.08]} /></mesh>
      {/* structural columns */}
      {[-HW + 0.3, -11, 0, 11, HW - 0.3].flatMap((x) =>
        [-HD + 0.3, HD - 0.3].map((z) => (
          <mesh key={`${x}${z}`} position={[x, h / 2, z]} material={columnMat} castShadow><boxGeometry args={[0.5, h, 0.5]} /></mesh>
        )),
      )}
    </group>
  );
}

function FloorLevel({ index, y, visible, focused, dim, selectedDept, onSelectDept }: {
  index: number; y: number; visible: boolean; focused: boolean; dim: boolean; selectedDept: string | null; onSelectDept: (id: string) => void;
}) {
  const depts = useMemo(() => DEPARTMENTS.filter((d) => d.floor === index), [index]);
  const top = index === FLOORS.length - 1;
  const corridorTex = useTileTexture("#cfd8dd", "rgba(255,255,255,0.5)", 1);
  if (corridorTex) corridorTex.repeat.set(18, 1.4);
  const cMat = useMemo(() => (corridorTex ? new THREE.MeshStandardMaterial({ map: corridorTex, roughness: 0.35 }) : corridorMat), [corridorTex]);
  if (!visible) return null;
  return (
    <group position={[0, y, 0]}>
      {/* slab */}
      <mesh position={[0, -0.16, 0]} material={slabMat} receiveShadow castShadow><boxGeometry args={[BUILDING.w + 0.6, 0.3, BUILDING.d + 0.6]} /></mesh>
      <mesh position={[0, -0.16, HD + 0.31]} material={slabEdge}><boxGeometry args={[BUILDING.w + 0.6, 0.3, 0.02]} /></mesh>
      <mesh position={[0, -0.05, HD + 0.33]} material={focused ? cyanStrip : frameMat}><boxGeometry args={[BUILDING.w + 0.6, 0.04, 0.02]} /></mesh>
      {/* corridor */}
      <mesh position={[0, 0.006, 0]} rotation={[-Math.PI / 2, 0, 0]} material={cMat} receiveShadow onClick={(e) => { e.stopPropagation(); }}>
        <planeGeometry args={[BUILDING.w, CORRIDOR.z1 - CORRIDOR.z0]} />
      </mesh>
      {/* corridor guide line (emergency route) */}
      <mesh position={[0, 0.014, 0]} rotation={[-Math.PI / 2, 0, 0]} material={cyanStrip}><planeGeometry args={[BUILDING.w - 2, 0.06]} /></mesh>
      {/* corridor ceiling light panels (on header beams) */}
      {Array.from({ length: 8 }).map((_, i) => (
        <mesh key={i} position={[-HW + 3 + i * 5.4, WALL_H - 0.02, 0]} material={MAT.lamp}><boxGeometry args={[1.2, 0.04, 0.4]} /></mesh>
      ))}
      <Facade top={top} />
      {/* lift & stair core */}
      <group position={[HW - 1.1, 0, 0]}>
        <mesh position={[0, 1.4, 0]} material={frameMat}><boxGeometry args={[1.6, 2.8, 3.0]} /></mesh>
        <mesh position={[-0.81, 1.1, 0]} material={MAT.steel}><boxGeometry args={[0.02, 2.1, 1.2]} /></mesh>
      </group>
      {depts.map((d) => (
        <Room key={d.id} dept={d} selected={selectedDept === d.id} onSelect={onSelectDept} />
      ))}
      {/* corridor walkers */}
      {index === 0 && <Person position={[-4, 0, 0.5]} role="doctor" pose="walk" seed={300} rotation={Math.PI / 2} />}
      {index === 1 && <Person position={[6, 0, -0.5]} role="nurse" pose="walk" seed={301} rotation={-Math.PI / 2} />}
      {index === 2 && <Person position={[-9, 0, 0.6]} role="visitor" pose="walk" seed={302} rotation={Math.PI / 2} />}
      {index === 3 && <Person position={[3, 0, -0.5]} role="staff" pose="walk" seed={303} rotation={-Math.PI / 2} />}
      {/* roof parapet on top floor */}
      {top && <mesh position={[0, 3.3, -HD + 0.1]} material={cyanStrip}><boxGeometry args={[BUILDING.w, 0.05, 0.05]} /></mesh>}
      {dim && <mesh position={[0, 1.6, 0]} material={dimMat}><boxGeometry args={[BUILDING.w + 0.8, 3.4, BUILDING.d + 0.8]} /></mesh>}
      <Html position={[-HW - 1.2, 0.4, HD]} center distanceFactor={40} zIndexRange={[10, 0]}>
        <div className={`floor-tag ${focused ? "floor-tag--active" : ""}`}>{FLOORS[index].code}</div>
      </Html>
    </group>
  );
}
const dimMat = new THREE.MeshBasicMaterial({ color: "#0b1622", transparent: true, opacity: 0.35, depthWrite: false });

/* ----------------------------- site ----------------------------- */
function Site() {
  const groundTex = useTileTexture("#3b4a44", "rgba(0,0,0,0.12)", 1, 128);
  if (groundTex) groundTex.repeat.set(30, 30);
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.32, 0]} receiveShadow>
        <planeGeometry args={[200, 200]} />
        <meshStandardMaterial map={groundTex ?? undefined} color="#7d8f84" roughness={1} />
      </mesh>
      {/* plaza + road */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.3, 0]} receiveShadow>
        <planeGeometry args={[BUILDING.w + 10, BUILDING.d + 10]} />
        <meshStandardMaterial color="#b9bdb8" roughness={0.9} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-HW - 9, -0.29, 0]} receiveShadow>
        <planeGeometry args={[8, 120]} />
        <meshStandardMaterial color="#2c3135" roughness={0.9} />
      </mesh>
      {Array.from({ length: 14 }).map((_, i) => (
        <mesh key={i} rotation={[-Math.PI / 2, 0, 0]} position={[-HW - 9, -0.28, -56 + i * 8]}>
          <planeGeometry args={[0.2, 3]} />
          <meshStandardMaterial color="#e8e2c8" />
        </mesh>
      ))}
      {/* ambulance bay canopy */}
      <group position={[-HW - 3.5, 0, -6]}>
        <mesh position={[0, 3.6, 0]} material={slabEdge} castShadow><boxGeometry args={[7, 0.25, 8]} /></mesh>
        <mesh position={[0, 3.45, 3.95]} material={cyanStrip}><boxGeometry args={[7, 0.06, 0.06]} /></mesh>
        {[[-3.2, -3.6], [-3.2, 3.6]].map(([x, z], i) => (
          <mesh key={i} position={[x, 1.7, z]} material={frameMat} castShadow><boxGeometry args={[0.25, 3.6, 0.25]} /></mesh>
        ))}
        <Html position={[0, 4.4, 0]} center distanceFactor={40} zIndexRange={[10, 0]}><div className="site-sign">EMERGENCY</div></Html>
        <Ambulance position={[-0.4, -0.3, 0]} rotation={Math.PI / 2 - 0.05} />
      </group>
      <Ambulance position={[-HW - 10.5, -0.3, 14]} rotation={0} />
      {/* trees */}
      {[[-30, 18], [-30, -18], [26, 17], [27, -15], [10, 19], [-8, 19], [26, 3], [-30, 6]].map(([x, z], i) => (
        <Plant key={i} position={[x, -0.3, z]} scale={2.4 + (i % 3) * 0.4} />
      ))}
    </group>
  );
}

/* ----------------------------- camera ----------------------------- */
function CameraRig({ focusFloor, selectedDept, exploded, cameraKey }: { focusFloor: number | null; selectedDept: string | null; exploded: boolean; cameraKey: number }) {
  const ref = useRef<CameraControls>(null);
  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    const dept = DEPARTMENTS.find((d) => d.id === selectedDept);
    if (dept) {
      const y = floorY(dept.floor, exploded);
      const cx = (dept.x0 + dept.x1) / 2, cz = (dept.z0 + dept.z1) / 2;
      const span = Math.max(dept.x1 - dept.x0, dept.z1 - dept.z0);
      c.setLookAt(cx + span * 0.35, y + span * 0.75 + 4, cz + span * 0.8 + 5, cx, y + 0.5, cz, true);
    } else if (focusFloor !== null) {
      const y = floorY(focusFloor, exploded);
      c.setLookAt(16, y + 30, 36, 0, y, 0, true);
    } else {
      const top = floorY(3, exploded);
      c.setLookAt(46, top + 30, 54, -2, top / 2 - 1, 0, true);
    }
  }, [focusFloor, selectedDept, exploded, cameraKey]);
  return <CameraControls ref={ref} makeDefault minDistance={6} maxDistance={140} maxPolarAngle={Math.PI / 2.1} smoothTime={0.6} />;
}

/** Scene is static: re-render shadows only when visibility changes. */
function ShadowUpdater({ dep }: { dep: string }) {
  const gl = useThree((s) => s.gl);
  useEffect(() => {
    gl.shadowMap.autoUpdate = false;
    gl.shadowMap.needsUpdate = true;
    const t = setTimeout(() => (gl.shadowMap.needsUpdate = true), 50);
    return () => clearTimeout(t);
  }, [gl, dep]);
  return null;
}

function ReadySignal() {
  useEffect(() => {
    const t = setTimeout(() => document.querySelector("[data-scene]")?.setAttribute("data-scene-ready", "true"), 300);
    return () => clearTimeout(t);
  }, []);
  return null;
}

export default function HospitalScene({ focusFloor, selectedDept, hidden, exploded, onSelectDept, cameraKey }: Props) {
  const visibility = FLOORS.map((f) => !hidden[f.index] && (focusFloor === null || f.index <= focusFloor));
  return (
    <div data-scene className="absolute inset-0">
      <Canvas
        shadows
        dpr={[1, 1.75]}
        camera={{ position: [46, 42, 54], fov: 32, near: 0.5, far: 400 }}
        gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.05 }}
        onPointerMissed={() => onSelectDept(null)}
      >
        <color attach="background" args={["#0a1520"]} />
        <fog attach="fog" args={["#0a1520", 110, 220]} />
        <hemisphereLight args={["#dff3ff", "#2a3a3f", 0.55]} />
        <directionalLight
          position={[30, 60, 25]}
          intensity={2.2}
          color="#fff4e6"
          castShadow
          shadow-mapSize={[2048, 2048]}
          shadow-camera-left={-40}
          shadow-camera-right={40}
          shadow-camera-top={40}
          shadow-camera-bottom={-40}
          shadow-camera-far={160}
          shadow-bias={-0.0004}
          shadow-normalBias={0.03}
        />
        <directionalLight position={[-30, 20, -20]} intensity={0.5} color="#9fdcff" />
        <Environment resolution={128}>
          <Lightformer intensity={2} position={[0, 10, 0]} rotation-x={Math.PI / 2} scale={[20, 20, 1]} />
          <Lightformer intensity={1.2} color="#9ff" position={[-10, 3, -5]} rotation-y={Math.PI / 2} scale={[30, 2, 1]} />
          <Lightformer intensity={1} color="#ffe" position={[10, 3, 5]} rotation-y={-Math.PI / 2} scale={[30, 2, 1]} />
        </Environment>
        <Site />
        {FLOORS.map((f) => (
          <FloorLevel
            key={f.index}
            index={f.index}
            y={floorY(f.index, exploded)}
            visible={visibility[f.index]}
            focused={focusFloor === f.index}
            dim={false}
            selectedDept={selectedDept}
            onSelectDept={onSelectDept}
          />
        ))}
        <ContactShadows position={[0, -0.29, 0]} opacity={0.35} scale={90} blur={2.5} far={10} frames={1} />
        <CameraRig focusFloor={focusFloor} selectedDept={selectedDept} exploded={exploded} cameraKey={cameraKey} />
        <ShadowUpdater dep={visibility.join() + exploded + selectedDept} />
        <ReadySignal />
      </Canvas>
    </div>
  );
}
