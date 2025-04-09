"use client"

import { useMemo } from "react"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  type TooltipProps,
} from "recharts"
import { scenarios } from "@/lib/data-utils"

interface TimeSeriesChartProps {
  data: any[]
  selectedScenarios: string[]
  title?: string
  yAxisLabel?: string
}

export function TimeSeriesChart({ data, selectedScenarios, title, yAxisLabel }: TimeSeriesChartProps) {
  const chartData = useMemo(() => {
    if (!data || data.length === 0) return []
    return data
  }, [data])

  const CustomTooltip = ({ active, payload, label }: TooltipProps<number, string>) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border rounded shadow-sm">
          <p className="font-medium text-sm">{`Week ${label}`}</p>
          <div className="mt-1">
            {payload.map((entry) => (
              <div key={entry.name} className="flex items-center gap-2 text-sm">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }} />
                <span>{entry.name}: </span>
                <span className="font-medium">{Number(entry.value).toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      )
    }
    return null
  }

  if (chartData.length === 0) {
    return (
      <div className="flex items-center justify-center h-full w-full bg-gray-50 rounded-lg border">
        <p className="text-gray-500">No data available for the selected category and scenarios</p>
      </div>
    )
  }

  return (
    <div className="w-full h-full">
      {title && <h3 className="text-lg font-medium mb-2">{title}</h3>}
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={chartData}
          margin={{
            top: 20,
            right: 30,
            left: 20,
            bottom: 20,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis
            dataKey="week"
            tick={{ fontSize: 12 }}
            tickFormatter={(value) => {
              const num = Number.parseInt(value)
              return isNaN(num) ? value : `${num}`
            }}
          />
          <YAxis
            tick={{ fontSize: 12 }}
            tickFormatter={(value) => value.toLocaleString()}
            label={
              yAxisLabel
                ? {
                    value: yAxisLabel,
                    angle: -90,
                    position: "insideLeft",
                    style: { textAnchor: "middle", fontSize: 12 },
                  }
                : undefined
            }
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          {selectedScenarios.map((scenario) => {
            const scenarioConfig = scenarios.find((s) => s.name === scenario)
            return (
              <Line
                key={scenario}
                type="monotone"
                dataKey={scenario}
                name={scenario}
                stroke={scenarioConfig?.color || "#000"}
                activeDot={{ r: 6 }}
                strokeWidth={2}
                dot={{ r: 3 }}
              />
            )
          })}
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
