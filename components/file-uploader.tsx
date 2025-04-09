"use client"

import type React from "react"
import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Upload, CheckCircle2, AlertCircle } from "lucide-react"
import { parseCSVData } from "@/lib/csv-parser"
import { scenarios } from "@/lib/data-utils"

interface FileUploaderProps {
  onDataLoaded: (scenarioName: string, timeSeriesData: any[], alertsData: any[]) => void
  loadedScenarios: string[]
  onLoadAll: () => void
  loading: boolean
}

export function FileUploader({ onDataLoaded, loadedScenarios, onLoadAll, loading }: FileUploaderProps) {
  const [fileLoading, setFileLoading] = useState<{ [key: string]: boolean }>({})
  const [error, setError] = useState<{ [key: string]: string }>({})

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>, scenarioName: string) => {
    const file = event.target.files?.[0]
    if (!file) return

    setFileLoading((prev) => ({ ...prev, [scenarioName]: true }))
    setError((prev) => ({ ...prev, [scenarioName]: "" }))

    try {
      const text = await file.text()
      const { timeSeriesData, alertsData } = parseCSVData(text, scenarioName)

      if (timeSeriesData.length === 0) {
        throw new Error("No data points were extracted from the file. Please check the format.")
      }

      onDataLoaded(scenarioName, timeSeriesData, alertsData)
    } catch (err) {
      setError((prev) => ({ ...prev, [scenarioName]: "Failed to parse file. Please check the format." }))
    } finally {
      setFileLoading((prev) => ({ ...prev, [scenarioName]: false }))
    }
  }

  const triggerFileUpload = (scenarioName: string) => {
    const input = document.createElement("input")
    input.type = "file"
    input.accept = ".csv"

    input.onchange = () => {
      if (input.files && input.files.length > 0) {
        const syntheticEvent = {
          target: { files: input.files },
          currentTarget: { files: input.files },
          preventDefault: () => {},
          stopPropagation: () => {},
        } as React.ChangeEvent<HTMLInputElement>

        handleFileUpload(syntheticEvent, scenarioName)
      }
    }

    input.click()
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Upload Planning Data Files</CardTitle>
        <CardDescription>
          Upload scenario files to begin analysis. The dashboard will automatically update as files are loaded.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {scenarios.map((scenario) => {
            const isLoaded = loadedScenarios.includes(scenario.name)
            const isLoading = fileLoading[scenario.name]
            const hasError = error[scenario.name]

            return (
              <div
                key={scenario.name}
                className={`p-4 border rounded-lg ${
                  isLoaded ? "border-green-200 bg-green-50" : "border-gray-200"
                } ${hasError ? "border-red-200 bg-red-50" : ""}`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      isLoaded
                        ? "bg-green-100 text-green-600"
                        : hasError
                          ? "bg-red-100 text-red-600"
                          : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {isLoaded ? (
                      <CheckCircle2 className="w-4 h-4" />
                    ) : hasError ? (
                      <AlertCircle className="w-4 h-4" />
                    ) : (
                      <Upload className="w-4 h-4" />
                    )}
                  </div>
                  <div>
                    <h3 className="font-medium">{scenario.name}</h3>
                    <p className="text-xs text-gray-500">{scenario.description}</p>
                  </div>
                </div>

                <div className="mt-3">
                  <Button
                    variant={isLoaded ? "outline" : "default"}
                    size="sm"
                    className="w-full"
                    disabled={isLoading}
                    onClick={() => triggerFileUpload(scenario.name)}
                  >
                    {isLoading ? "Loading..." : isLoaded ? "Loaded" : "Upload"}
                  </Button>
                </div>

                {hasError && <p className="text-xs text-red-600 mt-1">{hasError}</p>}
              </div>
            )
          })}
        </div>
      </CardContent>
      <CardFooter className="flex justify-center">
        <Button onClick={onLoadAll} disabled={loading} className="bg-blue-600 hover:bg-blue-700 text-white" size="lg">
          {loading ? "Loading..." : "Load All Scenarios at Once"}
        </Button>
      </CardFooter>
    </Card>
  )
}
