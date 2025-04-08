"use client"

import type React from "react"

import { useState, useEffect, useMemo } from "react"
import { parseCSVData } from "@/lib/csv-parser"
import { scenarios, transformForChart, calculateKPIs } from "@/lib/data-utils"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, BarChart2, PieChart, Table2, Sliders, Lightbulb } from "lucide-react"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { TimeSeriesChart } from "@/components/time-series-chart"
import { KPIDashboard } from "@/components/kpi-dashboard"
import { ScenarioComparison } from "@/components/scenario-comparison"
import { EnhancedFilters } from "@/components/enhanced-filters"
import { DashboardHeader } from "@/components/dashboard-header"
import { DataSlicer } from "@/components/data-slicer"
import { PivotTable } from "@/components/pivot-table"
import { DataTable } from "@/components/data-table"
import { DataInsights } from "@/components/data-insights"

export default function Dashboard() {
  const [loadedScenarios, setLoadedScenarios] = useState<string[]>([])
  const [timeSeriesData, setTimeSeriesData] = useState<any[]>([])
  const [filteredData, setFilteredData] = useState<any[]>([])
  const [alertsData, setAlertsData] = useState<any[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState<boolean>(false)
  const [processingStatus, setProcessingStatus] = useState<Record<string, string>>({})
  const [rawCsvData, setRawCsvData] = useState<Record<string, string>>({})
  const [activeTab, setActiveTab] = useState<string>("overview")
  const [selectedCategory, setSelectedCategory] = useState<string>("Fill Rate")
  const [selectedScenarios, setSelectedScenarios] = useState<string[]>(scenarios.map((s) => s.name))
  const [selectedWeeks, setSelectedWeeks] = useState<string[]>([])
  const [selectedMetrics, setSelectedMetrics] = useState<string[]>([
    "Fill Rate",
    "Inventory Level",
    "Production Orders",
    "Supply vs Demand",
    "Capacity Utilization",
  ])
  const [analysisTab, setAnalysisTab] = useState<string>("slice")

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

  const chartData = useMemo(() => {
    if (filteredData.length === 0 || !selectedCategory) return []
    return transformForChart(filteredData, selectedCategory)
  }, [filteredData, selectedCategory])

  const kpis = useMemo(() => {
    if (filteredData.length === 0) return {}
    return calculateKPIs(filteredData)
  }, [filteredData])

  // Initialize filtered data when time series data changes
  useEffect(() => {
    setFilteredData(timeSeriesData)
  }, [timeSeriesData])

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

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>, scenarioName: string) => {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      setProcessingStatus((prev) => ({ ...prev, [scenarioName]: "Processing..." }))
      console.log(`Processing file for ${scenarioName}:`, file.name)
      const text = await file.text()

      // Store the raw CSV data for inspection
      setRawCsvData((prev) => ({ ...prev, [scenarioName]: text }))

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

      {timeSeriesData.length === 0 ? (
        <div className="mb-6">
          <Card>
            <CardHeader>
              <CardTitle>Data Upload</CardTitle>
              <CardDescription>Upload planning data files for analysis</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <Button
                  onClick={fetchDataFromUrls}
                  disabled={loading}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
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
            </CardContent>
          </Card>
        </div>
      ) : (
        <>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="w-full mb-6">
              <TabsTrigger value="overview" className="flex items-center">
                <BarChart2 className="h-4 w-4 mr-2" />
                Overview
              </TabsTrigger>
              <TabsTrigger value="analysis" className="flex items-center">
                <Sliders className="h-4 w-4 mr-2" />
                Data Analysis
              </TabsTrigger>
              <TabsTrigger value="insights" className="flex items-center">
                <Lightbulb className="h-4 w-4 mr-2" />
                Insights
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="mt-0">
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

              <div className="space-y-6 mt-6">
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

            <TabsContent value="analysis" className="mt-0">
              <Tabs value={analysisTab} onValueChange={setAnalysisTab}>
                <TabsList className="w-full mb-6">
                  <TabsTrigger value="slice" className="flex items-center">
                    <Sliders className="h-4 w-4 mr-2" />
                    Slice & Dice
                  </TabsTrigger>
                  <TabsTrigger value="pivot" className="flex items-center">
                    <PieChart className="h-4 w-4 mr-2" />
                    Pivot Analysis
                  </TabsTrigger>
                  <TabsTrigger value="table" className="flex items-center">
                    <Table2 className="h-4 w-4 mr-2" />
                    Data Table
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="slice" className="mt-0">
                  <DataSlicer
                    timeSeriesData={timeSeriesData}
                    categories={categories as string[]}
                    onFilteredDataChange={setFilteredData}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base">Filtered Time Series</CardTitle>
                        <CardDescription className="text-xs">
                          {filteredData.length} of {timeSeriesData.length} data points
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <TimeSeriesChart
                          data={chartData}
                          selectedScenarios={selectedScenarios}
                          title={selectedCategory}
                        />
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base">Filtered Metrics</CardTitle>
                        <CardDescription className="text-xs">Key metrics based on filtered data</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <ScenarioComparison
                          data={kpis}
                          selectedScenarios={selectedScenarios}
                          selectedMetrics={selectedMetrics.slice(0, 3)}
                        />
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>

                <TabsContent value="pivot" className="mt-0">
                  <PivotTable data={filteredData} />
                </TabsContent>

                <TabsContent value="table" className="mt-0">
                  <DataTable data={filteredData} />
                </TabsContent>
              </Tabs>
            </TabsContent>

            <TabsContent value="insights" className="mt-0">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2">
                  <DataInsights data={filteredData} kpis={kpis} />
                </div>
                <div>
                  <Card>
                    <CardHeader>
                      <CardTitle>Data Summary</CardTitle>
                      <CardDescription>Overview of your dataset</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div>
                          <h3 className="text-sm font-medium mb-1">Data Points</h3>
                          <p className="text-2xl font-bold">{filteredData.length.toLocaleString()}</p>
                          <p className="text-xs text-gray-500">
                            {((filteredData.length / timeSeriesData.length) * 100).toFixed(1)}% of total data
                          </p>
                        </div>

                        <div>
                          <h3 className="text-sm font-medium mb-1">Categories</h3>
                          <p className="text-2xl font-bold">
                            {Array.from(new Set(filteredData.map((d) => d.category))).length}
                          </p>
                        </div>

                        <div>
                          <h3 className="text-sm font-medium mb-1">Scenarios</h3>
                          <p className="text-2xl font-bold">
                            {Array.from(new Set(filteredData.map((d) => d.scenario))).length}
                          </p>
                        </div>

                        <div>
                          <h3 className="text-sm font-medium mb-1">Time Periods</h3>
                          <p className="text-2xl font-bold">
                            {Array.from(new Set(filteredData.map((d) => d.week))).length}
                          </p>
                        </div>

                        <div className="pt-2 border-t">
                          <h3 className="text-sm font-medium mb-2">Value Distribution</h3>
                          <div className="space-y-1 text-sm">
                            <div className="flex justify-between">
                              <span>Minimum:</span>
                              <span className="font-medium">
                                {Math.min(...filteredData.map((d) => d.value)).toLocaleString()}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span>Maximum:</span>
                              <span className="font-medium">
                                {Math.max(...filteredData.map((d) => d.value)).toLocaleString()}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span>Average:</span>
                              <span className="font-medium">
                                {(
                                  filteredData.reduce((sum, d) => sum + d.value, 0) / filteredData.length
                                ).toLocaleString(undefined, { maximumFractionDigits: 2 })}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  )
}
