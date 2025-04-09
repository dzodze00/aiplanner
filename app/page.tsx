"use client"

import { useState, useEffect, useMemo } from "react"
import { parseCSVData } from "@/lib/csv-parser"
import { transformForChart, calculateKPIs, scenarios as allScenarios } from "@/lib/data-utils"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Card, CardContent } from "@/components/ui/card"
import { AlertCircle, BarChart2, LineChart, Download, Settings, Menu, Home, PieChart, FileText } from "lucide-react"
import { TimeSeriesChart } from "@/components/time-series-chart"
import { KPICards } from "@/components/kpi-cards"
import { ScenarioComparison } from "@/components/scenario-comparison"
import { FileUploader } from "@/components/file-uploader"

export default function Dashboard() {
  // State
  const [timeSeriesData, setTimeSeriesData] = useState<any[]>([])
  const [alertsData, setAlertsData] = useState<any[]>([])
  const [loadedScenarios, setLoadedScenarios] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState<boolean>(false)
  const [activeView, setActiveView] = useState<string>("overview")
  const [selectedCategory, setSelectedCategory] = useState<string>("Fill Rate")
  const [selectedScenarios, setSelectedScenarios] = useState<string[]>([])
  const [showUploader, setShowUploader] = useState<boolean>(true)
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(true)

  // Derived state
  const categories = useMemo(() => {
    return Array.from(new Set(timeSeriesData.map((d) => d.category)))
      .filter((cat) => cat) // Filter out empty categories
      .sort()
  }, [timeSeriesData])

  // Filter data based on selections
  const filteredData = useMemo(() => {
    return timeSeriesData.filter(
      (d) =>
        d.week !== "0" && // Filter out week 0
        (selectedScenarios.length === 0 || selectedScenarios.includes(d.scenario)),
    )
  }, [timeSeriesData, selectedScenarios])

  const chartData = useMemo(() => {
    if (filteredData.length === 0 || !selectedCategory) return []
    return transformForChart(filteredData, selectedCategory)
  }, [filteredData, selectedCategory])

  const kpis = useMemo(() => {
    if (filteredData.length === 0) return {}
    return calculateKPIs(filteredData)
  }, [filteredData])

  // Initialize selected scenarios when data is loaded
  useEffect(() => {
    if (loadedScenarios.length > 0 && selectedScenarios.length === 0) {
      setSelectedScenarios([...loadedScenarios])
    }

    // Set a default category if we have data but no category selected
    if (categories.length > 0 && !categories.includes(selectedCategory)) {
      // Try to find a meaningful default category
      const preferredCategories = ["Fill Rate", "Planned FG Inventory", "Total Demand", "Available Supply"]
      const defaultCategory = preferredCategories.find((cat) => categories.includes(cat)) || categories[0]
      setSelectedCategory(defaultCategory)
    }

    // Hide uploader if we have data
    if (timeSeriesData.length > 0) {
      setShowUploader(false)
    }
  }, [loadedScenarios, selectedScenarios, categories, selectedCategory, timeSeriesData.length])

  // Function to fetch data directly from URLs
  const fetchDataFromUrls = async () => {
    setLoading(true)
    setError(null)

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
          console.log(`Fetching ${scenarioName} data from URL...`)
          const response = await fetch(url)

          if (!response.ok) {
            throw new Error(`Failed to fetch ${scenarioName}: ${response.status} ${response.statusText}`)
          }

          const text = await response.text()
          console.log(`Received ${text.length} bytes for ${scenarioName}`)

          console.log(`Processing ${scenarioName} data...`)
          const { timeSeriesData: scenarioData, alertsData: scenarioAlerts } = parseCSVData(text, scenarioName)

          console.log(
            `Parsed ${scenarioData.length} data points and ${scenarioAlerts.length} alerts for ${scenarioName}`,
          )

          if (scenarioData.length > 0) {
            newTimeSeriesData.push(...scenarioData)
            newAlertsData.push(...scenarioAlerts)
            successfulScenarios.push(scenarioName)
          } else {
            errors.push(`No data points were extracted from the file for ${scenarioName}`)
          }
        } catch (err) {
          console.error(`Error processing ${scenarioName}:`, err)
          errors.push(`Error processing ${scenarioName}: ${err instanceof Error ? err.message : String(err)}`)
        }
      }

      // Update state with all the new data
      setTimeSeriesData(newTimeSeriesData)
      setAlertsData(newAlertsData)
      setLoadedScenarios(successfulScenarios)
      setSelectedScenarios(successfulScenarios)

      if (errors.length > 0) {
        setError(errors.join("\n"))
      }

      console.log("Finished loading scenarios from URLs")

      // Hide uploader after successful load
      if (newTimeSeriesData.length > 0) {
        setShowUploader(false)
      }
    } catch (err) {
      console.error("Error fetching data from URLs:", err)
      setError(`Error fetching data: ${err instanceof Error ? err.message : String(err)}`)
    } finally {
      setLoading(false)
    }
  }

  const handleDataLoaded = (scenarioName: string, newTimeSeriesData: any[], newAlertsData: any[]) => {
    // Update time series data
    setTimeSeriesData((prev) => {
      const filtered = prev.filter((d) => d.scenario !== scenarioName)
      return [...filtered, ...newTimeSeriesData]
    })

    // Update alerts data
    setAlertsData((prev) => {
      const filtered = prev.filter((d) => d.scenario !== scenarioName)
      return [...filtered, ...newAlertsData]
    })

    // Update loaded scenarios
    if (!loadedScenarios.includes(scenarioName)) {
      setLoadedScenarios((prev) => {
        const newScenarios = [...prev, scenarioName]
        setSelectedScenarios(newScenarios) // Auto-select newly loaded scenarios
        return newScenarios
      })
    }
  }

  const renderContent = () => {
    if (showUploader || timeSeriesData.length === 0) {
      return (
        <div className="p-6">
          <FileUploader
            onDataLoaded={handleDataLoaded}
            loadedScenarios={loadedScenarios}
            onLoadAll={fetchDataFromUrls}
            loading={loading}
          />
        </div>
      )
    }

    switch (activeView) {
      case "overview":
        return (
          <div className="p-6 space-y-6">
            <div className="flex justify-between items-center">
              <h1 className="text-2xl font-bold">Dashboard Overview</h1>
              <div className="flex space-x-2">
                <Button variant="outline" size="sm" onClick={() => setShowUploader(true)}>
                  Upload More Data
                </Button>
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="overflow-hidden">
                <CardContent className="p-0">
                  <div className="p-4 bg-blue-50 border-b">
                    <h2 className="text-lg font-semibold">Scenario Status</h2>
                  </div>
                  <div className="p-4">
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {allScenarios.map((scenario) => {
                        const isLoaded = loadedScenarios.includes(scenario.name)
                        return (
                          <div key={scenario.name} className="flex items-center space-x-2">
                            <div
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: isLoaded ? scenario.color : "#e2e8f0" }}
                            ></div>
                            <span className={`text-sm ${isLoaded ? "font-medium" : "text-gray-500"}`}>
                              {scenario.name} {isLoaded ? "✓" : ""}
                            </span>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="overflow-hidden">
                <CardContent className="p-0">
                  <div className="p-4 bg-blue-50 border-b">
                    <h2 className="text-lg font-semibold">Category Selection</h2>
                  </div>
                  <div className="p-4">
                    <select
                      className="w-full p-2 border rounded"
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                    >
                      {categories.map((category) => (
                        <option key={category} value={category}>
                          {category}
                        </option>
                      ))}
                    </select>
                    <div className="mt-2 text-sm text-gray-500">
                      {categories.length} categories available for analysis
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <KPICards kpis={kpis} selectedScenarios={selectedScenarios} />

            <Card className="overflow-hidden">
              <CardContent className="p-0">
                <div className="p-4 bg-blue-50 border-b">
                  <h2 className="text-lg font-semibold">Time Series Analysis: {selectedCategory}</h2>
                </div>
                <div className="p-4 h-[400px]">
                  <TimeSeriesChart data={chartData} selectedScenarios={selectedScenarios} />
                </div>
              </CardContent>
            </Card>
          </div>
        )

      case "timeSeries":
        return (
          <div className="p-6 space-y-6">
            <div className="flex justify-between items-center">
              <h1 className="text-2xl font-bold">Time Series Analysis</h1>
              <div className="flex space-x-2">
                <select
                  className="p-2 border rounded"
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                >
                  {categories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <Card className="overflow-hidden">
              <CardContent className="p-0">
                <div className="p-4 bg-blue-50 border-b">
                  <h2 className="text-lg font-semibold">{selectedCategory}</h2>
                </div>
                <div className="p-4 h-[500px]">
                  <TimeSeriesChart data={chartData} selectedScenarios={selectedScenarios} yAxisLabel="Value" />
                </div>
              </CardContent>
            </Card>

            <div className="bg-gray-50 p-4 rounded-lg border">
              <h3 className="font-medium mb-2">Scenario Selection</h3>
              <div className="flex flex-wrap gap-3">
                {allScenarios.map((scenario) => (
                  <label key={scenario.name} className="flex items-center space-x-2 bg-white p-2 rounded border">
                    <input
                      type="checkbox"
                      checked={selectedScenarios.includes(scenario.name)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedScenarios([...selectedScenarios, scenario.name])
                        } else {
                          setSelectedScenarios(selectedScenarios.filter((s) => s !== scenario.name))
                        }
                      }}
                      className="rounded"
                    />
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: scenario.color }}></div>
                    <span className="text-sm">
                      {scenario.name} - {scenario.description}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        )

      case "comparison":
        return (
          <div className="p-6 space-y-6">
            <div className="flex justify-between items-center">
              <h1 className="text-2xl font-bold">Scenario Comparison</h1>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>

            <Card className="overflow-hidden">
              <CardContent className="p-0">
                <div className="p-4 bg-blue-50 border-b">
                  <h2 className="text-lg font-semibold">Key Performance Indicators</h2>
                </div>
                <div className="p-4 h-[500px]">
                  <ScenarioComparison
                    data={kpis}
                    selectedScenarios={selectedScenarios}
                    selectedMetrics={Object.keys(kpis).slice(0, 5)}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        )

      case "rawData":
        return (
          <div className="p-6 space-y-6">
            <div className="flex justify-between items-center">
              <h1 className="text-2xl font-bold">Raw Data</h1>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
            </div>

            <Card className="overflow-hidden">
              <CardContent className="p-0">
                <div className="rounded-md overflow-auto max-h-[600px]">
                  <table className="w-full">
                    <thead className="bg-gray-50 sticky top-0">
                      <tr className="border-b">
                        <th className="p-3 text-left font-medium">Category</th>
                        <th className="p-3 text-left font-medium">Scenario</th>
                        <th className="p-3 text-left font-medium">Week</th>
                        <th className="p-3 text-right font-medium">Value</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredData.slice(0, 100).map((item, index) => (
                        <tr key={index} className="border-b hover:bg-gray-50">
                          <td className="p-3">{item.category}</td>
                          <td className="p-3">
                            <div className="flex items-center">
                              <div
                                className="w-2 h-2 rounded-full mr-2"
                                style={{
                                  backgroundColor: allScenarios.find((s) => s.name === item.scenario)?.color || "#ccc",
                                }}
                              ></div>
                              {item.scenario}
                            </div>
                          </td>
                          <td className="p-3">{item.week}</td>
                          <td className="p-3 text-right font-mono">{item.value.toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {filteredData.length > 100 && (
                    <div className="p-3 text-center text-sm text-gray-500 bg-gray-50 border-t">
                      Showing 100 of {filteredData.length} rows
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Simplified Sidebar */}
      <div
        className={`bg-white border-r w-64 h-screen fixed top-0 left-0 z-50 transform transition-transform duration-300 ease-in-out ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} md:translate-x-0`}
      >
        <div className="border-b p-4">
          <div className="flex items-center space-x-2">
            <BarChart2 className="h-6 w-6 text-blue-600" />
            <div>
              <h1 className="font-bold">DCM Dashboard</h1>
              <p className="text-xs text-gray-500">Supply Chain Analysis</p>
            </div>
          </div>
        </div>

        <div className="p-4">
          <ul className="space-y-2">
            <li>
              <button
                onClick={() => setActiveView("overview")}
                className={`flex items-center w-full p-2 rounded-md ${activeView === "overview" ? "bg-blue-50 text-blue-600" : "hover:bg-gray-100"}`}
              >
                <Home className="h-5 w-5 mr-3" />
                <span>Overview</span>
              </button>
            </li>
            <li>
              <button
                onClick={() => setActiveView("timeSeries")}
                className={`flex items-center w-full p-2 rounded-md ${activeView === "timeSeries" ? "bg-blue-50 text-blue-600" : "hover:bg-gray-100"}`}
              >
                <LineChart className="h-5 w-5 mr-3" />
                <span>Time Series</span>
              </button>
            </li>
            <li>
              <button
                onClick={() => setActiveView("comparison")}
                className={`flex items-center w-full p-2 rounded-md ${activeView === "comparison" ? "bg-blue-50 text-blue-600" : "hover:bg-gray-100"}`}
              >
                <PieChart className="h-5 w-5 mr-3" />
                <span>Comparison</span>
              </button>
            </li>
            <li>
              <button
                onClick={() => setActiveView("rawData")}
                className={`flex items-center w-full p-2 rounded-md ${activeView === "rawData" ? "bg-blue-50 text-blue-600" : "hover:bg-gray-100"}`}
              >
                <FileText className="h-5 w-5 mr-3" />
                <span>Raw Data</span>
              </button>
            </li>
          </ul>
        </div>

        <div className="border-t p-4 absolute bottom-0 w-full">
          <div className="text-xs text-gray-500">
            <div className="font-medium mb-1">Loaded Scenarios:</div>
            <div className="flex flex-wrap gap-1">
              {loadedScenarios.map((scenario) => (
                <span
                  key={scenario}
                  className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-50 text-blue-700"
                >
                  <span
                    className="w-2 h-2 rounded-full mr-1"
                    style={{ backgroundColor: allScenarios.find((s) => s.name === scenario)?.color || "#ccc" }}
                  ></span>
                  {scenario}
                </span>
              ))}
              {loadedScenarios.length === 0 && <span className="text-gray-400">None</span>}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className={`flex-1 ${sidebarOpen ? "md:ml-64" : ""}`}>
        <header className="bg-white border-b p-4 flex items-center justify-between">
          <div className="flex items-center">
            <button className="mr-4 md:hidden" onClick={() => setSidebarOpen(!sidebarOpen)}>
              <Menu className="h-5 w-5" />
            </button>
            <h1 className="text-xl font-bold">Detroit Cathode Manufacturing</h1>
          </div>

          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" onClick={() => setShowUploader(!showUploader)}>
              {showUploader ? "Hide Uploader" : "Upload Data"}
            </Button>
            <Button variant="outline" size="sm">
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </header>

        {error && (
          <Alert variant="destructive" className="m-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {error.split("\n").map((line, i) => (
                <div key={i}>{line}</div>
              ))}
            </AlertDescription>
          </Alert>
        )}

        {renderContent()}
      </div>
    </div>
  )
}
