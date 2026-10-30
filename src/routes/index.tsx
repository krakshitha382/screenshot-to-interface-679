import { createFileRoute } from "@tanstack/react-router";
import { lazy, Suspense, useState } from "react";
import { DEPARTMENTS, FLOORS, deptsOnFloor } from "@/lib/hospital-data";

const HospitalScene = lazy(() => import("@/components/hospital/HospitalScene"));

export const Route = createFileRoute("/")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "ResQ Twin — Hospital Digital Twin" },
      { name: "description", content: "Interactive 3D cutaway of a four-floor hospital: emergency, ICU, wards, maternity and paediatrics." },
      { property: "og:title", content: "ResQ Twin — Hospital Digital Twin" },
      { property: "og:description", content: "Explore every floor and department of a modern hospital in an interactive 3D cutaway." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  const [focusFloor, setFocusFloor] = useState<number | null>(null);
  const [selectedDept, setSelectedDept] = useState<string | null>(null);
  const [hidden, setHidden] = useState<boolean[]>([false, false, false, false]);
  const [exploded, setExploded] = useState(false);
  const [cameraKey, setCameraKey] = useState(0);
  const dept = DEPARTMENTS.find((d) => d.id === selectedDept) ?? null;

  const selectDept = (id: string | null) => {
    setSelectedDept(id);
    if (id) setFocusFloor(DEPARTMENTS.find((d) => d.id === id)!.floor);
  };

  return (
    <main className="twin-shell">
      <Suspense fallback={<div className="twin-loading">Loading hospital model…</div>}>
        <HospitalScene
          focusFloor={focusFloor}
          selectedDept={selectedDept}
          hidden={hidden}
          exploded={exploded}
          onSelectDept={selectDept}
          cameraKey={cameraKey}
        />
      </Suspense>

      <header className="twin-header">
        <div className="twin-brand">
          <svg viewBox="0 0 40 20" className="h-5 w-10" aria-hidden>
            <path d="M0 10h10l3-7 5 14 4-10 3 3h15" fill="none" stroke="currentColor" strokeWidth="2" />
          </svg>
          <span>ResQ <b>Twin</b></span>
        </div>
        <span className="twin-chip">Hospital View · 3D cutaway</span>
      </header>

      <nav className="twin-floors" aria-label="Floors">
        {[...FLOORS].reverse().map((f) => (
          <div key={f.index} className={`floor-btn ${focusFloor === f.index ? "is-active" : ""}`}>
            <button className="floor-btn__main" onClick={() => { setSelectedDept(null); setFocusFloor(focusFloor === f.index ? null : f.index); }}>
              <span className="floor-btn__code">{f.code}</span>
              <span className="floor-btn__text">
                <span>{f.subtitle}</span>
                <small>{deptsOnFloor(f.index).length} departments</small>
              </span>
            </button>
            <button
              className={`floor-btn__eye ${hidden[f.index] ? "is-off" : ""}`}
              aria-label={hidden[f.index] ? `Show ${f.code}` : `Hide ${f.code}`}
              onClick={() => setHidden((h) => h.map((v, i) => (i === f.index ? !v : v)))}
            >
              {hidden[f.index] ? "○" : "●"}
            </button>
          </div>
        ))}
        <button className="twin-action" onClick={() => { setFocusFloor(null); setSelectedDept(null); setCameraKey((k) => k + 1); }}>
          Whole building
        </button>
        <button className={`twin-action ${exploded ? "is-on" : ""}`} onClick={() => setExploded((e) => !e)}>
          {exploded ? "Stack floors" : "Separate floors"}
        </button>
      </nav>

      {focusFloor !== null && (
        <div className="twin-depts">
          {deptsOnFloor(focusFloor).map((d) => (
            <button key={d.id} className={`dept-pill ${selectedDept === d.id ? "is-active" : ""}`} onClick={() => selectDept(d.id)}>
              {d.name}
            </button>
          ))}
        </div>
      )}

      {dept && (
        <aside className="twin-panel">
          <div className="twin-panel__head">
            <div>
              <small>{FLOORS[dept.floor]?.code} · {FLOORS[dept.floor]?.subtitle}</small>
              <h2>{dept.name}</h2>
            </div>
            <button aria-label="Close" onClick={() => setSelectedDept(null)}>×</button>
          </div>
          {dept.beds && <p className="twin-panel__stat"><span>Beds modelled</span><b>{dept.beds}</b></p>}
          <h3>Facilities</h3>
          <ul>{dept.facilities.map((f) => <li key={f}>{f}</li>)}</ul>
          <p className="twin-panel__note">Visual model only — no live hospital data.</p>
        </aside>
      )}

      <p className="twin-hint">Drag to orbit · scroll to zoom · click a room to inspect</p>
    </main>
  );
}
