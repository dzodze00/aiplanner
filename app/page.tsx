"use client"

import { useState, useEffect } from "react"
import { parseCSVData } from "@/lib/csv-parser"
import { transformForChart, calculateKPIs, scenarios } from "@/lib/data-utils"
import { TimeSeriesChart } from "@/components/time-series-chart"
import { KPICards } from "@/components/kpi-cards"
import { FileUploader } from "@/components/file-uploader"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart2, LineChart, PieChart, FileText, Upload, Settings, AlertCircle, Bug } from "lucide-react"

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
  const [debugMode, setDebugMode] = useState<boolean>(false)

  // Derived state
  const categories = Array.from(new Set(timeSeriesData.map((d) => d.category)))
    .filter((cat) => cat) // Filter out empty categories
    .sort()

  // Filter data based on selections
  const filteredData = timeSeriesData.filter(
    (d) => d.week !== "0" && (selectedScenarios.length === 0 || selectedScenarios.includes(d.scenario)),
  )

  // Transform data for chart - with error handling
  let chartData = []
  try {
    chartData = transformForChart(filteredData, selectedCategory)
  } catch (err) {
    console.error("Error transforming chart data:", err)
    // If transformation fails, use empty array
    chartData = []
  }

  // Calculate KPIs - with error handling
  let kpis = {}
  try {
    kpis = calculateKPIs(filteredData)
  } catch (err) {
    console.error("Error calculating KPIs:", err)
    // If calculation fails, use empty object
    kpis = {}
  }

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
      // URLs for the different scenarios - using the latest URLs provided by the user
      const urls = {
        BASE: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/BASE%20-%20Demand%20Supply%20Time%20Series%20-%20105-cdXgN5OEqgBYFpDA0zlWpVFmN6yNeW.csv",
        S1: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/S1%20-%20Demand%20Supply%20Time%20Series%20-%20105-ti549hhfJ3CrEEGybby1EfdB2FELE4.csv",
        S2: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/S2%20-%20Demand%20Supply%20Time%20Series%20-%20105-UndXTzfAfLcvJY9iI0J1tDfikGDwH7.csv",
        S3: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/S3%20-%20Demand%20Supply%20Time%20Series%20-%20105-34XnWGZvbNKyFe1ydnSEyuYr3x8HGk.csv",
        S4: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/S4%20-%20Demand%20Supply%20Time%20Series%20-%20105-fsf7Fa7EjDwec6vuTJjbt7m5rb6I8x.csv",
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
          console.log(`Fetching ${scenarioName} data from URL: ${url}`)

          // Use a timestamp to prevent caching
          const timestamp = new Date().getTime()
          const fetchUrl = `${url}?t=${timestamp}`

          const response = await fetch(fetchUrl, {
            cache: "no-store",
            headers: {
              "Cache-Control": "no-cache, no-store, must-revalidate",
              Pragma: "no-cache",
              Expires: "0",
            },
          })

          if (!response.ok) {
            throw new Error(`Failed to fetch ${scenarioName}: ${response.status} ${response.statusText}`)
          }

          const text = await response.text()
          console.log(`Received ${text.length} bytes for ${scenarioName}`)

          if (text.length < 100) {
            console.warn(`Suspiciously short content for ${scenarioName}:`, text)
            errors.push(`Warning: ${scenarioName} file is suspiciously short (${text.length} bytes)`)
          }

          console.log(`Processing ${scenarioName} data...`)

          // Try raw mode first if debug mode is enabled
          if (debugMode) {
            console.log(`Trying raw mode for ${scenarioName}`)
            const lines = text.split(/\r?\n/).filter((line) => line.trim() !== "")
            const rawData = []

            for (let i = 1; i < lines.length; i++) {
              const row = lines[i].split(",")
              if (row.length < 3) continue

              const category = row[0]?.trim() || ""
              if (!category) continue

              for (let j = 2; j < row.length; j++) {
                const value = Number(row[j].replace(/["'$,]/g, "").trim())
                if (!isNaN(value)) {
                  rawData.push({
                    category,
                    week: `Week ${j - 1}`,
                    value,
                    scenario: scenarioName,
                  })
                }
              }
            }

            if (rawData.length > 0) {
              console.log(`Raw mode extracted ${rawData.length} data points for ${scenarioName}`)
              newTimeSeriesData.push(...rawData)
              successfulScenarios.push(scenarioName)
              continue
            } else {
              console.log("Raw mode failed to extract data, falling back to normal parser")
            }
          }

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

            if (debugMode) {
              console.log(`Debug info for ${scenarioName}:`)
              console.log("First 200 chars:", text.substring(0, 200))
              console.log("Line count:", text.split(/\r?\n/).filter(Boolean).length)
            }
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
    console.log(`Handling loaded data for ${scenarioName}: ${newTimeSeriesData.length} data points`)

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
      const newScenarios = [...loadedScenarios, scenarioName]
      setLoadedScenarios(newScenarios)
      setSelectedScenarios(newScenarios) // Auto-select newly loaded scenarios
    }

    // Hide uploader after successful load
    if (newTimeSeriesData.length > 0) {
      setShowUploader(false)
    }
  }

  // Render the main content based on the active view
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
                  <Upload className="h-4 w-4 mr-2" />
                  Upload More Data
                </Button>
              </div>
            </div>

            <KPICards kpis={kpis} selectedScenarios={selectedScenarios} />

            <Card>
              <CardHeader>
                <CardTitle>Time Series Analysis: {selectedCategory}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[400px]">
                  <TimeSeriesChart data={chartData} selectedScenarios={selectedScenarios} />
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>Category Selection</CardTitle>
                </CardHeader>
                <CardContent>
                  <select
                    className="w-full p-2 border rounded-md"
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                  >
                    {categories.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Scenario Selection</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {scenarios.map((scenario) => (
                      <label
                        key={scenario.name}
                        className="flex items-center space-x-2 p-2 border rounded-md cursor-pointer"
                      >
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
                        />
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: scenario.color }}></div>
                        <span>{scenario.name}</span>
                      </label>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )

      case "timeSeries":
        return (
          <div className="p-6 space-y-6">
            <div className="flex justify-between items-center">
              <h1 className="text-2xl font-bold">Time Series Analysis</h1>
              <select
                className="p-2 border rounded-md"
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

            <Card>
              <CardHeader>
                <CardTitle>{selectedCategory}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[500px]">
                  <TimeSeriesChart data={chartData} selectedScenarios={selectedScenarios} />
                </div>
              </CardContent>
            </Card>
          </div>
        )

      case "comparison":
        return (
          <div className="p-6 space-y-6">
            <h1 className="text-2xl font-bold">Scenario Comparison</h1>
            <KPICards kpis={kpis} selectedScenarios={selectedScenarios} />
          </div>
        )

      case "rawData":
        return (
          <div className="p-6 space-y-6">
            <h1 className="text-2xl font-bold">Raw Data</h1>
            <div className="border rounded-lg overflow-auto max-h-[600px]">
              <table className="w-full">
                <thead className="bg-gray-100 sticky top-0">
                  <tr>
                    <th className="p-3 text-left">Category</th>
                    <th className="p-3 text-left">Scenario</th>
                    <th className="p-3 text-left">Week</th>
                    <th className="p-3 text-right">Value</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredData.slice(0, 100).map((item, index) => (
                    <tr key={index} className="border-t hover:bg-gray-50">
                      <td className="p-3">{item.category}</td>
                      <td className="p-3">
                        <div className="flex items-center">
                          <div
                            className="w-2 h-2 rounded-full mr-2"
                            style={{
                              backgroundColor: scenarios.find((s) => s.name === item.scenario)?.color || "#ccc",
                            }}
                          ></div>
                          {item.scenario}
                        </div>
                      </td>
                      <td className="p-3">{item.week}</td>
                      <td className="p-3 text-right">{item.value.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <div className={`w-64 bg-white border-r ${!sidebarOpen ? "hidden" : ""}`}>
        <div className="p-4 border-b">
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
                className={`flex items-center w-full p-2 rounded-md ${
                  activeView === "overview" ? "bg-blue-50 text-blue-600" : "hover:bg-gray-100"
                }`}
                onClick={() => setActiveView("overview")}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="mr-3"
                >
                  <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                  <polyline points="9 22 9 12 15 12 15 22" />
                </svg>
                <span>Overview</span>
              </button>
            </li>
            <li>
              <button
                className={`flex items-center w-full p-2 rounded-md ${
                  activeView === "timeSeries" ? "bg-blue-50 text-blue-600" : "hover:bg-gray-100"
                }`}
                onClick={() => setActiveView("timeSeries")}
              >
                <LineChart className="h-5 w-5 mr-3" />
                <span>Time Series</span>
              </button>
            </li>
            <li>
              <button
                className={`flex items-center w-full p-2 rounded-md ${
                  activeView === "comparison" ? "bg-blue-50 text-blue-600" : "hover:bg-gray-100"
                }`}
                onClick={() => setActiveView("comparison")}
              >
                <PieChart className="h-5 w-5 mr-3" />
                <span>Comparison</span>
              </button>
            </li>
            <li>
              <button
                className={`flex items-center w-full p-2 rounded-md ${
                  activeView === "rawData" ? "bg-blue-50 text-blue-600" : "hover:bg-gray-100"
                }`}
                onClick={() => setActiveView("rawData")}
              >
                <FileText className="h-5 w-5 mr-3" />
                <span>Raw Data</span>
              </button>
            </li>
          </ul>

          <div className="mt-8">
            <h3 className="text-xs font-medium text-gray-500 mb-3">LOADED SCENARIOS</h3>
            <div className="space-y-2">
              {loadedScenarios.length > 0 ? (
                loadedScenarios.map((scenario) => (
                  <div key={scenario} className="flex items-center space-x-2 text-sm">
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: scenarios.find((s) => s.name === scenario)?.color || "#ccc" }}
                    ></div>
                    <span>{scenario}</span>
                  </div>
                ))
              ) : (
                <div className="text-sm text-gray-500 italic">No scenarios loaded</div>
              )}
            </div>
          </div>
        </div>

        <div className="absolute bottom-0 left-0 w-64 p-4 border-t bg-white">
          <div className="flex flex-col gap-2">
            <button
              className="flex items-center justify-center w-full p-2 border rounded-md hover:bg-gray-50"
              onClick={() => {
                setShowUploader(true)
                // Force re-render of the uploader component
                setTimeSeriesData((prev) => [...prev])
              }}
            >
              <Upload className="h-4 w-4 mr-2" />
              Upload Data
            </button>
            <button
              className="flex items-center justify-center w-full p-2 border rounded-md hover:bg-gray-50"
              onClick={() => setDebugMode(!debugMode)}
            >
              <Bug className="h-4 w-4 mr-2" />
              {debugMode ? "Disable Debug Mode" : "Enable Debug Mode"}
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className={`flex-1 ${!sidebarOpen ? "ml-0" : ""}`}>
        <div className="bg-white border-b p-4 flex items-center justify-between">
          <div className="flex items-center">
            <button className="mr-4" onClick={() => setSidebarOpen(!sidebarOpen)}>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
                <line x1="9" x2="9" y1="3" y2="21" />
              </svg>
            </button>
            <h1 className="text-xl font-bold">Detroit Cathode Manufacturing</h1>
          </div>

          <div className="flex items-center space-x-2">
            <button
              className="flex items-center p-2 border rounded-md hover:bg-gray-50"
              onClick={() => {
                setShowUploader(true)
                // Force re-render of the uploader component
                setTimeSeriesData((prev) => [...prev])
              }}
            >
              {showUploader ? "Hide Uploader" : "Upload Data"}
            </button>
            <button className="p-2 border rounded-md hover:bg-gray-50">
              <Settings className="h-4 w-4" />
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-4 m-6 rounded-md">
            <div className="flex">
              <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0" />
              <div>
                {error.split("\n").map((line, i) => (
                  <div key={i}>{line}</div>
                ))}
              </div>
            </div>
          </div>
        )}

        {renderContent()}
      </div>
    </div>
  )
}
