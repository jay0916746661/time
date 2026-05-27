import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  Activity,
  BarChart3,
  CalendarDays,
  CircleDot,
  Gauge,
  Maximize2,
  Moon,
  Orbit,
  PanelRightClose,
  PanelRightOpen,
  Palette,
  Save,
  RotateCcw,
  Sun,
  Timer,
  Target,
  Zap,
} from 'lucide-react';
import './styles.css';

const PASSWORD_HASH = '821232b4b8d1078f2e1c7963bf29d503820410bfbac3d06977870a463e72263b';
const AUTH_KEY = 'time-panel-auth';
const TRACKING_KEY = 'time-panel-daily-records';

const GCAL_STORAGE_KEY = 'gcal-ics-url';

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
  const [unlocked, setUnlocked] = useState(() => localStorage.getItem(AUTH_KEY) === '1');
  const [mode, setMode] = useState('light');
  const [palette, setPalette] = useState('ember');
  const [density, setDensity] = useState('regular');
  const [view, setView] = useState('calendar');
  const [zoom, setZoom] = useState(88);
  const [panelOpen, setPanelOpen] = useState(true);
  const [focus, setFocus] = useState(null);
  const theme = useMemo(() => makeTheme(mode, palette), [mode, palette]);

  const controls = {
    mode, setMode, palette, setPalette, density, setDensity, view, setView,
    zoom, setZoom, panelOpen, setPanelOpen,
  };

  if (!unlocked) {
    return <PasswordGate onUnlock={() => setUnlocked(true)} />;
  }

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

function PasswordGate({ onUnlock }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  async function submit(event) {
    event.preventDefault();
    const hash = await sha256(password);
    if (hash === PASSWORD_HASH) {
      localStorage.setItem(AUTH_KEY, '1');
      onUnlock();
      return;
    }
    setError('密碼不正確');
  }

  return (
    <main className="lockScreen">
      <form className="lockCard" onSubmit={submit}>
        <div className="brandMark"><Activity size={18} /></div>
        <h1>時間對標面板</h1>
        <p>輸入密碼後開始查看與記錄你的每日時間。</p>
        <input
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="密碼"
          autoFocus
        />
        {error && <span className="lockError">{error}</span>}
        <button type="submit">進入面板</button>
      </form>
    </main>
  );
}

async function sha256(text) {
  const data = new TextEncoder().encode(text);
  const buffer = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(buffer)).map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

function TopBar({ theme, controls }) {
  return (
    <header className="topbar" style={{ background: theme.surface, borderColor: theme.line }}>
      <div className="brand">
        <div className="brandMark"><Activity size={18} /></div>
        <div>
          <strong>時間對標面板</strong>
          <span>Google 日曆分析畫布</span>
        </div>
      </div>
      <div className="topActions">
        <Segmented
          value={controls.mode}
          onChange={controls.setMode}
          options={[
            { value: 'light', icon: Sun, label: '淺色' },
            { value: 'dark', icon: Moon, label: '深色' },
          ]}
        />
        <button className="iconButton" title="重設縮放" onClick={() => controls.setZoom(88)}>
          <RotateCcw size={16} />
        </button>
        <button className="iconButton" title="開關調整面板" onClick={() => controls.setPanelOpen(!controls.panelOpen)}>
          {controls.panelOpen ? <PanelRightClose size={17} /> : <PanelRightOpen size={17} />}
        </button>
      </div>
    </header>
  );
}

