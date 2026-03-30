/*
 * DESIGN: Next Generation Brand — Black / White / Yellow #F8EA34 / Soft Grey #ECE5E5
 * TONE: Empowering, candidate-first. "Know your worth" not "your employer underpays you."
 * FONTS: Syne (headings, bold) + Inter (body, clean)
 * LAYOUT: High-contrast editorial. Yellow as power accent on black. White cards on grey bg.
 */

import { useState, useCallback, useEffect, useRef } from "react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend,
} from "recharts";

// ─── Brand tokens ─────────────────────────────────────────────────────────────
const NG = {
  black:   "#0A0A0A",
  white:   "#FFFFFF",
  yellow:  "#F8EA34",
  grey:    "#ECE5E5",
  greyMid: "#C8BFBF",
  greyDk:  "#6B6363",
  greyBg:  "#F5F2F2",
};

// ─── Calculation engine ───────────────────────────────────────────────────────
interface CalcInputs {
  currentSalary: number;
  careerHorizon: number;   // renamed from "years to project"
  internalRaise: number;
  jobHopRaise: number;
  switchEvery: number;
}

interface YearData {
  year: number;
  mover: number;
  stayer: number;
  gap: number;
}

function calculatePaths(inputs: CalcInputs): YearData[] {
  const { currentSalary, careerHorizon, internalRaise, jobHopRaise, switchEvery } = inputs;
  const data: YearData[] = [];
  let stayer = currentSalary;
  let mover  = currentSalary;

  for (let y = 0; y <= careerHorizon; y++) {
    data.push({ year: y, mover: Math.round(mover), stayer: Math.round(stayer), gap: Math.round(mover - stayer) });
    stayer = stayer * (1 + internalRaise / 100);
    mover  = mover  * (1 + internalRaise / 100);
    if ((y + 1) % switchEvery === 0 && y + 1 <= careerHorizon) {
      mover = mover * (1 + jobHopRaise / 100);
    }
  }
  return data;
}

function fmt(n: number, compact = false): string {
  if (compact && n >= 1000) return "€" + (n / 1000).toFixed(0) + "k";
  return "€" + n.toLocaleString("en-IE", { maximumFractionDigits: 0 });
}

// ─── Animated counter ─────────────────────────────────────────────────────────
function useAnimatedValue(target: number, duration = 650) {
  const [display, setDisplay] = useState(target);
  const prev = useRef(target);
  const frame = useRef<number>(0);
  useEffect(() => {
    const start = prev.current, end = target, t0 = performance.now();
    cancelAnimationFrame(frame.current);
    const tick = (now: number) => {
      const p = Math.min((now - t0) / duration, 1);
      const e = 1 - Math.pow(1 - p, 3);
      setDisplay(Math.round(start + (end - start) * e));
      if (p < 1) frame.current = requestAnimationFrame(tick);
      else prev.current = end;
    };
    frame.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame.current);
  }, [target, duration]);
  return display;
}

// ─── Slider ───────────────────────────────────────────────────────────────────
function Slider({
  label, sublabel, value, min, max, step, format, onChange, hint,
}: {
  label: string; sublabel?: string; value: number; min: number; max: number;
  step: number; format: (v: number) => string; onChange: (v: number) => void; hint?: string;
}) {
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <div className="mb-7">
      <div className="flex items-start justify-between mb-2 gap-2">
        <div>
          <label className="text-xs font-semibold uppercase tracking-widest" style={{ color: NG.greyDk, letterSpacing: "0.09em" }}>
            {label}
          </label>
          {sublabel && <p className="text-xs mt-0.5" style={{ color: NG.greyMid }}>{sublabel}</p>}
        </div>
        <span className="font-display text-2xl font-bold shrink-0" style={{ fontFamily: "'Syne', sans-serif", color: NG.black }}>
          {format(value)}
        </span>
      </div>
      <input
        type="range" min={min} max={max} step={step} value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{
          background: `linear-gradient(to right, ${NG.black} ${pct}%, ${NG.grey} ${pct}%)`,
        }}
      />
      <div className="flex justify-between mt-1.5">
        <span className="text-xs" style={{ color: NG.greyMid }}>{format(min)}</span>
        <span className="text-xs" style={{ color: NG.greyMid }}>{format(max)}</span>
      </div>
      {hint && (
        <p className="text-xs mt-1.5 flex items-start gap-1.5" style={{ color: NG.greyDk }}>
          <span style={{ color: NG.yellow, background: NG.black, borderRadius: "50%", width: 14, height: 14, display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 9, fontWeight: 700, flexShrink: 0, marginTop: 1 }}>i</span>
          {hint}
        </p>
      )}
    </div>
  );
}

