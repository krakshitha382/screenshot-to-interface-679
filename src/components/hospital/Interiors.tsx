import type { Department } from "@/lib/hospital-data";
import { CORRIDOR } from "@/lib/hospital-data";
import {
  MAT, Person, Bed, BedsideTable, Monitor, Ventilator, IVPole, Chair, Recliner, Sofa, SeatRow, Desk,
  NursingStation, Stretcher, Wheelchair, Curtain, CTScanner, XRay, ORTable, SurgicalLight,
  InstrumentTrolley, AnaesthesiaMachine, Sink, Incubator, Crib, BloodFridge, LabBench, Plant,
  CoffeeTable, ToyBlocks,
} from "./Furniture";
import type { ReactNode } from "react";

/**
 * Local frame for each department: origin at room centre, +z points AWAY from the corridor
 * (toward the exterior wall). So "back wall" furniture sits near z = +d/2.
 */
export function DeptInterior({ dept }: { dept: Department }) {
  const cx = (dept.x0 + dept.x1) / 2;
  const cz = (dept.z0 + dept.z1) / 2;
  const w = dept.x1 - dept.x0;
  const d = dept.z1 - dept.z0;
  const backRow = dept.z1 <= CORRIDOR.z0 + 0.01;
  // rotate so local +z faces exterior
  const rot = backRow ? Math.PI : 0;
  const content = KINDS[dept.kind]?.(w, d) ?? null;
  return (
    <group position={[cx, 0, cz]} rotation={[0, rot, 0]}>
      {content}
    </group>
  );
}

const range = (n: number) => Array.from({ length: n }, (_, i) => i);
const spread = (n: number, span: number) => range(n).map((i) => (n === 1 ? 0 : -span / 2 + (i * span) / (n - 1)));

type Builder = (w: number, d: number) => ReactNode;

