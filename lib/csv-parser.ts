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
      console.log(`Line ${i}: ${lines[i]}`)
    }

    // Find the header row with "Requirements at Plant P103" and "Week / Week Ending"
    let headerRowIndex = -1
    for (let i = 0; i < Math.min(20, lines.length); i++) {
      if (
        lines[i].includes("Requirements at Plant P103") &&
        (lines[i].includes("Week / Week Ending") || lines[i].includes("Week"))
      ) {
        headerRowIndex = i
        console.log(`Found header row at index ${i}: ${lines[i]}`)
        break
      }
    }

    if (headerRowIndex === -1) {
      console.error("Could not find header row with 'Requirements at Plant P103' and 'Week / Week Ending'")
      // Try a more lenient approach - look for any row with "Week"
      for (let i = 0; i < Math.min(20, lines.length); i++) {
        if (lines[i].includes("Week")) {
          headerRowIndex = i
          console.log(`Found potential header row with 'Week' at index ${i}: ${lines[i]}`)
          break
        }
      }

      if (headerRowIndex === -1) {
        // Still no header found, use the first row
        headerRowIndex = 0
        console.log("No header row found, using first row as header")
      }
    }

    // Parse the header row to identify week columns
    const headerRow = lines[headerRowIndex]
    const headerCells = headerRow.split(",").map((cell) => cell.trim())

    console.log("Header cells:", headerCells)

    // Find the index where week columns start
    let weekStartIndex = -1
    for (let i = 0; i < headerCells.length; i++) {
      // Look for numeric values or dates that might indicate week columns
      if (
        /\d+/.test(headerCells[i]) || // Contains numbers
        headerCells[i].includes("/") || // Contains date separator
        headerCells[i].match(/w\d+/i) // Contains "W" followed by numbers
      ) {
        weekStartIndex = i
        console.log(`Found first week column at index ${i}: ${headerCells[i]}`)
        break
      }
    }

    // If we couldn't find week columns by pattern, try to find them by position
    if (weekStartIndex === -1) {
      // Typically, the first few columns are descriptive, and week columns start after
      // Look for the first non-empty cell after the first few columns
      for (let i = 2; i < headerCells.length; i++) {
        if (headerCells[i] && headerCells[i] !== "") {
          weekStartIndex = i
          console.log(`Using position-based approach, found first data column at index ${i}: ${headerCells[i]}`)
          break
        }
      }
    }

    // If we still couldn't find week columns, use a default
    if (weekStartIndex === -1) {
      weekStartIndex = 2 // Assume first two columns are descriptive
      console.log("Could not determine week columns, using default start index of 2")
    }

    // Collect all week column indices and names
    const weekIndices: number[] = []
    const weekNames: string[] = []

    for (let i = weekStartIndex; i < headerCells.length; i++) {
      if (headerCells[i] && headerCells[i] !== "") {
        weekIndices.push(i)
        weekNames.push(headerCells[i])
      }
    }

    console.log(`Found ${weekIndices.length} week columns: ${weekNames.join(", ")}`)

    if (weekIndices.length === 0) {
      throw new Error("No week columns found in header row")
    }

    // Process data rows
    for (let i = headerRowIndex + 1; i < lines.length; i++) {
      const row = lines[i].split(",").map((cell) => cell.trim())

      // Skip rows with insufficient data
      if (row.length <= weekStartIndex) {
        console.log(`Skipping row ${i} with insufficient data: ${lines[i]}`)
        continue
      }

      // Get the category from the first column
      const category = row[0].trim()

      // Skip empty categories or header-like rows
      if (
        !category ||
        category === "" ||
        category.toLowerCase().includes("week") ||
        category.toLowerCase().includes("requirements")
      ) {
        continue
      }

      // Process each week column
      let rowHasData = false
      for (let j = 0; j < weekIndices.length; j++) {
        const colIndex = weekIndices[j]

        if (colIndex < row.length) {
          // Clean and parse the cell value
          const cellValue = row[colIndex].replace(/["'$,]/g, "").trim()

          // Handle empty cells
          if (cellValue === "") {
            continue
          }

          // Try to parse as number
          const value = Number(cellValue)

          if (!isNaN(value)) {
            rowHasData = true
            const week = weekNames[j]

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
          } else {
            console.log(`Non-numeric value in row ${i}, column ${colIndex}: ${cellValue}`)
          }
        }
      }

      if (!rowHasData) {
        console.log(`No numeric data found in row ${i}: ${lines[i]}`)
      }
    }

    console.log(`Extracted ${timeSeriesData.length} data points for ${scenarioName}`)

    if (timeSeriesData.length === 0) {
      // Try a last-resort approach - look for any numeric values in the file
      console.log("No data points extracted, trying last-resort approach")

      for (let i = 0; i < lines.length; i++) {
        const row = lines[i].split(",")
        const category = row[0]?.trim() || `Row ${i}`

        for (let j = 1; j < row.length; j++) {
          const cellValue = row[j].replace(/["'$,]/g, "").trim()
          if (cellValue !== "" && !isNaN(Number(cellValue))) {
            const value = Number(cellValue)
            const week = `Column ${j}`

            timeSeriesData.push({
              category,
              week,
              value,
              scenario: scenarioName,
            })
          }
        }
      }

      console.log(`Last-resort approach extracted ${timeSeriesData.length} data points`)

      if (timeSeriesData.length === 0) {
        console.error(`No data points were extracted for ${scenarioName}. Check CSV format.`)
      }
    }

    return { timeSeriesData, alertsData }
  } catch (error) {
    console.error(`Error parsing CSV data for ${scenarioName}:`, error)
    return { timeSeriesData, alertsData }
  }
}
