{
  "name": "MaintenanceLog",
  "type": "object",
  "properties": {
    "fault_report_id": {
      "type": "string",
      "description": "ID of the related fault report"
    },
    "action": {
      "type": "string",
      "description": "Action taken"
    },
    "status_change": {
      "type": "string",
      "description": "Status change description"
    },
    "notes": {
      "type": "string",
      "description": "Additional notes"
    },
    "performed_by": {
      "type": "string",
      "description": "Person who performed the action"
    }
  },
  "required": [
    "fault_report_id",
    "action"
  ]
}
