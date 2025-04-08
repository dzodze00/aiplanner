"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectItem } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { scenarios } from "@/lib/data-utils"

interface DataFiltersProps {
  categories: string[]
  selectedCategory: string
  onCategoryChange: (category: string) => void
  selectedScenarios: string[]
  onScenariosChange: (scenarios: string[]) => void
  weeks: string[]
  selectedWeeks: string[]
  onWeeksChange: (weeks: string[]) => void
}

export function DataFilters({
  categories,
  selectedCategory,
  onCategoryChange,
  selectedScenarios,
  onScenariosChange,
  weeks,
  selectedWeeks,
  onWeeksChange,
}: DataFiltersProps) {
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

  const selectAllWeeks = () => {
    onWeeksChange([...weeks])
  }

  const clearAllWeeks = () => {
    onWeeksChange([])
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Data Filters</CardTitle>
        <CardDescription>Filter the data to analyze specific metrics and scenarios</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <Label htmlFor="category-select" className="mb-2 block">
              Metric
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
            <Label className="mb-2 block">Scenarios</Label>
            <div className="space-y-2">
              {scenarios.map((scenario) => (
                <div key={scenario.name} className="flex items-center space-x-2">
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

          <div>
            <div className="flex items-center justify-between mb-2">
              <Label className="block">Weeks</Label>
              <div className="space-x-2">
                <Button variant="outline" size="sm" onClick={selectAllWeeks}>
                  Select All
                </Button>
                <Button variant="outline" size="sm" onClick={clearAllWeeks}>
                  Clear
                </Button>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2 max-h-32 overflow-y-auto p-2 border rounded-md">
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
        </div>
      </CardContent>
    </Card>
  )
}
