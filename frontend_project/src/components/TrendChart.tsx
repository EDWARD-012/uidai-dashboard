import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import type { ChartData } from '../types.ts';

interface TrendChartProps {
  data: ChartData[];
}

const TrendChart: React.FC<TrendChartProps> = ({ data }) => {
  if (!data || data.length === 0) {
    return <div className="h-full flex items-center justify-center text-slate-400">No trend data available</div>;
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
      <h3 className="text-lg font-bold text-slate-800 mb-4">Enrolment Trends (Monthly)</h3>
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
            <XAxis 
              dataKey="date" 
              tick={{fontSize: 12, fill: '#64748b'}} 
              tickLine={false} 
              axisLine={false}
            />
            <YAxis 
              tick={{fontSize: 12, fill: '#64748b'}} 
              tickLine={false} 
              axisLine={false}
              tickFormatter={(value) => `${value / 1000}k`} 
            />
            <Tooltip 
              contentStyle={{backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0'}}
              formatter={(value: number | undefined) => [value ? value.toLocaleString() : '0', 'Enrolments']}
            />
            <Line 
              type="monotone" 
              dataKey="enrolments" 
              stroke="#1e3a8a" 
              strokeWidth={3} 
              dot={{r: 4, fill: '#1e3a8a'}} 
              activeDot={{r: 6}} 
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default TrendChart;