# Project Commands
 
## Print file structure 

```bash
tree -I 'dist|node_modules'
```

## Run the app

```bash
npm run dev
```

## Build the app

```bash
npm run build
```

## Online Sales Dashboard

The Online Sales Dashboard has been refactored into modular components for better maintainability and reusability. The main components include:

### Core Components

1. **OnlineSales.tsx** - Main container component that integrates all sub-components
2. **PlatformSelector** - Component for selecting e-commerce platforms (Shopee, Lazada, Shopify)
3. **DateRangeSelector** - Component for selecting date ranges for metrics data
4. **PlatformEntitySelector** - Component for selecting entities (shops, stores, accounts) within a platform
5. **PlatformInfoHeader** - Component that displays current platform and entity information
6. **MetricsSummary** - Component that displays summary metrics (revenue, orders, ad spend)

### Charts and Data Display

1. **RevenueChart** - Component for displaying revenue and ad expense data
2. **OrdersChart** - Component for displaying order data
3. **MetricsDataTable** - Component for displaying detailed metrics data in tabular format
4. **EmptyStateMessage** - Component for displaying a message when no data is available

### Data Fetching

1. **useMetricsData** - Custom hook for fetching and managing metrics data

This modular approach allows for:

- Easier code maintenance
- Better separation of concerns
- Improved testability
- Reusability of components across the application
- More consistent user experience

### Platform Support

Currently, the dashboard fully supports Shopee, with support for Lazada now available as well, and planned support for Shopify.

#### Lazada Integration

The dashboard now includes full support for Lazada metrics:

- **Lazada Metrics API**: The `useLazadaMetrics` service module fetches Lazada metrics data from the backend API
- **Account Selection**: Users can select different Lazada accounts from the `PlatformEntitySelector` dropdown
- **Platform-Specific UI**: All components have been updated with Lazada-specific styling and formatting:
  - Blue color scheme for Lazada data
  - Proper handling of Lazada account IDs
  - Lazada-specific data visualization

The integration maintains a consistent user experience across platforms while respecting each platform's unique identity.

#### Extension

To add support for additional e-commerce platforms, implement the following:

1. Create a platform-specific metrics service module (e.g., `useShopifyMetrics.ts`)
2. Add the platform type to the `Platform` type in `PlatformSelector.tsx`
3. Update the `useMetricsData` hook to handle the new platform
4. Add platform-specific styling and handling in each component
