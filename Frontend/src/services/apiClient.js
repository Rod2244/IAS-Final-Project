import axios from "axios";

// API base URL
const API_BASE_URL = "http://localhost:5000/api";

// Create axios instance
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

// Simple input sanitizer to reduce XSS injection risk in outgoing payloads
const sanitize = (str) => {
  if (typeof str !== "string") return str;
  return str.replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "").trim();
};

const mergeUserProfile = (userData = {}, profileData = {}) => {
  const merged = {
    ...userData,
    ...profileData,
  };

  return {
    ...merged,
    firstName: merged.firstName || merged.first_name || "",
    lastName: merged.lastName || merged.last_name || "",
    middleName: merged.middleName || merged.middle_name || "",
    employeeId: merged.employeeId || merged.employee_id || "",
    phoneNumber: merged.phoneNumber || merged.phone_number || "",
    gradeLevelAssignment:
      merged.gradeLevelAssignment || merged.grade_level_assignment || "",
    classAssignment: merged.classAssignment || merged.class_assignment || "",
    department: merged.department || "",
  };
};

// Fetch CSRF token on first app load if not already cached
let csrfTokenPromise = null;

const fetchCsrfToken = async () => {
  try {
    const response = await axios.get(
      "http://localhost:5000/api/auth/csrf-token",
      {
        withCredentials: true,
      },
    );
    return response.data.csrfToken;
  } catch (error) {
    console.warn("Failed to fetch CSRF token", error);
    return null;
  }
};

// Attach CSRF token from cookie to state-changing requests
apiClient.interceptors.request.use(async (config) => {
  if (["post", "put", "patch", "delete"].includes(config.method)) {
    // Try to get token from cookie first
    let csrfToken = document.cookie
      .split(";")
      .map((c) => c.trim())
      .find((c) => c.startsWith("XSRF-TOKEN="));

    if (!csrfToken) {
      // If no token in cookie, fetch it
      if (!csrfTokenPromise) {
        csrfTokenPromise = fetchCsrfToken();
      }
      csrfToken = await csrfTokenPromise;
    } else {
      // Extract value from cookie string
      csrfToken = csrfToken.split("=")[1];
    }

    if (csrfToken) {
      config.headers["X-CSRF-Token"] = csrfToken;
    }
  }

  return config;
});

// Add token to requests if available
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("authToken");
  const sessionToken = localStorage.getItem("sessionToken");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  if (sessionToken) {
    config.headers["X-Session-Token"] = sessionToken;
  }

  return config;
});

// ============================================================================
// AUTHENTICATION SERVICES
// ============================================================================

