"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Download, Info, Settings } from "lucide-react"
import { scenarios } from "@/lib/data-utils"

interface DashboardHeaderProps {
  loadedScenarios: string[]
  onDownloadData?: () => void
  onOpenSettings?: () => void
}

export function DashboardHeader({ loadedScenarios, onDownloadData, onOpenSettings }: DashboardHeaderProps) {
  const [showInfo, setShowInfo] = useState(false)

  return (
    <div className="mb-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold">Detroit Cathode Manufacturing</h1>
          <p className="text-gray-500">S&OP Planning Dashboard</p>
        </div>
        <div className="flex items-center space-x-2 mt-4 md:mt-0">
          <Button variant="outline" size="sm" onClick={onDownloadData}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button variant="outline" size="sm" onClick={onOpenSettings}>
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Button>
          <Button variant="outline" size="sm" onClick={() => setShowInfo(!showInfo)}>
            <Info className="h-4 w-4 mr-2" />
            Info
          </Button>
        </div>
      </div>

      {showInfo && (
        <Card className="mb-6 bg-blue-50 border-blue-200">
          <CardContent className="pt-4">
            <h3 className="font-medium mb-2">Dashboard Information</h3>
            <p className="text-sm mb-3">
              This dashboard provides analysis of Detroit Cathode Manufacturing's supply chain planning scenarios:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-2">
              {scenarios.map((scenario) => (
                <div key={scenario.name} className="flex items-start space-x-2">
                  <div className="w-3 h-3 rounded-full mt-1" style={{ backgroundColor: scenario.color }}></div>
                  <div>
                    <p className="text-sm font-medium">{scenario.name}</p>
                    <p className="text-xs text-gray-600">{scenario.description}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-3 text-sm">
              <p>
                <strong>Loaded Scenarios:</strong> {loadedScenarios.join(", ") || "None"}
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
