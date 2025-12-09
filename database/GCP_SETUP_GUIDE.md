# GCP Cloud SQL PostgreSQL Setup Guide

## Step 1: Create Cloud SQL Instance

### 1.1 Go to Google Cloud Console
1. Navigate to https://console.cloud.google.com
2. Make sure you're in the correct project (or create a new one for this class)
3. **Apply your GCP credits** to this project:
   - Go to Billing → Credits
   - Apply your class credits

### 1.2 Create PostgreSQL Instance
1. Search for "Cloud SQL" in the search bar
2. Click **"Create Instance"**
3. Choose **PostgreSQL**
4. Configure the instance:

**Basic Settings:**
- **Instance ID**: `h1b-dashboard` (or your choice)
- **Password**: Create a strong password for the `postgres` user (save this!)
- **Database version**: **PostgreSQL 16** (latest)
- **Region**: Choose closest to your location (e.g., `us-east1`, `us-west1`)

**Configuration:**
- **Preset**: Choose **"Development"** or configure manually:
  - **Machine type**: Shared core → **db-f1-micro** (1 vCPU, 0.6GB RAM) - cheapest
  - For better performance: **db-g1-small** (1 vCPU, 1.7GB RAM)
- **Storage**:
  - Type: **SSD**
  - Capacity: **10 GB** (auto-increases if needed)
  - Enable automatic storage increases: ✓

**Connections:**
- **Public IP**: Enable (for development)
- **Private IP**: Leave unchecked (for now)
- **Authorized networks**: Add your IP addresses
  - Click "Add Network"
  - Name: "My laptop" (or team member names)
  - Network: Get your IP from https://whatismyip.com
  - Add entries for each team member (Jayden, Unnati, Avery)
  - **OR** for development only: `0.0.0.0/0` (allows all IPs - less secure)

**Backups & Maintenance:**
- Enable automated backups: ✓
- Backup window: Choose a time when you won't be working

4. Click **"CREATE INSTANCE"**
5. Wait 5-10 minutes for instance to be created

### 1.3 Cost Estimate
- **db-f1-micro**: ~$10-15/month
- **db-g1-small**: ~$25-35/month
- With $300 GCP credits, this will last many months

## Step 2: Create Database

1. Once instance is running, click on it
2. Go to **"Databases"** tab
3. Click **"Create Database"**
4. Database name: `h1b_economic_impact`
5. Click **"Create"**

## Step 3: Get Connection Details

### 3.1 Find Connection Information
1. Click on your instance name
2. Go to **"Overview"** tab
3. Note down:
   - **Public IP address**: (e.g., `34.123.45.67`)
   - **Connection name**: (e.g., `project-id:region:instance-name`)

### 3.2 Create .env File
Create a file at the project root: `.env`

```bash
# PostgreSQL Connection Details
DB_HOST=YOUR_PUBLIC_IP_HERE
DB_PORT=5432
DB_NAME=h1b_economic_impact
DB_USER=postgres
DB_PASSWORD=YOUR_PASSWORD_HERE

# Full connection string
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD_HERE@YOUR_PUBLIC_IP_HERE:5432/h1b_economic_impact
```

**Replace:**
- `YOUR_PUBLIC_IP_HERE` with your instance's public IP
- `YOUR_PASSWORD_HERE` with the password you set

## Step 4: Test Connection

### 4.1 Install PostgreSQL Client (if not already installed)
```bash
# macOS
brew install postgresql@16

# Check installation
psql --version
```

### 4.2 Test Connection
```bash
psql -h YOUR_PUBLIC_IP -U postgres -d h1b_economic_impact
# Enter password when prompted
```

If successful, you'll see:
```
h1b_economic_impact=>
```

Type `\q` to exit.

## Step 5: Create Schema

### 5.1 Run Schema File
```bash
cd database
psql -h YOUR_PUBLIC_IP -U postgres -d h1b_economic_impact -f schema.sql
```

This creates:
- 4 main tables: `employers`, `occupations`, `worksite_locations`, `applications`
- 3 materialized views for fast queries
- 1 NAICS lookup table
- Indexes for performance

### 5.2 Verify Schema
```bash
psql -h YOUR_PUBLIC_IP -U postgres -d h1b_economic_impact

# List all tables
\dt

# Check table structure
\d applications
```

## Step 6: Load NAICS Lookup Data

We need to populate the NAICS lookup table first (for industry names).

```bash
cd database
# Run the NAICS load script (we'll create this next)
python load_naics_lookup.py
```

## Step 7: Load H-1B Data

Now load your cleaned CSV data into the database.

```bash
cd database
# Run the ETL script (we'll create this next)
python load_data.py --years 2022 2023 2024
```

## Step 8: Verify Data

```sql
-- Connect to database
psql -h YOUR_PUBLIC_IP -U postgres -d h1b_economic_impact

-- Check record counts
SELECT COUNT(*) FROM applications;
SELECT COUNT(*) FROM employers;
SELECT COUNT(*) FROM occupations;

-- Test a query
SELECT
    e.industry,
    COUNT(*) as total_apps,
    AVG(a.annual_wage) as avg_wage
FROM applications a
JOIN employers e ON a.emp_id = e.emp_id
WHERE a.fiscal_year = 2024
GROUP BY e.industry
ORDER BY total_apps DESC
LIMIT 10;
```

## Sharing with Team

### Option 1: Share Connection Details (Secure)
1. Each team member adds their IP to authorized networks in GCP Console
2. Share the `.env` file via secure channel (not GitHub!)
3. They can connect from their machines

### Option 2: Use Cloud SQL Proxy (More Secure)
```bash
# Download Cloud SQL Proxy
curl -o cloud_sql_proxy https://dl.google.com/cloudsql/cloud_sql_proxy.darwin.amd64
chmod +x cloud_sql_proxy

# Run proxy (in background)
./cloud_sql_proxy -instances=CONNECTION_NAME=tcp:5432
```

Then connect via `localhost`:
```bash
psql -h 127.0.0.1 -U postgres -d h1b_economic_impact
```

## Troubleshooting

### Can't Connect?
1. Check IP is whitelisted in GCP Console → Cloud SQL → Connections → Authorized Networks
2. Verify public IP is enabled
3. Check firewall settings

### Password Issues?
1. Reset password in GCP Console → Cloud SQL → Users

### Out of Storage?
1. GCP Cloud SQL auto-increases storage
2. Check billing to ensure credits are applied

## Next Steps

Once database is set up:
1. ✅ Run ETL scripts to load data
2. ✅ Test queries for Feature 1
3. ✅ Build Next.js API routes to query database
4. ✅ Create dashboard frontend
