const { supabaseAdmin, supabase } = require("../config/supabase");

// Authentication Service
const authService = {
  // Sign up a new user
  async signUp(email, password, role = "student") {
    try {
      const { data, error } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
      });

      if (error) throw error;

      // Create user record in users table
      const { data: userData, error: userError } = await supabaseAdmin
        .from("users")
        .insert({
          id: data.user.id,
          email,
          role,
          status: "Active",
        })
        .select();

      if (userError) throw userError;

      return { user: data.user, userRecord: userData[0] };
    } catch (error) {
      throw new Error(`Sign up error: ${error.message}`);
    }
  },

  // Sign in user
  async signIn(email, password) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      // Get user role
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("*")
        .eq("id", data.user.id)
        .single();

      if (userError) throw userError;

      return {
        session: data.session,
        user: data.user,
        userRole: userData.role,
      };
    } catch (error) {
      throw new Error(`Sign in error: ${error.message}`);
    }
  },

  // Sign out user
  async signOut(accessToken) {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      return { success: true };
    } catch (error) {
      throw new Error(`Sign out error: ${error.message}`);
    }
  },

  // Get current user
  async getCurrentUser() {
    try {
      const { data, error } = await supabase.auth.getUser();
      if (error) throw error;
      return data.user;
    } catch (error) {
      throw new Error(`Get user error: ${error.message}`);
    }
  },

  // Update user password
  async updatePassword(newPassword) {
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });
      if (error) throw error;
      return { success: true };
    } catch (error) {
      throw new Error(`Update password error: ${error.message}`);
    }
  },
};

module.exports = authService;
