import { useMemo } from "react";
import * as THREE from "three";

type V3 = [number, number, number];
interface P { position?: V3; rotation?: number }

// Shared materials (created once, reused everywhere for performance)
const m = (color: string, opts: Partial<THREE.MeshStandardMaterialParameters> = {}) =>
  new THREE.MeshStandardMaterial({ color, roughness: 0.6, metalness: 0.05, ...opts });
export const MAT = {
  white: m("#f2f4f5", { roughness: 0.5 }),
  linen: m("#e9eef2", { roughness: 0.9 }),
  blanketBlue: m("#7fb2c9", { roughness: 0.95 }),
  blanketTeal: m("#5aa39a", { roughness: 0.95 }),
  blanketPink: m("#e8b4c0", { roughness: 0.95 }),
  blanketYellow: m("#f1cf6a", { roughness: 0.95 }),
  steel: m("#b9c2c9", { metalness: 0.8, roughness: 0.3 }),
  darkSteel: m("#4a545c", { metalness: 0.6, roughness: 0.4 }),
  plastic: m("#d9dee2", { roughness: 0.4 }),
  black: m("#1b2024", { roughness: 0.5 }),
  screen: m("#06222b", { emissive: "#18d6ea", emissiveIntensity: 0.9, roughness: 0.2 }),
  screenGreen: m("#04210f", { emissive: "#38e07b", emissiveIntensity: 0.8 }),
  wood: m("#a77b52", { roughness: 0.7 }),
  lightWood: m("#cfa979", { roughness: 0.7 }),
  fabricGrey: m("#6d7882", { roughness: 0.95 }),
  fabricTeal: m("#2f7f86", { roughness: 0.95 }),
  fabricOrange: m("#e08a4a", { roughness: 0.95 }),
  fabricGreen: m("#79b26b", { roughness: 0.95 }),
  curtain: m("#9fd3d6", { roughness: 1, transparent: true, opacity: 0.75, side: THREE.DoubleSide }),
  curtainPink: m("#f0c6cf", { roughness: 1, transparent: true, opacity: 0.75, side: THREE.DoubleSide }),
  glass: new THREE.MeshPhysicalMaterial({ color: "#bfe6ee", transmission: 0.0, transparent: true, opacity: 0.25, roughness: 0.05, metalness: 0.1 }),
  red: m("#c8323a", { roughness: 0.5 }),
  bloodBag: m("#8e0f19", { roughness: 0.3, emissive: "#3a0005", emissiveIntensity: 0.3 }),
  cyanGlow: m("#bff7ff", { emissive: "#38e1f5", emissiveIntensity: 1.2 }),
  lamp: m("#ffffff", { emissive: "#fff7e8", emissiveIntensity: 1.6 }),
  plant: m("#3f7f45", { roughness: 0.9 }),
  pot: m("#d8d2c6", { roughness: 0.8 }),
  rubber: m("#222", { roughness: 0.9 }),
  ctBody: m("#eef1f3", { roughness: 0.35 }),
};

const Box = ({ s, p, mat, cast = true }: { s: V3; p: V3; mat: THREE.Material; cast?: boolean }) => (
  <mesh position={p} material={mat} castShadow={cast} receiveShadow>
    <boxGeometry args={s} />
  </mesh>
);
const Cyl = ({ r, h, p, mat, rt, rb, rot }: { r: number; h: number; p: V3; mat: THREE.Material; rt?: number; rb?: number; rot?: V3 }) => (
  <mesh position={p} rotation={rot} material={mat} castShadow>
    <cylinderGeometry args={[rt ?? r, rb ?? r, h, 14]} />
  </mesh>
);

/* ------------------------------ PEOPLE ------------------------------ */
export type Role = "doctor" | "nurse" | "surgeon" | "patient" | "visitor" | "staff" | "child" | "paramedic";
export type Pose = "stand" | "walk" | "sit" | "lie" | "lean";

const SKIN = ["#f1c9a5", "#d9a77c", "#b97f55", "#8d5a3b", "#5e3a26", "#e8b996"];
const HAIR = ["#1f1a17", "#3b2a1e", "#6b4a2c", "#a77a45", "#2b2b2b", "#8a8a8a", "#c49a5a"];
const VISITOR_TOPS = ["#3d5a80", "#9c4f4f", "#5b7c4a", "#c9a24b", "#6b5b95", "#41697a", "#b46a3c", "#7a7a7a"];
const VISITOR_PANTS = ["#2c3440", "#3b3b3b", "#4d5a6a", "#6a5844", "#1f2a3a"];

