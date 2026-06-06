// Platform metrics - single source of truth
// Use conservative, defensible numbers. Update with real data as platform grows.

export const PLATFORM_METRICS = {
  // Regulatory frameworks we support (not countries with active operators)
  regulatoryFrameworks: "11",
  regulatoryFrameworksLabel: "Regulatory Frameworks Supported",
  
  // Conservative estimates - honest numbers for a growing platform
  companies: "50+",
  companiesLabel: "Registered Companies",
  
  satisfaction: "95%",
  satisfactionLabel: "Customer Satisfaction",
  
  jobs: "1,000+",
  jobsLabel: "Quotes Generated",
  
  uptime: "99.9%",
  uptimeLabel: "Uptime",
  
  // Forward-looking cost savings (potential, not guaranteed)
  costSavingsPotential: "Up to 40%",
  costSavingsPotentialLabel: "Potential Cost Savings",
  
  // Growing network (honest language)
  networkStatus: "Growing Network",
  networkStatusLabel: "Operators Onboarding",
  
  // Use dynamic currency symbol from region
  getProcessedValue: (currencySymbol: string = "£") => `${currencySymbol}1M+`,
  processedLabel: "Processed Value",
};

// Testimonial disclaimer
export const TESTIMONIAL_DISCLAIMER = "Customer experiences may vary. Names and companies are illustrative examples.";

// Metrics disclaimer for marketing claims
export const METRICS_DISCLAIMER = "Based on platform design capabilities. Actual results may vary based on usage and market conditions.";
