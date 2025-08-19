'use client';

import { Bar, BarChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer } from 'recharts';
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import type { AggregatedVerticleData } from '@/lib/types';

interface SummaryChartProps {
  data: AggregatedVerticleData[];
}

const chartConfig = {
  totalHours: {
    label: 'Total Hours',
  },
  CMIS: {
    label: 'CMIS',
    color: 'hsl(var(--chart-1))',
  },
  TRI: {
    label: 'TRI',
    color: 'hsl(var(--chart-2))',
  },
  LOF: {
    label: 'LOF',
    color: 'hsl(var(--chart-3))',
  },
  TRG: {
    label: 'TRG',
    color: 'hsl(var(--chart-4))',
  },
} satisfies ChartConfig;

export default function SummaryChart({ data }: SummaryChartProps) {
  return (
    <ChartContainer config={chartConfig} className="min-h-[200px] w-full">
      <ResponsiveContainer width="100%" height={350}>
        <BarChart data={data} accessibilityLayer>
          <CartesianGrid vertical={false} />
          <XAxis
            dataKey="verticle"
            tickLine={false}
            tickMargin={10}
            axisLine={false}
          />
          <YAxis />
          <ChartTooltip
            cursor={false}
            content={<ChartTooltipContent indicator="dot" />}
          />
          <Bar dataKey="totalHours" fill="var(--color-verticle)" radius={4}>
            {data.map((item) => (
                <Bar key={item.verticle} dataKey="totalHours" fill={chartConfig[item.verticle]?.color || 'hsl(var(--primary))'} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
}