const roleColors = (role: Role, seed: number) => {
  const pick = <T,>(a: T[], k = 0) => a[(seed * 7 + k * 13) % a.length];
  switch (role) {
    case "doctor": return { top: "#f4f6f7", pants: pick(["#2a3b4f", "#3b4a5a", "#1e2833"]), coat: true };
    case "nurse": return { top: pick(["#2f8f9d", "#3a7bbf", "#4a9a8a"]), pants: pick(["#2f8f9d", "#3a7bbf", "#4a9a8a"]), coat: false };
    case "surgeon": return { top: "#4f8f7a", pants: "#4f8f7a", coat: false };
    case "patient": return { top: pick(["#a9cde0", "#b9d8c8", "#c8d4e6"]), pants: pick(["#a9cde0", "#b9d8c8"]), coat: false };
    case "paramedic": return { top: "#2b4a7a", pants: "#24324a", coat: false };
    case "staff": return { top: pick(["#6a7a8a", "#8a6a4a", "#556b5a"]), pants: "#2f3338", coat: false };
    case "child": return { top: pick(["#f2a65a", "#7cc6e8", "#e67fa0", "#9bd36b"]), pants: pick(["#3a5a9a", "#5a4a8a"]), coat: false };
    default: return { top: pick(VISITOR_TOPS, 1), pants: pick(VISITOR_PANTS, 2), coat: false };
  }
};

export function Person({ position = [0, 0, 0], rotation = 0, role = "visitor", pose = "stand", seed = 0, scale = 1 }: P & { role?: Role; pose?: Pose; seed?: number; scale?: number }) {
  const mats = useMemo(() => {
    const c = roleColors(role, seed);
    return {
      skin: m(SKIN[(seed * 5 + 1) % SKIN.length], { roughness: 0.7 }),
      hair: m(HAIR[(seed * 3 + 2) % HAIR.length], { roughness: 0.9 }),
      top: m(c.top, { roughness: 0.85 }),
      pants: m(c.pants, { roughness: 0.85 }),
      shoe: m(role === "surgeon" || role === "nurse" ? "#e8e8e8" : "#2a2522"),
      cap: m("#4f8f7a"),
      coat: c.coat,
    };
  }, [role, seed]);
  const s = (role === "child" ? 0.62 : 1) * scale * (0.94 + ((seed * 37) % 10) / 80);
  const sit = pose === "sit";
  const walk = pose === "walk";
  const lie = pose === "lie";
  const swing = walk ? 0.35 * (seed % 2 ? 1 : -1) : 0;
  const longHair = seed % 3 === 0;

  // Body built standing; lying = rotated onto back, sitting = thighs horizontal.
  const body = (
    <group>
      {/* legs */}
      {[-1, 1].map((side) => (
        <group key={side} position={[0.1 * side, sit ? 0.47 : 0.88, 0]} rotation={[sit ? -Math.PI / 2 : swing * side, 0, 0]}>
          <mesh position={[0, -0.22, 0]} material={mats.pants} castShadow>
            <capsuleGeometry args={[0.075, 0.36, 4, 8]} />
          </mesh>
          <group position={[0, -0.44, 0]} rotation={[sit ? Math.PI / 2 : -swing * side * 0.4, 0, 0]}>
            <mesh position={[0, -0.2, 0]} material={mats.pants} castShadow>
              <capsuleGeometry args={[0.062, 0.34, 4, 8]} />
            </mesh>
            <mesh position={[0, -0.42, 0.05]} material={mats.shoe}>
              <boxGeometry args={[0.1, 0.07, 0.24]} />
            </mesh>
          </group>
        </group>
      ))}
      {/* torso */}
      <group position={[0, sit ? 0.47 : 0.88, 0]} rotation={[pose === "lean" ? 0.25 : 0, 0, 0]}>
        <mesh position={[0, 0.08, 0]} material={mats.pants} castShadow>
          <capsuleGeometry args={[0.15, 0.08, 4, 10]} />
        </mesh>
        <mesh position={[0, 0.33, 0]} scale={[1, 1, 0.68]} material={mats.coat ? MAT.white : mats.top} castShadow>
          <capsuleGeometry args={[0.17, 0.32, 4, 12]} />
        </mesh>
        {mats.coat && (
          <mesh position={[0, 0.42, 0.075]} material={mats.top}>
            <boxGeometry args={[0.1, 0.22, 0.04]} />
          </mesh>
        )}
        {/* arms */}
        {[-1, 1].map((side) => (
          <group key={side} position={[0.225 * side, 0.55, 0]} rotation={[sit ? -0.5 : -swing * side * 0.8 + (pose === "lean" ? -0.6 : 0), 0, 0.08 * side]}>
            <mesh position={[0, -0.25, 0]} material={mats.coat ? MAT.white : mats.top} castShadow>
              <capsuleGeometry args={[0.055, 0.42, 4, 8]} />
            </mesh>
            <mesh position={[0, -0.52, 0]} material={mats.skin}>
              <sphereGeometry args={[0.05, 8, 8]} />
            </mesh>
          </group>
        ))}
        {/* neck + head */}
        <mesh position={[0, 0.66, 0]} material={mats.skin}>
          <cylinderGeometry args={[0.05, 0.06, 0.1, 8]} />
        </mesh>
        <group position={[0, 0.82, 0]}>
          <mesh scale={[0.92, 1.05, 1]} material={mats.skin} castShadow>
            <sphereGeometry args={[0.115, 16, 14]} />
          </mesh>
          <mesh position={[0, 0.035, -0.012]} scale={[1, 0.9, 1.04]} material={role === "surgeon" ? mats.cap : mats.hair}>
            <sphereGeometry args={[0.12, 14, 10, 0, Math.PI * 2, 0, Math.PI / 1.8]} />
          </mesh>
          {longHair && role !== "surgeon" && (
            <mesh position={[0, -0.08, -0.07]} material={mats.hair}>
              <boxGeometry args={[0.2, 0.2, 0.06]} />
            </mesh>
          )}
          {role === "surgeon" && (
            <mesh position={[0, -0.04, 0.09]} material={MAT.linen}>
              <boxGeometry args={[0.15, 0.08, 0.03]} />
            </mesh>
          )}
        </group>
      </group>
    </group>
  );

  if (lie) {
    // head toward -z of bed local; caller positions on mattress top
    return (
      <group position={position} rotation={[0, rotation, 0]} scale={s}>
        <group rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.12, 0.85]}>{body}</group>
      </group>
    );
  }
  return (
    <group position={position} rotation={[0, rotation, 0]} scale={s}>
      {body}
    </group>
  );
}

