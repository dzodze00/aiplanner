"use client"

import { Card, CardContent } from "@/components/ui/card"
import { TrendingUp, TrendingDown, Package, Truck, BarChart3 } from "lucide-react"
import { scenarios, formatValue, getPercentChange } from "@/lib/data-utils"

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

  // If no KPIs or no selected scenarios, show a message
  if (Object.keys(kpis).length === 0 || selectedScenarios.length === 0) {
    return (
      <Card>
        <CardContent className="p-6">
          <h2 className="text-lg font-semibold mb-2">Key Performance Indicators</h2>
          <div className="text-center py-6 text-gray-500">
            {Object.keys(kpis).length === 0
              ? "No KPI data available. Please upload data files."
              : "No scenarios selected. Please select at least one scenario."}
          </div>
        </CardContent>
      </Card>
    )
  }

  // Filter KPIs to only include those with data for selected scenarios
  const availableKpis = Object.keys(kpis).filter((kpiName) => {
    return selectedScenarios.some((scenario) => kpis[kpiName]?.[scenario] !== undefined)
  })

  if (availableKpis.length === 0) {
    return (
      <Card>
        <CardContent className="p-6">
          <h2 className="text-lg font-semibold mb-2">Key Performance Indicators</h2>
          <div className="text-center py-6 text-gray-500">No KPI data available for the selected scenarios.</div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardContent className="p-6">
        <h2 className="text-lg font-semibold mb-4">Key Performance Indicators</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {availableKpis.map((kpiName) => {
            const baseValue = kpis[kpiName]?.["BASE"] || 0
            const s4Value = kpis[kpiName]?.["S4"] || 0
            const percentChange = getPercentChange(baseValue, s4Value)
            const isPositive = percentChange > 0

            return (
              <div key={kpiName} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium text-sm">{kpiName}</h3>
                  {getKPIIcon(kpiName)}
                </div>
                <div className="space-y-2">
                  {selectedScenarios.map((scenario) => {
                    const value = kpis[kpiName]?.[scenario]
                    if (value === undefined) return null

                    return (
                      <div key={scenario} className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div
                            className="w-3 h-3 rounded-full mr-2"
                            style={{ backgroundColor: getScenarioColor(scenario) }}
                          ></div>
                          <span className="text-sm">{scenario}:</span>
                        </div>
                        <span className="font-semibold">{formatValue(value, "decimal")}</span>
                      </div>
                    )
                  })}
                </div>

                {showComparison && kpis[kpiName]?.["BASE"] !== undefined && kpis[kpiName]?.["S4"] !== undefined && (
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
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
