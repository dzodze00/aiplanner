"use client"

import { useState, useEffect, useMemo } from "react"
import { parseCSVData } from "@/lib/csv-parser"
import { transformForChart, calculateKPIs, scenarios as allScenarios } from "@/lib/data-utils"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle, BarChart2, LineChart, Download, Settings, Home, PieChart, FileText, Upload } from "lucide-react"
import { TimeSeriesChart } from "@/components/time-series-chart"
import { KPICards } from "@/components/kpi-cards"
import { ScenarioComparison } from "@/components/scenario-comparison"
import { FileUploader } from "@/components/file-uploader"
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarSeparator,
  SidebarTrigger,
} from "@/components/ui/sidebar"

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
        <div className="p-6 fade-in">
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
          <div className="p-6 space-y-6 fade-in">
            <div className="flex justify-between items-center">
              <h1 className="text-2xl font-bold">Dashboard Overview</h1>
              <div className="flex space-x-2">
                <Button variant="outline" size="sm" onClick={() => setShowUploader(true)}>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload More Data
                </Button>
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                <CardHeader className="bg-primary/5 pb-3">
                  <CardTitle className="text-lg">Scenario Status</CardTitle>
                </CardHeader>
                <CardContent className="pt-4">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {allScenarios.map((scenario) => {
                      const isLoaded = loadedScenarios.includes(scenario.name)
                      return (
                        <div key={scenario.name} className="flex items-center space-x-2">
                          <div
                            className={`w-3 h-3 rounded-full ${isLoaded ? "" : "opacity-30"}`}
                            style={{ backgroundColor: scenario.color }}
                          ></div>
                          <span className={`text-sm ${isLoaded ? "font-medium" : "text-muted-foreground"}`}>
                            {scenario.name} {isLoaded ? "✓" : ""}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>

              <Card className="overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                <CardHeader className="bg-primary/5 pb-3">
                  <CardTitle className="text-lg">Category Selection</CardTitle>
                </CardHeader>
                <CardContent className="pt-4">
                  <select
                    className="w-full p-2 border rounded-md focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none"
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                  >
                    {categories.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                  <div className="mt-2 text-sm text-muted-foreground">
                    {categories.length} categories available for analysis
                  </div>
                </CardContent>
              </Card>
            </div>

            <KPICards kpis={kpis} selectedScenarios={selectedScenarios} />

            <Card className="overflow-hidden shadow-sm hover:shadow-md transition-shadow">
              <CardHeader className="bg-primary/5 pb-3">
                <CardTitle className="text-lg">Time Series Analysis: {selectedCategory}</CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="h-[400px]">
                  <TimeSeriesChart data={chartData} selectedScenarios={selectedScenarios} />
                </div>
              </CardContent>
            </Card>
          </div>
        )

      case "timeSeries":
        return (
          <div className="p-6 space-y-6 fade-in">
            <div className="flex justify-between items-center">
              <h1 className="text-2xl font-bold">Time Series Analysis</h1>
              <div className="flex space-x-2">
                <select
                  className="p-2 border rounded-md focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none"
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

            <Card className="overflow-hidden shadow-sm hover:shadow-md transition-shadow">
              <CardHeader className="bg-primary/5 pb-3">
                <CardTitle className="text-lg">{selectedCategory}</CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="h-[500px]">
                  <TimeSeriesChart data={chartData} selectedScenarios={selectedScenarios} yAxisLabel="Value" />
                </div>
              </CardContent>
            </Card>

            <Card className="overflow-hidden shadow-sm hover:shadow-md transition-shadow">
              <CardHeader className="bg-primary/5 pb-3">
                <CardTitle className="text-lg">Scenario Selection</CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="flex flex-wrap gap-3">
                  {allScenarios.map((scenario) => (
                    <label
                      key={scenario.name}
                      className={`flex items-center space-x-2 p-2 rounded-md border cursor-pointer transition-colors ${
                        selectedScenarios.includes(scenario.name)
                          ? "bg-primary/10 border-primary/30"
                          : "bg-background hover:bg-muted/50"
                      }`}
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
                        className="rounded text-primary focus:ring-primary"
                      />
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: scenario.color }}></div>
                      <span className="text-sm">
                        {scenario.name} - {scenario.description}
                      </span>
                    </label>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )

      case "comparison":
        return (
          <div className="p-6 space-y-6 fade-in">
            <div className="flex justify-between items-center">
              <h1 className="text-2xl font-bold">Scenario Comparison</h1>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>

            <Card className="overflow-hidden shadow-sm hover:shadow-md transition-shadow">
              <CardHeader className="bg-primary/5 pb-3">
                <CardTitle className="text-lg">Key Performance Indicators</CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="h-[500px]">
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
          <div className="p-6 space-y-6 fade-in">
            <div className="flex justify-between items-center">
              <h1 className="text-2xl font-bold">Raw Data</h1>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
            </div>

            <Card className="overflow-hidden shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-0">
                <div className="rounded-md overflow-auto max-h-[600px]">
                  <table className="w-full">
                    <thead className="bg-muted sticky top-0">
                      <tr className="border-b">
                        <th className="p-3 text-left font-medium">Category</th>
                        <th className="p-3 text-left font-medium">Scenario</th>
                        <th className="p-3 text-left font-medium">Week</th>
                        <th className="p-3 text-right font-medium">Value</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredData.slice(0, 100).map((item, index) => (
                        <tr key={index} className="border-b hover:bg-muted/50 transition-colors">
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
                    <div className="p-3 text-center text-sm text-muted-foreground bg-muted/50 border-t">
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
    <SidebarProvider defaultOpen={true}>
      <div className="flex min-h-screen bg-muted/30">
        <Sidebar className="border-r border-border/40">
          <SidebarHeader className="border-b border-border/40 p-4">
            <div className="flex items-center space-x-2">
              <BarChart2 className="h-6 w-6 text-primary" />
              <div>
                <h1 className="font-bold text-lg">DCM Dashboard</h1>
                <p className="text-xs text-muted-foreground">Supply Chain Analysis</p>
              </div>
            </div>
          </SidebarHeader>

          <SidebarContent className="px-2 py-4">
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton onClick={() => setActiveView("overview")} isActive={activeView === "overview"}>
                  <Home className="h-5 w-5 mr-3" />
                  <span>Overview</span>
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton onClick={() => setActiveView("timeSeries")} isActive={activeView === "timeSeries"}>
                  <LineChart className="h-5 w-5 mr-3" />
                  <span>Time Series</span>
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton onClick={() => setActiveView("comparison")} isActive={activeView === "comparison"}>
                  <PieChart className="h-5 w-5 mr-3" />
                  <span>Comparison</span>
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton onClick={() => setActiveView("rawData")} isActive={activeView === "rawData"}>
                  <FileText className="h-5 w-5 mr-3" />
                  <span>Raw Data</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>

            <SidebarSeparator className="my-4" />

            <div className="px-3 py-2">
              <h3 className="text-xs font-medium text-muted-foreground mb-3">LOADED SCENARIOS</h3>
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
                  <div className="text-sm text-muted-foreground italic">No scenarios loaded</div>
                )}
              </div>
            </div>
          </SidebarContent>

          <SidebarFooter className="border-t border-border/40 p-4">
            <Button variant="outline" size="sm" className="w-full" onClick={() => setShowUploader(true)}>
              <Upload className="h-4 w-4 mr-2" />
              Upload Data
            </Button>
          </SidebarFooter>
        </Sidebar>

        <div className="flex-1">
          <header className="bg-background border-b border-border/40 p-4 flex items-center justify-between">
            <div className="flex items-center">
              <SidebarTrigger className="mr-4" />
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
    </SidebarProvider>
  )
}
