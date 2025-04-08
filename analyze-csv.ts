import { parseCSVData } from "./lib/csv-parser"

// Function to fetch and analyze a CSV file
async function analyzeCSV(url: string, scenarioName: string) {
  try {
    console.log(`Fetching ${scenarioName} data from ${url}...`)
    const response = await fetch(url)
    const text = await response.text()

    console.log(`Analyzing ${scenarioName} data...`)
    const { timeSeriesData, alertsData } = parseCSVData(text, scenarioName)

    console.log(`Results for ${scenarioName}:`)
    console.log(`- Time series data points: ${timeSeriesData.length}`)
    console.log(`- Alert data points: ${alertsData.length}`)

    // Show sample data points
    if (timeSeriesData.length > 0) {
      console.log(`- Sample data point: ${JSON.stringify(timeSeriesData[0])}`)
    }

    // Show unique categories
    const categories = new Set(timeSeriesData.map((d) => d.category))
    console.log(`- Categories: ${Array.from(categories).join(", ")}`)

    // Show unique weeks
    const weeks = new Set(timeSeriesData.map((d) => d.week))
    console.log(`- Weeks: ${Array.from(weeks).join(", ")}`)

    return { timeSeriesData, alertsData }
  } catch (error) {
    console.error(`Error analyzing ${scenarioName}:`, error)
    return { timeSeriesData: [], alertsData: [] }
  }
}

// URLs for the different scenarios
const baseUrl =
  "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/BASE%20-%20Demand%20Supply%20Time%20Series%20-%20105-VYl9l4W9bMrtecsx0jbERDaSgBiKPy.csv"
const s1Url =
  "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/S1%20-%20Demand%20Supply%20Time%20Series%20-%20105-qo8aidQxFptNVjUWh6EWjnTeEu5oN3.csv"
const s2Url =
  "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/S2%20-%20Demand%20Supply%20Time%20Series%20-%20105-DsjHKBUyK2PAp8uUnDefxJQz1xp3Te.csv"
const s3Url =
  "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/S3%20-%20Demand%20Supply%20Time%20Series%20-%20105-GCaeSYA717KF0UoCT1LauB1M8xr3Ms.csv"
const s4Url =
  "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/S4%20-%20Demand%20Supply%20Time%20Series%20-%20105-eVD2IMt3BH0Rir2GgV9eidV3MjpHxq.csv"

// Analyze all scenarios
async function analyzeAllScenarios() {
  await analyzeCSV(baseUrl, "BASE")
  await analyzeCSV(s1Url, "S1")
  await analyzeCSV(s2Url, "S2")
  await analyzeCSV(s3Url, "S3")
  await analyzeCSV(s4Url, "S4")
}

// Run the analysis
analyzeAllScenarios()
