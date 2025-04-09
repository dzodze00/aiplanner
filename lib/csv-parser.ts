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

    // Find header row (look for "Week" or similar)
    let headerRowIndex = -1
    for (let i = 0; i < Math.min(20, lines.length); i++) {
      if (lines[i].includes("Week / Week Ending") || lines[i].includes("Requirements at Plant P103")) {
        headerRowIndex = i
        console.log(`Found header row at index ${i}: ${lines[i]}`)
        break
      }
    }

    // If no header found, assume first row is header
    if (headerRowIndex === -1) {
      headerRowIndex = 0
      console.log("No header row found, assuming first row is header")
    }

    // Parse header to find week columns
    const headerCells = lines[headerRowIndex].split(",")
    const weekIndices: number[] = []
    const weekNames: string[] = []

    // Find the first column with "Week / Week Ending"
    let weekHeaderIndex = -1
    for (let i = 0; i < headerCells.length; i++) {
      if (headerCells[i].includes("Week / Week Ending")) {
        weekHeaderIndex = i
        break
      }
    }

    if (weekHeaderIndex === -1) {
      console.log("Could not find 'Week / Week Ending' column, using all columns after the first")
      // If we can't find the week header, use all columns after the first
      for (let i = 1; i < headerCells.length; i++) {
        if (headerCells[i].trim() !== "") {
          weekIndices.push(i)
          weekNames.push(headerCells[i] || `Column ${i}`)
        }
      }
    } else {
      // Use all columns starting from the week header
      for (let i = weekHeaderIndex; i < headerCells.length; i++) {
        if (headerCells[i].trim() !== "") {
          weekIndices.push(i)
          weekNames.push(headerCells[i] || `Column ${i}`)
        }
      }
    }

    console.log(`Found ${weekIndices.length} week columns: ${weekNames.join(", ")}`)

    // Process data rows
    for (let i = headerRowIndex + 1; i < lines.length; i++) {
      const row = lines[i].split(",")
      if (row.length <= 1) continue

      const category = row[0].trim()
      if (!category) continue

      // Skip header-like rows
      if (
        category.toLowerCase().includes("week") ||
        category.toLowerCase().includes("requirements") ||
        category === ""
      ) {
        continue
      }

      let rowHasData = false
      weekIndices.forEach((colIndex, idx) => {
        if (colIndex < row.length) {
          const cellValue = row[colIndex].replace(/["'$,]/g, "").trim()

          if (cellValue !== "") {
            const value = Number(cellValue)

            if (!isNaN(value)) {
              rowHasData = true
              const week = weekNames[idx] || `Column ${idx + 1}`

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
        }
      })

      if (!rowHasData) {
        console.log(`No numeric data found in row ${i}: ${lines[i]}`)
      }
    }

    console.log(`Extracted ${timeSeriesData.length} data points for ${scenarioName}`)

    if (timeSeriesData.length === 0) {
      console.error(`No data points were extracted for ${scenarioName}. Check CSV format.`)
    }

    return { timeSeriesData, alertsData }
  } catch (error) {
    console.error(`Error parsing CSV data for ${scenarioName}:`, error)
    return { timeSeriesData, alertsData }
  }
}
