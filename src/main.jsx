import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  Activity,
  BarChart3,
  CalendarDays,
  CheckCircle2,
  Gauge,
  LockKeyhole,
  Moon,
  PanelRightClose,
  PanelRightOpen,
  RotateCcw,
  Save,
  Sun,
  Target,
  Zap,
} from 'lucide-react';
import './styles.css';

const PASSWORD_HASH = '821232b4b8d1078f2e1c7963bf29d503820410bfbac3d06977870a463e72263b';
const AUTH_KEY = 'time-panel-auth';
const TRACKING_KEY = 'time-panel-daily-records';
const WEEKLY_PLAN_KEY = 'time-panel-weekly-plan';
const CALENDAR_RAW_KEY = 'time-panel-calendar-raw';
const LIFE_OS_KEY = 'time-panel-life-os';

const PALETTES = {
  ember: { name: '暖橘', accent: '#d96c4a', focus: '#7aa27a', align: '#5d87a8', gold: '#c6a255', bg: '#f6f4ef' },
  tide: { name: '潮汐', accent: '#2f88a7', focus: '#74a891', align: '#b7824e', gold: '#c8a856', bg: '#f3f7f6' },
  plum: { name: '梅紫', accent: '#9358a8', focus: '#668f6c', align: '#c17d55', gold: '#d0aa53', bg: '#f7f3f6' },
  graphite: { name: '石墨', accent: '#4f6b7a', focus: '#927953', align: '#6d8f79', gold: '#b99a52', bg: '#f4f3ef' },
};

const SAMPLE_CALENDAR_TEXT = [
  '上班,2026-06-02 09:00,2026-06-02 18:00',
  '練舞,2026-06-02 18:30,2026-06-02 19:30',
  'BACHATA LV3,2026-06-02 19:30,2026-06-02 20:30',
  'FLOW,2026-06-02 21:00,2026-06-02 22:30',
  '看書,2026-06-02 23:00,2026-06-02 23:30',
].join('\n');

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
  };
}

