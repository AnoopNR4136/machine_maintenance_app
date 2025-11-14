// Copyright (c) 2025, Anoop and contributors
// For license information, please see license.txt

frappe.ui.form.on("Machine Maintenance", {
    refresh(frm) {
        frm.trigger("show_notes")
    },
    show_notes(frm) {
        // if (this.frm.doc.docstatus == 1) return;

        const crm_notes = new erpnext.utils.CRMNotes({
            frm: frm,
            notes_wrapper: $(frm.fields_dict.notes_html.wrapper),
        });
        crm_notes.refresh();
    }
});
