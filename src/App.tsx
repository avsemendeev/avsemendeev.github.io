import { useState, useMemo } from 'react';
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
// eslint-disable-next-line @typescript-eslint/no-explicit-any
import { housingData } from './data/housingData';

const years = Array.from({ length: 26 }, (_, i) => 2000 + i);

const formatNumber = (value: number) => new Intl.NumberFormat('ru-RU').format(value);

const formatCurrency = (value: number) => {
  if (value >= 1000000) return `${(value / 1000000).toFixed(1)} млн`;
  if (value >= 1000) return `${(value / 1000).toFixed(0)} тыс`;
  return value.toString();
};

const monthNames = ['Янв','Фев','Мар','Апр','Май','Июн','Июл','Авг','Сен','Окт','Ноя','Дек'];

const formatMonthTick = (value: string) => {
  const [year, month] = value.split('-');
  const m = parseInt(month);
  if (m === 1) return year;
  if (m === 7) return 'Июл';
  return '';
};

type ChartType = 'salary-price' | 'rent' | 'affordability' | 'rent-share' | 'combined' | 'apartment-cost';

export default function App() {
  const [startYear, setStartYear] = useState(2000);
  const [endYear, setEndYear] = useState(2025);
  const [activeChart, setActiveChart] = useState<ChartType>('salary-price');

  const filteredData = useMemo(() => {
    return housingData.filter((d) => {
      const year = parseInt(d.month.split('-')[0]);
      return year >= startYear && year <= endYear;
    });
  }, [startYear, endYear]);

  const chartTabs: { id: ChartType; label: string }[] = [
    { id: 'salary-price', label: 'Зарплата и цена м²' },
    { id: 'rent', label: 'Зарплата и аренда' },
    { id: 'affordability', label: 'Доступность' },
    { id: 'rent-share', label: 'Доля аренды' },
    { id: 'apartment-cost', label: 'Стоимость 54 м²' },
    { id: 'combined', label: 'Сводный' },
  ];

  const latest = filteredData[filteredData.length - 1];
  const first = filteredData[0];
  const salaryGrowth = latest && first ? ((latest.salary / first.salary - 1) * 100).toFixed(0) : '0';
  const priceGrowth = latest && first ? ((latest.pricePerSqm / first.pricePerSqm - 1) * 100).toFixed(0) : '0';

  return (
    <div className="min-h-screen bg-white text-neutral-900">
      <div className="max-w-6xl mx-auto px-5 py-10">
        {/* Header */}
        <header className="mb-12">
          <h1 className="text-3xl font-light tracking-tight text-neutral-900">
            Доступность жилья
          </h1>
          <p className="text-sm text-neutral-500 mt-2">
            Россия · 2000–2025 · помесячные данные
          </p>
          <div className="flex gap-1 mt-4">
            <span className="w-8 h-0.5 rounded-full" style={{ background: C.blue }} />
            <span className="w-8 h-0.5 rounded-full" style={{ background: C.coral }} />
            <span className="w-8 h-0.5 rounded-full" style={{ background: C.green }} />
            <span className="w-8 h-0.5 rounded-full" style={{ background: C.lavender }} />
          </div>
        </header>

        {/* Controls */}
        <div className="flex flex-wrap items-center gap-4 mb-10 pb-6 border-b border-neutral-200">
          <div className="flex items-center gap-2 text-sm">
            <span className="text-neutral-500">Период</span>
            <select
              value={startYear}
              onChange={(e) => setStartYear(Number(e.target.value))}
              className="bg-transparent border-b border-neutral-300 py-1 px-1 text-neutral-900 focus:outline-none focus:border-neutral-900"
            >
              {years.map((y) => <option key={y} value={y}>{y}</option>)}
            </select>
            <span className="text-neutral-400">—</span>
            <select
              value={endYear}
              onChange={(e) => setEndYear(Number(e.target.value))}
              className="bg-transparent border-b border-neutral-300 py-1 px-1 text-neutral-900 focus:outline-none focus:border-neutral-900"
            >
              {years.map((y) => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
          <div className="flex gap-1 ml-auto">
            {[
              { label: '2000–2025', s: 2000, e: 2025 },
              { label: '2010–2020', s: 2010, e: 2020 },
              { label: '2020–2025', s: 2020, e: 2025 },
            ].map((p) => (
              <button
                key={p.label}
                onClick={() => { setStartYear(p.s); setEndYear(p.e); }}
                className="px-3 py-1 text-xs text-neutral-600 hover:text-neutral-900 border border-neutral-200 hover:border-neutral-400 rounded-full transition-colors"
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
          <StatItem label="Зарплата" value={`${formatNumber(latest?.salary || 0)} ₽`} sub={`+${salaryGrowth}%`} color={C.blue} />
          <StatItem label="Цена м²" value={`${formatNumber(latest?.pricePerSqm || 0)} ₽`} sub={`+${priceGrowth}%`} color={C.coral} />
          <StatItem label="Аренда 1к" value={`${formatNumber(latest?.rent1room || 0)} ₽`} sub={`${latest?.rentShareOfSalary || 0}% от ЗП`} color={C.green} />
          <StatItem label="Доступность" value={`${latest?.yearsToBuy || 0} лет`} sub="квартира 54 м²" color={C.lavender} />
        </div>

        {/* Chart Tabs */}
        <nav className="flex flex-wrap gap-1 mb-8 border-b border-neutral-200">
          {chartTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveChart(tab.id)}
              className={`px-4 py-2.5 text-sm transition-colors relative ${
                activeChart === tab.id
                  ? 'text-neutral-900'
                  : 'text-neutral-500 hover:text-neutral-800'
              }`}
            >
              {tab.label}
              {activeChart === tab.id && (
                <span className="absolute bottom-0 left-0 right-0 h-px bg-neutral-900" />
              )}
            </button>
          ))}
        </nav>

        {/* Chart */}
        <section className="mb-16">
          {activeChart === 'salary-price' && <SalaryPriceChart data={filteredData} />}
          {activeChart === 'rent' && <RentChart data={filteredData} />}
          {activeChart === 'affordability' && <AffordabilityChart data={filteredData} />}
          {activeChart === 'rent-share' && <RentShareChart data={filteredData} />}
          {activeChart === 'apartment-cost' && <ApartmentCostChart data={filteredData} />}
          {activeChart === 'combined' && <CombinedChart data={filteredData} />}
        </section>

        {/* Table */}
        <section className="mb-16">
          <h2 className="text-sm font-medium text-neutral-500 uppercase tracking-wider mb-4">
            Данные · помесячно
          </h2>
          <div className="overflow-x-auto max-h-[480px] overflow-y-auto border border-neutral-200 rounded-sm">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-neutral-50 text-neutral-500">
                <tr className="border-b border-neutral-200">
                  <th className="text-left py-2 px-3 font-medium">Месяц</th>
                  <th className="text-right py-2 px-3 font-medium">ЗП, ₽</th>
                  <th className="text-right py-2 px-3 font-medium">Цена м², ₽</th>
                  <th className="text-right py-2 px-3 font-medium">Аренда, ₽</th>
                  <th className="text-right py-2 px-3 font-medium">54 м², млн</th>
                  <th className="text-right py-2 px-3 font-medium">Лет</th>
                  <th className="text-right py-2 px-3 font-medium">Аренда/ЗП</th>
                  <th className="text-right py-2 px-3 font-medium">м²/ЗП</th>
                </tr>
              </thead>
              <tbody>
                {filteredData.map((d) => {
                  const [y, m] = d.month.split('-');
                  return (
                    <tr key={d.month} className="border-b border-neutral-100 hover:bg-neutral-50/50">
                      <td className="py-1.5 px-3 text-neutral-700">{monthNames[parseInt(m)-1]} {y}</td>
                      <td className="py-1.5 px-3 text-right tabular-nums">{formatNumber(d.salary)}</td>
                      <td className="py-1.5 px-3 text-right tabular-nums">{formatNumber(d.pricePerSqm)}</td>
                      <td className="py-1.5 px-3 text-right tabular-nums">{formatNumber(d.rent1room)}</td>
                      <td className="py-1.5 px-3 text-right tabular-nums">{(d.apartmentCost54 / 1000000).toFixed(2)}</td>
                      <td className="py-1.5 px-3 text-right tabular-nums">{d.yearsToBuy}</td>
                      <td className="py-1.5 px-3 text-right tabular-nums">{d.rentShareOfSalary}%</td>
                      <td className="py-1.5 px-3 text-right tabular-nums">{d.sqmToSalary}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        {/* Footer */}
        <footer className="pt-8 border-t border-neutral-200 text-xs text-neutral-400">
          <p>Квартира 54 м² · доступность = стоимость / (зарплата × 12)</p>
        </footer>
      </div>
    </div>
  );
}

function StatItem({ label, value, sub, color }: { label: string; value: string; sub: string; color: string }) {
  return (
    <div className="relative">
      <span className="absolute top-0 left-0 w-6 h-0.5 rounded-full" style={{ background: color }} />
      <p className="text-xs text-neutral-500 uppercase tracking-wider mb-1 pt-2">{label}</p>
      <p className="text-2xl font-light tabular-nums text-neutral-900">{value}</p>
      <p className="text-xs text-neutral-500 mt-1">{sub}</p>
    </div>
  );
}

function CustomTooltip({ active, payload, label }: any) {
  if (active && payload && payload.length) {
    const [year, month] = label.split('-');
    const m = monthNames[parseInt(month) - 1];
    return (
      <div className="bg-white border border-neutral-200 px-3 py-2 shadow-sm">
        <p className="text-xs text-neutral-500 mb-1">{m} {year}</p>
        {payload.map((entry: any, i: number) => (
          <p key={i} className="text-sm text-neutral-900 tabular-nums">
            <span className="inline-block w-2 h-2 rounded-full mr-1.5" style={{ background: entry.color }} />
            {entry.name}: {typeof entry.value === 'number' ? formatNumber(entry.value) : entry.value}
            {entry.name?.includes('ЗП') || entry.name?.includes('Цена') || entry.name?.includes('Аренда') || entry.name?.includes('Стоимость') ? ' ₽' : ''}
            {entry.name?.includes('лет') || entry.name?.includes('Лет') ? ' лет' : ''}
            {entry.name?.includes('Доля') || entry.name?.includes('%') ? '%' : ''}
          </p>
        ))}
      </div>
    );
  }
  return null;
}

const axisStyle = { fill: '#a3a3a3', fontSize: 11 };

// Приглушённая палитра
const C = {
  blue: '#2d5a87',
  coral: '#c2614a',
  green: '#4a8a6a',
  lavender: '#8a7ba8',
};

function SalaryPriceChart({ data }: { data: any[] }) {
  return (
    <div>
      <h3 className="text-lg font-light mb-1">Зарплата и цена за м²</h3>
      <p className="text-xs text-neutral-500 mb-6">Помесячно, ₽</p>
      <ResponsiveContainer width="100%" height={360}>
        <ComposedChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
          <CartesianGrid stroke="#f5f5f5" vertical={false} />
          <XAxis dataKey="month" tick={axisStyle} tickFormatter={formatMonthTick} interval="preserveStartEnd" axisLine={{ stroke: '#e5e5e5' }} tickLine={false} />
          <YAxis yAxisId="left" tick={axisStyle} tickFormatter={formatCurrency} axisLine={false} tickLine={false} width={55} />
          <YAxis yAxisId="right" orientation="right" tick={axisStyle} tickFormatter={formatCurrency} axisLine={false} tickLine={false} width={55} />
          <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#d4d4d4' }} />
          <Line yAxisId="left" type="monotone" dataKey="salary" name="Зарплата" stroke={C.blue} strokeWidth={1.5} dot={false} />
          <Line yAxisId="right" type="monotone" dataKey="pricePerSqm" name="Цена м²" stroke={C.coral} strokeWidth={1.5} dot={false} strokeDasharray="4 3" />
        </ComposedChart>
      </ResponsiveContainer>
      <div className="flex gap-6 mt-3 text-xs text-neutral-500">
        <span className="flex items-center gap-1.5"><span className="w-4 h-px" style={{ background: C.blue }} />Зарплата</span>
        <span className="flex items-center gap-1.5"><span className="w-4 h-px" style={{ background: C.coral, borderTop: `1px dashed ${C.coral}` }} />Цена м²</span>
      </div>
    </div>
  );
}

function RentChart({ data }: { data: any[] }) {
  return (
    <div>
      <h3 className="text-lg font-light mb-1">Зарплата и аренда</h3>
      <p className="text-xs text-neutral-500 mb-6">Аренда 1-комнатной квартиры · Сравнение динамики, ₽</p>
      <ResponsiveContainer width="100%" height={360}>
        <ComposedChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
          <CartesianGrid stroke="#f5f5f5" vertical={false} />
          <XAxis dataKey="month" tick={axisStyle} tickFormatter={formatMonthTick} interval="preserveStartEnd" axisLine={{ stroke: '#e5e5e5' }} tickLine={false} />
          <YAxis yAxisId="left" tick={axisStyle} tickFormatter={formatCurrency} axisLine={false} tickLine={false} width={55} />
          <YAxis yAxisId="right" orientation="right" tick={axisStyle} tickFormatter={formatCurrency} axisLine={false} tickLine={false} width={55} />
          <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#d4d4d4' }} />
          <Line yAxisId="left" type="monotone" dataKey="rent1room" name="Аренда" stroke={C.green} strokeWidth={1.5} dot={false} />
          <Line yAxisId="right" type="monotone" dataKey="salary" name="Зарплата" stroke={C.blue} strokeWidth={1.5} dot={false} strokeDasharray="4 3" />
        </ComposedChart>
      </ResponsiveContainer>
      <div className="flex gap-6 mt-3 text-xs text-neutral-500">
        <span className="flex items-center gap-1.5"><span className="w-4 h-px" style={{ background: C.green }} />Аренда</span>
        <span className="flex items-center gap-1.5"><span className="w-4 h-px" style={{ background: C.blue, borderTop: `1px dashed ${C.blue}` }} />Зарплата</span>
      </div>
    </div>
  );
}

function AffordabilityChart({ data }: { data: any[] }) {
  return (
    <div>
      <h3 className="text-lg font-light mb-1">Доступность покупки</h3>
      <p className="text-xs text-neutral-500 mb-6">Лет накоплений для квартиры 54 м²</p>
      <ResponsiveContainer width="100%" height={360}>
        <AreaChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
          <defs>
            <linearGradient id="gAff" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={C.lavender} stopOpacity={0.15} />
              <stop offset="100%" stopColor={C.lavender} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="#f5f5f5" vertical={false} />
          <XAxis dataKey="month" tick={axisStyle} tickFormatter={formatMonthTick} interval="preserveStartEnd" axisLine={{ stroke: '#e5e5e5' }} tickLine={false} />
          <YAxis tick={axisStyle} domain={['dataMin - 1', 'dataMax + 1']} axisLine={false} tickLine={false} width={40} />
          <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#d4d4d4' }} />
          <Area type="monotone" dataKey="yearsToBuy" name="Лет" stroke={C.lavender} strokeWidth={1.5} fill="url(#gAff)" dot={false} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

function RentShareChart({ data }: { data: any[] }) {
  return (
    <div>
      <h3 className="text-lg font-light mb-1">Доля аренды в зарплате</h3>
      <p className="text-xs text-neutral-500 mb-6">Процент зарплаты на аренду 1-комнатной</p>
      <ResponsiveContainer width="100%" height={360}>
        <AreaChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
          <defs>
            <linearGradient id="gShare" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={C.coral} stopOpacity={0.15} />
              <stop offset="100%" stopColor={C.coral} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="#f5f5f5" vertical={false} />
          <XAxis dataKey="month" tick={axisStyle} tickFormatter={formatMonthTick} interval="preserveStartEnd" axisLine={{ stroke: '#e5e5e5' }} tickLine={false} />
          <YAxis tick={axisStyle} domain={[0, 100]} tickFormatter={(v) => `${v}%`} axisLine={false} tickLine={false} width={40} />
          <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#d4d4d4' }} />
          <Area type="monotone" dataKey="rentShareOfSalary" name="Доля" stroke={C.coral} strokeWidth={1.5} fill="url(#gShare)" dot={false} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

function ApartmentCostChart({ data }: { data: any[] }) {
  return (
    <div>
      <h3 className="text-lg font-light mb-1">Стоимость квартиры 54 м²</h3>
      <p className="text-xs text-neutral-500 mb-6">Помесячно</p>
      <ResponsiveContainer width="100%" height={360}>
        <AreaChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
          <defs>
            <linearGradient id="gCost" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={C.coral} stopOpacity={0.15} />
              <stop offset="100%" stopColor={C.coral} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="#f5f5f5" vertical={false} />
          <XAxis dataKey="month" tick={axisStyle} tickFormatter={formatMonthTick} interval="preserveStartEnd" axisLine={{ stroke: '#e5e5e5' }} tickLine={false} />
          <YAxis tick={axisStyle} tickFormatter={(v) => `${(v / 1000000).toFixed(1)} млн`} axisLine={false} tickLine={false} width={55} />
          <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#d4d4d4' }} />
          <Area type="monotone" dataKey="apartmentCost54" name="Стоимость" stroke={C.coral} strokeWidth={1.5} fill="url(#gCost)" dot={false} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

function CombinedChart({ data }: { data: any[] }) {
  return (
    <div>
      <h3 className="text-lg font-light mb-1">Сводный график</h3>
      <p className="text-xs text-neutral-500 mb-6">Рост относительно начала периода, %</p>
      <ResponsiveContainer width="100%" height={360}>
        <LineChart
          data={data.map((d) => {
            const first = data[0];
            return {
              month: d.month,
              salary: Number(((d.salary / first.salary) * 100).toFixed(1)),
              pricePerSqm: Number(((d.pricePerSqm / first.pricePerSqm) * 100).toFixed(1)),
              rent1room: Number(((d.rent1room / first.rent1room) * 100).toFixed(1)),
              apartmentCost54: Number(((d.apartmentCost54 / first.apartmentCost54) * 100).toFixed(1)),
            };
          })}
          margin={{ top: 5, right: 10, left: 0, bottom: 5 }}
        >
          <CartesianGrid stroke="#f5f5f5" vertical={false} />
          <XAxis dataKey="month" tick={axisStyle} tickFormatter={formatMonthTick} interval="preserveStartEnd" axisLine={{ stroke: '#e5e5e5' }} tickLine={false} />
          <YAxis tick={axisStyle} tickFormatter={(v) => `${v}%`} axisLine={false} tickLine={false} width={50} />
          <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#d4d4d4' }} />
          <Line type="monotone" dataKey="salary" name="Зарплата" stroke={C.blue} strokeWidth={1.5} dot={false} />
          <Line type="monotone" dataKey="pricePerSqm" name="Цена м²" stroke={C.coral} strokeWidth={1.5} dot={false} />
          <Line type="monotone" dataKey="rent1room" name="Аренда" stroke={C.green} strokeWidth={1.5} dot={false} />
          <Line type="monotone" dataKey="apartmentCost54" name="Стоимость квартиры" stroke={C.lavender} strokeWidth={1.5} dot={false} />
        </LineChart>
      </ResponsiveContainer>
      <div className="flex flex-wrap gap-5 mt-3 text-xs text-neutral-500">
        <span className="flex items-center gap-1.5"><span className="w-4 h-px" style={{ background: C.blue }} />Зарплата</span>
        <span className="flex items-center gap-1.5"><span className="w-4 h-px" style={{ background: C.coral }} />Цена м²</span>
        <span className="flex items-center gap-1.5"><span className="w-4 h-px" style={{ background: C.green }} />Аренда</span>
        <span className="flex items-center gap-1.5"><span className="w-4 h-px" style={{ background: C.lavender }} />Стоимость квартиры</span>
      </div>
    </div>
  );
}
