# IAS (Integrated Academic System) - PostgreSQL Schema Documentation

## Overview

This document describes the complete PostgreSQL database schema designed for the Integrated Academic System (IAS) frontend application. The schema is optimized for Supabase and includes all inputs identified from the frontend components.

---

## Frontend Inputs Scan Summary

### 1. **Authentication Inputs** (Auth.jsx)

- **Email** - User email address for login
- **Password** - User password (encrypted)
- **OTP** - One-Time Password (6 digits) for MFA
- **User Role** - admin, student
- **New Password** - For password reset flow
- **Confirm Password** - Password confirmation

### 2. **Student Management Inputs** (students.jsx)

- **Name** - Full name of student
- **LRN** - Learning Record Number (unique identifier)
- **Grade** - Grade level (e.g., Grade 3)
- **Class/Section** - Class assignment (e.g., Class A)
- **Status** - Active/Inactive
- **Date of Birth** - Student's birthdate
- **Gender** - Male/Female/Other
- **Address** - Residential address
- **Parent Name** - Parent/Guardian name
- **Contact** - Phone number
- **Password** - Student login password

### 3. **Subject Management Inputs** (managesubjects.jsx)

- **Subject Name** - Name of subject (e.g., Mathematics)
- **Subject Icon** - Unicode emoji representation
- **Grade Level** - Associated grade levels
- **Class/Section Name** - Sections teaching the subject
- **Student Count** - Number of students in section

### 4. **Teacher Profile Inputs** (profilesettings.jsx)

- **First Name** - Teacher's first name
- **Last Name** - Teacher's last name
- **Middle Name** - Teacher's middle name
- **Email** - Teacher's email address
- **Phone Number** - Contact number
- **Employee ID** - Unique employee identifier
- **Grade Level Assignment** - Assigned grade levels
- **Class Assignment** - Assigned classes/sections
- **Department** - Department name
- **Subjects Taught** - List of subjects
- **Weekly Schedule** - Subject code, name, section, time

### 5. **Grades/Assessment Inputs** (viewgrades.jsx)

- **Student Name** - Student identifier
- **Preliminary Grade** - First grading period
- **Midterm Grade** - Second grading period
- **Final Grade** - Third grading period
- **Fourth Period Grade** - Fourth grading period
- **Average Grade** - Calculated average
- **Remarks** - Passed/Failed status
- **Quarterly Grades** (Q1, Q2, Q3, Q4) - Stored from StudentGrades.jsx
- **Subject** - Subject identifier

### 6. **Attendance Inputs** (StudentAttendance.jsx)

- **Present Days** - Count of present days
- **Absent Days** - Count of absent days
- **Late Days** - Count of late days
- **Attendance Date** - Date of attendance record
- **Status** - Present/Absent/Late/Excused

### 7. **Schedule Inputs** (profilesettings.jsx, StudentSchedule.jsx)

- **Subject Code** - Subject identifier code
- **Subject Name** - Subject name
- **Section/Class** - Class assignment
- **Time** - Class time (start and end)
- **Day of Week** - Day schedule
- **Room/Location** - Classroom number

### 8. **Dashboard Inputs** (StudentDashboard.jsx)

- **Student Name**
- **Grade & Section**
- **School Year**
- **Status** - Current enrollment status

---

## Database Schema Tables

### Core Tables

#### 1. **users**

Stores all system users (students and admins)

| Field         | Type         | Notes                       |
| ------------- | ------------ | --------------------------- |
| id            | UUID         | Primary key                 |
| email         | VARCHAR(255) | UNIQUE, NOT NULL            |
| password_hash | VARCHAR(255) | Hashed password             |
| role          | VARCHAR(50)  | admin, student              |
| status        | VARCHAR(50)  | Active, Inactive, Suspended |
| otp_enabled   | BOOLEAN      | MFA status                  |
| otp_secret    | VARCHAR(255) | OTP secret key              |
| last_login    | TIMESTAMP    | Last login time             |
| created_at    | TIMESTAMP    | Record creation             |
| updated_at    | TIMESTAMP    | Last update                 |

#### 2. **teachers**

Stores teacher-specific information

| Field                  | Type         | Notes           |
| ---------------------- | ------------ | --------------- |
| id                     | UUID         | Primary key     |
| user_id                | UUID         | FK to users     |
| first_name             | VARCHAR(100) | NOT NULL        |
| last_name              | VARCHAR(100) | NOT NULL        |
| middle_name            | VARCHAR(100) | Optional        |
| phone_number           | VARCHAR(20)  | Optional        |
| employee_id            | VARCHAR(50)  | UNIQUE          |
| department             | VARCHAR(100) | Department name |
| grade_level_assignment | VARCHAR(50)  | Assigned grade  |
| class_assignment       | VARCHAR(50)  | Assigned class  |
| created_at             | TIMESTAMP    | Record creation |
| updated_at             | TIMESTAMP    | Last update     |

