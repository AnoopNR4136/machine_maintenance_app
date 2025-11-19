// Copyright (c) 2025, Anoop and contributors
// For license information, please see license.txt

frappe.query_reports["Machine Maintenance Report"] = {
	"onload": function (report) {
		report.page.wrapper.find('[data-label="Print"]').hide();
		report.page.add_menu_item(__('Print '), function () {
			frappe.call({
				method: "machine_maintenance_app.machine_maintenance.report.machine_maintenance_report.machine_maintenance_report.get_pdf",
				args: {
					data: JSON.stringify(report.data),
					consolidated: report.get_values().consolidated
				},
				callback: function (r) {
					let w = window.open();
					w.document.write(r.message);
					w.document.close();
				}
			});
		});

	},
	"filters": [
		{
			'fieldname': "machine",
			'label': __("Machine"),
			'fieldtype': "Link",
			'options': "Item"
		},
		{
			'fieldname': "technician",
			'label': __("Technician"),
			'fieldtype': "Link",
			'options': "Employee"
		},
		{
			"fieldname": "from_date",
			"label": "From",
			"fieldtype": "Date",
		},
		{
			"fieldname": "to_date",
			"label": "To",
			"fieldtype": "Date",
		}, {
			'fieldname': "consolidated",
			'label': "Consolidated",
			'fieldtype': "Check",
			'default': 0
		}
	],
	formatter: function (value, row, column, data, default_formatter) {
		value = default_formatter(value, row, column, data);

		if (!data || data.consolidated == 1) {
			return value;
		}

		if (data.status === "Overdue") {
			value = `<span style='background-color:#ffcccc; padding:4px; display:block;'>${value}</span>`;
		} else if (data.status === "Scheduled") {
			value = `<span style='background-color:#fff3cd; padding:4px; display:block;'>${value}</span>`;
		} else if (data.status === "Completed") {
			value = `<span style='background-color:#d4edda; padding:4px; display:block;'>${value}</span>`;
		}
		return value;
	}
};
