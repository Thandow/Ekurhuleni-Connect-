{
  "name": "CrewLocation",
  "type": "object",
  "properties": {
    "team_name": {
      "type": "string",
      "description": "Name of the crew team"
    },
    "fault_report_id": {
      "type": "string",
      "description": "Active fault being worked on"
    },
    "latitude": {
      "type": "number"
    },
    "longitude": {
      "type": "number"
    },
    "accuracy": {
      "type": "number"
    },
    "heading": {
      "type": "number",
      "description": "Direction in degrees"
    },
    "speed": {
      "type": "number",
      "description": "Speed in m/s"
    },
    "last_updated": {
      "type": "string",
      "description": "ISO timestamp of last GPS update"
    }
  },
  "required": [
    "team_name"
  ]
}
