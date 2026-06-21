# Supabase Implementation Guide for IAS

## Quick Start Setup Guide

### Step 1: Create Supabase Project

1. Go to https://supabase.com
2. Click "Start your project"
3. Create new project (select PostgreSQL database)
4. Wait for database initialization (~2-5 minutes)
5. Copy your `Project URL` and `Anon Key` for later use

---

## Step 2: Initialize Database Schema

### Option A: Using SQL Editor (Recommended)

1. In Supabase Dashboard, go to **SQL Editor**
2. Click **"New Query"**
3. Copy all content from `supabase_schema.sql`
4. Paste into the editor
5. Click **"Run"** button
6. Wait for all tables to be created

### Option B: Using psql CLI

```bash
psql -h db.xxxxx.supabase.co -U postgres -d postgres < supabase_schema.sql
```

When prompted, enter your database password.

---

## Step 3: Set Up Row-Level Security (RLS)

### Enable RLS on Critical Tables

```sql
-- Enable RLS on sensitive tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE grades ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE teacher_schedule ENABLE ROW LEVEL SECURITY;
ALTER TABLE class_enrollments ENABLE ROW LEVEL SECURITY;
```

### Create RLS Policies

#### Students Table Policies

```sql
-- Allow students to view their own data
CREATE POLICY "students_select_own_data"
ON students FOR SELECT
USING (user_id = auth.uid());

-- Allow admins to view all students
CREATE POLICY "students_select_all_for_admin"
ON students FOR SELECT
USING (auth.jwt() ->> 'user_role' = 'admin');

-- Allow teachers to view students in their classes
CREATE POLICY "students_select_for_teachers"
ON students FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM class_enrollments ce
    INNER JOIN subject_class_assignments sca ON ce.class_id = sca.class_id
    INNER JOIN teachers t ON sca.teacher_id = t.id
    WHERE ce.student_id = students.id
    AND t.user_id = auth.uid()
  )
);

-- Allow admins to insert/update students
CREATE POLICY "students_insert_update_admin"
ON students FOR INSERT, UPDATE
USING (auth.jwt() ->> 'user_role' = 'admin');
```

#### Grades Table Policies

```sql
-- Students can view their own grades
CREATE POLICY "grades_select_own"
ON grades FOR SELECT
USING (student_id IN (SELECT id FROM students WHERE user_id = auth.uid()));

-- Teachers can view grades for their students
CREATE POLICY "grades_select_for_teacher"
ON grades FOR SELECT
USING (teacher_id IN (SELECT id FROM teachers WHERE user_id = auth.uid()));

-- Teachers can insert/update grades
CREATE POLICY "grades_insert_update_for_teacher"
ON grades FOR INSERT, UPDATE
USING (teacher_id IN (SELECT id FROM teachers WHERE user_id = auth.uid()));
```

#### Attendance Table Policies

```sql
-- Students can view their own attendance
CREATE POLICY "attendance_select_own"
ON attendance FOR SELECT
USING (student_id IN (SELECT id FROM students WHERE user_id = auth.uid()));

-- Teachers can view attendance for their classes
CREATE POLICY "attendance_select_for_teacher"
ON attendance FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM classes c
    WHERE c.id = attendance.class_id
    AND c.teacher_id IN (SELECT id FROM teachers WHERE user_id = auth.uid())
  )
);

-- Teachers can insert/update attendance
CREATE POLICY "attendance_insert_update_for_teacher"
ON attendance FOR INSERT, UPDATE
USING (
  EXISTS (
    SELECT 1 FROM classes c
    WHERE c.id = attendance.class_id
    AND c.teacher_id IN (SELECT id FROM teachers WHERE user_id = auth.uid())
  )
);
```

#### Teachers Table Policies

```sql
-- Teachers can view their own profile
CREATE POLICY "teachers_select_own"
ON teachers FOR SELECT
USING (user_id = auth.uid());

-- Admins can view all teachers
CREATE POLICY "teachers_select_all_admin"
ON teachers FOR SELECT
USING (auth.jwt() ->> 'user_role' = 'admin');

-- Admins can insert/update teachers
CREATE POLICY "teachers_insert_update_admin"
ON teachers FOR INSERT, UPDATE
USING (auth.jwt() ->> 'user_role' = 'admin');
```

