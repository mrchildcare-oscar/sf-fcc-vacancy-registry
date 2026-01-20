# California CDSS License Lookup API

This document describes how to access California's Community Care Licensing Division (CCLD) data via API to look up childcare provider license information.

## API Overview

California's Health and Human Services Open Data Portal provides access to childcare licensing data through a CKAN-based API.

**Base URL:** `https://data.chhs.ca.gov`

**Dataset:** Community Care Licensing Facilities

### Resource IDs

| Facility Type | Resource ID |
|---------------|-------------|
| **Family Child Care Homes** | `4b5cc48d-03b1-4f42-a7d1-b9816903eb2b` |
| **Child Care Centers** | `7aed8063-cea7-4367-8651-c81643164ae0` |

---

## Quick Start Examples

### Family Child Care Homes

```bash
# Look up FCC by license number
curl "https://data.chhs.ca.gov/api/3/action/datastore_search?resource_id=4b5cc48d-03b1-4f42-a7d1-b9816903eb2b&filters=%7B%22facility_number%22%3A%22384004346%22%7D"

# Search FCC by county
curl "https://data.chhs.ca.gov/api/3/action/datastore_search?resource_id=4b5cc48d-03b1-4f42-a7d1-b9816903eb2b&filters=%7B%22county_name%22%3A%22SAN%20FRANCISCO%22%7D&limit=100"
```

### Child Care Centers

```bash
# Look up Center by license number
curl "https://data.chhs.ca.gov/api/3/action/datastore_search?resource_id=7aed8063-cea7-4367-8651-c81643164ae0&filters=%7B%22facility_number%22%3A%22384001234%22%7D"

# Search Centers by county
curl "https://data.chhs.ca.gov/api/3/action/datastore_search?resource_id=7aed8063-cea7-4367-8651-c81643164ae0&filters=%7B%22county_name%22%3A%22SAN%20FRANCISCO%22%7D&limit=100"
```

### SQL Query (More Flexible)

```bash
# FCC SQL query
curl "https://data.chhs.ca.gov/api/3/action/datastore_search_sql?sql=SELECT%20*%20FROM%20%224b5cc48d-03b1-4f42-a7d1-b9816903eb2b%22%20WHERE%20facility_number%20%3D%20%27384004346%27"

# Child Care Center SQL query
curl "https://data.chhs.ca.gov/api/3/action/datastore_search_sql?sql=SELECT%20*%20FROM%20%227aed8063-cea7-4367-8651-c81643164ae0%22%20WHERE%20county_name%20%3D%20%27SAN%20FRANCISCO%27%20AND%20facility_status%20%3D%20%27LICENSED%27"
```

---

## JavaScript/TypeScript Example

