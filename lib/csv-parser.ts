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

    // First, let's find the header row that contains "Requirements at Plant P103"
    let headerRowIndex = -1
    for (let i = 0; i < Math.min(20, lines.length); i++) {
      if (lines[i].includes("Requirements at Plant P103")) {
        headerRowIndex = i
        console.log(`Found header row at line ${i}: ${lines[i]}`)
        break
      }
    }

    if (headerRowIndex === -1) {
      throw new Error("Could not find header row with 'Requirements at Plant P103'")
    }

    // Parse the header row
    const headerRow = parseCSVLine(lines[headerRowIndex])
    console.log(`Header row: ${headerRow.join(", ")}`)

    // Find the index of the "Week / Week Ending" column
    const weekColumnIndex = headerRow.findIndex((h) => h.includes("Week / Week Ending"))
    if (weekColumnIndex === -1) {
      console.warn("Could not find 'Week / Week Ending' column, will try to infer structure")
    }

    // Now let's find the row that contains the week numbers
    // This is typically the row right after the header row
    const weekRowIndex = headerRowIndex + 1
    if (weekRowIndex >= lines.length) {
      throw new Error("No data rows found after header row")
    }

    const weekRow = parseCSVLine(lines[weekRowIndex])
    console.log(`Potential week row: ${weekRow.join(", ")}`)

    // Find all columns that contain numeric values in the week row
    // These will be our week columns
    const weekColumns: { index: number; week: string }[] = []

    // Start from index 1 to skip the first column (which is the category)
    for (let i = 1; i < weekRow.length; i++) {
      const value = weekRow[i].trim()
      if (value && !isNaN(Number(value))) {
        weekColumns.push({ index: i, week: value })
        console.log(`Found week column at index ${i}: ${value}`)
      }
    }

    if (weekColumns.length === 0) {
      // If we couldn't find week columns in the week row, try to find them in the header row
      for (let i = 1; i < headerRow.length; i++) {
        const value = headerRow[i].trim()
        if (value && !isNaN(Number(value))) {
          weekColumns.push({ index: i, week: value })
          console.log(`Found week column in header at index ${i}: ${value}`)
        }
      }
    }

    if (weekColumns.length === 0) {
      throw new Error("Could not identify any week columns in the CSV")
    }

    // Now process all data rows (starting from the row after the week row)
    for (let i = weekRowIndex + 1; i < lines.length; i++) {
      const row = parseCSVLine(lines[i])
      if (row.length <= 1) continue // Skip rows with insufficient data

      // Get the category from the first column
      const category = row[0].trim()
      if (!category) continue // Skip rows without a category

      // Skip header-like rows or empty categories
      if (category === "Requirements at Plant P103" || category === "") continue

      // Check if this is an alert category
      const isAlertCategory =
        category.toLowerCase().includes("alert") ||
        category.toLowerCase().includes("critical") ||
        category.toLowerCase().includes("capacity")

      // Process each week column
      for (const { index, week } of weekColumns) {
        if (index < row.length) {
          const valueStr = row[index].trim()
          if (valueStr && !isNaN(Number(valueStr))) {
            const value = Number(valueStr)

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
      }
    }

    console.log(`Parsed ${timeSeriesData.length} data points and ${alertsData.length} alerts`)

    // If we still don't have data, try a more aggressive approach
    if (timeSeriesData.length === 0) {
      console.log("No data points found with primary approach, trying alternative approach")

      // In this approach, we'll scan all rows and columns for numeric data
      for (let i = 0; i < lines.length; i++) {
        // Skip the header and week rows we already processed
        if (i === headerRowIndex || i === weekRowIndex) continue

        const row = parseCSVLine(lines[i])
        if (row.length <= 1) continue

        const category = row[0].trim()
        if (!category) continue

        // Skip header-like rows
        if (category === "Requirements at Plant P103") continue

        // Look for numeric values in all columns
        for (let j = 1; j < row.length; j++) {
          const valueStr = row[j].trim()
          if (valueStr && !isNaN(Number(valueStr))) {
            const value = Number(valueStr)

            // Use the column index as the week if we can't determine actual week
            // Try to get the week from the week row if possible
            let week = j.toString()
            if (j < weekRow.length && weekRow[j] && !isNaN(Number(weekRow[j]))) {
              week = weekRow[j]
            }

            timeSeriesData.push({
              category,
              week,
              value,
              scenario: scenarioName,
            })
          }
        }
      }

      console.log(`Alternative approach parsed ${timeSeriesData.length} data points`)
    }

    // If we STILL don't have data, try one last desperate approach
    if (timeSeriesData.length === 0) {
      console.log("Still no data points found, trying final fallback approach")

      // In this approach, we'll just look for any row with a non-empty first cell and numeric values
      for (let i = 0; i < lines.length; i++) {
        const row = parseCSVLine(lines[i])
        if (row.length <= 1) continue

        const category = row[0].trim()
        if (!category) continue

        let foundNumeric = false
        for (let j = 1; j < row.length; j++) {
          const valueStr = row[j].trim()
          if (valueStr && !isNaN(Number(valueStr))) {
            const value = Number(valueStr)
            foundNumeric = true

            timeSeriesData.push({
              category,
              week: `Column ${j}`,
              value,
              scenario: scenarioName,
            })
          }
        }

        if (foundNumeric) {
          console.log(`Found data in row ${i} with category: ${category}`)
        }
      }

      console.log(`Final fallback approach parsed ${timeSeriesData.length} data points`)
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
