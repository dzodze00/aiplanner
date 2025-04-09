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
  { name: "BASE", description: "Base Plan", color: "#8884d8" },
  { name: "S1", description: "S1 - Expedite POs & Move Sales Orders", color: "#82ca9d" },
  { name: "S2", description: "S2 - Increase Capacities", color: "#ffc658" },
  { name: "S3", description: "S3 - Increase Material Purchases", color: "#ff8042" },
  { name: "S4", description: "S4 - Fine-tuned Solution", color: "#0088fe" },
]

export const categoryGroups = [
  {
    name: "Demand",
    categories: ["Total Demand", "Firm Demand", "Forecasted Demand"],
  },
  {
    name: "Supply",
    categories: ["Available Supply", "Planned FG Production Orders", "Planned Purchases"],
  },
  {
    name: "Inventory",
    categories: ["Planned FG Inventory", "WIP Inventory", "Raw Materials"],
  },
  {
    name: "Performance",
    categories: ["Fill Rate", "On-Time Delivery", "Perfect Order Rate"],
  },
  {
    name: "Capacity",
    categories: ["Total Capacity", "Allocated Capacity", "Available Capacity"],
  },
]

export function transformForChart(data: DataPoint[], category: string): any[] {
  try {
    // Filter out data that doesn't match the category
    const filteredData = data.filter((d) => d.category === category)

    if (filteredData.length === 0) return []

    // Group by week
    const groupedByWeek: { [week: string]: { [scenario: string]: number } } = {}

    filteredData.forEach((d) => {
      if (!groupedByWeek[d.week]) {
        groupedByWeek[d.week] = {}
      }
      groupedByWeek[d.week][d.scenario] = d.value
    })

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
  } catch (error) {
    console.error("Error transforming data for chart:", error)
    return []
  }
}

// Helper function to extract a number from a string
function extractNumberFromString(str: string): number | null {
  const match = str.match(/\d+/)
  if (match) {
    return Number.parseInt(match[0], 10)
  }
  return null
}

export function calculateKPIs(data: DataPoint[]): { [key: string]: { [scenario: string]: number } } {
  try {
    if (!data || data.length === 0) {
      return {}
    }

    const kpis: { [key: string]: { [scenario: string]: number } } = {}
    const scenarioNames = [...new Set(data.map((d) => d.scenario))]
    const categories = [...new Set(data.map((d) => d.category))]

    // Initialize KPIs for each category
    categories.forEach((category) => {
      kpis[category] = {}
    })

    // Calculate KPIs for each scenario and category
    scenarioNames.forEach((scenario) => {
      categories.forEach((category) => {
        const categoryData = data.filter((d) => d.scenario === scenario && d.category === category)

        if (categoryData.length > 0) {
          // Calculate average for this category and scenario
          const sum = categoryData.reduce((acc, d) => acc + d.value, 0)
          const avg = sum / categoryData.length
          kpis[category][scenario] = avg
        }
      })
    })

    return kpis
  } catch (error) {
    console.error("Error calculating KPIs:", error)
    return {}
  }
}

export const formatValue = (value: number, formatType: "decimal" | "percent" = "decimal"): string => {
  if (typeof value !== "number") return "N/A"

  if (formatType === "percent") {
    return `${(value * 100).toFixed(1)}%`
  }

  if (Math.abs(value) < 0.01) return value.toExponential(2)
  if (Math.abs(value) < 1) return value.toFixed(2)
  if (Math.abs(value) < 10) return value.toFixed(1)
  if (Math.abs(value) < 1000) return value.toFixed(0)
  return value.toLocaleString()
}

export const getPercentChange = (baseValue: number, newValue: number): number => {
  if (baseValue === 0) return 0
  return ((newValue - baseValue) / Math.abs(baseValue)) * 100
}
