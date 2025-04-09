"use client"

import { useState } from "react"
import { parseCSVData } from "@/lib/csv-parser"
import { scenarios as allScenarios } from "@/lib/data-utils"
import { BarChart2, LineChart, Settings, Home, PieChart, FileText, Upload } from "lucide-react"

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

  const triggerFileUpload = (scenarioName: string) => {
    const input = document.createElement("input")
    input.type = "file"
    input.accept = ".csv"

    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (!file) return

      try {
        const text = await file.text()
        const { timeSeriesData, alertsData } = parseCSVData(text, scenarioName)

        if (timeSeriesData.length > 0) {
          handleDataLoaded(scenarioName, timeSeriesData, alertsData)
        } else {
          setError(`No data points were extracted from the file for ${scenarioName}`)
        }
      } catch (err) {
        console.error(`Error processing ${scenarioName}:`, err)
        setError(`Error processing ${scenarioName}: ${err instanceof Error ? err.message : String(err)}`)
      }
    }

    input.click()
  }

  return (
    <div className="flex">
      {/* Sidebar */}
      <div className={`dcm-sidebar ${!sidebarOpen ? "hidden" : ""}`}>
        <div className="dcm-sidebar-header">
          <div className="flex items-center space-x-2">
            <BarChart2 className="h-6 w-6 text-blue-600" />
            <div>
              <h1 className="font-bold">DCM Dashboard</h1>
              <p className="text-xs text-gray-500">Supply Chain Analysis</p>
            </div>
          </div>
        </div>

        <div className="dcm-sidebar-content">
          <ul className="space-y-2">
            <li>
              <div
                className={`dcm-nav-item ${activeView === "overview" ? "dcm-nav-item-active" : ""}`}
                onClick={() => setActiveView("overview")}
              >
                <Home className="h-5 w-5 mr-3" />
                <span>Overview</span>
              </div>
            </li>
            <li>
              <div
                className={`dcm-nav-item ${activeView === "timeSeries" ? "dcm-nav-item-active" : ""}`}
                onClick={() => setActiveView("timeSeries")}
              >
                <LineChart className="h-5 w-5 mr-3" />
                <span>Time Series</span>
              </div>
            </li>
            <li>
              <div
                className={`dcm-nav-item ${activeView === "comparison" ? "dcm-nav-item-active" : ""}`}
                onClick={() => setActiveView("comparison")}
              >
                <PieChart className="h-5 w-5 mr-3" />
                <span>Comparison</span>
              </div>
            </li>
            <li>
              <div
                className={`dcm-nav-item ${activeView === "rawData" ? "dcm-nav-item-active" : ""}`}
                onClick={() => setActiveView("rawData")}
              >
                <FileText className="h-5 w-5 mr-3" />
                <span>Raw Data</span>
              </div>
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
                      style={{ backgroundColor: allScenarios.find((s) => s.name === scenario)?.color || "#ccc" }}
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

        <div className="dcm-sidebar-footer">
          <button className="dcm-button dcm-button-outline w-full" onClick={() => setShowUploader(true)}>
            <Upload className="h-4 w-4 mr-2" />
            Upload Data
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className={`dcm-main ${!sidebarOpen ? "ml-0" : ""}`}>
        <div className="dcm-header">
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
            <button className="dcm-button dcm-button-outline" onClick={() => setShowUploader(!showUploader)}>
              {showUploader ? "Hide Uploader" : "Upload Data"}
            </button>
            <button className="dcm-button dcm-button-outline">
              <Settings className="h-4 w-4" />
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-4 m-6 rounded-md">
            <div className="flex">
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
                className="mr-2"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="12" x2="12" y1="8" y2="12" />
                <line x1="12" x2="12.01" y1="16" y2="16" />
              </svg>
              <div>
                {error.split("\n").map((line, i) => (
                  <div key={i}>{line}</div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Uploader */}
        {showUploader && (
          <div className="dcm-uploader-container">
            <div className="dcm-uploader-header">
              <div className="dcm-uploader-icon">
                <Upload className="h-10 w-10 text-blue-600" />
              </div>
              <h2 className="text-3xl font-bold mb-3">Upload Planning Data</h2>
              <p className="text-gray-600 mb-8">
                Upload your scenario files to begin analysis. The dashboard will automatically update as files are
                loaded.
              </p>

              <button className="dcm-button dcm-button-primary" onClick={fetchDataFromUrls} disabled={loading}>
                {loading ? (
                  <>
                    <svg
                      className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Loading All Scenarios...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Load All Scenarios at Once
                  </>
                )}
              </button>

              <div className="text-sm text-gray-500 mt-3">Or upload individual scenario files below</div>
            </div>

            <div className="dcm-uploader-grid">
              {allScenarios.map((scenario) => {
                const isLoaded = loadedScenarios.includes(scenario.name)
                return (
                  <div
                    key={scenario.name}
                    className={`dcm-scenario-card ${isLoaded ? "border-green-300 bg-green-50" : ""}`}
                  >
                    <div className="dcm-scenario-header">
                      <div className="flex items-center">
                        <div
                          className="w-10 h-10 rounded-full mr-3 flex items-center justify-center"
                          style={{ backgroundColor: isLoaded ? `${scenario.color}20` : "#f1f5f9" }}
                        >
                          {isLoaded ? (
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              width="20"
                              height="20"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke={scenario.color}
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                              <polyline points="22 4 12 14.01 9 11.01" />
                            </svg>
                          ) : (
                            <Upload className="w-5 h-5 text-gray-400" />
                          )}
                        </div>
                        <div>
                          <h3 className="font-medium">{scenario.name}</h3>
                          <p className="text-sm text-gray-500">{scenario.description}</p>
                        </div>
                      </div>
                    </div>
                    <div className="dcm-scenario-content">
                      <button
                        className={`dcm-button ${isLoaded ? "dcm-button-outline" : "dcm-button-primary"} w-full`}
                        onClick={() => triggerFileUpload(scenario.name)}
                      >
                        {isLoaded ? (
                          <>
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              width="16"
                              height="16"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              className="mr-2"
                            >
                              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                              <polyline points="22 4 12 14.01 9 11.01" />
                            </svg>
                            Loaded Successfully
                          </>
                        ) : (
                          <>
                            <Upload className="mr-2 h-3 w-3" />
                            Upload CSV
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Dashboard content would go here */}
      </div>
    </div>
  )
}