/* ------------------------------ FURNITURE ------------------------------ */
export function Bed({ position, rotation = 0, occupant, blanket = MAT.blanketBlue, small = false, seed = 0, role = "patient" }: P & { occupant?: boolean; blanket?: THREE.Material; small?: boolean; seed?: number; role?: Role }) {
  const k = small ? 0.72 : 1;
  return (
    <group position={position} rotation={[0, rotation, 0]} scale={[k, 1, k]}>
      {/* wheels + frame */}
      {[[-0.4, -0.9], [0.4, -0.9], [-0.4, 0.9], [0.4, 0.9]].map(([x, z], i) => (
        <Cyl key={i} r={0.04} h={0.05} p={[x, 0.04, z]} mat={MAT.rubber} rot={[0, 0, Math.PI / 2]} />
      ))}
      <Box s={[0.92, 0.12, 2.0]} p={[0, 0.32, 0]} mat={MAT.steel} />
      {[[-0.4, -0.9], [0.4, -0.9], [-0.4, 0.9], [0.4, 0.9]].map(([x, z], i) => (
        <Box key={i} s={[0.04, 0.26, 0.04]} p={[x, 0.18, z]} mat={MAT.darkSteel} cast={false} />
      ))}
      <Box s={[0.88, 0.16, 1.94]} p={[0, 0.46, 0]} mat={MAT.linen} />
      {/* head & foot boards */}
      <Box s={[0.96, 0.62, 0.06]} p={[0, 0.6, -1.02]} mat={small ? MAT.lightWood : MAT.plastic} />
      <Box s={[0.96, 0.36, 0.05]} p={[0, 0.5, 1.02]} mat={small ? MAT.lightWood : MAT.plastic} />
      {/* side rails */}
      {[-1, 1].map((sd) => (
        <Box key={sd} s={[0.03, 0.12, 0.8]} p={[0.47 * sd, 0.62, -0.35]} mat={MAT.steel} cast={false} />
      ))}
      {/* pillow + blanket */}
      <mesh position={[0, 0.58, -0.78]} material={MAT.white} castShadow>
        <boxGeometry args={[0.6, 0.1, 0.32]} />
      </mesh>
      <Box s={[0.9, 0.06, 1.2]} p={[0, occupant ? 0.72 : 0.56, 0.36]} mat={blanket} />
      {occupant && <Person position={[0, 0.54, small ? 0.05 : 0]} role={small ? "child" : role} pose="lie" seed={seed} scale={small ? 1.25 : 0.95} />}
    </group>
  );
}

