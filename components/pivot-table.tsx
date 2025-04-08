"use client"

import { useMemo, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectItem } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { scenarios } from "@/lib/data-utils"

interface PivotTableProps {
  data: any[]
}

export function PivotTable({ data }: PivotTableProps) {
  const [rowDimension, setRowDimension] = useState<string>("category")
  const [colDimension, setColDimension] = useState<string>("scenario")
  const [valueDimension, setValueDimension] = useState<string>("value")
  const [aggregation, setAggregation] = useState<string>("average")

  const dimensions = [
    { value: "category", label: "Category" },
    { value: "scenario", label: "Scenario" },
    { value: "week", label: "Week" },
  ]

  const aggregations = [
    { value: "average", label: "Average" },
    { value: "sum", label: "Sum" },
    { value: "count", label: "Count" },
    { value: "min", label: "Minimum" },
    { value: "max", label: "Maximum" },
  ]

  const pivotData = useMemo(() => {
    if (!data || data.length === 0) return { rows: [], columns: [], values: {} }

    // Get unique values for row and column dimensions
    const rowValues = [...new Set(data.map((item) => item[rowDimension]))]
    const colValues = [...new Set(data.map((item) => item[colDimension]))]

    // Create a map to store aggregated values
    const aggregatedValues: Record<string, Record<string, number[]>> = {}

    // Initialize the map
    rowValues.forEach((row) => {
      aggregatedValues[row] = {}
      colValues.forEach((col) => {
        aggregatedValues[row][col] = []
      })
    })

    // Populate the map with values
    data.forEach((item) => {
      const rowKey = item[rowDimension]
      const colKey = item[colDimension]
      if (aggregatedValues[rowKey] && aggregatedValues[rowKey][colKey]) {
        aggregatedValues[rowKey][colKey].push(item[valueDimension])
      }
    })

    // Apply aggregation function
    const finalValues: Record<string, Record<string, number>> = {}
    rowValues.forEach((row) => {
      finalValues[row] = {}
      colValues.forEach((col) => {
        const values = aggregatedValues[row][col]
        if (values.length === 0) {
          finalValues[row][col] = 0
          return
        }

        switch (aggregation) {
          case "average":
            finalValues[row][col] = values.reduce((sum, val) => sum + val, 0) / values.length
            break
          case "sum":
            finalValues[row][col] = values.reduce((sum, val) => sum + val, 0)
            break
          case "count":
            finalValues[row][col] = values.length
            break
          case "min":
            finalValues[row][col] = Math.min(...values)
            break
          case "max":
            finalValues[row][col] = Math.max(...values)
            break
          default:
            finalValues[row][col] = values.reduce((sum, val) => sum + val, 0) / values.length
        }
      })
    })

    return {
      rows: rowValues,
      columns: colValues,
      values: finalValues,
    }
  }, [data, rowDimension, colDimension, valueDimension, aggregation])

  const getScenarioColor = (scenarioName: string) => {
    const scenario = scenarios.find((s) => s.name === scenarioName)
    return scenario ? scenario.color : "#cccccc"
  }

  const formatValue = (value: number) => {
    if (value === 0) return "0"
    if (Math.abs(value) < 0.01) return value.toExponential(2)
    if (Math.abs(value) < 1) return value.toFixed(2)
    if (Math.abs(value) < 10) return value.toFixed(1)
    if (Math.abs(value) < 1000) return value.toFixed(0)
    return value.toLocaleString()
  }

  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Pivot Table</CardTitle>
          <CardDescription>No data available for analysis</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Pivot Table Analysis</CardTitle>
        <CardDescription>Analyze your data by different dimensions</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div>
            <Label htmlFor="row-dimension" className="mb-2 block">
              Row Dimension
            </Label>
            <Select id="row-dimension" value={rowDimension} onValueChange={setRowDimension}>
              {dimensions.map((dim) => (
                <SelectItem key={dim.value} value={dim.value}>
                  {dim.label}
                </SelectItem>
              ))}
            </Select>
          </div>
          <div>
            <Label htmlFor="col-dimension" className="mb-2 block">
              Column Dimension
            </Label>
            <Select id="col-dimension" value={colDimension} onValueChange={setColDimension}>
              {dimensions.map((dim) => (
                <SelectItem key={dim.value} value={dim.value}>
                  {dim.label}
                </SelectItem>
              ))}
            </Select>
          </div>
          <div>
            <Label htmlFor="value-dimension" className="mb-2 block">
              Value Field
            </Label>
            <Select id="value-dimension" value={valueDimension} onValueChange={setValueDimension}>
              <SelectItem value="value">Value</SelectItem>
            </Select>
          </div>
          <div>
            <Label htmlFor="aggregation" className="mb-2 block">
              Aggregation
            </Label>
            <Select id="aggregation" value={aggregation} onValueChange={setAggregation}>
              {aggregations.map((agg) => (
                <SelectItem key={agg.value} value={agg.value}>
                  {agg.label}
                </SelectItem>
              ))}
            </Select>
          </div>
        </div>

        <div className="rounded-md border overflow-auto max-h-96">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="bg-gray-50 font-medium">
                  {dimensions.find((d) => d.value === rowDimension)?.label}
                </TableHead>
                {pivotData.columns.map((col) => (
                  <TableHead key={col} className="text-center">
                    {colDimension === "scenario" ? (
                      <div className="flex items-center justify-center">
                        <div
                          className="w-3 h-3 rounded-full mr-2"
                          style={{ backgroundColor: getScenarioColor(col) }}
                        ></div>
                        {col}
                      </div>
                    ) : (
                      col
                    )}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {pivotData.rows.map((row) => (
                <TableRow key={row}>
                  <TableCell className="font-medium bg-gray-50">{row}</TableCell>
                  {pivotData.columns.map((col) => (
                    <TableCell key={col} className="text-right">
                      {formatValue(pivotData.values[row][col])}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}
