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
    <div className="w-full">
      <ChartContainer config={chartConfig} className="min-h-[280px] max-w-2xl mx-auto w-full">
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data} accessibilityLayer margin={{ top: 20, right: 30, left: 30, bottom: 20 }}>
            <CartesianGrid vertical={false} strokeDasharray="3 3" opacity={0.3} />
            <XAxis
              dataKey="verticle"
              tickLine={false}
              tickMargin={10}
              axisLine={true}
              fontSize={13}
            />
            <YAxis fontSize={13} tickLine={false} axisLine={true} />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent indicator="dot" />}
            />
            <Bar dataKey="totalHours" radius={6} maxBarSize={80}>
              {data.map((item, index) => (
                <Cell 
                  key={`${item.verticle}-${index}`} 
                  fill={(chartConfig[item.verticle as keyof typeof chartConfig] as any)?.color || verticleColors.CMIS} 
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </ChartContainer>
    </div>
  );
}
