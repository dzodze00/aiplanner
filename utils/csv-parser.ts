export interface DataPoint {
  category: string
  week: string
  value: number
  scenario: string
}

export interface AlertData {
  category: string
  count: number
  scenario: string
}

export interface ScenarioData {
  name: string
  description: string
  color: string
}

export const scenarios: ScenarioData[] = [
  { name: "BASE", description: "Base Plan", color: "#8884d8" },
  { name: "S1", description: "S1 - Expedite POs & Move Sales Orders", color: "#82ca9d" },
  { name: "S2", description: "S2 - Increase Capacities", color: "#ffc658" },
  { name: "S3", description: "S3 - Increase Material Purchases", color: "#ff8042" },
  { name: "S4", description: "S4 - Fine-tuned Solution", color: "#0088fe" },
]

export function parseCSV(csvText: string): string[][] {
  const lines = csvText.split("\n")
  return lines.map((line) => {
    // Handle quoted values correctly
    const result = []
    let inQuotes = false
    let currentValue = ""

    for (let i = 0; i < line.length; i++) {
      const char = line[i]

      if (char === '"') {
        inQuotes = !inQuotes
      } else if (char === "," && !inQuotes) {
        result.push(currentValue)
        currentValue = ""
      } else {
        currentValue += char
      }
    }

    result.push(currentValue)
    return result
  })
}

export function processCSVData(
  csvData: string[][],
  scenarioName: string,
): {
  timeSeriesData: DataPoint[]
  alertsData: AlertData[]
} {
  const timeSeriesData: DataPoint[] = []
  const alertsData: AlertData[] = []

  // Find header row and column indices
  const headerRowIndex = csvData.findIndex((row) => row.some((cell) => cell.includes("Week / Week Ending")))

  if (headerRowIndex === -1) {
    return { timeSeriesData, alertsData }
  }

  const headerRow = csvData[headerRowIndex]
  const weekIndices = headerRow.map((cell, index) => (cell.trim() !== "" ? index : -1)).filter((index) => index > 0)

  // Process data rows
  for (let i = headerRowIndex + 1; i < csvData.length; i++) {
    const row = csvData[i]
    if (!row || row.length === 0 || !row[0]) continue

    const category = row[0].trim()
    if (!category) continue

    // Skip empty or header-like rows
    if (category === "" || category.includes("Week") || category.includes("Requirements")) continue

    // Process time series data
    weekIndices.forEach((weekIndex) => {
      if (weekIndex < row.length) {
        const week = headerRow[weekIndex].trim()
        const value = Number.parseFloat(row[weekIndex])

        if (!isNaN(value)) {
          timeSeriesData.push({
            category,
            week,
            value,
            scenario: scenarioName,
          })
        }
      }
    })

    // Process alerts data if this is an alert category
    if (
      category.includes("Alert") ||
      category.includes("Critical") ||
      category.includes("Capacity") ||
      category.includes("Supporting")
    ) {
      const totalAlerts = weekIndices
        .map((idx) => Number.parseFloat(row[idx]))
        .filter((val) => !isNaN(val))
        .reduce((sum, val) => sum + val, 0)

      alertsData.push({
        category,
        count: totalAlerts,
        scenario: scenarioName,
      })
    }
  }

  return { timeSeriesData, alertsData }
}

export function aggregateData(data: DataPoint[], category: string): DataPoint[] {
  const aggregated: { [key: string]: { [scenario: string]: number } } = {}

  data
    .filter((d) => d.category === category)
    .forEach((d) => {
      if (!aggregated[d.week]) {
        aggregated[d.week] = {}
      }
      aggregated[d.week][d.scenario] = d.value
    })

  const result: DataPoint[] = []

  Object.entries(aggregated).forEach(([week, values]) => {
    Object.entries(values).forEach(([scenario, value]) => {
      result.push({
        category,
        week,
        value,
        scenario,
      })
    })
  })

  return result
}

export function transformForChart(data: DataPoint[], category: string): any[] {
  const weeks = [...new Set(data.filter((d) => d.category === category).map((d) => d.week))].sort()
  const scenarioNames = [...new Set(data.map((d) => d.scenario))]

  return weeks.map((week) => {
    const result: any = { week }

    scenarioNames.forEach((scenario) => {
      const point = data.find((d) => d.category === category && d.week === week && d.scenario === scenario)
      result[scenario] = point ? point.value : 0
    })

    return result
  })
}

export function transformAlertsForChart(data: AlertData[]): any[] {
  const categories = [...new Set(data.map((d) => d.category))]

  return categories.map((category) => {
    const result: any = { name: category }

    scenarios.forEach((scenario) => {
      const alert = data.find((d) => d.category === category && d.scenario === scenario.name)
      result[scenario.name] = alert ? alert.count : 0
    })

    return result
  })
}

export function calculateKPIs(data: DataPoint[]): { [key: string]: { [scenario: string]: number } } {
  const kpis: { [key: string]: { [scenario: string]: number } } = {
    "Fill Rate (%)": {},
    "Avg. Planned Inventory": {},
    "Total Production Orders": {},
    "Total Alerts": {},
  }

  const scenarioNames = [...new Set(data.map((d) => d.scenario))]

  scenarioNames.forEach((scenario) => {
    const scenarioData = data.filter((d) => d.scenario === scenario)

    // Fill Rate
    const fillRateData = scenarioData.filter((d) => d.category === "Fill Rate")
    kpis["Fill Rate (%)"][scenario] =
      fillRateData.length > 0 ? fillRateData.reduce((sum, d) => sum + d.value, 0) / fillRateData.length : 0

    // Planned Inventory
    const inventoryData = scenarioData.filter((d) => d.category === "Planned Inventory")
    kpis["Avg. Planned Inventory"][scenario] =
      inventoryData.length > 0 ? inventoryData.reduce((sum, d) => sum + d.value, 0) / inventoryData.length : 0

    // Production Orders
    const productionData = scenarioData.filter((d) => d.category === "Production Order Quantity")
    kpis["Total Production Orders"][scenario] = productionData.reduce((sum, d) => sum + d.value, 0)

    // Alerts (assuming we have alert data in the time series)
    const alertsData = scenarioData.filter((d) => d.category === "Number of Alerts")
    kpis["Total Alerts"][scenario] = alertsData.reduce((sum, d) => sum + d.value, 0)
  })

  return kpis
}
