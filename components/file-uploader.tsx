"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Upload, FileUp, CheckCircle2, AlertCircle } from "lucide-react"
import { parseCSVData } from "@/lib/csv-parser"
import { scenarios } from "@/lib/data-utils"

interface FileUploaderProps {
  onDataLoaded: (scenarioName: string, timeSeriesData: any[], alertsData: any[]) => void
  loadedScenarios: string[]
}

export function FileUploader({ onDataLoaded, loadedScenarios }: FileUploaderProps) {
  const [loading, setLoading] = useState<{ [key: string]: boolean }>({})
  const [error, setError] = useState<{ [key: string]: string }>({})

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>, scenarioName: string) => {
    const file = event.target.files?.[0]
    if (!file) return

    setLoading((prev) => ({ ...prev, [scenarioName]: true }))
    setError((prev) => ({ ...prev, [scenarioName]: "" }))

    try {
      const text = await file.text()
      const { timeSeriesData, alertsData } = parseCSVData(text, scenarioName)
      onDataLoaded(scenarioName, timeSeriesData, alertsData)
    } catch (err) {
      console.error(`Error parsing ${scenarioName} data:`, err)
      setError((prev) => ({ ...prev, [scenarioName]: "Failed to parse file. Please check the format." }))
    } finally {
      setLoading((prev) => ({ ...prev, [scenarioName]: false }))
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Data Upload</CardTitle>
        <CardDescription>Upload planning data files for analysis</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {scenarios.map((scenario) => {
            const isLoaded = loadedScenarios.includes(scenario.name)
            const isLoading = loading[scenario.name]
            const hasError = error[scenario.name]

            return (
              <div
                key={scenario.name}
                className={`p-4 border rounded-lg ${
                  isLoaded ? "border-green-200 bg-green-50" : "border-gray-200 bg-gray-50"
                } ${hasError ? "border-red-200 bg-red-50" : ""}`}
              >
                <div className="flex flex-col items-center text-center gap-2">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      isLoaded
                        ? "bg-green-100 text-green-600"
                        : hasError
                          ? "bg-red-100 text-red-600"
                          : "bg-gray-200 text-gray-600"
                    }`}
                  >
                    {isLoaded ? (
                      <CheckCircle2 className="w-5 h-5" />
                    ) : hasError ? (
                      <AlertCircle className="w-5 h-5" />
                    ) : (
                      <FileUp className="w-5 h-5" />
                    )}
                  </div>
                  <h3 className="font-semibold">{scenario.name}</h3>
                  <p className="text-xs text-gray-500">{scenario.description}</p>

                  <div className="w-full mt-2">
                    <Button
                      variant={isLoaded ? "outline" : "default"}
                      size="sm"
                      className="w-full"
                      disabled={isLoading}
                      onClick={() => {
                        // Create a hidden file input and trigger it
                        const input = document.createElement("input")
                        input.type = "file"
                        input.accept = ".csv"
                        input.onchange = (e) =>
                          handleFileUpload(e as React.ChangeEvent<HTMLInputElement>, scenario.name)
                        input.click()
                      }}
                    >
                      {isLoading ? (
                        "Loading..."
                      ) : isLoaded ? (
                        <>
                          <CheckCircle2 className="w-4 h-4 mr-1" /> Loaded
                        </>
                      ) : (
                        <>
                          <Upload className="w-4 h-4 mr-1" /> Upload
                        </>
                      )}
                    </Button>
                  </div>

                  {hasError && <p className="text-xs text-red-600 mt-1">{hasError}</p>}
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
