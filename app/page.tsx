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

    setDebugInfo(
      JSON.stringify(
        {
          loadedScenarios,
          timeSeriesDataLength: timeSeriesData.length,
          alertsDataLength: alertsData.length,
          categories: Array.from(new Set(timeSeriesData.map((d) => d.category))),
          scenarios: Array.from(new Set(timeSeriesData.map((d) => d.scenario))),
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

      {/* Always show this section for debugging */}
      <div className="mt-8 border rounded p-4 bg-gray-50">
        <h2 className="text-xl font-semibold mb-4">Debug Information</h2>
        <p>Loaded Scenarios: {loadedScenarios.join(", ") || "None"}</p>
        <p>Time Series Data Points: {timeSeriesData.length}</p>
        <p>Alerts Data Points: {alertsData.length}</p>

        {timeSeriesData.length > 0 && (
          <div className="mt-4">
            <h3 className="font-medium mb-2">Sample Data Point:</h3>
            <pre className="bg-gray-100 p-2 rounded overflow-auto text-xs">
              {JSON.stringify(timeSeriesData[0], null, 2)}
            </pre>
          </div>
        )}

        <div className="mt-4">
          <h3 className="font-medium mb-2">Full Debug Info:</h3>
          <pre className="bg-gray-100 p-2 rounded overflow-auto text-xs">{debugInfo}</pre>
        </div>
      </div>

      {timeSeriesData.length > 0 && (
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
            </div>
          </div>

          <div className="mt-6 border rounded p-4">
            <h3 className="font-medium mb-2">Categories</h3>
            <ul className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {Array.from(new Set(timeSeriesData.map((d) => d.category))).map((category) => (
                <li key={category as string} className="text-sm">
                  {category as string}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  )
}
