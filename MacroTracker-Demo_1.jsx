import { useState, useEffect, useRef } from "react";

// ── MOCK DATA ────────────────────────────────────────────────────────────────
const MOCK_FOODS = [
  { name: "Milanesa con papas fritas", calories: 680, protein: 38, carbs: 52, fats: 31 },
  { name: "Ensalada César con pollo", calories: 420, protein: 34, carbs: 18, fats: 24 },
  { name: "Tazón de avena con frutas", calories: 310, protein: 12, carbs: 54, fats: 6 },
  { name: "Salmón a la plancha con arroz", calories: 520, protein: 46, carbs: 38, fats: 14 },
  { name: "Pizza margarita (2 porciones)", calories: 580, protein: 22, carbs: 74, fats: 20 },
  { name: "Wrap de pollo y palta", calories: 450, protein: 30, carbs: 42, fats: 16 },
  { name: "Yogur griego con granola", calories: 280, protein: 18, carbs: 32, fats: 7 },
  { name: "Hamburguesa casera", calories: 720, protein: 42, carbs: 48, fats: 36 },
  { name: "Smoothie de banana y proteína", calories: 340, protein: 28, carbs: 44, fats: 5 },
  { name: "Revuelto de huevos con tostadas", calories: 390, protein: 24, carbs: 28, fats: 18 },
];

const DEMO_HISTORY = [
  { ...MOCK_FOODS[2], id: 1, date: "26/4 08:30" },
  { ...MOCK_FOODS[5], id: 2, date: "26/4 13:00" },
];

const GOALS = { calories: 2500, protein: 150, carbs: 250, fats: 70 };
const MACRO_CONFIG = [
  { key: "calories", label: "Calorías", unit: "kcal", color: "#f97316", goal: GOALS.calories, emoji: "🔥" },
  { key: "protein",  label: "Proteínas", unit: "g",   color: "#38bdf8", goal: GOALS.protein,  emoji: "💪" },
  { key: "carbs",    label: "Carbos",    unit: "g",   color: "#a78bfa", goal: GOALS.carbs,    emoji: "🌾" },
  { key: "fats",     label: "Grasas",    unit: "g",   color: "#fb7185", goal: GOALS.fats,     emoji: "🥑" },
];

const STORAGE_KEY = "macro_demo_v1";

// ── HELPERS ──────────────────────────────────────────────────────────────────
function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

function getMockResult() {
  return MOCK_FOODS[Math.floor(Math.random() * MOCK_FOODS.length)];
}

// ── SUB-COMPONENTS ────────────────────────────────────────────────────────────
function ProgressBar({ value, max, color }) {
  const pct = Math.min(100, (value / max) * 100);
  return (
    <div style={{ height: 5, background: "#1e1b2e", borderRadius: 99, overflow: "hidden", marginTop: 6 }}>
      <div style={{
        height: "100%", width: `${pct}%`, background: color,
        borderRadius: 99, transition: "width 1s cubic-bezier(.4,0,.2,1)",
        boxShadow: `0 0 10px ${color}99`,
      }} />
    </div>
  );
}

function MacroCard({ label, unit, color, value, goal, emoji }) {
  return (
    <div style={{
      background: "linear-gradient(145deg, #13111f, #1a1728)",
      border: "1px solid #2d2a42",
      borderRadius: 18,
      padding: "16px 18px",
      position: "relative",
      overflow: "hidden",
    }}>
      <div style={{ position: "absolute", top: -10, right: -6, fontSize: 44, opacity: 0.08 }}>{emoji}</div>
      <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", color: "#6b6987", textTransform: "uppercase", marginBottom: 6 }}>
        {label}
      </div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
        <span style={{ fontSize: 26, fontWeight: 800, color: "#f0eeff", fontVariantNumeric: "tabular-nums" }}>{value}</span>
        <span style={{ fontSize: 12, color: "#6b6987" }}>{unit}</span>
      </div>
      <ProgressBar value={value} max={goal} color={color} />
      <div style={{ fontSize: 10, color: "#4e4b66", marginTop: 5 }}>
        {Math.round((value/goal)*100)}% · meta {goal}{unit}
      </div>
    </div>
  );
}

