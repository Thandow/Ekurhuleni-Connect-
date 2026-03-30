{
  "name": "InventoryItem",
  "type": "object",
  "properties": {
    "name": {
      "type": "string",
      "description": "Name of the inventory item"
    },
    "category": {
      "type": "string",
      "enum": [
        "Road Materials",
        "Plumbing",
        "Electrical",
        "Safety",
        "Tools",
        "Other"
      ],
      "description": "Category of the item"
    },
    "unit": {
      "type": "string",
      "description": "Unit of measurement e.g. kg, litres, units, m"
    },
    "quantity_in_stock": {
      "type": "number",
      "description": "Current stock quantity"
    },
    "reorder_threshold": {
      "type": "number",
      "description": "Quantity at which a reorder alert triggers"
    },
    "reorder_quantity": {
      "type": "number",
      "description": "Suggested reorder quantity"
    },
    "supplier": {
      "type": "string",
      "description": "Supplier name or contact"
    },
    "unit_cost": {
      "type": "number",
      "description": "Cost per unit in ZAR"
    },
    "location": {
      "type": "string",
      "description": "Storage location / depot"
    },
    "notes": {
      "type": "string"
    }
  },
  "required": [
    "name",
    "unit",
    "quantity_in_stock",
    "reorder_threshold"
  ]
}