export function BedsideTable({ position, rotation = 0 }: P) {
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      <Box s={[0.45, 0.7, 0.42]} p={[0, 0.35, 0]} mat={MAT.lightWood} />
      <Box s={[0.4, 0.02, 0.37]} p={[0, 0.71, 0]} mat={MAT.white} />
      <Cyl r={0.04} h={0.12} p={[0.1, 0.78, 0]} mat={MAT.glass} />
    </group>
  );
}

export function Monitor({ position, rotation = 0, tall = 1.5 }: P & { tall?: number }) {
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      <Cyl r={0.22} h={0.04} p={[0, 0.03, 0]} mat={MAT.darkSteel} />
      <Cyl r={0.022} h={tall} p={[0, tall / 2, 0]} mat={MAT.steel} />
      <Box s={[0.42, 0.32, 0.08]} p={[0, tall + 0.1, 0]} mat={MAT.plastic} />
      <Box s={[0.36, 0.25, 0.01]} p={[0, tall + 0.1, 0.045]} mat={MAT.screenGreen} cast={false} />
    </group>
  );
}

export function Ventilator({ position, rotation = 0 }: P) {
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      {[[-0.18, -0.18], [0.18, -0.18], [-0.18, 0.18], [0.18, 0.18]].map(([x, z], i) => (
        <Cyl key={i} r={0.035} h={0.04} p={[x, 0.035, z]} mat={MAT.rubber} />
      ))}
      <Cyl r={0.025} h={0.6} p={[0, 0.35, 0]} mat={MAT.steel} />
      <Box s={[0.44, 0.5, 0.38]} p={[0, 0.9, 0]} mat={MAT.ctBody} />
      <Box s={[0.34, 0.26, 0.02]} p={[0, 1.3, 0.12]} mat={MAT.screen} />
      <mesh position={[0.25, 0.9, 0]} rotation={[0, 0, 0.5]} material={MAT.plastic}>
        <torusGeometry args={[0.18, 0.015, 6, 16, Math.PI]} />
      </mesh>
    </group>
  );
}

export function IVPole({ position }: P) {
  return (
    <group position={position}>
      <Cyl r={0.2} h={0.03} p={[0, 0.04, 0]} mat={MAT.darkSteel} />
      <Cyl r={0.015} h={1.9} p={[0, 0.95, 0]} mat={MAT.steel} />
      <Box s={[0.12, 0.2, 0.04]} p={[0.08, 1.75, 0]} mat={MAT.glass} />
      <Box s={[0.14, 0.18, 0.1]} p={[0, 1.1, 0.04]} mat={MAT.plastic} />
    </group>
  );
}

export function Chair({ position, rotation = 0, mat = MAT.fabricTeal, arm = false }: P & { mat?: THREE.Material; arm?: boolean }) {
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      {[[-0.2, -0.2], [0.2, -0.2], [-0.2, 0.2], [0.2, 0.2]].map(([x, z], i) => (
        <Box key={i} s={[0.03, 0.42, 0.03]} p={[x, 0.21, z]} mat={MAT.darkSteel} cast={false} />
      ))}
      <Box s={[0.48, 0.07, 0.46]} p={[0, 0.44, 0]} mat={mat} />
      <Box s={[0.48, 0.5, 0.06]} p={[0, 0.72, -0.22]} mat={mat} />
      {arm && [-1, 1].map((s) => <Box key={s} s={[0.05, 0.2, 0.42]} p={[0.26 * s, 0.58, 0]} mat={MAT.darkSteel} />)}
    </group>
  );
}

export function Recliner({ position, rotation = 0, mat = MAT.fabricTeal }: P & { mat?: THREE.Material }) {
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      <Box s={[0.75, 0.42, 0.8]} p={[0, 0.21, 0]} mat={MAT.darkSteel} />
      <Box s={[0.7, 0.14, 0.75]} p={[0, 0.48, 0.05]} mat={mat} />
      <mesh position={[0, 0.85, -0.36]} rotation={[-0.25, 0, 0]} material={mat} castShadow>
        <boxGeometry args={[0.7, 0.8, 0.16]} />
      </mesh>
      {[-1, 1].map((s) => <Box key={s} s={[0.1, 0.25, 0.8]} p={[0.38 * s, 0.6, 0]} mat={mat} />)}
      <Box s={[0.6, 0.1, 0.4]} p={[0, 0.35, 0.58]} mat={mat} />
    </group>
  );
}

export function Sofa({ position, rotation = 0, mat = MAT.fabricGrey, len = 1.8 }: P & { mat?: THREE.Material; len?: number }) {
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      <Box s={[len, 0.4, 0.8]} p={[0, 0.2, 0]} mat={mat} />
      <Box s={[len, 0.45, 0.2]} p={[0, 0.62, -0.3]} mat={mat} />
      {[-1, 1].map((s) => <Box key={s} s={[0.18, 0.55, 0.8]} p={[(len / 2) * s, 0.28, 0]} mat={mat} />)}
    </group>
  );
}

