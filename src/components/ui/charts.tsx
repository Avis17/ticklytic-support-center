
import React from 'react';
import {
  AreaChart as RechartsAreaChart,
  BarChart as RechartsBarChart,
  PieChart as RechartsPieChart,
  Area,
  Bar,
  Pie,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { ChartContainer } from './chart';

interface ChartProps {
  data: any[];
  height?: number;
  index: string;
  categories?: string[];
  colors?: string[];
  valueFormatter?: (value: number) => string;
  showLegend?: boolean;
  showXAxis?: boolean;
  showYAxis?: boolean;
}

export const AreaChart = ({
  data,
  height = 300,
  index,
  categories = ['value'],
  colors = ['#3b82f6'],
  valueFormatter = (value: number) => `${value}`,
  showLegend = true,
  showXAxis = false,
  showYAxis = false,
}: ChartProps) => {
  const config = categories.reduce((acc, category, i) => {
    const color = colors[i % colors.length];
    return {
      ...acc,
      [category]: {
        label: category,
        color,
      },
    };
  }, {});

  return (
    <ChartContainer config={config} height={height}>
      <RechartsAreaChart data={data}>
        <defs>
          {categories.map((category, i) => (
            <linearGradient
              key={`gradient-${category}`}
              id={`gradient-${category}`}
              x1="0"
              y1="0"
              x2="0"
              y2="1"
            >
              <stop offset="5%" stopColor={colors[i % colors.length]} stopOpacity={0.8} />
              <stop offset="95%" stopColor={colors[i % colors.length]} stopOpacity={0.2} />
            </linearGradient>
          ))}
        </defs>
        {showXAxis && <XAxis dataKey={index} />}
        {showYAxis && <YAxis />}
        <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
        <Tooltip
          formatter={(value: number) => [valueFormatter(value)]}
          labelFormatter={(value) => `${value}`}
        />
        {showLegend && <Legend />}
        {categories.map((category, i) => (
          <Area
            key={`area-${category}`}
            type="monotone"
            dataKey={category}
            stroke={colors[i % colors.length]}
            fillOpacity={1}
            fill={`url(#gradient-${category})`}
            strokeWidth={2}
          />
        ))}
      </RechartsAreaChart>
    </ChartContainer>
  );
};

export const BarChart = ({
  data,
  height = 300,
  index,
  categories = ['value'],
  colors = ['#3b82f6'],
  valueFormatter = (value: number) => `${value}`,
  showLegend = true,
  showXAxis = false,
  showYAxis = false,
}: ChartProps) => {
  const config = categories.reduce((acc, category, i) => {
    const color = colors[i % colors.length];
    return {
      ...acc,
      [category]: {
        label: category,
        color,
      },
    };
  }, {});

  return (
    <ChartContainer config={config} height={height}>
      <RechartsBarChart data={data}>
        {showXAxis && <XAxis dataKey={index} />}
        {showYAxis && <YAxis />}
        <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
        <Tooltip
          formatter={(value: number) => [valueFormatter(value)]}
          labelFormatter={(value) => `${value}`}
        />
        {showLegend && <Legend />}
        {categories.map((category, i) => (
          <Bar
            key={`bar-${category}`}
            dataKey={category}
            fill={colors[i % colors.length]}
            radius={[4, 4, 0, 0]}
          />
        ))}
      </RechartsBarChart>
    </ChartContainer>
  );
};

export const PieChart = ({
  data,
  height = 300,
  index,
  colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444'],
  valueFormatter = (value: number) => `${value}`,
}: ChartProps) => {
  const config = data.reduce((acc, item, i) => {
    const color = colors[i % colors.length];
    return {
      ...acc,
      [item.name]: {
        label: item.name,
        color,
      },
    };
  }, {});

  return (
    <ChartContainer config={config} height={height}>
      <RechartsPieChart>
        <Tooltip formatter={(value: number) => [valueFormatter(value)]} />
        <Legend />
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          labelLine={false}
          outerRadius={80}
          fill="#8884d8"
          dataKey="value"
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
          ))}
        </Pie>
      </RechartsPieChart>
    </ChartContainer>
  );
};
