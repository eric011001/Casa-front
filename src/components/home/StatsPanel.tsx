"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  type TooltipContentProps,
} from "recharts";
import { useAsyncData } from "@/hooks/useAsyncData";
import { expensesApi } from "@/services/expenses.api";
import { formatCurrency } from "@/lib/format";
import {
  EXPENSE_CATEGORY_LABELS,
  EXPENSE_TYPE_LABELS,
} from "@/lib/expense-labels";
import { CHART_COLORS } from "@/lib/chart-colors";
import { LoadingBar } from "@/components/ui/LoadingBar";
import { StatTile } from "./StatTile";
import { ChartCard } from "./ChartCard";
import type { ExpenseStats } from "@/types/models";

const AXIS_COLOR = "#71717a";
const GRID_COLOR = "rgba(113, 113, 122, 0.2)";

function CurrencyTooltip({ active, payload, label }: TooltipContentProps) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-black/[.08] bg-white px-3 py-2 text-xs shadow-md dark:border-white/[.145] dark:bg-[#111]">
      {label && (
        <p className="mb-1 font-medium text-black dark:text-zinc-50">
          {label}
        </p>
      )}
      {payload.map((entry) => (
        <p
          key={String(entry.dataKey ?? entry.name)}
          style={{ color: entry.color }}
        >
          {entry.name}: {formatCurrency(Number(entry.value))}
        </p>
      ))}
    </div>
  );
}

function EmptyChartMessage() {
  return (
    <div className="flex h-[260px] items-center justify-center text-sm text-zinc-500 dark:text-zinc-400">
      Sin datos suficientes todavía.
    </div>
  );
}

export function StatsPanel({ houseId }: { houseId: string }) {
  const { data: stats, loading, error } = useAsyncData<ExpenseStats>(() =>
    expensesApi.stats(houseId)
  );

  if (loading) return <LoadingBar />;

  if (error) {
    return (
      <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
        {error}
      </p>
    );
  }

  if (!stats) return null;

  const monthlySeriesData = stats.monthlySeries.map((point) => ({
    month: point.month,
    total: point.total,
  }));

  const categoryData = Object.entries(stats.byCategory)
    .filter(([, value]) => value.count > 0)
    .map(([key, value]) => ({
      category: EXPENSE_CATEGORY_LABELS[key] ?? key,
      total: value.total,
    }))
    .sort((a, b) => b.total - a.total);

  const typeData = Object.entries(stats.byType)
    .filter(([, value]) => value.count > 0)
    .map(([key, value]) => ({
      name: EXPENSE_TYPE_LABELS[key] ?? key,
      value: value.total,
    }));

  const memberData = stats.byMember
    .map((entry) => ({
      name: entry.user
        ? `${entry.user.nombre} ${entry.user.apellido}`
        : "Desconocido",
      total: entry.total,
    }))
    .sort((a, b) => b.total - a.total);

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatTile
          label="Gastos activos"
          value={String(stats.general.activeExpenses)}
          hint={`${stats.general.totalExpenses} en total`}
        />
        <StatTile
          label="Monto promedio"
          value={formatCurrency(stats.general.averageAmount)}
        />
        <StatTile
          label="Costo recurrente mensual"
          value={formatCurrency(stats.monthlyRecurringCost)}
          hint="Suscripciones y préstamos activos"
        />
        <StatTile
          label="Deuda de préstamos"
          value={formatCurrency(stats.loans.totalOutstandingDebt)}
          hint={`${stats.loans.count} préstamo${
            stats.loans.count === 1 ? "" : "s"
          }`}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ChartCard title="Gasto mensual" subtitle="Últimos 6 meses">
          {monthlySeriesData.every((point) => point.total === 0) ? (
            <EmptyChartMessage />
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={monthlySeriesData}>
                <CartesianGrid stroke={GRID_COLOR} vertical={false} />
                <XAxis
                  dataKey="month"
                  stroke={AXIS_COLOR}
                  fontSize={12}
                  tickLine={false}
                />
                <YAxis
                  stroke={AXIS_COLOR}
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  width={70}
                  tickFormatter={(value) => formatCurrency(Number(value))}
                />
                <Tooltip content={CurrencyTooltip} />
                <Line
                  type="monotone"
                  dataKey="total"
                  name="Total"
                  stroke={CHART_COLORS[0]}
                  strokeWidth={2}
                  dot={{ r: 3 }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        <ChartCard title="Gasto por categoría">
          {categoryData.length === 0 ? (
            <EmptyChartMessage />
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={categoryData} layout="vertical" margin={{ left: 12 }}>
                <CartesianGrid stroke={GRID_COLOR} horizontal={false} />
                <XAxis
                  type="number"
                  stroke={AXIS_COLOR}
                  fontSize={12}
                  tickFormatter={(value) => formatCurrency(Number(value))}
                />
                <YAxis
                  type="category"
                  dataKey="category"
                  stroke={AXIS_COLOR}
                  fontSize={12}
                  width={110}
                />
                <Tooltip content={CurrencyTooltip} />
                <Bar dataKey="total" name="Total" radius={[0, 4, 4, 0]}>
                  {categoryData.map((_, index) => (
                    <Cell
                      key={index}
                      fill={CHART_COLORS[index % CHART_COLORS.length]}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        <ChartCard title="Distribución por tipo">
          {typeData.length === 0 ? (
            <EmptyChartMessage />
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={typeData}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={2}
                >
                  {typeData.map((_, index) => (
                    <Cell
                      key={index}
                      fill={CHART_COLORS[index % CHART_COLORS.length]}
                    />
                  ))}
                </Pie>
                <Legend />
                <Tooltip content={CurrencyTooltip} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        <ChartCard title="Gasto por integrante">
          {memberData.length === 0 ? (
            <EmptyChartMessage />
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={memberData}>
                <CartesianGrid stroke={GRID_COLOR} vertical={false} />
                <XAxis
                  dataKey="name"
                  stroke={AXIS_COLOR}
                  fontSize={12}
                  tickLine={false}
                />
                <YAxis
                  stroke={AXIS_COLOR}
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  width={70}
                  tickFormatter={(value) => formatCurrency(Number(value))}
                />
                <Tooltip content={CurrencyTooltip} />
                <Bar
                  dataKey="total"
                  name="Total"
                  fill={CHART_COLORS[1]}
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>
      </div>

      {stats.upcoming30Days.length > 0 && (
        <ChartCard title="Próximos 30 días">
          <ul className="flex flex-col divide-y divide-black/[.06] dark:divide-white/[.08]">
            {stats.upcoming30Days.slice(0, 8).map((item, index) => (
              <li
                key={`${item.expenseId}-${index}`}
                className="flex items-center justify-between gap-3 py-2 text-sm"
              >
                <div>
                  <p className="font-medium text-black dark:text-zinc-50">
                    {item.name}
                  </p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    {new Date(item.date).toLocaleDateString("es-MX", {
                      day: "2-digit",
                      month: "short",
                    })}
                    {item.installmentNumber
                      ? ` · cuota ${item.installmentNumber}`
                      : ""}
                  </p>
                </div>
                <span className="font-medium text-zinc-700 dark:text-zinc-300">
                  {formatCurrency(item.amount)}
                </span>
              </li>
            ))}
          </ul>
        </ChartCard>
      )}
    </div>
  );
}