export function SeatRow({ position, rotation = 0, n = 4, mat = MAT.fabricTeal }: P & { n?: number; mat?: THREE.Material }) {
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      <Box s={[n * 0.55, 0.05, 0.08]} p={[0, 0.3, 0]} mat={MAT.steel} />
      {Array.from({ length: n }).map((_, i) => (
        <group key={i} position={[(i - (n - 1) / 2) * 0.55, 0, 0]}>
          <Box s={[0.48, 0.06, 0.44]} p={[0, 0.44, 0]} mat={mat} />
          <Box s={[0.48, 0.45, 0.05]} p={[0, 0.7, -0.21]} mat={mat} />
        </group>
      ))}
      {[-1, 1].map((s) => <Box key={s} s={[0.05, 0.44, 0.4]} p={[((n * 0.55) / 2) * s, 0.22, 0]} mat={MAT.darkSteel} />)}
    </group>
  );
}

export function Desk({ position, rotation = 0, w = 1.4, computer = true }: P & { w?: number; computer?: boolean }) {
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      <Box s={[w, 0.05, 0.7]} p={[0, 0.75, 0]} mat={MAT.lightWood} />
      <Box s={[w, 0.72, 0.05]} p={[0, 0.37, -0.32]} mat={MAT.white} />
      {[-1, 1].map((s) => <Box key={s} s={[0.05, 0.72, 0.66]} p={[(w / 2 - 0.03) * s, 0.37, 0]} mat={MAT.white} />)}
      {computer && (
        <>
          <Box s={[0.55, 0.34, 0.04]} p={[0, 1.02, -0.18]} mat={MAT.black} />
          <Box s={[0.5, 0.29, 0.01]} p={[0, 1.02, -0.155]} mat={MAT.screen} cast={false} />
          <Box s={[0.42, 0.02, 0.14]} p={[0, 0.79, 0.08]} mat={MAT.black} />
        </>
      )}
    </group>
  );
}

/** Curved nursing / triage counter */
export function NursingStation({ position, rotation = 0, r = 1.6 }: P & { r?: number }) {
  const segs = 5;
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      <mesh position={[0, 0.55, 0]} material={MAT.white} castShadow receiveShadow>
        <cylinderGeometry args={[r, r, 1.1, 32, 1, true, -Math.PI / 2, Math.PI]} />
      </mesh>
      <mesh position={[0, 1.12, 0]} rotation={[-Math.PI / 2, 0, 0]} material={MAT.lightWood}>
        <ringGeometry args={[r - 0.35, r + 0.05, 32, 1, -Math.PI, Math.PI]} />
      </mesh>
      <mesh position={[0, 0.62, 0]} material={MAT.cyanGlow}>
        <cylinderGeometry args={[r + 0.01, r + 0.01, 0.04, 32, 1, true, -Math.PI / 2, Math.PI]} />
      </mesh>
      {Array.from({ length: segs - 2 }).map((_, i) => {
        const a = -Math.PI / 2 + ((i + 1) / (segs - 1)) * Math.PI - Math.PI / 2;
        const x = Math.sin(a + Math.PI / 2) * (r - 0.5), z = Math.cos(a + Math.PI / 2) * (r - 0.5);
        return (
          <group key={i} position={[x, 0, z]} rotation={[0, a + Math.PI / 2 + Math.PI, 0]}>
            <Box s={[0.5, 0.32, 0.04]} p={[0, 1.32, 0]} mat={MAT.black} />
            <Box s={[0.45, 0.27, 0.01]} p={[0, 1.32, -0.025]} mat={MAT.screen} cast={false} />
          </group>
        );
      })}
    </group>
  );
}

export function Stretcher({ position, rotation = 0, occupant = false, seed = 0 }: P & { occupant?: boolean; seed?: number }) {
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      {[[-0.28, -0.8], [0.28, -0.8], [-0.28, 0.8], [0.28, 0.8]].map(([x, z], i) => (
        <group key={i}>
          <Cyl r={0.06} h={0.04} p={[x, 0.06, z]} mat={MAT.rubber} rot={[0, 0, Math.PI / 2]} />
          <Box s={[0.03, 0.75, 0.03]} p={[x, 0.45, z * 0.7]} mat={MAT.steel} cast={false} />
        </group>
      ))}
      <Box s={[0.62, 0.06, 1.9]} p={[0, 0.82, 0]} mat={MAT.steel} />
      <Box s={[0.6, 0.08, 1.85]} p={[0, 0.88, 0]} mat={MAT.white} />
      {[-1, 1].map((s) => <Box key={s} s={[0.025, 0.1, 1.5]} p={[0.32 * s, 0.98, 0]} mat={MAT.darkSteel} cast={false} />)}
      {occupant && <Person position={[0, 0.92, 0]} role="patient" pose="lie" seed={seed} scale={0.92} />}
      {occupant && <Box s={[0.6, 0.05, 0.9]} p={[0, 1.12, 0.45]} mat={MAT.blanketYellow} />}
    </group>
  );
}

