"use client"

import { useState, useEffect, useMemo } from "react"
import { parseCSVData } from "@/lib/csv-parser"
import { transformForChart, calculateKPIs, categoryGroups, scenarios as allScenarios } from "@/lib/data-utils"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, BarChart2, LineChart, PieChart, Table2, ArrowRight, CheckCircle } from "lucide-react"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { TimeSeriesChart } from "@/components/time-series-chart"
import { KPIDashboard } from "@/components/kpi-dashboard"
import { ScenarioComparison } from "@/components/scenario-comparison"
import { EnhancedFilters } from "@/components/enhanced-filters"
import { DashboardHeader } from "@/components/dashboard-header"
import { FileUploader } from "@/components/file-uploader"

export default function Dashboard() {
  // Upload stage state
  const [isUploadStage, setIsUploadStage] = useState(true)
  const [loadedScenarios, setLoadedScenarios] = useState<string[]>([])
  const [timeSeriesData, setTimeSeriesData] = useState<any[]>([])
  const [alertsData, setAlertsData] = useState<any[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState<boolean>(false)

  // Analysis stage state
  const [activeTab, setActiveTab] = useState<string>("overview")
  const [selectedCategory, setSelectedCategory] = useState<string>("Fill Rate")
  const [selectedScenarios, setSelectedScenarios] = useState<string[]>([])
  const [selectedWeeks, setSelectedWeeks] = useState<string[]>([])
  const [selectedMetrics, setSelectedMetrics] = useState<string[]>([
    "Fill Rate",
    "Inventory Level",
    "Production Orders",
    "Supply vs Demand",
    "Capacity Utilization",
  ])

  // Derived state
  const categories = useMemo(() => {
    return Array.from(new Set(timeSeriesData.map((d) => d.category)))
  }, [timeSeriesData])

  const weeks = useMemo(() => {
    return Array.from(new Set(timeSeriesData.map((d) => d.week))).sort((a, b) => {
      const numA = Number.parseInt(a.replace(/\D/g, ""))
      const numB = Number.parseInt(b.replace(/\D/g, ""))
      return numA - numB
    })
  }, [timeSeriesData])

  // Filter data based on selections
  const filteredData = useMemo(() => {
    return timeSeriesData.filter(
      (d) =>
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

  // Initialize selected scenarios when transitioning to analysis stage
  useEffect(() => {
    if (!isUploadStage && selectedScenarios.length === 0) {
      setSelectedScenarios([...loadedScenarios])
    }
  }, [isUploadStage, loadedScenarios, selectedScenarios])

  // Initialize selected weeks when transitioning to analysis stage
  useEffect(() => {
    if (!isUploadStage && weeks.length > 0 && selectedWeeks.length === 0) {
      setSelectedWeeks([...weeks])
    }
  }, [isUploadStage, weeks, selectedWeeks])

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
      setLoadedScenarios((prev) => [...prev, scenarioName])
    }
  }

  const handleStartAnalysis = () => {
    if (loadedScenarios.length === 0) {
      setError("Please upload at least one scenario file before starting analysis.")
      return
    }

    setIsUploadStage(false)
    setSelectedScenarios(loadedScenarios)
  }

  const handleBackToUpload = () => {
    setIsUploadStage(true)
  }

  return (
    <div className="p-4 max-w-7xl mx-auto">
      <DashboardHeader loadedScenarios={loadedScenarios} />

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

      {isUploadStage ? (
        // Upload Stage
        <div className="space-y-6">
          <FileUploader onDataLoaded={handleDataLoaded} loadedScenarios={loadedScenarios} />

          <Card>
            <CardHeader>
              <CardTitle>Upload Status</CardTitle>
              <CardDescription>
                {loadedScenarios.length === 0
                  ? "Please upload scenario files to begin analysis"
                  : `${loadedScenarios.length} of ${allScenarios.length} scenarios loaded`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                {allScenarios.map((scenario) => {
                  const isLoaded = loadedScenarios.includes(scenario.name)
                  return (
                    <div
                      key={scenario.name}
                      className={`p-4 border rounded-lg flex items-center gap-2 ${
                        isLoaded ? "border-green-200 bg-green-50" : "border-gray-200 bg-gray-50"
                      }`}
                    >
                      {isLoaded ? (
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      ) : (
                        <div className="h-5 w-5 rounded-full border-2 border-gray-300" />
                      )}
                      <div>
                        <p className="font-medium">{scenario.name}</p>
                        <p className="text-xs text-gray-500">{scenario.description}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" onClick={fetchDataFromUrls} disabled={loading}>
                {loading ? "Loading..." : "Load All from URLs"}
              </Button>
              <Button
                onClick={handleStartAnalysis}
                disabled={loadedScenarios.length === 0}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                Start Analysis <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardFooter>
          </Card>
        </div>
      ) : (
        // Analysis Stage
        <>
          <div className="mb-4">
            <Button variant="outline" onClick={handleBackToUpload} className="mb-4">
              Back to Upload
            </Button>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="w-full mb-6">
              <TabsTrigger value="overview" className="flex items-center">
                <BarChart2 className="h-4 w-4 mr-2" />
                Overview
              </TabsTrigger>
              <TabsTrigger value="timeSeries" className="flex items-center">
                <LineChart className="h-4 w-4 mr-2" />
                Time Series
              </TabsTrigger>
              <TabsTrigger value="comparison" className="flex items-center">
                <PieChart className="h-4 w-4 mr-2" />
                Scenario Comparison
              </TabsTrigger>
              <TabsTrigger value="rawData" className="flex items-center">
                <Table2 className="h-4 w-4 mr-2" />
                Raw Data
              </TabsTrigger>
            </TabsList>

            <EnhancedFilters
              categories={categories as string[]}
              selectedCategory={selectedCategory}
              onCategoryChange={setSelectedCategory}
              selectedScenarios={selectedScenarios}
              onScenariosChange={setSelectedScenarios}
              weeks={weeks as string[]}
              selectedWeeks={selectedWeeks}
              onWeeksChange={setSelectedWeeks}
              selectedMetrics={selectedMetrics}
              onMetricsChange={setSelectedMetrics}
              availableMetrics={Object.keys(kpis)}
            />

            <TabsContent value="overview" className="mt-6">
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

                <Card>
                  <CardHeader>
                    <CardTitle>Scenario Comparison</CardTitle>
                    <CardDescription>Comparing key metrics across {selectedScenarios.length} scenarios</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ScenarioComparison
                      data={kpis}
                      selectedScenarios={selectedScenarios}
                      selectedMetrics={selectedMetrics.slice(0, 5)}
                    />
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="timeSeries" className="mt-6">
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                {categoryGroups.slice(0, 4).map((group) => {
                  const category = group.categories.find((c) => categories.includes(c)) || group.categories[0]
                  const categoryData = transformForChart(filteredData, category)

                  return (
                    <Card key={group.name}>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base">{group.name}</CardTitle>
                        <CardDescription className="text-xs">{category}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <TimeSeriesChart data={categoryData} selectedScenarios={selectedScenarios} />
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </TabsContent>

            <TabsContent value="comparison" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Scenario Comparison</CardTitle>
                  <CardDescription>Compare key metrics across different planning scenarios</CardDescription>
                </CardHeader>
                <CardContent>
                  <ScenarioComparison
                    data={kpis}
                    selectedScenarios={selectedScenarios}
                    selectedMetrics={selectedMetrics}
                    title="Key Performance Indicators"
                  />
                </CardContent>
              </Card>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Supply vs Demand</CardTitle>
                    <CardDescription className="text-xs">Comparing supply and demand metrics</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ScenarioComparison
                      data={kpis}
                      selectedScenarios={selectedScenarios}
                      selectedMetrics={["Fill Rate", "Supply/Demand Ratio"].filter((m) =>
                        Object.keys(kpis).includes(m),
                      )}
                    />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Inventory & Production</CardTitle>
                    <CardDescription className="text-xs">Comparing inventory and production metrics</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ScenarioComparison
                      data={kpis}
                      selectedScenarios={selectedScenarios}
                      selectedMetrics={["Inventory Level", "Production Orders"].filter((m) =>
                        Object.keys(kpis).includes(m),
                      )}
                    />
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="rawData" className="mt-6">
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
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  )
}
