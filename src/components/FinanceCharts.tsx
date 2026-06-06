import React from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, PieChart, Pie, Legend,
} from 'recharts';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Transaction {
  type: 'income' | 'expense';
  amount: number;
  category: string;
  date: string;
}

interface FinanceChartsProps {
  transactions: Transaction[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const MONTHS: Record<number, string> = {
  1:'Jan',2:'Feb',3:'Mac',4:'Apr',5:'Mei',6:'Jun',
  7:'Jul',8:'Ogos',9:'Sep',10:'Okt',11:'Nov',12:'Dis',
};

const DONUT_COLORS = [
  '#3b82f6','#10b981','#f59e0b','#ef4444',
  '#8b5cf6','#06b6d4','#f97316','#84cc16',
];

const formatMoney = (n: number) =>
  `RM ${n.toLocaleString('en-MY', { minimumFractionDigits: 0 })}`;

// ─── Custom Tooltip for Bar Chart ─────────────────────────────────────────────

const BarTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-lg p-3 text-sm">
      <p className="font-bold text-gray-700 mb-2">{label}</p>
      {payload.map((p: any) => (
        <div key={p.dataKey} className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: p.fill }} />
          <span className="text-gray-600">{p.name}:</span>
          <span className="font-semibold text-gray-800">{formatMoney(p.value)}</span>
        </div>
      ))}
    </div>
  );
};

// ─── Custom Tooltip for Donut ─────────────────────────────────────────────────

const DonutTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  const { name, value, percent } = payload[0];
  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-lg p-3 text-sm">
      <p className="font-bold text-gray-700">{name}</p>
      <p className="text-gray-600">{formatMoney(value)}</p>
      <p className="text-gray-400 text-xs">{(percent * 100).toFixed(1)}%</p>
    </div>
  );
};

// ─── Custom Legend ────────────────────────────────────────────────────────────

const DonutLegend = ({ payload }: any) => (
  <ul className="flex flex-wrap justify-center gap-x-4 gap-y-1.5 mt-3">
    {payload?.map((entry: any, i: number) => (
      <li key={i} className="flex items-center gap-1.5 text-xs text-gray-600">
        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: entry.color }} />
        {entry.value}
      </li>
    ))}
  </ul>
);

// ─── Main Component ───────────────────────────────────────────────────────────

const FinanceCharts: React.FC<FinanceChartsProps> = ({ transactions }) => {

  // ── Bar chart: last 6 months income vs expense ──────────────────────────────
  const barData = (() => {
    const now = new Date();
    return Array.from({ length: 6 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
      const monthNum = d.getMonth() + 1;
      const year = d.getFullYear();

      const monthTx = transactions.filter(tx => {
        const [y, m] = tx.date.split('-').map(Number);
        return y === year && m === monthNum;
      });

      return {
        month: MONTHS[monthNum],
        Masuk:  monthTx.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0),
        Keluar: monthTx.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0),
      };
    });
  })();

  // ── Donut: expense breakdown by category ────────────────────────────────────
  const expenseByCategory = (() => {
    const map: Record<string, number> = {};
    transactions
      .filter(t => t.type === 'expense')
      .forEach(t => { map[t.category] = (map[t.category] ?? 0) + t.amount; });
    return Object.entries(map)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  })();

  // ── Donut: income breakdown by category ─────────────────────────────────────
  const incomeByCategory = (() => {
    const map: Record<string, number> = {};
    transactions
      .filter(t => t.type === 'income')
      .forEach(t => { map[t.category] = (map[t.category] ?? 0) + t.amount; });
    return Object.entries(map)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  })();

  const hasData = transactions.length > 0;

  if (!hasData) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8 text-center text-gray-400">
        <p className="text-3xl mb-2">📊</p>
        <p>Tiada data untuk dipaparkan. Tambah transaksi dahulu.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">

      {/* Bar chart — full width */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
        <h3 className="text-sm font-bold text-gray-700 mb-1">Masuk vs Keluar (6 Bulan)</h3>
        <p className="text-xs text-gray-400 mb-5">Perbandingan pendapatan dan perbelanjaan bulanan</p>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={barData} barCategoryGap="30%" barGap={4}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
            <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
            <YAxis tickFormatter={v => v === 0 ? '0' : `RM${(v/1000).toFixed(0)}k`}
              tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} width={52} />
            <Tooltip content={<BarTooltip />} cursor={{ fill: '#f9fafb', radius: 4 }} />
            <Legend wrapperStyle={{ fontSize: 12, paddingTop: 16 }} />
            <Bar dataKey="Masuk"  name="Masuk"  fill="#10b981" radius={[4,4,0,0]} />
            <Bar dataKey="Keluar" name="Keluar" fill="#ef4444" radius={[4,4,0,0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Donut charts stacked full-width to match transactions layout */}
      <div className="space-y-4">

        {/* Expense donut */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 w-full">
          <h3 className="text-sm font-bold text-gray-700 mb-1">Perbelanjaan mengikut Kategori</h3>
          <p className="text-xs text-gray-400 mb-4">Pecahan jumlah keluar</p>
          {expenseByCategory.length === 0 ? (
            <p className="text-center text-gray-400 text-sm py-8">Tiada rekod perbelanjaan.</p>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie data={expenseByCategory} cx="50%" cy="45%"
                  innerRadius={60} outerRadius={90}
                  paddingAngle={3} dataKey="value">
                  {expenseByCategory.map((_, i) => (
                    <Cell key={i} fill={DONUT_COLORS[i % DONUT_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<DonutTooltip />} />
                <Legend content={<DonutLegend />} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Income donut */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 w-full">
          <h3 className="text-sm font-bold text-gray-700 mb-1">Pendapatan mengikut Kategori</h3>
          <p className="text-xs text-gray-400 mb-4">Pecahan jumlah masuk</p>
          {incomeByCategory.length === 0 ? (
            <p className="text-center text-gray-400 text-sm py-8">Tiada rekod pendapatan.</p>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie data={incomeByCategory} cx="50%" cy="45%"
                  innerRadius={60} outerRadius={90}
                  paddingAngle={3} dataKey="value">
                  {incomeByCategory.map((_, i) => (
                    <Cell key={i} fill={DONUT_COLORS[i % DONUT_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<DonutTooltip />} />
                <Legend content={<DonutLegend />} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

      </div>
    </div>
  );
};

export default FinanceCharts;