export function Wheelchair({ position, rotation = 0, occupant = false, seed = 0 }: P & { occupant?: boolean; seed?: number }) {
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      {[-1, 1].map((s) => (
        <mesh key={s} position={[0.3 * s, 0.3, -0.05]} rotation={[0, Math.PI / 2, 0]} material={MAT.darkSteel} castShadow>
          <torusGeometry args={[0.28, 0.025, 8, 24]} />
        </mesh>
      ))}
      {[-1, 1].map((s) => <Cyl key={s} r={0.06} h={0.03} p={[0.22 * s, 0.06, 0.38]} mat={MAT.rubber} rot={[0, 0, Math.PI / 2]} />)}
      <Box s={[0.5, 0.05, 0.45]} p={[0, 0.48, 0.05]} mat={MAT.black} />
      <Box s={[0.5, 0.45, 0.04]} p={[0, 0.75, -0.2]} mat={MAT.black} />
      {[-1, 1].map((s) => <Box key={s} s={[0.03, 0.03, 0.3]} p={[0.24 * s, 1.0, -0.32]} mat={MAT.steel} />)}
      {occupant && <Person position={[0, 0.02, -0.02]} role="patient" pose="sit" seed={seed} />}
    </group>
  );
}

export function Curtain({ position, rotation = 0, len = 2.2, mat = MAT.curtain, h = 1.9 }: P & { len?: number; mat?: THREE.Material; h?: number }) {
  const geo = useMemo(() => {
    const g = new THREE.PlaneGeometry(len, h, 24, 1);
    const pos = g.attributes.position;
    for (let i = 0; i < pos.count; i++) pos.setZ(i, Math.sin(pos.getX(i) * 9) * 0.05);
    g.computeVertexNormals();
    return g;
  }, [len, h]);
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      <mesh geometry={geo} position={[0, 0.25 + h / 2, 0]} material={mat} />
      <Box s={[len, 0.03, 0.03]} p={[0, h + 0.28, 0]} mat={MAT.steel} cast={false} />
    </group>
  );
}

export function CTScanner({ position, rotation = 0 }: P) {
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      <mesh position={[0, 1.05, 0]} material={MAT.ctBody} castShadow>
        <torusGeometry args={[0.72, 0.32, 20, 40]} />
      </mesh>
      <Box s={[2.0, 0.6, 0.7]} p={[0, 0.3, 0]} mat={MAT.ctBody} />
      <mesh position={[0, 1.05, 0.33]} material={MAT.cyanGlow}>
        <torusGeometry args={[0.55, 0.02, 8, 40]} />
      </mesh>
      <Box s={[0.5, 0.7, 2.4]} p={[0, 0.35, 1.5]} mat={MAT.plastic} />
      <Box s={[0.46, 0.08, 2.6]} p={[0, 0.75, 1.0]} mat={MAT.white} />
    </group>
  );
}

export function XRay({ position, rotation = 0 }: P) {
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      <Box s={[0.8, 0.7, 2.0]} p={[0, 0.35, 0]} mat={MAT.plastic} />
      <Box s={[0.2, 2.4, 0.2]} p={[-0.7, 1.2, 0]} mat={MAT.steel} />
      <Box s={[1.0, 0.2, 0.2]} p={[-0.2, 2.3, 0]} mat={MAT.steel} />
      <Box s={[0.5, 0.35, 0.5]} p={[0.1, 1.9, 0]} mat={MAT.ctBody} />
    </group>
  );
}

export function ORTable({ position, rotation = 0, occupant = true, seed = 0 }: P & { occupant?: boolean; seed?: number }) {
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      <Box s={[0.6, 0.06, 0.8]} p={[0, 0.03, 0]} mat={MAT.darkSteel} />
      <Cyl r={0.12} h={0.75} p={[0, 0.42, 0]} mat={MAT.steel} />
      <Box s={[0.58, 0.1, 2.0]} p={[0, 0.85, 0]} mat={MAT.black} />
      {occupant && <Person position={[0, 0.9, 0]} role="patient" pose="lie" seed={seed} />}
      {occupant && <Box s={[0.75, 0.04, 1.4]} p={[0, 1.12, 0.3]} mat={m("#4f8f7a", { roughness: 1 })} />}
    </group>
  );
}

