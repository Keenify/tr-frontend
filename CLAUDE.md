# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Core Development
- `npm run dev` - Start development server on port 5173
- `npm run build` - Build for production (runs TypeScript check + Vite build)
- `npm run lint` - Run ESLint with TypeScript extensions
- `npm run test` - Run Jest tests (uses ts-jest with tsconfig.jest.json)
- `npm run preview` - Preview production build locally

### Testing
- Jest configuration uses Node.js environment with TypeScript support via ts-jest preset
- Test files should follow Jest naming conventions
- Separate TypeScript config for tests: `tsconfig.jest.json`
- Jest config file: `jest.config.js` (using ES modules export)

### Environment Requirements
- Node.js >= 18 required
- Package manager: Yarn 1.22.22 (specified in packageManager field)
- Environment variable: `VITE_BACKEND_API_DOMAIN` (required for API calls)

## Architecture Overview

### Technology Stack
- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS + various UI libraries (Ant Design, Chakra UI, Material-UI)
- **State Management**: Zustand + React Query for server state
- **Authentication**: Supabase Auth with JWT sessions
- **Database**: Supabase (PostgreSQL)
- **Deployment**: Vercel (based on vercel.json presence)

### Multi-Tenancy Architecture
The application implements company-based multi-tenancy:

- **Authentication Flow**: JWT tokens contain company context via Supabase Auth
- **Data Isolation**: All API calls include company_id for automatic filtering
- **User Context**: `useUserAndCompanyData` hook provides cached user/company data through `UserDataContext`
- **Caching Strategy**: 5-minute cache duration for user/company data to reduce API calls
- **Backend Integration**: Environment variable `VITE_BACKEND_API_DOMAIN` configures API endpoint

### Feature-Based Directory Structure
```
src/features/
├── auth/           - Authentication components
├── content/        - Document management (drag-drop, file uploads)
├── projects/       - Kanban-style project management (Trello-like)
├── people/         - HR features (calendar, hiring, leaves, directory)
├── finance/        - E-commerce analytics (Shopee, Lazada, Shopify)
├── admin/          - Administrative functions
├── dashboard/      - Main dashboard layout
└── [other-features]
```

### Key Patterns

#### Service Layer Pattern
- Services in `services/` folders handle API calls
- Custom hooks in `hooks/` folders manage component state
- Types defined in `types/` folders for TypeScript safety

#### Shared Components
- `src/shared/components/trello/` - Reusable Kanban board components
- `src/shared/hooks/` - Cross-feature hooks (user data, sessions)
- `src/shared/contexts/` - React contexts for global state

#### Error Handling & Console Management
- Expected 404s during secure/legacy endpoint fallbacks are handled silently
- Error boundaries used for component-level error recovery
- Console logging patterns distinguish between expected vs. unexpected errors
- React Beautiful DND with strict mode compatibility via `StrictModeDroppable`

### Key Integrations

#### Supabase Integration
- Authentication via `src/lib/supabase.ts`
- File uploads to Supabase Storage
- Real-time subscriptions for collaborative features

#### E-commerce Platform APIs
- Shopee, Lazada, Shopify metrics integration (Shopee & Lazada fully supported)
- Platform-specific service modules in `features/finance/services/`
- Unified metrics data handling via `useMetricsData` hook
- Modular dashboard components: PlatformSelector, DateRangeSelector, MetricsSummary, RevenueChart, OrdersChart

#### Rich Text Editing
- TipTap editor for document content
- Image uploads with resizing capabilities
- PDF generation for quotations/reports

### Environment Configuration
- API domain configured via `VITE_BACKEND_API_DOMAIN`
- Vite proxy setup for development API calls
- Environment-specific configurations in `src/config/`

### Build & Deployment
- Vite for fast development and optimized builds
- TypeScript strict mode enabled
- ESLint configuration with React-specific rules (react-hooks, react-refresh)
- Jest for unit testing with ts-jest transformer
- Vercel deployment configuration present

### Important Constants & Configuration
- Daily Huddle Form ID: `dafa7c7a-1294-40bd-9367-518e74f29418`
- Projects Board ID (hardcoded): `db9203fc-7425-477f-a2a4-ef304dcb4da7`
- Daily Huddle cutoff: 6 PM (18:00)
- User data cache duration: 5 minutes
- Rockefeller Habits: 10 predefined business habits with sub-items

### Development Proxy Configuration
Vite dev server (port 5173) proxies API calls for:
- `/companies` → Backend API domain
- `/employees` → Backend API domain  
- `/documents` → Backend API domain
- Vite optimizeDeps excludes `lucide-react` for performance

