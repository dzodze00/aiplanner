import type { DataPoint, AlertData } from "./data-utils"

export function parseCSVData(
  csvText: string,
  scenarioName: string,
): { timeSeriesData: DataPoint[]; alertsData: AlertData[] } {
  const timeSeriesData: DataPoint[] = []
  const alertsData: AlertData[] = []

  // Split the CSV into lines
  const lines = csvText.split("\n")

  // Find the header row
  let headerRow = -1
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes("Requirements at Plant P103") && lines[i].includes("Week / Week Ending")) {
      headerRow = i
      break
    }
  }

  if (headerRow === -1) {
    throw new Error("Could not find header row in CSV")
  }

  // Parse the header to get column indices
  const headers = lines[headerRow].split(",")
  const weekIndices: number[] = []
  const weekLabels: string[] = []

  for (let i = 0; i < headers.length; i++) {
    if (headers[i].trim().match(/^\d+$/)) {
      weekIndices.push(i)
      weekLabels.push(headers[i].trim())
    }
  }

  // Process data rows
  let currentCategory = ""
  let alertType = ""

  for (let i = headerRow + 1; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line) continue

    const cells = line.split(",")

    // Check if this is a category row
    if (cells[0] && cells[0].trim() && !cells[0].trim().startsWith("Week") && !isNumeric(cells[0])) {
      currentCategory = cells[0].trim()

      // Check if this is an alert category
      if (currentCategory.includes("Alert")) {
        if (currentCategory.includes("Critical")) {
          alertType = "Critical"
        } else if (currentCategory.includes("Capacity")) {
          alertType = "Capacity"
        } else {
          alertType = "Supporting"
        }

        // Add alert data
        alertsData.push({
          type: alertType,
          count: Number.parseInt(cells[weekIndices[0]] || "0"),
          scenario: scenarioName,
        })
      }

      continue
    }

    // Skip rows that don't have data
    if (!currentCategory || currentCategory.includes("Alert")) continue

    // Process data for each week
    for (let j = 0; j < weekIndices.length; j++) {
      const weekIdx = weekIndices[j]
      const weekLabel = weekLabels[j]

      if (cells[weekIdx] && cells[weekIdx].trim() && isNumeric(cells[weekIdx])) {
        timeSeriesData.push({
          category: currentCategory,
          week: weekLabel,
          value: Number.parseFloat(cells[weekIdx]),
          scenario: scenarioName,
        })
      }
    }
  }

  return { timeSeriesData, alertsData }
}

function isNumeric(str: string): boolean {
  return !isNaN(Number.parseFloat(str)) && isFinite(Number.parseFloat(str))
}