export function SurgicalLight({ position }: P) {
  return (
    <group position={position}>
      <Cyl r={0.03} h={0.8} p={[0, 0.4, 0]} mat={MAT.steel} />
      {[-0.45, 0.45].map((x) => (
        <group key={x} position={[x, 0, 0]}>
          <Box s={[0.9, 0.04, 0.04]} p={[-x / 2, 0.05, 0]} mat={MAT.steel} />
          <Cyl r={0.36} rt={0.2} rb={0.38} h={0.14} p={[0, -0.05, 0]} mat={MAT.white} />
          <mesh position={[0, -0.125, 0]} rotation={[Math.PI / 2, 0, 0]} material={MAT.lamp}>
            <circleGeometry args={[0.33, 20]} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

export function InstrumentTrolley({ position, rotation = 0 }: P) {
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      <Box s={[0.8, 0.03, 0.5]} p={[0, 0.95, 0]} mat={MAT.steel} />
      <Box s={[0.8, 0.03, 0.5]} p={[0, 0.4, 0]} mat={MAT.steel} />
      {[[-0.38, -0.23], [0.38, -0.23], [-0.38, 0.23], [0.38, 0.23]].map(([x, z], i) => (
        <Box key={i} s={[0.02, 0.95, 0.02]} p={[x, 0.48, z]} mat={MAT.steel} cast={false} />
      ))}
      <Box s={[0.6, 0.02, 0.35]} p={[0, 0.975, 0]} mat={m("#3d7fa8")} cast={false} />
    </group>
  );
}

export function AnaesthesiaMachine({ position, rotation = 0 }: P) {
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      <Box s={[0.7, 1.2, 0.6]} p={[0, 0.6, 0]} mat={MAT.ctBody} />
      <Box s={[0.6, 0.4, 0.05]} p={[0, 1.45, 0.1]} mat={MAT.black} />
      <Box s={[0.54, 0.34, 0.01]} p={[0, 1.45, 0.13]} mat={MAT.screen} cast={false} />
      {[-0.2, 0, 0.2].map((x) => <Cyl key={x} r={0.05} h={0.5} p={[x, 0.5, -0.36]} mat={x === 0 ? MAT.red : MAT.plastic} />)}
    </group>
  );
}

export function Sink({ position, rotation = 0 }: P) {
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      <Box s={[1.8, 0.85, 0.6]} p={[0, 0.42, 0]} mat={MAT.steel} />
      {[-0.5, 0.5].map((x) => <Cyl key={x} r={0.02} h={0.35} p={[x, 1.0, -0.2]} mat={MAT.steel} />)}
      <Box s={[1.8, 0.7, 0.04]} p={[0, 1.4, -0.28]} mat={MAT.glass} />
    </group>
  );
}

export function Incubator({ position, rotation = 0, baby = true, seed = 0 }: P & { baby?: boolean; seed?: number }) {
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      <Box s={[0.7, 0.75, 0.5]} p={[0, 0.38, 0]} mat={MAT.plastic} />
      <Box s={[0.75, 0.1, 0.55]} p={[0, 0.8, 0]} mat={MAT.white} />
      <Box s={[0.72, 0.38, 0.5]} p={[0, 1.05, 0]} mat={MAT.glass} />
      <Box s={[0.4, 0.06, 0.2]} p={[0, 0.88, 0]} mat={MAT.blanketYellow} />
      {baby && (
        <mesh position={[-0.18, 0.92, 0]} material={m(SKIN[seed % SKIN.length])}>
          <sphereGeometry args={[0.06, 10, 8]} />
        </mesh>
      )}
      <Box s={[0.25, 0.2, 0.05]} p={[0.3, 1.45, 0]} mat={MAT.screenGreen} />
    </group>
  );
}

export function Crib({ position, rotation = 0, seed = 0 }: P & { seed?: number }) {
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      <Box s={[0.5, 0.65, 0.4]} p={[0, 0.33, 0]} mat={MAT.white} />
      <Box s={[0.55, 0.3, 0.8]} p={[0, 0.85, 0]} mat={MAT.glass} />
      <mesh position={[0, 0.8, -0.2]} material={m(SKIN[(seed + 2) % SKIN.length])}>
        <sphereGeometry args={[0.06, 10, 8]} />
      </mesh>
    </group>
  );
}

