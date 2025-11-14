# Copyright (c) 2025, Anoop and contributors
# For license information, please see license.txt

import frappe
from frappe.model.document import Document
from frappe.desk.notifications import notify_mentions
from frappe.utils import cstr, now


class MachineMaintenance(Document):
	@frappe.whitelist()
	def add_note(self, note):
		self.append("notes", {"note": note, "added_by": frappe.session.user, "added_on": now()})
		self.save()
		notify_mentions(self.doctype, self.name, note)

	@frappe.whitelist()
	def edit_note(self, note, row_id):
		for d in self.notes:
			if cstr(d.name) == row_id:
				d.note = note
				d.db_update()

	@frappe.whitelist()
	def delete_note(self, row_id):
		for d in self.notes:
			if cstr(d.name) == row_id:
				self.remove(d)
				break
		self.save()

