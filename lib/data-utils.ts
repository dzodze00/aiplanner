export const scenarios = [
  { name: "BASE", description: "Base Plan", color: "#8884d8" },
  { name: "S1", description: "S1 - Expedite POs & Move Sales Orders", color: "#82ca9d" },
  { name: "S2", description: "S2 - Increase Capacities", color: "#ffc658" },
  { name: "S3", description: "S3 - Increase Material Purchases", color: "#ff8042" },
  { name: "S4", description: "S4 - Fine-tuned Solution", color: "#0088fe" },
]

export const categoryGroups = [
  {
    name: "Demand",
    categories: ["Total Demand", "Firm Demand", "Forecasted Demand"],
  },
  {
    name: "Supply",
    categories: ["Available Supply", "Planned FG Production Orders", "Planned Purchases"],
  },
  {
    name: "Inventory",
    categories: ["Planned FG Inventory", "WIP Inventory", "Raw Materials"],
  },
  {
    name: "Performance",
    categories: ["Fill Rate", "On-Time Delivery", "Perfect Order Rate"],
  },
  {
    name: "Capacity",
    categories: ["Total Capacity", "Allocated Capacity", "Available Capacity"],
  },
]

export const formatValue = (value: number, formatType: "decimal" | "percent" = "decimal"): string => {
  if (typeof value !== "number") return "N/A"

  if (formatType === "percent") {
    return `${(value * 100).toFixed(1)}%`
  }

  if (Math.abs(value) < 0.01) return value.toExponential(2)
  if (Math.abs(value) < 1) return value.toFixed(2)
  if (Math.abs(value) < 10) return value.toFixed(1)
  if (Math.abs(value) < 1000) return value.toFixed(0)
  return value.toLocaleString()
}

export const getPercentChange = (baseValue: number, newValue: number): number => {
  if (baseValue === 0) return 0
  return ((newValue - baseValue) / baseValue) * 100
}
