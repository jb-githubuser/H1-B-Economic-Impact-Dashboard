# H-1B Economic Impact Dashboard

**CS 554: Advanced Database Systems - Final Project**

A full-stack web application that analyzes the economic impact of H-1B visa holders across U.S. industries and states, helping stakeholders understand how changes in immigration policy could affect the American economy.

---

## 📊 Project Overview

This dashboard provides comprehensive analytics on H-1B visa applications, including:
- **Geographic Heatmap**: Interactive US map showing H-1B application distribution by state
- **Industry Analysis**: Top industries by application volume, average wages, and employer counts
- **State Analysis**: Regional economic impact metrics and workforce concentration
- **Interactive Filters**: Dynamic filtering by year, industry, and state

**Key Research Question**: *Where is critical H-1B expertise concentrated, and how would shifts in U.S. immigration policy affect regional and industry-specific economies?*

---

## 🛠️ Tech Stack

- **Frontend**: Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS 4
- **Backend**: Next.js API Routes (serverless functions)
- **Database**: PostgreSQL 16 on Google Cloud SQL
- **Visualization**: Recharts, react-simple-maps
- **Data**: 1.6M+ H-1B application records (2022-2024)

---

## 📁 Project Structure

```
H1-B-Economic-Impact-Dashboard/
├── frontend/                  # Next.js application
│   ├── app/
│   │   ├── api/              # API routes for data fetching
│   │   │   ├── industry-metrics/route.ts
│   │   │   └── state-metrics/route.ts
│   │   ├── page.tsx          # Main dashboard page
│   │   └── layout.tsx        # Root layout
│   ├── components/           # React components
│   │   ├── StateHeatmap.tsx  # US map visualization
│   │   ├── IndustryCharts.tsx
│   │   ├── StateCharts.tsx
│   │   └── DashboardFilters.tsx
│   ├── lib/
│   │   ├── db.ts            # Database connection pool
│   │   └── types.ts         # TypeScript interfaces
│   └── package.json
├── database/                 # Database setup & ETL
│   ├── schema.sql           # PostgreSQL schema definition
│   ├── load_data_fast.py    # ETL script for H-1B data
│   ├── load_naics_lookup.py # NAICS industry code loader
│   └── GCP_SETUP_GUIDE.md   # Cloud SQL setup instructions
├── analysis/                 # Python analysis scripts
│   └── feature1_industry_analysis.py
└── data/                    # Raw CSV data (not in Git)
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** (v20 or higher): [Download](https://nodejs.org/)
- **PostgreSQL Client** (v16 or higher):
  ```bash
  # macOS
  brew install postgresql@17

  # Ubuntu/Debian
  sudo apt install postgresql-client-16
  ```
- **Python** (v3.9+): For ETL scripts (optional)
- **GCP Account**: With Cloud SQL instance running (see [database/GCP_SETUP_GUIDE.md](database/GCP_SETUP_GUIDE.md))

---

## 📦 Installation

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/H1-B-Economic-Impact-Dashboard.git
cd H1-B-Economic-Impact-Dashboard
```

### 2. Set Up Environment Variables

Create a `.env.local` file in the `frontend/` directory:

```bash
cd frontend
cp ../.env.example .env.local
```

Edit `.env.local` with your database credentials:

```env
# PostgreSQL Database Connection
DB_HOST=your.gcp.ip.address
DB_PORT=5432
DB_NAME=h1b_economic_impact
DB_USER=postgres
DB_PASSWORD=your_password_here

# Full Connection String
DATABASE_URL=postgresql://postgres:your_password_here@your.gcp.ip.address:5432/h1b_economic_impact
```

> **Note**: Replace `your.gcp.ip.address` and `your_password_here` with your actual Cloud SQL credentials.

### 3. Install Frontend Dependencies

```bash
cd frontend
npm install
```

---

## 🗄️ Database Setup

### Option 1: Connect to Existing GCP Instance

If your team has already set up the database, you just need the connection details:

1. Get the public IP address from GCP Console → Cloud SQL
2. Add your IP to authorized networks (or ask a team member to do so)
3. Update `.env.local` with the connection details
4. Test the connection:

```bash
psql -h YOUR_GCP_IP -U postgres -d h1b_economic_impact
```

### Option 2: Set Up Your Own Database

Follow the detailed guide in [database/GCP_SETUP_GUIDE.md](database/GCP_SETUP_GUIDE.md) to:
1. Create a Cloud SQL PostgreSQL instance
2. Run the schema (`schema.sql`)
3. Load NAICS lookup data
4. Import H-1B application data

**Quick Start:**

```bash
# 1. Create schema
cd database
psql -h YOUR_GCP_IP -U postgres -d h1b_economic_impact -f schema.sql

# 2. Load NAICS industry codes
python load_naics_lookup.py

# 3. Load H-1B data (requires CSV files in ../data/)
python load_data_fast.py

# 4. Refresh materialized views
psql -h YOUR_GCP_IP -U postgres -d h1b_economic_impact -c "SELECT refresh_all_views();"
```

---

## 🏃 Running the Application Locally

### Start the Development Server

```bash
cd frontend
npm run dev
```

The application will be available at:
- **Local**: http://localhost:3000
- **Network**: http://YOUR_LOCAL_IP:3000

