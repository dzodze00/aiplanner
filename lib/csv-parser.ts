import type { DataPoint, AlertData } from "./data-utils"

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

    // APPROACH 1: Direct parsing of the raw CSV text
    // This approach doesn't rely on finding specific headers or structure
    // It just looks for patterns in the data that match what we expect

    // First, let's extract all lines that might contain data
    // We're looking for lines that have a non-empty first column and numeric values in other columns
    const potentialDataLines: { lineIndex: number; line: string }[] = []

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]
      // Skip lines that are too short or don't have commas
      if (line.length < 5 || !line.includes(",")) continue

      // Check if the line has at least one numeric value
      const hasNumeric = /\d+(\.\d+)?/.test(line)
      if (hasNumeric) {
        potentialDataLines.push({ lineIndex: i, line })
      }
    }

    console.log(`Found ${potentialDataLines.length} potential data lines`)

    if (potentialDataLines.length === 0) {
      throw new Error("Could not find any potential data lines in the CSV")
    }

    // Now, let's try to identify the week numbers
    // We'll look for a line that has consecutive numeric values
    let weekLine = null
    let weekValues: string[] = []

    for (const { lineIndex, line } of potentialDataLines) {
      const cells = line.split(",")
      const numericCells = cells.filter((cell) => {
        const trimmed = cell.trim()
        return trimmed !== "" && !isNaN(Number(trimmed))
      })

      // If we found a line with multiple numeric values, it might be our week line
      if (numericCells.length >= 3) {
        weekLine = { lineIndex, cells }
        weekValues = numericCells
        console.log(`Potential week line found at index ${lineIndex} with ${numericCells.length} numeric values`)
        break
      }
    }

    // If we couldn't find a week line, just use the first few numbers as week identifiers
    if (!weekLine) {
      console.log("Could not identify a specific week line, using generic week identifiers")
      weekValues = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10"]
    }

    // Now, process all potential data lines
    for (const { lineIndex, line } of potentialDataLines) {
      // Skip the week line itself
      if (weekLine && lineIndex === weekLine.lineIndex) continue

      const cells = line.split(",")

      // Get the category from the first non-empty cell
      let category = ""
      for (const cell of cells) {
        const trimmed = cell.trim()
        if (trimmed !== "") {
          category = trimmed
          break
        }
      }

      if (!category) continue

      // Skip lines that look like headers
      if (category.includes("Requirements") || category.includes("Week")) continue

      // Check if this is an alert category
      const isAlertCategory =
        category.toLowerCase().includes("alert") ||
        category.toLowerCase().includes("critical") ||
        category.toLowerCase().includes("capacity")

      // Find all numeric values in the line
      const numericValues: { index: number; value: number }[] = []

      for (let i = 0; i < cells.length; i++) {
        const trimmed = cells[i].trim()
        if (trimmed !== "" && !isNaN(Number(trimmed))) {
          numericValues.push({ index: i, value: Number(trimmed) })
        }
      }

      // If we found numeric values, add them to our data
      for (let i = 0; i < numericValues.length; i++) {
        const { index, value } = numericValues[i]

        // Use the week value if available, otherwise use the index
        const week = i < weekValues.length ? weekValues[i] : `Week ${i + 1}`

        // Skip week 0 data which often contains initialization values
        if (week === "0") continue

        // Add to time series data
        timeSeriesData.push({
          category,
          week,
          value,
          scenario: scenarioName,
        })

        // If this is an alert category, also add to alerts data
        if (isAlertCategory) {
          let alertType = "General"
          if (category.toLowerCase().includes("critical")) {
            alertType = "Critical"
          } else if (category.toLowerCase().includes("capacity")) {
            alertType = "Capacity"
          }

          // Check if we already have an alert for this type and scenario
          const existingAlert = alertsData.find((a) => a.type === alertType && a.scenario === scenarioName)

          if (existingAlert) {
            existingAlert.count += value
          } else {
            alertsData.push({
              type: alertType,
              count: value,
              scenario: scenarioName,
            })
          }
        }
      }
    }

    console.log(`Direct parsing approach extracted ${timeSeriesData.length} data points`)

    // If we still don't have data, try a more aggressive approach
    if (timeSeriesData.length === 0) {
      console.log("No data points found with direct parsing, trying regex approach")

      // Use regex to find all numeric values in the entire CSV
      const numericMatches = [...csvText.matchAll(/(\d+(\.\d+)?)/g)]
      console.log(`Found ${numericMatches.length} numeric values in the CSV`)

      if (numericMatches.length > 0) {
        // Group numeric values into chunks of 10 (arbitrary)
        const chunkSize = 10
        for (let i = 0; i < numericMatches.length; i += chunkSize) {
          const chunk = numericMatches.slice(i, i + chunkSize)

          // Use a generic category name
          const category = `Data Group ${Math.floor(i / chunkSize) + 1}`

          // Add each value to our data
          for (let j = 0; j < chunk.length; j++) {
            const value = Number(chunk[j][0])
            const week = `Week ${j + 1}`

            timeSeriesData.push({
              category,
              week,
              value,
              scenario: scenarioName,
            })
          }
        }

        console.log(`Regex approach extracted ${timeSeriesData.length} data points`)
      }
    }

    return { timeSeriesData, alertsData }
  } catch (error) {
    console.error("Error parsing CSV data:", error)
    throw new Error(`Failed to parse CSV: ${error instanceof Error ? error.message : String(error)}`)
  }
}

// Helper function to properly parse CSV lines with quoted values
function parseCSVLine(line: string): string[] {
  const result: string[] = []
  let currentValue = ""
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const char = line[i]

    if (char === '"') {
      inQuotes = !inQuotes
    } else if (char === "," && !inQuotes) {
      result.push(currentValue)
      currentValue = ""
    } else {
      currentValue += char
    }
  }

  // Add the last value
  result.push(currentValue)

  return result
}
