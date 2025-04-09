"use client"

import type React from "react"
import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Upload, CheckCircle2, AlertCircle, Loader2, FileUp, RefreshCw, FileText, Download, Eye } from "lucide-react"
import { parseCSVData } from "@/lib/csv-parser"
import { scenarios } from "@/lib/data-utils"

interface FileUploaderProps {
  onDataLoaded: (scenarioName: string, timeSeriesData: any[], alertsData: any[]) => void
  loadedScenarios: string[]
  onLoadAll: () => void
  loading: boolean
  onProceedToDashboard?: () => void
}

export function FileUploader({
  onDataLoaded,
  loadedScenarios,
  onLoadAll,
  loading,
  onProceedToDashboard,
}: FileUploaderProps) {
  const [fileLoading, setFileLoading] = useState<{ [key: string]: boolean }>(
    scenarios.reduce((acc, scenario) => ({ ...acc, [scenario.name]: false }), {}),
  )
  const [error, setError] = useState<{ [key: string]: string }>(
    scenarios.reduce((acc, scenario) => ({ ...acc, [scenario.name]: "" }), {}),
  )
  const [fileContents, setFileContents] = useState<{ [key: string]: string }>(
    scenarios.reduce((acc, scenario) => ({ ...acc, [scenario.name]: "" }), {}),
  )
  const [showDebug, setShowDebug] = useState<{ [key: string]: boolean }>(
    scenarios.reduce((acc, scenario) => ({ ...acc, [scenario.name]: false }), {}),
  )
  const [rawMode, setRawMode] = useState<boolean>(false)
  const [extractedData, setExtractedData] = useState<{ [key: string]: any[] }>(
    scenarios.reduce((acc, scenario) => ({ ...acc, [scenario.name]: [] }), {}),
  )
  const [showDataPreview, setShowDataPreview] = useState<{ [key: string]: boolean }>(
    scenarios.reduce((acc, scenario) => ({ ...acc, [scenario.name]: false }), {}),
  )

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>, scenarioName: string) => {
    const file = event.target.files?.[0]
    if (!file) return

    setFileLoading((prev) => ({ ...prev, [scenarioName]: true }))
    setError((prev) => ({ ...prev, [scenarioName]: "" }))

    try {
      console.log(`Reading file for ${scenarioName}: ${file.name}`)
      const text = await file.text()
      setFileContents((prev) => ({ ...prev, [scenarioName]: text }))

      console.log(`File content length: ${text.length} bytes`)
      if (text.length < 100) {
        console.warn("File content is suspiciously short:", text)
      }

      // If in raw mode, try to extract data directly from the file
      if (rawMode) {
        const lines = text.split(/\r?\n/).filter((line) => line.trim() !== "")
        const timeSeriesData = []

        for (let i = 1; i < lines.length; i++) {
          const row = lines[i].split(",")
          if (row.length < 3) continue

          const category = row[0]?.trim() || ""
          if (!category) continue

          for (let j = 2; j < row.length; j++) {
            const value = Number(row[j].replace(/["'$,%]/g, "").trim())
            if (!isNaN(value)) {
              timeSeriesData.push({
                category,
                week: `Week ${j - 1}`,
                value,
                scenario: scenarioName,
              })
            }
          }
        }

        if (timeSeriesData.length > 0) {
          console.log(`Raw mode extracted ${timeSeriesData.length} data points`)
          setExtractedData((prev) => ({ ...prev, [scenarioName]: timeSeriesData }))
          onDataLoaded(scenarioName, timeSeriesData, [])
          return
        } else {
          console.log("Raw mode failed to extract data, falling back to normal parser")
        }
      }

      const { timeSeriesData, alertsData } = parseCSVData(text, scenarioName)
      setExtractedData((prev) => ({ ...prev, [scenarioName]: timeSeriesData }))

      if (timeSeriesData.length === 0) {
        throw new Error("No data points were extracted from the file. Please check the format.")
      }

      console.log(`Successfully parsed ${timeSeriesData.length} data points for ${scenarioName}`)
      onDataLoaded(scenarioName, timeSeriesData, alertsData)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to parse file. Please check the format."
      setError((prev) => ({ ...prev, [scenarioName]: errorMessage }))
      console.error(`Error parsing file for ${scenarioName}:`, err)
    } finally {
      setFileLoading((prev) => ({ ...prev, [scenarioName]: false }))
    }
  }

  const retryParsing = (scenarioName: string) => {
    const text = fileContents[scenarioName]
    if (!text) {
      setError((prev) => ({ ...prev, [scenarioName]: "No file content available to retry" }))
      return
    }

    setFileLoading((prev) => ({ ...prev, [scenarioName]: true }))
    setError((prev) => ({ ...prev, [scenarioName]: "" }))

    try {
      console.log(`Retrying parsing for ${scenarioName}`)
      const { timeSeriesData, alertsData } = parseCSVData(text, scenarioName)
      setExtractedData((prev) => ({ ...prev, [scenarioName]: timeSeriesData }))

      if (timeSeriesData.length === 0) {
        throw new Error("No data points were extracted from the file. Please check the format.")
      }

      console.log(`Successfully parsed ${timeSeriesData.length} data points for ${scenarioName}`)
      onDataLoaded(scenarioName, timeSeriesData, alertsData)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to parse file. Please check the format."
      setError((prev) => ({ ...prev, [scenarioName]: errorMessage }))
      console.error(`Error parsing file for ${scenarioName}:`, err)
    } finally {
      setFileLoading((prev) => ({ ...prev, [scenarioName]: false }))
    }
  }

  const toggleDebug = (scenarioName: string) => {
    setShowDebug((prev) => ({ ...prev, [scenarioName]: !prev[scenarioName] }))
  }

  const toggleDataPreview = (scenarioName: string) => {
    setShowDataPreview((prev) => ({ ...prev, [scenarioName]: !prev[scenarioName] }))
  }

  const downloadSampleCSV = () => {
    // Create a simple sample CSV that matches the expected format
    const sampleCSV = `Requirements at Plant P103,,,Week / Week Ending,,,,,,,,,,,
,,,1,2,3,4,5,6,7,8,9,10,11,12
Demand,,,100,110,120,130,140,150,160,170,180,190,200,210
Supply,,,90,100,110,120,130,140,150,160,170,180,190,200
Fill Rate,,,0.9,0.91,0.92,0.92,0.93,0.93,0.94,0.94,0.94,0.95,0.95,0.95
Planned Inventory,,,500,510,520,530,540,550,560,570,580,590,600,610
`

    const blob = new Blob([sampleCSV], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "sample_scenario.csv"
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const triggerFileUpload = (scenarioName: string) => {
    const input = document.createElement("input")
    input.type = "file"
    input.accept = ".csv"

    // Ensure the input element is added to the DOM
    document.body.appendChild(input)

    input.onchange = (e) => {
      if (input.files && input.files.length > 0) {
        const syntheticEvent = {
          target: { files: input.files },
        } as React.ChangeEvent<HTMLInputElement>

        handleFileUpload(syntheticEvent, scenarioName)
      }
      // Remove the input element after use
      document.body.removeChild(input)
    }

    input.click()
  }

  return (
    <div className="space-y-8">
      <div className="text-center max-w-2xl mx-auto">
        <div className="bg-primary/10 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6">
          <FileUp className="h-10 w-10 text-primary" />
        </div>
        <h2 className="text-3xl font-bold mb-3">Upload Planning Data</h2>
        <p className="text-muted-foreground mb-8 max-w-lg mx-auto">
          Upload your scenario files to begin analysis. The dashboard will automatically update as files are loaded.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center mb-4">
          <Button
            onClick={onLoadAll}
            disabled={loading}
            className="bg-primary hover:bg-primary/90 text-white"
            size="lg"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Loading All Scenarios...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                Load All Scenarios at Once
              </>
            )}
          </Button>

          <Button onClick={downloadSampleCSV} variant="outline" size="lg">
            <Download className="mr-2 h-4 w-4" />
            Download Sample CSV
          </Button>
        </div>

        <div className="flex items-center justify-center gap-2 mt-4">
          <label className="flex items-center space-x-2 text-sm">
            <input
              type="checkbox"
              checked={rawMode}
              onChange={() => setRawMode(!rawMode)}
              className="rounded border-gray-300"
            />
            <span>Use raw parsing mode (for problematic files)</span>
          </label>
        </div>

        <div className="text-sm text-muted-foreground mt-3">Or upload individual scenario files below</div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {scenarios.map((scenario) => {
          const isLoaded = loadedScenarios.includes(scenario.name)
          const isLoading = fileLoading[scenario.name]
          const hasError = error[scenario.name]
          const hasFileContent = !!fileContents[scenario.name]
          const isDebugShown = showDebug[scenario.name]
          const isDataPreviewShown = showDataPreview[scenario.name]
          const extractedDataPoints = extractedData[scenario.name] || []

          return (
            <Card
              key={scenario.name}
              className={`overflow-hidden transition-all hover:shadow-md ${
                isLoaded
                  ? "border-green-200 bg-green-50/50"
                  : hasError
                    ? "border-red-200 bg-red-50/50"
                    : "hover:border-primary/50"
              }`}
            >
              <CardHeader className="pb-2">
                <div className="flex items-center">
                  <div
                    className="w-12 h-12 rounded-full mr-4 flex items-center justify-center"
                    style={{
                      backgroundColor: isLoaded ? `${scenario.color}20` : hasError ? "#FEE2E2" : "#F1F5F9",
                    }}
                  >
                    {isLoaded ? (
                      <CheckCircle2 className="w-6 h-6" style={{ color: scenario.color }} />
                    ) : hasError ? (
                      <AlertCircle className="w-6 h-6 text-red-500" />
                    ) : (
                      <Upload className="w-6 h-6 text-gray-400" />
                    )}
                  </div>
                  <div>
                    <CardTitle className="text-base">{scenario.name}</CardTitle>
                    <CardDescription>{scenario.description}</CardDescription>
                  </div>
                </div>
              </CardHeader>

              <CardContent>
                {hasError && (
                  <div className="text-xs text-red-600 mb-3 p-2 bg-red-50 rounded border border-red-100">
                    {hasError}
                    {hasFileContent && (
                      <div className="mt-2 flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-xs flex-1"
                          onClick={() => retryParsing(scenario.name)}
                        >
                          <RefreshCw className="h-3 w-3 mr-1" /> Retry
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-xs flex-1"
                          onClick={() => toggleDebug(scenario.name)}
                        >
                          <FileText className="h-3 w-3 mr-1" /> {isDebugShown ? "Hide" : "Debug"}
                        </Button>
                      </div>
                    )}
                  </div>
                )}

                {isDebugShown && hasFileContent && (
                  <div className="mb-3 p-2 bg-gray-50 rounded border text-xs">
                    <div className="font-medium mb-1">File Preview (first 200 chars):</div>
                    <pre className="whitespace-pre-wrap overflow-auto max-h-32 bg-white p-2 rounded border">
                      {fileContents[scenario.name].substring(0, 200)}
                      {fileContents[scenario.name].length > 200 ? "..." : ""}
                    </pre>
                    <div className="mt-2">
                      <div className="font-medium mb-1">File Size: {fileContents[scenario.name].length} bytes</div>
                      <div className="font-medium">
                        Lines: {fileContents[scenario.name].split(/\r?\n/).filter(Boolean).length}
                      </div>
                    </div>
                  </div>
                )}

                {isLoaded && (
                  <div className="mb-3 flex justify-between items-center">
                    <div className="text-xs text-green-600">{extractedDataPoints.length} data points extracted</div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs"
                      onClick={() => toggleDataPreview(scenario.name)}
                    >
                      <Eye className="h-3 w-3 mr-1" /> {isDataPreviewShown ? "Hide" : "Preview"}
                    </Button>
                  </div>
                )}

                {isDataPreviewShown && extractedDataPoints.length > 0 && (
                  <div className="mb-3 p-2 bg-gray-50 rounded border text-xs">
                    <div className="font-medium mb-1">Data Preview (first 5 points):</div>
                    <div className="overflow-auto max-h-32">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="bg-gray-100">
                            <th className="p-1 text-left">Category</th>
                            <th className="p-1 text-left">Week</th>
                            <th className="p-1 text-right">Value</th>
                          </tr>
                        </thead>
                        <tbody>
                          {extractedDataPoints.slice(0, 5).map((point, idx) => (
                            <tr key={idx} className="border-t">
                              <td className="p-1">{point.category}</td>
                              <td className="p-1">{point.week}</td>
                              <td className="p-1 text-right">{point.value}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      {extractedDataPoints.length > 5 && (
                        <div className="text-center mt-1 text-gray-500">
                          ...and {extractedDataPoints.length - 5} more
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <Button
                  variant={isLoaded ? "outline" : "default"}
                  size="sm"
                  className={`w-full ${isLoaded ? "" : "bg-primary hover:bg-primary/90"}`}
                  disabled={isLoading}
                  onClick={() => triggerFileUpload(scenario.name)}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                      Loading...
                    </>
                  ) : isLoaded ? (
                    <>
                      <CheckCircle2 className="mr-2 h-3 w-3" />
                      Loaded Successfully
                    </>
                  ) : (
                    <>
                      <Upload className="mr-2 h-3 w-3" />
                      Upload CSV
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          )
        })}
      </div>
      {loadedScenarios.length > 0 && (
        <div className="mt-8 text-center">
          <Button
            onClick={() => onProceedToDashboard?.()}
            className="bg-green-600 hover:bg-green-700 text-white"
            size="lg"
          >
            Proceed to Dashboard
          </Button>
          <p className="text-sm text-gray-500 mt-2">
            {loadedScenarios.length} of {scenarios.length} scenarios loaded
          </p>
        </div>
      )}
    </div>
  )
}