function AnalysisCard({ label, unit, color, value, goal, emoji }) {
  return (
    <div style={{
      background: "#13111f",
      border: `1px solid ${color}44`,
      borderRadius: 18,
      padding: "16px 18px",
      position: "relative",
      overflow: "hidden",
      boxShadow: `0 4px 20px ${color}20`,
    }}>
      <div style={{ position: "absolute", top: -10, right: -6, fontSize: 44, opacity: 0.1 }}>{emoji}</div>
      <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", color, textTransform: "uppercase", marginBottom: 6 }}>
        {label}
      </div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
        <span style={{ fontSize: 26, fontWeight: 800, color: "#f0eeff", fontVariantNumeric: "tabular-nums" }}>{value}</span>
        <span style={{ fontSize: 12, color: "#6b6987" }}>{unit}</span>
      </div>
      <ProgressBar value={value} max={goal} color={color} />
    </div>
  );
}

// Animated typing dots
function ThinkingDots() {
  return (
    <span style={{ display: "inline-flex", gap: 3, alignItems: "center" }}>
      {[0,1,2].map(i => (
        <span key={i} style={{
          width: 6, height: 6, borderRadius: "50%", background: "#a78bfa",
          animation: "bounce 1.2s infinite",
          animationDelay: `${i * 0.2}s`,
          display: "inline-block",
        }} />
      ))}
    </span>
  );
}

