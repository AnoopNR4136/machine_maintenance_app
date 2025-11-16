// Copyright (c) 2025, Anoop and contributors
// For license information, please see license.txt

frappe.ui.form.on("Machine Maintenance", {
    after_save: function (frm) {
        frm.refresh()
    },
    onload: function (frm) {
        if (frm.is_new()) {
            frm.doc.maintenance_date = frappe.datetime.get_today();
            frm.refresh_field('maintenance_date');
        }
    },
    refresh(frm) {
        if (frm.doc.workflow_state == 'Completed') {
            frm.set_df_property('debit_account', 'read_only', false);
            frm.set_df_property('credit_account', 'read_only', false);

        }
        // Hide notes section based on status
        if (!['Scheduled'].includes(frm.doc.workflow_state)) {
            frm.trigger("show_notes")
            frm.set_df_property('notes', 'hidden', false);
        } else {
            frm.set_df_property('notes', 'hidden', true);

        }

        if (frm.doc.workflow_state == 'Scheduled' || frm.doc.workflow_state == 'Completed') {
            frm.set_df_property('machine_name', 'read_only', true);
            frm.set_df_property('maintenance_type', 'read_only', true);
            frm.set_df_property('maintenance_date', 'read_only', true);
            if (frm.doc.workflow_state == 'Completed') {
                frm.set_df_property('completion_date', 'read_only', true);
                frm.set_df_property('parts_used', 'read_only', true);
            }

        }

        // auto-update status to Overdue if maintenance_date < today
        if ((frm.doc.status == 'Scheduled' || frm.doc.workflow_state == 'Draft') && frm.doc.maintenance_date) {
            var today = frappe.datetime.get_today();
            if (frm.doc.maintenance_date < today) {
                if (frm.doc.status !== 'Overdue') {
                    frm.set_value('status', 'Overdue');
                    frm.save();
                }
            }
        }

        if (frm.doc.status == 'Scheduled' && !frm.is_new() && frappe.user.has_role('Technician')) {
            // Custom button: "Mark Completed"
            // Validations:
            // 1. Completion Date must be set.
            // 2. Completion Date must be >= Maintenance (Scheduled) Date.
            // On success, calls the server-side method `mark_as_completed`
            // and refreshes the form.
            frm.add_custom_button(__('Mark Completed'), function () {
                if (!frm.doc.completion_date) {
                    frappe.msgprint(__('Please set the Completion Date before marking as Completed.'));
                    frm.scroll_to_field("completion_date");
                    return
                }

                if (frm.doc.completion_date < frm.doc.maintenance_date) {
                    frappe.msgprint(__('Completion Date must be greater than or equal to Scheduled Date.'));
                    frm.scroll_to_field("completion_date");
                    return;
                }

                frappe.call({
                    doc: frm.doc,
                    method: "mark_as_completed",
                    freeze: true

                }).then((r) => {
                    frm.refresh();

                });

            });
        }
    },
    show_notes(frm) {
        const crm_notes = new erpnext.utils.CRMNotes({
            frm: frm,
            notes_wrapper: $(frm.fields_dict.notes_html.wrapper),
        });
        crm_notes.refresh();
    }
});
frappe.ui.form.on('Parts Used', {
    quantity: function (frm, cdt, cdn) { compute_amount(frm, cdt, cdn); },
    rate: function (frm, cdt, cdn) { compute_amount(frm, cdt, cdn); },
    parts_used_remove: function (frm) {
        let cost = 0
        frm.doc.parts_used.forEach(element => {
            cost += element.amount
        });
        frm.doc.cost = cost
        frm.refresh()
    }
});
function compute_amount(frm, cdt, cdn) {
    let row = locals[cdt][cdn];
    let qty = flt(row.quantity, 1);
    let rate = flt(row.rate, 2);
    let amt = qty * rate;
    row.amount = amt;
    row.currency = frm.doc.currency
    frm.refresh_field("parts_used");
    let cost = 0
    frm.doc.parts_used.forEach(element => {
        cost += element.amount
    });
    frm.doc.cost = cost
    frm.refresh()
}