---

## Step 4: Set Up Authentication

### Configure Supabase Auth

1. Go to **Authentication** → **Providers**
2. Enable **Email** provider (default)
3. Configure email templates in **Email Templates**

### Create Auth Functions

```sql
-- Create a function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, role, status)
  VALUES (
    NEW.id,
    NEW.email,
    'student',  -- Default role: 'student' or 'admin'
    'Active'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a trigger to run the function on new auth user
CREATE OR REPLACE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

---

## Step 5: Environment Variables Setup

### Backend (.env)

```env
# Supabase Configuration
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Database
DATABASE_URL=postgresql://postgres:password@db.xxxxx.supabase.co:5432/postgres

# JWT Secret
JWT_SECRET=your_jwt_secret_here

# API
PORT=5000
NODE_ENV=production
```

### Frontend (.env)

```env
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
VITE_API_URL=http://localhost:5000/api
```

---

## Step 6: Backend Configuration

### Install Supabase Client

```bash
npm install @supabase/supabase-js @supabase/auth-helpers-node
```

### Create Supabase Client

Create `Backend/config/supabase.js`:

```javascript
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

export default supabase;
```

### Update Database Connection

Create `Backend/config/db.js`:

```javascript
import { supabaseAdmin } from "./supabase.js";

export const query = async (sql, params = []) => {
  try {
    const { data, error } = await supabaseAdmin.rpc("execute_sql", {
      sql_query: sql,
      params: params,
    });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Database query error:", error);
    throw error;
  }
};

export default supabaseAdmin.from;
```

---

## Step 7: Frontend Configuration

### Install Supabase Client

```bash
npm install @supabase/supabase-js
```

### Create Supabase Client

Create `Frontend/src/services/supabase.js`:

```javascript
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default supabase;
```

### Update API Service

Create `Frontend/src/services/apiClient.js`:

```javascript
import { supabase } from "./supabase.js";

// Authentication
export const authService = {
  async signUp(email, password, role = "student") {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });
    if (error) throw error;

    // Create user record with role
    await supabase.from("users").insert({
      id: data.user.id,
      email,
      role,
      status: "Active",
    });

    return data;
  },

  async signIn(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
    return data;
  },

  async signOut() {
    return await supabase.auth.signOut();
  },

  async getSession() {
    return await supabase.auth.getSession();
  },

  async getCurrentUser() {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    return user;
  },
};

// Students API
export const studentService = {
  async getAll() {
    const { data, error } = await supabase.from("students").select("*");
    if (error) throw error;
    return data;
  },

  async getById(id) {
    const { data, error } = await supabase
      .from("students")
      .select("*")
      .eq("id", id)
      .single();
    if (error) throw error;
    return data;
  },

  async create(student) {
    const { data, error } = await supabase
      .from("students")
      .insert([student])
      .select();
    if (error) throw error;
    return data[0];
  },

  async update(id, student) {
    const { data, error } = await supabase
      .from("students")
      .update(student)
      .eq("id", id)
      .select();
    if (error) throw error;
    return data[0];
  },

  async delete(id) {
    const { error } = await supabase.from("students").delete().eq("id", id);
    if (error) throw error;
    return true;
  },
};

// Grades API
export const gradeService = {
  async getByStudent(studentId) {
    const { data, error } = await supabase
      .from("grades")
      .select("*")
      .eq("student_id", studentId);
    if (error) throw error;
    return data;
  },

  async getByTeacher(teacherId) {
    const { data, error } = await supabase
      .from("grades")
      .select("*")
      .eq("teacher_id", teacherId);
    if (error) throw error;
    return data;
  },

  async create(grade) {
    const { data, error } = await supabase
      .from("grades")
      .insert([grade])
      .select();
    if (error) throw error;
    return data[0];
  },

  async update(id, grade) {
    const { data, error } = await supabase
      .from("grades")
      .update(grade)
      .eq("id", id)
      .select();
    if (error) throw error;
    return data[0];
  },
};

