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

export function parseCSVData(
  csvText: string,
  scenarioName: string,
): {
  timeSeriesData: DataPoint[]
  alertsData: AlertData[]
} {
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

    // Find header row (look for "Week" or similar)
    let headerRowIndex = -1
    for (let i = 0; i < Math.min(10, lines.length); i++) {
      if (lines[i].toLowerCase().includes("week") || lines[i].toLowerCase().includes("requirements")) {
        headerRowIndex = i
        break
      }
    }

    // If no header found, assume first row is header
    if (headerRowIndex === -1) {
      headerRowIndex = 0
      console.log("No header row found, assuming first row is header")
    } else {
      console.log(`Found header row at index ${headerRowIndex}: ${lines[headerRowIndex]}`)
    }

    // Parse header to find week columns
    const headerCells = lines[headerRowIndex].split(",").map((cell) => cell.trim())
    const weekIndices: number[] = []

    // Find columns that might contain week data
    for (let i = 1; i < headerCells.length; i++) {
      const cell = headerCells[i]
      if (cell && (cell.toLowerCase().includes("week") || /w\d+/i.test(cell) || /\d+/.test(cell))) {
        weekIndices.push(i)
      }
    }

    if (weekIndices.length === 0) {
      // If no week columns found, assume all columns after the first are data
      for (let i = 1; i < headerCells.length; i++) {
        if (headerCells[i].trim() !== "") {
          weekIndices.push(i)
        }
      }
    }

    console.log(`Found ${weekIndices.length} potential week columns`)

    // Process data rows
    for (let i = headerRowIndex + 1; i < lines.length; i++) {
      const line = lines[i]
      const cells = line.split(",").map((cell) => cell.trim())

      if (cells.length < 2) continue // Skip lines with too few cells

      const category = cells[0]
      if (!category || category === "") continue // Skip lines with empty category

      // Skip header-like rows
      if (category.toLowerCase().includes("week") || category.toLowerCase().includes("requirements")) continue

      // Process each cell that might contain a numeric value
      weekIndices.forEach((colIndex, idx) => {
        if (colIndex < cells.length) {
          const value = Number.parseFloat(cells[colIndex])
          if (!isNaN(value)) {
            // Use column header as week if available, otherwise use index
            const week = headerCells[colIndex] || `Week ${idx + 1}`

            timeSeriesData.push({
              category,
              week,
              value,
              scenario: scenarioName,
            })

            // Check if this is an alert category
            if (
              category.toLowerCase().includes("alert") ||
              category.toLowerCase().includes("critical") ||
              category.toLowerCase().includes("capacity") ||
              category.toLowerCase().includes("supporting")
            ) {
              alertsData.push({
                type: category,
                count: value,
                scenario: scenarioName,
              })
            }
          }
        }
      })
    }

    console.log(`Extracted ${timeSeriesData.length} data points for ${scenarioName}`)
    return { timeSeriesData, alertsData }
  } catch (error) {
    console.error("Error parsing CSV data:", error)
    // Return empty arrays instead of throwing
    return { timeSeriesData: [], alertsData: [] }
  }
}
