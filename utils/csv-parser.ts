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
      if (lines[i].includes("Week") || lines[i].includes("Requirements")) {
        headerRow = i
        console.log(`Found header row at line ${i}: ${lines[i]}`)
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
      const header = headers[i].trim()
      if (header.match(/^\d+$/) || header.includes("Week")) {
        weekIndices.push(i)
        weekLabels.push(header)
        console.log(`Found week column at index ${i}: ${header}`)
      }
    }

    if (weekIndices.length === 0) {
      console.error("No week columns found in CSV")
      return { timeSeriesData, alertsData }
    }

    // Process data rows
    let currentCategory = ""

    for (let i = headerRow + 1; i < lines.length; i++) {
      const line = lines[i].trim()
      if (!line) continue

      const cells = line.split(",")

      // Check if this is a category row
      if (cells[0] && cells[0].trim() && !cells[0].trim().match(/^\d+$/)) {
        currentCategory = cells[0].trim()
        console.log(`Found category: ${currentCategory}`)

        // Check if this is an alert category
        if (currentCategory.toLowerCase().includes("alert")) {
          let alertType = "General"

          if (currentCategory.toLowerCase().includes("critical")) {
            alertType = "Critical"
          } else if (currentCategory.toLowerCase().includes("capacity")) {
            alertType = "Capacity"
          }

          // Add alert data - use the first numeric value found
          for (let j = 1; j < cells.length; j++) {
            if (cells[j] && !isNaN(Number(cells[j]))) {
              const alertCount = Number(cells[j])
              alertsData.push({
                type: alertType,
                count: alertCount,
                scenario: scenarioName,
              })
              console.log(`Added alert data for ${alertType}: ${alertCount}`)
              break
            }
          }
        }
        continue
      }

      // Skip rows that don't have a category
      if (!currentCategory) continue

      // Process data for each week
      for (let j = 0; j < weekIndices.length; j++) {
        const weekIdx = weekIndices[j]
        const weekLabel = weekLabels[j]

        if (weekIdx < cells.length && cells[weekIdx] && !isNaN(Number(cells[weekIdx]))) {
          const value = Number(cells[weekIdx])
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
    throw new Error(`Failed to parse CSV: ${error instanceof Error ? error.message : String(error)}`)
  }
}
