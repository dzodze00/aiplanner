"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { X, Filter, Save, Download, Upload, Search } from "lucide-react"
import { categoryGroups } from "@/lib/data-utils"

interface DataSlicerProps {
  timeSeriesData: any[]
  categories: string[]
  onFilteredDataChange: (filteredData: any[]) => void
  onSavedViewChange?: (viewName: string) => void
}

export function DataSlicer({ timeSeriesData, categories, onFilteredDataChange }: DataSlicerProps) {
  const [activeTab, setActiveTab] = useState("filters")
  const [categoryFilters, setCategoryFilters] = useState<string[]>([])
  const [scenarioFilters, setScenarioFilters] = useState<string[]>([])
  const [weekFilters, setWeekFilters] = useState<string[]>([])
  const [valueRangeMin, setValueRangeMin] = useState<string>("")
  const [valueRangeMax, setValueRangeMax] = useState<string>("")
  const [searchTerm, setSearchTerm] = useState<string>("")
  const [savedViews, setSavedViews] = useState<{ name: string; filters: any }[]>([
    { name: "High Fill Rate", filters: { categories: ["Fill Rate"], valueMin: 90, valueMax: 100 } },
    { name: "Low Inventory", filters: { categories: ["Planned FG Inventory"], valueMax: 1000 } },
    { name: "Production Capacity", filters: { categories: ["Total Capacity", "Allocated Capacity"] } },
  ])
  const [newViewName, setNewViewName] = useState("")

  // Extract unique values from data
  const uniqueScenarios = [...new Set(timeSeriesData.map((item) => item.scenario))]
  const uniqueWeeks = [...new Set(timeSeriesData.map((item) => item.week))].sort((a, b) => {
    const numA = Number.parseInt(a.replace(/\D/g, ""))
    const numB = Number.parseInt(b.replace(/\D/g, ""))
    return numA - numB
  })

  // Apply filters to data
  const applyFilters = () => {
    let filteredData = [...timeSeriesData]

    // Apply category filters
    if (categoryFilters.length > 0) {
      filteredData = filteredData.filter((item) => categoryFilters.includes(item.category))
    }

    // Apply scenario filters
    if (scenarioFilters.length > 0) {
      filteredData = filteredData.filter((item) => scenarioFilters.includes(item.scenario))
    }

    // Apply week filters
    if (weekFilters.length > 0) {
      filteredData = filteredData.filter((item) => weekFilters.includes(item.week))
    }

    // Apply value range filters
    if (valueRangeMin !== "") {
      const min = Number.parseFloat(valueRangeMin)
      if (!isNaN(min)) {
        filteredData = filteredData.filter((item) => item.value >= min)
      }
    }

    if (valueRangeMax !== "") {
      const max = Number.parseFloat(valueRangeMax)
      if (!isNaN(max)) {
        filteredData = filteredData.filter((item) => item.value <= max)
      }
    }

    // Apply search term
    if (searchTerm.trim() !== "") {
      const term = searchTerm.toLowerCase()
      filteredData = filteredData.filter(
        (item) =>
          item.category.toLowerCase().includes(term) ||
          item.scenario.toLowerCase().includes(term) ||
          item.week.toLowerCase().includes(term),
      )
    }

    onFilteredDataChange(filteredData)
  }

  const clearFilters = () => {
    setCategoryFilters([])
    setScenarioFilters([])
    setWeekFilters([])
    setValueRangeMin("")
    setValueRangeMax("")
    setSearchTerm("")
    onFilteredDataChange(timeSeriesData)
  }

  const saveCurrentView = () => {
    if (newViewName.trim() === "") return

    const newView = {
      name: newViewName,
      filters: {
        categories: categoryFilters,
        scenarios: scenarioFilters,
        weeks: weekFilters,
        valueMin: valueRangeMin,
        valueMax: valueRangeMax,
        searchTerm,
      },
    }

    setSavedViews([...savedViews, newView])
    setNewViewName("")
  }

  const loadSavedView = (view: any) => {
    setCategoryFilters(view.filters.categories || [])
    setScenarioFilters(view.filters.scenarios || [])
    setWeekFilters(view.filters.weeks || [])
    setValueRangeMin(view.filters.valueMin || "")
    setValueRangeMax(view.filters.valueMax || "")
    setSearchTerm(view.filters.searchTerm || "")

    // Apply the filters immediately
    setTimeout(applyFilters, 0)
  }

  const handleCategoryToggle = (category: string) => {
    setCategoryFilters((prev) => (prev.includes(category) ? prev.filter((c) => c !== category) : [...prev, category]))
  }

  const handleScenarioToggle = (scenario: string) => {
    setScenarioFilters((prev) => (prev.includes(scenario) ? prev.filter((s) => s !== scenario) : [...prev, scenario]))
  }

  const handleWeekToggle = (week: string) => {
    setWeekFilters((prev) => (prev.includes(week) ? prev.filter((w) => w !== week) : [...prev, week]))
  }

  const exportFilteredData = () => {
    // Apply filters to get current filtered data
    let filteredData = [...timeSeriesData]

    if (categoryFilters.length > 0) {
      filteredData = filteredData.filter((item) => categoryFilters.includes(item.category))
    }

    if (scenarioFilters.length > 0) {
      filteredData = filteredData.filter((item) => scenarioFilters.includes(item.scenario))
    }

    if (weekFilters.length > 0) {
      filteredData = filteredData.filter((item) => weekFilters.includes(item.week))
    }

    if (valueRangeMin !== "") {
      const min = Number.parseFloat(valueRangeMin)
      if (!isNaN(min)) {
        filteredData = filteredData.filter((item) => item.value >= min)
      }
    }

    if (valueRangeMax !== "") {
      const max = Number.parseFloat(valueRangeMax)
      if (!isNaN(max)) {
        filteredData = filteredData.filter((item) => item.value <= max)
      }
    }

    if (searchTerm.trim() !== "") {
      const term = searchTerm.toLowerCase()
      filteredData = filteredData.filter(
        (item) =>
          item.category.toLowerCase().includes(term) ||
          item.scenario.toLowerCase().includes(term) ||
          item.week.toLowerCase().includes(term),
      )
    }

    // Convert to CSV
    const headers = ["category", "scenario", "week", "value"]
    const csvContent =
      headers.join(",") +
      "\n" +
      filteredData
        .map((row) => {
          return headers.map((header) => row[header]).join(",")
        })
        .join("\n")

    // Create download link
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.setAttribute("href", url)
    link.setAttribute("download", "filtered_data.csv")
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Data Slicer</CardTitle>
            <CardDescription>Slice and dice your data for deeper analysis</CardDescription>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={clearFilters}>
              Clear
            </Button>
            <Button variant="default" size="sm" onClick={applyFilters}>
              Apply Filters
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full mb-4">
            <TabsTrigger value="filters" className="flex-1">
              <Filter className="h-4 w-4 mr-2" />
              Filters
            </TabsTrigger>
            <TabsTrigger value="views" className="flex-1">
              <Save className="h-4 w-4 mr-2" />
              Saved Views
            </TabsTrigger>
            <TabsTrigger value="export" className="flex-1">
              <Download className="h-4 w-4 mr-2" />
              Export
            </TabsTrigger>
          </TabsList>

          <TabsContent value="filters" className="mt-0 space-y-4">
            <div className="flex items-center space-x-2">
              <Search className="h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search in all fields..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label className="mb-2 block">Categories</Label>
                <div className="border rounded-md p-3 h-64 overflow-y-auto">
                  {categoryGroups.map((group) => (
                    <div key={group.name} className="mb-3">
                      <h4 className="text-sm font-medium mb-1">{group.name}</h4>
                      <div className="space-y-1 pl-2">
                        {group.categories
                          .filter((cat) => categories.includes(cat))
                          .map((category) => (
                            <div key={category} className="flex items-center space-x-2">
                              <Checkbox
                                id={`cat-${category}`}
                                checked={categoryFilters.includes(category)}
                                onCheckedChange={() => handleCategoryToggle(category)}
                              />
                              <Label
                                htmlFor={`cat-${category}`}
                                className="text-xs font-normal cursor-pointer truncate"
                              >
                                {category}
                              </Label>
                            </div>
                          ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <Label className="mb-2 block">Scenarios</Label>
                <div className="border rounded-md p-3 h-64 overflow-y-auto">
                  {uniqueScenarios.map((scenario) => (
                    <div key={scenario} className="flex items-center space-x-2 mb-2">
                      <Checkbox
                        id={`scenario-${scenario}`}
                        checked={scenarioFilters.includes(scenario)}
                        onCheckedChange={() => handleScenarioToggle(scenario)}
                      />
                      <Label htmlFor={`scenario-${scenario}`} className="text-sm font-normal cursor-pointer">
                        {scenario}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <Label className="mb-2 block">Time Periods</Label>
                <div className="border rounded-md p-3 h-64 overflow-y-auto">
                  <div className="grid grid-cols-3 gap-2">
                    {uniqueWeeks.map((week) => (
                      <div key={week} className="flex items-center space-x-2">
                        <Checkbox
                          id={`week-${week}`}
                          checked={weekFilters.includes(week)}
                          onCheckedChange={() => handleWeekToggle(week)}
                        />
                        <Label htmlFor={`week-${week}`} className="text-xs font-normal cursor-pointer">
                          {week}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="mb-2 block">Value Range</Label>
                <div className="flex items-center space-x-2">
                  <Input
                    type="number"
                    placeholder="Min"
                    value={valueRangeMin}
                    onChange={(e) => setValueRangeMin(e.target.value)}
                  />
                  <span>to</span>
                  <Input
                    type="number"
                    placeholder="Max"
                    value={valueRangeMax}
                    onChange={(e) => setValueRangeMax(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <Label className="mb-2 block">Active Filters</Label>
                <div className="flex flex-wrap gap-2">
                  {categoryFilters.map((filter) => (
                    <Badge key={`cat-${filter}`} variant="outline" className="flex items-center gap-1">
                      {filter}
                      <X
                        className="h-3 w-3 cursor-pointer"
                        onClick={() => setCategoryFilters((prev) => prev.filter((f) => f !== filter))}
                      />
                    </Badge>
                  ))}
                  {scenarioFilters.map((filter) => (
                    <Badge key={`scen-${filter}`} variant="outline" className="flex items-center gap-1">
                      {filter}
                      <X
                        className="h-3 w-3 cursor-pointer"
                        onClick={() => setScenarioFilters((prev) => prev.filter((f) => f !== filter))}
                      />
                    </Badge>
                  ))}
                  {weekFilters.length > 0 && (
                    <Badge variant="outline" className="flex items-center gap-1">
                      {weekFilters.length} weeks
                      <X className="h-3 w-3 cursor-pointer" onClick={() => setWeekFilters([])} />
                    </Badge>
                  )}
                  {(valueRangeMin !== "" || valueRangeMax !== "") && (
                    <Badge variant="outline" className="flex items-center gap-1">
                      Range: {valueRangeMin || "min"} - {valueRangeMax || "max"}
                      <X
                        className="h-3 w-3 cursor-pointer"
                        onClick={() => {
                          setValueRangeMin("")
                          setValueRangeMax("")
                        }}
                      />
                    </Badge>
                  )}
                  {searchTerm && (
                    <Badge variant="outline" className="flex items-center gap-1">
                      Search: {searchTerm}
                      <X className="h-3 w-3 cursor-pointer" onClick={() => setSearchTerm("")} />
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="views" className="mt-0 space-y-4">
            <div className="flex items-center space-x-2 mb-4">
              <Input
                placeholder="New view name..."
                value={newViewName}
                onChange={(e) => setNewViewName(e.target.value)}
                className="flex-1"
              />
              <Button variant="outline" size="sm" onClick={saveCurrentView} disabled={newViewName.trim() === ""}>
                <Save className="h-4 w-4 mr-2" />
                Save Current View
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {savedViews.map((view, index) => (
                <Card key={index} className="overflow-hidden">
                  <CardHeader className="pb-2 bg-gray-50">
                    <CardTitle className="text-sm">{view.name}</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-3 text-xs">
                    <div className="space-y-1">
                      {view.filters.categories?.length > 0 && (
                        <div>
                          <span className="font-medium">Categories:</span>{" "}
                          {view.filters.categories.slice(0, 2).join(", ")}
                          {view.filters.categories.length > 2 && ` +${view.filters.categories.length - 2} more`}
                        </div>
                      )}
                      {view.filters.scenarios?.length > 0 && (
                        <div>
                          <span className="font-medium">Scenarios:</span>{" "}
                          {view.filters.scenarios.slice(0, 2).join(", ")}
                          {view.filters.scenarios.length > 2 && ` +${view.filters.scenarios.length - 2} more`}
                        </div>
                      )}
                      {(view.filters.valueMin || view.filters.valueMax) && (
                        <div>
                          <span className="font-medium">Value Range:</span> {view.filters.valueMin || "min"} -{" "}
                          {view.filters.valueMax || "max"}
                        </div>
                      )}
                    </div>
                    <Button variant="outline" size="sm" className="w-full mt-3" onClick={() => loadSavedView(view)}>
                      <Upload className="h-3 w-3 mr-2" />
                      Load View
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="export" className="mt-0 space-y-4">
            <div className="p-4 border rounded-md bg-gray-50">
              <h3 className="font-medium mb-2">Export Filtered Data</h3>
              <p className="text-sm text-gray-600 mb-4">
                Export your currently filtered data to CSV format for further analysis in other tools.
              </p>
              <Button onClick={exportFilteredData}>
                <Download className="h-4 w-4 mr-2" />
                Export to CSV
              </Button>
            </div>

            <div className="p-4 border rounded-md">
              <h3 className="font-medium mb-2">Data Summary</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="font-medium">Categories:</p>
                  <p className="text-gray-600">{categories.length} unique categories</p>
                </div>
                <div>
                  <p className="font-medium">Scenarios:</p>
                  <p className="text-gray-600">{uniqueScenarios.length} scenarios</p>
                </div>
                <div>
                  <p className="font-medium">Time Periods:</p>
                  <p className="text-gray-600">{uniqueWeeks.length} weeks</p>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
