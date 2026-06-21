const { supabaseAdmin } = require("../config/supabase");

const auditService = {
  async recordEvent({ userId = null, action, tableName = null, recordId = null, oldValues = null, newValues = null }) {
    try {
      if (!action) {
        throw new Error("Audit event action is required");
      }

      const { error } = await supabaseAdmin.from("audit_log").insert([
        {
          user_id: userId,
          action,
          table_name: tableName,
          record_id: recordId,
          old_values: oldValues,
          new_values: newValues,
        },
      ]);

      if (error) {
        console.warn("Audit log warning:", error.message);
      }
    } catch (error) {
      console.warn("Audit logging failed:", error.message);
    }
  },
};

module.exports = auditService;
