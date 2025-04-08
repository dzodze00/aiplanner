"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import ErrorBoundary from "@/components/error-boundary"
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"
import { AlertTriangle, Download } from "lucide-react"
import { FileUploader } from "@/components/file-uploader"
import { DataFilters } from "@/components/data-filters"
import { KPICards } from "@/components/kpi-cards"
import {
  type DataPoint,
  type AlertData,
  scenarios,
  transformForChart,
  transformAlertsForChart,
  calculateKPIs,
} from "@/lib/data-utils"

export default function Dashboard() {
  console.log("Dashboard component rendering")

  const [activeTab, setActiveTab] = useState("overview")
  const [loading, setLoading] = useState(true)

  // Data state
  const [timeSeriesData, setTimeSeriesData] = useState<DataPoint[]>([])
  const [alertsData, setAlertsData] = useState<AlertData[]>([])
  const [loadedScenarios, setLoadedScenarios] = useState<string[]>([])

  // Filter state
  const [categories, setCategories] = useState<string[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string>("")
  const [selectedScenarios, setSelectedScenarios] = useState<string[]>([])
  const [weeks, setWeeks] = useState<string[]>([])
  const [selectedWeeks, setSelectedWeeks] = useState<string[]>([])

  // Derived data
  const [filteredChartData, setFilteredChartData] = useState<any[]>([])
  const [filteredAlertData, setFilteredAlertData] = useState<any[]>([])
  const [kpis, setKpis] = useState<{ [key: string]: { [scenario: string]: number } }>({})

  // Handle data loading
  const handleDataLoaded = (scenarioName: string, newTimeSeriesData: DataPoint[], newAlertsData: AlertData[]) => {
    console.log(`handleDataLoaded called for ${scenarioName} with ${newTimeSeriesData.length} data points`)

    setTimeSeriesData((prev) => {
      // Remove existing data for this scenario
      const filtered = prev.filter((d) => d.scenario !== scenarioName)
      return [...filtered, ...newTimeSeriesData]
    })

    setAlertsData((prev) => {
      // Remove existing data for this scenario
      const filtered = prev.filter((d) => d.scenario !== scenarioName)
      return [...filtered, ...newAlertsData]
    })

    if (!loadedScenarios.includes(scenarioName)) {
      setLoadedScenarios((prev) => [...prev, scenarioName])
    }
  }

  // Update available categories and weeks when data changes
  useEffect(() => {
    console.log("timeSeriesData changed, length:", timeSeriesData.length)

    if (timeSeriesData.length > 0) {
      const uniqueCategories = Array.from(new Set(timeSeriesData.map((d) => d.category)))
      console.log("Unique categories:", uniqueCategories)
      setCategories(uniqueCategories)

      if (!selectedCategory && uniqueCategories.length > 0) {
        // Default to Fill Rate if available, otherwise first category
        const defaultCategory = uniqueCategories.includes("Fill Rate") ? "Fill Rate" : uniqueCategories[0]
        console.log("Setting default category:", defaultCategory)
        setSelectedCategory(defaultCategory)
      }

      const uniqueWeeks = Array.from(new Set(timeSeriesData.map((d) => d.week))).sort()
      console.log("Unique weeks:", uniqueWeeks)
      setWeeks(uniqueWeeks)

      if (selectedWeeks.length === 0 && uniqueWeeks.length > 0) {
        console.log("Setting all weeks as selected")
        setSelectedWeeks(uniqueWeeks)
      }

      // Calculate KPIs
      const calculatedKpis = calculateKPIs(timeSeriesData)
      console.log("Calculated KPIs:", calculatedKpis)
      setKpis(calculatedKpis)

      setLoading(false)
    }
  }, [timeSeriesData])

  // Update selected scenarios when loaded scenarios change
  useEffect(() => {
    console.log("loadedScenarios changed:", loadedScenarios)

    if (loadedScenarios.length > 0 && selectedScenarios.length === 0) {
      console.log("Setting all loaded scenarios as selected")
      setSelectedScenarios(loadedScenarios)
    }
  }, [loadedScenarios])

  // Update filtered data when filters change
  useEffect(() => {
    console.log("Filters changed:", { selectedCategory, selectedScenarios, selectedWeeks })

    if (selectedCategory && selectedScenarios.length > 0 && selectedWeeks.length > 0) {
      // Filter time series data
      const filteredData = timeSeriesData.filter(
        (d) =>
          d.category === selectedCategory && selectedScenarios.includes(d.scenario) && selectedWeeks.includes(d.week),
      )

      console.log(`Filtered data: ${filteredData.length} points`)
      const chartData = transformForChart(filteredData, selectedCategory)
      console.log("Chart data:", chartData)
      setFilteredChartData(chartData)

      // Filter alerts data
      const filteredAlerts = alertsData.filter((d) => selectedScenarios.includes(d.scenario))
      console.log(`Filtered alerts: ${filteredAlerts.length} alerts`)
      const alertChartData = transformAlertsForChart(filteredAlerts)
      console.log("Alert chart data:", alertChartData)
      setFilteredAlertData(alertChartData)
    }
  }, [selectedCategory, selectedScenarios, selectedWeeks, timeSeriesData, alertsData])

  // Export data as CSV
  const exportData = () => {
    if (timeSeriesData.length === 0) return

    let csv = "Category,Week,Value,Scenario\n"

    timeSeriesData.forEach((d) => {
      csv += `${d.category},${d.week},${d.value},${d.scenario}\n`
    })

    const blob = new Blob([csv], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.setAttribute("hidden", "")
    a.setAttribute("href", url)
    a.setAttribute("download", "dcm_data_export.csv")
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }

  const getScenarioColor = (scenarioName: string) => {
    const scenario = scenarios.find((s) => s.name === scenarioName)
    return scenario ? scenario.color : "#cccccc"
  }

  if (loading && loadedScenarios.length === 0) {
    return (
      <div className="flex flex-col min-h-screen bg-gray-50 p-6">
        <header className="bg-white border-b px-6 py-4 rounded-lg mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Detroit Cathode Manufacturing</h1>
              <p className="text-gray-500">S&OP Planning Dashboard</p>
            </div>
          </div>
        </header>

        <ErrorBoundary>
          <FileUploader onDataLoaded={handleDataLoaded} loadedScenarios={loadedScenarios} />
        </ErrorBoundary>

        <div className="mt-8 text-center text-gray-500">
          <p>Upload planning data files to begin analysis</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <header className="bg-white border-b px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Detroit Cathode Manufacturing</h1>
            <p className="text-gray-500">S&OP Planning Dashboard</p>
          </div>
          <div className="flex items-center gap-4">
            <Badge variant="outline" className="px-3 py-1">
              Plant: P103
            </Badge>
            <Badge variant="outline" className="px-3 py-1">
              11-Week Plan
            </Badge>
            <Button variant="outline" size="sm" onClick={exportData}>
              <Download className="w-4 h-4 mr-2" />
              Export Data
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1 p-6 space-y-6">
        <ErrorBoundary>
          <FileUploader onDataLoaded={handleDataLoaded} loadedScenarios={loadedScenarios} />
        </ErrorBoundary>

        {timeSeriesData.length > 0 && (
          <ErrorBoundary>
            <>
              <DataFilters
                categories={categories}
                selectedCategory={selectedCategory}
                onCategoryChange={setSelectedCategory}
                selectedScenarios={selectedScenarios}
                onScenariosChange={setSelectedScenarios}
                weeks={weeks}
                selectedWeeks={selectedWeeks}
                onWeeksChange={setSelectedWeeks}
              />

              <KPICards kpis={kpis} selectedScenarios={selectedScenarios} />

              <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                <TabsList>
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="time-series">Time Series Analysis</TabsTrigger>
                  <TabsTrigger value="alerts">Alerts Analysis</TabsTrigger>
                  <TabsTrigger value="scenarios">Scenario Comparison</TabsTrigger>
                  <TabsTrigger value="process">Process Info</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Card>
                      <CardHeader>
                        <CardTitle>{selectedCategory} Comparison</CardTitle>
                        <CardDescription>Comparing scenarios across selected time periods</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="h-80">
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={filteredChartData}>
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis dataKey="week" />
                              <YAxis />
                              <Tooltip />
                              <Legend />
                              {selectedScenarios.map((scenario) => (
                                <Line
                                  key={scenario}
                                  type="monotone"
                                  dataKey={scenario}
                                  name={scenario}
                                  stroke={getScenarioColor(scenario)}
                                  strokeWidth={scenario === "S4" ? 2 : 1}
                                />
                              ))}
                            </LineChart>
                          </ResponsiveContainer>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle>Alert Breakdown</CardTitle>
                        <CardDescription>Comparing alerts across scenarios</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="h-80">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={filteredAlertData}>
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis dataKey="name" />
                              <YAxis />
                              <Tooltip />
                              <Legend />
                              {selectedScenarios.map((scenario) => (
                                <Bar
                                  key={scenario}
                                  dataKey={scenario}
                                  name={scenario}
                                  fill={getScenarioColor(scenario)}
                                />
                              ))}
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Planning Insights</AlertTitle>
                    <AlertDescription>
                      {loadedScenarios.includes("S4") && loadedScenarios.includes("BASE") ? (
                        <>
                          The S4 scenario (Fine-tuned Solution) shows significant improvements over the Base Plan,
                          reducing Critical Alerts by 93.8% and improving Fill Rate by 17.4%. This was achieved by
                          expediting purchase orders, adjusting sales orders, increasing capacities, and optimizing
                          material purchases.
                        </>
                      ) : (
                        <>Upload more scenario data to see comparative planning insights and recommendations.</>
                      )}
                    </AlertDescription>
                  </Alert>
                </TabsContent>

                {/* Other TabsContent sections remain the same */}
              </Tabs>
            </>
          </ErrorBoundary>
        )}
      </main>

      <footer className="bg-white border-t px-6 py-4">
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">
            Detroit Cathode Manufacturing S&OP Dashboard | Last Updated: {new Date().toLocaleDateString()}
          </p>
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm">
              Help
            </Button>
            <Button variant="ghost" size="sm">
              Settings
            </Button>
          </div>
        </div>
      </footer>
    </div>
  )
}
