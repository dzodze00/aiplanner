"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { TrendingUp, TrendingDown, Package, Truck, BarChart3 } from "lucide-react"
import { scenarios, kpiDefinitions, formatValue, getPercentChange } from "@/lib/data-utils"

interface KPIDashboardProps {
  kpis: { [key: string]: { [scenario: string]: number } }
  selectedScenarios: string[]
}

export function KPIDashboard({ kpis, selectedScenarios }: KPIDashboardProps) {
  // Only show BASE and S4 for comparison if both are available
  const showComparison = selectedScenarios.includes("BASE") && selectedScenarios.includes("S4")

  const getScenarioColor = (scenarioName: string) => {
    const scenario = scenarios.find((s) => s.name === scenarioName)
    return scenario ? scenario.color : "#cccccc"
  }

  const getKPIIcon = (kpiName: string) => {
    switch (kpiName) {
      case "Fill Rate":
        return <TrendingUp className="h-4 w-4" />
      case "Inventory Level":
        return <Package className="h-4 w-4" />
      case "Production Orders":
        return <Truck className="h-4 w-4" />
      case "Supply vs Demand":
        return <BarChart3 className="h-4 w-4" />
      case "Capacity Utilization":
        return <BarChart3 className="h-4 w-4" />
      default:
        return <BarChart3 className="h-4 w-4" />
    }
  }

  const getKPIFormat = (kpiName: string) => {
    const kpiDef = kpiDefinitions.find((k) => k.name === kpiName)
    return kpiDef?.format || "number"
  }

  const isPositiveChange = (kpiName: string, percentChange: number) => {
    const kpiDef = kpiDefinitions.find((k) => k.name === kpiName)
    if (!kpiDef) return percentChange > 0

    switch (kpiDef.positiveChange) {
      case "up":
        return percentChange > 0
      case "down":
        return percentChange < 0
      case "balanced":
        return Math.abs(percentChange) < 10 // For "balanced", consider small changes as positive
    }
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
      {Object.keys(kpis).map((kpiName) => {
        const baseValue = kpis[kpiName]?.["BASE"] || 0
        const s4Value = kpis[kpiName]?.["S4"] || 0
        const percentChange = getPercentChange(baseValue, s4Value)
        const isPositive = isPositiveChange(kpiName, percentChange)
        const format = getKPIFormat(kpiName)

        return (
          <Card key={kpiName} className="overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between pb-2 bg-gray-50">
              <CardTitle className="text-sm font-medium">{kpiName}</CardTitle>
              {getKPIIcon(kpiName)}
            </CardHeader>
            <CardContent className="pt-4">
              <div className="space-y-2">
                {selectedScenarios.map((scenario) => {
                  const value = kpis[kpiName]?.[scenario] || 0
                  return (
                    <div key={scenario} className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div
                          className="w-3 h-3 rounded-full mr-2"
                          style={{ backgroundColor: getScenarioColor(scenario) }}
                        ></div>
                        <span className="text-sm">{scenario}:</span>
                      </div>
                      <span className="font-semibold">{formatValue(value, format)}</span>
                    </div>
                  )
                })}
              </div>

              {showComparison && (
                <div className="mt-3 pt-2 border-t">
                  <div className="flex items-center justify-between text-xs">
                    <span>Change (BASE → S4):</span>
                    <span
                      className={`flex items-center font-semibold ${isPositive ? "text-green-600" : "text-red-600"}`}
                    >
                      {percentChange > 0 ? (
                        <TrendingUp className="h-3 w-3 mr-1" />
                      ) : (
                        <TrendingDown className="h-3 w-3 mr-1" />
                      )}
                      {percentChange > 0 ? "+" : ""}
                      {percentChange.toFixed(1)}%
                    </span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
