export interface IntegrationProvider {
  id: string;
  name: string;
  category: 'accounting' | 'project_management' | 'fleet' | 'crm' | 'erp' | 'communication';
  description: string;
  syncs: string[];
  setupTime: string;
  smartFeature: string;
  migration: string;
  icon: string;
  popular?: boolean;
}

export const integrationProviders: IntegrationProvider[] = [
  // Accounting & Finance
  {
    id: 'xero',
    name: 'Xero',
    category: 'accounting',
    description: 'Cloud accounting software for small businesses',
    syncs: ['Invoices', 'Payments', 'Customers', 'Equipment as Inventory Items'],
    setupTime: '2 minutes (OAuth login)',
    smartFeature: 'AI matches equipment hire codes to Xero chart of accounts',
    migration: 'One-click CSV import of all Xero contacts & items',
    icon: '📊',
    popular: true,
  },
  {
    id: 'quickbooks',
    name: 'QuickBooks Online',
    category: 'accounting',
    description: 'Popular accounting software for businesses',
    syncs: ['Invoices', 'Expenses', 'Purchase Orders', 'Tax Reporting'],
    setupTime: '2 minutes (OAuth login)',
    smartFeature: 'Automatic VAT calculation for construction services (UK/Ireland)',
    migration: 'Import customers, suppliers, and historical invoices',
    icon: '💰',
    popular: true,
  },
  {
    id: 'sage',
    name: 'Sage Business Cloud',
    category: 'accounting',
    description: 'Enterprise accounting and business management',
    syncs: ['Invoices', 'Credit Notes', 'Customer Statements'],
    setupTime: '3 minutes (API Key)',
    smartFeature: 'Multi-company support for hire businesses with depots',
    migration: 'Bulk import of Sage customer database',
    icon: '📈',
  },
  
  // Project Management
  {
    id: 'procore',
    name: 'Procore',
    category: 'project_management',
    description: 'Construction project management platform',
    syncs: ['Projects', 'Equipment Assignments', 'Cost Codes', 'Daily Logs'],
    setupTime: '4 minutes (Procore Marketplace App)',
    smartFeature: 'AI suggests equipment based on project schedule & tasks',
    migration: 'Import all active projects and assigned equipment',
    icon: '🏗️',
    popular: true,
  },
  {
    id: 'buildertrend',
    name: 'Buildertrend',
    category: 'project_management',
    description: 'Construction project management for home builders',
    syncs: ['Schedule', 'Budgets', 'Equipment Requests', 'Client Communications'],
    setupTime: '3 minutes (API Key)',
    smartFeature: 'Equipment requests from Buildertrend auto-generate quotes',
    migration: 'Sync project templates and cost categories',
    icon: '🏠',
  },
  {
    id: 'coconstruct',
    name: 'CoConstruct',
    category: 'project_management',
    description: 'Project & financial management for custom builders',
    syncs: ['Projects', 'Selections', 'Budgets', 'Change Orders'],
    setupTime: '3 minutes (OAuth)',
    smartFeature: 'Change orders trigger automatic equipment adjustment suggestions',
    migration: 'Import project list and client database',
    icon: '📋',
  },
  
  // Fleet & Logistics
  {
    id: 'samsara',
    name: 'Samsara',
    category: 'fleet',
    description: 'Fleet management and telematics platform',
    syncs: ['GPS Location', 'Engine Hours', 'Fuel Levels', 'Maintenance Alerts', 'Driver Behavior'],
    setupTime: '5 minutes (Samsara API Token)',
    smartFeature: 'AI predicts equipment needs based on engine hours and project schedule',
    migration: 'Automatic fleet import by VIN/Serial Number',
    icon: '🚛',
    popular: true,
  },
  {
    id: 'geotab',
    name: 'Geotab',
    category: 'fleet',
    description: 'Telematics and fleet management solutions',
    syncs: ['Vehicle Tracking', 'Driver Logs', 'HOS Compliance', 'Fuel Cards'],
    setupTime: '5 minutes (Geotab Marketplace App)',
    smartFeature: 'Geofence alerts when equipment enters/leaves job sites',
    migration: 'Bulk import of vehicles and drivers',
    icon: '📍',
  },
  {
    id: 'fleetio',
    name: 'Fleetio',
    category: 'fleet',
    description: 'Fleet maintenance management software',
    syncs: ['Maintenance Schedules', 'Parts Inventory', 'Work Orders', 'Fuel Entries'],
    setupTime: '4 minutes (API Key)',
    smartFeature: 'AI schedules preventive maintenance between rental periods',
    migration: 'Import complete maintenance history and service records',
    icon: '🔧',
  },
  
  // CRM & Sales
  {
    id: 'hubspot',
    name: 'HubSpot',
    category: 'crm',
    description: 'Inbound marketing and sales platform',
    syncs: ['Contacts', 'Deals', 'Quotes', 'Email Conversations', 'Tasks'],
    setupTime: '3 minutes (HubSpot App Marketplace)',
    smartFeature: 'AI drafts quotes based on deal stage and project notes',
    migration: 'Import entire contact database and deal pipeline',
    icon: '🎯',
    popular: true,
  },
  {
    id: 'salesforce',
    name: 'Salesforce',
    category: 'crm',
    description: 'Enterprise CRM platform',
    syncs: ['Accounts', 'Opportunities', 'Quotes', 'Activities', 'Custom Objects'],
    setupTime: '5 minutes (Salesforce Connected App)',
    smartFeature: 'Equipment utilization data feeds back for upsell opportunities',
    migration: 'Native Salesforce package for seamless data sync',
    icon: '☁️',
  },
  {
    id: 'sugarcrm',
    name: 'SugarCRM',
    category: 'crm',
    description: 'Customer experience platform',
    syncs: ['Leads', 'Contacts', 'Quotes', 'Contracts', 'Service Cases'],
    setupTime: '4 minutes (OAuth 2.0)',
    smartFeature: 'Service cases for equipment issues auto-create maintenance tickets',
    migration: 'Import accounts and service history',
    icon: '🍬',
  },
  
  // ERP Systems
  {
    id: 'sap',
    name: 'SAP S/4HANA',
    category: 'erp',
    description: 'Enterprise resource planning suite',
    syncs: ['Financial Accounting', 'Asset Management', 'Procurement', 'Project Systems'],
    setupTime: '15 minutes (SAP BTP Configuration)',
    smartFeature: 'Equipment rentals post directly to SAP asset and cost center accounting',
    migration: 'Certified SAP integration with full data mapping',
    icon: '🏢',
  },
  {
    id: 'netsuite',
    name: 'Oracle NetSuite',
    category: 'erp',
    description: 'Cloud-based ERP software',
    syncs: ['Financials', 'Inventory', 'Projects', 'Procurement', 'CRM'],
    setupTime: '10 minutes (NetSuite SuiteApp)',
    smartFeature: 'Real-time equipment availability updates NetSuite inventory',
    migration: 'Automated sync of NetSuite items as equipment profiles',
    icon: '🔶',
  },
  {
    id: 'dynamics365',
    name: 'Microsoft Dynamics 365',
    category: 'erp',
    description: 'Microsoft business applications suite',
    syncs: ['Finance', 'Supply Chain', 'Project Operations', 'Field Service'],
    setupTime: '8 minutes (Dynamics Connector)',
    smartFeature: 'Field service work orders automatically reserve equipment',
    migration: 'Import resource and equipment master data',
    icon: '🔷',
  },
  
  // Communication
  {
    id: 'slack',
    name: 'Slack',
    category: 'communication',
    description: 'Business communication platform',
    syncs: ['Booking confirmations', 'Delivery alerts', 'Maintenance reminders', 'Payment notifications'],
    setupTime: '2 minutes (Slack App Directory)',
    smartFeature: 'AI posts daily fleet utilization summary to #operations channel',
    migration: 'Invite @muckaway-bot to channels',
    icon: '💬',
    popular: true,
  },
  {
    id: 'teams',
    name: 'Microsoft Teams',
    category: 'communication',
    description: 'Microsoft collaboration platform',
    syncs: ['Booking updates', 'Delivery tracking', 'Invoice approvals', 'Support tickets'],
    setupTime: '2 minutes (Teams App Store)',
    smartFeature: 'Adaptive Cards for booking approvals within Teams',
    migration: 'Auto-install for entire organization',
    icon: '👥',
  },
];

