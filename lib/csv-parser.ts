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

    // Based on the schema, we know the structure:
    // 1. First column: "Requirements at Plant P103" (categories)
    // 2. Second column: Empty
    // 3. Third column: "Week / Week Ending" (week numbers)
    // 4. Remaining columns: Data values

    // Find the header row
    let headerRow = -1
    for (let i = 0; i < Math.min(20, lines.length); i++) {
      if (lines[i].includes("Requirements at Plant P103") && lines[i].includes("Week / Week Ending")) {
        headerRow = i
        console.log(`Found header row at line ${i}: ${lines[i]}`)
        break
      }
    }

    if (headerRow === -1) {
      throw new Error("Could not find header row with 'Requirements at Plant P103' and 'Week / Week Ending'")
    }

    // Parse the header row
    const headers = parseCSVLine(lines[headerRow])
    console.log(`Headers: ${headers.join(", ")}`)

    // Find the index of the "Week / Week Ending" column
    const weekHeaderIndex = headers.findIndex((h) => h.includes("Week / Week Ending"))
    if (weekHeaderIndex === -1) {
      throw new Error("Could not find 'Week / Week Ending' column in headers")
    }

    // Find the data rows - these are rows after the header that have values
    // We'll look for rows that have a category in the first column
    for (let i = headerRow + 1; i < lines.length; i++) {
      const cells = parseCSVLine(lines[i])
      if (cells.length <= weekHeaderIndex) continue // Skip rows with insufficient data

      const category = cells[0].trim()
      if (!category) continue // Skip rows without a category

      // Skip header-like rows
      if (category === "Requirements at Plant P103") continue

      // Check if this is an alert category
      const isAlertCategory =
        category.toLowerCase().includes("alert") ||
        category.toLowerCase().includes("critical") ||
        category.toLowerCase().includes("capacity")

      // Process data for each week
      // In this format, the weeks are in rows, not columns
      const week = cells[weekHeaderIndex].trim()
      if (!week) continue // Skip if no week value

      // Get the value from the next column after the week
      if (cells.length > weekHeaderIndex + 1) {
        const valueStr = cells[weekHeaderIndex + 1].trim()
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

    console.log(`Parsed ${timeSeriesData.length} data points and ${alertsData.length} alerts`)

    // If we didn't get any data, try an alternative approach
    if (timeSeriesData.length === 0) {
      console.log("No data points found with primary approach, trying alternative approach")

      // In this approach, we'll assume:
      // 1. First column contains categories
      // 2. Columns after the "Week / Week Ending" column contain week numbers
      // 3. Values are in the cells where category rows and week columns intersect

      // First, find the row with week numbers
      let weekRow = -1
      for (let i = headerRow; i < Math.min(headerRow + 5, lines.length); i++) {
        const cells = parseCSVLine(lines[i])
        if (cells.length > weekHeaderIndex) {
          // Check if cells after the week header index contain numeric values
          let hasWeekNumbers = false
          for (let j = weekHeaderIndex + 1; j < cells.length; j++) {
            if (!isNaN(Number(cells[j].trim()))) {
              hasWeekNumbers = true
              break
            }
          }

          if (hasWeekNumbers) {
            weekRow = i
            console.log(`Found week row at line ${i}`)
            break
          }
        }
      }

      if (weekRow !== -1) {
        const weekCells = parseCSVLine(lines[weekRow])
        const weekValues: string[] = []
        const weekIndices: number[] = []

        // Collect week values and their indices
        for (let j = weekHeaderIndex + 1; j < weekCells.length; j++) {
          const weekVal = weekCells[j].trim()
          if (weekVal && !isNaN(Number(weekVal))) {
            weekValues.push(weekVal)
            weekIndices.push(j)
          }
        }

        console.log(`Found ${weekValues.length} week values: ${weekValues.join(", ")}`)

        // Now process data rows
        for (let i = weekRow + 1; i < lines.length; i++) {
          const cells = parseCSVLine(lines[i])
          if (cells.length <= weekHeaderIndex) continue

          const category = cells[0].trim()
          if (!category) continue

          // Skip header-like rows
          if (category === "Requirements at Plant P103") continue

          // Check if this is an alert category
          const isAlertCategory =
            category.toLowerCase().includes("alert") ||
            category.toLowerCase().includes("critical") ||
            category.toLowerCase().includes("capacity")

          // Process each week column
          for (let w = 0; w < weekIndices.length; w++) {
            const weekIdx = weekIndices[w]
            const week = weekValues[w]

            if (weekIdx < cells.length) {
              const valueStr = cells[weekIdx].trim()
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

        console.log(`Alternative approach parsed ${timeSeriesData.length} data points and ${alertsData.length} alerts`)
      }
    }

    // If we still don't have data, try one more approach - just look for any numeric data
    if (timeSeriesData.length === 0) {
      console.log("Still no data points found, trying final fallback approach")

      // In this approach, we'll scan all cells for numeric data
      for (let i = headerRow + 1; i < lines.length; i++) {
        const cells = parseCSVLine(lines[i])
        if (cells.length < 3) continue

        const category = cells[0].trim()
        if (!category) continue

        // Skip header-like rows
        if (category === "Requirements at Plant P103") continue

        // Look for numeric values in all cells
        for (let j = 1; j < cells.length; j++) {
          const valueStr = cells[j].trim()
          if (valueStr && !isNaN(Number(valueStr))) {
            const value = Number(valueStr)
            const week = j.toString() // Use column index as week if we can't determine actual week

            timeSeriesData.push({
              category,
              week,
              value,
              scenario: scenarioName,
            })
          }
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
