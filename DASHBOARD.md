# Bruno AI Dashboard

## Quick Access

You can access the dashboard directly without login by using the public endpoint:

```
https://bruno-ai-api.onrender.com/api/dashboard/public
```

This endpoint provides sample dashboard data for demonstration purposes, without requiring authentication.

## Dashboard API Endpoints

### Public Endpoints (No Authentication Required)

- **GET /api/dashboard/public**: Get sample dashboard data without authentication

### Protected Endpoints (Authentication Required)

- **GET /api/dashboard**: Get the main dashboard data
- **GET /api/dashboard/analytics**: Get analytics data
- **GET /api/dashboard/activity**: Get activity data
- **GET /api/dashboard/summary**: Get summary data

## Frontend Integration

To integrate this with your frontend:

1. Update your frontend code to fetch from the public endpoint
2. Example:

```javascript
// In your dashboard component
useEffect(() => {
  // Use the public endpoint for now
  fetch('https://bruno-ai-api.onrender.com/api/dashboard/public')
    .then(response => response.json())
    .then(data => {
      setDashboardData(data);
    })
    .catch(error => {
      console.error('Error fetching dashboard data:', error);
    });
}, []);
```

## Sample Response Format

The dashboard API returns data in the following format:

```json
{
  "kpis": [
    { "title": "Total Datasets", "value": "3", "change": 15.3 },
    { "title": "Data Transformations", "value": "12", "change": 22.5 },
    ...
  ],
  "revenueTrend": [
    { "month": "Jan", "revenue": 12500 },
    { "month": "Feb", "revenue": 14200 },
    ...
  ],
  "expensesByCategory": [
    { "name": "Marketing", "value": 45000, "color": "#3b82f6" },
    { "name": "Sales", "value": 32000, "color": "#10b981" },
    ...
  ],
  "insights": [
    {
      "text": "Revenue has grown by 15.3% compared to the previous quarter...",
      "impact": "positive",
      "confidence": 95
    },
    ...
  ],
  "anomalies": [
    {
      "title": "Unusual Marketing Expense",
      "description": "Marketing expenses in Q3 were 35% higher than the historical average...",
      "date": "2025-04-15"
    },
    ...
  ],
  "latestDatasets": [...],
  "latestTransformations": [...],
  "recentActivity": [...],
  "stats": {
    "datasetCount": 3,
    "transformationCount": 12,
    "documentCount": 28
  }
}
```

## Next Steps

1. Once the login functionality is working, you can switch to using the authenticated endpoints
2. Customize the dashboard data to match your specific requirements
3. Implement real-time updates using websockets if needed
