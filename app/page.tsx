"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { parseCSVData } from "@/lib/csv-parser"
import { scenarios } from "@/lib/data-utils"

export default function Dashboard() {
  const [loadedScenarios, setLoadedScenarios] = useState<string[]>([])
  const [timeSeriesData, setTimeSeriesData] = useState<any[]>([])
  const [alertsData, setAlertsData] = useState<any[]>([])
  const [error, setError] = useState<string | null>(null)
  const [debugInfo, setDebugInfo] = useState<string>("")

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

    setDebugInfo(
      JSON.stringify(
        {
          loadedScenarios,
          timeSeriesDataLength: timeSeriesData.length,
          alertsDataLength: alertsData.length,
          categories,
          weeks,
          scenariosInData,
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
      console.log(`Processing file for ${scenarioName}:`, file.name)
      const text = await file.text()

      // Log the first 100 characters to verify content
      console.log(`File content (first 100 chars): ${text.substring(0, 100)}...`)

      const { timeSeriesData: newTimeSeriesData, alertsData: newAlertsData } = parseCSVData(text, scenarioName)

      console.log(`Parsed ${newTimeSeriesData.length} data points and ${newAlertsData.length} alerts`)

      if (newTimeSeriesData.length === 0) {
        setError(`No data points were extracted from the file for ${scenarioName}. Please check the file format.`)
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
      setError(null)
    } catch (err) {
      console.error("Error processing file:", err)
      setError(`Error processing file: ${err instanceof Error ? err.message : String(err)}`)
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
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <p>{error}</p>
        </div>
      )}

      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Data Upload</h2>
        <p className="mb-4">Upload planning data files for analysis</p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {scenarios.map((scenario) => (
            <div key={scenario.name} className="border rounded p-4">
              <h3 className="font-medium">{scenario.name}</h3>
              <p className="text-sm text-gray-600 mb-2">{scenario.description}</p>

              <div className="flex items-center">
                <input
                  type="file"
                  id={`file-${scenario.name}`}
                  accept=".csv"
                  className="hidden"
                  onChange={(e) => handleFileUpload(e, scenario.name)}
                />
                <label
                  htmlFor={`file-${scenario.name}`}
                  className="cursor-pointer bg-blue-500 hover:bg-blue-600 text-white py-1 px-3 rounded text-sm"
                >
                  {loadedScenarios.includes(scenario.name) ? "Reload" : "Upload"}
                </label>

                {loadedScenarios.includes(scenario.name) && (
                  <span className="ml-2 text-green-600 text-sm">✓ Loaded</span>
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

      {/* Debug Information Section */}
      <div className="mt-8 border rounded p-4 bg-gray-50">
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
    </div>
  )
}