// ─── Custom chart tooltip ─────────────────────────────────────────────────────
function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  const mover  = payload.find((p: any) => p.dataKey === "mover");
  const stayer = payload.find((p: any) => p.dataKey === "stayer");
  return (
    <div className="card-white rounded-lg p-3 text-sm" style={{ minWidth: 190, boxShadow: "0 4px 20px rgba(0,0,0,0.12)" }}>
      <p className="font-semibold mb-2 text-xs uppercase tracking-widest" style={{ color: NG.greyDk }}>Year {label}</p>
      {mover && (
        <div className="flex justify-between gap-4 mb-1">
          <span className="flex items-center gap-1.5">
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: NG.black, display: "inline-block" }} />
            <span style={{ color: NG.black, fontWeight: 500 }}>Career Mover</span>
          </span>
          <span className="font-bold" style={{ fontFamily: "'Syne', sans-serif", color: NG.black }}>{fmt(mover.value)}</span>
        </div>
      )}
      {stayer && (
        <div className="flex justify-between gap-4 mb-1">
          <span className="flex items-center gap-1.5">
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: NG.greyMid, display: "inline-block" }} />
            <span style={{ color: NG.greyDk, fontWeight: 500 }}>Career Stayer</span>
          </span>
          <span className="font-bold" style={{ fontFamily: "'Syne', sans-serif", color: NG.greyDk }}>{fmt(stayer.value)}</span>
        </div>
      )}
      {mover && stayer && (
        <div className="mt-2 pt-2 flex justify-between gap-4" style={{ borderTop: `1px solid ${NG.grey}` }}>
          <span style={{ color: NG.black, fontWeight: 600 }}>Salary advantage</span>
          <span className="font-bold" style={{ fontFamily: "'Syne', sans-serif", color: NG.black, background: NG.yellow, padding: "1px 6px", borderRadius: 4 }}>
            +{fmt(mover.value - stayer.value)}
          </span>
        </div>
      )}
    </div>
  );
}

// ─── Big result card ──────────────────────────────────────────────────────────
function ResultCard({ label, value, sub, variant = "white" }: {
  label: string; value: string; sub?: string; variant?: "white" | "black" | "yellow";
}) {
  const bg   = variant === "black" ? NG.black : variant === "yellow" ? NG.yellow : NG.white;
  const fg   = variant === "black" ? NG.white : NG.black;
  const sfg  = variant === "black" ? NG.greyMid : NG.greyDk;
  return (
    <div className="rounded-xl p-5 flex flex-col gap-1 card-white" style={{ background: bg, border: `1px solid ${variant === "white" ? NG.grey : "transparent"}` }}>
      <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: sfg, letterSpacing: "0.09em" }}>{label}</p>
      <p className="text-3xl font-bold leading-none mt-1" style={{ fontFamily: "'Syne', sans-serif", color: fg }}>{value}</p>
      {sub && <p className="text-xs mt-1" style={{ color: sfg }}>{sub}</p>}
    </div>
  );
}

// ─── Pros / Cons data ─────────────────────────────────────────────────────────
const prosConsMover = [
  { pro: true,  text: "Immediate salary uplift — typically 10–20% on each move" },
  { pro: true,  text: "Exposure to new industries, tools, and leadership styles" },
  { pro: true,  text: "Faster progression to senior roles by demonstrating versatility" },
  { pro: true,  text: "Stronger negotiating position — you always know your market rate" },
  { pro: false, text: "May miss out on long-term incentives (share options, pension matching)" },
  { pro: false, text: "Requires effort: job searching, interviews, onboarding repeatedly" },
  { pro: false, text: "Some hiring managers still view frequent moves with caution" },
  { pro: false, text: "Loss of institutional knowledge and internal relationships" },
];

const prosConsStayer = [
  { pro: true,  text: "Deep institutional knowledge and strong internal relationships" },
  { pro: true,  text: "Potential access to long-term incentives, share schemes, and tenure bonuses" },
  { pro: true,  text: "Psychological stability — no repeated onboarding or uncertainty" },
  { pro: true,  text: "Opportunity to grow into leadership within a known environment" },
  { pro: false, text: "Annual raises typically average just 3–3.5% — often below inflation" },
  { pro: false, text: "In 83% of high-paying roles, tenured staff earn the same or less than new hires" },
  { pro: false, text: "Skills can narrow without exposure to different organisations" },
  { pro: false, text: "Salary compression: your value to the market grows faster than your pay" },
];