#### 3. **students**

Stores student-specific information

| Field           | Type         | Notes                       |
| --------------- | ------------ | --------------------------- |
| id              | UUID         | Primary key                 |
| user_id         | UUID         | FK to users                 |
| name            | VARCHAR(255) | NOT NULL                    |
| lrn             | VARCHAR(50)  | UNIQUE identifier           |
| date_of_birth   | DATE         | Student's birthdate         |
| gender          | VARCHAR(20)  | Male, Female, Other         |
| address         | TEXT         | Residential address         |
| phone_contact   | VARCHAR(20)  | Contact number              |
| parent_name     | VARCHAR(255) | Parent/Guardian             |
| parent_contact  | VARCHAR(20)  | Parent's contact            |
| grade           | VARCHAR(50)  | Current grade level         |
| section         | VARCHAR(50)  | Class assignment            |
| status          | VARCHAR(50)  | Active, Inactive, Graduated |
| school_year     | VARCHAR(20)  | e.g., 2024-2025             |
| enrollment_date | DATE         | Enrollment date             |
| created_at      | TIMESTAMP    | Record creation             |
| updated_at      | TIMESTAMP    | Last update                 |

#### 4. **subjects**

Stores subject/course information

| Field        | Type         | Notes               |
| ------------ | ------------ | ------------------- |
| id           | UUID         | Primary key         |
| subject_name | VARCHAR(255) | NOT NULL            |
| subject_code | VARCHAR(50)  | UNIQUE code         |
| description  | TEXT         | Subject description |
| subject_icon | VARCHAR(255) | Emoji or icon       |
| grade_level  | VARCHAR(50)  | Applicable grade    |
| credits      | DECIMAL(3,1) | Credit hours        |
| created_at   | TIMESTAMP    | Record creation     |
| updated_at   | TIMESTAMP    | Last update         |

#### 5. **classes**

Stores class/section information

| Field        | Type         | Notes                     |
| ------------ | ------------ | ------------------------- |
| id           | UUID         | Primary key               |
| class_name   | VARCHAR(100) | NOT NULL                  |
| section_name | VARCHAR(50)  | NOT NULL                  |
| grade_level  | VARCHAR(50)  | Grade level               |
| class_shift  | VARCHAR(50)  | Morning/Afternoon/Evening |
| capacity     | INT          | Class capacity            |
| teacher_id   | UUID         | FK to teachers            |
| school_year  | VARCHAR(20)  | Academic year             |
| created_at   | TIMESTAMP    | Record creation           |
| updated_at   | TIMESTAMP    | Last update               |

#### 6. **class_enrollments**

Links students to classes (many-to-many)

| Field           | Type        | Notes                      |
| --------------- | ----------- | -------------------------- |
| id              | UUID        | Primary key                |
| student_id      | UUID        | FK to students             |
| class_id        | UUID        | FK to classes              |
| enrollment_date | DATE        | Enrollment date            |
| status          | VARCHAR(50) | Active, Dropped, Completed |
| created_at      | TIMESTAMP   | Record creation            |
| updated_at      | TIMESTAMP   | Last update                |

#### 7. **subject_class_assignments**

Links subjects to classes and teachers

| Field         | Type        | Notes              |
| ------------- | ----------- | ------------------ |
| id            | UUID        | Primary key        |
| subject_id    | UUID        | FK to subjects     |
| class_id      | UUID        | FK to classes      |
| teacher_id    | UUID        | FK to teachers     |
| schedule_day  | VARCHAR(20) | Day of week        |
| schedule_time | TIME        | Class start time   |
| end_time      | TIME        | Class end time     |
| room_number   | VARCHAR(50) | Classroom location |
| created_at    | TIMESTAMP   | Record creation    |
| updated_at    | TIMESTAMP   | Last update        |

#### 8. **teacher_schedule**

Stores individual teacher schedules

| Field              | Type         | Notes            |
| ------------------ | ------------ | ---------------- |
| id                 | UUID         | Primary key      |
| teacher_id         | UUID         | FK to teachers   |
| subject_code       | VARCHAR(50)  | Subject code     |
| subject_name       | VARCHAR(255) | Subject name     |
| class_section      | VARCHAR(100) | Class assignment |
| day_of_week        | VARCHAR(20)  | Day of class     |
| start_time         | TIME         | Class start time |
| end_time           | TIME         | Class end time   |
| classroom_location | VARCHAR(100) | Room number      |
| created_at         | TIMESTAMP    | Record creation  |
| updated_at         | TIMESTAMP    | Last update      |

#### 9. **grades**

Stores student grades for subjects