export const authService = {
  async signUp(email, password, role = "student", profileData = {}) {
    try {
      const response = await apiClient.post("/auth/signup", {
        email: sanitize(email),
        password: sanitize(password),
        role: sanitize(role),
        firstName: sanitize(profileData.firstName) || null,
        lastName: sanitize(profileData.lastName) || null,
        middleInitial: sanitize(profileData.middleInitial) || null,
        facultyId: sanitize(profileData.facultyId) || null,
      });
      if (response.data.success) {
        // Store token if provided
        if (response.data.session?.access_token) {
          localStorage.setItem("authToken", response.data.session.access_token);
        }

        const profilePayload = mergeUserProfile(response.data.user || {}, {
          firstName: sanitize(profileData.firstName) || "",
          lastName: sanitize(profileData.lastName) || "",
          middleName: sanitize(profileData.middleInitial) || "",
          employeeId: sanitize(profileData.facultyId) || "",
        });
        localStorage.setItem("user", JSON.stringify(profilePayload));
        localStorage.setItem("userRole", sanitize(role) || "student");
        return response.data;
      }
      throw new Error(response.data.error || "Sign up failed");
    } catch (error) {
      console.error("Sign up error:", error);
      throw error;
    }
  },

  async signIn(email, password) {
    try {
      const response = await apiClient.post("/auth/signin", {
        email: sanitize(email),
        password: sanitize(password),
      });
      if (response.data.success) {
        // Store token for future requests
        if (response.data.session?.access_token) {
          localStorage.setItem("authToken", response.data.session.access_token);
        }
        // Store session token
        if (response.data.sessionToken) {
          localStorage.setItem("sessionToken", response.data.sessionToken);
        }
        // Store user info
        const profilePayload = mergeUserProfile(
          response.data.user || {},
          response.data.userProfile || {},
        );
        localStorage.setItem("user", JSON.stringify(profilePayload));
        localStorage.setItem("userRole", response.data.userRole);
        return response.data;
      }
      throw new Error(response.data.error || "Sign in failed");
    } catch (error) {
      console.error("Sign in error:", error);
      throw error;
    }
  },

  async sendOtp(email) {
    try {
      const response = await apiClient.post("/auth/mfa/send", {
        email: sanitize(email),
      });
      return response.data;
    } catch (error) {
      console.error("Send OTP error:", error);
      throw error;
    }
  },

  async verifyOtp(email, code, ipAddress, userAgent) {
    try {
      const response = await apiClient.post("/auth/mfa/verify", {
        email: sanitize(email),
        code: sanitize(code),
        ipAddress,
        userAgent,
      });
      return response.data;
    } catch (error) {
      console.error("Verify OTP error:", error);
      throw error;
    }
  },

  async signOut() {
    try {
      const sessionToken = localStorage.getItem("sessionToken");
      const response = await apiClient.post("/auth/signout", {
        sessionToken,
      });
      // Clear local storage
      localStorage.removeItem("authToken");
      localStorage.removeItem("sessionToken");
      localStorage.removeItem("user");
      localStorage.removeItem("userRole");
      return response.data;
    } catch (error) {
      console.error("Sign out error:", error);
      // Still clear local storage even if API call fails
      localStorage.removeItem("authToken");
      localStorage.removeItem("sessionToken");
      localStorage.removeItem("user");
      localStorage.removeItem("userRole");
      throw error;
    }
  },

  async requestPasswordReset(email) {
    try {
      const response = await apiClient.post("/auth/password-reset/request", {
        email: sanitize(email),
      });
      return response.data;
    } catch (error) {
      console.error("Request password reset error:", error);
      throw error;
    }
  },

  async verifyPasswordResetOtp(email, code) {
    try {
      const response = await apiClient.post("/auth/password-reset/verify", {
        email: sanitize(email),
        code: sanitize(code),
      });
      return response.data;
    } catch (error) {
      console.error("Verify password reset OTP error:", error);
      throw error;
    }
  },

  async completePasswordReset(email, code, newPassword) {
    try {
      const response = await apiClient.post("/auth/password-reset/complete", {
        email: sanitize(email),
        code: sanitize(code),
        newPassword: sanitize(newPassword),
      });
      return response.data;
    } catch (error) {
      console.error("Complete password reset error:", error);
      throw error;
    }
  },

  async getSession() {
    try {
      const token = localStorage.getItem("authToken");
      if (!token) return null;
      // Verify token is still valid
      const user = localStorage.getItem("user");
      return {
        access_token: token,
        user: user ? JSON.parse(user) : null,
      };
    } catch (error) {
      console.error("Get session error:", error);
      return null;
    }
  },

  async getCurrentUser() {
    try {
      const sessionToken = localStorage.getItem("sessionToken");
      const response = await apiClient.get("/auth/me", {
        headers: sessionToken ? { "X-Session-Token": sessionToken } : undefined,
      });
      if (response.data?.user) {
        const user = mergeUserProfile(
          response.data.user || {},
          response.data.user?.profile || response.data.userProfile || {},
        );
        localStorage.setItem("user", JSON.stringify(user));
        return user;
      }
    } catch (error) {
      console.warn("Falling back to local cached user:", error.message);
    }

    try {
      const user = localStorage.getItem("user");
      return user ? JSON.parse(user) : null;
    } catch (error) {
      console.error("Get current user error:", error);
      return null;
    }
  },

  async updatePassword(newPassword) {
    try {
      const response = await apiClient.post("/auth/update-password", {
        newPassword,
      });
      return response.data;
    } catch (error) {
      console.error("Update password error:", error);
      throw error;
    }
  },
};

