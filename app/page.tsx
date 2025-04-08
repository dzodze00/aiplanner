"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { parseCSVData } from "@/lib/csv-parser"
import { scenarios } from "@/lib/data-utils"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"

export default function Dashboard() {
  const [loadedScenarios, setLoadedScenarios] = useState<string[]>([])
  const [timeSeriesData, setTimeSeriesData] = useState<any[]>([])
  const [alertsData, setAlertsData] = useState<any[]>([])
  const [error, setError] = useState<string | null>(null)
  const [debugInfo, setDebugInfo] = useState<string>("")
  const [loading, setLoading] = useState<boolean>(false)
  const [processingStatus, setProcessingStatus] = useState<Record<string, string>>({})
  const [rawCsvData, setRawCsvData] = useState<Record<string, string>>({})
  const [activeTab, setActiveTab] = useState<string>("dashboard")

  // Add useEffect to log state changes
  useEffect(() => {
    console.log("State updated:", {
      loadedScenarios,
      timeSeriesDataLength: timeSeriesData.length,
      alertsDataLength: alertsData.length,
    })

    // Calculate some statistics for debugging
    const categories = Array.from(new Set(timeSeriesData.map((d) => d.category)))
    const weeks = Array.from(new Set(timeSeriesData.map((d) => d.week)))
    const scenariosInData = Array.from(new Set(timeSeriesData.map((d) => d.scenario)))

    // Get sample data points for each category
    const samplesByCategory: Record<string, any> = {}
    categories.forEach((category) => {
      const sample = timeSeriesData.find((d) => d.category === category)
      if (sample) {
        samplesByCategory[category as string] = sample
      }
    })

    // Count data points by scenario
    const countByScenario: Record<string, number> = {}
    scenariosInData.forEach((scenario) => {
      countByScenario[scenario as string] = timeSeriesData.filter((d) => d.scenario === scenario).length
    })

    setDebugInfo(
      JSON.stringify(
        {
          loadedScenarios,
          timeSeriesDataLength: timeSeriesData.length,
          alertsDataLength: alertsData.length,
          categories,
          weeks,
          scenariosInData,
          countByScenario,
          samplesByCategory,
        },
        null,
        2,
      ),
    )
  }, [loadedScenarios, timeSeriesData, alertsData])

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>, scenarioName: string) => {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      setProcessingStatus((prev) => ({ ...prev, [scenarioName]: "Processing..." }))
      console.log(`Processing file for ${scenarioName}:`, file.name)
      const text = await file.text()

      // Store the raw CSV data for inspection
      setRawCsvData((prev) => ({ ...prev, [scenarioName]: text }))

      // Log the first 100 characters to verify content
      console.log(`File content (first 100 chars): ${text.substring(0, 100)}...`)

      const { timeSeriesData: newTimeSeriesData, alertsData: newAlertsData } = parseCSVData(text, scenarioName)

      console.log(`Parsed ${newTimeSeriesData.length} data points and ${newAlertsData.length} alerts`)

      if (newTimeSeriesData.length === 0) {
        setError(`No data points were extracted from the file for ${scenarioName}. Please check the file format.`)
        setProcessingStatus((prev) => ({ ...prev, [scenarioName]: "Error: No data extracted" }))
        return
      }

      // Update state with new data
      setTimeSeriesData((prev) => {
        const filtered = prev.filter((d) => d.scenario !== scenarioName)
        const combined = [...filtered, ...newTimeSeriesData]
        console.log(`Updated timeSeriesData, new length: ${combined.length}`)
        return combined
      })

      setAlertsData((prev) => {
        const filtered = prev.filter((d) => d.scenario !== scenarioName)
        const combined = [...filtered, ...newAlertsData]
        console.log(`Updated alertsData, new length: ${combined.length}`)
        return combined
      })

      if (!loadedScenarios.includes(scenarioName)) {
        setLoadedScenarios((prev) => {
          const updated = [...prev, scenarioName]
          console.log(`Updated loadedScenarios: ${updated.join(", ")}`)
          return updated
        })
      }

      console.log(`Successfully loaded data for ${scenarioName}`)
      setProcessingStatus((prev) => ({ ...prev, [scenarioName]: `Loaded ${newTimeSeriesData.length} points` }))
      setError(null)
    } catch (err) {
      console.error("Error processing file:", err)
      setError(`Error processing file: ${err instanceof Error ? err.message : String(err)}`)
      setProcessingStatus((prev) => ({ ...prev, [scenarioName]: "Error processing file" }))
    }
  }

  // Function to fetch data directly from URLs
  const fetchDataFromUrls = async () => {
    setLoading(true)
    setError(null)
    setProcessingStatus({})
    setRawCsvData({})

    try {
      // URLs for the different scenarios
      const urls = {
        BASE: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/BASE%20-%20Demand%20Supply%20Time%20Series%20-%20105-VYl9l4W9bMrtecsx0jbERDaSgBiKPy.csv",
        S1: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/S1%20-%20Demand%20Supply%20Time%20Series%20-%20105-qo8aidQxFptNVjUWh6EWjnTeEu5oN3.csv",
        S2: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/S2%20-%20Demand%20Supply%20Time%20Series%20-%20105-DsjHKBUyK2PAp8uUnDefxJQz1xp3Te.csv",
        S3: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/S3%20-%20Demand%20Supply%20Time%20Series%20-%20105-GCaeSYA717KF0UoCT1LauB1M8xr3Ms.csv",
        S4: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/S4%20-%20Demand%20Supply%20Time%20Series%20-%20105-eVD2IMt3BH0Rir2GgV9eidV3MjpHxq.csv",
      }

      // Clear existing data
      setTimeSeriesData([])
      setAlertsData([])
      setLoadedScenarios([])

      // Fetch and process each scenario
      const newTimeSeriesData: any[] = []
      const newAlertsData: any[] = []
      const successfulScenarios: string[] = []
      const errors: string[] = []

      for (const [scenarioName, url] of Object.entries(urls)) {
        try {
          setProcessingStatus((prev) => ({ ...prev, [scenarioName]: "Fetching..." }))
          console.log(`Fetching ${scenarioName} data from URL...`)
          const response = await fetch(url)

          if (!response.ok) {
            throw new Error(`Failed to fetch ${scenarioName}: ${response.status} ${response.statusText}`)
          }

          const text = await response.text()
          console.log(`Received ${text.length} bytes for ${scenarioName}`)

          // Store the raw CSV data for inspection
          setRawCsvData((prev) => ({ ...prev, [scenarioName]: text }))

          // Log a sample of the CSV content
          console.log(`CSV sample for ${scenarioName}: ${text.substring(0, 200)}...`)

          setProcessingStatus((prev) => ({ ...prev, [scenarioName]: "Parsing..." }))
          console.log(`Processing ${scenarioName} data...`)
          const { timeSeriesData: scenarioData, alertsData: scenarioAlerts } = parseCSVData(text, scenarioName)

          console.log(
            `Parsed ${scenarioData.length} data points and ${scenarioAlerts.length} alerts for ${scenarioName}`,
          )

          if (scenarioData.length > 0) {
            newTimeSeriesData.push(...scenarioData)
            newAlertsData.push(...scenarioAlerts)
            successfulScenarios.push(scenarioName)
            setProcessingStatus((prev) => ({
              ...prev,
              [scenarioName]: `Loaded ${scenarioData.length} points`,
            }))
          } else {
            errors.push(`No data points were extracted from the file for ${scenarioName}`)
            setProcessingStatus((prev) => ({
              ...prev,
              [scenarioName]: "Error: No data extracted",
            }))
          }
        } catch (err) {
          console.error(`Error processing ${scenarioName}:`, err)
          errors.push(`Error processing ${scenarioName}: ${err instanceof Error ? err.message : String(err)}`)
          setProcessingStatus((prev) => ({
            ...prev,
            [scenarioName]: "Error",
          }))
        }
      }

      // Update state with all the new data
      setTimeSeriesData(newTimeSeriesData)
      setAlertsData(newAlertsData)
      setLoadedScenarios(successfulScenarios)

      if (errors.length > 0) {
        setError(errors.join("\n"))
      }

      console.log("Finished loading scenarios from URLs")
    } catch (err) {
      console.error("Error fetching data from URLs:", err)
      setError(`Error fetching data: ${err instanceof Error ? err.message : String(err)}`)
    } finally {
      setLoading(false)
    }
  }

  // Calculate some basic statistics for display
  const getDataStatistics = () => {
    if (timeSeriesData.length === 0) return null

    const categories = Array.from(new Set(timeSeriesData.map((d) => d.category)))
    const weeks = Array.from(new Set(timeSeriesData.map((d) => d.week))).sort()

    // Calculate average values by category and scenario
    const averagesByCategory: Record<string, Record<string, number>> = {}

    categories.forEach((category) => {
      averagesByCategory[category as string] = {}

      loadedScenarios.forEach((scenario) => {
        const values = timeSeriesData
          .filter((d) => d.category === category && d.scenario === scenario)
          .map((d) => d.value)

        if (values.length > 0) {
          const avg = values.reduce((sum, val) => sum + val, 0) / values.length
          averagesByCategory[category as string][scenario] = avg
        }
      })
    })

    return {
      categories,
      weeks,
      averagesByCategory,
    }
  }

  const stats = getDataStatistics()

  return (
    <div className="p-4 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Detroit Cathode Manufacturing</h1>
      <p className="mb-6">S&OP Planning Dashboard</p>

      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {error.split("\n").map((line, i) => (
              <div key={i}>{line}</div>
            ))}
          </AlertDescription>
        </Alert>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
        <TabsList>
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="raw-data">Raw Data</TabsTrigger>
          <TabsTrigger value="debug">Debug</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard">
          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-2">Data Upload</h2>
            <p className="mb-4">Upload planning data files for analysis</p>

            <div className="mb-4">
              <Button
                onClick={fetchDataFromUrls}
                disabled={loading}
                className="bg-green-500 hover:bg-green-600 text-white"
              >
                {loading ? "Loading..." : "Load All Data from URLs"}
              </Button>
              <p className="text-sm text-gray-600 mt-1">
                Click to automatically load all scenario data from the provided URLs
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              {scenarios.map((scenario) => (
                <div
                  key={scenario.name}
                  className={`border rounded p-4 ${
                    loadedScenarios.includes(scenario.name)
                      ? "border-green-200 bg-green-50"
                      : processingStatus[scenario.name]?.includes("Error")
                        ? "border-red-200 bg-red-50"
                        : "border-gray-200 bg-gray-50"
                  }`}
                >
                  <h3 className="font-medium">{scenario.name}</h3>
                  <p className="text-sm text-gray-600 mb-2">{scenario.description}</p>

                  <div className="flex flex-col gap-2">
                    <input
                      type="file"
                      id={`file-${scenario.name}`}
                      accept=".csv"
                      className="hidden"
                      onChange={(e) => handleFileUpload(e, scenario.name)}
                    />
                    <label
                      htmlFor={`file-${scenario.name}`}
                      className="cursor-pointer bg-blue-500 hover:bg-blue-600 text-white py-1 px-3 rounded text-sm text-center"
                    >
                      {loadedScenarios.includes(scenario.name) ? "Reload" : "Upload"}
                    </label>

                    {processingStatus[scenario.name] && (
                      <div
                        className={`text-xs ${
                          processingStatus[scenario.name].includes("Error")
                            ? "text-red-600"
                            : processingStatus[scenario.name].includes("Loaded")
                              ? "text-green-600"
                              : "text-gray-600"
                        }`}
                      >
                        {processingStatus[scenario.name]}
                      </div>
                    )}

                    {loadedScenarios.includes(scenario.name) && (
                      <div className="text-green-600 text-sm flex items-center justify-center">✓ Loaded</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {timeSeriesData.length > 0 && stats && (
            <div className="mt-8">
              <h2 className="text-xl font-semibold mb-4">Data Summary</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="border rounded p-4">
                  <h3 className="font-medium mb-2">Loaded Scenarios</h3>
                  <ul className="list-disc pl-5">
                    {loadedScenarios.map((scenario) => (
                      <li key={scenario}>{scenario}</li>
                    ))}
                  </ul>
                </div>

                <div className="border rounded p-4">
                  <h3 className="font-medium mb-2">Data Points</h3>
                  <p>Time Series Data: {timeSeriesData.length} points</p>
                  <p>Alerts Data: {alertsData.length} alerts</p>
                  <p>Time Periods: {stats.weeks.length}</p>
                </div>
              </div>

              <div className="mt-6 border rounded p-4">
                <h3 className="font-medium mb-2">Categories</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {stats.categories.map((category) => (
                    <div key={category as string} className="border rounded p-3">
                      <h4 className="font-medium text-sm">{category as string}</h4>
                      <div className="mt-2">
                        {loadedScenarios.map((scenario) => {
                          const avg = stats.averagesByCategory[category as string][scenario]
                          return avg !== undefined ? (
                            <div key={scenario} className="flex justify-between text-sm">
                              <span>{scenario}:</span>
                              <span>{avg.toFixed(2)}</span>
                            </div>
                          ) : null
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-6 border rounded p-4">
                <h3 className="font-medium mb-2">Time Periods</h3>
                <div className="flex flex-wrap gap-2">
                  {stats.weeks.map((week) => (
                    <span key={week as string} className="inline-block bg-gray-100 px-2 py-1 rounded text-sm">
                      {week as string}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="raw-data">
          <div className="mt-4">
            <h2 className="text-xl font-semibold mb-4">Raw CSV Data</h2>
            <p className="mb-4">Inspect the raw CSV data to understand its structure</p>

            {Object.keys(rawCsvData).length === 0 ? (
              <div className="text-gray-500">
                No data loaded yet. Click "Load All Data from URLs" to fetch the data.
              </div>
            ) : (
              <Tabs defaultValue={Object.keys(rawCsvData)[0]} className="mt-4">
                <TabsList className="mb-4">
                  {Object.keys(rawCsvData).map((scenario) => (
                    <TabsTrigger key={scenario} value={scenario}>
                      {scenario}
                    </TabsTrigger>
                  ))}
                </TabsList>

                {Object.entries(rawCsvData).map(([scenario, data]) => (
                  <TabsContent key={scenario} value={scenario}>
                    <div className="border rounded p-4 bg-gray-50">
                      <h3 className="font-medium mb-2">{scenario} Raw Data</h3>
                      <div className="mt-2">
                        <pre className="whitespace-pre-wrap overflow-auto max-h-96 text-xs bg-white p-4 border rounded">
                          {data.substring(0, 5000)}
                          {data.length > 5000 && "... (truncated)"}
                        </pre>
                      </div>
                    </div>
                  </TabsContent>
                ))}
              </Tabs>
            )}
          </div>
        </TabsContent>

        <TabsContent value="debug">
          <div className="mt-4">
            <h2 className="text-xl font-semibold mb-4">Debug Information</h2>
            <p>Loaded Scenarios: {loadedScenarios.join(", ") || "None"}</p>
            <p>Time Series Data Points: {timeSeriesData.length}</p>
            <p>Alerts Data Points: {alertsData.length}</p>

            {timeSeriesData.length > 0 && (
              <div className="mt-4">
                <h3 className="font-medium mb-2">Sample Data Points:</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Array.from(new Set(timeSeriesData.map((d) => d.category)))
                    .slice(0, 4)
                    .map((category) => {
                      const sample = timeSeriesData.find((d) => d.category === category)
                      return sample ? (
                        <div key={category as string} className="bg-gray-100 p-2 rounded">
                          <p className="font-medium">{category as string}:</p>
                          <pre className="text-xs overflow-auto">{JSON.stringify(sample, null, 2)}</pre>
                        </div>
                      ) : null
                    })}
                </div>
              </div>
            )}

            <div className="mt-4">
              <h3 className="font-medium mb-2">Full Debug Info:</h3>
              <pre className="bg-gray-100 p-2 rounded overflow-auto text-xs">{debugInfo}</pre>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