export const migrationProviders = {
  waste_management: [
    { id: 'wastedge', name: 'WasteEdge', feature: 'Muckaway-specific data mapping' },
    { id: 'purgo', name: 'PurGo', feature: 'Weighbridge integration' },
    { id: 'isyslive', name: 'ISYS Live', feature: 'Round/controller data' },
    { id: 'trashflow', name: 'TrashFlow', feature: 'Customer pricing tiers' },
    { id: 'haulerhero', name: 'Hauler Hero', feature: 'Subscription billing import' },
  ],
  plant_hire: [
    { id: 'hirehop', name: 'HireHop', feature: 'One-click migration' },
    { id: 'pointofrental', name: 'Point of Rental', feature: 'Full booking history import' },
    { id: 'dispatcher', name: 'Dispatcher', feature: 'Customer & equipment sync' },
    { id: 'baseplan', name: 'Baseplan', feature: 'Asset finance data included' },
    { id: 'texada', name: 'Texada', feature: 'Multi-location support' },
  ],
  grab_hire: [
    { id: 'hireright', name: 'Hireright', feature: 'Grab lorry specifications' },
    { id: 'rentaldesk', name: 'RentalDesk', feature: 'Delivery zones & pricing' },
    { id: 'wereturn', name: 'Wereturn', feature: 'Job scheduling data' },
  ],
  generic: [
    { id: 'excel', name: 'Excel/CSV', feature: 'AI auto-mapping' },
    { id: 'googlesheets', name: 'Google Sheets', feature: 'Live two-way sync' },
    { id: 'airtable', name: 'Airtable', feature: 'Custom field support' },
    { id: 'zoho', name: 'Zoho', feature: 'CRM + Books combined import' },
  ],
};

export const categoryLabels: Record<string, string> = {
  accounting: 'Accounting & Finance',
  project_management: 'Project Management',
  fleet: 'Fleet & Logistics',
  crm: 'CRM & Sales',
  erp: 'ERP Systems',
  communication: 'Communication',
};

export const categoryIcons: Record<string, string> = {
  accounting: '💰',
  project_management: '📋',
  fleet: '🚛',
  crm: '🎯',
  erp: '🏢',
  communication: '💬',
};
