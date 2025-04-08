// This utility will help us understand the structure of the CSV files

async function analyzeCsvStructure(url: string, scenarioName: string) {
  try {
    console.log(`Fetching ${scenarioName} data from ${url}...`)
    const response = await fetch(url)
    const text = await response.text()

    console.log(`Received ${text.length} bytes for ${scenarioName}`)

    // Log the first 500 characters
    console.log(`CSV sample for ${scenarioName}:`)
    console.log(text.substring(0, 500))

    // Split into lines
    const lines = text.split(/\r?\n/).filter((line) => line.trim() !== "")
    console.log(`CSV has ${lines.length} lines after cleanup`)

    // Analyze the first few lines
    console.log(`First 5 lines:`)
    for (let i = 0; i < Math.min(5, lines.length); i++) {
      const line = lines[i]
      const cells = line.split(",")
      console.log(`Line ${i} (${cells.length} cells): ${line.substring(0, 100)}${line.length > 100 ? "..." : ""}`)

      // Check for numeric values
      const numericCells = cells.filter((cell) => {
        const trimmed = cell.trim()
        return trimmed !== "" && !isNaN(Number(trimmed))
      })

      if (numericCells.length > 0) {
        console.log(`  - Contains ${numericCells.length} numeric values: ${numericCells.join(", ")}`)
      }
    }

    // Look for patterns in the data
    const patterns = {
      linesWithRequirements: 0,
      linesWithWeek: 0,
      linesWithNumericValues: 0,
      totalNumericValues: 0,
    }

    for (const line of lines) {
      if (line.includes("Requirements")) patterns.linesWithRequirements++
      if (line.includes("Week")) patterns.linesWithWeek++

      const cells = line.split(",")
      const numericCells = cells.filter((cell) => {
        const trimmed = cell.trim()
        return trimmed !== "" && !isNaN(Number(trimmed))
      })

      if (numericCells.length > 0) {
        patterns.linesWithNumericValues++
        patterns.totalNumericValues += numericCells.length
      }
    }

    console.log(`Data patterns for ${scenarioName}:`)
    console.log(patterns)

    // Try to identify the structure
    if (patterns.linesWithRequirements > 0 && patterns.linesWithWeek > 0) {
      console.log(`CSV appears to have a header structure with Requirements and Week columns`)
    } else if (patterns.totalNumericValues > 0) {
      console.log(
        `CSV contains ${patterns.totalNumericValues} numeric values in ${patterns.linesWithNumericValues} lines`,
      )
    } else {
      console.log(`CSV structure is unclear - no obvious patterns detected`)
    }
  } catch (error) {
    console.error(`Error analyzing ${scenarioName}:`, error)
  }
}

// URLs for the different scenarios
const urls = {
  BASE: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/BASE%20-%20Demand%20Supply%20Time%20Series%20-%20105-VYl9l4W9bMrtecsx0jbERDaSgBiKPy.csv",
  S1: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/S1%20-%20Demand%20Supply%20Time%20Series%20-%20105-qo8aidQxFptNVjUWh6EWjnTeEu5oN3.csv",
  S2: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/S2%20-%20Demand%20Supply%20Time%20Series%20-%20105-DsjHKBUyK2PAp8uUnDefxJQz1xp3Te.csv",
  S3: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/S3%20-%20Demand%20Supply%20Time%20Series%20-%20105-GCaeSYA717KF0UoCT1LauB1M8xr3Ms.csv",
  S4: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/S4%20-%20Demand%20Supply%20Time%20Series%20-%20105-eVD2IMt3BH0Rir2GgV9eidV3MjpHxq.csv",
}

// Analyze all scenarios
async function analyzeAllScenarios() {
  for (const [scenarioName, url] of Object.entries(urls)) {
    await analyzeCsvStructure(url, scenarioName)
    console.log("\n-----------------------------------\n")
  }
}

// Run the analysis
analyzeAllScenarios()
