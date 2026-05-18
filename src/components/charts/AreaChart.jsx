import React from 'react'
import {
  AreaChart as ReAreaChart, Area, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts'

export default function AreaChart({ data, dataKey = 'value', color = '#007AFF', height = 200 }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <ReAreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
        <defs>
          <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={color} stopOpacity={0.25} />
            <stop offset="95%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(60,60,67,0.08)" />
        <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#AEAEB2' }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 11, fill: '#AEAEB2' }} axisLine={false} tickLine={false} />
        <Tooltip
          contentStyle={{
            background: 'rgba(255,255,255,0.9)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255,255,255,0.6)',
            borderRadius: 10,
            fontSize: 12,
          }}
        />
        <Area
          type="monotone" dataKey={dataKey}
          stroke={color} strokeWidth={2}
          fill="url(#areaGradient)"
        />
      </ReAreaChart>
    </ResponsiveContainer>
  )
}