```typescript
// Resource IDs for different facility types
const RESOURCE_IDS = {
  FAMILY_CHILD_CARE: '4b5cc48d-03b1-4f42-a7d1-b9816903eb2b',
  CHILD_CARE_CENTER: '7aed8063-cea7-4367-8651-c81643164ae0',
};

const BASE_URL = 'https://data.chhs.ca.gov/api/3/action';

interface FacilityRecord {
  facility_type: string;
  facility_number: string;        // License number (e.g., "384004346")
  facility_name: string;          // Business name
  licensee: string;               // License holder name
  facility_administrator: string;
  facility_telephone_number: string;
  facility_address: string;       // Note: Usually "Unavailable" for privacy
  facility_city: string;
  facility_state: string;
  facility_zip: string;
  county_name: string;
  regional_office: string;
  facility_capacity: string;      // Max children (e.g., "8" or "14")
  facility_status: string;        // "LICENSED" or "CLOSED"
  license_first_date: string;     // Format: "M/D/YYYY"
  closed_date: string | null;
  file_date: string;              // Data freshness date
}

interface ApiResponse {
  success: boolean;
  result: {
    records: FacilityRecord[];
    total: number;
  };
}

type FacilityType = 'FAMILY_CHILD_CARE' | 'CHILD_CARE_CENTER';

/**
 * Look up a facility by license number
 * @param licenseNumber - The 9-digit license number
 * @param facilityType - 'FAMILY_CHILD_CARE' or 'CHILD_CARE_CENTER'
 */
async function lookupLicense(
  licenseNumber: string,
  facilityType: FacilityType = 'FAMILY_CHILD_CARE'
): Promise<FacilityRecord | null> {
  const resourceId = RESOURCE_IDS[facilityType];
  const filters = JSON.stringify({ facility_number: licenseNumber });
  const url = `${BASE_URL}/datastore_search?resource_id=${resourceId}&filters=${encodeURIComponent(filters)}`;

  const response = await fetch(url);
  const data: ApiResponse = await response.json();

  if (data.success && data.result.records.length > 0) {
    return data.result.records[0];
  }
  return null;
}

/**
 * Search for facilities by county
 * @param county - County name (e.g., "SAN FRANCISCO")
 * @param facilityType - 'FAMILY_CHILD_CARE' or 'CHILD_CARE_CENTER'
 * @param limit - Max records to return
 */
async function searchByCounty(
  county: string,
  facilityType: FacilityType = 'FAMILY_CHILD_CARE',
  limit = 100
): Promise<FacilityRecord[]> {
  const resourceId = RESOURCE_IDS[facilityType];
  const filters = JSON.stringify({ county_name: county.toUpperCase() });
  const url = `${BASE_URL}/datastore_search?resource_id=${resourceId}&filters=${encodeURIComponent(filters)}&limit=${limit}`;

  const response = await fetch(url);
  const data: ApiResponse = await response.json();

  return data.success ? data.result.records : [];
}

/**
 * Search with SQL query (more flexible)
 * @param whereClause - SQL WHERE clause
 * @param facilityType - 'FAMILY_CHILD_CARE' or 'CHILD_CARE_CENTER'
 */
async function searchWithSQL(
  whereClause: string,
  facilityType: FacilityType = 'FAMILY_CHILD_CARE'
): Promise<FacilityRecord[]> {
  const resourceId = RESOURCE_IDS[facilityType];
  const sql = `SELECT * FROM "${resourceId}" WHERE ${whereClause}`;
  const url = `${BASE_URL}/datastore_search_sql?sql=${encodeURIComponent(sql)}`;

  const response = await fetch(url);
  const data: ApiResponse = await response.json();

  return data.success ? data.result.records : [];
}

// Usage examples:
async function examples() {
  // === Family Child Care Homes ===

  // Look up specific FCC license
  const fccProvider = await lookupLicense('384004346', 'FAMILY_CHILD_CARE');
  console.log(fccProvider);
  // Returns: { facility_name: "ACEVES, ROSAURA", facility_status: "LICENSED", ... }

  // Get all SF Family Child Care Homes
  const sfFCCs = await searchByCounty('SAN FRANCISCO', 'FAMILY_CHILD_CARE');
  console.log(`Found ${sfFCCs.length} SF Family Child Care Homes`);


  // === Child Care Centers ===

  // Look up specific Center license
  const center = await lookupLicense('380700001', 'CHILD_CARE_CENTER');
  console.log(center);
  // Returns: { facility_name: "...", facility_address: "123 Main St", ... }

  // Get all SF Child Care Centers
  const sfCenters = await searchByCounty('SAN FRANCISCO', 'CHILD_CARE_CENTER');
  console.log(`Found ${sfCenters.length} SF Child Care Centers`);


  // === SQL Queries ===

  // Find all licensed FCCs in SF with capacity >= 12
  const largeFCCs = await searchWithSQL(
    "county_name = 'SAN FRANCISCO' AND facility_status = 'LICENSED' AND CAST(facility_capacity AS INTEGER) >= 12",
    'FAMILY_CHILD_CARE'
  );
  console.log(`Found ${largeFCCs.length} large FCCs in SF`);

  // Find all licensed Centers in SF with capacity >= 50
  const largeCenters = await searchWithSQL(
    "county_name = 'SAN FRANCISCO' AND facility_status = 'LICENSED' AND CAST(facility_capacity AS INTEGER) >= 50",
    'CHILD_CARE_CENTER'
  );
  console.log(`Found ${largeCenters.length} large Centers in SF`);
}
```

---

## API Endpoints

### 1. `datastore_search` - Simple Filtering

```
GET /api/3/action/datastore_search
```

**Parameters:**
| Parameter | Description | Example |
|-----------|-------------|---------|
| `resource_id` | Dataset resource ID (required) | `4b5cc48d-03b1-4f42-a7d1-b9816903eb2b` |
| `filters` | JSON object with field:value pairs | `{"facility_number":"384004346"}` |
| `limit` | Max records to return (default 100) | `50` |
| `offset` | Pagination offset | `100` |
| `fields` | Comma-separated list of fields to return | `facility_name,facility_status` |

### 2. `datastore_search_sql` - SQL Queries

```
GET /api/3/action/datastore_search_sql
```

**Parameters:**
| Parameter | Description |
|-----------|-------------|
| `sql` | Full SQL SELECT statement |

