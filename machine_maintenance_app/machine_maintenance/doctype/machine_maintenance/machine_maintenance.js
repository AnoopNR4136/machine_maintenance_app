// Copyright (c) 2025, Anoop and contributors
// For license information, please see license.txt

frappe.ui.form.on("Machine Maintenance", {
    onload: function (frm) {
        if (frm.is_new()) {
            frm.doc.maintenance_date = frappe.datetime.get_today();
            frm.refresh_field('maintenance_date');
        }
    },
    refresh(frm) {

        // Hide notes section based on status
        if (!['Draft', 'Scheduled'].includes(cur_frm.doc.status)) {
            frm.trigger("show_notes")
            frm.set_df_property('notes', 'hidden', false);
        } else {
            frm.set_df_property('notes', 'hidden', true);

        }

        // auto-update status to Overdue if maintenance_date < today
        if (frm.doc.status !== 'Completed' && frm.doc.maintenance_date) {
            var today = frappe.datetime.get_today();
            if (frm.doc.maintenance_date < today) {
                if (frm.doc.status !== 'Overdue') {
                    frm.set_value('status', 'Overdue');
                    frm.save();
                }
            }
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