import { useState, useMemo, createContext, useContext, type ReactNode } from 'react';
import { createFileRoute } from '@tanstack/react-router';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  ComposedChart,
} from 'recharts';
import { housingData } from '@/data/housingData';
import { mrotData } from '@/data/mrotMoscow';

const WageCtx = createContext('Зарплата');

export const Route = createFileRoute('/')({
  head: () => ({
    meta: [
      { title: 'Доступность жилья в России · 2000–2026' },
      {
        name: 'description',
        content:
          'Интерактивная визуализация рынка недвижимости и доходов населения России за 2000–2026 годы: зарплата, цена м², аренда и доступность жилья.',
      },
      { property: 'og:type', content: 'website' },
      { property: 'og:title', content: 'Доступность жилья в России · 2000–2026' },
      {
        property: 'og:description',
        content:
          'Интерактивная визуализация рынка недвижимости и доходов населения России за 2000–2026 годы.',
      },
      { name: 'twitter:card', content: 'summary' },
    ],
  }),
  component: App,
});

const allYears = Array.from({ length: 27 }, (_, i) => 2000 + i);

const formatNumber = (value: number) => new Intl.NumberFormat('ru-RU').format(value);

const formatCurrency = (value: number) => {
  if (value >= 1000000) return `${(value / 1000000).toFixed(1)} млн`;
  if (value >= 1000) return `${(value / 1000).toFixed(0)} тыс`;
  return value.toString();
};

const monthNames = ['Янв','Фев','Мар','Апр','Май','Июн','Июл','Авг','Сен','Окт','Ноя','Дек'];

const formatMonthTick = (value: string): string => {
  // Метка показывается только на январских тиках — выводим год (2001, 2002, ...)
  const [year, month] = value.split('-');
  if (month && parseInt(month) === 1) return year ?? '';
  return '';
};

// Метки оси X: январь каждого года (при длинном периоде — через каждые ~3 года, чтобы не сливались)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const yearTicks = (data: any[]) => {
  const yearsWithData = [...new Set(data.map((d) => d.month.split('-')[0]))];
  const step = yearsWithData.length > 15 ? 3 : yearsWithData.length > 8 ? 2 : 1;
  const ticks: string[] = [];
  let lastYear = -1;
  for (const d of data) {
    const [yStr, mStr] = d.month.split('-');
    const y = parseInt(yStr);
    if (parseInt(mStr) === 1 && (y - lastYear) >= step) {
      ticks.push(d.month);
      lastYear = y;
    }
  }
  return ticks;
};

type ChartType = 'salary-price' | 'rent' | 'affordability' | 'rent-share' | 'combined' | 'apartment-cost';