### Key Business Logic
- **Trello-style Kanban**: Drag-drop lists and cards with position tracking
- **Daily Huddle System**: Time-based form submissions with employee responses
- **Multi-platform E-commerce**: Shopee, Lazada, Shopify analytics integration
- **Document Management**: TipTap editor with file uploads and drag-drop organization
- **Rockefeller Habits Checklist**: 10 business execution habits with tracking

## Implementation Status - Projects Feature Security (Completed)

### ✅ PROJECTS FEATURE SECURITY MIGRATION - COMPLETED

**Backend Status**: ✅ COMPLETED - Multi-tenant security implementation finished
**Frontend Status**: ✅ COMPLETED - Projects feature now uses secure company-based endpoints

#### ✅ What Was Completed (Projects Feature Only):

**Phase 1: Infrastructure** ✅
- Created `src/shared/hooks/useCompanyContext.ts` - Company context hooks for all teams to use
- Added `useCompanyContext()`, `useRequiredCompanyId()`, and `useSafeCompanyId()` utilities

**Phase 2: Projects Board Service** ✅
- Updated `src/features/projects/services/useBoard.ts`:
  - Added `getCompanyBoardDetails(companyId)` - secure company-based board access
  - Deprecated `getBoardDetails()` with backward compatibility
  - Kept `HARDCODED_BOARD_ID` constant for other teams' compatibility

**Phase 3: Projects Component** ✅
- Updated `src/features/projects/components/Projects.tsx`:
  - Integrated company context using `useSafeCompanyId()` and `useCompanyContext()`
  - Removed dependency on hardcoded board ID
  - Added proper loading states and error handling for company data
  - Updated all CRUD operations to use company ID

**Phase 4: Shared Services** ✅
- Updated all shared Trello services with company ID parameter and backward compatibility:
  - `src/shared/components/trello/services/useCard.ts` - `createCard()`, `updateCard()`, `deleteCard()`
  - `src/shared/components/trello/services/useList.ts` - `createList()`, `updateList()`, `deleteList()`
  - Added secure company-based endpoints with fallback to legacy endpoints
  - Maintained backward compatibility for Resources and Sales teams

#### ✅ Security Achievements for Projects:
- **Eliminated Vulnerability**: Projects no longer uses hardcoded board ID `'db9203fc-7425-477f-a2a4-ef304dcb4da7'`
- **Company Isolation**: Projects data properly isolated by company
- **Auto-Creation**: Company boards auto-created on first access via `/trello/company/{companyId}/board`
- **Secure Operations**: All Projects CRUD operations validate company ownership
- **Proper Error Handling**: 403 Forbidden responses handled gracefully

#### 🚨 REMAINING SECURITY VULNERABILITIES (Other Teams):

**Resources Team** - Still using hardcoded board IDs:
- `src/features/resources/services/useBoard.ts` contains:
  - `HARDCODED_BOARD_ID = 'fe279d07-c6c4-42ac-bf6e-d36924dac4b1'`
  - `PASSWORD_BOARD_ID = 'a4c660de-d84c-4b65-b2b2-eed47a9da30d'`
  - `DIGITAL_ASSETS_BOARD_ID = '9ab427f7-f0bb-4c38-85fb-cd8640eab000'`
- `src/features/resources/components/Resources.tsx` needs company context integration

**Sales Team** - Still using hardcoded board ID:
- `src/features/sales/services/useBoard.ts` contains `HARDCODED_BOARD_ID = '0b9d94dd-1796-43f3-8021-5e22f923ef8a'`
- `src/features/sales/components/Sales.tsx` needs company context integration

#### 📋 Migration Guide for Other Teams:

**For Resources Team:**
1. Update `src/features/resources/services/useBoard.ts`:
   - Replace `getBoardDetails(boardId)` with `getCompanyBoardDetails(companyId)`
   - Remove all hardcoded board ID constants
2. Update `src/features/resources/components/Resources.tsx`:
   - Import `useSafeCompanyId` from `src/shared/hooks/useCompanyContext`
   - Replace hardcoded board access with company-based board loading
3. Decide resource categorization strategy (single company board vs. separate lists)

**For Sales Team:**
1. Update `src/features/sales/services/useBoard.ts`:
   - Replace `getBoardDetails(SALES_BOARD_ID)` with `getCompanyBoardDetails(companyId)`
   - Remove hardcoded board ID constant
2. Update `src/features/sales/components/Sales.tsx`:
   - Import `useSafeCompanyId` from `src/shared/hooks/useCompanyContext`
   - Replace hardcoded board access with company-based board loading

**Shared Infrastructure Ready:**
- ✅ Company context hooks available for immediate use
- ✅ All shared services support company ID parameter
- ✅ Backward compatibility maintained during migration
- ✅ Clear example implementation in Projects feature