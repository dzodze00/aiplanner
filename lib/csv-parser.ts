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

// Function to parse CSV text into a 2D array
export function parseCSV(text: string): string[][] {
  // Handle different line endings
  const lines = text.replace(/\r\n/g, "\n").split("\n")

  return lines
    .map((line) => {
      // Handle quoted values correctly
      const result: string[] = []
      let inQuotes = false
      let currentValue = ""

      for (let i = 0; i < line.length; i++) {
        const char = line[i]

        if (char === '"') {
          inQuotes = !inQuotes
        } else if (char === "," && !inQuotes) {
          result.push(currentValue.trim())
          currentValue = ""
        } else {
          currentValue += char
        }
      }

      // Add the last value
      result.push(currentValue.trim())
      return result
    })
    .filter((row) => row.length > 0 && row.some((cell) => cell !== ""))
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
    // Parse the CSV into a 2D array
    const parsedData = parseCSV(csvText)

    if (parsedData.length === 0) {
      console.error("CSV file is empty or invalid")
      return { timeSeriesData, alertsData }
    }

    console.log(`CSV has ${parsedData.length} rows after parsing`)

    // Log a sample of the parsed data
    console.log("Sample of parsed data:")
    for (let i = 0; i < Math.min(5, parsedData.length); i++) {
      console.log(`Row ${i}: [${parsedData[i].join(", ")}]`)
    }

    // Try multiple strategies to find the header row and data structure

    // Strategy 1: Look for a row with "Week" or similar keywords
    let headerRowIndex = -1
    for (let i = 0; i < Math.min(20, parsedData.length); i++) {
      const row = parsedData[i]
      const rowText = row.join(" ").toLowerCase()
      if (
        rowText.includes("week") ||
        rowText.includes("period") ||
        rowText.includes("date") ||
        rowText.includes("time") ||
        /w\d+/.test(rowText)
      ) {
        headerRowIndex = i
        console.log(`Found potential header row at index ${i}: [${row.join(", ")}]`)
        break
      }
    }

    // If no header found with Strategy 1, try Strategy 2: Look for a row with many numeric columns
    if (headerRowIndex === -1) {
      for (let i = 0; i < Math.min(10, parsedData.length); i++) {
        const row = parsedData[i]
        // Check if the next row has many numeric values
        if (i + 1 < parsedData.length) {
          const nextRow = parsedData[i + 1]
          const numericCount = nextRow.filter((cell) => !isNaN(Number(cell)) && cell.trim() !== "").length
          if (numericCount > 3) {
            // If more than 3 numeric values, this might be a header row
            headerRowIndex = i
            console.log(`Found potential header row at index ${i} based on numeric values in next row`)
            break
          }
        }
      }
    }

    // If still no header found, assume first row is header
    if (headerRowIndex === -1) {
      headerRowIndex = 0
      console.log("No header row found, assuming first row is header")
    }

    const headerRow = parsedData[headerRowIndex]

    // Find columns that might contain week/time period data
    const weekIndices: number[] = []
    const weekLabels: string[] = []

    // Skip the first column (usually category/description)
    for (let i = 1; i < headerRow.length; i++) {
      const cell = headerRow[i].trim()
      if (cell && cell !== "") {
        weekIndices.push(i)
        weekLabels.push(cell)
      }
    }

    console.log(`Found ${weekIndices.length} potential data columns: [${weekLabels.join(", ")}]`)

    if (weekIndices.length === 0) {
      console.error("No data columns found in header row")
      return { timeSeriesData, alertsData }
    }

    // Process data rows
    for (let i = headerRowIndex + 1; i < parsedData.length; i++) {
      const row = parsedData[i]
      if (row.length <= 1) continue // Skip rows with insufficient data

      const category = row[0].trim()
      if (!category) continue // Skip rows with empty category

      // Skip header-like rows or empty rows
      if (
        category.toLowerCase().includes("week") ||
        category.toLowerCase().includes("period") ||
        category.toLowerCase().includes("date") ||
        category === ""
      ) {
        continue
      }

      let rowHasData = false

      // Process each data column
      weekIndices.forEach((colIndex, idx) => {
        if (colIndex < row.length) {
          // Clean and parse the cell value
          const cellValue = row[colIndex].replace(/["'$,]/g, "").trim()

          if (cellValue !== "") {
            const value = Number(cellValue)

            if (!isNaN(value)) {
              rowHasData = true
              const week = weekLabels[idx] || `Column ${idx + 1}`

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
        console.log(`No numeric data found in row ${i}: [${row.join(", ")}]`)
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
