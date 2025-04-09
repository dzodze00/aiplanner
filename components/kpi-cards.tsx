"use client"

import { TrendingUp, TrendingDown, Package, Truck, BarChart3 } from "lucide-react"
import { scenarios } from "@/lib/data-utils"

interface KPICardsProps {
  kpis: { [key: string]: { [scenario: string]: number } }
  selectedScenarios: string[]
}

export function KPICards({ kpis, selectedScenarios }: KPICardsProps) {
  // Only show BASE and S4 for comparison if both are available
  const showComparison = selectedScenarios.includes("BASE") && selectedScenarios.includes("S4")

  const getScenarioColor = (scenarioName: string) => {
    const scenario = scenarios.find((s) => s.name === scenarioName)
    return scenario ? scenario.color : "#cccccc"
  }

  const getPercentChange = (baseValue: number, newValue: number) => {
    if (baseValue === 0) return 0
    return ((newValue - baseValue) / Math.abs(baseValue)) * 100
  }

  // If no KPIs or no selected scenarios, show a message
  if (!kpis || Object.keys(kpis).length === 0 || selectedScenarios.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500 bg-white rounded-lg border">
        {!kpis || Object.keys(kpis).length === 0
          ? "No KPI data available. Please select a different category."
          : "No scenarios selected. Please select at least one scenario."}
      </div>
    )
  }

  // Filter KPIs to only include those with data
  const availableKpis = Object.keys(kpis).filter((kpiName) =>
    selectedScenarios.some((scenario) => kpis[kpiName]?.[scenario] !== undefined),
  )

  if (availableKpis.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500 bg-white rounded-lg border">
        No KPI data available for the selected scenarios and categories.
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
      {availableKpis.map((kpiKey) => {
        const kpiData = kpis[kpiKey]
        const baseValue = kpiData?.["BASE"] || 0
        const s4Value = kpiData?.["S4"] || 0
        const percentChange = getPercentChange(baseValue, s4Value)
        const isPositive = percentChange > 0

        // Determine icon and background color based on KPI key
        let icon = <BarChart3 className="h-5 w-5 text-blue-600" />
        let bgColor = "bg-blue-50"

        if (kpiKey.includes("Fill Rate")) {
          icon = <TrendingUp className="h-5 w-5 text-blue-600" />
          bgColor = "bg-blue-50"
        } else if (kpiKey.includes("Inventory")) {
          icon = <Package className="h-5 w-5 text-purple-600" />
          bgColor = "bg-purple-50"
        } else if (kpiKey.includes("Production")) {
          icon = <Truck className="h-5 w-5 text-green-600" />
          bgColor = "bg-green-50"
        }

        return (
          <div key={kpiKey} className={`border rounded-lg overflow-hidden shadow-sm ${bgColor}`}>
            <div className="border-b p-3 flex items-center justify-between">
              <h3 className="font-medium">{kpiKey}</h3>
              {icon}
            </div>

            <div className="p-4 bg-white">
              <div className="space-y-2">
                {selectedScenarios.map((scenario) => {
                  const value = kpiData?.[scenario]
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
                      <span className="font-semibold">{typeof value === "number" ? value.toFixed(1) : "N/A"}</span>
                    </div>
                  )
                })}
              </div>

              {showComparison && kpiData?.["BASE"] !== undefined && kpiData?.["S4"] !== undefined && (
                <div className="mt-3 pt-3 border-t">
                  <div className="flex items-center justify-between text-xs">
                    <span>BASE → S4:</span>
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
          </div>
        )
      })}
    </div>
  )
}