// ─── Research stat row ────────────────────────────────────────────────────────
function ResearchRow({ stat, text, source }: { stat: string; text: string; source: string }) {
  return (
    <div className="flex gap-5 py-5" style={{ borderBottom: `1px solid ${NG.grey}` }}>
      <div className="shrink-0 w-20 text-right">
        <span className="text-2xl font-bold" style={{ fontFamily: "'Syne', sans-serif", color: NG.black }}>{stat}</span>
      </div>
      <div>
        <p className="text-sm font-medium leading-snug" style={{ color: NG.black }}>{text}</p>
        <p className="text-xs mt-1" style={{ color: NG.greyDk }}>{source}</p>
      </div>
    </div>
  );
}

// ─── LinkedIn post text ───────────────────────────────────────────────────────
const linkedinPost = `Do you know what your skills are worth in today's market?

Most professionals don't — and that gap in knowledge can cost more than you'd expect.

Here's what the research actually shows:

📊 The average annual raise at the same company: 3%
📊 The average salary increase when moving to a new role: 10–20%
📊 Over a 10-year career, that compounding difference becomes significant

The data is clear:

→ Professionals who moved roles saw 6.4% pay growth vs 4.5% for those who stayed (ADP Research, 2026)
→ 60% of people who changed jobs saw real earnings increases, vs 47% of those who stayed put (Pew Research, 2022)
→ In 83% of senior roles (€125k+), long-serving employees earn the same as — or less than — newly hired colleagues (WorldatWork / Syndio, 2023)
→ Career movers saw 35% salary growth over 3 years vs ~18% for those who stayed (ResumeLab, 2024)

This isn't about loyalty vs disloyalty. It's about understanding how compensation actually works — and making informed decisions about your career.

There are genuine reasons to stay in a role: culture, leadership, long-term incentives, career growth. And there are genuine reasons to move. The key is making that decision with full information.

I've built a free calculator that shows you exactly what your career trajectory looks like under both scenarios — personalised to your salary and goals.

👇 Are you a career mover or a career stayer? What's driven your decisions?

#Careers #Salary #CareerGrowth #JobSearch #Recruitment`;

