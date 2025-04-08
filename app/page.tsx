"use client"

import { useState, useEffect, useMemo } from "react"
import { transformForChart, calculateKPIs, categoryGroups } from "@/lib/data-utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { BarChart2, LineChart, Clock, Table2, Download, Settings, Info } from "lucide-react"
import { TimeSeriesChart } from "@/components/time-series-chart"
import { KPIDashboard } from "@/components/kpi-dashboard"
import { ScenarioComparison } from "@/components/scenario-comparison"
import { FileUploader } from "@/components/file-uploader"

export default function Dashboard() {
  // State
  const [isUploadStage, setIsUploadStage] = useState(true)
  const [loadedScenarios, setLoadedScenarios] = useState<string[]>([])
  const [timeSeriesData, setTimeSeriesData] = useState<any[]>([])
  const [alertsData, setAlertsData] = useState<any[]>([])
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<string>("overview")
  const [selectedCategory, setSelectedCategory] = useState<string>("Fill Rate")
  const [selectedScenarios, setSelectedScenarios] = useState<string[]>([])
  const [selectedWeeks, setSelectedWeeks] = useState<string[]>([])
  const [activeFilterTab, setActiveFilterTab] = useState("categories")
  const [categorySelections, setCategorySelections] = useState<{ [key: string]: boolean }>({})

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

    // Automatically proceed to analysis when data is loaded
    if (isUploadStage) {
      setIsUploadStage(false)
    }
  }

  const handleBackToUpload = () => {
    setIsUploadStage(true)
  }

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category)
  }

  const handleCategoryCheckboxChange = (category: string, checked: boolean) => {
    setCategorySelections((prev) => ({
      ...prev,
      [category]: checked,
    }))

    if (checked) {
      setSelectedCategory(category)
    }
  }

  if (isUploadStage) {
    return (
      <div className="p-4 max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">Detroit Cathode Manufacturing</h1>
            <p className="text-gray-500">S&OP Planning Dashboard</p>
          </div>
        </div>

        <FileUploader onDataLoaded={handleDataLoaded} loadedScenarios={loadedScenarios} />
      </div>
    )
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

      {/* Back to Upload Button */}
      <Button variant="outline" onClick={handleBackToUpload} className="mb-6">
        Back to Upload
      </Button>

      {/* Tab Navigation */}
      <div className="flex mb-6 border-b">
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
        <CardContent className="p-4">
          <h2 className="text-lg font-semibold mb-2">Dashboard Filters</h2>
          <p className="text-sm text-gray-500 mb-4">Customize your view of the supply chain data</p>

          {/* Filter Tabs */}
          <div className="flex mb-4 border-b">
            <Button
              variant={activeFilterTab === "categories" ? "default" : "ghost"}
              onClick={() => setActiveFilterTab("categories")}
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary"
              data-state={activeFilterTab === "categories" ? "active" : "inactive"}
              size="sm"
            >
              Categories
            </Button>
            <Button
              variant={activeFilterTab === "scenarios" ? "default" : "ghost"}
              onClick={() => setActiveFilterTab("scenarios")}
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary"
              data-state={activeFilterTab === "scenarios" ? "active" : "inactive"}
              size="sm"
            >
              Scenarios
            </Button>
            <Button
              variant={activeFilterTab === "timePeriods" ? "default" : "ghost"}
              onClick={() => setActiveFilterTab("timePeriods")}
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary"
              data-state={activeFilterTab === "timePeriods" ? "active" : "inactive"}
              size="sm"
            >
              Time Periods
            </Button>
            <Button
              variant={activeFilterTab === "metrics" ? "default" : "ghost"}
              onClick={() => setActiveFilterTab("metrics")}
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary"
              data-state={activeFilterTab === "metrics" ? "active" : "inactive"}
              size="sm"
            >
              Metrics
            </Button>
          </div>

          {/* Filter Content */}
          {activeFilterTab === "categories" && (
            <div>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Time Series Category</label>
                <select
                  className="w-full p-2 border rounded"
                  value={selectedCategory}
                  onChange={(e) => handleCategoryChange(e.target.value)}
                >
                  {categories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {categoryGroups.map((group) => {
                  const availableCategories = group.categories.filter((cat) => categories.includes(cat))
                  if (availableCategories.length === 0) return null

                  return (
                    <div key={group.name}>
                      <h3 className="font-medium mb-2">{group.name}</h3>
                      <div className="space-y-2">
                        {availableCategories.map((category) => (
                          <div key={category} className="flex items-center">
                            <input
                              type="checkbox"
                              id={`category-${category}`}
                              checked={selectedCategory === category}
                              onChange={(e) => handleCategoryCheckboxChange(category, e.target.checked)}
                              className="mr-2"
                            />
                            <label htmlFor={`category-${category}`} className="text-sm">
                              {category}
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Content based on active tab */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          <KPIDashboard kpis={kpis} selectedScenarios={selectedScenarios} />

          <Card>
            <CardContent className="p-6">
              <h2 className="text-lg font-semibold mb-2">Time Series Analysis</h2>
              <p className="text-sm text-gray-500 mb-4">
                Analyzing {selectedCategory} across {selectedScenarios.length} scenarios
              </p>
              <TimeSeriesChart data={chartData} selectedScenarios={selectedScenarios} title={selectedCategory} />
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === "timeSeries" && (
        <Card>
          <CardContent className="p-6">
            <h2 className="text-lg font-semibold mb-2">Time Series Analysis</h2>
            <p className="text-sm text-gray-500 mb-4">Detailed time series analysis for {selectedCategory}</p>
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
          <CardContent className="p-6">
            <h2 className="text-lg font-semibold mb-2">Scenario Comparison</h2>
            <p className="text-sm text-gray-500 mb-4">Compare key metrics across different planning scenarios</p>
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
          <CardContent className="p-6">
            <h2 className="text-lg font-semibold mb-2">Raw Data</h2>
            <p className="text-sm text-gray-500 mb-4">View the raw data points for the selected filters</p>
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
                <div className="p-2 text-center text-sm text-gray-500">Showing 100 of {filteredData.length} rows</div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