| Field               | Type         | Notes                    |
| ------------------- | ------------ | ------------------------ |
| id                  | UUID         | Primary key              |
| student_id          | UUID         | FK to students           |
| subject_id          | UUID         | FK to subjects           |
| class_id            | UUID         | FK to classes            |
| teacher_id          | UUID         | FK to teachers           |
| preliminary_grade   | DECIMAL(5,2) | First grading period     |
| midterm_grade       | DECIMAL(5,2) | Second grading period    |
| final_grade         | DECIMAL(5,2) | Third grading period     |
| fourth_period_grade | DECIMAL(5,2) | Fourth grading period    |
| q1_grade            | DECIMAL(5,2) | Q1 grade                 |
| q2_grade            | DECIMAL(5,2) | Q2 grade                 |
| q3_grade            | DECIMAL(5,2) | Q3 grade                 |
| q4_grade            | DECIMAL(5,2) | Q4 grade                 |
| average_grade       | DECIMAL(5,2) | Calculated average       |
| remarks             | VARCHAR(50)  | Passed/Failed/Incomplete |
| school_year         | VARCHAR(20)  | Academic year            |
| grading_period      | VARCHAR(50)  | Period identifier        |
| submitted_date      | TIMESTAMP    | When grade was submitted |
| created_at          | TIMESTAMP    | Record creation          |
| updated_at          | TIMESTAMP    | Last update              |

#### 10. **attendance**

Records daily student attendance

| Field           | Type        | Notes                       |
| --------------- | ----------- | --------------------------- |
| id              | UUID        | Primary key                 |
| student_id      | UUID        | FK to students              |
| class_id        | UUID        | FK to classes               |
| attendance_date | DATE        | Date of attendance          |
| status          | VARCHAR(50) | Present/Absent/Late/Excused |
| remarks         | TEXT        | Additional notes            |
| recorded_by     | UUID        | FK to teachers              |
| created_at      | TIMESTAMP   | Record creation             |
| updated_at      | TIMESTAMP   | Last update                 |

#### 11. **attendance_summary**

Aggregated monthly attendance statistics

| Field                 | Type         | Notes                 |
| --------------------- | ------------ | --------------------- |
| id                    | UUID         | Primary key           |
| student_id            | UUID         | FK to students        |
| month_year            | DATE         | Month summary         |
| present_days          | INT          | Count of present days |
| absent_days           | INT          | Count of absent days  |
| late_days             | INT          | Count of late days    |
| excused_days          | INT          | Count of excused days |
| total_school_days     | INT          | Total school days     |
| attendance_percentage | DECIMAL(5,2) | Calculated percentage |
| created_at            | TIMESTAMP    | Record creation       |
| updated_at            | TIMESTAMP    | Last update           |

#### 12. **subjects_taught**

Links teachers to subjects they teach (many-to-many)

| Field           | Type        | Notes                                 |
| --------------- | ----------- | ------------------------------------- |
| id              | UUID        | Primary key                           |
| teacher_id      | UUID        | FK to teachers                        |
| subject_id      | UUID        | FK to subjects                        |
| expertise_level | VARCHAR(50) | Beginner/Intermediate/Advanced/Expert |
| created_at      | TIMESTAMP   | Record creation                       |

#### 13. **announcements**

System announcements and notifications

| Field           | Type         | Notes                               |
| --------------- | ------------ | ----------------------------------- |
| id              | UUID         | Primary key                         |
| title           | VARCHAR(255) | Announcement title                  |
| content         | TEXT         | Announcement content                |
| created_by      | UUID         | FK to users                         |
| target_audience | VARCHAR(50)  | All/Students/Teachers/Parents/Admin |
| is_published    | BOOLEAN      | Publication status                  |
| published_date  | TIMESTAMP    | Publication date                    |
| created_at      | TIMESTAMP    | Record creation                     |
| updated_at      | TIMESTAMP    | Last update                         |

#### 14. **audit_log**

System audit trail for compliance

| Field      | Type         | Notes              |
| ---------- | ------------ | ------------------ |
| id         | UUID         | Primary key        |
| user_id    | UUID         | FK to users        |
| action     | VARCHAR(255) | Action description |
| table_name | VARCHAR(100) | Affected table     |
| record_id  | UUID         | Record identifier  |
| old_values | JSONB        | Previous values    |
| new_values | JSONB        | New values         |
| created_at | TIMESTAMP    | Action timestamp   |

#### 15. **sessions**

User session management

| Field      | Type         | Notes         |
| ---------- | ------------ | ------------- |
| id         | UUID         | Primary key   |
| user_id    | UUID         | FK to users   |
| token      | VARCHAR(255) | Session token |
| ip_address | VARCHAR(50)  | Client IP     |
| user_agent | TEXT         | Browser info  |
| expires_at | TIMESTAMP    | Token expiry  |
| created_at | TIMESTAMP    | Session start |

