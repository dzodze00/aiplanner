"use client"

import { useMemo } from "react"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  type TooltipProps,
} from "recharts"
import { scenarios, formatValue } from "@/lib/data-utils"

interface ScenarioComparisonProps {
  data: { [key: string]: { [scenario: string]: number } }
  selectedScenarios: string[]
  selectedMetrics: string[]
  title?: string
}

export function ScenarioComparison({ data, selectedScenarios, selectedMetrics, title }: ScenarioComparisonProps) {
  const chartData = useMemo(() => {
    if (!data || Object.keys(data).length === 0) return []

    return selectedMetrics.map((metric) => {
      const metricData: any = { name: metric }
      selectedScenarios.forEach((scenario) => {
        metricData[scenario] = data[metric]?.[scenario] || 0
      })
      return metricData
    })
  }, [data, selectedScenarios, selectedMetrics])

  const CustomTooltip = ({ active, payload, label }: TooltipProps<number, string>) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border rounded shadow-sm">
          <p className="font-medium text-sm">{label}</p>
          <div className="mt-1">
            {payload.map((entry) => (
              <div key={entry.name} className="flex items-center gap-2 text-sm">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }} />
                <span>{entry.name}: </span>
                <span className="font-medium">{formatValue(Number(entry.value), "decimal")}</span>
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
      <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg border">
        <p className="text-gray-500">No data available</p>
      </div>
    )
  }

  return (
    <div className="w-full">
      {title && <h3 className="text-lg font-medium mb-2">{title}</h3>}
      <div className="w-full h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            margin={{
              top: 5,
              right: 30,
              left: 20,
              bottom: 5,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="name" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} tickFormatter={(value) => value.toLocaleString()} />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            {selectedScenarios.map((scenario) => {
              const scenarioConfig = scenarios.find((s) => s.name === scenario)
              return (
                <Bar
                  key={scenario}
                  dataKey={scenario}
                  name={scenario}
                  fill={scenarioConfig?.color || "#000"}
                  barSize={20}
                />
              )
            })}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