export function BloodFridge({ position, rotation = 0 }: P) {
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      <Box s={[1.0, 2.0, 0.7]} p={[0, 1.0, 0]} mat={MAT.white} />
      {[0.5, 0.9, 1.3, 1.7].map((y) => (
        <group key={y}>
          <Box s={[0.85, 0.02, 0.5]} p={[0, y - 0.15, 0.05]} mat={MAT.steel} cast={false} />
          {[-0.3, -0.1, 0.1, 0.3].map((x) => <Box key={x} s={[0.14, 0.2, 0.04]} p={[x, y - 0.03, 0.15]} mat={MAT.bloodBag} cast={false} />)}
        </group>
      ))}
      <Box s={[0.9, 1.8, 0.02]} p={[0, 1.0, 0.36]} mat={MAT.glass} cast={false} />
      <Box s={[0.4, 0.08, 0.02]} p={[0, 1.93, 0.37]} mat={MAT.screen} cast={false} />
    </group>
  );
}

export function LabBench({ position, rotation = 0, len = 3 }: P & { len?: number }) {
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      <Box s={[len, 0.9, 0.7]} p={[0, 0.45, 0]} mat={MAT.white} />
      <Box s={[len, 0.04, 0.72]} p={[0, 0.92, 0]} mat={MAT.black} />
      <Box s={[0.5, 0.4, 0.4]} p={[-len / 3, 1.14, -0.05]} mat={MAT.plastic} />
      <Cyl r={0.2} h={0.25} p={[len / 4, 1.06, 0]} mat={MAT.ctBody} />
      {[-0.2, 0, 0.2].map((x) => <Cyl key={x} r={0.03} h={0.15} p={[x, 1.0, 0.15]} mat={MAT.glass} />)}
    </group>
  );
}

export function Plant({ position, scale = 1 }: P & { scale?: number }) {
  return (
    <group position={position} scale={scale}>
      <Cyl r={0.2} rt={0.22} rb={0.16} h={0.4} p={[0, 0.2, 0]} mat={MAT.pot} />
      <mesh position={[0, 0.75, 0]} material={MAT.plant} castShadow>
        <icosahedronGeometry args={[0.38, 1]} />
      </mesh>
      <mesh position={[0.12, 1.05, 0.05]} material={MAT.plant} castShadow>
        <icosahedronGeometry args={[0.25, 1]} />
      </mesh>
    </group>
  );
}

export function CoffeeTable({ position, rotation = 0 }: P) {
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      <Box s={[1.0, 0.05, 0.55]} p={[0, 0.42, 0]} mat={MAT.wood} />
      <Box s={[0.9, 0.4, 0.45]} p={[0, 0.2, 0]} mat={MAT.darkSteel} />
    </group>
  );
}

export function ToyBlocks({ position }: P) {
  const cols = ["#e85d5d", "#f2c14e", "#5db0e8", "#7ac66b", "#b07ae8"];
  return (
    <group position={position}>
      <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]} material={m("#f6e3a1", { roughness: 1 })} receiveShadow>
        <circleGeometry args={[1.4, 32]} />
      </mesh>
      {cols.map((c, i) => (
        <mesh key={c} position={[Math.cos(i * 1.3) * 0.7, 0.12 + (i === 2 ? 0.24 : 0), Math.sin(i * 1.3) * 0.7]} rotation={[0, i, 0]} material={m(c)} castShadow>
          <boxGeometry args={[0.24, 0.24, 0.24]} />
        </mesh>
      ))}
      <mesh position={[0.2, 0.25, -0.2]} material={m("#e85d5d")} castShadow>
        <sphereGeometry args={[0.25, 16, 12]} />
      </mesh>
    </group>
  );
}

export function Ambulance({ position, rotation = 0 }: P) {
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      <Box s={[2.2, 2.3, 4.0]} p={[0, 1.55, -0.6]} mat={MAT.white} />
      <Box s={[2.1, 1.5, 1.6]} p={[0, 1.15, 2.1]} mat={MAT.white} />
      <Box s={[1.9, 0.6, 0.05]} p={[0, 1.5, 2.92]} mat={MAT.glass} />
      <Box s={[2.22, 0.3, 5.6]} p={[0, 1.1, 0.2]} mat={MAT.red} />
      <Box s={[1.4, 0.15, 0.4]} p={[0, 2.78, 0.9]} mat={m("#ff3344", { emissive: "#ff2233", emissiveIntensity: 1.5 })} />
      <Box s={[0.5, 0.5, 0.02]} p={[0, 2.0, -2.61]} mat={MAT.red} />
      {[[-1, 1.8], [1, 1.8], [-1, -1.6], [1, -1.6]].map(([x, z], i) => (
        <Cyl key={i} r={0.4} h={0.3} p={[x, 0.4, z]} mat={MAT.rubber} rot={[0, 0, Math.PI / 2]} />
      ))}
    </group>
  );
}
