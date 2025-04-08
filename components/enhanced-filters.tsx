"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectItem } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { scenarios, categoryGroups } from "@/lib/data-utils"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"

interface EnhancedFiltersProps {
  categories: string[]
  selectedCategory: string
  onCategoryChange: (category: string) => void
  selectedScenarios: string[]
  onScenariosChange: (scenarios: string[]) => void
  weeks: string[]
  selectedWeeks: string[]
  onWeeksChange: (weeks: string[]) => void
  selectedMetrics: string[]
  onMetricsChange: (metrics: string[]) => void
  availableMetrics: string[]
}

export function EnhancedFilters({
  categories,
  selectedCategory,
  onCategoryChange,
  selectedScenarios,
  onScenariosChange,
  weeks,
  selectedWeeks,
  onWeeksChange,
  selectedMetrics,
  onMetricsChange,
  availableMetrics,
}: EnhancedFiltersProps) {
  const [activeTab, setActiveTab] = useState("categories")

  const handleScenarioToggle = (scenario: string) => {
    if (selectedScenarios.includes(scenario)) {
      onScenariosChange(selectedScenarios.filter((s) => s !== scenario))
    } else {
      onScenariosChange([...selectedScenarios, scenario])
    }
  }

  const handleWeekToggle = (week: string) => {
    if (selectedWeeks.includes(week)) {
      onWeeksChange(selectedWeeks.filter((w) => w !== week))
    } else {
      onWeeksChange([...selectedWeeks, week])
    }
  }

  const handleMetricToggle = (metric: string) => {
    if (selectedMetrics.includes(metric)) {
      onMetricsChange(selectedMetrics.filter((m) => m !== metric))
    } else {
      onMetricsChange([...selectedMetrics, metric])
    }
  }

  const selectAllWeeks = () => {
    onWeeksChange([...weeks])
  }

  const clearAllWeeks = () => {
    onWeeksChange([])
  }

  const selectAllScenarios = () => {
    onScenariosChange(scenarios.map((s) => s.name))
  }

  const clearAllScenarios = () => {
    onScenariosChange([])
  }

  const selectAllMetrics = () => {
    onMetricsChange([...availableMetrics])
  }

  const clearAllMetrics = () => {
    onMetricsChange([])
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle>Dashboard Filters</CardTitle>
        <CardDescription>Customize your view of the supply chain data</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full mb-4">
            <TabsTrigger value="categories" className="flex-1">
              Categories
            </TabsTrigger>
            <TabsTrigger value="scenarios" className="flex-1">
              Scenarios
            </TabsTrigger>
            <TabsTrigger value="time" className="flex-1">
              Time Periods
            </TabsTrigger>
            <TabsTrigger value="metrics" className="flex-1">
              Metrics
            </TabsTrigger>
          </TabsList>

          <TabsContent value="categories" className="mt-0">
            <div className="space-y-4">
              <div>
                <Label htmlFor="category-select" className="mb-2 block">
                  Time Series Category
                </Label>
                <Select id="category-select" value={selectedCategory} onValueChange={onCategoryChange}>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </Select>
              </div>

              <div>
                <Label className="mb-2 block">Category Groups</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {categoryGroups.map((group) => (
                    <div key={group.name} className="border rounded-md p-3">
                      <h4 className="font-medium text-sm mb-2">{group.name}</h4>
                      <div className="space-y-1 max-h-32 overflow-y-auto">
                        {group.categories.map((category) => (
                          <div key={category} className="flex items-center space-x-2">
                            <Checkbox
                              id={`category-${category}`}
                              checked={category === selectedCategory}
                              onCheckedChange={() => onCategoryChange(category)}
                            />
                            <Label
                              htmlFor={`category-${category}`}
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
            </div>
          </TabsContent>

          <TabsContent value="scenarios" className="mt-0">
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-2">
                <Label className="block">Scenarios</Label>
                <div className="space-x-2">
                  <Button variant="outline" size="sm" onClick={selectAllScenarios}>
                    Select All
                  </Button>
                  <Button variant="outline" size="sm" onClick={clearAllScenarios}>
                    Clear
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {scenarios.map((scenario) => (
                  <div key={scenario.name} className="flex items-center space-x-2 border rounded-md p-3">
                    <Checkbox
                      id={`scenario-${scenario.name}`}
                      checked={selectedScenarios.includes(scenario.name)}
                      onCheckedChange={() => handleScenarioToggle(scenario.name)}
                    />
                    <Label
                      htmlFor={`scenario-${scenario.name}`}
                      className="text-sm font-normal flex items-center cursor-pointer"
                    >
                      <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: scenario.color }}></div>
                      {scenario.name} - {scenario.description}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="time" className="mt-0">
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-2">
                <Label className="block">Time Periods</Label>
                <div className="space-x-2">
                  <Button variant="outline" size="sm" onClick={selectAllWeeks}>
                    Select All
                  </Button>
                  <Button variant="outline" size="sm" onClick={clearAllWeeks}>
                    Clear
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 border rounded-md p-3">
                {weeks.map((week) => (
                  <div key={week} className="flex items-center space-x-2">
                    <Checkbox
                      id={`week-${week}`}
                      checked={selectedWeeks.includes(week)}
                      onCheckedChange={() => handleWeekToggle(week)}
                    />
                    <Label htmlFor={`week-${week}`} className="text-sm font-normal cursor-pointer">
                      {week}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="metrics" className="mt-0">
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-2">
                <Label className="block">Comparison Metrics</Label>
                <div className="space-x-2">
                  <Button variant="outline" size="sm" onClick={selectAllMetrics}>
                    Select All
                  </Button>
                  <Button variant="outline" size="sm" onClick={clearAllMetrics}>
                    Clear
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 border rounded-md p-3 max-h-64 overflow-y-auto">
                {availableMetrics.map((metric) => (
                  <div key={metric} className="flex items-center space-x-2">
                    <Checkbox
                      id={`metric-${metric}`}
                      checked={selectedMetrics.includes(metric)}
                      onCheckedChange={() => handleMetricToggle(metric)}
                    />
                    <Label htmlFor={`metric-${metric}`} className="text-sm font-normal cursor-pointer">
                      {metric}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
