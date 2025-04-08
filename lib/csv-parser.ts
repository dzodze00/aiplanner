import type { DataPoint, AlertData } from "./data-utils"

export function parseCSVData(
  csvText: string,
  scenarioName: string,
): { timeSeriesData: DataPoint[]; alertsData: AlertData[] } {
  console.log(`Starting to parse CSV data for ${scenarioName}`)
  const timeSeriesData: DataPoint[] = []
  const alertsData: AlertData[] = []

  try {
    // Split the CSV into lines and clean up
    const lines = csvText.split(/\r?\n/).filter((line) => line.trim() !== "")
    console.log(`CSV has ${lines.length} lines after cleanup`)

    if (lines.length === 0) {
      throw new Error("CSV file is empty")
    }

    // Log the first few lines to help with debugging
    console.log("First 5 lines of CSV:")
    for (let i = 0; i < Math.min(5, lines.length); i++) {
      console.log(`Line ${i}: ${lines[i].substring(0, 100)}${lines[i].length > 100 ? "..." : ""}`)
    }

    // Find the header row with "Week / Week Ending"
    let headerRow = -1
    for (let i = 0; i < Math.min(20, lines.length); i++) {
      if (lines[i].includes("Week / Week Ending")) {
        headerRow = i
        console.log(`Found header row at line ${i}: ${lines[i]}`)
        break
      }
    }

    if (headerRow === -1) {
      console.warn("Could not find header row with 'Week / Week Ending', searching for alternative headers")
      for (let i = 0; i < Math.min(20, lines.length); i++) {
        if (lines[i].includes("Week") || lines[i].includes("Period")) {
          headerRow = i
          console.log(`Found alternative header row at line ${i}: ${lines[i]}`)
          break
        }
      }
    }

    if (headerRow === -1) {
      throw new Error("Could not find a valid header row in the CSV")
    }

    // Parse the header to get column indices
    const headers = lines[headerRow].split(",").map((h) => h.trim())
    console.log(`Headers: ${headers.join(", ")}`)

    // Find the index of the "Week / Week Ending" column
    const weekHeaderIndex = headers.findIndex(
      (h) => h.includes("Week / Week Ending") || h.includes("Week") || h.includes("Period"),
    )

    if (weekHeaderIndex === -1) {
      throw new Error("Could not find Week column in headers")
    }

    // Find the week columns - these should be numeric columns after the week header
    const weekIndices: number[] = []
    const weekLabels: string[] = []

    for (let i = weekHeaderIndex + 1; i < headers.length; i++) {
      const header = headers[i].trim()
      if (header && !isNaN(Number(header))) {
        weekIndices.push(i)
        weekLabels.push(header)
        console.log(`Found week column at index ${i}: ${header}`)
      }
    }

    if (weekIndices.length === 0) {
      throw new Error("Could not find any week columns (numeric headers)")
    }

    // Process data rows
    for (let i = headerRow + 1; i < lines.length; i++) {
      const line = lines[i].trim()
      if (!line) continue

      const cells = line.split(",").map((cell) => cell.trim())

      // Get the category from the first column
      const category = cells[0]
      if (!category) continue

      // Skip header-like rows
      if (category.includes("Week") || category.includes("Period")) continue

      // Check if this is an alert category
      if (category.toLowerCase().includes("alert")) {
        let alertType = "General"

        if (category.toLowerCase().includes("critical")) {
          alertType = "Critical"
        } else if (category.toLowerCase().includes("capacity")) {
          alertType = "Capacity"
        }

        // Sum alerts across all weeks
        let totalAlerts = 0
        for (const weekIdx of weekIndices) {
          if (weekIdx < cells.length && cells[weekIdx] && !isNaN(Number(cells[weekIdx]))) {
            totalAlerts += Number(cells[weekIdx])
          }
        }

        alertsData.push({
          type: alertType,
          count: totalAlerts,
          scenario: scenarioName,
        })
        console.log(`Added alert data for ${alertType}: ${totalAlerts}`)
        continue
      }

      // Process data for each week
      for (let j = 0; j < weekIndices.length; j++) {
        const weekIdx = weekIndices[j]
        const weekLabel = weekLabels[j]

        if (weekIdx < cells.length && cells[weekIdx] && !isNaN(Number(cells[weekIdx]))) {
          const value = Number(cells[weekIdx])
          timeSeriesData.push({
            category,
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
