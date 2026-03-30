{
  "name": "MaterialUsage",
  "type": "object",
  "properties": {
    "fault_report_id": {
      "type": "string",
      "description": "Linked fault report"
    },
    "inventory_item_id": {
      "type": "string",
      "description": "Inventory item used"
    },
    "item_name": {
      "type": "string"
    },
    "quantity_used": {
      "type": "number"
    },
    "unit": {
      "type": "string"
    },
    "team_name": {
      "type": "string"
    },
    "notes": {
      "type": "string"
    }
  },
  "required": [
    "fault_report_id",
    "inventory_item_id",
    "quantity_used"
  ]
}
