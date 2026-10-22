import { useState, useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
  ComposedChart,
  Bar,
} from 'recharts';
import { housingData } from './data/housingData';

const years = Array.from({ length: 26 }, (_, i) => 2000 + i);

const formatNumber = (value: number) => {
  return new Intl.NumberFormat('ru-RU').format(value);
};

const formatCurrency = (value: number) => {
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(1)} млн`;
  }
  if (value >= 1000) {
    return `${(value / 1000).toFixed(0)} тыс`;
  }
  return value.toString();
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

  // Показываем только январские данные для менее зашумленного графика
  const yearlyData = useMemo(() => {
    return filteredData.filter((d) => d.month.endsWith('-01'));
  }, [filteredData]);

  const chartTabs: { id: ChartType; label: string; icon: string }[] = [
    { id: 'salary-price', label: 'ЗП vs Цена м²', icon: '📈' },
    { id: 'rent', label: 'Аренда', icon: '🏠' },
    { id: 'affordability', label: 'Доступность', icon: '⏱️' },
    { id: 'rent-share', label: 'Доля аренды', icon: '📊' },
    { id: 'apartment-cost', label: 'Стоимость 54м²', icon: '💰' },
    { id: 'combined', label: 'Сводный', icon: '📋' },
  ];

  const latestData = filteredData[filteredData.length - 1];
  const firstData = filteredData[0];

  const salaryGrowth = latestData && firstData
    ? ((latestData.salary / firstData.salary - 1) * 100).toFixed(0)
    : '0';
  const priceGrowth = latestData && firstData
    ? ((latestData.pricePerSqm / firstData.pricePerSqm - 1) * 100).toFixed(0)
    : '0';

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
      {/* Header */}
      <header className="border-b border-slate-700/50 bg-slate-900/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            🏘️ Доступность жилья в России
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Аналитика рынка недвижимости и доходов населения • 2000–2025
          </p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* Controls */}
        <div className="bg-slate-800/50 rounded-2xl p-4 md:p-6 border border-slate-700/50 backdrop-blur-sm">
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
            <div className="flex items-center gap-3">
              <label className="text-sm text-slate-300 whitespace-nowrap">Период:</label>
              <select
                value={startYear}
                onChange={(e) => setStartYear(Number(e.target.value))}
                className="bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {years.map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
              <span className="text-slate-400">—</span>
              <select
                value={endYear}
                onChange={(e) => setEndYear(Number(e.target.value))}
                className="bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {years.map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
            <div className="flex gap-2 ml-auto">
              <button
                onClick={() => { setStartYear(2000); setEndYear(2025); }}
                className="px-3 py-1.5 text-xs bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors"
              >
                Всё время
              </button>
              <button
                onClick={() => { setStartYear(2020); setEndYear(2025); }}
                className="px-3 py-1.5 text-xs bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors"
              >
                2020–2025
              </button>
              <button
                onClick={() => { setStartYear(2010); setEndYear(2020); }}
                className="px-3 py-1.5 text-xs bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors"
              >
                2010–2020
              </button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          <StatCard
            title="Зарплата (посл.)"
            value={`${formatNumber(latestData?.salary || 0)} ₽`}
            subtitle={`Рост: ${salaryGrowth}%`}
            color="blue"
          />
          <StatCard
            title="Цена за м² (посл.)"
            value={`${formatNumber(latestData?.pricePerSqm || 0)} ₽`}
            subtitle={`Рост: ${priceGrowth}%`}
            color="purple"
          />
          <StatCard
            title="Аренда 1к"
            value={`${formatNumber(latestData?.rent1room || 0)} ₽`}
            subtitle={`${latestData?.rentShareOfSalary || 0}% от ЗП`}
            color="green"
          />
          <StatCard
            title="Доступность"
            value={`${latestData?.yearsToBuy || 0} лет`}
            subtitle={`Квартира 54м²`}
            color="orange"
          />
        </div>

        {/* Chart Tabs */}
        <div className="flex flex-wrap gap-2">
          {chartTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveChart(tab.id)}
              className={`px-3 py-2 rounded-xl text-sm font-medium transition-all ${
                activeChart === tab.id
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700'
              }`}
            >
              <span className="mr-1">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Chart Area */}
        <div className="bg-slate-800/50 rounded-2xl p-4 md:p-6 border border-slate-700/50 backdrop-blur-sm">
          {activeChart === 'salary-price' && <SalaryPriceChart data={yearlyData} />}
          {activeChart === 'rent' && <RentChart data={yearlyData} />}
          {activeChart === 'affordability' && <AffordabilityChart data={yearlyData} />}
          {activeChart === 'rent-share' && <RentShareChart data={yearlyData} />}
          {activeChart === 'apartment-cost' && <ApartmentCostChart data={yearlyData} />}
          {activeChart === 'combined' && <CombinedChart data={yearlyData} />}
        </div>

        {/* Full Data Table */}
        <div className="bg-slate-800/50 rounded-2xl p-4 md:p-6 border border-slate-700/50 backdrop-blur-sm">
          <h3 className="text-lg font-semibold mb-4 text-slate-200">📋 Таблица данных (ежегодно, январь)</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-700">
                  <th className="text-left py-2 px-2 text-slate-400 font-medium">Год</th>
                  <th className="text-right py-2 px-2 text-slate-400 font-medium">ЗП, ₽</th>
                  <th className="text-right py-2 px-2 text-slate-400 font-medium">Цена м², ₽</th>
                  <th className="text-right py-2 px-2 text-slate-400 font-medium">Аренда, ₽</th>
                  <th className="text-right py-2 px-2 text-slate-400 font-medium">54м², млн ₽</th>
                  <th className="text-right py-2 px-2 text-slate-400 font-medium">Лет</th>
                  <th className="text-right py-2 px-2 text-slate-400 font-medium">Аренда/ЗП %</th>
                </tr>
              </thead>
              <tbody>
                {yearlyData.map((d) => (
                  <tr key={d.month} className="border-b border-slate-700/50 hover:bg-slate-700/30 transition-colors">
                    <td className="py-2 px-2 font-medium text-slate-200">{d.month.split('-')[0]}</td>
                    <td className="py-2 px-2 text-right text-slate-300">{formatNumber(d.salary)}</td>
                    <td className="py-2 px-2 text-right text-slate-300">{formatNumber(d.pricePerSqm)}</td>
                    <td className="py-2 px-2 text-right text-slate-300">{formatNumber(d.rent1room)}</td>
                    <td className="py-2 px-2 text-right text-slate-300">{(d.apartmentCost54 / 1000000).toFixed(1)}</td>
                    <td className="py-2 px-2 text-right text-slate-300">{d.yearsToBuy}</td>
                    <td className="py-2 px-2 text-right text-slate-300">{d.rentShareOfSalary}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer */}
        <footer className="text-center text-slate-500 text-sm py-6 border-t border-slate-700/50">
          <p>Данные основаны на статистике средних зарплат и рыночных цен на недвижимость в России</p>
          <p className="mt-1">Квартира 54 м² (типовая 1-комнатная) • Расчёт доступности: стоимость / (зарплата × 12)</p>
        </footer>
      </main>
    </div>
  );
}

// Stat Card Component
function StatCard({ title, value, subtitle, color }: { title: string; value: string; subtitle: string; color: string }) {
  const colorClasses: Record<string, string> = {
    blue: 'from-blue-500/20 to-blue-600/10 border-blue-500/30',
    purple: 'from-purple-500/20 to-purple-600/10 border-purple-500/30',
    green: 'from-green-500/20 to-green-600/10 border-green-500/30',
    orange: 'from-orange-500/20 to-orange-600/10 border-orange-500/30',
  };

  return (
    <div className={`bg-gradient-to-br ${colorClasses[color]} border rounded-xl p-3 md:p-4`}>
      <p className="text-xs text-slate-400 mb-1">{title}</p>
      <p className="text-lg md:text-xl font-bold text-white">{value}</p>
      <p className="text-xs text-slate-400 mt-1">{subtitle}</p>
    </div>
  );
}

// Custom Tooltip
function CustomTooltip({ active, payload, label }: any) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-800 border border-slate-600 rounded-lg p-3 shadow-xl">
        <p className="text-slate-300 font-medium mb-1">{label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} style={{ color: entry.color }} className="text-sm">
            {entry.name}: {typeof entry.value === 'number' ? formatNumber(entry.value) : entry.value}
            {entry.name?.includes('ЗП') || entry.name?.includes('Цена') || entry.name?.includes('Аренда') || entry.name?.includes('Стоимость') ? ' ₽' : ''}
            {entry.name?.includes('лет') ? ' лет' : ''}
            {entry.name?.includes('Доля') ? '%' : ''}
          </p>
        ))}
      </div>
    );
  }
  return null;
}

// Chart Components
function SalaryPriceChart({ data }: { data: any[] }) {
  return (
    <div>
      <h3 className="text-lg font-semibold mb-2 text-slate-200">📈 Динамика зарплаты и цены за м²</h3>
      <p className="text-sm text-slate-400 mb-4">Сравнение роста доходов и стоимости недвижимости</p>
      <ResponsiveContainer width="100%" height={400}>
        <ComposedChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
          <XAxis dataKey="month" tick={{ fill: '#94a3b8', fontSize: 12 }} tickFormatter={(v) => v.split('-')[0]} />
          <YAxis yAxisId="left" tick={{ fill: '#94a3b8', fontSize: 12 }} tickFormatter={formatCurrency} />
          <YAxis yAxisId="right" orientation="right" tick={{ fill: '#94a3b8', fontSize: 12 }} tickFormatter={formatCurrency} />
          <Tooltip content={<CustomTooltip />} />
          <Legend wrapperStyle={{ paddingTop: '20px' }} />
          <Bar yAxisId="left" dataKey="salary" name="Зарплата (₽)" fill="#3b82f6" opacity={0.7} radius={[4, 4, 0, 0]} />
          <Line yAxisId="right" type="monotone" dataKey="pricePerSqm" name="Цена за м² (₽)" stroke="#a855f7" strokeWidth={3} dot={{ r: 3 }} />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}

function RentChart({ data }: { data: any[] }) {
  return (
    <div>
      <h3 className="text-lg font-semibold mb-2 text-slate-200">🏠 Динамика стоимости аренды 1-комнатной квартиры</h3>
      <p className="text-sm text-slate-400 mb-4">Рост арендной платы за 25 лет</p>
      <ResponsiveContainer width="100%" height={400}>
        <AreaChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
          <XAxis dataKey="month" tick={{ fill: '#94a3b8', fontSize: 12 }} tickFormatter={(v) => v.split('-')[0]} />
          <YAxis tick={{ fill: '#94a3b8', fontSize: 12 }} tickFormatter={formatCurrency} />
          <Tooltip content={<CustomTooltip />} />
          <Legend wrapperStyle={{ paddingTop: '20px' }} />
          <defs>
            <linearGradient id="rentGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
            </linearGradient>
          </defs>
          <Area type="monotone" dataKey="rent1room" name="Аренда 1к (₽)" stroke="#10b981" strokeWidth={2} fill="url(#rentGradient)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

function AffordabilityChart({ data }: { data: any[] }) {
  return (
    <div>
      <h3 className="text-lg font-semibold mb-2 text-slate-200">⏱️ Доступность покупки квартиры (лет накоплений)</h3>
      <p className="text-sm text-slate-400 mb-4">Сколько лет нужно откладывать всю зарплату для покупки квартиры 54 м²</p>
      <ResponsiveContainer width="100%" height={400}>
        <AreaChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
          <XAxis dataKey="month" tick={{ fill: '#94a3b8', fontSize: 12 }} tickFormatter={(v) => v.split('-')[0]} />
          <YAxis tick={{ fill: '#94a3b8', fontSize: 12 }} domain={['dataMin - 1', 'dataMax + 1']} />
          <Tooltip content={<CustomTooltip />} />
          <Legend wrapperStyle={{ paddingTop: '20px' }} />
          <defs>
            <linearGradient id="affordGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#f97316" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
            </linearGradient>
          </defs>
          <Area type="monotone" dataKey="yearsToBuy" name="Лет до покупки" stroke="#f97316" strokeWidth={2.5} fill="url(#affordGradient)" dot={{ r: 2 }} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

function RentShareChart({ data }: { data: any[] }) {
  return (
    <div>
      <h3 className="text-lg font-semibold mb-2 text-slate-200">📊 Доля аренды в зарплате (%)</h3>
      <p className="text-sm text-slate-400 mb-4">Какой процент зарплаты уходит на аренду 1-комнатной квартиры</p>
      <ResponsiveContainer width="100%" height={400}>
        <AreaChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
          <XAxis dataKey="month" tick={{ fill: '#94a3b8', fontSize: 12 }} tickFormatter={(v) => v.split('-')[0]} />
          <YAxis tick={{ fill: '#94a3b8', fontSize: 12 }} domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
          <Tooltip content={<CustomTooltip />} />
          <Legend wrapperStyle={{ paddingTop: '20px' }} />
          <defs>
            <linearGradient id="shareGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
            </linearGradient>
          </defs>
          <Area type="monotone" dataKey="rentShareOfSalary" name="Доля аренды от ЗП (%)" stroke="#ef4444" strokeWidth={2} fill="url(#shareGradient)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

function ApartmentCostChart({ data }: { data: any[] }) {
  return (
    <div>
      <h3 className="text-lg font-semibold mb-2 text-slate-200">💰 Стоимость квартиры 54 м²</h3>
      <p className="text-sm text-slate-400 mb-4">Динамика стоимости типовой 1-комнатной квартиры</p>
      <ResponsiveContainer width="100%" height={400}>
        <AreaChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
          <XAxis dataKey="month" tick={{ fill: '#94a3b8', fontSize: 12 }} tickFormatter={(v) => v.split('-')[0]} />
          <YAxis tick={{ fill: '#94a3b8', fontSize: 12 }} tickFormatter={(v) => `${(v / 1000000).toFixed(1)} млн`} />
          <Tooltip content={<CustomTooltip />} />
          <Legend wrapperStyle={{ paddingTop: '20px' }} />
          <defs>
            <linearGradient id="costGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
            </linearGradient>
          </defs>
          <Area type="monotone" dataKey="apartmentCost54" name="Стоимость квартиры (₽)" stroke="#8b5cf6" strokeWidth={2.5} fill="url(#costGradient)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

function CombinedChart({ data }: { data: any[] }) {
  return (
    <div>
      <h3 className="text-lg font-semibold mb-2 text-slate-200">📋 Сводная диаграмма (нормализованная)</h3>
      <p className="text-sm text-slate-400 mb-4">Все показатели относительно первого значения в выбранном периоде (%)</p>
      <ResponsiveContainer width="100%" height={400}>
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
          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
          <XAxis dataKey="month" tick={{ fill: '#94a3b8', fontSize: 12 }} tickFormatter={(v) => v.split('-')[0]} />
          <YAxis tick={{ fill: '#94a3b8', fontSize: 12 }} tickFormatter={(v) => `${v}%`} />
          <Tooltip content={<CustomTooltip />} />
          <Legend wrapperStyle={{ paddingTop: '20px' }} />
          <Line type="monotone" dataKey="salary" name="Зарплата" stroke="#3b82f6" strokeWidth={2.5} dot={false} />
          <Line type="monotone" dataKey="pricePerSqm" name="Цена м²" stroke="#a855f7" strokeWidth={2.5} dot={false} />
          <Line type="monotone" dataKey="rent1room" name="Аренда" stroke="#10b981" strokeWidth={2} dot={false} />
          <Line type="monotone" dataKey="apartmentCost54" name="Стоимость квартиры" stroke="#f97316" strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
