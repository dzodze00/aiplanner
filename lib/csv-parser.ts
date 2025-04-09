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

    // APPROACH 1: Try to find a header row with week columns
    let headerRowIndex = -1
    let weekStartIndex = -1
    let headerCells: string[] = []
    let weekIndices: number[] = []
    let weekNames: string[] = []

    // First, try to find a header row with "Requirements" and "Week"
    for (let i = 0; i < Math.min(20, lines.length); i++) {
      if (
        (lines[i].includes("Requirements") || lines[i].includes("Demand") || lines[i].includes("Supply")) &&
        (lines[i].includes("Week") || /\d+/.test(lines[i]))
      ) {
        headerRowIndex = i
        console.log(`Found potential header row at index ${i}: ${lines[i]}`)

        // Parse the header row
        headerCells = lines[i].split(",").map((cell) => cell.trim())

        // Find week columns - look for cells that contain numbers or week indicators
        for (let j = 0; j < headerCells.length; j++) {
          if (
            /\d+/.test(headerCells[j]) || // Contains numbers
            headerCells[j].includes("Week") || // Contains "Week"
            headerCells[j].includes("/") // Contains date separator
          ) {
            if (weekStartIndex === -1) weekStartIndex = j
            weekIndices.push(j)
            weekNames.push(headerCells[j] || `Week ${j - weekStartIndex + 1}`)
          }
        }

        if (weekIndices.length > 0) {
          console.log(`Found ${weekIndices.length} week columns starting at index ${weekStartIndex}`)
          break
        }
      }
    }

    // If we couldn't find a header row with the expected format, try a different approach
    if (headerRowIndex === -1 || weekIndices.length === 0) {
      console.log("Could not find header row with expected format, trying alternative approach")

      // APPROACH 2: Look for a row with many numeric values in subsequent columns
      let maxNumericCount = 0
      let bestRowIndex = -1

      for (let i = 0; i < Math.min(30, lines.length); i++) {
        const cells = lines[i].split(",")
        let numericCount = 0

        for (let j = 1; j < cells.length; j++) {
          const value = cells[j].replace(/["'$,]/g, "").trim()
          if (value !== "" && !isNaN(Number(value))) {
            numericCount++
          }
        }

        if (numericCount > maxNumericCount) {
          maxNumericCount = numericCount
          bestRowIndex = i
        }
      }

      if (bestRowIndex > 0 && maxNumericCount > 3) {
        // Use the row before this as the header
        headerRowIndex = bestRowIndex - 1
        const dataRow = lines[bestRowIndex].split(",")
        headerCells = lines[headerRowIndex].split(",").map((cell) => cell.trim())

        // Find columns with numeric values in the data row
        weekStartIndex = -1
        weekIndices = []
        weekNames = []

        for (let j = 1; j < dataRow.length; j++) {
          const value = dataRow[j].replace(/["'$,]/g, "").trim()
          if (value !== "" && !isNaN(Number(value))) {
            if (weekStartIndex === -1) weekStartIndex = j
            weekIndices.push(j)
            // Use header cell if available, otherwise generate a week name
            weekNames.push(headerCells[j] && headerCells[j] !== "" ? headerCells[j] : `Week ${j - weekStartIndex + 1}`)
          }
        }

        console.log(
          `Alternative approach: Found ${weekIndices.length} data columns starting at index ${weekStartIndex}`,
        )
      }
    }

    // If we still couldn't find week columns, use a last resort approach
    if (weekIndices.length === 0) {
      console.log("Could not identify week columns, using last resort approach")

      // APPROACH 3: Assume first column is category, and all other columns with headers are weeks
      headerRowIndex = 0
      headerCells = lines[0].split(",").map((cell) => cell.trim())
      weekStartIndex = 1
      weekIndices = []
      weekNames = []

      for (let j = 1; j < headerCells.length; j++) {
        if (headerCells[j] && headerCells[j] !== "") {
          weekIndices.push(j)
          weekNames.push(headerCells[j])
        } else {
          weekIndices.push(j)
          weekNames.push(`Week ${j}`)
        }
      }

      console.log(`Last resort approach: Using ${weekIndices.length} columns as week data`)
    }

    // Process data rows
    for (let i = headerRowIndex + 1; i < lines.length; i++) {
      const row = lines[i].split(",").map((cell) => cell.trim())

      // Skip rows with insufficient data
      if (row.length <= weekStartIndex) {
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
          const cellValue = row[colIndex].replace(/["'$,%]/g, "").trim()

          // Handle empty cells
          if (cellValue === "") {
            continue
          }

          // Try to parse as number
          let value = Number(cellValue)

          // If parsing failed, try to extract numbers from the string
          if (isNaN(value)) {
            const matches = cellValue.match(/-?\d+(\.\d+)?/)
            if (matches) {
              value = Number(matches[0])
            } else {
              continue
            }
          }

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
          }
        }
      }

      if (!rowHasData) {
        console.log(`No numeric data found in row ${i}: ${lines[i]}`)
      }
    }

    console.log(`Extracted ${timeSeriesData.length} data points for ${scenarioName}`)

    // If we still have no data, try a completely different approach
    if (timeSeriesData.length === 0) {
      console.log("No data points extracted, trying brute force approach")

      // APPROACH 4: Brute force - look for any numeric values in the file
      for (let i = 0; i < lines.length; i++) {
        const cells = lines[i].split(",")
        const category = cells[0]?.trim() || `Row ${i}`

        if (!category || category === "" || category.toLowerCase().includes("week")) {
          continue
        }

        for (let j = 1; j < cells.length; j++) {
          const cellValue = cells[j].replace(/["'$,%]/g, "").trim()
          if (cellValue === "") continue

          // Try to parse as number
          let value = Number(cellValue)

          // If parsing failed, try to extract numbers from the string
          if (isNaN(value)) {
            const matches = cellValue.match(/-?\d+(\.\d+)?/)
            if (matches) {
              value = Number(matches[0])
            } else {
              continue
            }
          }

          if (!isNaN(value) && value !== 0) {
            // Exclude zero values which might be empty cells
            const week = `Week ${j}`

            timeSeriesData.push({
              category,
              week,
              value,
              scenario: scenarioName,
            })
          }
        }
      }

      console.log(`Brute force approach extracted ${timeSeriesData.length} data points`)
    }

    return { timeSeriesData, alertsData }
  } catch (error) {
    console.error(`Error parsing CSV data for ${scenarioName}:`, error)
    return { timeSeriesData, alertsData }
  }
}
