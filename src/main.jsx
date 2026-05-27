import React, { useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  Activity,
  BarChart3,
  CircleDot,
  Gauge,
  Maximize2,
  Moon,
  Orbit,
  PanelRightClose,
  PanelRightOpen,
  Palette,
  RotateCcw,
  Sun,
  Timer,
  Zap,
} from 'lucide-react';
import './styles.css';

const PALETTES = {
  ember: {
    name: 'Ember',
    accent: '#d96c4a',
    focus: '#7aa27a',
    align: '#5d87a8',
    gold: '#c6a255',
    bg: '#f6f4ef',
  },
  tide: {
    name: 'Tide',
    accent: '#2f88a7',
    focus: '#74a891',
    align: '#b7824e',
    gold: '#c8a856',
    bg: '#f3f7f6',
  },
  plum: {
    name: 'Plum',
    accent: '#9358a8',
    focus: '#668f6c',
    align: '#c17d55',
    gold: '#d0aa53',
    bg: '#f7f3f6',
  },
  graphite: {
    name: 'Graphite',
    accent: '#4f6b7a',
    focus: '#927953',
    align: '#6d8f79',
    gold: '#b99a52',
    bg: '#f4f3ef',
  },
};

const HOURS = [
  'sleep','sleep','sleep','sleep','sleep','sleep',
  'move','plan','admin','deep','deep','deep',
  'break','admin','learn','learn','deep','deep',
  'create','create','break','review','admin','sleep',
];

const WEEK = [
  { day: 'Mon', focus: 6.4, deep: 3.8, align: 62 },
  { day: 'Tue', focus: 7.9, deep: 5.2, align: 81 },
  { day: 'Wed', focus: 5.2, deep: 2.4, align: 48 },
  { day: 'Thu', focus: 8.6, deep: 6.0, align: 88 },
  { day: 'Fri', focus: 7.0, deep: 4.4, align: 71 },
  { day: 'Sat', focus: 7.2, deep: 4.8, align: 78 },
  { day: 'Sun', focus: 3.8, deep: 1.6, align: 42 },
];

const GOALS = [
  { label: 'Year', progress: 45, detail: 'Build a calm, durable product rhythm' },
  { label: 'Quarter', progress: 62, detail: 'Ship 5 polished working prototypes' },
  { label: 'Month', progress: 78, detail: 'Protect 140 hours of focused making' },
  { label: 'Week', progress: 84, detail: 'Complete 12 deep-work sessions' },
];

function makeTheme(mode, paletteKey) {
  const p = PALETTES[paletteKey];
  const dark = mode === 'dark';
  return {
    ...p,
    mode,
    page: dark ? '#131411' : p.bg,
    surface: dark ? '#1d1d19' : '#ffffff',
    surfaceAlt: dark ? '#26251f' : '#fbfaf6',
    ink: dark ? '#f4f1e8' : '#202018',
    inkSoft: dark ? 'rgba(244,241,232,.70)' : 'rgba(32,32,24,.66)',
    inkMute: dark ? 'rgba(244,241,232,.42)' : 'rgba(32,32,24,.42)',
    line: dark ? 'rgba(244,241,232,.11)' : 'rgba(32,32,24,.11)',
    shadow: dark ? '0 18px 50px rgba(0,0,0,.35)' : '0 18px 50px rgba(47,43,35,.12)',
  };
}

function App() {
  const [mode, setMode] = useState('light');
  const [palette, setPalette] = useState('ember');
  const [density, setDensity] = useState('regular');
  const [view, setView] = useState('vitality');
  const [zoom, setZoom] = useState(88);
  const [panelOpen, setPanelOpen] = useState(true);
  const [focus, setFocus] = useState(null);
  const theme = useMemo(() => makeTheme(mode, palette), [mode, palette]);

  const controls = {
    mode, setMode, palette, setPalette, density, setDensity, view, setView,
    zoom, setZoom, panelOpen, setPanelOpen,
  };

  return (
    <main className="app" style={{ '--page': theme.page, '--ink': theme.ink }}>
      <TopBar theme={theme} controls={controls} />
      <div className="workspace">
        <Sidebar theme={theme} active={view} onSelect={setView} />
        <DesignCanvas theme={theme} density={density} view={view} zoom={zoom} onFocus={setFocus} />
        {panelOpen && <TweaksPanel theme={theme} controls={controls} />}
      </div>
      {focus && (
        <div className="focusOverlay" onClick={() => setFocus(null)}>
          <button className="iconButton closeFocus" aria-label="Close focus view" onClick={() => setFocus(null)}>
            <Maximize2 size={17} />
          </button>
          <section className="focusShell" onClick={(event) => event.stopPropagation()}>
            <Artboard kind={focus} theme={theme} density={density} expanded />
          </section>
        </div>
      )}
    </main>
  );
}