function App() {
  const [unlocked, setUnlocked] = useState(() => localStorage.getItem(AUTH_KEY) === '1');
  const [mode, setMode] = useState('light');
  const [palette, setPalette] = useState('ember');
  const [view, setView] = useState('calendar');
  const [zoom, setZoom] = useState(88);
  const [panelOpen, setPanelOpen] = useState(true);
  const theme = useMemo(() => makeTheme(mode, palette), [mode, palette]);

  if (!unlocked) return <PasswordGate onUnlock={() => setUnlocked(true)} />;

  return (
    <main className="app" style={{ '--page': theme.page, '--ink': theme.ink }}>
      <TopBar theme={theme} mode={mode} setMode={setMode} panelOpen={panelOpen} setPanelOpen={setPanelOpen} setZoom={setZoom} />
      <div className="workspace">
        <Sidebar active={view} onSelect={setView} theme={theme} />
        <section className="canvas">
          <div className="canvasGrid" style={{ transform: `scale(${zoom / 100})` }}>
            <article className="artboardFrame wideFrame">
              <div className="frameHeader">
                <span>{view === 'calendar' ? 'Google 日曆對標' : '比例儀表板'}</span>
              </div>
              <div className="artboard calendarArtboard" style={{ background: theme.page, color: theme.ink }}>
                {view === 'calendar' ? <CalendarBoard theme={theme} /> : view === 'longterm' ? <LongTermBoard theme={theme} /> : view === 'ops' ? <LifeOSBoard theme={theme} /> : <RatioBoard theme={theme} />}
              </div>
            </article>
          </div>
        </section>
        {panelOpen && <TweaksPanel theme={theme} palette={palette} setPalette={setPalette} view={view} setView={setView} zoom={zoom} setZoom={setZoom} />}
      </div>
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
        <div className="brandMark"><LockKeyhole size={18} /></div>
        <h1>時間對標面板</h1>
        <p>輸入密碼後開始查看與記錄你的每日時間。</p>
        <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="密碼" autoFocus />
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

function TopBar({ theme, mode, setMode, panelOpen, setPanelOpen, setZoom }) {
  return (
    <header className="topbar" style={{ background: theme.surface, borderColor: theme.line }}>
      <div className="brand">
        <div className="brandMark"><Activity size={18} /></div>
        <div>
          <strong>時間對標面板</strong>
          <span>日曆、校正、比例追蹤</span>
        </div>
      </div>
      <div className="topActions">
        <Segmented
          value={mode}
          onChange={setMode}
          options={[{ value: 'light', icon: Sun, label: '淺色' }, { value: 'dark', icon: Moon, label: '深色' }]}
        />
        <button className="iconButton" title="重設縮放" onClick={() => setZoom(88)}><RotateCcw size={16} /></button>
        <button className="iconButton" title="開關調整面板" onClick={() => setPanelOpen(!panelOpen)}>
          {panelOpen ? <PanelRightClose size={17} /> : <PanelRightOpen size={17} />}
        </button>
      </div>
    </header>
  );
}

function Sidebar({ active, onSelect, theme }) {
  const items = [
    { id: 'ops', label: '行事曆總控', icon: CheckCircle2 },
    { id: 'calendar', label: '日曆校正', icon: CalendarDays },
    { id: 'ratio', label: '比例總覽', icon: Gauge },
    { id: 'longterm', label: '週月長期', icon: BarChart3 },
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

function CalendarBoard({ theme }) {
  const [raw, setRaw] = useState(() => localStorage.getItem(CALENDAR_RAW_KEY) || SAMPLE_CALENDAR_TEXT);
  const [records, setRecords] = useDailyRecords();
  const [icsUrl, setIcsUrl] = useState('');
  const [importStatus, setImportStatus] = useState('');
  const events = useMemo(() => parseCalendarText(raw), [raw]);
  const analysis = useMemo(() => analyzeCalendar(events, records), [events, records]);

  useEffect(() => {
    localStorage.setItem(CALENDAR_RAW_KEY, raw);
  }, [raw]);

  function handleICSFile(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (readerEvent) => {
      const parsed = parseICS(readerEvent.target.result || '');
      if (parsed) {
        setRaw(parsed);
        setImportStatus(`已匯入 ${file.name}`);
      } else {
        setImportStatus('這個 .ics 檔沒有解析到可用事件');
      }
    };
    reader.readAsText(file, 'UTF-8');
  }

  async function tryFetchICS() {
    setImportStatus('正在嘗試讀取 iCal 連結...');
    try {
      const res = await fetch(icsUrl);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const text = await res.text();
      const parsed = parseICS(text);
      if (!parsed) throw new Error('empty');
      setRaw(parsed);
      setImportStatus('已從 iCal 連結匯入');
    } catch {
      setImportStatus('Google 目前擋住瀏覽器直接讀取。請打開這個連結下載 .ics，再用左邊上傳。');
    }
  }

  return (
    <div className="boardLayout trackingBoard">
      <BoardHeader kicker="Google Calendar / 手動校正" title="日曆對標與每日追蹤" theme={theme} />
      <section className="gcalBar" style={{ background: theme.surface, borderColor: theme.line }}>
        <label className="gcalFileBtn">
          <input type="file" accept=".ics,text/calendar" onChange={handleICSFile} />
          上傳 .ics
        </label>
        <span className="gcalSep">或</span>
        <input
          className="gcalUrlInput"
          type="url"
          value={icsUrl}
          onChange={(event) => setIcsUrl(event.target.value)}
          placeholder="貼上 Google 私密 iCal 連結"
        />
        <button className="gcalButton" onClick={tryFetchICS} disabled={!icsUrl}>測試同步</button>
        {importStatus && <span className="gcalStatus">{importStatus}</span>}
      </section>
      <section className="calendarGrid">
        <div className="calendarSummary" style={{ background: theme.surface, borderColor: theme.line }}>
          <div className="scoreDial" style={{ borderColor: theme.line }}>
            <strong>{analysis.score}</strong>
            <span>準度分</span>
          </div>
          <div className="summaryCopy">
            <span>今日判讀</span>
            <h2>{analysis.headline}</h2>
            <p>{analysis.note}</p>
          </div>
        </div>
        <div className="calendarInput" style={{ background: theme.surface, borderColor: theme.line }}>
          <label>
            <span>貼上日曆事件，一行一筆：標題,開始,結束</span>
            <textarea value={raw} onChange={(event) => setRaw(event.target.value)} spellCheck="false" />
          </label>
        </div>
      </section>
      <SourceQuality theme={theme} />
      <RatioRows theme={theme} rows={analysis.rows} />
      <section className="insightList" style={{ background: theme.surface, borderColor: theme.line }}>
        {analysis.insights.map((item) => <p key={item}>{item}</p>)}
      </section>
      <WeeklyPlanPanel theme={theme} onAddCalendarBlock={(lines) => setRaw((prev) => `${prev.trim()}\n${lines}`.trim())} />
      <DailyTracker theme={theme} records={records} setRecords={setRecords} analysis={analysis} />
    </div>
  );
}

const LIFE_SHEETS = [
  {
    id: 'dashboard',
    name: '控制中心',
    subtitle: '每天打開第一眼看的總覽',
    columns: ['項目', '本週重點', '狀態'],
    rows: [
      ['工作', 'TOPPING規格表', '進行中'],
      ['店家開發', '本週拜訪5家', '進行中'],
      ['財務', '月收入目標35000', '追蹤'],
      ['AI', 'Claude Design研究', '進行中'],
      ['技能', '吉他5次練習', '追蹤'],
    ],
  },
  {
    id: 'tasks',
    name: '工作待辦',
    subtitle: '文件、出貨、追蹤事項',
    columns: ['日期', '事項', '類型', '優先度', '狀態'],
    rows: [
      ['6/2', 'TOPPING規格表', '文件', '高', '進行中'],
      ['6/2', '海洋樂器出貨', '出貨', '高', '未完成'],
    ],
  },
  {
    id: 'crm',
    name: '店家開發 CRM',
    subtitle: '拜訪、聯絡、下次追蹤',
    columns: ['店家', '類型', '聯絡人', '狀態', '下次追蹤'],
    rows: [
      ['漢麟樂器', '鋼琴', '店長', '已接觸', '6/10'],
      ['Sun Moon Audio', '音響', '老闆', '待聯絡', '6/5'],
    ],
  },
  {
    id: 'products',
    name: '產品知識庫',
    subtitle: '品牌型號、類別、賣點',
    columns: ['品牌', '型號', '類別', '賣點'],
    rows: [
      ['TOPPING', 'DX5 II', 'DAC', '一體機'],
      ['EVE', 'SC204', '監聽喇叭', '小空間'],
    ],
  },
  {
    id: 'finance',
    name: '財務總表',
    subtitle: '收入、支出、現金流',
    columns: ['項目', '金額'],
    rows: [
      ['薪資', ''],
      ['攝影收入', ''],
      ['Skycore', ''],
      ['轉賣收入', ''],
      ['股票獲利', ''],
      ['房租', ''],
      ['貸款', ''],
      ['信用卡', ''],
    ],
  },
  {
    id: 'investing',
    name: '投資追蹤',
    subtitle: '成本、現價、報酬',
    columns: ['股票', '成本', '現價', '報酬'],
    rows: [
      ['NVDA', '', '', ''],
      ['TSLA', '', '', ''],
      ['SOFI', '', '', ''],
    ],
  },
  {
    id: 'skills',
    name: '技能樹',
    subtitle: '本月目標與本週進度',
    columns: ['技能', '本月目標', '本週進度'],
    rows: [
      ['吉他', '20小時', ''],
      ['攝影', '4場拍攝', ''],
      ['AI', '建立1個工作流', ''],
    ],
  },
  {
    id: 'opportunities',
    name: '機會雷達',
    subtitle: '想法、潛力、下一步',
    columns: ['想法', '類型', '潛力', '下一步'],
    rows: [
      ['CCD相機', '轉賣', '高', '研究行情'],
      ['黑膠店', '創業', '中', '市場調查'],
    ],
  },
  {
    id: 'network',
    name: '人脈資料庫',
    subtitle: '圈子與最後聯絡',
    columns: ['姓名', '圈子', '最後聯絡'],
    rows: [
      ['花花', '攝影', ''],
      ['Allison', '舞蹈', ''],
      ['Michelle', 'Bachata', ''],
    ],
  },
  {
    id: 'review',
    name: '每日回顧',
    subtitle: '完成事項、心情、體力',
    columns: ['日期', '完成事項', '心情', '體力'],
    rows: [
      ['6/2', '', '', ''],
    ],
  },
];

function LifeOSBoard({ theme }) {
  const [activeSheetId, setActiveSheetId] = useState('dashboard');
  const [sheets, setSheets] = useLifeOS();
  const activeSheet = sheets.find((sheet) => sheet.id === activeSheetId) || sheets[0];
  const dashboard = sheets.find((sheet) => sheet.id === 'dashboard');
  const openTasks = countStatus(sheets.find((sheet) => sheet.id === 'tasks'), ['未完成', '進行中']);
  const crmFollowups = countStatus(sheets.find((sheet) => sheet.id === 'crm'), ['待聯絡', '已接觸']);
  const financeRows = sheets.find((sheet) => sheet.id === 'finance')?.rows || [];

  function updateCell(rowIndex, colIndex, value) {
    setSheets((prev) => prev.map((sheet) => {
      if (sheet.id !== activeSheet.id) return sheet;
      const rows = sheet.rows.map((row, index) => index === rowIndex ? row.map((cell, c) => c === colIndex ? value : cell) : row);
      return { ...sheet, rows };
    }));
  }

  function addRow() {
    setSheets((prev) => prev.map((sheet) => {
      if (sheet.id !== activeSheet.id) return sheet;
      return { ...sheet, rows: [...sheet.rows, sheet.columns.map(() => '')] };
    }));
  }

  return (
    <div className="boardLayout lifeBoard">
      <BoardHeader kicker="Calendar OS / 10 Sheets" title="行事曆總控" theme={theme} />
      <section className="lifeSummary">
        <div className="lifeHero" style={{ background: theme.surface, borderColor: theme.line }}>
          <span>本週作戰狀態</span>
          <strong>{dashboard?.rows?.filter((row) => row[2] === '進行中').length || 0}</strong>
          <p>進行中主線。每天先看這裡，再進入各 Sheet 補細節。</p>
        </div>
        <div className="lifeMetric" style={{ background: theme.surface, borderColor: theme.line }}>
          <span>待辦</span>
          <strong>{openTasks}</strong>
        </div>
        <div className="lifeMetric" style={{ background: theme.surface, borderColor: theme.line }}>
          <span>店家追蹤</span>
          <strong>{crmFollowups}</strong>
        </div>
        <div className="lifeMetric" style={{ background: theme.surface, borderColor: theme.line }}>
          <span>財務項目</span>
          <strong>{financeRows.length}</strong>
        </div>
      </section>
      <section className="sheetTabs" style={{ background: theme.surface, borderColor: theme.line }}>
        {sheets.map((sheet) => (
          <button key={sheet.id} className={sheet.id === activeSheetId ? 'active' : ''} onClick={() => setActiveSheetId(sheet.id)}>
            {sheet.name}
          </button>
        ))}
      </section>
      <section className="sheetPanel" style={{ background: theme.surface, borderColor: theme.line }}>
        <div className="sheetHead">
          <div>
            <span>Sheet</span>
            <h2>{activeSheet.name}</h2>
            <p>{activeSheet.subtitle}</p>
          </div>
          <button className="saveButton" onClick={addRow}>新增一列</button>
        </div>
        <div className="sheetTableWrap">
          <table className="sheetTable">
            <thead>
              <tr>{activeSheet.columns.map((column) => <th key={column}>{column}</th>)}</tr>
            </thead>
            <tbody>
              {activeSheet.rows.map((row, rowIndex) => (
                <tr key={`${activeSheet.id}-${rowIndex}`}>
                  {activeSheet.columns.map((column, colIndex) => (
                    <td key={column}>
                      <input value={row[colIndex] || ''} onChange={(event) => updateCell(rowIndex, colIndex, event.target.value)} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function useLifeOS() {
  const [sheets, setSheetsState] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(LIFE_OS_KEY) || '[]');
      return saved.length ? saved : LIFE_SHEETS;
    } catch {
      return LIFE_SHEETS;
    }
  });
  const setSheets = (next) => {
    setSheetsState((prev) => {
      const value = typeof next === 'function' ? next(prev) : next;
      localStorage.setItem(LIFE_OS_KEY, JSON.stringify(value));
      return value;
    });
  };
  return [sheets, setSheets];
}

function countStatus(sheet, statuses) {
  if (!sheet) return 0;
  return sheet.rows.filter((row) => row.some((cell) => statuses.includes(cell))).length;
}

function RatioBoard({ theme }) {
  const [records] = useDailyRecords();
  const totals = summarizeRecords(records);
  const rows = ratioRowsFromTotals(totals);
  return (
    <div className="boardLayout trackingBoard">
      <BoardHeader kicker="近 7 筆手動紀錄" title="時間比例總覽" theme={theme} />
      <section className="ratioHero" style={{ background: theme.surface, borderColor: theme.line }}>
        <div>
          <span>深度 + 技能</span>
          <strong>{(totals.deep + totals.growth).toFixed(1)}h</strong>
          <p>這是最直接對標長期能力的時間。每天不需要完美，但要讓它連續出現。</p>
        </div>
        <StackedBar rows={rows} />
      </section>
      <RatioRows theme={theme} rows={rows} />
      <section className="measurementPlan" style={{ background: theme.surface, borderColor: theme.line }}>
        <h2>下一步測量設計</h2>
        <p>先用 Google 日曆抓計畫，再用每日追蹤校正實際發生。之後可以接 Toggl / Apple Health / Screen Time，把準度從「估計」推到「半自動」。</p>
      </section>
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
      <CheckCircle2 color={theme.accent} size={28} />
    </header>
  );
}

function SourceQuality({ theme }) {
  const sources = [
    { label: 'Google 日曆', value: '計畫/事件', confidence: 72, color: theme.align },
    { label: '每日校正', value: '實際時數', confidence: 92, color: theme.accent },
    { label: '電腦/手機活動', value: '待串接', confidence: 0, color: theme.inkMute },
    { label: '健康資料', value: '待串接', confidence: 0, color: theme.focus },
  ];
  return (
    <section className="sourceGrid">
      {sources.map((source) => (
        <div key={source.label} className="sourceCard" style={{ background: theme.surface, borderColor: theme.line }}>
          <span>{source.label}</span>
          <strong>{source.value}</strong>
          <div className="progressLine"><i style={{ width: `${source.confidence}%`, background: source.color }} /></div>
        </div>
      ))}
    </section>
  );
}

function RatioRows({ theme, rows }) {
  return (
    <section className="targetRows">
      {rows.map((row) => (
        <div className="targetRow" key={row.label} style={{ background: theme.surface, borderColor: theme.line }}>
          <Target size={17} color={row.color} />
          <span>{row.label}</span>
          <strong>{row.hours.toFixed(1)}h</strong>
          <small>{row.percent.toFixed(0)}%</small>
          <div className="progressLine"><i style={{ width: `${Math.min(100, row.percent)}%`, background: row.color }} /></div>
        </div>
      ))}
    </section>
  );
}

function WeeklyPlanPanel({ theme, onAddCalendarBlock }) {
  const [plan, setPlan] = useWeeklyPlan();
  const weekStart = getNextMonday();

  function updatePlanItem(id, key, value) {
    setPlan((prev) => prev.map((item) => item.id === id ? { ...item, [key]: value } : item));
  }

  function addPlanItem() {
    setPlan((prev) => [
      ...prev,
      { id: `plan-${Date.now()}`, dayOffset: 0, start: '20:00', end: '21:00', title: '新的專注時段' },
    ]);
  }

  function removePlanItem(id) {
    setPlan((prev) => prev.filter((item) => item.id !== id));
  }

  function pushToCalendarText() {
    const lines = plan.map((item) => {
      const start = dateFromWeekPlan(weekStart, item.dayOffset, item.start);
      const end = dateFromWeekPlan(weekStart, item.dayOffset, item.end);
      return `${item.title},${formatDateTime(start)},${formatDateTime(end)}`;
    }).join('\n');
    onAddCalendarBlock(lines);
  }

  function exportICS() {
    const ics = buildPlanICS(plan, weekStart);
    downloadTextFile('time-panel-week-plan.ics', ics, 'text/calendar;charset=utf-8');
  }

  return (
    <section className="weeklyPlanPanel" style={{ background: theme.surface, borderColor: theme.line }}>
      <div className="trackerHead">
        <div>
          <span>下週設計</span>
          <h2>先保護最重要的時間</h2>
        </div>
        <div className="weeklyPlanActions">
          <button className="miniTextButton" onClick={addPlanItem}>新增</button>
          <button className="miniTextButton" onClick={pushToCalendarText}>套用到面板</button>
          <button className="saveButton" onClick={exportICS}>
            <Save size={16} />
            匯出 .ics
          </button>
        </div>
      </div>
      <div className="weeklyPlanTable">
        {plan.map((item) => (
          <div className="weeklyPlanRow" key={item.id}>
            <select value={item.dayOffset} onChange={(event) => updatePlanItem(item.id, 'dayOffset', Number(event.target.value))}>
              {['一', '二', '三', '四', '五', '六', '日'].map((day, index) => <option key={day} value={index}>週{day}</option>)}
            </select>
            <input type="time" value={item.start} onChange={(event) => updatePlanItem(item.id, 'start', event.target.value)} />
            <input type="time" value={item.end} onChange={(event) => updatePlanItem(item.id, 'end', event.target.value)} />
            <input value={item.title} onChange={(event) => updatePlanItem(item.id, 'title', event.target.value)} />
            <button className="miniTextButton" onClick={() => removePlanItem(item.id)}>刪除</button>
          </div>
        ))}
      </div>
      <p className="syncHint">匯出的 .ics 可匯入 Google Calendar。之後若接 OAuth，就能改成一鍵寫入。</p>
    </section>
  );
}

function LongTermBoard({ theme }) {
  const [records] = useDailyRecords();
  const raw = localStorage.getItem(CALENDAR_RAW_KEY) || SAMPLE_CALENDAR_TEXT;
  const events = useMemo(() => parseCalendarText(raw), [raw]);
  const model = useMemo(() => buildLongTermModel(events, records), [events, records]);
  return (
    <div className="boardLayout trackingBoard">
      <BoardHeader kicker="週 / 月 / 90 天" title="長期時間羅盤" theme={theme} />
      <section className="longHero" style={{ background: theme.surface, borderColor: theme.line }}>
        <div>
          <span>長期能力時間</span>
          <strong>{model.totalFocus.toFixed(1)}h</strong>
          <p>{model.summary}</p>
        </div>
        <div className="trajectory">
          {model.trend.map((day) => (
            <i key={day.label} style={{ height: `${Math.max(8, day.focus * 12)}px`, background: day.focus >= 1 ? theme.accent : theme.line }} title={`${day.label} ${day.focus.toFixed(1)}h`} />
          ))}
        </div>
      </section>
      <section className="horizonGrid">
        {model.horizons.map((horizon) => (
          <div key={horizon.label} className="horizonCard" style={{ background: theme.surface, borderColor: theme.line }}>
            <span>{horizon.label}</span>
            <strong>{horizon.focus.toFixed(1)}h</strong>
            <p>{horizon.caption}</p>
            <div className="progressLine"><i style={{ width: `${Math.min(100, horizon.progress)}%`, background: horizon.color }} /></div>
          </div>
        ))}
      </section>
      <section className="longSplit">
        <div className="longPanel" style={{ background: theme.surface, borderColor: theme.line }}>
          <h2>本月比例</h2>
          <RatioRows theme={theme} rows={model.monthRows} />
        </div>
        <div className="longPanel" style={{ background: theme.surface, borderColor: theme.line }}>
          <h2>下個調整</h2>
          {model.actions.map((action) => <p key={action}>{action}</p>)}
        </div>
      </section>
    </div>
  );
}

function DailyTracker({ theme, records, setRecords, analysis }) {
  const today = new Date().toISOString().slice(0, 10);
  const existing = records.find((record) => record.date === today);
  const defaults = existing || {
    date: today,
    deep: valueFor(analysis.rows, '深度創作'),
    growth: valueFor(analysis.rows, '學習技能'),
    body: valueFor(analysis.rows, '身體維護'),
    work: valueFor(analysis.rows, '工作'),
    rest: valueFor(analysis.rows, '休息睡眠'),
    life: valueFor(analysis.rows, '生活社交'),
    note: '',
  };
  const [draft, setDraft] = useState(defaults);
  const lastSeven = latestRecords(records, 7);
  const weeklyTotal = lastSeven.reduce((sum, record) => sum + Number(record.deep || 0) + Number(record.growth || 0), 0);

  function update(key, value) {
    setDraft((prev) => ({ ...prev, [key]: value }));
  }

  function save() {
    const cleaned = normalizeRecord(draft);
    setRecords((prev) => {
      const withoutSameDate = prev.filter((record) => record.date !== cleaned.date);
      return [...withoutSameDate, cleaned].sort((a, b) => a.date.localeCompare(b.date));
    });
  }

  return (
    <section className="dailyTracker" style={{ background: theme.surface, borderColor: theme.line }}>
      <div className="trackerHead">
        <div>
          <span>每日校正</span>
          <h2>今天實際發生了什麼</h2>
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
      <textarea className="noteInput" value={draft.note} onChange={(event) => update('note', event.target.value)} placeholder="今天的能量、卡點、明天要保護的時間..." />
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
      <input type="number" min="0" step="0.25" value={value} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}

function TweaksPanel({ theme, palette, setPalette, view, setView, zoom, setZoom }) {
  return (
    <aside className="tweaks" style={{ background: theme.surface, borderColor: theme.line }}>
      <div className="tweakHead">
        <strong>面板調整</strong>
        <Zap size={17} color={theme.accent} />
      </div>
      <label className="field">
        <span>畫面</span>
        <select value={view} onChange={(event) => setView(event.target.value)}>
          <option value="calendar">日曆校正</option>
          <option value="ops">行事曆總控</option>
          <option value="ratio">比例總覽</option>
          <option value="longterm">週月長期</option>
        </select>
      </label>
      <div className="field">
        <span>色票</span>
        <div className="paletteGrid">
          {Object.entries(PALETTES).map(([key, p]) => (
            <button key={key} className={palette === key ? 'swatch active' : 'swatch'} title={p.name} onClick={() => setPalette(key)}>
              <i style={{ background: p.accent }} />
              <i style={{ background: p.focus }} />
              <i style={{ background: p.align }} />
            </button>
          ))}
        </div>
      </div>
      <label className="field">
        <span>畫布縮放 {zoom}%</span>
        <input type="range" min="58" max="112" value={zoom} onChange={(event) => setZoom(Number(event.target.value))} />
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

function StackedBar({ rows }) {
  return (
    <div className="stackedBar">
      {rows.map((row) => <i key={row.label} style={{ width: `${Math.max(4, row.percent)}%`, background: row.color }} title={`${row.label} ${row.percent.toFixed(0)}%`} />)}
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

function useWeeklyPlan() {
  const [plan, setPlanState] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(WEEKLY_PLAN_KEY) || '[]');
      return saved.length ? saved : defaultWeeklyPlan();
    } catch {
      return defaultWeeklyPlan();
    }
  });
  const setPlan = (next) => {
    setPlanState((prev) => {
      const value = typeof next === 'function' ? next(prev) : next;
      localStorage.setItem(WEEKLY_PLAN_KEY, JSON.stringify(value));
      return value;
    });
  };
  return [plan, setPlan];
}

function defaultWeeklyPlan() {
  return [
    { id: 'ai-mon', dayOffset: 0, start: '07:30', end: '08:30', title: 'AI 專注時段' },
    { id: 'dance-tue', dayOffset: 1, start: '19:30', end: '20:30', title: '舞蹈訓練' },
    { id: 'guitar-fri', dayOffset: 4, start: '20:00', end: '21:30', title: '練吉他錄音' },
    { id: 'review-sun', dayOffset: 6, start: '21:30', end: '22:00', title: '週回顧與下週排程' },
  ];
}

function parseCalendarText(raw) {
  return raw.split('\n').map((line) => line.trim()).filter(Boolean).map((line) => {
    const [title = '未命名', start = '', end = ''] = line.split(',').map((part) => part.trim());
    const startDate = new Date(start.replace(' ', 'T'));
    const endDate = new Date(end.replace(' ', 'T'));
    const hours = Number.isFinite(endDate - startDate) ? Math.max(0, (endDate - startDate) / 36e5) : 0;
    return { title, start: startDate, end: endDate, date: isoDate(startDate), hours, category: inferCategory(title) };
  }).filter((event) => event.hours > 0);
}

function parseICS(text) {
  const normalized = String(text || '').replace(/\r\n/g, '\n').replace(/\n[ \t]/g, '');
  const events = [];
  let current = null;
  for (const line of normalized.split('\n')) {
    if (line === 'BEGIN:VEVENT') {
      current = {};
      continue;
    }
    if (line === 'END:VEVENT') {
      if (current?.summary && current?.start && current?.end) events.push(current);
      current = null;
      continue;
    }
    if (!current) continue;
    const sep = line.indexOf(':');
    if (sep < 0) continue;
    const rawKey = line.slice(0, sep);
    const value = line.slice(sep + 1);
    const key = rawKey.split(';')[0];
    if (key === 'SUMMARY') current.summary = unescapeICS(value);
    if (key === 'DTSTART') current.start = parseICSDate(value);
    if (key === 'DTEND') current.end = parseICSDate(value);
    if (key === 'RRULE') current.rrule = value;
  }
  const expanded = expandICSEvents(events);
  return expanded.map((event) => `${event.summary},${formatDateTime(event.start)},${formatDateTime(event.end)}`).join('\n');
}

function parseICSDate(value) {
  const clean = String(value || '').trim();
  const match = clean.match(/^(\d{4})(\d{2})(\d{2})(?:T(\d{2})(\d{2})(\d{2})?)?(Z)?$/);
  if (!match) return null;
  const [, year, month, day, hour = '00', minute = '00', second = '00', z] = match;
  if (z) return new Date(Date.UTC(Number(year), Number(month) - 1, Number(day), Number(hour), Number(minute), Number(second)));
  return new Date(Number(year), Number(month) - 1, Number(day), Number(hour), Number(minute), Number(second));
}

function expandICSEvents(events) {
  const startWindow = startOfDay(addDays(new Date(), -14));
  const endWindow = endOfDay(addDays(new Date(), 30));
  const out = [];
  for (const event of events) {
    const duration = event.end - event.start;
    if (!Number.isFinite(duration) || duration <= 0) continue;
    if (!event.rrule) {
      if (event.start >= startWindow && event.start <= endWindow) out.push(event);
      continue;
    }
    const rule = parseRRule(event.rrule);
    const freq = rule.FREQ;
    const interval = Number(rule.INTERVAL || 1);
    const until = rule.UNTIL ? parseICSDate(rule.UNTIL) : endWindow;
    const count = Number(rule.COUNT || 500);
    let cursor = new Date(event.start);
    let seen = 0;
    while (cursor <= endWindow && cursor <= until && seen < count) {
      if (cursor >= startWindow) out.push({ ...event, start: new Date(cursor), end: new Date(cursor.getTime() + duration), rrule: null });
      if (freq === 'DAILY') cursor = addDays(cursor, interval);
      else if (freq === 'WEEKLY') cursor = addDays(cursor, 7 * interval);
      else break;
      seen += 1;
    }
  }
  return out.sort((a, b) => a.start - b.start);
}

function parseRRule(value) {
  return String(value || '').split(';').reduce((acc, part) => {
    const [key, val] = part.split('=');
    if (key && val) acc[key] = val;
    return acc;
  }, {});
}

function unescapeICS(value) {
  return String(value || '').replace(/\\n/g, ' ').replace(/\\,/g, ',').replace(/\\;/g, ';').replace(/\\\\/g, '\\');
}

function addDays(date, days) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function startOfDay(date) {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
}

function endOfDay(date) {
  const next = new Date(date);
  next.setHours(23, 59, 59, 999);
  return next;
}

function inferCategory(title) {
  const text = title.toLowerCase();
  if (/上班|工作|meeting|會議|收款|補貨/.test(text)) return 'work';
  if (/flow|ai|文案|拍照|整理|創作|輸出/.test(text)) return 'deep';
  if (/吉他|看書|課|學|練舞|bachata|lv/.test(text)) return 'growth';
  if (/健身|跑步|腳|運動/.test(text)) return 'body';
  if (/睡|休息/.test(text)) return 'rest';
  return 'life';
}

function analyzeCalendar(events, records) {
  const totals = events.reduce((acc, event) => {
    acc[event.category] = (acc[event.category] || 0) + event.hours;
    return acc;
  }, {});
  const totalHours = Object.values(totals).reduce((sum, value) => sum + value, 0) || 1;
  const focus = (totals.deep || 0) + (totals.growth || 0);
  const correctedDays = latestRecords(records, 7).length;
  const score = Math.round(Math.min(100, 52 + focus * 7 + (totals.body || 0) * 5 + correctedDays * 3 - Math.max(0, (totals.work || 0) - 9) * 2));
  const rows = ratioRowsFromTotals(totals, totalHours);
  return {
    score,
    rows,
    headline: focus >= 3 ? '今天有對到長期能力' : '今天還缺一塊深度輸出',
    note: `已解析 ${events.length} 筆行程。準度會隨每日校正增加，目前近 7 筆已有 ${correctedDays} 筆手動紀錄。`,
    insights: [
      `深度創作 + 學習技能合計 ${focus.toFixed(1)} 小時，是最直接對標長期能力的區塊。`,
      (totals.body || 0) >= 1 ? '身體維護有出現，這會讓晚間輸出比較穩。' : '今天沒有身體維護紀錄，可以補一個 20 到 30 分鐘低門檻區塊。',
      (totals.work || 0) > 8 ? '工作占用偏高，晚間最好只保護一件最重要的輸出。' : '工作占用尚可，可以安排一段完整創作時間。',
    ],
  };
}

function ratioRowsFromTotals(totals, totalOverride) {
  const total = totalOverride || Object.values(totals).reduce((sum, value) => sum + Number(value || 0), 0) || 1;
  return [
    { key: 'deep', label: '深度創作', hours: Number(totals.deep || 0), color: '#d96c4a' },
    { key: 'growth', label: '學習技能', hours: Number(totals.growth || 0), color: '#5d87a8' },
    { key: 'body', label: '身體維護', hours: Number(totals.body || 0), color: '#7aa27a' },
    { key: 'work', label: '工作', hours: Number(totals.work || 0), color: '#c6a255' },
    { key: 'rest', label: '休息睡眠', hours: Number(totals.rest || 0), color: '#8b8f98' },
    { key: 'life', label: '生活社交', hours: Number(totals.life || 0), color: '#9b7aa5' },
  ].map((row) => ({ ...row, percent: (row.hours / total) * 100 }));
}

function summarizeRecords(records) {
  return latestRecords(records, 7).reduce((acc, record) => {
    ['deep', 'growth', 'body', 'work', 'rest', 'life'].forEach((key) => {
      acc[key] = (acc[key] || 0) + Number(record[key] || 0);
    });
    return acc;
  }, { deep: 0, growth: 0, body: 0, work: 0, rest: 0, life: 0 });
}

function buildLongTermModel(events, records) {
  const today = startOfDay(new Date());
  const eventRecords = events.map((event) => ({
    date: event.date,
    deep: event.category === 'deep' ? event.hours : 0,
    growth: event.category === 'growth' ? event.hours : 0,
    body: event.category === 'body' ? event.hours : 0,
    work: event.category === 'work' ? event.hours : 0,
    rest: event.category === 'rest' ? event.hours : 0,
    life: event.category === 'life' ? event.hours : 0,
  }));
  const manualByDate = new Map(records.map((record) => [record.date, normalizeRecord(record)]));
  const eventByDate = groupRecordsByDate(eventRecords);
  const dates = new Set([...manualByDate.keys(), ...eventByDate.keys()]);
  const merged = [...dates].map((date) => manualByDate.get(date) || eventByDate.get(date)).filter(Boolean);
  const week = filterSince(merged, addDays(today, -6));
  const month = filterSince(merged, addDays(today, -29));
  const quarter = filterSince(merged, addDays(today, -89));
  const weekTotals = sumRecordList(week);
  const monthTotals = sumRecordList(month);
  const quarterTotals = sumRecordList(quarter);
  const totalFocus = (quarterTotals.deep || 0) + (quarterTotals.growth || 0);
  const trend = Array.from({ length: 14 }, (_, index) => {
    const date = addDays(today, index - 13);
    const key = isoDate(date);
    const item = manualByDate.get(key) || eventByDate.get(key) || {};
    return { label: key.slice(5), focus: Number(item.deep || 0) + Number(item.growth || 0) };
  });
  const horizons = [
    makeHorizon('本週', weekTotals, 6, '#d96c4a'),
    makeHorizon('本月', monthTotals, 24, '#5d87a8'),
    makeHorizon('90 天', quarterTotals, 72, '#7aa27a'),
  ];
  const monthRows = ratioRowsFromTotals(monthTotals);
  const focusMonth = Number(monthTotals.deep || 0) + Number(monthTotals.growth || 0);
  return {
    totalFocus,
    trend,
    horizons,
    monthRows,
    summary: focusMonth >= 24 ? '本月長期能力時間已經有厚度，接下來要看穩定性。' : '本月長期能力時間還不夠厚，先把每週固定輸出時段保護起來。',
    actions: [
      focusMonth < 24 ? '本週先補 2 個 60 到 90 分鐘的深度創作區塊。' : '維持目前節奏，避免把高品質時段切碎。',
      (monthTotals.body || 0) < 8 ? '身體維護偏少，建議固定兩個低門檻運動時段。' : '身體維護有穩住，可以用它支撐晚間輸出。',
      records.length < 7 ? '每日校正資料還少，連續記 7 天後長期判讀會更準。' : '已有手動校正資料，可以開始看每週趨勢而不是單日情緒。',
    ],
  };
}

function makeHorizon(label, totals, target, color) {
  const focus = Number(totals.deep || 0) + Number(totals.growth || 0);
  return {
    label,
    focus,
    progress: target ? (focus / target) * 100 : 0,
    color,
    caption: `${focus.toFixed(1)} / ${target}h 長期能力時間`,
  };
}

function groupRecordsByDate(records) {
  const map = new Map();
  for (const record of records) {
    const prev = map.get(record.date) || { date: record.date, deep: 0, growth: 0, body: 0, work: 0, rest: 0, life: 0 };
    ['deep', 'growth', 'body', 'work', 'rest', 'life'].forEach((key) => {
      prev[key] += Number(record[key] || 0);
    });
    map.set(record.date, prev);
  }
  return map;
}

function filterSince(records, since) {
  const sinceKey = isoDate(since);
  return records.filter((record) => record.date >= sinceKey);
}

function sumRecordList(records) {
  return records.reduce((acc, record) => {
    ['deep', 'growth', 'body', 'work', 'rest', 'life'].forEach((key) => {
      acc[key] = (acc[key] || 0) + Number(record[key] || 0);
    });
    return acc;
  }, { deep: 0, growth: 0, body: 0, work: 0, rest: 0, life: 0 });
}

function latestRecords(records, limit) {
  return [...records].sort((a, b) => b.date.localeCompare(a.date)).slice(0, limit);
}

function normalizeRecord(record) {
  return {
    ...record,
    deep: Number(record.deep || 0),
    growth: Number(record.growth || 0),
    body: Number(record.body || 0),
    work: Number(record.work || 0),
    rest: Number(record.rest || 0),
    life: Number(record.life || 0),
  };
}

function valueFor(rows, label) {
  return Number((rows.find((row) => row.label === label)?.hours || 0).toFixed(1));
}

function isoDate(date) {
  const pad = (value) => String(value).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function getNextMonday() {
  const date = new Date();
  const day = date.getDay();
  const offset = day === 0 ? 1 : 8 - day;
  date.setDate(date.getDate() + offset);
  date.setHours(0, 0, 0, 0);
  return date;
}

function dateFromWeekPlan(weekStart, dayOffset, time) {
  const [hour, minute] = time.split(':').map(Number);
  const date = new Date(weekStart);
  date.setDate(date.getDate() + Number(dayOffset || 0));
  date.setHours(hour || 0, minute || 0, 0, 0);
  return date;
}

function formatDateTime(date) {
  const pad = (value) => String(value).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function buildPlanICS(plan, weekStart) {
  const stamp = formatICSDate(new Date());
  const events = plan.map((item) => {
    if (!item.title || !item.start || !item.end) return '';
    const start = dateFromWeekPlan(weekStart, item.dayOffset, item.start);
    let end = dateFromWeekPlan(weekStart, item.dayOffset, item.end);
    if (end <= start) {
      end = new Date(end);
      end.setDate(end.getDate() + 1);
    }
    return [
      'BEGIN:VEVENT',
      `UID:${item.id}-${formatICSDate(start)}@time-panel`,
      `DTSTAMP:${stamp}`,
      `DTSTART:${formatICSDate(start)}`,
      `DTEND:${formatICSDate(end)}`,
      `SUMMARY:${escapeICS(item.title)}`,
      `DESCRIPTION:${escapeICS('由時間對標面板週表匯出')}`,
      'END:VEVENT',
    ].join('\r\n');
  }).filter(Boolean);
  return ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Time Panel//Weekly Plan//ZH-TW', 'CALSCALE:GREGORIAN', ...events, 'END:VCALENDAR'].join('\r\n');
}

function formatICSDate(date) {
  const pad = (value) => String(value).padStart(2, '0');
  return `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}T${pad(date.getHours())}${pad(date.getMinutes())}00`;
}

function escapeICS(text) {
  return String(text || '').replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/,/g, '\\,').replace(/;/g, '\\;');
}

function downloadTextFile(filename, content, type) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

createRoot(document.getElementById('root')).render(<App />);