### Verify Everything Works

1. **Check Database Connection**: Open http://localhost:3000 and verify data loads
2. **Test Filters**: Try changing year, industry, and state filters
3. **Hover Over Map**: Ensure tooltips show state names and application counts
4. **Check API Routes**:
   - http://localhost:3000/api/state-metrics?year=2024
   - http://localhost:3000/api/industry-metrics?year=2024

---

## 🔧 Development Commands

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm run start

# Run linter
npm run lint
```

---

## 📊 Database Schema Overview

### Main Tables

1. **`employers`**: Unique employer information (FEIN, name, NAICS industry code)
2. **`occupations`**: SOC (Standard Occupational Classification) codes and job titles
3. **`worksite_locations`**: Geographic locations where H-1B workers are placed
4. **`applications`**: Main H-1B application records (wages, status, dates)
5. **`naics_lookup`**: Industry classification code to name mapping

### Materialized Views (for Performance)

- **`mv_industry_metrics`**: Pre-aggregated metrics by industry and fiscal year
- **`mv_state_metrics`**: Pre-aggregated metrics by state and fiscal year
- **`mv_occupation_metrics`**: Pre-aggregated metrics by occupation

**Refresh Views After Data Changes:**
```sql
SELECT refresh_all_views();
```

---

## 🎨 Key Features

### 1. Geographic Heatmap
- Interactive US map with color-coded states
- Hover tooltips showing state name and application count
- Color scale from light blue (fewer applications) to dark blue (more applications)

### 2. Industry Analysis
- Top 10 industries by application volume (bar chart)
- Average and median wages by industry
- Detailed statistics table with employer counts

### 3. State Analysis
- Top 15 states by application volume (bar chart)
- Total wages by state (in millions)
- Regional economic impact metrics

### 4. Dynamic Filters
- **Year**: 2020-2024
- **Industry**: Filter by NAICS industry code
- **State**: Filter by US state abbreviation

---

## 🐛 Troubleshooting

### Database Connection Fails

**Error**: `connection refused` or `timeout`

**Solutions**:
1. Check that GCP Cloud SQL instance is running
2. Verify your IP is whitelisted in GCP Console → Cloud SQL → Connections → Authorized Networks
3. Test connection with psql: `psql -h YOUR_GCP_IP -U postgres -d h1b_economic_impact`
4. Check firewall rules on your local machine

### No Data Showing on Dashboard

**Possible Causes**:
1. Database is empty → Run ETL scripts to load data
2. Materialized views not refreshed → Run `SELECT refresh_all_views();`
3. Environment variables incorrect → Check `.env.local`

**Verify Data Exists**:
```sql
SELECT COUNT(*) FROM applications;
SELECT COUNT(*) FROM mv_state_metrics;
SELECT COUNT(*) FROM mv_industry_metrics;
```

### Numbers Have Leading Zeros (e.g., "019318")

**Fixed in Latest Version**: API routes now convert PostgreSQL `BIGINT` strings to numbers.

If you still see this issue:
1. Pull latest changes from `main` branch
2. Restart the dev server: `npm run dev`

### Map Not Displaying

**Possible Causes**:
1. Internet connection required to load GeoJSON from CDN
2. Browser console shows CORS errors → Check network tab

**Quick Fix**: Refresh the page

---

## 📈 Performance Optimization

### Materialized Views

Our dashboard uses materialized views to pre-compute aggregations, reducing query time from seconds to milliseconds:

```sql
-- Instead of this (slow):
SELECT state, COUNT(*), AVG(wage)
FROM applications
JOIN worksite_locations ON ...
WHERE fiscal_year = 2024
GROUP BY state;

-- We query this (fast):
SELECT * FROM mv_state_metrics
WHERE fiscal_year = 2024;
```

### Connection Pooling

The database connection pool (`lib/db.ts`) reuses connections to reduce overhead:
- **Max Connections**: 20
- **Idle Timeout**: 30 seconds
- **Connection Timeout**: 2 seconds

---

## 🚢 Deployment

### Deploy to Vercel (Recommended)

1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com) and import your repository
3. Add environment variables in Vercel dashboard:
   - `DB_HOST`
   - `DB_PORT`
   - `DB_NAME`
   - `DB_USER`
   - `DB_PASSWORD`
4. Deploy!

**Important**: Make sure your GCP Cloud SQL instance allows connections from Vercel's IP ranges (or use `0.0.0.0/0` for development).

### Deploy to GCP App Engine

See [Next.js GCP Deployment Guide](https://cloud.google.com/appengine/docs/flexible/nodejs/quickstart)

---

## 👥 Team

- **Jayden Bai**
- **Unnati**
- **Avery**

**Course**: CS 554 - Advanced Database Systems
**Institution**: Stevens Institute of Technology
**Semester**: Fall 2024

---

## 📝 License

This project is for academic purposes only.

---

## 🙏 Acknowledgments

- H-1B data sourced from [U.S. Department of Labor](https://www.dol.gov/)
- GeoJSON maps from [us-atlas](https://github.com/topojson/us-atlas)
- Built with [Next.js](https://nextjs.org/), [Recharts](https://recharts.org/), and [react-simple-maps](https://www.react-simple-maps.io/)
