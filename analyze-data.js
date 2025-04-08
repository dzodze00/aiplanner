// Fetch and analyze the data from the provided CSV files
import { parse } from 'csv-parse/sync';

async function fetchCSV(url) {
  const response = await fetch(url);
  const text = await response.text();
  return parse(text, { columns: true, skip_empty_lines: true });
}

// URLs for the different scenarios
const baseUrl = "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/BASE%20-%20Demand%20Supply%20Time%20Series%20-%20105-sv21T2Ck7n5at38al16K9v6PPXfGyB.csv";
const s1Url = "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/S1%20-%20Demand%20Supply%20Time%20Series%20-%20105-rwt8vFxvzjVKvLoOtOutwJQqu88aWU.csv";
const s2Url = "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/S2%20-%20Demand%20Supply%20Time%20Series%20-%20105-OG9D8gd6icVCC40C6brmI2hk6CmWqs.csv";
const s3Url = "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/S3%20-%20Demand%20Supply%20Time%20Series%20-%20105-eZ7INZUuQyBX8OcvB48pMSmM7WKzJk.csv";
const s4Url = "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/S4%20-%20Demand%20Supply%20Time%20Series%20-%20105-WZT92LboZPRfhUV0P9PFJE2ESYlbKy.csv";

async function analyzeData() {
  try {
    // Fetch all datasets
    const baseData = await fetchCSV(baseUrl);
    const s1Data = await fetchCSV(s1Url);
    const s2Data = await fetchCSV(s2Url);
    const s3Data = await fetchCSV(s3Url);
    const s4Data = await fetchCSV(s4Url);
    
    // Get a sample of the data structure
    console.log("Sample data structure:");
    console.log(baseData[0]);
    
    // Count rows to understand data size
    console.log(`\nData size: ${baseData.length} rows`);
    
    // Extract column names to understand available metrics
    const columns = Object.keys(baseData[0]);
    console.log("\nAvailable columns:");
    console.log(columns);
    
    // Analyze the data structure more deeply
    const dataStructure = analyzeDataStructure(baseData);
    console.log("\nData structure analysis:");
    console.log(dataStructure);
    
    // Compare key metrics across scenarios
    compareScenarios(baseData, s1Data, s2Data, s3Data, s4Data);
    
  } catch (error) {
    console.error("Error analyzing data:", error);
  }
}

function analyzeDataStructure(data) {
  // Get unique values for categorical columns
  const requirementsTypes = new Set();
  
  // Identify time periods
  const timePeriods = new Set();
  
  data.forEach(row => {
    if (row["Requirements at Plant P103"]) {
      requirementsTypes.add(row["Requirements at Plant P103"]);
    }
    
    // Extract week information
    if (row["Week / Week Ending"]) {
      timePeriods.add(row["Week / Week Ending"]);
    }
  });
  
  return {
    requirementsTypes: Array.from(requirementsTypes),
    timePeriods: Array.from(timePeriods).sort(),
    totalWeeks: timePeriods.size
  };
}

function compareScenarios(baseData, s1Data, s2Data, s3Data, s4Data) {
  console.log("\nComparing scenarios:");
  
  // Extract key metrics for comparison
  const scenarios = {
    "BASE": extractKeyMetrics(baseData),
    "S1 (Expedite POs & Move SOs)": extractKeyMetrics(s1Data),
    "S2 (Increase Capacities)": extractKeyMetrics(s2Data),
    "S3 (Increase Material Purchases)": extractKeyMetrics(s3Data),
    "S4 (Fine-tuned Solution)": extractKeyMetrics(s4Data)
  };
  
  // Compare fill rates
  console.log("\nAverage Fill Rate by Scenario:");
  for (const [scenario, metrics] of Object.entries(scenarios)) {
    console.log(`${scenario}: ${metrics.avgFillRate.toFixed(2)}%`);
  }
  
  // Compare inventory levels
  console.log("\nAverage Planned Inventory by Scenario:");
  for (const [scenario, metrics] of Object.entries(scenarios)) {
    console.log(`${scenario}: ${metrics.avgPlannedInventory.toFixed(2)}`);
  }
  
  // Compare production orders
  console.log("\nTotal Production Orders by Scenario:");
  for (const [scenario, metrics] of Object.entries(scenarios)) {
    console.log(`${scenario}: ${metrics.totalProductionOrders.toFixed(2)}`);
  }
  
  // Compare alerts
  console.log("\nTotal Alerts by Scenario:");
  for (const [scenario, metrics] of Object.entries(scenarios)) {
    console.log(`${scenario}: ${metrics.totalAlerts}`);
  }
}

function extractKeyMetrics(data) {
  let totalFillRate = 0;
  let fillRateCount = 0;
  let totalPlannedInventory = 0;
  let inventoryCount = 0;
  let totalProductionOrders = 0;
  let productionOrderCount = 0;
  let totalAlerts = 0;
  
  data.forEach(row => {
    // Extract Fill Rate
    if (row["Fill Rate"] && !isNaN(parseFloat(row["Fill Rate"]))) {
      totalFillRate += parseFloat(row["Fill Rate"]);
      fillRateCount++;
    }
    
    // Extract Planned Inventory
    if (row["Planned Inventory"] && !isNaN(parseFloat(row["Planned Inventory"]))) {
      totalPlannedInventory += parseFloat(row["Planned Inventory"]);
      inventoryCount++;
    }
    
    // Extract Production Orders
    if (row["Production Order Quantity"] && !isNaN(parseFloat(row["Production Order Quantity"]))) {
      totalProductionOrders += parseFloat(row["Production Order Quantity"]);
      productionOrderCount++;
    }
    
    // Extract Alerts
    if (row["Number of Alerts"] && !isNaN(parseInt(row["Number of Alerts"]))) {
      totalAlerts += parseInt(row["Number of Alerts"]);
    }
  });
  
  return {
    avgFillRate: fillRateCount > 0 ? (totalFillRate / fillRateCount) * 100 : 0,
    avgPlannedInventory: inventoryCount > 0 ? totalPlannedInventory / inventoryCount : 0,
    totalProductionOrders: totalProductionOrders,
    totalAlerts: totalAlerts
  };
}

// Run the analysis
analyzeData();
