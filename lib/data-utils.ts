export interface DataPoint {
  category: string
  week: string
  value: number
  scenario: string
}

export interface AlertData {
  type: string
  count: number
  scenario: string
}

export const scenarios = [
  { name: "BASE", description: "Base Plan", color: "#64748b" },
  { name: "S1", description: "Expedite POs & Move SOs", color: "#3b82f6" },
  { name: "S2", description: "Increase Capacities", color: "#8b5cf6" },
  { name: "S3", description: "Increase Material Purchases", color: "#f59e0b" },
  { name: "S4", description: "Fine-tuned Solution", color: "#10b981" },
]

export function transformForChart(data: DataPoint[], category: string): any[] {
  // Group by week
  const groupedByWeek = data.reduce(
    (acc, curr) => {
      if (!acc[curr.week]) {
        acc[curr.week] = {}
      }
      acc[curr.week][curr.scenario] = curr.value
      return acc
    },
    {} as { [week: string]: { [scenario: string]: number } },
  )

  // Convert to array format for recharts
  return Object.entries(groupedByWeek)
    .map(([week, values]) => {
      return {
        week,
        ...values,
      }
    })
    .sort((a, b) => {
      // Sort by week number
      const weekA = Number.parseInt(a.week.replace(/\D/g, ""))
      const weekB = Number.parseInt(b.week.replace(/\D/g, ""))
      return weekA - weekB
    })
}

export function transformAlertsForChart(data: AlertData[]): any[] {
  // Group by alert type and scenario
  const groupedByType = data.reduce(
    (acc, curr) => {
      if (!acc[curr.type]) {
        acc[curr.type] = {}
      }
      acc[curr.type][curr.scenario] = curr.count
      return acc
    },
    {} as { [type: string]: { [scenario: string]: number } },
  )

  // Convert to array format for recharts
  return Object.entries(groupedByType).map(([name, values]) => {
    return {
      name,
      ...values,
    }
  })
}

export function calculateKPIs(data: DataPoint[]): { [key: string]: { [scenario: string]: number } } {
  const kpis: { [key: string]: { [scenario: string]: number } } = {}

  // Group data by category and scenario
  const groupedData = data.reduce(
    (acc, curr) => {
      if (!acc[curr.category]) {
        acc[curr.category] = {}
      }

      if (!acc[curr.category][curr.scenario]) {
        acc[curr.category][curr.scenario] = []
      }

      acc[curr.category][curr.scenario].push(curr.value)

      return acc
    },
    {} as { [category: string]: { [scenario: string]: number[] } },
  )

  // Calculate KPIs
  for (const [category, scenarioData] of Object.entries(groupedData)) {
    kpis[category] = {}

    for (const [scenario, values] of Object.entries(scenarioData)) {
      // Different calculation methods based on category
      if (category === "Fill Rate") {
        // Average fill rate
        kpis[category][scenario] = values.reduce((sum, val) => sum + val, 0) / values.length
      } else if (category.includes("Alert")) {
        // Sum of alerts
        kpis[category][scenario] = values.reduce((sum, val) => sum + val, 0)
      } else if (category === "Planned Inventory") {
        // Average inventory
        kpis[category][scenario] = values.reduce((sum, val) => sum + val, 0) / values.length
      } else if (category === "Production Order Quantity") {
        // Sum of production orders
        kpis[category][scenario] = values.reduce((sum, val) => sum + val, 0)
        // Store as "Production Orders" for display
        if (!kpis["Production Orders"]) {
          kpis["Production Orders"] = {}
        }
        kpis["Production Orders"][scenario] = kpis[category][scenario]
      } else {
        // Default: average
        kpis[category][scenario] = values.reduce((sum, val) => sum + val, 0) / values.length
      }
    }
  }

  // Add alert categories if they don't exist
  if (!kpis["Critical Alerts"]) {
    kpis["Critical Alerts"] = {}
  }

  if (!kpis["Capacity Alerts"]) {
    kpis["Capacity Alerts"] = {}
  }

  return kpis
}