function TopBar({ theme, controls }) {
  return (
    <header className="topbar" style={{ background: theme.surface, borderColor: theme.line }}>
      <div className="brand">
        <div className="brandMark"><Activity size={18} /></div>
        <div>
          <strong>Focus Artboard Panel</strong>
          <span>Live dashboard canvas</span>
        </div>
      </div>
      <div className="topActions">
        <Segmented
          value={controls.mode}
          onChange={controls.setMode}
          options={[
            { value: 'light', icon: Sun, label: 'Light' },
            { value: 'dark', icon: Moon, label: 'Dark' },
          ]}
        />
        <button className="iconButton" title="Reset zoom" onClick={() => controls.setZoom(88)}>
          <RotateCcw size={16} />
        </button>
        <button className="iconButton" title="Toggle tweaks panel" onClick={() => controls.setPanelOpen(!controls.panelOpen)}>
          {controls.panelOpen ? <PanelRightClose size={17} /> : <PanelRightOpen size={17} />}
        </button>
      </div>
    </header>
  );
}

function Sidebar({ theme, active, onSelect }) {
  const items = [
    { id: 'vitality', label: 'Vitality', icon: Activity },
    { id: 'dial', label: 'Day Dial', icon: Gauge },
    { id: 'orbital', label: 'Orbital', icon: Orbit },
  ];
  return (
    <nav className="sidebar" style={{ background: theme.surface, borderColor: theme.line }}>
      {items.map(({ id, label, icon: Icon }) => (
        <button key={id} className={active === id ? 'sideItem active' : 'sideItem'} onClick={() => onSelect(id)}>
          <Icon size={18} />
          <span>{label}</span>
        </button>
      ))}
    </nav>
  );
}

function DesignCanvas({ theme, density, view, zoom, onFocus }) {
  const boards = [
    { id: 'vitality', label: 'Vitality Rings' },
    { id: 'dial', label: '24h Dial' },
    { id: 'orbital', label: 'Orbital Alignment' },
  ];
  const shown = view === 'all' ? boards : boards.filter((b) => b.id === view);
  return (
    <section className="canvas">
      <div className="canvasGrid" style={{ transform: `scale(${zoom / 100})` }}>
        {shown.map((board) => (
          <article className="artboardFrame" key={board.id}>
            <div className="frameHeader">
              <span>{board.label}</span>
              <button className="miniButton" title="Open focus view" onClick={() => onFocus(board.id)}>
                <Maximize2 size={14} />
              </button>
            </div>
            <Artboard kind={board.id} theme={theme} density={density} />
          </article>
        ))}
      </div>
    </section>
  );
}

function Artboard({ kind, theme, density, expanded = false }) {
  const Component = kind === 'dial' ? DialBoard : kind === 'orbital' ? OrbitalBoard : VitalityBoard;
  return (
    <div className={expanded ? 'artboard expanded' : 'artboard'} style={{ background: theme.page, color: theme.ink }}>
      <Component theme={theme} density={density} />
    </div>
  );
}

function VitalityBoard({ theme, density }) {
  const compact = density === 'compact';
  const rings = [
    { label: 'Deep', value: 4.8, goal: 5, color: theme.accent },
    { label: 'Focus', value: 7.2, goal: 8, color: theme.focus },
    { label: 'Align', value: 78, goal: 100, color: theme.align },
  ];
  return (
    <div className="boardLayout">
      <BoardHeader kicker="Today / 13:42" title="Vitality Rings" theme={theme} />
      <section className="vitalityHero">
        <div className="rings">
          {rings.map((ring, index) => (
            <Ring key={ring.label} size={compact ? 170 - index * 28 : 210 - index * 34} stroke={16} progress={ring.value / ring.goal} color={ring.color} />
          ))}
          <div className="ringCenter">
            <strong>7.2h</strong>
            <span>protected focus</span>
          </div>
        </div>
        <MetricStack theme={theme} />
      </section>
      <section className="cardGrid">
        <DataCard icon={Timer} label="Pomodoros" value="12 / 14" theme={theme} />
        <DataCard icon={Zap} label="Energy" value="78%" theme={theme} />
        <DataCard icon={BarChart3} label="Distractions" value="9" theme={theme} />
      </section>
      <Timeline theme={theme} />
    </div>
  );
}