// ============================================================================
// STUDENT SERVICES
// ============================================================================

export const studentService = {
  async getAll() {
    try {
      const { data, error } = await supabase.from("students").select("*");
      if (error) throw error;
      return data;
    } catch (error) {
      console.error("Get all students error:", error);
      throw error;
    }
  },

  async getById(id) {
    try {
      const { data, error } = await supabase
        .from("students")
        .select("*")
        .eq("id", id)
        .single();
      if (error) throw error;
      return data;
    } catch (error) {
      console.error("Get student error:", error);
      throw error;
    }
  },

  async getByLRN(lrn) {
    try {
      const { data, error } = await supabase
        .from("students")
        .select("*")
        .eq("lrn", lrn)
        .single();
      if (error) throw error;
      return data;
    } catch (error) {
      console.error("Get student by LRN error:", error);
      throw error;
    }
  },

  async create(student) {
    try {
      const { data, error } = await supabase
        .from("students")
        .insert([student])
        .select();
      if (error) throw error;
      return data[0];
    } catch (error) {
      console.error("Create student error:", error);
      throw error;
    }
  },

  async update(id, student) {
    try {
      const { data, error } = await supabase
        .from("students")
        .update(student)
        .eq("id", id)
        .select();
      if (error) throw error;
      return data[0];
    } catch (error) {
      console.error("Update student error:", error);
      throw error;
    }
  },

  async delete(id) {
    try {
      const { error } = await supabase.from("students").delete().eq("id", id);
      if (error) throw error;
      return true;
    } catch (error) {
      console.error("Delete student error:", error);
      throw error;
    }
  },

  async getByGrade(grade) {
    try {
      const { data, error } = await supabase
        .from("students")
        .select("*")
        .eq("grade", grade);
      if (error) throw error;
      return data;
    } catch (error) {
      console.error("Get students by grade error:", error);
      throw error;
    }
  },

  async getBySection(section) {
    try {
      const { data, error } = await supabase
        .from("students")
        .select("*")
        .eq("section", section);
      if (error) throw error;
      return data;
    } catch (error) {
      console.error("Get students by section error:", error);
      throw error;
    }
  },
};

// ============================================================================
// GRADE SERVICES
// ============================================================================

export const gradeService = {
  // GET all grades
  async getAll() {
    try {
      const response = await apiClient.get("/grades");
      return response.data.data; // Assuming your server returns { success: true, data: [...] }
    } catch (error) {
      console.error("Get all grades error:", error);
      throw error;
    }
  },

  // GET grades by student
  async getByStudent(studentId) {
    try {
      const response = await apiClient.get(`/grades/student/${studentId}`);
      return response.data.data;
    } catch (error) {
      console.error("Get student grades error:", error);
      throw error;
    }
  },

  // GET grades by class
  async getByClass(classId) {
    try {
      const response = await apiClient.get(`/grades/class/${classId}`);
      return response.data.data;
    } catch (error) {
      console.error("Get class grades error:", error);
      throw error;
    }
  },

  // CREATE a grade
  async create(grade) {
    try {
      const response = await apiClient.post("/grades", grade);
      return response.data.data;
    } catch (error) {
      console.error("Create grade error:", error);
      throw error;
    }
  },

  // UPDATE a grade
  async update(id, grade) {
    try {
      const response = await apiClient.put(`/grades/${id}`, grade);
      return response.data.data;
    } catch (error) {
      console.error("Update grade error:", error);
      throw error;
    }
  },

  // DELETE a grade
  async delete(id) {
    try {
      await apiClient.delete(`/grades/${id}`);
      return true;
    } catch (error) {
      console.error("Delete grade error:", error);
      throw error;
    }
  },
};

// ============================================================================
// ATTENDANCE SERVICES
// ============================================================================

