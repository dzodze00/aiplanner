"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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
    return ((newValue - baseValue) / baseValue) * 100
  }

  // If no KPIs or no selected scenarios, show a message
  if (Object.keys(kpis).length === 0 || selectedScenarios.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground bg-background rounded-lg border shadow-sm">
        {Object.keys(kpis).length === 0
          ? "No KPI data available. Please select a different category."
          : "No scenarios selected. Please select at least one scenario."}
      </div>
    )
  }

  const kpiConfig = [
    {
      key: "Fill Rate (%)",
      title: "Fill Rate",
      description: "Average fill rate across selected time periods",
      icon: <TrendingUp className="h-5 w-5 text-blue-600" />,
      format: (value: number) => `${value.toFixed(1)}%`,
      positiveChange: "up",
      bgColor: "bg-blue-50",
    },
    {
      key: "Avg. Planned Inventory",
      title: "Inventory Level",
      description: "Average planned inventory across time periods",
      icon: <Package className="h-5 w-5 text-purple-600" />,
      format: (value: number) => value.toFixed(0),
      positiveChange: "balanced",
      bgColor: "bg-purple-50",
    },
    {
      key: "Total Production Orders",
      title: "Production Orders",
      description: "Total production orders across time periods",
      icon: <Truck className="h-5 w-5 text-green-600" />,
      format: (value: number) => value.toFixed(0),
      positiveChange: "balanced",
      bgColor: "bg-green-50",
    },
    {
      key: "Supply vs Demand",
      title: "Supply vs Demand",
      description: "Ratio of supply to demand",
      icon: <BarChart3 className="h-5 w-5 text-amber-600" />,
      format: (value: number) => value.toFixed(2),
      positiveChange: "up",
      bgColor: "bg-amber-50",
    },
    {
      key: "Total Alerts",
      title: "Alerts",
      description: "Total number of alerts",
      icon: <BarChart3 className="h-5 w-5 text-red-600" />,
      format: (value: number) => value.toFixed(0),
      positiveChange: "down",
      bgColor: "bg-red-50",
    },
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
      {kpiConfig.map((kpi) => {
        // Skip if we don't have data for this KPI
        if (!kpis[kpi.key]) return null

        const baseValue = kpis[kpi.key]?.["BASE"] || 0
        const s4Value = kpis[kpi.key]?.["S4"] || 0
        const percentChange = getPercentChange(baseValue, s4Value)
        const isPositive =
          kpi.positiveChange === "up"
            ? percentChange > 0
            : kpi.positiveChange === "down"
              ? percentChange < 0
              : Math.abs(percentChange) < 10 // For "balanced", consider small changes as positive

        return (
          <Card key={kpi.key} className="overflow-hidden shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className={`${kpi.bgColor} border-b pb-3`}>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">{kpi.title}</CardTitle>
                {kpi.icon}
              </div>
            </CardHeader>

            <CardContent className="p-4">
              <div className="space-y-2">
                {selectedScenarios.map((scenario) => {
                  const value = kpis[kpi.key]?.[scenario]
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
                      <span className="font-semibold">{kpi.format(value)}</span>
                    </div>
                  )
                })}
              </div>

              {showComparison && kpis[kpi.key]?.["BASE"] !== undefined && kpis[kpi.key]?.["S4"] !== undefined && (
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
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
