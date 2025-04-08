"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
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
    if (timeSeriesData.length > 0) {
      const uniqueCategories = [...new Set(timeSeriesData.map((d) => d.category))]
      setCategories(uniqueCategories)

      if (!selectedCategory && uniqueCategories.length > 0) {
        // Default to Fill Rate if available, otherwise first category
        const defaultCategory = uniqueCategories.includes("Fill Rate") ? "Fill Rate" : uniqueCategories[0]
        setSelectedCategory(defaultCategory)
      }

      const uniqueWeeks = [...new Set(timeSeriesData.map((d) => d.week))].sort()
      setWeeks(uniqueWeeks)

      if (selectedWeeks.length === 0 && uniqueWeeks.length > 0) {
        setSelectedWeeks(uniqueWeeks)
      }

      // Calculate KPIs
      setKpis(calculateKPIs(timeSeriesData))

      setLoading(false)
    }
  }, [timeSeriesData])

  // Update selected scenarios when loaded scenarios change
  useEffect(() => {
    if (loadedScenarios.length > 0 && selectedScenarios.length === 0) {
      setSelectedScenarios(loadedScenarios)
    }
  }, [loadedScenarios])

  // Update filtered data when filters change
  useEffect(() => {
    if (selectedCategory && selectedScenarios.length > 0 && selectedWeeks.length > 0) {
      // Filter time series data
      const filteredData = timeSeriesData.filter(
        (d) =>
          d.category === selectedCategory && selectedScenarios.includes(d.scenario) && selectedWeeks.includes(d.week),
      )

      const chartData = transformForChart(filteredData, selectedCategory)
      setFilteredChartData(chartData)

      // Filter alerts data
      const filteredAlerts = alertsData.filter((d) => selectedScenarios.includes(d.scenario))

      const alertChartData = transformAlertsForChart(filteredAlerts)
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

        <FileUploader onDataLoaded={handleDataLoaded} loadedScenarios={loadedScenarios} />

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
        <FileUploader onDataLoaded={handleDataLoaded} loadedScenarios={loadedScenarios} />

        {timeSeriesData.length > 0 && (
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

              <TabsContent value="time-series" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Time Series Analysis: {selectedCategory}</CardTitle>
                    <CardDescription>Weekly comparison across selected scenarios</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-96">
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

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Weekly Trend Analysis</CardTitle>
                      <CardDescription>Week-over-week changes</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="p-4 bg-gray-50 rounded-lg">
                        {filteredChartData.length > 0 ? (
                          <div className="space-y-4">
                            {selectedScenarios.map((scenario) => {
                              // Calculate week-over-week changes
                              const weeklyChanges = []
                              for (let i = 1; i < filteredChartData.length; i++) {
                                const currentWeek = filteredChartData[i]
                                const prevWeek = filteredChartData[i - 1]

                                if (currentWeek[scenario] && prevWeek[scenario]) {
                                  const change =
                                    ((currentWeek[scenario] - prevWeek[scenario]) / prevWeek[scenario]) * 100
                                  weeklyChanges.push({
                                    week: currentWeek.week,
                                    change,
                                  })
                                }
                              }

                              return (
                                <div key={scenario} className="border-b pb-3 last:border-0 last:pb-0">
                                  <h3 className="font-semibold flex items-center">
                                    <div
                                      className="w-3 h-3 rounded-full mr-2"
                                      style={{ backgroundColor: getScenarioColor(scenario) }}
                                    ></div>
                                    {scenario}
                                  </h3>

                                  <div className="mt-2 space-y-1">
                                    {weeklyChanges.map((item, index) => (
                                      <div key={index} className="flex justify-between text-sm">
                                        <span>{item.week}:</span>
                                        <span className={item.change > 0 ? "text-green-600" : "text-red-600"}>
                                          {item.change > 0 ? "+" : ""}
                                          {item.change.toFixed(1)}%
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        ) : (
                          <p className="text-center text-gray-500">No data available for trend analysis</p>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Data Statistics</CardTitle>
                      <CardDescription>Statistical analysis of selected data</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="p-4 bg-gray-50 rounded-lg">
                        {filteredChartData.length > 0 ? (
                          <div className="space-y-4">
                            {selectedScenarios.map((scenario) => {
                              // Calculate statistics
                              const values = filteredChartData
                                .map((item) => item[scenario])
                                .filter((val) => val !== undefined)

                              if (values.length === 0) return null

                              const sum = values.reduce((a, b) => a + b, 0)
                              const avg = sum / values.length
                              const min = Math.min(...values)
                              const max = Math.max(...values)

                              return (
                                <div key={scenario} className="border-b pb-3 last:border-0 last:pb-0">
                                  <h3 className="font-semibold flex items-center">
                                    <div
                                      className="w-3 h-3 rounded-full mr-2"
                                      style={{ backgroundColor: getScenarioColor(scenario) }}
                                    ></div>
                                    {scenario}
                                  </h3>

                                  <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
                                    <div>
                                      <span className="text-gray-500">Average:</span> {avg.toFixed(2)}
                                    </div>
                                    <div>
                                      <span className="text-gray-500">Min:</span> {min.toFixed(2)}
                                    </div>
                                    <div>
                                      <span className="text-gray-500">Max:</span> {max.toFixed(2)}
                                    </div>
                                    <div>
                                      <span className="text-gray-500">Range:</span> {(max - min).toFixed(2)}
                                    </div>
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        ) : (
                          <p className="text-center text-gray-500">No data available for statistical analysis</p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="alerts" className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <Card className="md:col-span-2">
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

                  <Card>
                    <CardHeader>
                      <CardTitle>Alert Categories</CardTitle>
                      <CardDescription>Types of alerts in the planning model</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                          <h3 className="font-semibold text-red-800">Critical Alerts</h3>
                          <ul className="text-sm text-red-700 mt-1 space-y-1 pl-5 list-disc">
                            <li>Available Supply less than Total Demand</li>
                            <li>Planned FG Inventory not available after material constraints</li>
                            <li>Planned Inventory less than Total Demand</li>
                            <li>Planned Intermediate Inventory not available after material constraints</li>
                            <li>Planned Inventory Not Available</li>
                          </ul>
                        </div>

                        <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                          <h3 className="font-semibold text-amber-800">Capacity Alerts</h3>
                          <ul className="text-sm text-amber-700 mt-1 space-y-1 pl-5 list-disc">
                            <li>Planned FG Production Orders Exceed Allocated Capacity</li>
                            <li>Planned Intermediate Production Orders Exceed Allocated Capacity</li>
                          </ul>
                        </div>

                        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                          <h3 className="font-semibold text-blue-800">Supporting Alerts</h3>
                          <ul className="text-sm text-blue-700 mt-1 space-y-1 pl-5 list-disc">
                            <li>Sales Orders Exceed Forecast</li>
                            <li>Total Planned FG Inventory Exceeds Minimum Order Quantity</li>
                            <li>Total Planned Intermediate Inventory Exceeds Batch Size</li>
                            <li>Inventory Below Safety Stock</li>
                            <li>Inventory Below Safety Stock after material constraints</li>
                          </ul>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle>Alert Resolution Strategy</CardTitle>
                    <CardDescription>Business rules applied to minimize alerts</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                      <div className="p-4 bg-gray-50 rounded-lg flex flex-col items-center text-center">
                        <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center mb-2">
                          <span className="font-bold">1</span>
                        </div>
                        <h3 className="font-semibold text-sm">Expedite Purchase Orders</h3>
                        <p className="text-xs text-gray-500 mt-1">Accelerate delivery of critical materials</p>
                      </div>

                      <div className="p-4 bg-gray-50 rounded-lg flex flex-col items-center text-center">
                        <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center mb-2">
                          <span className="font-bold">2</span>
                        </div>
                        <h3 className="font-semibold text-sm">Move Sales Orders</h3>
                        <p className="text-xs text-gray-500 mt-1">Reschedule deliveries when possible</p>
                      </div>

                      <div className="p-4 bg-gray-50 rounded-lg flex flex-col items-center text-center">
                        <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center mb-2">
                          <span className="font-bold">3</span>
                        </div>
                        <h3 className="font-semibold text-sm">Increase Capacities</h3>
                        <p className="text-xs text-gray-500 mt-1">Expand production capabilities</p>
                      </div>

                      <div className="p-4 bg-gray-50 rounded-lg flex flex-col items-center text-center">
                        <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center mb-2">
                          <span className="font-bold">4</span>
                        </div>
                        <h3 className="font-semibold text-sm">Increase Material Purchases</h3>
                        <p className="text-xs text-gray-500 mt-1">Order additional raw materials</p>
                      </div>

                      <div className="p-4 bg-gray-50 rounded-lg flex flex-col items-center text-center">
                        <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center mb-2">
                          <span className="font-bold">5</span>
                        </div>
                        <h3 className="font-semibold text-sm">Fine Tune All Measures</h3>
                        <p className="text-xs text-gray-500 mt-1">Optimize all parameters to eliminate shortages</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="scenarios" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Scenario Comparison</CardTitle>
                    <CardDescription>Key metrics across selected planning scenarios</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-96">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={Object.entries(kpis).map(([key, values]) => {
                            const result: any = { name: key }
                            selectedScenarios.forEach((scenario) => {
                              result[scenario] = values[scenario] || 0
                            })
                            return result
                          })}
                          layout="vertical"
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis type="number" />
                          <YAxis dataKey="name" type="category" width={150} />
                          <Tooltip />
                          <Legend />
                          {selectedScenarios.map((scenario) => (
                            <Bar key={scenario} dataKey={scenario} name={scenario} fill={getScenarioColor(scenario)} />
                          ))}
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Scenario Descriptions</CardTitle>
                      <CardDescription>Details of each planning scenario</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {scenarios
                          .filter((s) => selectedScenarios.includes(s.name))
                          .map((scenario) => (
                            <div
                              key={scenario.name}
                              className={`p-3 border rounded-lg ${
                                scenario.name === "S4" ? "bg-green-50 border-green-200" : "border-gray-200"
                              }`}
                            >
                              <h3 className={`font-semibold ${scenario.name === "S4" ? "text-green-800" : ""}`}>
                                {scenario.description}
                              </h3>
                              <p
                                className={`text-sm mt-1 ${scenario.name === "S4" ? "text-green-700" : "text-gray-600"}`}
                              >
                                {scenario.name === "BASE" &&
                                  "Initial 11-week planning model based on existing future Sales Orders, Sales Forecasts, Production Orders, and Purchase Orders with standard inventory stocking rules."}
                                {scenario.name === "S1" &&
                                  "Accelerates delivery of critical materials and reschedules customer deliveries where possible to alleviate immediate shortages."}
                                {scenario.name === "S2" &&
                                  "Expands production capabilities for both CAM and Cathode manufacturing to address capacity constraints."}
                                {scenario.name === "S3" &&
                                  "Orders additional raw materials to ensure adequate supply for production requirements and safety stock."}
                                {scenario.name === "S4" &&
                                  "Optimizes all parameters from S1-S3 to create the most balanced plan with minimal alerts and maximum fill rate. This is the recommended scenario."}
                              </p>
                            </div>
                          ))}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Recommendation</CardTitle>
                      <CardDescription>Analysis and next steps</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {loadedScenarios.includes("S4") ? (
                        <>
                          <div className="p-4 bg-green-50 border border-green-200 rounded-lg mb-4">
                            <h3 className="font-semibold text-green-800">S4 Scenario Recommended</h3>
                            <p className="text-sm text-green-700 mt-2">
                              The S4 scenario provides the best balance of supply chain performance metrics:
                            </p>
                            <ul className="text-sm text-green-700 mt-2 space-y-1 pl-5 list-disc">
                              <li>Highest Fill Rate</li>
                              <li>Fewest Critical Alerts</li>
                              <li>Balanced inventory levels</li>
                              <li>Optimized production scheduling</li>
                            </ul>
                          </div>

                          <div className="space-y-4">
                            <div className="p-3 border border-gray-200 rounded-lg">
                              <h3 className="font-semibold">Implementation Steps</h3>
                              <ol className="text-sm text-gray-600 mt-1 space-y-1 pl-5 list-decimal">
                                <li>Confirm expedited purchase orders with suppliers</li>
                                <li>Communicate delivery adjustments to affected customers</li>
                                <li>Schedule additional production capacity</li>
                                <li>Place additional material orders</li>
                                <li>Update production schedule with new plan</li>
                              </ol>
                            </div>
                          </div>
                        </>
                      ) : (
                        <div className="p-4 bg-gray-100 border border-gray-200 rounded-lg text-center">
                          <p className="text-gray-600">Upload the S4 scenario data to see recommendations</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="process" className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Manufacturing Process</CardTitle>
                      <CardDescription>LCO Cathode Production Flow</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="p-4 bg-gray-50 rounded-lg">
                        <h3 className="font-semibold mb-2">2-Part Process:</h3>
                        <ol className="list-decimal pl-5 space-y-2">
                          <li>CAM Production (3954706 - LiCoO2 1 & 2)</li>
                          <li>Cathode Production using CAM</li>
                        </ol>

                        <h3 className="font-semibold mt-4 mb-2">CAM Components:</h3>
                        <ul className="list-disc pl-5 space-y-1">
                          <li>3869375 - Li2CO3</li>
                          <li>5830674 - CoSO4</li>
                          <li>5832940 - Co(OH)2</li>
                        </ul>

                        <h3 className="font-semibold mt-4 mb-2">Additional Chemicals:</h3>
                        <ul className="list-disc pl-5 space-y-1">
                          <li>9968465 - NH4OH</li>
                          <li>6783061 - H3PO4</li>
                          <li>5375802 - Copper Foil</li>
                        </ul>

                        <h3 className="font-semibold mt-4 mb-2">Final Product:</h3>
                        <p className="pl-5">3720579 - LCO Cathode 1 & 2</p>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>S&OP Planning Process</CardTitle>
                      <CardDescription>Weekly planning model overview</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="p-4 bg-gray-50 rounded-lg">
                        <h3 className="font-semibold mb-2">Planning Model Inputs:</h3>
                        <ul className="list-disc pl-5 space-y-1">
                          <li>Existing future Sales Orders</li>
                          <li>Sales Forecasts</li>
                          <li>Production Orders (3720579, 3954706)</li>
                          <li>Purchase Orders (3869375, 5375802, 5830674, 5832940, 6783061, 9968465)</li>
                          <li>Inventory stocking rules (Target Inventories)</li>
                        </ul>

                        <h3 className="font-semibold mt-4 mb-2">Planning Model Outputs:</h3>
                        <ul className="list-disc pl-5 space-y-1">
                          <li>Planned Production Orders</li>
                          <li>Planned Purchase Orders</li>
                          <li>Alerts (Critical, Capacity, Supporting)</li>
                        </ul>

                        <h3 className="font-semibold mt-4 mb-2">S&OP Planning Rules Priority:</h3>
                        <ol className="list-decimal pl-5 space-y-1">
                          <li>Expedite Purchase Orders</li>
                          <li>Move Sales Orders out if possible</li>
                          <li>Increase Capacities</li>
                          <li>Increase material purchases</li>
                          <li>Fine tune all of the above to eliminate remaining shortages</li>
                        </ol>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
          </>
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