// ─── Main component ───────────────────────────────────────────────────────────
export default function Home() {
  const [inputs, setInputs] = useState<CalcInputs>({
    currentSalary: 50000,
    careerHorizon: 15,
    internalRaise: 3,
    jobHopRaise: 15,
    switchEvery: 3,
  });
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<"mover" | "stayer">("mover");

  const update = useCallback((key: keyof CalcInputs) => (v: number) =>
    setInputs(prev => ({ ...prev, [key]: v })), []);

  const data = calculatePaths(inputs);
  const final = data[data.length - 1];
  const cumMover  = data.reduce((s, d) => s + d.mover,  0);
  const cumStayer = data.reduce((s, d) => s + d.stayer, 0);
  const cumGap    = cumMover - cumStayer;

  const animGap      = useAnimatedValue(final.gap);
  const animCumGap   = useAnimatedValue(cumGap);
  const animMover    = useAnimatedValue(final.mover);
  const animStayer   = useAnimatedValue(final.stayer);

  const handleCopy = () => {
    navigator.clipboard.writeText(linkedinPost).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  };

  return (
    <div className="min-h-screen" style={{ background: NG.greyBg }}>

      {/* ── NAV ── */}
      <nav style={{ background: NG.black, borderBottom: `3px solid ${NG.yellow}` }}>
        <div className="container flex items-center justify-between py-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xl font-bold" style={{ fontFamily: "'Syne', sans-serif", color: NG.white }}>
                Next<span style={{ color: NG.yellow }}>Generation</span>
              </span>
            </div>
          </div>
          <a
            href="mailto:enquiries@nextgeneration.ie"
            className="text-xs font-semibold uppercase tracking-widest px-4 py-2 rounded transition-all hover:opacity-80"
            style={{ background: NG.yellow, color: NG.black, letterSpacing: "0.08em" }}>
            Send Your CV
          </a>
        </div>
      </nav>

      {/* ── HERO ── */}
      <header style={{ background: NG.black, backgroundImage: "url('https://d2xsxph8kpxj0f.cloudfront.net/310519663319729584/g8taHRwHbLKm8TGQz2syPA/ng-hero-bg-SwiGa9oifvwaTe8xY6ZUb2.webp')", backgroundSize: "cover", backgroundPosition: "center right" }} className="relative overflow-hidden">
        {/* Yellow accent bar */}
        <div className="absolute left-0 top-0 bottom-0 w-1.5" style={{ background: NG.yellow }} />

        <div className="container py-16 md:py-24 pl-8 md:pl-12">
          <div className="max-w-2xl">
            <span className="badge-yellow mb-5 inline-flex">Know Your Market Value</span>

            <h1 className="text-5xl md:text-6xl font-bold leading-tight mb-5"
              style={{ fontFamily: "'Syne', sans-serif", color: NG.white }}>
              What Is Your Career<br />
              <span style={{ color: NG.yellow }}>Really Worth?</span>
            </h1>

            <p className="text-base md:text-lg leading-relaxed mb-8 max-w-xl"
              style={{ color: "#B0ABAB", fontFamily: "'Inter', sans-serif" }}>
              Understanding your market value is one of the most empowering things a professional can do.
              This tool shows you what your salary trajectory looks like — whether you stay or move —
              using real data from the world's leading labour market research.
            </p>

            <div className="flex flex-wrap gap-4">
              <a href="#calculator"
                className="inline-flex items-center gap-2 px-6 py-3 rounded font-semibold text-sm transition-all hover:opacity-90 active:scale-95"
                style={{ background: NG.yellow, color: NG.black, fontFamily: "'Syne', sans-serif" }}>
                Calculate My Value
                <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path d="M12 5v14M5 12l7 7 7-7" />
                </svg>
              </a>
              <a href="mailto:enquiries@nextgeneration.ie"
                className="inline-flex items-center gap-2 px-6 py-3 rounded font-semibold text-sm transition-all hover:opacity-80"
                style={{ background: "transparent", color: NG.white, border: `1px solid #444`, fontFamily: "'Syne', sans-serif" }}>
                Talk to a Consultant
              </a>
            </div>
          </div>
        </div>

        {/* Stats strip */}
        <div style={{ background: NG.yellow, borderTop: `1px solid rgba(0,0,0,0.08)` }} className="py-5">
          <div className="container">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
              {[
                { stat: "35%",    label: "More salary growth for career movers over 3 years", src: "ResumeLab 2024" },
                { stat: "6.4%",   label: "Pay growth for movers vs 4.5% for stayers", src: "ADP Research 2026" },
                { stat: "83%",    label: "Of senior roles: tenured staff earn same or less than new hires", src: "WorldatWork 2023" },
                { stat: "10–20%", label: "Typical salary increase when moving to a new role", src: "Industry consensus" },
              ].map(item => (
                <div key={item.stat} className="flex flex-col">
                  <span className="text-3xl font-bold leading-none" style={{ fontFamily: "'Syne', sans-serif", color: NG.black }}>{item.stat}</span>
                  <span className="text-xs mt-1 leading-snug font-medium" style={{ color: "#3A3A3A" }}>{item.label}</span>
                  <span className="text-xs mt-0.5 opacity-60" style={{ color: NG.black }}>{item.src}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </header>

      {/* ── CALCULATOR ── */}
      <section id="calculator" className="py-16 md:py-24">
        <div className="container">
          <div className="mb-10 max-w-2xl">
            <span className="badge-yellow mb-4 inline-flex">Interactive Calculator</span>
            <h2 className="text-3xl md:text-4xl font-bold mb-3" style={{ fontFamily: "'Syne', sans-serif", color: NG.black }}>
              Model Your Salary Trajectory
            </h2>
            <p className="text-base leading-relaxed" style={{ color: NG.greyDk }}>
              Adjust the sliders below to reflect your own situation. The calculator compares two scenarios side by side:
              staying in your current role with annual merit increases, versus strategically moving every few years.
              All defaults are based on published research data.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-start">

            {/* ── Controls ── */}
            <div className="lg:col-span-2 card-white rounded-2xl p-6 md:p-8">
              <div className="flex items-center gap-2 mb-6">
                <div className="w-1 h-5 rounded-full" style={{ background: NG.yellow }} />
                <h3 className="text-xs font-bold uppercase tracking-widest" style={{ color: NG.greyDk, letterSpacing: "0.1em" }}>
                  Your Details
                </h3>
              </div>

              <Slider
                label="Current Annual Salary"
                sublabel="Your current gross salary"
                value={inputs.currentSalary}
                min={20000} max={200000} step={1000}
                format={v => fmt(v)}
                onChange={update("currentSalary")}
              />

              <Slider
                label="Planning Horizon"
                sublabel="How many years ahead do you want to see?"
                value={inputs.careerHorizon}
                min={5} max={30} step={1}
                format={v => `${v} years`}
                onChange={update("careerHorizon")}
                hint="Most people plan 10–15 years ahead. The longer the horizon, the more dramatic the compounding effect."
              />

              <Slider
                label="Annual Raise (Same Role)"
                sublabel="Typical merit increase staying put"
                value={inputs.internalRaise}
                min={1} max={8} step={0.5}
                format={v => `${v}%`}
                onChange={update("internalRaise")}
                hint="The Irish/UK average merit raise is 3–3.5% per year (WorldatWork 2026). Adjust if your sector differs."
              />

              <Slider
                label="Salary Increase When Moving"
                sublabel="Typical uplift on accepting a new role"
                value={inputs.jobHopRaise}
                min={5} max={30} step={1}
                format={v => `${v}%`}
                onChange={update("jobHopRaise")}
                hint="Research shows 10–20% is the typical market premium when moving. Conservative movers use 10%; ambitious movers use 15–20%."
              />

              <Slider
                label="How Often You'd Consider Moving"
                sublabel="Years between career moves"
                value={inputs.switchEvery}
                min={2} max={6} step={1}
                format={v => v === 1 ? "Every year" : `Every ${v} years`}
                onChange={update("switchEvery")}
                hint="Most research points to 2–3 years as the sweet spot — long enough to deliver value, short enough to stay ahead of salary compression."
              />

              {/* Research note */}
              <div className="rounded-lg p-3 mt-2" style={{ background: NG.grey }}>
                <p className="text-xs leading-relaxed" style={{ color: NG.greyDk }}>
                  <strong style={{ color: NG.black }}>Note:</strong> These are illustrative projections based on published averages.
                  Individual outcomes depend on industry, role level, location, and negotiation skill.
                  Speak to a Next Generation consultant for a personalised market assessment.
                </p>
              </div>
            </div>

            {/* ── Results ── */}
            <div className="lg:col-span-3 flex flex-col gap-5">

              {/* Result cards */}
              <div className="grid grid-cols-2 gap-4">
                <ResultCard
                  label={`Career Mover at Year ${inputs.careerHorizon}`}
                  value={fmt(animMover)}
                  sub="annual salary as a strategic mover"
                  variant="black"
                />
                <ResultCard
                  label={`Career Stayer at Year ${inputs.careerHorizon}`}
                  value={fmt(animStayer)}
                  sub="annual salary staying in current role"
                  variant="white"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <ResultCard
                  label="Annual Salary Advantage"
                  value={`+${fmt(animGap)}`}
                  sub={`per year more by year ${inputs.careerHorizon}`}
                  variant="yellow"
                />
                <ResultCard
                  label={`Total Earnings Difference`}
                  value={`+${fmt(animCumGap)}`}
                  sub={`cumulative over ${inputs.careerHorizon} years`}
                  variant="white"
                />
              </div>

              {/* Chart */}
              <div className="card-white rounded-2xl p-6">
                <div className="flex items-center gap-2 mb-5">
                  <div className="w-1 h-5 rounded-full" style={{ background: NG.yellow }} />
                  <h3 className="text-xs font-bold uppercase tracking-widest" style={{ color: NG.greyDk, letterSpacing: "0.1em" }}>
                    Salary Trajectory Comparison
                  </h3>
                </div>
                <ResponsiveContainer width="100%" height={280}>
                  <AreaChart data={data} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
                    <defs>
                      <linearGradient id="moverGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor={NG.black} stopOpacity={0.15} />
                        <stop offset="95%" stopColor={NG.black} stopOpacity={0.01} />
                      </linearGradient>
                      <linearGradient id="stayerGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor={NG.greyMid} stopOpacity={0.25} />
                        <stop offset="95%" stopColor={NG.greyMid} stopOpacity={0.01} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke={NG.grey} vertical={false} />
                    <XAxis
                      dataKey="year"
                      tick={{ fontSize: 11, fill: NG.greyDk, fontFamily: "'Inter', sans-serif" }}
                      tickLine={false} axisLine={false}
                      label={{ value: "Year", position: "insideBottom", offset: -2, fontSize: 11, fill: NG.greyDk }}
                    />
                    <YAxis
                      tickFormatter={v => fmt(v, true)}
                      tick={{ fontSize: 11, fill: NG.greyDk, fontFamily: "'Syne', sans-serif" }}
                      tickLine={false} axisLine={false} width={58}
                    />
                    <Tooltip content={<ChartTooltip />} />
                    <Legend
                      wrapperStyle={{ fontSize: "12px", fontFamily: "'Inter', sans-serif", paddingTop: "12px" }}
                      formatter={(value) => (
                        <span style={{ color: NG.black, fontWeight: 500 }}>{value}</span>
                      )}
                    />
                    <Area
                      type="monotone" dataKey="mover" name="Career Mover"
                      stroke={NG.black} strokeWidth={2.5}
                      fill="url(#moverGrad)" dot={false}
                      activeDot={{ r: 5, fill: NG.black, stroke: NG.yellow, strokeWidth: 2 }}
                    />
                    <Area
                      type="monotone" dataKey="stayer" name="Career Stayer"
                      stroke={NG.greyMid} strokeWidth={2} strokeDasharray="5 4"
                      fill="url(#stayerGrad)" dot={false}
                      activeDot={{ r: 5, fill: NG.greyMid }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {/* Insight callout */}
              <div className="rounded-xl px-5 py-4 flex items-start gap-3"
                style={{ background: NG.yellow, border: `1px solid rgba(0,0,0,0.08)` }}>
                <span className="text-lg mt-0.5">💡</span>
                <p className="text-sm font-medium leading-relaxed" style={{ color: NG.black }}>
                  Based on your inputs, a strategic career mover would earn{" "}
                  <strong>{fmt(cumGap)}</strong> more in total over {inputs.careerHorizon} years
                  — and <strong>{fmt(final.gap)}</strong> more per year by year {inputs.careerHorizon}.
                  That's the power of understanding your market value.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── PROS & CONS ── */}
      <section className="py-16 md:py-20" style={{ background: NG.black }}>
        <div className="container">
          <div className="mb-10 max-w-2xl">
            <span className="badge-yellow mb-4 inline-flex">Balanced Perspective</span>
            <h2 className="text-3xl md:text-4xl font-bold mb-3" style={{ fontFamily: "'Syne', sans-serif", color: NG.white }}>
              Staying vs Moving:<br />The Full Picture
            </h2>
            <p className="text-base leading-relaxed" style={{ color: "#B0ABAB" }}>
              There is no universally right answer. The best career decision depends on your goals,
              your sector, and your personal circumstances. Here is an honest assessment of both paths.
            </p>
          </div>

          {/* Tab toggle */}
          <div className="flex gap-2 mb-8">
            {(["mover", "stayer"] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className="px-5 py-2.5 rounded text-sm font-semibold transition-all"
                style={{
                  fontFamily: "'Syne', sans-serif",
                  background: activeTab === tab ? NG.yellow : "transparent",
                  color: activeTab === tab ? NG.black : "#888",
                  border: `1px solid ${activeTab === tab ? NG.yellow : "#333"}`,
                }}>
                {tab === "mover" ? "Career Mover" : "Career Stayer"}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl">
            {(activeTab === "mover" ? prosConsMover : prosConsStayer).map((item, i) => (
              <div key={i} className="flex items-start gap-3 rounded-xl p-4"
                style={{ background: item.pro ? "rgba(248,234,52,0.08)" : "rgba(255,255,255,0.04)", border: `1px solid ${item.pro ? "rgba(248,234,52,0.2)" : "rgba(255,255,255,0.08)"}` }}>
                <div className="shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold mt-0.5"
                  style={{ background: item.pro ? NG.yellow : "#333", color: item.pro ? NG.black : "#888" }}>
                  {item.pro ? "✓" : "–"}
                </div>
                <p className="text-sm leading-relaxed" style={{ color: item.pro ? NG.white : "#999" }}>{item.text}</p>
              </div>
            ))}
          </div>

          <div className="mt-8 p-5 rounded-xl max-w-4xl" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}>
            <p className="text-sm leading-relaxed" style={{ color: "#B0ABAB" }}>
              <strong style={{ color: NG.white }}>The key insight:</strong> The decision to stay or move should never be made on salary alone.
              Culture, leadership quality, career trajectory, work-life balance, and long-term incentives all matter.
              What this calculator helps you do is ensure that if you <em>do</em> choose to stay, it is a fully informed choice —
              not a default driven by inertia.
            </p>
          </div>
        </div>
      </section>

      {/* ── RESEARCH ── */}
      <section className="py-16 md:py-20" style={{ background: NG.greyBg }}>
        <div className="container max-w-4xl">
          <div className="mb-10">
            <span className="badge-yellow mb-4 inline-flex">The Evidence</span>
            <h2 className="text-3xl md:text-4xl font-bold mb-3" style={{ fontFamily: "'Syne', sans-serif", color: NG.black }}>
              What the Research Shows
            </h2>
            <p className="text-base leading-relaxed" style={{ color: NG.greyDk }}>
              Every figure in this calculator is grounded in peer-reviewed research, government labour market data,
              and large-scale employer surveys. Here are the key findings.
            </p>
          </div>

          <div className="card-white rounded-2xl p-6 md:p-8">
            <ResearchRow
              stat="6.4%"
              text="Pay growth for professionals who moved roles in January 2026, compared to 4.5% for those who stayed — a gap that has persisted consistently since 2020."
              source="ADP Research Institute, January 2026"
            />
            <ResearchRow
              stat="60%"
              text="Of workers who changed jobs saw real (inflation-adjusted) earnings increases, versus only 47% of those who stayed in their roles over the same period."
              source="Pew Research Center, July 2022 — analysis of US Bureau of Labor Statistics data"
            />
            <ResearchRow
              stat="83%"
              text="Of high-paying job groups (average salary €125,000+) where long-serving employees earn the same as or less than newly hired colleagues. In 30% of cases, they earn less."
              source="WorldatWork / Syndio analysis of 48 organisations, April 2023"
            />
            <ResearchRow
              stat="35%"
              text="Salary growth seen by career movers over a three-year period — nearly double the approximately 18% growth seen by those who remained with the same employer."
              source="ResumeLab / Forbes, 2024"
            />
            <ResearchRow
              stat="3–3.5%"
              text="The median annual merit raise at the same company in 2025–2026. In many years this has been at or below inflation, meaning the real purchasing power of a loyal employee's salary can decline."
              source="WorldatWork Salary Budget Survey 2025–2026; Pave Compensation Report 2026"
            />
            <div className="pt-5">
              <ResearchRow
                stat="10–20%"
                text="The typical salary increase when moving to a new employer — the standard market premium for bringing your skills and experience to a new organisation."
                source="ADP Research, ResumeLab, LinkedIn Talent Blog, Indeed — industry consensus"
              />
            </div>
          </div>

          {/* Context note */}
          <div className="mt-5 p-5 rounded-xl" style={{ background: NG.grey, border: `1px solid ${NG.greyMid}` }}>
            <p className="text-sm leading-relaxed" style={{ color: NG.greyDk }}>
              <strong style={{ color: NG.black }}>Important context:</strong> The salary premium for moving has narrowed since its 2022 peak,
              when movers saw ~14% growth versus ~6% for stayers. As of early 2026, the gap is smaller but persistent.
              The compounding effect over a full career remains substantial regardless of short-term market fluctuations.
              Individual results will vary significantly by industry, seniority, and geography.
            </p>
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="py-16 md:py-20" style={{ background: NG.white }}>
        <div className="container max-w-4xl">
          <div className="mb-10">
            <span className="badge-yellow mb-4 inline-flex">Understanding the Maths</span>
            <h2 className="text-3xl md:text-4xl font-bold mb-3" style={{ fontFamily: "'Syne', sans-serif", color: NG.black }}>
              Why the Gap Grows Over Time
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                n: "01",
                title: "Salary Compression",
                body: "Companies can approve a new hire offer in a single day. Securing a meaningful raise for an existing employee requires a full budget cycle, management sign-off, and typically still averages just 3%. The process is structurally slower for insiders — this is called salary compression.",
              },
              {
                n: "02",
                title: "The Compounding Effect",
                body: "A 15% salary jump at year three doesn't just give you 15% more that year — every subsequent raise is calculated on a higher base. Over 15 years, the difference between a 3% annual raise and a 15% jump every three years is not linear. It is exponential.",
              },
              {
                n: "03",
                title: "Market vs. Internal Pricing",
                body: "External candidates negotiate against current market rates. Internal employees negotiate against their last salary. These are fundamentally different starting points — and the market anchor is almost always higher for professionals with in-demand skills.",
              },
            ].map(item => (
              <div key={item.n} className="rounded-2xl p-6" style={{ background: NG.greyBg, border: `1px solid ${NG.grey}` }}>
                <div className="text-5xl font-bold mb-4 leading-none" style={{ fontFamily: "'Syne', sans-serif", color: NG.grey }}>
                  {item.n}
                </div>
                <h3 className="font-bold text-base mb-2" style={{ fontFamily: "'Syne', sans-serif", color: NG.black }}>{item.title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: NG.greyDk }}>{item.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA BAND ── */}
      <section style={{ background: NG.yellow }} className="py-14">
        <div className="container max-w-4xl">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold mb-3" style={{ fontFamily: "'Syne', sans-serif", color: NG.black }}>
                Considering Your Next Move?
              </h2>
              <p className="text-base leading-relaxed max-w-lg" style={{ color: "#3A3A3A" }}>
                Our consultants have deep knowledge of current market rates across your sector.
                Whether you are actively looking or simply curious about your options, we would love to have a confidential conversation.
              </p>
            </div>
            <div className="flex flex-col gap-3 shrink-0">
              <a
                href="mailto:enquiries@nextgeneration.ie"
                className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded font-bold text-sm transition-all hover:opacity-85 active:scale-95"
                style={{ background: NG.black, color: NG.white, fontFamily: "'Syne', sans-serif", whiteSpace: "nowrap" }}>
                Send Us Your CV
                <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </a>
              <p className="text-xs text-center" style={{ color: "#5A5A5A" }}>enquiries@nextgeneration.ie</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── LINKEDIN POST ── */}
      <section className="py-16 md:py-20" style={{ background: NG.greyBg }}>
        <div className="container max-w-3xl">
          <div className="mb-8">
            <span className="badge-yellow mb-4 inline-flex">Ready to Share</span>
            <h2 className="text-3xl md:text-4xl font-bold mb-3" style={{ fontFamily: "'Syne', sans-serif", color: NG.black }}>
              LinkedIn Post — Copy &amp; Paste
            </h2>
            <p className="text-base leading-relaxed" style={{ color: NG.greyDk }}>
              Written to perform natively on LinkedIn — empowering tone, data-led, no external links,
              and a question at the end to drive comments and reach.
            </p>
          </div>

          <div className="card-white rounded-2xl overflow-hidden">
            {/* Post header */}
            <div className="flex items-center justify-between px-6 py-4" style={{ background: NG.black, borderBottom: `3px solid ${NG.yellow}` }}>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded flex items-center justify-center font-bold text-sm"
                  style={{ background: NG.yellow, color: NG.black, fontFamily: "'Syne', sans-serif" }}>
                  NG
                </div>
                <div>
                  <p className="text-sm font-semibold" style={{ color: NG.white }}>LinkedIn Post</p>
                  <p className="text-xs" style={{ color: "#888" }}>Optimised for native reach — no links needed</p>
                </div>
              </div>
              <button
                onClick={handleCopy}
                className="flex items-center gap-2 px-4 py-2 rounded text-xs font-semibold transition-all active:scale-95"
                style={{
                  background: copied ? NG.yellow : "rgba(248,234,52,0.12)",
                  color: copied ? NG.black : NG.yellow,
                  border: `1px solid ${copied ? NG.yellow : "rgba(248,234,52,0.3)"}`,
                  fontFamily: "'Syne', sans-serif",
                }}>
                {copied ? (
                  <><svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M20 6L9 17l-5-5" /></svg>Copied!</>
                ) : (
                  <><svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" /></svg>Copy Post</>
                )}
              </button>
            </div>

            {/* Post body */}
            <div className="p-6 md:p-8">
              <pre className="whitespace-pre-wrap text-sm leading-relaxed"
                style={{ color: NG.black, fontFamily: "'Inter', sans-serif" }}>
                {linkedinPost}
              </pre>
            </div>
          </div>

          {/* Tips */}
          <div className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { icon: "📌", title: "No External Links", body: "LinkedIn's 2026 algorithm reduces reach by ~60% for posts with external links. This post is 100% native — share the calculator URL in comments after engagement builds." },
              { icon: "📊", title: "Data-Led Hook", body: "Opens with a universal question, backs it with four specific research sources. Credibility drives saves and shares — the metrics LinkedIn rewards most." },
              { icon: "💬", title: "Drives Comments", body: "Ends with a direct, personal question. Comments are the single most powerful signal to LinkedIn's algorithm for wider distribution." },
            ].map(tip => (
              <div key={tip.title} className="card-white rounded-xl p-4">
                <div className="text-xl mb-2">{tip.icon}</div>
                <h4 className="text-xs font-bold mb-1 uppercase tracking-wide" style={{ fontFamily: "'Syne', sans-serif", color: NG.black }}>{tip.title}</h4>
                <p className="text-xs leading-relaxed" style={{ color: NG.greyDk }}>{tip.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ background: NG.black, borderTop: `3px solid ${NG.yellow}` }} className="py-10">
        <div className="container flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <p className="text-lg font-bold mb-1" style={{ fontFamily: "'Syne', sans-serif", color: NG.white }}>
              Next<span style={{ color: NG.yellow }}>Generation</span>
            </p>
            <p className="text-xs" style={{ color: "#666" }}>
              Data sources: ADP Research Institute · Atlanta Fed Wage Growth Tracker · Pew Research Center · WorldatWork / Syndio · ResumeLab · Pave · Lightcast
            </p>
          </div>
          <div className="text-right">
            <a href="mailto:enquiries@nextgeneration.ie" className="text-sm font-medium hover:opacity-80 transition-opacity"
              style={{ color: NG.yellow }}>
              enquiries@nextgeneration.ie
            </a>
            <p className="text-xs mt-1" style={{ color: "#555" }}>
              For illustrative purposes only. Individual results vary by sector, role, and market conditions.
            </p>
          </div>
        </div>
      </footer>

    </div>
  );
}
