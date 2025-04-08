"use client"

import { useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { TrendingUp, TrendingDown, AlertCircle, Info } from "lucide-react"

interface DataInsightsProps {
  data: any[]
  kpis: { [key: string]: { [scenario: string]: number } }
}

export function DataInsights({ data, kpis }: DataInsightsProps) {
  const insights = useMemo(() => {
    if (!data || data.length === 0 || !kpis || Object.keys(kpis).length === 0) {
      return []
    }

    const results = []

    // Check for fill rate improvements
    if (kpis["Fill Rate"] && kpis["Fill Rate"]["BASE"] && kpis["Fill Rate"]["S4"]) {
      const baseRate = kpis["Fill Rate"]["BASE"]
      const s4Rate = kpis["Fill Rate"]["S4"]
      const improvement = ((s4Rate - baseRate) / baseRate) * 100

      if (improvement > 5) {
        results.push({
          type: "positive",
          title: "Fill Rate Improvement",
          description: `S4 shows a ${improvement.toFixed(1)}% improvement in fill rate compared to the BASE scenario.`,
          metric: "Fill Rate",
          scenarios: ["BASE", "S4"],
        })
      } else if (improvement < -5) {
        results.push({
          type: "negative",
          title: "Fill Rate Decline",
          description: `S4 shows a ${Math.abs(improvement).toFixed(1)}% decrease in fill rate compared to the BASE scenario.`,
          metric: "Fill Rate",
          scenarios: ["BASE", "S4"],
        })
      }
    }

    // Check for inventory optimization
    if (kpis["Inventory Level"] && kpis["Inventory Level"]["BASE"] && kpis["Inventory Level"]["S4"]) {
      const baseInventory = kpis["Inventory Level"]["BASE"]
      const s4Inventory = kpis["Inventory Level"]["S4"]
      const change = ((s4Inventory - baseInventory) / baseInventory) * 100

      if (change < -10) {
        results.push({
          type: "positive",
          title: "Inventory Optimization",
          description: `S4 reduces average inventory by ${Math.abs(change).toFixed(1)}% while maintaining service levels.`,
          metric: "Inventory Level",
          scenarios: ["BASE", "S4"],
        })
      } else if (change > 20) {
        results.push({
          type: "warning",
          title: "Increased Inventory",
          description: `S4 increases average inventory by ${change.toFixed(1)}%. Verify if this is necessary for improved service.`,
          metric: "Inventory Level",
          scenarios: ["BASE", "S4"],
        })
      }
    }

    // Check for production efficiency
    if (kpis["Production Orders"] && kpis["Production Orders"]["BASE"] && kpis["Production Orders"]["S4"]) {
      const baseProduction = kpis["Production Orders"]["BASE"]
      const s4Production = kpis["Production Orders"]["S4"]
      const change = ((s4Production - baseProduction) / baseProduction) * 100

      if (Math.abs(change) > 10) {
        results.push({
          type: change > 0 ? "info" : "warning",
          title: "Production Volume Change",
          description: `S4 ${change > 0 ? "increases" : "decreases"} production volume by ${Math.abs(change).toFixed(
            1,
          )}% compared to BASE.`,
          metric: "Production Orders",
          scenarios: ["BASE", "S4"],
        })
      }
    }

    // Check for capacity utilization
    if (kpis["Capacity Utilization"] && kpis["Capacity Utilization"]["BASE"] && kpis["Capacity Utilization"]["S4"]) {
      const baseCapacity = kpis["Capacity Utilization"]["BASE"]
      const s4Capacity = kpis["Capacity Utilization"]["S4"]
      const change = ((s4Capacity - baseCapacity) / baseCapacity) * 100

      if (change > 10) {
        results.push({
          type: "positive",
          title: "Improved Capacity Utilization",
          description: `S4 improves capacity utilization by ${change.toFixed(1)}%, indicating better resource efficiency.`,
          metric: "Capacity Utilization",
          scenarios: ["BASE", "S4"],
        })
      } else if (s4Capacity > 0.9) {
        results.push({
          type: "warning",
          title: "High Capacity Utilization",
          description: `S4 has a capacity utilization of ${(s4Capacity * 100).toFixed(
            1,
          )}%, which may indicate potential bottlenecks.`,
          metric: "Capacity Utilization",
          scenarios: ["S4"],
        })
      }
    }

    // Add general insights
    results.push({
      type: "info",
      title: "Data Overview",
      description: `Analysis includes ${data.length} data points across ${
        [...new Set(data.map((d) => d.scenario))].length
      } scenarios and ${[...new Set(data.map((d) => d.category))].length} metrics.`,
      metric: "General",
      scenarios: [],
    })

    return results
  }, [data, kpis])

  if (!insights || insights.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Data Insights</CardTitle>
          <CardDescription>No insights available yet</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Data Insights</CardTitle>
        <CardDescription>Automatically generated insights from your data</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {insights.map((insight, index) => (
            <Alert
              key={index}
              variant={insight.type === "negative" ? "destructive" : "default"}
              className={`${
                insight.type === "positive"
                  ? "bg-green-50 border-green-200"
                  : insight.type === "warning"
                    ? "bg-amber-50 border-amber-200"
                    : insight.type === "info"
                      ? "bg-blue-50 border-blue-200"
                      : ""
              }`}
            >
              <div className="flex items-start">
                {insight.type === "positive" ? (
                  <TrendingUp className="h-4 w-4 mr-2 text-green-600" />
                ) : insight.type === "negative" ? (
                  <TrendingDown className="h-4 w-4 mr-2 text-red-600" />
                ) : insight.type === "warning" ? (
                  <AlertCircle className="h-4 w-4 mr-2 text-amber-600" />
                ) : (
                  <Info className="h-4 w-4 mr-2 text-blue-600" />
                )}
                <div>
                  <h4 className="font-medium mb-1">{insight.title}</h4>
                  <AlertDescription>{insight.description}</AlertDescription>
                  <div className="flex mt-2 gap-2">
                    <Badge variant="outline">{insight.metric}</Badge>
                    {insight.scenarios.map((scenario) => (
                      <Badge key={scenario} variant="outline">
                        {scenario}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </Alert>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
