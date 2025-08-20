'use client';

import { Bar, BarChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer, Cell } from 'recharts';
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import type { AggregatedVerticleData } from '@/lib/types';
import { verticleColors } from '@/lib/colors';

interface SummaryChartProps {
  data: AggregatedVerticleData[];
}

const chartConfig = {
  totalHours: {
    label: 'Total Hours',
  },
  CMIS: {
    label: 'CMIS',
    color: verticleColors.CMIS,
  },
  TRI: {
    label: 'TRI',
    color: verticleColors.TRI,
  },
  LOF: {
    label: 'LOF',
    color: verticleColors.LOF,
  },
  TRG: {
    label: 'TRG',
    color: verticleColors.TRG,
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
          <Bar dataKey="totalHours" radius={4}>
            {data.map((item, index) => (
              <Cell 
                key={`${item.verticle}-${index}`} 
                fill={chartConfig[item.verticle as keyof typeof chartConfig]?.color || verticleColors.CMIS} 
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
}
