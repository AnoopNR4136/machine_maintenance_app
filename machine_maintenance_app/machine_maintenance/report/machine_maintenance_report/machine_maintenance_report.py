# Copyright (c) 2025, Anoop and contributors
# For license information, please see license.txt

import frappe, json

def execute(filters=None):
	if not filters:
		filters = {}

	consolidated = filters.get("consolidated")

	if consolidated:
		columns = get_consolidated_columns()
		data = get_consolidated_data(filters)
	else:
		columns = get_detailed_columns()
		data = get_detailed_data(filters)


	return columns, data

def get_detailed_columns():
	return [
	{"label": "Machine", "fieldname": "machine", "fieldtype": "Link", "options": "Item", "width": 180},
	{"label": "Maintenance Date", "fieldname": "maintenance_date", "fieldtype": "Date", "width": 120},
	{"label": "Technician", "fieldname": "technician", "fieldtype": "Link", "options": "Employee", "width": 160},
	{"label": "Status", "fieldname": "status", "fieldtype": "Data", "width": 120},
	{"label": "Total Cost", "fieldname": "total_cost", "fieldtype": "Currency", "width": 140},
	]


def get_consolidated_columns():
	return [
	{"label": "Machine", "fieldname": "machine", "fieldtype": "Link", "options": "Item", "width": 180},
	{"label": "Total Cost", "fieldname": "total_cost", "fieldtype": "Currency", "width": 160},
	]

def get_consolidated_data(filters):
	condition_generated = condition_gen(filters)
	data = frappe.db.sql(f"""
	SELECT
	machine_name AS machine,
	SUM(cost) AS total_cost
	FROM `tabMachine Maintenance`
	WHERE docstatus = 1 {condition_generated}
	GROUP BY machine_name
	""", filters, as_dict=True)
	return data


def get_detailed_data(filters):
	condition_generated = condition_gen(filters)
	data = frappe.db.sql(f"""
			SELECT
			machine_name AS machine,
			maintenance_date,
			technician,
			status,
			cost AS total_cost
			FROM `tabMachine Maintenance`
			WHERE docstatus = 1 {condition_generated}
			ORDER BY maintenance_date DESC
			""", filters, as_dict=True)
	return data


def condition_gen(filters):
	conditions = ""

	if filters.get("machine"):
		conditions += " AND machine_name = %(machine)s"

	if filters.get("technician"):
		conditions += " AND technician = %(technician)s"

	if filters.get("from_date") and filters.get("to_date"):
		conditions += " AND maintenance_date BETWEEN %(from_date)s AND %(to_date)s"

	return conditions

@frappe.whitelist()
def get_pdf(data,consolidated=False):
	data = json.loads(data)
	consolidated = int(consolidated) if consolidated else 0

	html = frappe.render_template(
		"machine_maintenance_app/templates/print/machine_maintenance_print.html",
		{
			"data": data,
			"consolidated": consolidated
		}
	)
	return html