function App() {
  const [startYear, setStartYear] = useState(2000);
  const [endYear, setEndYear] = useState(2026);
  const [activeChart, setActiveChart] = useState<ChartType>('salary-price');
  const [section, setSection] = useState<'salary' | 'mrot'>('salary');
  const isMrot = section === 'mrot';
  const minYear = isMrot ? 2010 : 2000;
  const wl = isMrot ? 'МРОТ' : 'Зарплата';
  const years = allYears.filter((y) => y >= minYear);
  const s0 = Math.max(startYear, minYear);
  const e0 = Math.max(endYear, s0);

  const filteredData = useMemo(() => {
    return (isMrot ? mrotData : housingData).filter((d) => {
      const year = parseInt(d.month.split('-')[0] ?? '0');
      return year >= s0 && year <= e0;
    });
  }, [s0, e0, isMrot]);

  const chartTabs: { id: ChartType; label: string }[] = [
    { id: 'salary-price', label: isMrot ? 'МРОТ и цена за м²' : 'Зарплата и цена м²' },
    { id: 'rent', label: isMrot ? 'МРОТ и аренда' : 'Зарплата и аренда' },
    { id: 'affordability', label: 'Доступность' },
    { id: 'rent-share', label: 'Доля аренды' },
    { id: 'apartment-cost', label: 'Стоимость 54 м²' },
    { id: 'combined', label: 'Сводный' },
  ];

  const latest = filteredData[filteredData.length - 1];
  const first = filteredData[0];
  const salaryGrowth = latest && first ? ((latest.salary / first.salary - 1) * 100).toFixed(0) : '0';
  const priceGrowth = latest && first ? ((latest.pricePerSqm / first.pricePerSqm - 1) * 100).toFixed(0) : '0';

  const presets = [
    ...(isMrot ? [{ label: '2010–2026', s: 2010, e: 2026 }] : [{ label: '2000–2026', s: 2000, e: 2026 }]),
    { label: '2010–2020', s: 2010, e: 2020 },
    { label: '2020–2026', s: 2020, e: 2026 },
  ];
  const selectCls = 'appearance-none bg-muted rounded-lg py-1.5 px-3 text-sm font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-ring cursor-pointer';

  return (
    <div className="min-h-screen bg-background text-foreground font-sans">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[420px] bg-[image:var(--gradient-hero)]" />
      <div className="relative max-w-6xl mx-auto px-5 py-10 md:py-14">
        {/* Header */}
        <header className="mb-10 flex flex-col md:flex-row md:items-end md:justify-between gap-6">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-card/70 backdrop-blur px-3 py-1 text-xs font-medium text-muted-foreground shadow-[var(--shadow-soft)]">
              <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
              {minYear}–2026 · помесячные данные
            </span>
            <h1 className="mt-4 font-display text-4xl md:text-5xl font-semibold tracking-tight leading-[1.05]">
              Доступность жилья<br /><span className="text-primary">в Москве</span>
            </h1>
          </div>
          <div className="inline-flex p-1 rounded-2xl bg-card shadow-[var(--shadow-soft)] self-start md:self-auto">
            {([
              { id: 'salary', label: 'Средняя заработная плата' },
              { id: 'mrot', label: 'МРОТ (Москва)' },
            ] as const).map((t) => (
              <button
                key={t.id}
                onClick={() => setSection(t.id)}
                className={`px-4 py-2 text-sm font-medium rounded-xl transition-all ${
                  section === t.id ? 'bg-foreground text-background shadow-sm' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </header>

        {/* Controls */}
        <div className="flex flex-wrap items-center gap-3 mb-6 rounded-2xl bg-card p-3 shadow-[var(--shadow-soft)]">
          <div className="flex items-center gap-2 text-sm pl-1">
            <span className="text-muted-foreground">Период</span>
            <select value={s0} onChange={(e) => setStartYear(Number(e.target.value))} className={selectCls}>
              {years.map((y) => <option key={y} value={y}>{y}</option>)}
            </select>
            <span className="text-muted-foreground">—</span>
            <select value={e0} onChange={(e) => setEndYear(Number(e.target.value))} className={selectCls}>
              {years.map((y) => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
          <div className="flex flex-wrap gap-1.5 ml-auto">
            {presets.map((p) => {
              const on = s0 === p.s && e0 === p.e;
              return (
                <button
                  key={p.label}
                  onClick={() => { setStartYear(p.s); setEndYear(p.e); }}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${on ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:text-foreground'}`}
                >
                  {p.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6">
          <StatItem label={wl} value={`${formatNumber(latest?.salary || 0)} ₽`} sub={`+${salaryGrowth}%`} color={C.blue} spark={filteredData.map((d) => d.salary)} />
          <StatItem label="Цена м²" value={`${formatNumber(latest?.pricePerSqm || 0)} ₽`} sub={`+${priceGrowth}%`} color={C.coral} spark={filteredData.map((d) => d.pricePerSqm)} />
          <StatItem label="Аренда 1к" value={`${formatNumber(latest?.rent1room || 0)} ₽`} sub={`${latest?.rentShareOfSalary || 0}% от ${wl}`} color={C.green} spark={filteredData.map((d) => d.rent1room)} />
          <StatItem label="Доступность" value={`${latest?.yearsToBuy || 0} лет`} sub="квартира 54 м²" color={C.lavender} spark={filteredData.map((d) => d.yearsToBuy)} />
        </div>

        {/* Chart card */}
        <section className="mb-6 rounded-3xl bg-card p-4 md:p-7 shadow-[var(--shadow-soft)]">
          <nav className="flex gap-1 mb-6 overflow-x-auto -mx-1 px-1 pb-1">
            {chartTabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveChart(tab.id)}
                className={`shrink-0 px-3.5 py-2 text-sm font-medium rounded-xl transition-colors ${
                  activeChart === tab.id ? 'bg-accent text-accent-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
          <WageCtx.Provider value={wl}>
            {activeChart === 'salary-price' && <SalaryPriceChart data={filteredData} />}
            {activeChart === 'rent' && <RentChart data={filteredData} />}
            {activeChart === 'affordability' && <AffordabilityChart data={filteredData} />}
            {activeChart === 'rent-share' && <RentShareChart data={filteredData} />}
            {activeChart === 'apartment-cost' && <ApartmentCostChart data={filteredData} />}
            {activeChart === 'combined' && <CombinedChart data={filteredData} />}
          </WageCtx.Provider>
        </section>

        {/* Table */}
        <section className="mb-10 rounded-3xl bg-card shadow-[var(--shadow-soft)] overflow-hidden">
          <h2 className="font-display text-lg font-semibold px-5 md:px-7 pt-5 pb-4">
            Данные <span className="text-muted-foreground font-normal">· помесячно</span>
          </h2>
          <div className="overflow-x-auto max-h-[480px] overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-muted text-muted-foreground text-xs uppercase tracking-wider">
                <tr>
                  <th className="text-left py-2.5 px-5 font-medium">Месяц</th>
                  <th className="text-right py-2.5 px-3 font-medium">{isMrot ? 'МРОТ' : 'ЗП'}, ₽</th>
                  <th className="text-right py-2.5 px-3 font-medium">Цена м², ₽</th>
                  <th className="text-right py-2.5 px-3 font-medium">Аренда, ₽</th>
                  <th className="text-right py-2.5 px-3 font-medium">54 м², млн</th>
                  <th className="text-right py-2.5 px-3 font-medium">Лет</th>
                  <th className="text-right py-2.5 px-3 font-medium">Аренда/ЗП</th>
                  <th className="text-right py-2.5 px-5 font-medium">м²/ЗП</th>
                </tr>
              </thead>
              <tbody>
                {filteredData.map((d) => {
                  const [y, m] = d.month.split('-');
                  return (
                    <tr key={d.month} className="border-t border-border hover:bg-muted/60 transition-colors">
                      <td className="py-2 px-5 text-muted-foreground">{monthNames[parseInt(m ?? '1')-1]} {y}</td>
                      <td className="py-2 px-3 text-right tabular-nums">{formatNumber(d.salary)}</td>
                      <td className="py-2 px-3 text-right tabular-nums">{formatNumber(d.pricePerSqm)}</td>
                      <td className="py-2 px-3 text-right tabular-nums">{formatNumber(d.rent1room)}</td>
                      <td className="py-2 px-3 text-right tabular-nums">{(d.apartmentCost54 / 1000000).toFixed(2)}</td>
                      <td className="py-2 px-3 text-right tabular-nums">{d.yearsToBuy}</td>
                      <td className="py-2 px-3 text-right tabular-nums">{d.rentShareOfSalary}%</td>
                      <td className="py-2 px-5 text-right tabular-nums">{d.sqmToSalary}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        <footer className="text-xs text-muted-foreground text-center">
          <p>Квартира 54 м² · доступность = стоимость / (зарплата × 12){isMrot ? ' · МРОТ в Москве: clubtk.ru' : ''}</p>
        </footer>
      </div>
    </div>
  );
}

function StatItem({ label, value, sub, color, spark }: { label: string; value: string; sub: string; color: string; spark: number[] }) {
  return (
    <div className="group relative rounded-2xl bg-card p-4 md:p-5 shadow-[var(--shadow-soft)] transition-transform hover:-translate-y-0.5">
      <div className="flex items-center gap-2 mb-2">
        <span className="h-2 w-2 rounded-full" style={{ background: color }} />
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{label}</p>
      </div>
      <p className="font-display text-xl md:text-2xl font-semibold tabular-nums">{value}</p>
      <p className="mt-1 inline-block rounded-md px-1.5 py-0.5 text-xs font-medium" style={{ color, background: `${color}14` }}>{sub}</p>
      <Sparkline values={spark} color={color} />
    </div>
  );
}

// Мини-график динамики показателя за выбранный период
function Sparkline({ values, color }: { values: number[]; color: string }) {
  if (values.length < 2) return null;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const step = 100 / (values.length - 1);
  const pts = values.map(
    (v, i) => `${(i * step).toFixed(2)},${(27 - ((v - min) / span) * 24).toFixed(2)}`,
  );
  const line = `M${pts.join(' L')}`;
  return (
    <svg
      viewBox="0 0 100 30"
      preserveAspectRatio="none"
      className="block w-2/3 h-9 mt-2"
      aria-hidden="true"
    >
      <path d={`${line} L100,30 L0,30 Z`} fill={color} opacity={0.08} />
      <path d={line} fill="none" stroke={color} strokeWidth={1.5} vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CustomTooltip({ active, payload, label }: any) {
  if (active && payload && payload.length) {
    const [year, month] = label.split('-');
    const m = monthNames[parseInt(month) - 1];
    return (
      <div className="rounded-xl bg-popover px-3 py-2 shadow-[var(--shadow-soft)] border border-border">
        <p className="text-xs text-muted-foreground mb-1">{m} {year}</p>
        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
        {payload.map((entry: any, i: number) => (
          <p key={i} className="text-sm text-popover-foreground tabular-nums">
            <span className="inline-block w-2 h-2 rounded-full mr-1.5" style={{ background: entry.color }} />
            {entry.name}: {typeof entry.value === 'number' ? formatNumber(entry.value) : entry.value}
            {entry.name?.includes('ЗП') || entry.name?.includes('Зарплата') || entry.name?.includes('МРОТ') || entry.name?.includes('Цена') || entry.name?.includes('Аренда') || entry.name?.includes('Стоимость') ? ' ₽' : ''}
            {entry.name?.includes('лет') || entry.name?.includes('Лет') ? ' лет' : ''}
            {entry.name?.includes('Доля') || entry.name?.includes('%') ? '%' : ''}
          </p>
        ))}
      </div>
    );
  }
  return null;
}

const axisStyle = { fill: '#8a8f9c', fontSize: 11 };

// Приглушённая палитра
const C = {
  blue: '#2f5bea',
  coral: '#f0603c',
  green: '#16a37a',
  lavender: '#8b5cf6',
};

// Блок «Вывод» под описанием графика
function Conclusion({ children }: { children: ReactNode }) {
  return (
    <p className="text-sm text-muted-foreground mb-6 max-w-3xl leading-relaxed rounded-xl bg-muted px-4 py-3">
      <span className="font-semibold text-foreground">Вывод:</span> {children}
    </p>
  );
}

const pct = (a: number, b: number) => Math.round(((b / a - 1) * 100));

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function SalaryPriceChart({ data }: { data: any[] }) {
  const wl = useContext(WageCtx);
  const f = data[0];
  const l = data[data.length - 1];
  const sG = pct(f.salary, l.salary);
  const pG = pct(f.pricePerSqm, l.pricePerSqm);
  return (
    <div>
      <p className="text-sm text-muted-foreground mb-3 max-w-3xl leading-relaxed">Как менялись {wl === 'МРОТ' ? 'МРОТ' : 'средняя зарплата'} и цена квадратного метра жилья. Левая шкала — {wl === 'МРОТ' ? 'МРОТ' : 'зарплата'}, правая — цена м², ₽, помесячно.</p>
      <Conclusion>
        За период {wl === 'МРОТ' ? 'МРОТ вырос' : 'зарплата выросла'} на {sG}%, цена м² — на {pG}%.{' '}
        {pG > sG ? 'Цены росли быстрее дохода — квадратный метр стал менее доступным.' : pG < sG ? 'Доход рос быстрее цен — квадратный метр стал доступнее.' : 'Доход и цены выросли одинаково — доступность метра не изменилась.'}
      </Conclusion>
      <ResponsiveContainer width="100%" height={360}>
        <ComposedChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
          <CartesianGrid stroke="#eef0f4" strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="month" tick={axisStyle} tickFormatter={formatMonthTick} ticks={yearTicks(data)} axisLine={{ stroke: '#e5e5e5' }} tickLine={false} />
          <YAxis yAxisId="left" tick={axisStyle} tickFormatter={formatCurrency} axisLine={false} tickLine={false} width={68} />
          <YAxis yAxisId="right" orientation="right" tick={axisStyle} tickFormatter={formatCurrency} axisLine={false} tickLine={false} width={68} />
          <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#c7cbd4' }} />
          <Line yAxisId="left" type="monotone" dataKey="salary" name={wl} stroke={C.blue} strokeWidth={2.25} dot={false} />
          <Line yAxisId="right" type="monotone" dataKey="pricePerSqm" name="Цена м²" stroke={C.coral} strokeWidth={2.25} dot={false} strokeDasharray="4 3" />
        </ComposedChart>
      </ResponsiveContainer>
      <div className="flex gap-6 mt-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5"><span className="w-4 h-px" style={{ background: C.blue }} />{wl}</span>
        <span className="flex items-center gap-1.5"><span className="w-4 h-px" style={{ background: C.coral, borderTop: `1px dashed ${C.coral}` }} />Цена м²</span>
      </div>
    </div>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function RentChart({ data }: { data: any[] }) {
  const wl = useContext(WageCtx);
  const f = data[0];
  const l = data[data.length - 1];
  const rG = pct(f.rent1room, l.rent1room);
  const sG = pct(f.salary, l.salary);
  return (
    <div>
      <p className="text-sm text-muted-foreground mb-3 max-w-3xl leading-relaxed">Динамика месячной аренды 1-комнатной квартиры в сравнении с {wl === 'МРОТ' ? 'МРОТ' : 'средней зарплатой'}. Левая шкала — аренда, правая — {wl === 'МРОТ' ? 'МРОТ' : 'зарплата'}, ₽.</p>
      <Conclusion>
        Аренда подорожала на {rG}% при росте {wl === 'МРОТ' ? 'МРОТ' : 'зарплаты'} на {sG}%. К концу периода аренда занимает {l.rentShareOfSalary}% дохода против {f.rentShareOfSalary}% в начале.
      </Conclusion>
      <ResponsiveContainer width="100%" height={360}>
        <ComposedChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
          <CartesianGrid stroke="#eef0f4" strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="month" tick={axisStyle} tickFormatter={formatMonthTick} ticks={yearTicks(data)} axisLine={{ stroke: '#e5e5e5' }} tickLine={false} />
          <YAxis yAxisId="left" tick={axisStyle} tickFormatter={formatCurrency} axisLine={false} tickLine={false} width={68} />
          <YAxis yAxisId="right" orientation="right" tick={axisStyle} tickFormatter={formatCurrency} axisLine={false} tickLine={false} width={68} />
          <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#c7cbd4' }} />
          <Line yAxisId="left" type="monotone" dataKey="rent1room" name="Аренда" stroke={C.green} strokeWidth={2.25} dot={false} strokeDasharray="4 3" />
          <Line yAxisId="right" type="monotone" dataKey="salary" name={wl} stroke={C.blue} strokeWidth={2.25} dot={false} />
        </ComposedChart>
      </ResponsiveContainer>
      <div className="flex gap-6 mt-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5"><span className="w-4 h-px" style={{ borderTop: `2px dashed ${C.green}` }} />Аренда</span>
        <span className="flex items-center gap-1.5"><span className="w-4 h-px" style={{ background: C.blue }} />{wl}</span>
      </div>
    </div>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function AffordabilityChart({ data }: { data: any[] }) {
  const wl = useContext(WageCtx);
  const f = data[0];
  const l = data[data.length - 1];
  const y0 = f.yearsToBuy;
  const y1 = l.yearsToBuy;
  return (
    <div>
      <p className="text-sm text-muted-foreground mb-3 max-w-3xl leading-relaxed">Сколько лет нужно откладывать весь доход ({wl === 'МРОТ' ? 'МРОТ' : 'зарплату'}), чтобы купить квартиру 54 м²: стоимость квартиры / (доход × 12).</p>
      <Conclusion>
        Копить на квартиру 54 м² нужно {y1} лет против {y0} лет в начале периода — {y1 > y0 ? 'покупка отодвинулась' : y1 < y0 ? 'жильё стало доступнее' : 'доступность не изменилась'}.
      </Conclusion>
      <ResponsiveContainer width="100%" height={360}>
        <AreaChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
          <defs>
            <linearGradient id="gAff" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={C.lavender} stopOpacity={0.15} />
              <stop offset="100%" stopColor={C.lavender} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="#eef0f4" strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="month" tick={axisStyle} tickFormatter={formatMonthTick} ticks={yearTicks(data)} axisLine={{ stroke: '#e5e5e5' }} tickLine={false} />
          <YAxis tick={axisStyle} domain={['dataMin - 1', 'dataMax + 1']} axisLine={false} tickLine={false} width={40} />
          <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#c7cbd4' }} />
          <Area type="monotone" dataKey="yearsToBuy" name="Лет" stroke={C.lavender} strokeWidth={1.5} fill="url(#gAff)" dot={false} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function RentShareChart({ data }: { data: any[] }) {
  const wl = useContext(WageCtx);
  const f = data[0];
  const l = data[data.length - 1];
  const r0 = f.rentShareOfSalary;
  const r1v = l.rentShareOfSalary;
  return (
    <div>
      <p className="text-sm text-muted-foreground mb-3 max-w-3xl leading-relaxed">Какую часть месячного дохода ({wl === 'МРОТ' ? 'МРОТ' : 'зарплаты'}) занимает аренда 1-комнатной квартиры: аренда / доход × 100%. Выше 100% — дохода не хватает на аренду.</p>
      <Conclusion>
        Аренда занимает {r1v}% дохода против {r0}% в начале периода{r1v > 100 ? ' — дохода уже не хватает на аренду' : ''}.
      </Conclusion>
      <ResponsiveContainer width="100%" height={360}>
        <AreaChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
          <defs>
            <linearGradient id="gShare" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={C.coral} stopOpacity={0.15} />
              <stop offset="100%" stopColor={C.coral} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="#eef0f4" strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="month" tick={axisStyle} tickFormatter={formatMonthTick} ticks={yearTicks(data)} axisLine={{ stroke: '#e5e5e5' }} tickLine={false} />
          <YAxis tick={axisStyle} domain={[0, 'auto']} tickFormatter={(v) => `${v}%`} axisLine={false} tickLine={false} width={40} />
          <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#c7cbd4' }} />
          <Area type="monotone" dataKey="rentShareOfSalary" name="Доля" stroke={C.coral} strokeWidth={1.5} fill="url(#gShare)" dot={false} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function ApartmentCostChart({ data }: { data: any[] }) {
  const wl = useContext(WageCtx);
  const f = data[0];
  const l = data[data.length - 1];
  const m0 = (f.apartmentCost54 / 1000000).toFixed(1);
  const m1 = (l.apartmentCost54 / 1000000).toFixed(1);
  const g = pct(f.apartmentCost54, l.apartmentCost54);
  return (
    <div>
      <p className="text-sm text-muted-foreground mb-3 max-w-3xl leading-relaxed">Стоимость типовой квартиры площадью 54 м²: цена м² × 54, помесячно.</p>
      <Conclusion>
        Квартира 54 м² подорожала с {m0} до {m1} млн ₽ — плюс {g}% за период.
      </Conclusion>
      <ResponsiveContainer width="100%" height={360}>
        <AreaChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
          <defs>
            <linearGradient id="gCost" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={C.lavender} stopOpacity={0.15} />
              <stop offset="100%" stopColor={C.lavender} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="#eef0f4" strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="month" tick={axisStyle} tickFormatter={formatMonthTick} ticks={yearTicks(data)} axisLine={{ stroke: '#e5e5e5' }} tickLine={false} />
          <YAxis tick={axisStyle} tickFormatter={(v) => `${(v / 1000000).toFixed(1)} млн`} axisLine={false} tickLine={false} width={68} />
          <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#c7cbd4' }} />
          <Area type="monotone" dataKey="apartmentCost54" name="Стоимость" stroke={C.lavender} strokeWidth={1.5} fill="url(#gCost)" dot={false} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CombinedChart({ data }: { data: any[] }) {
  const wl = useContext(WageCtx);
  const f = data[0];
  const l = data[data.length - 1];
  const items = [
    { name: wl, g: pct(f.salary, l.salary) },
    { name: 'цена м²', g: pct(f.pricePerSqm, l.pricePerSqm) },
    { name: 'аренда', g: pct(f.rent1room, l.rent1room) },
  ].sort((a, b) => b.g - a.g);
  const top = items[0] ?? { name: '', g: 0 };
  const low = items[items.length - 1] ?? { name: '', g: 0 };
  return (
    <div>
      <p className="text-sm text-muted-foreground mb-3 max-w-3xl leading-relaxed">Сравнение темпов роста показателей. Расчёт: значение каждого показателя в месяце делится на его значение в первом месяце выбранного периода и умножается на 100. Первый месяц = 100%; например, 300% означает рост в 3 раза с начала периода.</p>
      <Conclusion>
        Лидирует по росту {top.name === 'Зарплата' ? 'зарплата' : top.name} (+{top.g}%), замыкает список {low.name === 'Зарплата' ? 'зарплата' : low.name} (+{low.g}%).
      </Conclusion>
      <ResponsiveContainer width="100%" height={360}>
        <LineChart
          data={data.map((d) => {
            const first = data[0];
            return {
              month: d.month,
              salary: Number(((d.salary / first.salary) * 100).toFixed(1)),
              pricePerSqm: Number(((d.pricePerSqm / first.pricePerSqm) * 100).toFixed(1)),
              rent1room: Number(((d.rent1room / first.rent1room) * 100).toFixed(1)),
            };
          })}
          margin={{ top: 5, right: 10, left: 0, bottom: 5 }}
        >
          <CartesianGrid stroke="#eef0f4" strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="month" tick={axisStyle} tickFormatter={formatMonthTick} ticks={yearTicks(data)} axisLine={{ stroke: '#e5e5e5' }} tickLine={false} />
          <YAxis tick={axisStyle} tickFormatter={(v) => `${v}%`} axisLine={false} tickLine={false} width={50} />
          <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#c7cbd4' }} />
          <Line type="monotone" dataKey="salary" name={wl} stroke={C.blue} strokeWidth={2.25} dot={false} />
          <Line type="monotone" dataKey="pricePerSqm" name="Цена м²" stroke={C.coral} strokeWidth={2.25} dot={false} />
          <Line type="monotone" dataKey="rent1room" name="Аренда" stroke={C.green} strokeWidth={2.25} dot={false} />
        </LineChart>
      </ResponsiveContainer>
      <div className="flex flex-wrap gap-5 mt-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5"><span className="w-4 h-px" style={{ background: C.blue }} />{wl}</span>
        <span className="flex items-center gap-1.5"><span className="w-4 h-px" style={{ background: C.coral }} />Цена м²</span>
        <span className="flex items-center gap-1.5"><span className="w-4 h-px" style={{ background: C.green }} />Аренда</span>
      </div>
    </div>
  );
}
