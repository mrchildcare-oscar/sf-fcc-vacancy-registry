# SF Family Child Care Vacancy Registry

A web platform helping licensed Family Child Care providers in San Francisco report vacancies and connect with families seeking childcare.

**Live Demo:** [beta.familychildcaresf.com](https://beta.familychildcaresf.com)

![Public Listings](docs/screenshot-1-public-listings.png)

## Features

### For Families
- **Search** licensed providers by neighborhood, age group, language, and schedule
- **Real-time availability** - see current openings, upcoming spots, and waitlist status
- **Filter** by infant, toddler, preschool, or school-age spots

### For Providers
- **Vacancy Management** - update availability by age group with one click
- **Roster Tracking** - manage enrolled children, auto-calculate ages and capacity
- **Capacity Projections** - visualize when children transition between age groups
- **Embeddable Widget** - display live vacancy status on your own website
- **CSV Import/Export** - bulk manage roster and vacancy data

### For Organizations (Multi-Location)
- **Dashboard** - manage all locations from a single login
- **Bulk Updates** - import/export vacancy data across locations
- **Widget Integration** - embed multi-location availability on organization website

## Tech Stack

- **Frontend:** React 18, TypeScript, Tailwind CSS
- **Backend:** Supabase (PostgreSQL, Auth, Row-Level Security)
- **Build:** Vite
- **Deployment:** Vercel
- **Analytics:** Vercel Analytics & Speed Insights

## Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Public Site   │     │ Provider Portal │     │  Org Dashboard  │
│  (React SPA)    │     │   (Auth/RLS)    │     │  (Multi-tenant) │
└────────┬────────┘     └────────┬────────┘     └────────┬────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                    ┌────────────▼────────────┐
                    │   Supabase Backend      │
                    │  - PostgreSQL Database  │
                    │  - Auth (Email/Google)  │
                    │  - Row-Level Security   │
                    │  - Public API Functions │
                    └─────────────────────────┘
```

## Database Schema

- **organizations** - Multi-location business entities
- **providers** - Individual childcare locations (can be standalone or under an org)
- **vacancies** - Current availability by age group (1:1 with provider)

See [Database Design](docs/Database-Design.md) for full schema and RLS policies.

## Embeddable Widget

Providers can embed a live vacancy widget on their website:

```html
<!-- Single Provider -->
<div id="fcc-vacancy-widget" data-provider="384004210"></div>
<script src="https://beta.familychildcaresf.com/widget.js"></script>

<!-- Organization (Multiple Locations) -->
<div id="fcc-vacancy-widget"
     data-org="modern-education"
     data-link-base="https://www.example.com">
</div>
<script src="https://beta.familychildcaresf.com/widget.js"></script>
```

## External API Integration

Integrates with California's CDSS (Community Care Licensing Division) data for license verification. See [CDSS License API Documentation](docs/CDSS-License-API.md).

## Getting Started

### Prerequisites
- Node.js 18+
- Supabase account

### Installation

```bash
# Clone the repo
git clone https://github.com/mrchildcare-oscar/sf-fcc-vacancy-registry.git
cd sf-fcc-vacancy-registry

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your Supabase credentials

# Run development server
npm run dev
```

### Environment Variables

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

## Documentation

- [Database Design](docs/Database-Design.md) - Schema, RLS policies, API functions
- [CDSS License API](docs/CDSS-License-API.md) - California childcare license lookup
- [Provider Guide (English)](docs/Provider-Guide-EN.md)
- [Provider Guide (中文)](docs/Provider-Guide-ZH-TW.md)

## Screenshots

| Public Search | Provider Dashboard |
|---------------|-------------------|
| ![Search](docs/screenshot-1-public-listings.png) | ![Dashboard](docs/screenshot-5-vacancy-form.png) |

| Roster Management | Organization Dashboard |
|-------------------|----------------------|
| ![Roster](docs/screenshot-8-roster.png) | ![Org](docs/screenshot-7-organization-dashboard.png) |

## License

MIT

## Author

**Oscar Tang** - [mrchildcare-oscar](https://github.com/mrchildcare-oscar)

---

*Built to support San Francisco's Family Child Care community*
