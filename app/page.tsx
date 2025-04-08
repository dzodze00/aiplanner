"use client"

import { useState, useEffect, useMemo } from "react"
import { parseCSVData } from "@/lib/csv-parser"
import { transformForChart, calculateKPIs, scenarios as allScenarios } from "@/lib/data-utils"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, BarChart2, LineChart, Clock, Table2, Download, Settings, Info } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { TimeSeriesChart } from "@/components/time-series-chart"
import { KPIDashboard } from "@/components/kpi-dashboard"
import { ScenarioComparison } from "@/components/scenario-comparison"
import { FileUploader } from "@/components/file-uploader"

export default function Dashboard() {
  // State
  const [timeSeriesData, setTimeSeriesData] = useState<any[]>([])
  const [alertsData, setAlertsData] = useState<any[]>([])
  const [loadedScenarios, setLoadedScenarios] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState<boolean>(false)
  const [activeTab, setActiveTab] = useState<string>("overview")
  const [selectedCategory, setSelectedCategory] = useState<string>("Fill Rate")
  const [selectedScenarios, setSelectedScenarios] = useState<string[]>([])
  const [selectedWeeks, setSelectedWeeks] = useState<string[]>([])

  // Derived state
  const categories = useMemo(() => {
    return Array.from(new Set(timeSeriesData.map((d) => d.category)))
  }, [timeSeriesData])

  const weeks = useMemo(() => {
    return Array.from(new Set(timeSeriesData.map((d) => d.week)))
      .filter((week) => week !== "0") // Filter out week 0
      .sort((a, b) => {
        const numA = Number.parseInt(a.replace(/\D/g, ""))
        const numB = Number.parseInt(b.replace(/\D/g, ""))
        return numA - numB
      })
  }, [timeSeriesData])

  // Filter data based on selections
  const filteredData = useMemo(() => {
    return timeSeriesData.filter(
      (d) =>
        d.week !== "0" && // Filter out week 0
        (selectedScenarios.length === 0 || selectedScenarios.includes(d.scenario)) &&
        (selectedWeeks.length === 0 || selectedWeeks.includes(d.week)),
    )
  }, [timeSeriesData, selectedScenarios, selectedWeeks])

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
  }, [loadedScenarios, selectedScenarios])

  // Initialize selected weeks when data is loaded
  useEffect(() => {
    if (weeks.length > 0 && selectedWeeks.length === 0) {
      setSelectedWeeks([...weeks])
    }
  }, [weeks, selectedWeeks])

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

  return (
    <div className="p-4 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Detroit Cathode Manufacturing</h1>
          <p className="text-gray-500">S&OP Planning Dashboard</p>
        </div>
        <div className="flex items-center space-x-2 mt-4 md:mt-0">
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button variant="outline" size="sm">
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Button>
          <Button variant="outline" size="sm">
            <Info className="h-4 w-4 mr-2" />
            Info
          </Button>
        </div>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {error.split("\n").map((line, i) => (
              <div key={i}>{line}</div>
            ))}
          </AlertDescription>
        </Alert>
      )}

      {/* File Uploader */}
      <FileUploader
        onDataLoaded={handleDataLoaded}
        loadedScenarios={loadedScenarios}
        onLoadAll={fetchDataFromUrls}
        loading={loading}
      />

      {/* Only show dashboard if we have data */}
      {timeSeriesData.length > 0 && (
        <>
          {/* Tab Navigation */}
          <div className="flex mb-6 border-b mt-8">
            <Button
              variant={activeTab === "overview" ? "default" : "ghost"}
              onClick={() => setActiveTab("overview")}
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary"
              data-state={activeTab === "overview" ? "active" : "inactive"}
            >
              <BarChart2 className="h-4 w-4 mr-2" />
              Overview
            </Button>
            <Button
              variant={activeTab === "timeSeries" ? "default" : "ghost"}
              onClick={() => setActiveTab("timeSeries")}
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary"
              data-state={activeTab === "timeSeries" ? "active" : "inactive"}
            >
              <LineChart className="h-4 w-4 mr-2" />
              Time Series
            </Button>
            <Button
              variant={activeTab === "scenarioComparison" ? "default" : "ghost"}
              onClick={() => setActiveTab("scenarioComparison")}
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary"
              data-state={activeTab === "scenarioComparison" ? "active" : "inactive"}
            >
              <Clock className="h-4 w-4 mr-2" />
              Scenario Comparison
            </Button>
            <Button
              variant={activeTab === "rawData" ? "default" : "ghost"}
              onClick={() => setActiveTab("rawData")}
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary"
              data-state={activeTab === "rawData" ? "active" : "inactive"}
            >
              <Table2 className="h-4 w-4 mr-2" />
              Raw Data
            </Button>
          </div>

          {/* Dashboard Filters */}
          <Card className="mb-6">
            <CardHeader className="pb-2">
              <CardTitle>Dashboard Filters</CardTitle>
              <CardDescription>Customize your view of the supply chain data</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-4">
                {/* Category Filter */}
                <div className="w-full md:w-auto">
                  <label className="block text-sm font-medium mb-1">Time Series Category</label>
                  <select
                    className="w-full md:w-64 p-2 border rounded"
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

                {/* Scenario Filter */}
                <div className="w-full md:w-auto">
                  <label className="block text-sm font-medium mb-1">Scenarios</label>
                  <div className="flex flex-wrap gap-2">
                    {allScenarios.map((scenario) => (
                      <label key={scenario.name} className="flex items-center space-x-2 mr-4">
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
                        <span className="text-sm">{scenario.name}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Content based on active tab */}
          {activeTab === "overview" && (
            <div className="space-y-6">
              <KPIDashboard kpis={kpis} selectedScenarios={selectedScenarios} />

              <Card>
                <CardHeader>
                  <CardTitle>Time Series Analysis</CardTitle>
                  <CardDescription>
                    Analyzing {selectedCategory} across {selectedScenarios.length} scenarios
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <TimeSeriesChart data={chartData} selectedScenarios={selectedScenarios} title={selectedCategory} />
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === "timeSeries" && (
            <Card>
              <CardHeader>
                <CardTitle>Time Series Analysis</CardTitle>
                <CardDescription>Detailed time series analysis for {selectedCategory}</CardDescription>
              </CardHeader>
              <CardContent>
                <TimeSeriesChart
                  data={chartData}
                  selectedScenarios={selectedScenarios}
                  title={selectedCategory}
                  yAxisLabel="Value"
                />
              </CardContent>
            </Card>
          )}

          {activeTab === "scenarioComparison" && (
            <Card>
              <CardHeader>
                <CardTitle>Scenario Comparison</CardTitle>
                <CardDescription>Compare key metrics across different planning scenarios</CardDescription>
              </CardHeader>
              <CardContent>
                <ScenarioComparison
                  data={kpis}
                  selectedScenarios={selectedScenarios}
                  selectedMetrics={Object.keys(kpis).slice(0, 5)}
                  title="Key Performance Indicators"
                />
              </CardContent>
            </Card>
          )}

          {activeTab === "rawData" && (
            <Card>
              <CardHeader>
                <CardTitle>Raw Data</CardTitle>
                <CardDescription>View the raw data points for the selected filters</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border overflow-auto max-h-[500px]">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="p-2 text-left font-medium">Category</th>
                        <th className="p-2 text-left font-medium">Scenario</th>
                        <th className="p-2 text-left font-medium">Week</th>
                        <th className="p-2 text-right font-medium">Value</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredData.slice(0, 100).map((item, index) => (
                        <tr key={index} className="border-b hover:bg-gray-50">
                          <td className="p-2">{item.category}</td>
                          <td className="p-2">{item.scenario}</td>
                          <td className="p-2">{item.week}</td>
                          <td className="p-2 text-right">{item.value.toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {filteredData.length > 100 && (
                    <div className="p-2 text-center text-sm text-gray-500">
                      Showing 100 of {filteredData.length} rows
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  )
}