function Sidebar({ theme, active, onSelect }) {
  const items = [
    { id: 'calendar', label: '日曆對標', icon: CalendarDays },
    { id: 'vitality', label: '活力圓環', icon: Activity },
    { id: 'dial', label: '日節奏盤', icon: Gauge },
    { id: 'orbital', label: '目標軌道', icon: Orbit },
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
    { id: 'calendar', label: 'Google 日曆對標' },
    { id: 'vitality', label: '活力圓環' },
    { id: 'dial', label: '24 小時節奏盤' },
    { id: 'orbital', label: '目標軌道' },
  ];
  const shown = view === 'all' ? boards : boards.filter((b) => b.id === view);
  return (
    <section className="canvas">
      <div className="canvasGrid" style={{ transform: `scale(${zoom / 100})` }}>
        {shown.map((board) => (
          <article className="artboardFrame" key={board.id}>
            <div className="frameHeader">
              <span>{board.label}</span>
              <button className="miniButton" title="放大檢視" onClick={() => onFocus(board.id)}>
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
  const Component = kind === 'calendar' ? CalendarBoard : kind === 'dial' ? DialBoard : kind === 'orbital' ? OrbitalBoard : VitalityBoard;
  return (
    <div className={`${expanded ? 'artboard expanded' : 'artboard'} ${kind === 'calendar' ? 'calendarArtboard' : ''}`} style={{ background: theme.page, color: theme.ink }}>
      <Component theme={theme} density={density} />
    </div>
  );
}

function VitalityBoard({ theme, density }) {
  const compact = density === 'compact';
  const rings = [
    { label: '深度', value: 4.8, goal: 5, color: theme.accent },
    { label: '專注', value: 7.2, goal: 8, color: theme.focus },
    { label: '對標', value: 78, goal: 100, color: theme.align },
  ];
  return (
    <div className="boardLayout">
      <BoardHeader kicker="今天 / 13:42" title="活力圓環" theme={theme} />
      <section className="vitalityHero">
        <div className="rings">
          {rings.map((ring, index) => (
            <Ring key={ring.label} size={compact ? 170 - index * 28 : 210 - index * 34} stroke={16} progress={ring.value / ring.goal} color={ring.color} />
          ))}
          <div className="ringCenter">
            <strong>7.2h</strong>
            <span>受保護專注</span>
          </div>
        </div>
        <MetricStack theme={theme} />
      </section>
      <section className="cardGrid">
        <DataCard icon={Timer} label="番茄鐘" value="12 / 14" theme={theme} />
        <DataCard icon={Zap} label="能量" value="78%" theme={theme} />
        <DataCard icon={BarChart3} label="打斷" value="9" theme={theme} />
      </section>
      <Timeline theme={theme} />
    </div>
  );
}

function DialBoard({ theme }) {
  const [hover, setHover] = useState(null);
  return (
    <div className="boardLayout">
      <BoardHeader kicker="24 小時地圖" title="日節奏盤" theme={theme} />
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
            {hover === null ? '目前節奏' : `${String(hover).padStart(2, '0')}:00 ${categoryLabel(HOURS[hover])}`}
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
      <BoardHeader kicker="目標週期" title="目標軌道" theme={theme} />
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
          <span>目前週期</span>
          <strong>{goalLabel(activeGoal.label)}</strong>
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
        ['深度工作', '4.8h', theme.accent],
        ['專注總量', '7.2h', theme.focus],
        ['目標貼合', '78%', theme.align],
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
        <strong>面板調整</strong>
        <Palette size={17} color={theme.accent} />
      </div>
      <label className="field">
        <span>畫面</span>
        <select value={controls.view} onChange={(e) => controls.setView(e.target.value)}>
          <option value="calendar">Google 日曆對標</option>
          <option value="vitality">活力圓環</option>
          <option value="dial">日節奏盤</option>
          <option value="orbital">目標軌道</option>
          <option value="all">全部畫面</option>
        </select>
      </label>
      <div className="field">
        <span>色票</span>
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
        <span>密度</span>
        <Segmented
          value={controls.density}
          onChange={controls.setDensity}
          options={[
            { value: 'compact', label: '緊湊' },
            { value: 'regular', label: '標準' },
          ]}
        />
      </div>
      <label className="field">
        <span>畫布縮放 {controls.zoom}%</span>
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

function parseICS(text) {
  const normalized = text.replace(/\r\n/g, '\n').replace(/\n[ \t]/g, '');
  const lines = normalized.split('\n');
  const results = [];
  let current = null;
  for (const line of lines) {
    if (line === 'BEGIN:VEVENT') { current = {}; continue; }
    if (line === 'END:VEVENT') {
      if (current?.dtstart && current?.dtend && !/VALUE=DATE/.test(current.dtstart)) {
        const fmt = (s) => {
          const d = s.replace(/Z$/, '');
          return `${d.slice(0,4)}-${d.slice(4,6)}-${d.slice(6,8)} ${d.slice(9,11)}:${d.slice(11,13)}`;
        };
        results.push(`${current.title || '未命名'},${fmt(current.dtstart)},${fmt(current.dtend)}`);
      }
      current = null;
      continue;
    }
    if (!current) continue;
    if (/^SUMMARY/i.test(line)) current.title = line.replace(/^SUMMARY[^:]*:/i, '').trim();
    if (/^DTSTART/i.test(line)) current.dtstart = line.replace(/^DTSTART[^:]*:/i, '').trim();
    if (/^DTEND/i.test(line)) current.dtend = line.replace(/^DTEND[^:]*:/i, '').trim();
  }
  return results.join('\n');
}

function CalendarBoard({ theme }) {
  const [raw, setRaw] = useState(SAMPLE_CALENDAR_TEXT);
  const [records, setRecords] = useDailyRecords();
  const [icsUrl, setIcsUrl] = useState(() => localStorage.getItem(GCAL_STORAGE_KEY) || '');
  const [gcalLoading, setGcalLoading] = useState(false);
  const [gcalError, setGcalError] = useState('');
  const events = useMemo(() => parseCalendarText(raw), [raw]);
  const analysis = useMemo(() => analyzeCalendar(events), [events]);

  useEffect(() => {
    const saved = localStorage.getItem(GCAL_STORAGE_KEY);
    if (saved) fetchICS(saved);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleICSFile(event) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const parsed = parseICS(e.target.result);
      if (parsed) setRaw(parsed);
    };
    reader.readAsText(file, 'UTF-8');
  }

  async function fetchICS(url) {
    if (!url) return;
    setGcalLoading(true);
    setGcalError('');
    try {
      const proxy = `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`;
      const res = await fetch(proxy);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const parsed = parseICS(data.contents || '');
      if (parsed) {
        setRaw(parsed);
        localStorage.setItem(GCAL_STORAGE_KEY, url);
      } else {
        setGcalError('無法解析 ICS，請確認連結正確');
      }
    } catch {
      setGcalError('連線失敗，可改用上傳 .ics 檔案');
    } finally {
      setGcalLoading(false);
    }
  }

  function saveAndFetch() {
    localStorage.setItem(GCAL_STORAGE_KEY, icsUrl);
    fetchICS(icsUrl);
  }

  return (
    <div className="boardLayout">
      <BoardHeader kicker="Google Calendar / 本週對標" title="日曆對標" theme={theme} />
      <div className="gcalBar" style={{ background: theme.surface, borderColor: theme.line }}>
        <label className="gcalFileBtn">
          <input type="file" accept=".ics" onChange={handleICSFile} style={{ display: 'none' }} />
          上傳 .ics 檔
        </label>
        <span className="gcalSep">或</span>
        <input
          className="gcalUrlInput"
          type="url"
          placeholder="貼上 Google 日曆私人 iCal 連結"
          value={icsUrl}
          onChange={(e) => setIcsUrl(e.target.value)}
        />
        <button className="gcalButton" onClick={saveAndFetch} disabled={gcalLoading || !icsUrl}>
          {gcalLoading ? '載入…' : '同步'}
        </button>
        {gcalError && <span className="gcalError">{gcalError}</span>}
        {!gcalError && icsUrl && !gcalLoading && <span className="gcalStatus">● 已儲存</span>}
      </div>
      <section className="calendarGrid">
        <div className="calendarSummary" style={{ background: theme.surface, borderColor: theme.line }}>
          <div className="scoreDial" style={{ borderColor: theme.line }}>
            <strong>{analysis.score}</strong>
            <span>對標分</span>
          </div>
          <div className="summaryCopy">
            <span>本週重點</span>
            <h2>{analysis.headline}</h2>
            <p>{analysis.note}</p>
          </div>
        </div>
        <div className="calendarInput" style={{ background: theme.surface, borderColor: theme.line }}>
          <label>
            <span>行程資料（標題,開始,結束）</span>
            <textarea value={raw} onChange={(event) => setRaw(event.target.value)} spellCheck="false" />
          </label>
        </div>
      </section>
      <section className="targetRows">
        {analysis.rows.map((row) => (
          <div className="targetRow" key={row.label} style={{ background: theme.surface, borderColor: theme.line }}>
            <Target size={17} color={row.color} />
            <span>{row.label}</span>
            <strong>{row.hours.toFixed(1)}h</strong>
            <div className="progressLine"><i style={{ width: `${Math.min(100, row.percent)}%`, background: row.color }} /></div>
          </div>
        ))}
      </section>
      <section className="insightList" style={{ background: theme.surface, borderColor: theme.line }}>
        {analysis.insights.map((item) => <p key={item}>{item}</p>)}
      </section>
      <DailyTracker theme={theme} records={records} setRecords={setRecords} analysis={analysis} />
    </div>
  );
}

function useDailyRecords() {
  const [records, setRecords] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(TRACKING_KEY) || '[]');
    } catch {
      return [];
    }
  });
  const saveRecords = (next) => {
    const value = typeof next === 'function' ? next(records) : next;
    setRecords(value);
    localStorage.setItem(TRACKING_KEY, JSON.stringify(value));
  };
  return [records, saveRecords];
}

function DailyTracker({ theme, records, setRecords, analysis }) {
  const today = new Date().toISOString().slice(0, 10);
  const existing = records.find((record) => record.date === today);
  const defaults = existing || {
    date: today,
    deep: Number((analysis.rows.find((row) => row.label === '深度與創作')?.hours || 0).toFixed(1)),
    growth: Number((analysis.rows.find((row) => row.label === '學習與技能')?.hours || 0).toFixed(1)),
    body: Number((analysis.rows.find((row) => row.label === '身體維護')?.hours || 0).toFixed(1)),
    work: Number((analysis.rows.find((row) => row.label === '工作占用')?.hours || 0).toFixed(1)),
    rest: 0,
    life: 0,
    note: '',
  };
  const [draft, setDraft] = useState(defaults);
  const lastSeven = [...records].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 7);
  const weeklyTotal = lastSeven.reduce((sum, record) => sum + Number(record.deep || 0) + Number(record.growth || 0), 0);

  function update(key, value) {
    setDraft((prev) => ({ ...prev, [key]: value }));
  }

  function save() {
    const cleaned = {
      ...draft,
      deep: Number(draft.deep || 0),
      growth: Number(draft.growth || 0),
      body: Number(draft.body || 0),
      work: Number(draft.work || 0),
      rest: Number(draft.rest || 0),
      life: Number(draft.life || 0),
    };
    setRecords((prev) => {
      const withoutToday = prev.filter((record) => record.date !== cleaned.date);
      return [...withoutToday, cleaned].sort((a, b) => a.date.localeCompare(b.date));
    });
  }

  return (
    <section className="dailyTracker" style={{ background: theme.surface, borderColor: theme.line }}>
      <div className="trackerHead">
        <div>
          <span>每日追蹤</span>
          <h2>今天的時間帳</h2>
        </div>
        <button className="saveButton" onClick={save}>
          <Save size={16} />
          儲存今天
        </button>
      </div>
      <div className="trackerForm">
        <TimeInput label="深度創作" value={draft.deep} onChange={(v) => update('deep', v)} />
        <TimeInput label="學習技能" value={draft.growth} onChange={(v) => update('growth', v)} />
        <TimeInput label="身體維護" value={draft.body} onChange={(v) => update('body', v)} />
        <TimeInput label="工作" value={draft.work} onChange={(v) => update('work', v)} />
        <TimeInput label="休息睡眠" value={draft.rest} onChange={(v) => update('rest', v)} />
        <TimeInput label="生活社交" value={draft.life} onChange={(v) => update('life', v)} />
      </div>
      <textarea
        className="noteInput"
        value={draft.note}
        onChange={(event) => update('note', event.target.value)}
        placeholder="今天的能量、卡點、明天要保護的時間..."
      />
      <div className="recordStrip">
        <strong>近 7 筆深度/技能：{weeklyTotal.toFixed(1)}h</strong>
        <div>
          {lastSeven.length ? lastSeven.map((record) => (
            <span key={record.date}>{record.date.slice(5)} · {(Number(record.deep || 0) + Number(record.growth || 0)).toFixed(1)}h</span>
          )) : <span>儲存後會出現每日紀錄</span>}
        </div>
      </div>
    </section>
  );
}

function TimeInput({ label, value, onChange }) {
  return (
    <label className="timeInput">
      <span>{label}</span>
      <input
        type="number"
        inputMode="decimal"
        pattern="[0-9]*"
        min="0"
        step="0.25"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}

const SAMPLE_CALENDAR_TEXT = [
  '上班,2026-05-27 09:00,2026-05-27 18:00',
  '健身,2026-05-27 12:30,2026-05-27 13:30',
  '練吉他,2026-05-27 19:45,2026-05-27 20:45',
  '看書,2026-05-27 21:00,2026-05-27 21:30',
  'FLOW,2026-05-27 21:45,2026-05-27 23:00',
].join('\n');

function parseCalendarText(raw) {
  return raw.split('\n').map((line) => line.trim()).filter(Boolean).map((line) => {
    const [title = '未命名', start = '', end = ''] = line.split(',').map((part) => part.trim());
    const startDate = new Date(start.replace(' ', 'T'));
    const endDate = new Date(end.replace(' ', 'T'));
    const hours = Number.isFinite(endDate - startDate) ? Math.max(0, (endDate - startDate) / 36e5) : 0;
    return { title, hours, category: inferCategory(title) };
  }).filter((event) => event.hours > 0);
}

function inferCategory(title) {
  const text = title.toLowerCase();
  if (/上班|工作|meeting|會議|收款|補貨/.test(text)) return 'work';
  if (/flow|ai|文案|拍照|整理|創作/.test(text)) return 'deep';
  if (/吉他|看書|課|學|練舞|bachata|lv/.test(text)) return 'growth';
  if (/健身|跑步|腳|運動/.test(text)) return 'body';
  if (/睡|休息/.test(text)) return 'rest';
  return 'life';
}

function analyzeCalendar(events) {
  const totals = events.reduce((acc, event) => {
    acc[event.category] = (acc[event.category] || 0) + event.hours;
    return acc;
  }, {});
  const focus = (totals.deep || 0) + (totals.growth || 0);
  const body = totals.body || 0;
  const work = totals.work || 0;
  const rest = totals.rest || 0;
  const score = Math.round(Math.min(100, 42 + focus * 8 + body * 6 + Math.min(rest, 8) * 2 - Math.max(0, work - 45) * 2));
  const rows = [
    { label: '深度與創作', hours: totals.deep || 0, percent: ((totals.deep || 0) / 8) * 100, color: '#d96c4a' },
    { label: '學習與技能', hours: totals.growth || 0, percent: ((totals.growth || 0) / 7) * 100, color: '#5d87a8' },
    { label: '身體維護', hours: body, percent: (body / 4) * 100, color: '#7aa27a' },
    { label: '工作占用', hours: work, percent: (work / 45) * 100, color: '#c6a255' },
  ];
  return {
    score,
    rows,
    headline: focus >= 8 ? '專注與技能投入正在成形' : '可以再補一塊深度創作時間',
    note: `已解析 ${events.length} 筆行程，依標題自動歸類為工作、深度、技能、身體、休息與生活。`,
    insights: [
      `深度/技能合計 ${focus.toFixed(1)} 小時，是最直接對標長期能力的區塊。`,
      body >= 3 ? '身體維護頻率不錯，可以保留在中午或傍晚。' : '身體維護偏少，建議先固定兩個 30 分鐘區塊。',
      work > 40 ? '工作占用偏高，晚間最好避免被零碎任務切碎。' : '工作量仍有餘裕，可以安排較完整的輸出時段。',
    ],
  };
}

function categoryLabel(cat) {
  return {
    deep: '深度',
    learn: '學習',
    create: '創作',
    move: '移動',
    admin: '行政',
    plan: '規劃',
    review: '回顧',
    break: '休息',
    sleep: '睡眠',
  }[cat] || cat;
}

function goalLabel(label) {
  return {
    Year: '年度',
    Quarter: '季度',
    Month: '月份',
    Week: '本週',
  }[label] || label;
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