// ── MAIN APP ──────────────────────────────────────────────────────────────────
export default function MacroTrackerDemo() {
  const [view, setView] = useState("home"); // home | scan | history
  const [history, setHistory] = useState(DEMO_HISTORY);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState(null);
  const [saved, setSaved] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);
  const [analyzeStep, setAnalyzeStep] = useState(0); // 0=idle 1=upload 2=detect 3=calc 4=done
  const fileRef = useRef(null);

  useEffect(() => {
    (async () => {
      try {
        const raw = await window.storage.get(STORAGE_KEY);
        if (raw) setHistory(JSON.parse(raw.value));
      } catch (_) {}
    })();
  }, []);

  const persist = async (h) => {
    try { await window.storage.set(STORAGE_KEY, JSON.stringify(h)); } catch (_) {}
  };

  const handleFile = (file) => {
    if (!file?.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = (e) => setImagePreview(e.target.result);
    reader.readAsDataURL(file);
    setResult(null);
    setSaved(false);
  };

  const runAnalysis = async () => {
    setIsAnalyzing(true);
    setAnalyzeStep(1);
    await sleep(800);
    setAnalyzeStep(2);
    await sleep(900);
    setAnalyzeStep(3);
    await sleep(700);
    setAnalyzeStep(4);
    const mock = getMockResult();
    setResult(mock);
    setIsAnalyzing(false);
  };

  const saveResult = async () => {
    if (!result) return;
    const item = {
      ...result,
      id: Date.now(),
      date: new Date().toLocaleString("es-AR", { dateStyle: "short", timeStyle: "short" }),
    };
    const newH = [item, ...history];
    setHistory(newH);
    await persist(newH);
    setSaved(true);
    setTimeout(() => {
      setResult(null);
      setImagePreview(null);
      setSaved(false);
      setAnalyzeStep(0);
      setView("home");
    }, 1000);
  };

  const deleteItem = async (id) => {
    const newH = history.filter(h => h.id !== id);
    setHistory(newH);
    await persist(newH);
  };

  const totals = history.reduce(
    (acc, item) => ({
      calories: acc.calories + (item.calories || 0),
      protein:  acc.protein  + (item.protein  || 0),
      carbs:    acc.carbs    + (item.carbs    || 0),
      fats:     acc.fats     + (item.fats     || 0),
    }),
    { calories: 0, protein: 0, carbs: 0, fats: 0 }
  );

  const STEP_LABELS = ["", "Subiendo imagen...", "Detectando ingredientes...", "Calculando macros...", "¡Listo!"];

  // ── RENDER ──────────────────────────────────────────────────────────────────
  return (
    <div style={{
      minHeight: "100vh",
      maxWidth: 430,
      margin: "0 auto",
      background: "#0e0c1a",
      color: "#f0eeff",
      fontFamily: "'Outfit', 'Segoe UI', sans-serif",
      display: "flex",
      flexDirection: "column",
      position: "relative",
      overflow: "hidden",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800;900&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        @keyframes bounce { 0%,80%,100%{transform:scale(0)} 40%{transform:scale(1)} }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeUp { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
        @keyframes shimmer { 0%{background-position:-200% 0} 100%{background-position:200% 0} }
        .fadeup { animation: fadeUp 0.35s ease forwards; }
        .tab-btn { transition: all 0.2s; }
        .tab-btn:active { transform: scale(0.94); }
        ::-webkit-scrollbar { width: 0; }
      `}</style>

      {/* BG glow */}
      <div style={{
        position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0,
        background: "radial-gradient(ellipse 60% 40% at 50% -10%, #4c1d9520, transparent)",
      }} />

      {/* STATUS BAR mock */}
      <div style={{
        height: 44, display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0 20px", flexShrink: 0, position: "relative", zIndex: 2,
      }}>
        <span style={{ fontSize: 13, fontWeight: 700 }}>9:41</span>
        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          <span style={{ fontSize: 12 }}>●●●</span>
          <span style={{ fontSize: 12 }}>WiFi</span>
          <span style={{ fontSize: 12 }}>🔋</span>
        </div>
      </div>

      {/* ── HOME VIEW ── */}
      {view === "home" && (
        <div style={{ flex: 1, overflowY: "auto", padding: "0 20px 100px", position: "relative", zIndex: 1 }}>
          {/* Header */}
          <div style={{ marginBottom: 24, paddingTop: 4 }}>
            <div style={{ fontSize: 12, color: "#6b6987", fontWeight: 600, marginBottom: 2 }}>
              Domingo, 26 de abril
            </div>
            <div style={{ fontSize: 26, fontWeight: 900, letterSpacing: "-0.02em" }}>
              Buen día 👋
            </div>
            <div style={{ fontSize: 14, color: "#6b6987", marginTop: 2 }}>
              Modo demo — datos simulados
            </div>
          </div>

          {/* Calorie ring summary */}
          <div style={{
            background: "linear-gradient(135deg, #1e1b2e, #16132a)",
            border: "1px solid #2d2a42",
            borderRadius: 24,
            padding: "22px 20px",
            marginBottom: 16,
            display: "flex",
            alignItems: "center",
            gap: 20,
          }}>
            <div style={{ position: "relative", flexShrink: 0 }}>
              <svg width={90} height={90} style={{ transform: "rotate(-90deg)" }}>
                <circle cx={45} cy={45} r={36} fill="none" stroke="#1e1b2e" strokeWidth={8} />
                <circle cx={45} cy={45} r={36} fill="none" stroke="#f97316" strokeWidth={8}
                  strokeDasharray={2 * Math.PI * 36}
                  strokeDashoffset={2 * Math.PI * 36 * (1 - Math.min(1, totals.calories / GOALS.calories))}
                  strokeLinecap="round"
                  style={{ transition: "stroke-dashoffset 1s cubic-bezier(.4,0,.2,1)" }}
                />
              </svg>
              <div style={{
                position: "absolute", inset: 0, display: "flex", flexDirection: "column",
                alignItems: "center", justifyContent: "center",
              }}>
                <div style={{ fontSize: 18, fontWeight: 900, lineHeight: 1, color: "#f0eeff" }}>{totals.calories}</div>
                <div style={{ fontSize: 9, color: "#6b6987", fontWeight: 600 }}>kcal</div>
              </div>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 800, fontSize: 15, marginBottom: 12 }}>Consumo hoy</div>
              {MACRO_CONFIG.slice(1).map(m => (
                <div key={m.key} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: m.color, flexShrink: 0 }} />
                  <div style={{ fontSize: 12, color: "#a09ec0", flex: 1 }}>{m.label}</div>
                  <div style={{ fontSize: 13, fontWeight: 700 }}>{totals[m.key]}<span style={{ fontSize: 10, color: "#6b6987", fontWeight: 400 }}>g</span></div>
                </div>
              ))}
            </div>
          </div>

          {/* Macro grid */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 }}>
            {MACRO_CONFIG.map(m => (
              <MacroCard key={m.key} {...m} value={totals[m.key]} />
            ))}
          </div>

          {/* Recent meals */}
          <div style={{ marginBottom: 8 }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", color: "#6b6987", textTransform: "uppercase", marginBottom: 12 }}>
              Últimas comidas
            </div>
            {history.length === 0 ? (
              <div style={{ textAlign: "center", color: "#3d3a54", fontSize: 13, padding: "24px 0" }}>
                Todavía no guardaste ninguna comida.
              </div>
            ) : (
              history.slice(0, 4).map(item => (
                <div key={item.id} style={{
                  background: "#13111f",
                  border: "1px solid #2d2a42",
                  borderRadius: 16,
                  padding: "14px 16px",
                  marginBottom: 10,
                  display: "flex",
                  alignItems: "center",
                  gap: 14,
                }}>
                  <div style={{
                    width: 44, height: 44, borderRadius: 12,
                    background: "linear-gradient(135deg, #2d2a42, #1e1b2e)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 22, flexShrink: 0,
                  }}>🍽️</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 14, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {item.name}
                    </div>
                    <div style={{ fontSize: 12, color: "#6b6987", marginTop: 2 }}>
                      {item.date} · <span style={{ color: "#f97316" }}>{item.calories} kcal</span>
                    </div>
                  </div>
                  <button
                    onClick={() => deleteItem(item.id)}
                    style={{ background: "none", border: "none", color: "#3d3a54", fontSize: 18, cursor: "pointer", padding: 4 }}
                  >×</button>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ── SCAN VIEW ── */}
      {view === "scan" && (
        <div style={{ flex: 1, overflowY: "auto", padding: "8px 20px 100px", position: "relative", zIndex: 1 }}>
          <div style={{ fontSize: 22, fontWeight: 900, letterSpacing: "-0.02em", marginBottom: 6 }}>
            Analizar comida
          </div>
          <div style={{ fontSize: 13, color: "#6b6987", marginBottom: 22 }}>
            Modo demo: simula el análisis de IA
          </div>

          {/* Upload area */}
          <div
            onClick={() => !isAnalyzing && !result && fileRef.current?.click()}
            style={{
              background: imagePreview ? "transparent" : "#13111f",
              border: imagePreview ? "none" : "2px dashed #2d2a42",
              borderRadius: 24,
              minHeight: imagePreview ? 0 : 200,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              cursor: imagePreview ? "default" : "pointer",
              marginBottom: 20,
              overflow: "hidden",
              transition: "border-color 0.2s",
              padding: imagePreview ? 0 : 32,
            }}
          >
            {imagePreview ? (
              <img src={imagePreview} alt="" style={{ width: "100%", borderRadius: 24, maxHeight: 260, objectFit: "cover" }} />
            ) : (
              <>
                <div style={{ fontSize: 48, marginBottom: 12 }}>📷</div>
                <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 6 }}>Subí una foto</div>
                <div style={{ fontSize: 13, color: "#6b6987", textAlign: "center" }}>
                  En modo demo, la IA simulará la detección
                </div>
              </>
            )}
          </div>

          <input ref={fileRef} type="file" accept="image/*" onChange={e => handleFile(e.target.files?.[0])} style={{ display: "none" }} />

          {/* Analysis steps */}
          {isAnalyzing && (
            <div className="fadeup" style={{
              background: "#13111f", border: "1px solid #2d2a42",
              borderRadius: 20, padding: "20px 22px", marginBottom: 20,
            }}>
              <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ width: 18, height: 18, border: "2px solid #a78bfa40", borderTopColor: "#a78bfa", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
                Analizando...
              </div>
              {[
                { label: "Subiendo imagen", step: 1 },
                { label: "Detectando ingredientes", step: 2 },
                { label: "Calculando macros", step: 3 },
              ].map(({ label, step }) => (
                <div key={step} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                  <div style={{
                    width: 20, height: 20, borderRadius: "50%", flexShrink: 0,
                    background: analyzeStep > step ? "#22c55e" : analyzeStep === step ? "#a78bfa" : "#2d2a42",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 11, transition: "background 0.3s",
                  }}>
                    {analyzeStep > step ? "✓" : analyzeStep === step ? <ThinkingDots /> : ""}
                  </div>
                  <span style={{ fontSize: 13, color: analyzeStep >= step ? "#f0eeff" : "#6b6987", transition: "color 0.3s" }}>
                    {label}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Result */}
          {result && !isAnalyzing && (
            <div className="fadeup">
              <div style={{
                background: "linear-gradient(135deg, #13111f, #1a1728)",
                border: "1px solid #a78bfa44",
                borderRadius: 20, padding: "18px 20px", marginBottom: 16,
                boxShadow: "0 8px 32px #a78bfa18",
              }}>
                <div style={{ fontSize: 11, color: "#a78bfa", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 4 }}>
                  ✨ Detectado
                </div>
                <div style={{ fontSize: 20, fontWeight: 900 }}>{result.name}</div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 }}>
                {MACRO_CONFIG.map(m => (
                  <AnalysisCard key={m.key} {...m} value={result[m.key]} />
                ))}
              </div>

              <div style={{ display: "flex", gap: 10 }}>
                <button
                  onClick={() => { setResult(null); setImagePreview(null); setAnalyzeStep(0); }}
                  style={{
                    flex: 1, background: "#1e1b2e", border: "1px solid #2d2a42",
                    color: "#a09ec0", borderRadius: 14, padding: "14px", fontSize: 14,
                    fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
                  }}
                >
                  Reintentar
                </button>
                <button
                  onClick={saveResult}
                  disabled={saved}
                  style={{
                    flex: 2,
                    background: saved ? "#16a34a" : "linear-gradient(135deg, #a78bfa, #7c3aed)",
                    border: "none", color: "#fff",
                    borderRadius: 14, padding: "14px", fontSize: 14,
                    fontWeight: 800, cursor: saved ? "default" : "pointer", fontFamily: "inherit",
                    boxShadow: saved ? "none" : "0 4px 20px #a78bfa40",
                    transition: "all 0.3s",
                  }}
                >
                  {saved ? "✓ Guardado" : "💾 Guardar al historial"}
                </button>
              </div>
            </div>
          )}

          {/* CTA when image loaded but not analyzed */}
          {imagePreview && !isAnalyzing && !result && (
            <div className="fadeup" style={{ display: "flex", gap: 10 }}>
              <button
                onClick={() => { setImagePreview(null); }}
                style={{
                  flex: 1, background: "#1e1b2e", border: "1px solid #2d2a42",
                  color: "#a09ec0", borderRadius: 14, padding: "14px", fontSize: 14,
                  fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
                }}
              >
                Cambiar
              </button>
              <button
                onClick={runAnalysis}
                style={{
                  flex: 2,
                  background: "linear-gradient(135deg, #a78bfa, #7c3aed)",
                  border: "none", color: "#fff",
                  borderRadius: 14, padding: "14px", fontSize: 15,
                  fontWeight: 800, cursor: "pointer", fontFamily: "inherit",
                  boxShadow: "0 4px 20px #a78bfa40",
                }}
              >
                🔬 Analizar con IA
              </button>
            </div>
          )}

          {/* CTA when no image */}
          {!imagePreview && !isAnalyzing && !result && (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <button
                onClick={() => fileRef.current?.click()}
                style={{
                  background: "linear-gradient(135deg, #a78bfa, #7c3aed)",
                  border: "none", color: "#fff",
                  borderRadius: 14, padding: "16px", fontSize: 15,
                  fontWeight: 800, cursor: "pointer", fontFamily: "inherit",
                  boxShadow: "0 4px 20px #a78bfa40",
                }}
              >
                📷 Seleccionar foto
              </button>
              <button
                onClick={() => { setImagePreview("demo"); runAnalysis(); }}
                style={{
                  background: "#1e1b2e", border: "1px solid #2d2a42",
                  color: "#a09ec0", borderRadius: 14, padding: "14px", fontSize: 14,
                  fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
                }}
              >
                ⚡ Probar sin foto (demo rápida)
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── HISTORY VIEW ── */}
      {view === "history" && (
        <div style={{ flex: 1, overflowY: "auto", padding: "8px 20px 100px", position: "relative", zIndex: 1 }}>
          <div style={{ fontSize: 22, fontWeight: 900, letterSpacing: "-0.02em", marginBottom: 4 }}>Historial</div>
          <div style={{ fontSize: 13, color: "#6b6987", marginBottom: 22 }}>{history.length} comidas registradas</div>

          {history.length === 0 ? (
            <div style={{ textAlign: "center", padding: "60px 20px", color: "#3d3a54" }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>🗂️</div>
              <div style={{ fontSize: 16, fontWeight: 700 }}>Sin registros todavía</div>
              <div style={{ fontSize: 13, marginTop: 6 }}>Analizá tu primera comida</div>
            </div>
          ) : (
            <>
              {/* Summary card */}
              <div style={{
                background: "#13111f", border: "1px solid #2d2a42",
                borderRadius: 20, padding: "18px 20px", marginBottom: 16,
              }}>
                <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", color: "#6b6987", textTransform: "uppercase", marginBottom: 14 }}>
                  Total acumulado
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  {MACRO_CONFIG.map(m => (
                    <div key={m.key} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <div style={{ width: 8, height: 8, borderRadius: "50%", background: m.color }} />
                      <div>
                        <div style={{ fontSize: 10, color: "#6b6987" }}>{m.label}</div>
                        <div style={{ fontSize: 16, fontWeight: 800, color: m.color }}>
                          {totals[m.key]}<span style={{ fontSize: 10, color: "#6b6987", fontWeight: 400 }}>{m.unit}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {history.map((item, i) => (
                <div key={item.id} className="fadeup" style={{
                  background: "#13111f", border: "1px solid #2d2a42",
                  borderRadius: 18, padding: "14px 16px", marginBottom: 10,
                  animationDelay: `${i * 0.05}s`,
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10 }}>
                    <div style={{
                      width: 42, height: 42, borderRadius: 12,
                      background: "#1e1b2e",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 20,
                    }}>🍽️</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: 14, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {item.name}
                      </div>
                      <div style={{ fontSize: 11, color: "#6b6987", marginTop: 2 }}>{item.date}</div>
                    </div>
                    <button
                      onClick={() => deleteItem(item.id)}
                      style={{ background: "none", border: "none", color: "#3d3a54", fontSize: 18, cursor: "pointer" }}
                    >×</button>
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    {MACRO_CONFIG.map(m => (
                      <div key={m.key} style={{ flex: 1, textAlign: "center" }}>
                        <div style={{ fontSize: 14, fontWeight: 800, color: m.color }}>{item[m.key]}</div>
                        <div style={{ fontSize: 9, color: "#6b6987", textTransform: "uppercase", letterSpacing: "0.05em" }}>{m.unit}</div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      )}

      {/* ── BOTTOM NAV ── */}
      <nav style={{
        position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)",
        width: "100%", maxWidth: 430,
        background: "#0e0c1aee",
        backdropFilter: "blur(20px)",
        borderTop: "1px solid #2d2a42",
        display: "flex",
        padding: "10px 24px 20px",
        gap: 8,
        zIndex: 100,
      }}>
        {[
          { id: "home", emoji: "🏠", label: "Inicio" },
          { id: "scan", emoji: "📸", label: "Analizar" },
          { id: "history", emoji: "📋", label: "Historial" },
        ].map(tab => (
          <button
            key={tab.id}
            className="tab-btn"
            onClick={() => setView(tab.id)}
            style={{
              flex: 1, background: view === tab.id ? "#1e1b2e" : "transparent",
              border: view === tab.id ? "1px solid #2d2a42" : "1px solid transparent",
              borderRadius: 14, padding: "10px 8px",
              display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
              cursor: "pointer",
            }}
          >
            <span style={{ fontSize: 20 }}>{tab.emoji}</span>
            <span style={{
              fontSize: 11, fontWeight: 700, fontFamily: "inherit",
              color: view === tab.id ? "#f0eeff" : "#6b6987",
              transition: "color 0.2s",
            }}>
              {tab.label}
            </span>
          </button>
        ))}
      </nav>
    </div>
  );
}