---

## Views (For Easy Data Retrieval)

### 1. **student_grade_summary**

Aggregated grade information for all students

- Student ID, Name, LRN
- Grade Level, Section
- Total Subjects, Overall Average
- Passed/Failed subjects count

### 2. **teacher_class_load**

Teacher workload analysis

- Teacher ID, Name
- Classes Assigned, Subjects Assigned
- Total Students

### 3. **class_statistics**

Class-level analytics

- Class ID, Name, Section
- Total Students, Total Subjects
- Average Class Grade

---

## Key Features & Relationships

### 1. **User Role Hierarchy**

```
Users (base) → Admin/Student (specific)
Note: Admin role handles both admin and teacher functions in this basic portal
```

### 2. **Grade Management**

- Students → Classes → Subjects → Grades
- Tracks multiple grading periods (Preliminary, Midterm, Final, Fourth)
- Auto-calculates averages and remarks

### 3. **Attendance Tracking**

- Daily attendance records
- Monthly summary aggregation
- Automatic percentage calculation

### 4. **Schedule Management**

- Teacher weekly schedules
- Subject-class assignments
- Multiple time slots per day

### 5. **Hierarchical Data**

- Schools > Grades > Classes > Sections > Students
- Teachers assigned to grades and subjects

---

## Security Considerations

1. **Passwords** - Always store as bcrypt or similar hashed format
2. **OTP** - Use time-based one-time passwords (TOTP)
3. **Sessions** - Implement token expiry and rotation
4. **Audit Logs** - Track all sensitive operations
5. **Row-Level Security** - Implement RLS policies in Supabase

---

## Data Validation Rules

### Student Inputs

- LRN: Must be unique, format: YYYY-XXXXXX
- Grade: Must be valid grade level (Grade 1-6)
- Status: Only specific values allowed
- Contact: Valid phone format required
- DOB: Cannot be future date

### Grades

- Range: 0-100 (DECIMAL 5,2)
- Remarks: Auto-calculated based on average (75+ = Passed)
- School Year: Format YYYY-YYYY

### Attendance

- Date: Cannot be future date
- Status: Controlled vocabulary
- One record per student per day per class

---

## Indexes for Performance

Key indexes created:

- Users: email, role
- Students: lrn, grade, section, status
- Grades: student_id, subject_id, school_year
- Attendance: student_id, date
- Teachers: employee_id, grade_level_assignment
- Classes: grade_level, teacher_id

---

## How to Use with Supabase

### 1. Create the Schema

1. Go to Supabase Dashboard → SQL Editor
2. Create a new query
3. Copy the entire `supabase_schema.sql` content
4. Run the query

### 2. Enable Row-Level Security (RLS)

```sql
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE grades ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
```

### 3. Create RLS Policies

```sql
-- Students can only see their own records
CREATE POLICY "Students can view their own data"
ON students FOR SELECT
USING (user_id = auth.uid());

-- Teachers can see grades for their classes
CREATE POLICY "Teachers can view grades for their classes"
ON grades FOR SELECT
USING (teacher_id IN (SELECT id FROM teachers WHERE user_id = auth.uid()));
```

### 4. Set up Storage for Uploads (Optional)

- Profile pictures
- Grade sheets
- Documents

---

## Example API Endpoints to Create

```
Authentication:
POST /api/auth/register
POST /api/auth/login
POST /api/auth/verify-otp

Students:
GET /api/students
POST /api/students
PUT /api/students/:id
GET /api/students/:id/grades
GET /api/students/:id/attendance

Teachers:
GET /api/teachers
POST /api/teachers
PUT /api/teachers/:id
GET /api/teachers/:id/schedule

Grades:
GET /api/grades
POST /api/grades
PUT /api/grades/:id
GET /api/grades/student/:studentId

Attendance:
GET /api/attendance
POST /api/attendance
GET /api/attendance/student/:studentId

Classes:
GET /api/classes
POST /api/classes
GET /api/classes/:id/students
```

---

## Maintenance Tasks

### Regular Backups

- Daily automated backups via Supabase
- Export critical tables weekly

### Data Cleanup

- Archive old attendance records (older than 2 years)
- Remove inactive user sessions monthly

### Performance Monitoring

- Monitor slow queries
- Review index usage regularly
- Vacuum and analyze tables monthly

---

## Notes

- All timestamps use UTC
- All IDs are UUIDs for better distributed system support
- Soft deletes not implemented; use status field instead
- JSONB used in audit logs for flexibility
- Triggers automatically maintain updated_at timestamps

---

**Last Updated:** 2026-06-21
**Version:** 1.0
