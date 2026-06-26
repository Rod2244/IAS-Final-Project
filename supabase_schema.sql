-- ============================================================================
-- IAS (Integrated Academic System) - PostgreSQL Schema for Supabase
-- ============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- 1. USERS TABLE (Core authentication and user management)
-- ============================================================================
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('admin', 'student')),
    status VARCHAR(50) NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive', 'Suspended')),
    otp_enabled BOOLEAN DEFAULT FALSE,
    otp_secret VARCHAR(255),
    must_change_password BOOLEAN DEFAULT FALSE,
    last_login TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);

-- ============================================================================
-- 2. TEACHERS TABLE
-- ============================================================================
CREATE TABLE teachers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    middle_name VARCHAR(100),
    phone_number VARCHAR(20),
    employee_id VARCHAR(50),
    department VARCHAR(100),
    grade_level_assignment VARCHAR(50),
    class_assignment VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_teachers_user_id ON teachers(user_id);
CREATE INDEX idx_teachers_employee_id ON teachers(employee_id);
CREATE INDEX idx_teachers_grade_level ON teachers(grade_level_assignment);

-- ============================================================================
-- 3. STUDENTS TABLE
-- ============================================================================
CREATE TABLE students (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    lrn VARCHAR(50) NOT NULL UNIQUE,
    date_of_birth DATE,
    gender VARCHAR(20) CHECK (gender IN ('Male', 'Female', 'Other')),
    address TEXT,
    phone_contact VARCHAR(20),
    parent_name VARCHAR(255),
    parent_contact VARCHAR(20),
    grade VARCHAR(50) NOT NULL,
    section VARCHAR(50) NOT NULL,
    status VARCHAR(50) DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive', 'Graduated')),
    school_year VARCHAR(20),
    enrollment_date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_students_user_id ON students(user_id);
CREATE INDEX idx_students_lrn ON students(lrn);
CREATE INDEX idx_students_grade ON students(grade);
CREATE INDEX idx_students_section ON students(section);
CREATE INDEX idx_students_status ON students(status);

-- ============================================================================
-- 4. SUBJECTS TABLE
-- ============================================================================
CREATE TABLE subjects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    subject_name VARCHAR(255) NOT NULL,
    subject_code VARCHAR(50) UNIQUE,
    description TEXT,
    subject_icon VARCHAR(255),
    grade_level VARCHAR(50),
    credits DECIMAL(3, 1),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_subjects_grade_level ON subjects(grade_level);
CREATE INDEX idx_subjects_subject_code ON subjects(subject_code);

-- ============================================================================
-- 5. CLASSES/SECTIONS TABLE
-- ============================================================================
CREATE TABLE classes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    class_name VARCHAR(100) NOT NULL,
    section_name VARCHAR(50) NOT NULL,
    grade_level VARCHAR(50) NOT NULL,
    class_shift VARCHAR(50) CHECK (class_shift IN ('Morning', 'Afternoon', 'Evening')),
    capacity INT DEFAULT 30,
    teacher_id UUID REFERENCES teachers(id) ON DELETE SET NULL,
    school_year VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_classes_grade_level ON classes(grade_level);
CREATE INDEX idx_classes_teacher_id ON classes(teacher_id);

-- ============================================================================
-- 6. CLASS_ENROLLMENTS TABLE (Junction table for students and classes)
-- ============================================================================
CREATE TABLE class_enrollments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
    enrollment_date DATE DEFAULT CURRENT_DATE,
    status VARCHAR(50) DEFAULT 'Active' CHECK (status IN ('Active', 'Dropped', 'Completed')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(student_id, class_id)
);

CREATE INDEX idx_class_enrollments_student_id ON class_enrollments(student_id);
CREATE INDEX idx_class_enrollments_class_id ON class_enrollments(class_id);

-- ============================================================================
-- 7. SUBJECT_CLASS_ASSIGNMENTS TABLE
-- ============================================================================
CREATE TABLE subject_class_assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    subject_id UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
    class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
    teacher_id UUID NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
    schedule_day VARCHAR(20) NOT NULL,
    schedule_time TIME NOT NULL,
    end_time TIME,
    room_number VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(subject_id, class_id)
);

CREATE INDEX idx_subject_class_subject_id ON subject_class_assignments(subject_id);
CREATE INDEX idx_subject_class_class_id ON subject_class_assignments(class_id);
CREATE INDEX idx_subject_class_teacher_id ON subject_class_assignments(teacher_id);