function DialBoard({ theme }) {
  const [hover, setHover] = useState(null);
  return (
    <div className="boardLayout">
      <BoardHeader kicker="24 hour map" title="Day Dial" theme={theme} />
      <section className="dialWrap">
        <svg className="dialSvg" viewBox="0 0 420 420" role="img" aria-label="Twenty four hour focus dial">
          <circle cx="210" cy="210" r="174" fill="none" stroke={theme.line} strokeWidth="36" />
          {HOURS.map((cat, hour) => (
            <path
              key={hour}
              d={hourArc(hour, 1, 190, 154)}
              fill={catColor(cat, theme)}
              opacity={hover === null || hover === hour ? 1 : .35}
              onMouseEnter={() => setHover(hour)}
              onMouseLeave={() => setHover(null)}
            />
          ))}
          {Array.from({ length: 24 }).map((_, h) => {
            const a = (h / 24) * Math.PI * 2 - Math.PI / 2;
            const x1 = 210 + 136 * Math.cos(a);
            const y1 = 210 + 136 * Math.sin(a);
            const x2 = 210 + 146 * Math.cos(a);
            const y2 = 210 + 146 * Math.sin(a);
            return <line key={h} x1={x1} y1={y1} x2={x2} y2={y2} stroke={theme.line} strokeWidth="2" />;
          })}
          <circle cx="210" cy="210" r="104" fill={theme.surface} stroke={theme.line} />
          <text x="210" y="196" textAnchor="middle" className="dialTime" fill={theme.ink}>13:42</text>
          <text x="210" y="224" textAnchor="middle" className="dialLabel" fill={theme.inkSoft}>
            {hover === null ? 'current rhythm' : `${String(hover).padStart(2, '0')}:00 ${HOURS[hover]}`}
          </text>
        </svg>
        <MetricStack theme={theme} compact />
      </section>
      <Timeline theme={theme} />
    </div>
  );
}

function OrbitalBoard({ theme }) {
  const [selected, setSelected] = useState('Quarter');
  const activeGoal = GOALS.find((g) => g.label === selected) || GOALS[1];
  return (
    <div className="boardLayout">
      <BoardHeader kicker="Goal horizon" title="Orbital Alignment" theme={theme} />
      <section className="orbitalGrid">
        <svg className="orbitSvg" viewBox="0 0 460 460" role="img" aria-label="Concentric goal progress orbits">
          {GOALS.map((goal, index) => {
            const r = 196 - index * 42;
            const color = [theme.align, theme.accent, theme.focus, theme.gold][index];
            return (
              <g key={goal.label} onClick={() => setSelected(goal.label)} className="orbitGroup">
                <circle cx="230" cy="230" r={r} fill="none" stroke={theme.line} strokeWidth="12" />
                <path d={circleArc(230, 230, r, goal.progress / 100)} fill="none" stroke={color} strokeWidth="12" strokeLinecap="round" />
                <circle cx={230} cy={230 - r} r={selected === goal.label ? 8 : 5} fill={color} />
              </g>
            );
          })}
          <circle cx="230" cy="230" r="54" fill={theme.surface} stroke={theme.line} />
          <text x="230" y="223" textAnchor="middle" className="orbitPct" fill={theme.ink}>{activeGoal.progress}%</text>
          <text x="230" y="248" textAnchor="middle" className="dialLabel" fill={theme.inkSoft}>{activeGoal.label}</text>
        </svg>
        <div className="goalPanel" style={{ background: theme.surface, borderColor: theme.line }}>
          <span>Selected horizon</span>
          <strong>{activeGoal.label}</strong>
          <p>{activeGoal.detail}</p>
          <div className="progressLine"><i style={{ width: `${activeGoal.progress}%`, background: theme.accent }} /></div>
        </div>
      </section>
      <Heatmap theme={theme} />
    </div>
  );
}

function BoardHeader({ kicker, title, theme }) {
  return (
    <header className="boardHeader">
      <div>
        <span style={{ color: theme.inkMute }}>{kicker}</span>
        <h1>{title}</h1>
      </div>
      <CircleDot color={theme.accent} size={28} />
    </header>
  );
}

function MetricStack({ theme, compact = false }) {
  return (
    <div className={compact ? 'metricStack compact' : 'metricStack'}>
      {[
        ['Deep work', '4.8h', theme.accent],
        ['Focus total', '7.2h', theme.focus],
        ['Goal fit', '78%', theme.align],
      ].map(([label, value, color]) => (
        <div className="metricRow" key={label} style={{ background: theme.surface, borderColor: theme.line }}>
          <i style={{ background: color }} />
          <span>{label}</span>
          <strong>{value}</strong>
        </div>
      ))}
    </div>
  );
}

