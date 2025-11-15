# Copyright (c) 2025, Anoop and contributors
# For license information, please see license.txt

import frappe
from frappe.model.document import Document
from frappe.desk.notifications import notify_mentions
from frappe.utils import cstr, now,flt,nowdate
from erpnext.setup.utils import get_exchange_rate
import frappe.utils

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


	@frappe.whitelist()
	def mark_as_completed(self):
		self.status = "Completed"
		self.save()


def create_journal_entry(doc, method=None):
	if not doc.technician:
		frappe.throw("Technician is required to create Journal Entry.")

	company = frappe.db.get_value('Company', frappe.defaults.get_defaults().company, 'name')
	if not company:
		frappe.throw("Please set Default Company in System Settings")
	company_currency = frappe.get_cached_value('Company', company, 'default_currency') 
	if not company_currency:
		frappe.throw("Please set Default Currency in Company")
	amount=doc.cost
	if doc.currency != company_currency:
		exchange_rate=get_exchange_rate(doc.currency, company_currency, doc.maintenance_date)
		amount=doc.cost * exchange_rate if exchange_rate else doc.cost
	accounts= [
				{
				'account': 'Maintenance Expense account',
				'debit_in_company_currency': flt(amount),
				'debit': flt(amount)
				},
				{
				'account': 'Cash',
				'credit_in_company_currency': flt(amount),
				'credit': flt(amount)
				}
				]
	try:
		je = frappe.new_doc("Journal Entry")
		je.company = company
		je.posting_date=frappe.utils.now()
		je.remarks= 'Maintenance for {0}'.format(doc.machine_name)
		je.accounts = accounts
		je.save(ignore_permissions=True)
		# je.submit()

	except Exception as e:
		frappe.log_error(message=frappe.get_traceback(), title='Machine Maintenance: Journal Entry Failed')
		frappe.throw(('Failed to create Journal Entry: {0}').format(e))

