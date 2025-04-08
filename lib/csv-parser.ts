import type { DataPoint, AlertData } from "./data-utils"

export function parseCSVData(
  csvText: string,
  scenarioName: string,
): { timeSeriesData: DataPoint[]; alertsData: AlertData[] } {
  console.log(`Starting to parse CSV data for ${scenarioName}`)
  const timeSeriesData: DataPoint[] = []
  const alertsData: AlertData[] = []

  try {
    // Split the CSV into lines
    const lines = csvText.split("\n")
    console.log(`CSV has ${lines.length} lines`)

    // Find the header row
    let headerRow = -1
    for (let i = 0; i < Math.min(lines.length, 20); i++) {
      if (lines[i].includes("Requirements at Plant P103") || lines[i].includes("Week / Week Ending")) {
        headerRow = i
        console.log(`Found header row at line ${i}`)
        break
      }
    }

    if (headerRow === -1) {
      console.error("Could not find header row in CSV")
      return { timeSeriesData, alertsData }
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

    console.log(`Found ${weekIndices.length} week columns`)

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
          const alertCount = Number.parseInt(cells[weekIndices[0]] || "0")
          if (!isNaN(alertCount)) {
            alertsData.push({
              type: alertType,
              count: alertCount,
              scenario: scenarioName,
            })
            console.log(`Added alert data for ${alertType}: ${alertCount}`)
          }
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
          const value = Number.parseFloat(cells[weekIdx])
          timeSeriesData.push({
            category: currentCategory,
            week: weekLabel,
            value,
            scenario: scenarioName,
          })
        }
      }
    }

    console.log(`Parsed ${timeSeriesData.length} data points and ${alertsData.length} alerts`)
    return { timeSeriesData, alertsData }
  } catch (error) {
    console.error("Error parsing CSV data:", error)
    return { timeSeriesData, alertsData }
  }
}

function isNumeric(str: string): boolean {
  return !isNaN(Number.parseFloat(str)) && isFinite(Number.parseFloat(str))
}
