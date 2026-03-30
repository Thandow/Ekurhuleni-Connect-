{
  "name": "FaultReport",
  "type": "object",
  "properties": {
    "title": {
      "type": "string",
      "description": "Brief title of the fault"
    },
    "description": {
      "type": "string",
      "description": "Detailed description of the fault"
    },
    "category": {
      "type": "string",
      "enum": [
        "Pothole",
        "Burst Water Pipe",
        "Streetlight Failure",
        "Illegal Dumping",
        "Other"
      ],
      "description": "AI-classified or manually selected fault category"
    },
    "severity": {
      "type": "string",
      "enum": [
        "Low",
        "Medium",
        "High",
        "Critical"
      ],
      "description": "Severity level of the fault"
    },
    "status": {
      "type": "string",
      "enum": [
        "Pending",
        "Under Review",
        "In Progress",
        "Resolved",
        "Closed"
      ],
      "default": "Pending",
      "description": "Current status of the fault report"
    },
    "image_url": {
      "type": "string",
      "description": "URL of the uploaded fault image"
    },
    "location_address": {
      "type": "string",
      "description": "Street address or location description"
    },
    "location_area": {
      "type": "string",
      "description": "Area/suburb within Ekurhuleni"
    },
    "latitude": {
      "type": "number",
      "description": "GPS latitude coordinate"
    },
    "longitude": {
      "type": "number",
      "description": "GPS longitude coordinate"
    },
    "reporter_name": {
      "type": "string",
      "description": "Name of the person reporting"
    },
    "reporter_contact": {
      "type": "string",
      "description": "Contact number or email"
    },
    "ai_confidence": {
      "type": "number",
      "description": "AI classification confidence score (0-100)"
    },
    "ai_analysis": {
      "type": "string",
      "description": "AI analysis summary"
    },
    "priority_score": {
      "type": "number",
      "description": "Computed priority score (1-10)"
    },
    "assigned_team": {
      "type": "string",
      "description": "Maintenance team assigned"
    },
    "resolution_notes": {
      "type": "string",
      "description": "Notes on how the fault was resolved"
    },
    "resolved_date": {
      "type": "string",
      "description": "Date when fault was resolved"
    }
  },
  "required": [
    "title",
    "description",
    "category",
    "location_address",
    "location_area"
  ]
}