**Example SQL queries:**
```sql
-- All licensed SF providers
SELECT * FROM "4b5cc48d-03b1-4f42-a7d1-b9816903eb2b"
WHERE county_name = 'SAN FRANCISCO' AND facility_status = 'LICENSED'

-- Search by partial name
SELECT * FROM "4b5cc48d-03b1-4f42-a7d1-b9816903eb2b"
WHERE facility_name ILIKE '%garcia%'

-- Count by county
SELECT county_name, COUNT(*) as count
FROM "4b5cc48d-03b1-4f42-a7d1-b9816903eb2b"
WHERE facility_status = 'LICENSED'
GROUP BY county_name
ORDER BY count DESC
```

---

## Response Format

```json
{
  "success": true,
  "result": {
    "resource_id": "4b5cc48d-03b1-4f42-a7d1-b9816903eb2b",
    "records": [
      {
        "facility_type": "FAMILY DAY CARE HOME",
        "facility_number": "384004346",
        "facility_name": "ACEVES, ROSAURA",
        "licensee": "ACEVES, ROSAURA",
        "facility_administrator": "ACEVES, ROSAURA",
        "facility_telephone_number": "(415) 424-6628",
        "facility_address": "Unavailable",
        "facility_city": "SAN FRANCISCO",
        "facility_state": "CA",
        "facility_zip": "94112",
        "county_name": "SAN FRANCISCO",
        "regional_office": "05",
        "facility_capacity": "14",
        "facility_status": "LICENSED",
        "license_first_date": "11/25/2020",
        "closed_date": null,
        "file_date": "05252025"
      }
    ],
    "total": 1
  }
}
```

---

## Available Data Fields

| Field | Description | Example |
|-------|-------------|---------|
| `facility_type` | Always "FAMILY DAY CARE HOME" for FCC | `FAMILY DAY CARE HOME` |
| `facility_number` | 9-digit license number | `384004346` |
| `facility_name` | Business/owner name | `ACEVES, ROSAURA` |
| `licensee` | License holder | `ACEVES, ROSAURA` |
| `facility_administrator` | Administrator name | `ACEVES, ROSAURA` |
| `facility_telephone_number` | Contact phone | `(415) 424-6628` |
| `facility_address` | Street address | Usually `Unavailable` |
| `facility_city` | City | `SAN FRANCISCO` |
| `facility_state` | State | `CA` |
| `facility_zip` | ZIP code | `94112` |
| `county_name` | County (uppercase) | `SAN FRANCISCO` |
| `regional_office` | CCLD regional office number | `05` |
| `facility_capacity` | Licensed capacity | `14` |
| `facility_status` | `LICENSED` or `CLOSED` | `LICENSED` |
| `license_first_date` | Original license date | `11/25/2020` |
| `closed_date` | Closure date (if closed) | `null` |
| `file_date` | Data export date | `05252025` |

---

## Other Facility Type Resources

| Facility Type | Resource ID |
|---------------|-------------|
| Family Child Care Homes | `4b5cc48d-03b1-4f42-a7d1-b9816903eb2b` |
| Child Care Centers | `7aed8063-cea7-4367-8651-c81643164ae0` |
| Foster Family Agencies | `5f5f7124-1a38-4b61-93b9-4e4be3b3b07d` |
| Adult Residential Facilities | `9f5d1d00-6b24-4f44-a158-9cbe4b43f117` |
| Residential Care for Elderly | `744d1583-f9eb-45b6-b0f8-b9a9dab936a6` |

---

## Key Differences Between Facility Types

| Feature | Family Child Care Homes | Child Care Centers |
|---------|------------------------|-------------------|
| `facility_type` value | `FAMILY DAY CARE HOME` | `DAY CARE CENTER` |
| Address availability | `Unavailable` (privacy) | Full address provided |
| Typical capacity | 8-14 children | 20-200+ children |
| License format | Starts with `384` (SF) | Varies by region |
| Location | Home-based | Commercial facility |

---

## Important Notes

1. **Privacy**: Family Child Care Home addresses are marked as "Unavailable" for privacy protection. Child Care Centers include full addresses.
2. **Data Freshness**: Check the `file_date` field for data export date (updated periodically)
3. **Rate Limits**: No documented rate limits, but be respectful with request frequency
4. **No API Key Required**: This is a public API, no authentication needed
5. **License Number Format**: FCC licenses in San Francisco start with `384`. Center licenses vary by region.

---

## Links

- **Dataset Page**: https://data.chhs.ca.gov/dataset/ccl-facilities
- **CKAN API Docs**: https://docs.ckan.org/en/2.9/api/
- **CDSS Facility Search (Web)**: https://www.ccld.dss.ca.gov/carefacilitysearch/
- **Contact**: opendata@cdss.ca.gov

---

*Last updated: January 2025*