const KINDS: Record<string, Builder> = {
  reception: (w, d) => (
    <>
      <NursingStation position={[-1, 0, 1]} rotation={Math.PI} r={1.8} />
      <Person position={[-1, 0, 2.3]} role="nurse" seed={1} rotation={Math.PI} />
      <Person position={[0.2, 0, 2.0]} role="staff" seed={4} rotation={Math.PI} />
      <Person position={[-1.4, 0, -1.4]} role="visitor" seed={6} />
      <Wheelchair position={[-0.2, 0, -1.6]} occupant seed={3} />
      <Person position={[-0.2, 0, -2.4]} role="paramedic" pose="lean" seed={2} />
      {/* triage cubicle */}
      <Curtain position={[w / 2 - 2.8, 0, d / 2 - 2.6]} rotation={Math.PI / 2} len={3} />
      <Stretcher position={[w / 2 - 1.4, 0, d / 2 - 1.8]} occupant seed={7} />
      <Monitor position={[w / 2 - 0.5, 0, d / 2 - 0.6]} />
      <Person position={[w / 2 - 2.2, 0, d / 2 - 1.4]} role="doctor" pose="lean" seed={5} rotation={Math.PI / 2} />
      {spread(3, 1.4).map((x, i) => <Wheelchair key={i} position={[-w / 2 + 1 + x * 0.6 + 0.8, 0, d / 2 - 0.7]} rotation={Math.PI} />)}
      <Plant position={[-w / 2 + 0.6, 0, -d / 2 + 0.6]} />
    </>
  ),
  waiting: (w, d) => (
    <>
      {[-1.5, 1.2, 3.6].map((z, r) =>
        [-1, 1].map((sx) => (
          <group key={`${r}${sx}`}>
            <SeatRow position={[sx * 3.4, 0, z]} n={5} mat={r % 2 ? MAT.fabricTeal : MAT.fabricGrey} rotation={Math.PI} />
          </group>
        )),
      )}
      {/* seated people, varied */}
      {[
        [-4.5, -1.5], [-3.4, -1.5], [2.3, -1.5], [3.9, -1.5], [-2.3, 1.2], [3.4, 1.2], [4.5, 1.2], [-4.5, 3.6], [-3.9, 3.6], [2.8, 3.6],
      ].map(([x = 0, z = 0], i) => (
        <Person key={i} position={[x + (x < 0 ? 0 : 0), 0, z + 0.05]} rotation={Math.PI} role={i === 4 ? "patient" : "visitor"} pose="sit" seed={i * 3 + 1} />
      ))}
      <Person position={[-1.2, 0, 4.8]} role="child" seed={2} rotation={2} />
      <Person position={[0.4, 0, -3.6]} role="visitor" pose="walk" seed={9} rotation={Math.PI} />
      <Desk position={[w / 2 - 1.4, 0, d / 2 - 0.8]} rotation={Math.PI} w={2} />
      <Person position={[w / 2 - 1.4, 0, d / 2 - 0.1]} role="staff" seed={8} rotation={Math.PI} />
      <Plant position={[-w / 2 + 0.6, 0, d / 2 - 0.6]} scale={1.2} />
      <Plant position={[0, 0, d / 2 - 0.6]} />
    </>
  ),
  erbays: (w, d) => {
    const n = 6;
    const bay = (w - 2) / n;
    return (
      <>
        {range(n).map((i) => {
          const x = -w / 2 + 1 + bay * (i + 0.5);
          return (
            <group key={i}>
              <Stretcher position={[x, 0, d / 2 - 2.2]} occupant={i !== 3} seed={i * 5 + 2} />
              <Monitor position={[x + 0.7, 0, d / 2 - 0.6]} tall={1.6} />
              {i % 2 === 0 && <IVPole position={[x - 0.6, 0, d / 2 - 1.6]} />}
              {i < n - 1 && <Curtain position={[x + bay / 2, 0, d / 2 - 2.1]} rotation={Math.PI / 2} len={3.6} />}
              {i === 0 && <Person position={[x + 0.6, 0, d / 2 - 2.6]} role="doctor" pose="lean" seed={11} rotation={-Math.PI / 2} />}
              {i === 1 && <Person position={[x - 0.6, 0, d / 2 - 2.8]} role="nurse" seed={12} rotation={Math.PI / 2} />}
              {i === 2 && <Person position={[x + 0.55, 0, d / 2 - 2.0]} role="paramedic" pose="lean" seed={13} rotation={-Math.PI / 2} />}
              {i === 4 && <Person position={[x - 0.6, 0, d / 2 - 1.8]} role="doctor" seed={14} rotation={Math.PI / 2} />}
              {i === 5 && <Person position={[x + 0.6, 0, d / 2 - 3.0]} role="nurse" pose="lean" seed={15} rotation={-Math.PI / 2} />}
            </group>
          );
        })}
        {/* resus trolley rushing in (kept in central lane, leaving corridor clear) */}
        <Stretcher position={[-w / 2 + 3, 0, -1.6]} rotation={Math.PI / 2} occupant seed={21} />
        <Person position={[-w / 2 + 1.6, 0, -1.6]} role="paramedic" pose="walk" seed={22} rotation={Math.PI / 2} />
        <Person position={[-w / 2 + 3, 0, -2.3]} role="nurse" pose="walk" seed={23} rotation={Math.PI / 2} />
        <NursingStation position={[w / 2 - 3, 0, -2.0]} rotation={0} r={1.3} />
        <Person position={[w / 2 - 3, 0, -2.6]} role="nurse" seed={24} />
      </>
    );
  },
  diagnostics: (w, d) => (
    <>
      <CTScanner position={[-2, 0, 1.5]} rotation={Math.PI / 2} />
      <Person position={[-1.4, 0, 0.3]} role="staff" pose="lean" seed={31} rotation={-0.6} />
      {/* glazed control room */}
      <mesh position={[2.4, 1.2, 0.5]} material={MAT.glass}><boxGeometry args={[0.06, 2.4, d - 2]} /></mesh>
      <Desk position={[4.6, 0, 1.0]} rotation={-Math.PI / 2} w={2.4} />
      <Chair position={[4.0, 0, 1.0]} rotation={Math.PI / 2} />
      <Person position={[4.0, 0, 1.0]} rotation={Math.PI / 2} role="doctor" pose="sit" seed={32} />
      <XRay position={[5, 0, -2.6]} rotation={Math.PI / 2} />
      <Wheelchair position={[-5.5, 0, -2.6]} occupant seed={33} rotation={Math.PI / 2} />
      <Person position={[-6.3, 0, -2.6]} role="nurse" seed={34} rotation={Math.PI / 2} />
    </>
  ),
  bloodbank: (w, d) => (
    <>
      {spread(4, w - 3).map((x, i) => <BloodFridge key={i} position={[x, 0, d / 2 - 0.5]} rotation={Math.PI} />)}
      <LabBench position={[-2, 0, 0]} len={4} />
      <LabBench position={[3, 0, 0]} len={3.5} />
      <Person position={[-2.6, 0, -0.6]} role="staff" pose="lean" seed={41} />
      <Person position={[3.4, 0, -0.6]} role="doctor" seed={42} />
      <Desk position={[-w / 2 + 1.5, 0, -d / 2 + 1.2]} w={2} />
      <Person position={[-w / 2 + 1.5, 0, -d / 2 + 1.9]} role="staff" seed={43} rotation={Math.PI} />
    </>
  ),
  icu: (w, d) => {
    const n = 8;
    return (
      <>
        {range(n).map((i) => {
          const x = -w / 2 + 1.5 + ((w - 3) / (n - 1)) * i;
          return (
            <group key={i}>
              <Bed position={[x, 0, d / 2 - 1.5]} rotation={Math.PI} occupant seed={i * 3 + 50} blanket={MAT.blanketBlue} />
              <Ventilator position={[x - 0.85, 0, d / 2 - 0.7]} />
              <Monitor position={[x + 0.8, 0, d / 2 - 0.5]} tall={1.6} />
              <IVPole position={[x + 0.75, 0, d / 2 - 1.6]} />
              {i < n - 1 && (
                <mesh position={[x + (w - 3) / (n - 1) / 2, 1.1, d / 2 - 1.6]} material={MAT.glass}>
                  <boxGeometry args={[0.05, 2.2, 3]} />
                </mesh>
              )}
            </group>
          );
        })}
        <NursingStation position={[0, 0, -1.2]} rotation={Math.PI} r={2} />
        <Person position={[-0.6, 0, -0.4]} role="nurse" seed={61} rotation={Math.PI} />
        <Person position={[0.7, 0, -0.5]} role="nurse" seed={62} rotation={Math.PI - 0.3} />
        <Person position={[-w / 2 + 2.4, 0, d / 2 - 2.6]} role="doctor" pose="lean" seed={63} />
        <Person position={[w / 2 - 4, 0, d / 2 - 2.6]} role="nurse" pose="lean" seed={64} />
        <Person position={[-5, 0, -2.6]} role="doctor" pose="walk" seed={65} rotation={Math.PI / 2} />
      </>
    );
  },
  surgprep: (w, d) => (
    <>
      <Sink position={[-3, 0, d / 2 - 0.4]} rotation={Math.PI} />
      <Person position={[-3.4, 0, d / 2 - 1.1]} role="surgeon" pose="lean" seed={71} rotation={Math.PI} />
      <Person position={[-2.6, 0, d / 2 - 1.1]} role="surgeon" pose="lean" seed={72} rotation={Math.PI} />
      {spread(3, 6).map((x, i) => (
        <group key={i}>
          <Bed position={[x + 2, 0, -1.6]} rotation={Math.PI / 2} occupant={i !== 1} seed={i + 73} blanket={MAT.blanketTeal} />
          {i < 2 && <Curtain position={[x + 3.5, 0, -1.6]} rotation={Math.PI / 2} len={2.4} />}
        </group>
      ))}
      <Person position={[1, 0, -0.5]} role="nurse" seed={76} rotation={Math.PI} />
      <InstrumentTrolley position={[5.5, 0, 2.5]} />
    </>
  ),
  theatre: (w, d) => (
    <>
      {[-w / 4, w / 4].map((x, k) => (
        <group key={k} position={[x, 0, 0.3]}>
          <ORTable position={[0, 0, 0]} seed={80 + k} />
          <SurgicalLight position={[0, 2.5, 0]} />
          <AnaesthesiaMachine position={[0, 0, -1.6]} rotation={0} />
          <InstrumentTrolley position={[1.4, 0, 1.1]} rotation={Math.PI / 2} />
          <Monitor position={[-1.3, 0, -1.2]} tall={1.7} />
          <Person position={[-0.75, 0, 0.2]} role="surgeon" pose="lean" seed={82 + k} rotation={Math.PI / 2} />
          <Person position={[0.75, 0, 0.4]} role="surgeon" pose="lean" seed={84 + k} rotation={-Math.PI / 2} />
          <Person position={[0.4, 0, -1.4]} role="surgeon" seed={86 + k} rotation={Math.PI} />
          {k === 0 && <Person position={[1.5, 0, 1.8]} role="nurse" seed={88} rotation={-2.5} />}
        </group>
      ))}
      <mesh position={[0, 1.2, 0]} material={MAT.glass}><boxGeometry args={[0.06, 2.4, d - 1]} /></mesh>
    </>
  ),
  recovery: (w, d) => (
    <>
      {spread(4, w - 4).map((x, i) => (
        <group key={i}>
          <Bed position={[x, 0, d / 2 - 1.6]} rotation={Math.PI} occupant seed={i * 4 + 90} blanket={MAT.blanketTeal} />
          <Monitor position={[x + 0.85, 0, d / 2 - 0.6]} />
          <IVPole position={[x - 0.8, 0, d / 2 - 1.0]} />
          <Curtain position={[x + (w - 4) / 6, 0, d / 2 - 1.6]} rotation={Math.PI / 2} len={3} />
        </group>
      ))}
      <Desk position={[0, 0, -2.5]} w={2.4} />
      <Person position={[0, 0, -1.8]} role="nurse" pose="sit" seed={95} rotation={Math.PI} />
      <Chair position={[0, 0, -1.8]} rotation={Math.PI} />
      <Person position={[-4, 0, 1.2]} role="nurse" pose="lean" seed={96} />
    </>
  ),
  wardA: (w, d) => {
    // structured: two facing rows of 4 beds
    const xs = spread(4, w - 6);
    return (
      <>
        {xs.map((x, i) => (
          <group key={`b${i}`}>
            <Bed position={[x, 0, d / 2 - 1.3]} rotation={Math.PI} occupant={i !== 2} seed={i + 100} blanket={MAT.blanketBlue} />
            <BedsideTable position={[x + 0.8, 0, d / 2 - 0.4]} />
            <Curtain position={[x + (w - 6) / 6, 0, d / 2 - 1.4]} rotation={Math.PI / 2} len={2.6} />
            <Bed position={[x, 0, -d / 2 + 1.5]} rotation={0} occupant={i !== 0} seed={i + 110} blanket={MAT.blanketBlue} />
            <BedsideTable position={[x + 0.8, 0, -d / 2 + 0.6]} />
          </group>
        ))}
        <Chair position={[xs[1] - 0.9, 0, d / 2 - 1.2]} rotation={-Math.PI / 2} mat={MAT.fabricOrange} />
        <Person position={[xs[1] - 0.9, 0, d / 2 - 1.2]} rotation={Math.PI / 2} role="visitor" pose="sit" seed={120} />
        <Chair position={[xs[3] - 0.9, 0, -d / 2 + 1.6]} rotation={-Math.PI / 2} mat={MAT.fabricOrange} />
        <Person position={[xs[3] - 0.9, 0, -d / 2 + 1.6]} rotation={Math.PI / 2} role="visitor" pose="sit" seed={121} />
        <Person position={[xs[0] + 0.8, 0, d / 2 - 2.2]} role="nurse" pose="lean" seed={122} rotation={Math.PI} />
        <Person position={[xs[2], 0, 0.2]} role="doctor" pose="walk" seed={123} rotation={Math.PI / 2} />
        <IVPole position={[xs[3] - 0.7, 0, d / 2 - 0.7]} />
      </>
    );
  },
  wardB: (w, d) => {
    // different configuration: private twin rooms with partitions
    const rooms = 5;
    const rw = w / rooms;
    return (
      <>
        {range(rooms).map((r) => {
          const x = -w / 2 + rw * (r + 0.5);
          return (
            <group key={r} position={[x, 0, 0]}>
              {r < rooms - 1 && <mesh position={[rw / 2, 1.2, 1]} material={MAT.white} castShadow><boxGeometry args={[0.12, 2.4, d - 2]} /></mesh>}
              <Bed position={[-1.2, 0, d / 2 - 1.4]} rotation={Math.PI} occupant seed={130 + r} blanket={MAT.blanketYellow} />
              <Bed position={[1.4, 0, d / 2 - 1.4]} rotation={Math.PI} occupant={r % 2 === 0} seed={140 + r} blanket={MAT.blanketYellow} />
              <BedsideTable position={[0.1, 0, d / 2 - 0.4]} />
              <Curtain position={[0.1, 0, d / 2 - 1.5]} rotation={Math.PI / 2} len={2.4} mat={MAT.curtainPink} />
              <Chair position={[-2.1, 0, d / 2 - 2.4]} rotation={0.6} mat={MAT.fabricGreen} arm />
              {r % 2 === 1 && <Person position={[-2.1, 0, d / 2 - 2.4]} rotation={0.6 + Math.PI} role="visitor" pose="sit" seed={150 + r} />}
              {r === 2 && <Person position={[2.2, 0, d / 2 - 1.8]} role="nurse" pose="lean" seed={155} rotation={-Math.PI / 2} />}
              <Plant position={[rw / 2 - 0.5, 0, -d / 2 + 2.2]} scale={0.7} />
            </group>
          );
        })}
      </>
    );
  },
  daycare: (w, d) => (
    <>
      {range(2).map((row) =>
        spread(5, w - 4).map((x, i) => (
          <group key={`${row}${i}`} position={[x, 0, row ? d / 2 - 1.2 : -0.2]}>
            <Recliner rotation={row ? Math.PI : Math.PI} mat={(i + row) % 2 ? MAT.fabricTeal : MAT.fabricGreen} />
            {(i + row) % 3 !== 1 && <Person position={[0, 0.05, 0.05]} rotation={Math.PI} role="patient" pose="sit" seed={160 + i + row * 5} />}
            {i % 2 === 0 && <IVPole position={[0.65, 0, 0]} />}
          </group>
        )),
      )}
      <Person position={[-3, 0, 1.8]} role="nurse" pose="walk" seed={175} rotation={Math.PI / 2} />
      <Person position={[2.1, 0, -1.0]} role="nurse" pose="lean" seed={176} />
      <CoffeeTable position={[-w / 2 + 1.4, 0, -d / 2 + 1.2]} />
      <Plant position={[w / 2 - 0.6, 0, -d / 2 + 0.6]} />
    </>
  ),
  maternity: (w, d) => {
    const rooms = 4;
    const rw = (w - 4) / rooms;
    return (
      <>
        {range(rooms).map((r) => {
          const x = -w / 2 + rw * (r + 0.5);
          return (
            <group key={r} position={[x, 0, 0]}>
              <mesh position={[rw / 2, 1.2, 1.2]} material={MAT.white} castShadow><boxGeometry args={[0.12, 2.4, d - 2.4]} /></mesh>
              <Bed position={[0, 0, d / 2 - 1.4]} rotation={Math.PI} occupant seed={180 + r} blanket={MAT.blanketPink} />
              <Crib position={[1.1, 0, d / 2 - 1.2]} seed={r} />
              <Sofa position={[-1.5, 0, d / 2 - 2.6]} rotation={Math.PI / 2} len={1.4} mat={MAT.fabricOrange} />
              {r !== 2 && <Person position={[-1.35, 0.0, d / 2 - 2.6]} rotation={-Math.PI / 2} role="visitor" pose="sit" seed={185 + r} />}
              {r === 1 && <Person position={[0.9, 0, d / 2 - 2.4]} role="nurse" pose="lean" seed={189} rotation={Math.PI} />}
              <Monitor position={[-0.8, 0, d / 2 - 0.5]} tall={1.3} />
            </group>
          );
        })}
        <NursingStation position={[w / 2 - 2, 0, 0.5]} rotation={-Math.PI / 2} r={1.4} />
        <Person position={[w / 2 - 2.6, 0, 0.5]} role="nurse" seed={190} rotation={Math.PI / 2} />
        <Person position={[w / 2 - 1.5, 0, -2.8]} role="doctor" pose="walk" seed={191} rotation={Math.PI} />
      </>
    );
  },
  nicu: (w, d) => (
    <>
      {range(2).map((row) =>
        spread(4, w - 5).map((x, i) => (
          <group key={`${row}${i}`}>
            <Incubator position={[x, 0, row ? d / 2 - 1.2 : -0.6]} rotation={row ? Math.PI : 0} seed={i + row} />
            <Monitor position={[x + 0.7, 0, row ? d / 2 - 0.6 : -0.6]} tall={1.3} />
          </group>
        )),
      )}
      <Person position={[-2.2, 0, 1.4]} role="nurse" pose="lean" seed={200} />
      <Person position={[2, 0, 2.6]} role="doctor" seed={201} rotation={Math.PI} />
      <Recliner position={[w / 2 - 1, 0, 1.4]} rotation={-Math.PI / 2} mat={MAT.fabricOrange} />
      <Person position={[w / 2 - 1, 0.05, 1.4]} rotation={-Math.PI / 2} role="visitor" pose="sit" seed={202} />
    </>
  ),
  paediatrics: (w, d) => {
    const xs = spread(8, w - 14);
    const blankets = [MAT.blanketYellow, MAT.blanketPink, MAT.blanketTeal, MAT.blanketBlue];
    return (
      <>
        {xs.map((x, i) => (
          <group key={i}>
            <Bed position={[x, 0, d / 2 - 1.1]} rotation={Math.PI} small occupant={i % 4 !== 3} seed={210 + i} blanket={blankets[i % 4]} />
            <Chair position={[x + 0.85, 0, d / 2 - 1.5]} rotation={Math.PI} mat={MAT.fabricOrange} />
            {i % 2 === 0 && <Person position={[x + 0.85, 0, d / 2 - 1.5]} rotation={Math.PI} role="visitor" pose="sit" seed={220 + i} />}
          </group>
        ))}
        {/* play area */}
        <ToyBlocks position={[w / 2 - 4.5, 0, -0.5]} />
        <Person position={[w / 2 - 4.9, 0, -0.1]} role="child" seed={230} rotation={0.8} />
        <Person position={[w / 2 - 3.9, 0, -0.9]} role="child" seed={231} rotation={-2.2} />
        <Sofa position={[w / 2 - 1.2, 0, 1.5]} rotation={-Math.PI / 2} len={2.2} mat={MAT.fabricTeal} />
        <Person position={[w / 2 - 1.05, 0, 1.2]} rotation={-Math.PI / 2} role="visitor" pose="sit" seed={232} />
        <Person position={[w / 2 - 1.05, 0, 2.0]} rotation={-Math.PI / 2} role="visitor" pose="sit" seed={233} />
        <NursingStation position={[-w / 2 + 3, 0, -0.5]} rotation={Math.PI / 2} r={1.4} />
        <Person position={[-w / 2 + 2.4, 0, -0.5]} role="nurse" seed={234} rotation={-Math.PI / 2} />
        <Person position={[xs[2] + 0.5, 0, d / 2 - 2.3]} role="nurse" pose="lean" seed={235} rotation={Math.PI} />
        <Person position={[xs[5], 0, 0]} role="doctor" pose="walk" seed={236} rotation={-Math.PI / 2} />
      </>
    );
  },
};