-- ============================================================================
-- 8. TEACHER_SCHEDULE TABLE
-- ============================================================================
CREATE TABLE teacher_schedule (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    teacher_id UUID NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
    subject_code VARCHAR(50),
    subject_name VARCHAR(255) NOT NULL,
    class_section VARCHAR(100) NOT NULL,
    day_of_week VARCHAR(20) NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    classroom_location VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_teacher_schedule_teacher_id ON teacher_schedule(teacher_id);

-- ============================================================================
-- 9. GRADES TABLE
-- ============================================================================
CREATE TABLE grades (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    subject_id UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
    class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
    teacher_id UUID NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
    preliminary_grade DECIMAL(5, 2),
    midterm_grade DECIMAL(5, 2),
    final_grade DECIMAL(5, 2),
    fourth_period_grade DECIMAL(5, 2),
    q1_grade DECIMAL(5, 2),
    q2_grade DECIMAL(5, 2),
    q3_grade DECIMAL(5, 2),
    q4_grade DECIMAL(5, 2),
    average_grade DECIMAL(5, 2),
    remarks VARCHAR(50) CHECK (remarks IN ('Passed', 'Failed', 'Incomplete')),
    school_year VARCHAR(20),
    grading_period VARCHAR(50),
    submitted_date TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_grades_student_id ON grades(student_id);
CREATE INDEX idx_grades_subject_id ON grades(subject_id);
CREATE INDEX idx_grades_class_id ON grades(class_id);
CREATE INDEX idx_grades_teacher_id ON grades(teacher_id);
CREATE INDEX idx_grades_school_year ON grades(school_year);
CREATE UNIQUE INDEX idx_grades_unique ON grades(student_id, subject_id, class_id, school_year);

-- ============================================================================
-- 10. ATTENDANCE TABLE
-- ============================================================================
CREATE TABLE attendance (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
    attendance_date DATE NOT NULL,
    status VARCHAR(50) NOT NULL CHECK (status IN ('Present', 'Absent', 'Late', 'Excused')),
    remarks TEXT,
    recorded_by UUID REFERENCES teachers(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_attendance_student_id ON attendance(student_id);
CREATE INDEX idx_attendance_class_id ON attendance(class_id);
CREATE INDEX idx_attendance_date ON attendance(attendance_date);
CREATE UNIQUE INDEX idx_attendance_unique ON attendance(student_id, class_id, attendance_date);

-- ============================================================================
-- 11. ATTENDANCE_SUMMARY TABLE (For quick statistics)
-- ============================================================================
CREATE TABLE attendance_summary (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    month_year DATE NOT NULL,
    present_days INT DEFAULT 0,
    absent_days INT DEFAULT 0,
    late_days INT DEFAULT 0,
    excused_days INT DEFAULT 0,
    total_school_days INT DEFAULT 0,
    attendance_percentage DECIMAL(5, 2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_attendance_summary_student_id ON attendance_summary(student_id);
CREATE UNIQUE INDEX idx_attendance_summary_unique ON attendance_summary(student_id, month_year);

-- ============================================================================
-- 12. SUBJECTS_TAUGHT TABLE (Junction table for teachers and subjects)
-- ============================================================================
CREATE TABLE subjects_taught (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    teacher_id UUID NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
    subject_id UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
    expertise_level VARCHAR(50) CHECK (expertise_level IN ('Beginner', 'Intermediate', 'Advanced', 'Expert')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(teacher_id, subject_id)
);

CREATE INDEX idx_subjects_taught_teacher_id ON subjects_taught(teacher_id);
CREATE INDEX idx_subjects_taught_subject_id ON subjects_taught(subject_id);

-- ============================================================================
-- 13. ANNOUNCEMENTS TABLE
-- ============================================================================
CREATE TABLE announcements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    target_audience VARCHAR(50) CHECK (target_audience IN ('All', 'Students', 'Teachers', 'Parents', 'Admin')),
    is_published BOOLEAN DEFAULT FALSE,
    published_date TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_announcements_created_by ON announcements(created_by);
CREATE INDEX idx_announcements_published_date ON announcements(published_date);

-- ============================================================================
-- 14. AUDIT_LOG TABLE (For tracking system changes)
-- ============================================================================
CREATE TABLE audit_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(255) NOT NULL,
    table_name VARCHAR(100),
    record_id UUID,
    old_values JSONB,
    new_values JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_audit_log_user_id ON audit_log(user_id);
CREATE INDEX idx_audit_log_created_at ON audit_log(created_at);

-- ============================================================================
-- 15. NOTIFICATION_PREFERENCES TABLE (For user notification settings)
-- ============================================================================
CREATE TABLE notification_preferences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    email_notifications BOOLEAN DEFAULT TRUE,
    grade_reminders BOOLEAN DEFAULT TRUE,
    attendance_alerts BOOLEAN DEFAULT TRUE,
    system_updates BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_notification_preferences_user_id ON notification_preferences(user_id);

-- ============================================================================
-- 16. SESSIONS TABLE (For managing user sessions)
-- ============================================================================
CREATE TABLE sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token VARCHAR(255) NOT NULL UNIQUE,
    ip_address VARCHAR(50),
    user_agent TEXT,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_sessions_user_id ON sessions(user_id);
CREATE INDEX idx_sessions_token ON sessions(token);
CREATE INDEX idx_sessions_expires_at ON sessions(expires_at);

-- ============================================================================
-- VIEWS FOR EASY DATA RETRIEVAL
-- ============================================================================

-- View for Student Grade Summary
CREATE VIEW student_grade_summary AS
SELECT 
    s.id,
    s.name,
    s.lrn,
    s.grade,
    s.section,
    COUNT(DISTINCT g.subject_id) as subjects_taken,
    ROUND(AVG(g.average_grade), 2) as overall_average,
    COUNT(CASE WHEN g.remarks = 'Passed' THEN 1 END) as passed_subjects,
    COUNT(CASE WHEN g.remarks = 'Failed' THEN 1 END) as failed_subjects
FROM students s
LEFT JOIN grades g ON s.id = g.student_id
GROUP BY s.id, s.name, s.lrn, s.grade, s.section;

-- View for Teacher Class Load
CREATE VIEW teacher_class_load AS
SELECT 
    t.id,
    t.first_name,
    t.last_name,
    COUNT(DISTINCT sca.class_id) as classes_assigned,
    COUNT(DISTINCT sca.subject_id) as subjects_assigned,
    COUNT(DISTINCT ce.student_id) as total_students
FROM teachers t
LEFT JOIN subject_class_assignments sca ON t.id = sca.teacher_id
LEFT JOIN class_enrollments ce ON sca.class_id = ce.class_id
GROUP BY t.id, t.first_name, t.last_name;

-- View for Class Statistics
CREATE VIEW class_statistics AS
SELECT 
    c.id,
    c.class_name,
    c.section_name,
    c.grade_level,
    COUNT(DISTINCT ce.student_id) as total_students,
    COUNT(DISTINCT sca.subject_id) as total_subjects,
    ROUND(AVG(g.average_grade), 2) as average_class_grade
FROM classes c
LEFT JOIN class_enrollments ce ON c.id = ce.class_id
LEFT JOIN subject_class_assignments sca ON c.id = sca.class_id
LEFT JOIN grades g ON c.id = g.class_id
GROUP BY c.id, c.class_name, c.section_name, c.grade_level;

-- ============================================================================
-- SAMPLE CONSTRAINTS AND TRIGGERS
-- ============================================================================

-- Trigger to update 'updated_at' timestamp on users table
CREATE OR REPLACE FUNCTION update_users_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER users_update_timestamp
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION update_users_timestamp();

-- Trigger to update 'updated_at' timestamp on students table
CREATE OR REPLACE FUNCTION update_students_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER students_update_timestamp
BEFORE UPDATE ON students
FOR EACH ROW
EXECUTE FUNCTION update_students_timestamp();

-- Trigger to auto-calculate attendance summary
CREATE OR REPLACE FUNCTION calculate_attendance_summary()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO attendance_summary (student_id, month_year, present_days, absent_days, late_days, excused_days)
    SELECT 
        a.student_id,
        DATE_TRUNC('month', a.attendance_date)::DATE,
        COUNT(CASE WHEN a.status = 'Present' THEN 1 END),
        COUNT(CASE WHEN a.status = 'Absent' THEN 1 END),
        COUNT(CASE WHEN a.status = 'Late' THEN 1 END),
        COUNT(CASE WHEN a.status = 'Excused' THEN 1 END)
    FROM attendance a
    WHERE a.student_id = NEW.student_id 
    GROUP BY a.student_id, DATE_TRUNC('month', a.attendance_date)::DATE
    ON CONFLICT (student_id, month_year) DO UPDATE SET
        present_days = EXCLUDED.present_days,
        absent_days = EXCLUDED.absent_days,
        late_days = EXCLUDED.late_days,
        excused_days = EXCLUDED.excused_days,
        updated_at = CURRENT_TIMESTAMP;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER attendance_summary_trigger
AFTER INSERT OR UPDATE ON attendance
FOR EACH ROW
EXECUTE FUNCTION calculate_attendance_summary();

-- ============================================================================
-- END OF SCHEMA
-- ============================================================================