// Attendance API
export const attendanceService = {
  async recordAttendance(studentId, classId, status, date) {
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
  },

  async getStudentAttendance(studentId) {
    const { data, error } = await supabase
      .from("attendance")
      .select("*")
      .eq("student_id", studentId);
    if (error) throw error;
    return data;
  },

  async getAttendanceSummary(studentId) {
    const { data, error } = await supabase
      .from("attendance_summary")
      .select("*")
      .eq("student_id", studentId);
    if (error) throw error;
    return data;
  },
};

export default {
  authService,
  studentService,
  gradeService,
  attendanceService,
};
```

---

## Step 8: Testing the Setup

### Test Authentication

```javascript
import { authService } from "./services/apiClient";

// Sign up a new student
const newStudent = await authService.signUp(
  "student@example.com",
  "password123",
  "student",
);
console.log("New student:", newStudent);

// Sign in
const session = await authService.signIn("student@example.com", "password123");
console.log("Session:", session);

// Get current user
const user = await authService.getCurrentUser();
console.log("Current user:", user);
```

### Test Database Operations

```javascript
import { studentService } from "./services/apiClient";

// Create a student
const student = await studentService.create({
  name: "Juan Dela Cruz",
  lrn: "2024-001234",
  grade: "Grade 3",
  section: "Class A",
  status: "Active",
  dob: "2012-05-18",
  gender: "Male",
});

// Get all students
const students = await studentService.getAll();
console.log("All students:", students);

// Get a specific student
const oneStudent = await studentService.getById(student.id);
console.log("One student:", oneStudent);
```

---

## Step 9: Enable Real-Time Subscriptions (Optional)

```javascript
import { supabase } from "./services/supabase";

// Listen to grades changes in real-time
supabase
  .on(
    "postgres_changes",
    {
      event: "*",
      schema: "public",
      table: "grades",
    },
    (payload) => {
      console.log("Change received!", payload);
    },
  )
  .subscribe();

// Listen to attendance changes
supabase
  .on(
    "postgres_changes",
    {
      event: "*",
      schema: "public",
      table: "attendance",
    },
    (payload) => {
      console.log("Attendance changed!", payload);
    },
  )
  .subscribe();
```

---

## Step 10: Database Backups

### Enable Automated Backups

1. Go to **Database** → **Backups**
2. Enable **Automated Backups**
3. Set retention period (7-30 days recommended)
4. Backups stored in Supabase infrastructure

### Manual Export

```bash
# Export entire database
pg_dump -h db.xxxxx.supabase.co -U postgres > backup.sql

# Export specific table
pg_dump -h db.xxxxx.supabase.co -U postgres -t students > students_backup.sql
```

---

## Troubleshooting

### Connection Issues

```javascript
// Test connection
import { supabase } from "./services/supabase";

const { data, error } = await supabase.from("users").select("count(*)");
if (error) console.error("Connection error:", error);
else console.log("Connection successful:", data);
```

### RLS Policy Issues

1. Check policy status: **Authentication** → **Policies**
2. Verify JWT contains required claims
3. Test with role: Use `X-Hasura-Role` header

### Performance Issues

1. Check **Query Performance**
2. Review index usage
3. Monitor connections: **Database** → **Connections**

---

## Security Best Practices

1. **Never** expose service key in frontend
2. Use anon key for public operations
3. Service key only on secure backend
4. Rotate keys regularly
5. Enable 2FA in Supabase dashboard
6. Use HTTPS only
7. Implement rate limiting on API
8. Sanitize all user inputs
9. Use environment variables for secrets
10. Regular security audits

---

## Monitoring & Maintenance

### Monitor Database Health

1. Go to **Database** → **Health**
2. Check disk usage
3. Monitor connection count
4. Review slow queries

### Regular Tasks

- Weekly: Review logs for errors
- Monthly: Analyze and VACUUM database
- Quarterly: Review security policies
- Annually: Audit all RLS policies

---

## Reference Documentation

- Supabase Docs: https://supabase.com/docs
- PostgreSQL Docs: https://www.postgresql.org/docs/
- Row-Level Security: https://supabase.com/docs/guides/auth/row-level-security

---

**Last Updated:** 2026-06-21
**Version:** 1.0
