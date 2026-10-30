// Pure data: floors and departments of the ResQ Twin hospital. No React / three imports.
export type DeptKind =
  | "reception" | "waiting" | "erbays" | "diagnostics" | "bloodbank"
  | "icu" | "surgprep" | "theatre" | "recovery"
  | "wardA" | "wardB" | "daycare"
  | "maternity" | "paediatrics" | "nicu";

export interface Department {
  id: string;
  name: string;
  floor: number;
  kind: DeptKind;
  /** bounds in metres: x from x0..x1, z from z0..z1 */
  x0: number; x1: number; z0: number; z1: number;
  facilities: string[];
  beds?: number;
}

export interface Floor { index: number; code: string; name: string; subtitle: string }

export const FLOOR_HEIGHT = 4.2;
export const BUILDING = { w: 44, d: 26 }; // x: -22..22, z: -13..13
export const CORRIDOR = { z0: -1.6, z1: 1.6 };

export const FLOORS: Floor[] = [
  { index: 0, code: "GF", name: "Ground Floor", subtitle: "Emergency & Diagnostics" },
  { index: 1, code: "1F", name: "First Floor", subtitle: "ICU & Surgery" },
  { index: 2, code: "2F", name: "Second Floor", subtitle: "General Wards" },
  { index: 3, code: "3F", name: "Third Floor", subtitle: "Maternity & Paediatrics" },
];

const B = -12.6, F = 12.6, CB = CORRIDOR.z0, CF = CORRIDOR.z1;

export const DEPARTMENTS: Department[] = [
  // GF
  { id: "reception", name: "Emergency Reception & Triage", floor: 0, kind: "reception", x0: -21.6, x1: -8, z0: B, z1: CB, facilities: ["Triage desk", "Ambulance entrance", "Wheelchair bay"] },
  { id: "diagnostics", name: "Diagnostics — CT Suite", floor: 0, kind: "diagnostics", x0: -8, x1: 8, z0: B, z1: CB, facilities: ["CT scanner", "Control room", "Imaging prep"] },
  { id: "bloodbank", name: "Blood Bank", floor: 0, kind: "bloodbank", x0: 8, x1: 21.6, z0: B, z1: CB, facilities: ["Cold storage", "Cross-match lab", "Issue counter"] },
  { id: "waiting", name: "Waiting Area", floor: 0, kind: "waiting", x0: -21.6, x1: -6, z0: CF, z1: F, facilities: ["Seating", "Information point"] },
  { id: "erbays", name: "Emergency Treatment Bays", floor: 0, kind: "erbays", x0: -6, x1: 21.6, z0: CF, z1: F, facilities: ["Resus bays", "Stretchers", "Monitoring"], beds: 6 },
  // 1F
  { id: "icu", name: "High-Dependency ICU", floor: 1, kind: "icu", x0: -21.6, x1: 2, z0: CF, z1: F, facilities: ["Ventilators", "Infusion pumps", "Central nursing station"], beds: 8 },
  { id: "recovery", name: "Post-Op Recovery", floor: 1, kind: "recovery", x0: 2, x1: 21.6, z0: CF, z1: F, facilities: ["Recovery beds", "Monitoring"], beds: 4 },
  { id: "surgprep", name: "Surgical Preparation", floor: 1, kind: "surgprep", x0: -21.6, x1: -6, z0: B, z1: CB, facilities: ["Scrub sinks", "Pre-op bays"] },
  { id: "theatre", name: "Operating Theatre", floor: 1, kind: "theatre", x0: -6, x1: 21.6, z0: B, z1: CB, facilities: ["2 operating tables", "Surgical lights", "Anaesthesia"] },
  // 2F
  { id: "wardA", name: "General Ward A", floor: 2, kind: "wardA", x0: -21.6, x1: 2, z0: CF, z1: F, facilities: ["Bay layout", "Privacy curtains"], beds: 8 },
  { id: "wardB", name: "General Ward B", floor: 2, kind: "wardB", x0: -21.6, x1: 21.6, z0: B, z1: CB, facilities: ["Twin rooms", "Visitor seating"], beds: 6 },
  { id: "daycare", name: "Day Care", floor: 2, kind: "daycare", x0: 2, x1: 21.6, z0: CF, z1: F, facilities: ["Recliner chairs", "Infusion stations"] },
  // 3F
  { id: "maternity", name: "Maternity Ward", floor: 3, kind: "maternity", x0: -21.6, x1: 4, z0: B, z1: CB, facilities: ["Private rooms", "Labour beds", "Nursing station"], beds: 4 },
  { id: "nicu", name: "Neonatal Support (NICU)", floor: 3, kind: "nicu", x0: 4, x1: 21.6, z0: B, z1: CB, facilities: ["Incubators", "Neonatal monitors"] },
  { id: "paediatrics", name: "Paediatric Ward", floor: 3, kind: "paediatrics", x0: -21.6, x1: 21.6, z0: CF, z1: F, facilities: ["Child beds", "Play area", "Family seating"], beds: 8 },
];

export const deptsOnFloor = (f: number) => DEPARTMENTS.filter((d) => d.floor === f);