function DataCard({ icon: Icon, label, value, theme }) {
  return (
    <div className="dataCard" style={{ background: theme.surface, borderColor: theme.line }}>
      <Icon size={18} color={theme.accent} />
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function Timeline({ theme }) {
  return (
    <section className="timeline" style={{ background: theme.surface, borderColor: theme.line }}>
      {HOURS.map((cat, hour) => (
        <i key={hour} title={`${hour}:00 ${cat}`} style={{ background: catColor(cat, theme) }} />
      ))}
    </section>
  );
}

function Heatmap({ theme }) {
  const cells = Array.from({ length: 84 }, (_, i) => ((i * 7 + i % 5) % 8));
  return (
    <section className="heatmap" style={{ background: theme.surface, borderColor: theme.line }}>
      {cells.map((v, i) => (
        <i key={i} style={{ background: v ? theme.accent : theme.line, opacity: v ? .25 + v / 10 : 1 }} />
      ))}
    </section>
  );
}

function TweaksPanel({ theme, controls }) {
  return (
    <aside className="tweaks" style={{ background: theme.surface, borderColor: theme.line }}>
      <div className="tweakHead">
        <strong>Design Tweaks</strong>
        <Palette size={17} color={theme.accent} />
      </div>
      <label className="field">
        <span>Artboard</span>
        <select value={controls.view} onChange={(e) => controls.setView(e.target.value)}>
          <option value="vitality">Vitality Rings</option>
          <option value="dial">Day Dial</option>
          <option value="orbital">Orbital Alignment</option>
          <option value="all">All Boards</option>
        </select>
      </label>
      <div className="field">
        <span>Palette</span>
        <div className="paletteGrid">
          {Object.entries(PALETTES).map(([key, p]) => (
            <button key={key} className={controls.palette === key ? 'swatch active' : 'swatch'} title={p.name} onClick={() => controls.setPalette(key)}>
              <i style={{ background: p.accent }} />
              <i style={{ background: p.focus }} />
              <i style={{ background: p.align }} />
            </button>
          ))}
        </div>
      </div>
      <div className="field">
        <span>Density</span>
        <Segmented
          value={controls.density}
          onChange={controls.setDensity}
          options={[
            { value: 'compact', label: 'Compact' },
            { value: 'regular', label: 'Regular' },
          ]}
        />
      </div>
      <label className="field">
        <span>Canvas zoom {controls.zoom}%</span>
        <input type="range" min="58" max="112" value={controls.zoom} onChange={(e) => controls.setZoom(Number(e.target.value))} />
      </label>
    </aside>
  );
}

function Segmented({ value, onChange, options }) {
  return (
    <div className="segmented">
      {options.map((option) => {
        const Icon = option.icon;
        return (
          <button key={option.value} className={value === option.value ? 'selected' : ''} onClick={() => onChange(option.value)} title={option.label}>
            {Icon && <Icon size={15} />}
            <span>{option.label}</span>
          </button>
        );
      })}
    </div>
  );
}

function Ring({ size, stroke, progress, color }) {
  const r = (size - stroke) / 2;
  const c = Math.PI * 2 * r;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="ringLayer">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(120,110,90,.13)" strokeWidth={stroke} />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke={color}
        strokeLinecap="round"
        strokeWidth={stroke}
        strokeDasharray={`${c * Math.min(progress, 1)} ${c}`}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />
    </svg>
  );
}

function catColor(cat, theme) {
  return {
    deep: theme.accent,
    learn: theme.align,
    create: theme.gold,
    move: theme.focus,
    admin: 'rgba(120,120,120,.36)',
    plan: '#7f8f68',
    review: '#9f7fa7',
    break: 'rgba(150,120,80,.32)',
    sleep: 'rgba(80,88,96,.25)',
  }[cat] || theme.line;
}

function hourArc(hour, span, rOut, rIn) {
  const cx = 210;
  const cy = 210;
  const a0 = (hour / 24) * Math.PI * 2 - Math.PI / 2 + 0.01;
  const a1 = ((hour + span) / 24) * Math.PI * 2 - Math.PI / 2 - 0.01;
  const p = (r, a) => [cx + r * Math.cos(a), cy + r * Math.sin(a)];
  const [x0o, y0o] = p(rOut, a0);
  const [x1o, y1o] = p(rOut, a1);
  const [x0i, y0i] = p(rIn, a0);
  const [x1i, y1i] = p(rIn, a1);
  return `M ${x0o} ${y0o} A ${rOut} ${rOut} 0 0 1 ${x1o} ${y1o} L ${x1i} ${y1i} A ${rIn} ${rIn} 0 0 0 ${x0i} ${y0i} Z`;
}

function circleArc(cx, cy, r, progress) {
  const start = -Math.PI / 2;
  const end = start + Math.PI * 2 * Math.min(progress, .999);
  const large = progress > .5 ? 1 : 0;
  const x0 = cx + r * Math.cos(start);
  const y0 = cy + r * Math.sin(start);
  const x1 = cx + r * Math.cos(end);
  const y1 = cy + r * Math.sin(end);
  return `M ${x0} ${y0} A ${r} ${r} 0 ${large} 1 ${x1} ${y1}`;
}

createRoot(document.getElementById('root')).render(<App />);
