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

    // Try to find the header row - look for keywords in the first 20 lines
    let headerRow = -1
    for (let i = 0; i < Math.min(20, lines.length); i++) {
      const line = lines[i].toLowerCase()
      if (line.includes("week") || line.includes("requirements") || line.includes("plant")) {
        headerRow = i
        console.log(`Found header row at line ${i}: ${lines[i]}`)
        break
      }
    }

    if (headerRow === -1) {
      console.warn("Could not find a standard header row, using first line as header")
      headerRow = 0
    }

    // Parse the header to get column indices
    const headers = lines[headerRow].split(",").map((h) => h.trim())
    console.log(`Headers: ${headers.join(", ")}`)

    const weekIndices: number[] = []
    const weekLabels: string[] = []

    // Look for week columns - either numeric or containing "week"
    for (let i = 0; i < headers.length; i++) {
      const header = headers[i].trim()
      if (header.match(/^\d+$/) || header.toLowerCase().includes("week")) {
        weekIndices.push(i)
        weekLabels.push(header)
        console.log(`Found week column at index ${i}: ${header}`)
      }
    }

    if (weekIndices.length === 0) {
      console.warn("No standard week columns found, using all numeric columns")
      // Fallback: use any column with numeric data in the first data row
      const firstDataRow = lines[headerRow + 1].split(",")
      for (let i = 0; i < firstDataRow.length; i++) {
        if (!isNaN(Number(firstDataRow[i].trim()))) {
          weekIndices.push(i)
          weekLabels.push(headers[i] || `Column ${i}`)
          console.log(`Using numeric column at index ${i}: ${headers[i] || `Column ${i}`}`)
        }
      }
    }

    if (weekIndices.length === 0) {
      throw new Error("Could not identify any data columns in the CSV")
    }

    // Process data rows
    let currentCategory = ""

    for (let i = headerRow + 1; i < lines.length; i++) {
      const line = lines[i].trim()
      if (!line) continue

      const cells = line.split(",").map((cell) => cell.trim())

      // Check if this is a category row (first cell is non-numeric and not empty)
      if (cells[0] && !cells[0].match(/^\d+$/)) {
        currentCategory = cells[0]
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
      if (!currentCategory) {
        currentCategory = "Unknown" // Fallback category
      }

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

    // If we didn't get any data, try a more aggressive approach
    if (timeSeriesData.length === 0) {
      console.warn("No data points found with standard parsing, trying fallback method")

      // Fallback method: assume every row with numbers is data
      for (let i = headerRow + 1; i < lines.length; i++) {
        const cells = lines[i].split(",").map((cell) => cell.trim())

        // Skip empty rows
        if (cells.every((cell) => cell === "")) continue

        // Use first cell as category if it's not numeric
        const rowCategory = !isNaN(Number(cells[0])) ? "Row " + i : cells[0]

        // Look for numeric values in the row
        for (let j = 1; j < cells.length; j++) {
          if (!isNaN(Number(cells[j])) && cells[j] !== "") {
            timeSeriesData.push({
              category: rowCategory,
              week: headers[j] || `Column ${j}`,
              value: Number(cells[j]),
              scenario: scenarioName,
            })
          }
        }
      }

      console.log(`Fallback parsing found ${timeSeriesData.length} data points`)
    }

    return { timeSeriesData, alertsData }
  } catch (error) {
    console.error("Error parsing CSV data:", error)
    throw new Error(`Failed to parse CSV: ${error instanceof Error ? error.message : String(error)}`)
  }
}
