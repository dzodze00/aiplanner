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

export interface KPI {
  name: string
  description: string
  category: string
  format: string
  positiveChange: "up" | "down" | "balanced"
  calculation: "average" | "sum" | "last" | "min" | "max"
}

export const scenarios = [
  { name: "BASE", description: "Base Plan", color: "#64748b" },
  { name: "S1", description: "Expedite POs & Move SOs", color: "#3b82f6" },
  { name: "S2", description: "Increase Capacities", color: "#8b5cf6" },
  { name: "S3", description: "Increase Material Purchases", color: "#f59e0b" },
  { name: "S4", description: "Fine-tuned Solution", color: "#10b981" },
]

export const kpiDefinitions: KPI[] = [
  {
    name: "Fill Rate",
    description: "Average percentage of demand fulfilled",
    category: "Fill Rate",
    format: "percent",
    positiveChange: "up",
    calculation: "average",
  },
  {
    name: "Inventory Level",
    description: "Average planned inventory",
    category: "Planned FG Inventory",
    format: "number",
    positiveChange: "balanced",
    calculation: "average",
  },
  {
    name: "Production Orders",
    description: "Total planned production",
    category: "Planned FG Production Orders",
    format: "number",
    positiveChange: "balanced",
    calculation: "sum",
  },
  {
    name: "Supply vs Demand",
    description: "Available supply compared to demand",
    category: "Available Supply",
    format: "number",
    positiveChange: "up",
    calculation: "average",
  },
  {
    name: "Capacity Utilization",
    description: "Percentage of total capacity utilized",
    category: "Total Capacity",
    format: "percent",
    positiveChange: "balanced",
    calculation: "average",
  },
]

export const categoryGroups = [
  {
    name: "Demand",
    categories: ["Forecast", "Firmed Sales Orders", "Total Demand", "Unconsumed Forecast (Forecast  Sales Orders)"],
  },
  {
    name: "Supply",
    categories: ["Available Supply", "Constrained Supply", "New Production after material constraints"],
  },
  {
    name: "Inventory",
    categories: [
      "Planned FG Inventory",
      "Actual FG Inventory",
      "Targeted FG Inventory",
      "Planned FG Inventory after material constraints",
    ],
  },
  {
    name: "Production",
    categories: [
      "Planned FG Production Orders",
      "Actual FG Production Orders",
      "Planned Intermediate Production Orders",
    ],
  },
  {
    name: "Capacity",
    categories: [
      "Total Capacity",
      "Allocated Capacity (by Production Type - Cell Assembly)",
      "Allocated Capacity (by Production Type - Active Material Production)",
    ],
  },
  {
    name: "Materials",
    categories: [
      "Actual Material Inventory",
      "Planned Material Inventory",
      "Actual Material Purchase Orders",
      "Planned Material Purchase Orders",
    ],
  },
]

export function transformForChart(data: DataPoint[], category: string): any[] {
  // Filter out data that doesn't match the category
  const filteredData = data.filter((d) => d.category === category)

  if (filteredData.length === 0) return []

  // Group by week
  const groupedByWeek = filteredData.reduce(
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
      // Try to sort by week number if possible
      const weekNumA = extractNumberFromString(a.week)
      const weekNumB = extractNumberFromString(b.week)

      if (weekNumA !== null && weekNumB !== null) {
        return weekNumA - weekNumB
      }

      // Fallback to string comparison
      return a.week.localeCompare(b.week)
    })
}

// Helper function to extract a number from a string
function extractNumberFromString(str: string): number | null {
  const match = str.match(/\d+/)
  if (match) {
    return Number.parseInt(match[0], 10)
  }
  return null
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

  // Initialize KPIs from definitions
  kpiDefinitions.forEach((kpi) => {
    kpis[kpi.name] = {}
  })

  // Group data by category and scenario
  const groupedData = data.reduce(
    (acc, curr) => {
      if (!acc[curr.category]) {
        acc[curr.category] = {}
      }

      if (!acc[curr.category][curr.scenario]) {
        acc[curr.category][curr.scenario] = []
      }

      acc[curr.category][curr.scenario].push(curr)

      return acc
    },
    {} as { [category: string]: { [scenario: string]: DataPoint[] } },
  )

  // Calculate KPIs based on definitions
  kpiDefinitions.forEach((kpi) => {
    const categoryData = groupedData[kpi.category]
    if (!categoryData) return

    Object.entries(categoryData).forEach(([scenario, points]) => {
      if (points.length === 0) return

      const values = points.map((p) => p.value)

      let result = 0
      switch (kpi.calculation) {
        case "average":
          result = values.reduce((sum, val) => sum + val, 0) / values.length
          break
        case "sum":
          result = values.reduce((sum, val) => sum + val, 0)
          break
        case "last":
          // Sort by week and take the last value
          points.sort((a, b) => {
            const weekA = extractNumberFromString(a.week) || 0
            const weekB = extractNumberFromString(b.week) || 0
            return weekA - weekB
          })
          result = points[points.length - 1].value
          break
        case "min":
          result = Math.min(...values)
          break
        case "max":
          result = Math.max(...values)
          break
      }

      kpis[kpi.name][scenario] = result
    })
  })

  // Add special KPIs that require calculations across categories
  const scenarioNames = [...new Set(data.map((d) => d.scenario))]

  // Calculate supply vs demand ratio
  scenarioNames.forEach((scenario) => {
    const supplyData = groupedData["Available Supply"]?.[scenario] || []
    const demandData = groupedData["Total Demand"]?.[scenario] || []

    if (supplyData.length > 0 && demandData.length > 0) {
      const avgSupply = supplyData.reduce((sum, p) => sum + p.value, 0) / supplyData.length
      const avgDemand = demandData.reduce((sum, p) => sum + p.value, 0) / demandData.length

      if (avgDemand > 0) {
        kpis["Supply vs Demand"] = kpis["Supply vs Demand"] || {}
        kpis["Supply vs Demand"][scenario] = avgSupply / avgDemand
      }
    }
  })

  return kpis
}

export function formatValue(value: number, format: string): string {
  switch (format) {
    case "percent":
      return `${(value * 100).toFixed(1)}%`
    case "number":
      return value.toLocaleString(undefined, { maximumFractionDigits: 0 })
    case "decimal":
      return value.toLocaleString(undefined, { maximumFractionDigits: 2 })
    default:
      return value.toString()
  }
}

export function getPercentChange(baseValue: number, newValue: number): number {
  if (baseValue === 0) return 0
  return ((newValue - baseValue) / Math.abs(baseValue)) * 100
}