export const attendanceService = {
  async record(studentId, classId, status, date) {
    try {
      const { data, error } = await supabase
        .from("attendance")
        .insert([
          {
            student_id: studentId,
            class_id: classId,
            status,
            attendance_date: date,
          },
        ])
        .select();
      if (error) throw error;
      return data[0];
    } catch (error) {
      console.error("Record attendance error:", error);
      throw error;
    }
  },

  async getStudentAttendance(studentId) {
    try {
      const { data, error } = await supabase
        .from("attendance")
        .select("*")
        .eq("student_id", studentId);
      if (error) throw error;
      return data;
    } catch (error) {
      console.error("Get student attendance error:", error);
      throw error;
    }
  },

  async getAttendanceSummary(studentId) {
    try {
      const { data, error } = await supabase
        .from("attendance_summary")
        .select("*")
        .eq("student_id", studentId);
      if (error) throw error;
      return data;
    } catch (error) {
      console.error("Get attendance summary error:", error);
      throw error;
    }
  },

  async getByDate(date) {
    try {
      const { data, error } = await supabase
        .from("attendance")
        .select("*")
        .eq("attendance_date", date);
      if (error) throw error;
      return data;
    } catch (error) {
      console.error("Get attendance by date error:", error);
      throw error;
    }
  },

  async update(id, updateData) {
    try {
      const { data, error } = await supabase
        .from("attendance")
        .update(updateData)
        .eq("id", id)
        .select();
      if (error) throw error;
      return data[0];
    } catch (error) {
      console.error("Update attendance error:", error);
      throw error;
    }
  },

  async delete(id) {
    try {
      const { error } = await supabase.from("attendance").delete().eq("id", id);
      if (error) throw error;
      return true;
    } catch (error) {
      console.error("Delete attendance error:", error);
      throw error;
    }
  },
};

// ============================================================================
// SUBJECT SERVICES
// ============================================================================

export const subjectService = {
  async getAll() {
    try {
      const { data, error } = await supabase.from("subjects").select("*");
      if (error) throw error;
      return data;
    } catch (error) {
      console.error("Get all subjects error:", error);
      throw error;
    }
  },

  async getByGrade(gradeLevel) {
    try {
      const { data, error } = await supabase
        .from("subjects")
        .select("*")
        .eq("grade_level", gradeLevel);
      if (error) throw error;
      return data;
    } catch (error) {
      console.error("Get subjects by grade error:", error);
      throw error;
    }
  },

  async create(subject) {
    try {
      const { data, error } = await supabase
        .from("subjects")
        .insert([subject])
        .select();
      if (error) throw error;
      return data[0];
    } catch (error) {
      console.error("Create subject error:", error);
      throw error;
    }
  },

  async update(id, subject) {
    try {
      const { data, error } = await supabase
        .from("subjects")
        .update(subject)
        .eq("id", id)
        .select();
      if (error) throw error;
      return data[0];
    } catch (error) {
      console.error("Update subject error:", error);
      throw error;
    }
  },

  async delete(id) {
    try {
      const { error } = await supabase.from("subjects").delete().eq("id", id);
      if (error) throw error;
      return true;
    } catch (error) {
      console.error("Delete subject error:", error);
      throw error;
    }
  },
};

// ============================================================================
// USER SERVICES
// ============================================================================

export const userService = {
  async getProfile() {
    try {
      const response = await apiClient.get("/users/profile");
      return response.data.user;
    } catch (error) {
      console.error("Get profile error:", error);
      throw error;
    }
  },

  async updateProfile(profileData) {
    try {
      const response = await apiClient.put("/users/profile", profileData);
      return response.data;
    } catch (error) {
      console.error("Update profile error:", error);
      throw error;
    }
  },

  async updatePassword(currentPassword, newPassword) {
    try {
      const response = await apiClient.put("/users/password", {
        currentPassword,
        newPassword,
      });
      return response.data;
    } catch (error) {
      console.error("Update password error:", error);
      throw error;
    }
  },

  async updateNotifications(preferences) {
    try {
      const response = await apiClient.put("/users/notifications", preferences);
      return response.data;
    } catch (error) {
      console.error("Update notifications error:", error);
      throw error;
    }
  },
};

export default {
  authService,
  studentService,
  gradeService,
  attendanceService,
  subjectService,
  userService,
};
