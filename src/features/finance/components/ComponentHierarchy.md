# Online Sales Dashboard Component Hierarchy

The diagram below shows the component hierarchy of the Online Sales Dashboard:

```ascii
OnlineSales (Main Container)
│
├── DateRangeSelector
│   └── (Date pickers and refresh controls)
│
├── PlatformSelector
│   └── (Platform selection buttons)
│
├── PlatformEntitySelector
│   └── (Entity dropdown for selected platform)
│
├── PlatformInfoHeader
│   └── (Displays current platform and entity info)
│
├── MetricsSummary
│   ├── Revenue Card
│   ├── Orders Card
│   └── Ads Expense Card
│
├── Charts
│   ├── RevenueChart
│   │   └── (Revenue and ads expense line chart)
│   │
│   └── OrdersChart
│       └── (Orders bar chart)
│
└── MetricsDataTable
    └── (Detailed metrics in tabular format)

Additional Components:
- EmptyStateMessage (displayed when no data available)
```

## Platform Integration

The dashboard supports multiple e-commerce platforms with consistent interfaces:

### Shopee Integration

- Data fetched through `useShopeeMetrics` service
- Shop selection via `PlatformEntitySelector`
- Platform-specific orange color scheme and styling

### Lazada Integration

- Data fetched through `useLazadaMetrics` service
- Account selection via `PlatformEntitySelector`
- Platform-specific blue color scheme and styling

### Shopify Integration (Planned)

- Will use future `useShopifyMetrics` service
- Store selection via `PlatformEntitySelector`
- Platform-specific green color scheme and styling

### Foodpanda Integration

- Data fetched through `useFoodpandaMetrics` service
- Shop selection via `PlatformEntitySelector`
- Platform-specific purple color scheme and styling

## Data Model

Each platform has a slightly different data model, but they share common metrics:

| Metric | Shopee | Lazada | Shopify | Foodpanda | Description |
|--------|--------|--------|---------|-----------|-------------|
| Entity ID | `shop_id` | `account_id` | `store_id` | `shop_id` | Identifier for the shop/account/store |
| Revenue | `revenue` | `revenue` | `new_customer_sales` + `existing_customer_sales` | `revenue` | Total sales revenue |
| Ad Expense | `ads_expense` | `ads_expense` | N/A | N/A | Total advertising expense |
| Orders | `total_orders` | `total_orders` | `session_completed_checkout_count` | `total_orders` | Number of orders |
| New Buyers | `new_buyer_count` | `new_buyer_count` | `new_customer_count` | N/A | Number of new customers |
| Existing Buyers | `existing_buyer_count` | `existing_buyer_count` | `existing_customer_count` | N/A | Number of returning customers |

## Data Flow

1. User selects a platform using `PlatformSelector`
2. User selects a date range using `DateRangeSelector`
3. User selects an entity (shop/store) using `PlatformEntitySelector`
4. Data is fetched using the `useMetricsData` hook
5. Data is displayed in the various components:
   - Summary metrics in `MetricsSummary`
   - Charts in `RevenueChart` and `OrdersChart`
   - Detailed data in `MetricsDataTable`

## Component Dependencies

- `PlatformSelector` exports the `Platform` type used by other components
- `useMetricsData` hook provides data to all display components
- All components use consistent styling based on the selected platform

## Styling Patterns

- Platform-specific colors:
  - Shopee: Orange
  - Lazada: Blue
  - Shopify: Green
  - Foodpanda: Purple
- Consistent card layouts with rounded corners and shadows
- Responsive design for mobile and desktop views
