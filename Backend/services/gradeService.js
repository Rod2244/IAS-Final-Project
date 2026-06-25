const bcrypt = require("bcryptjs");
const { supabaseAdmin } = require("../config/supabase");

// Grade Service
const gradeService = {
  // Get all grades
  async getAllGrades() {
    try {
      const { data, error } = await supabaseAdmin.from("grades").select("*");
      if (error) throw error;
      return data;
    } catch (error) {
      throw new Error(`Get grades error: ${error.message}`);
    }
  },

  // 1. Add this helper method to your gradeService object
  async _populateSubjectNames(gradeRecords) {
    const subjectIds = Array.from(
      new Set(gradeRecords.map((record) => record.subject).filter(Boolean)),
    );

    if (subjectIds.length === 0) return gradeRecords;

    const { data: subjects, error: subjectError } = await supabaseAdmin
      .from("subjects")
      .select("id, name") // Ensure 'name' is the correct column in your 'subjects' table
      .in("id", subjectIds);

    if (subjectError) throw subjectError;

    const subjectMap = (subjects || []).reduce((acc, sub) => {
      acc[sub.id] = sub.name;
      return acc;
    }, {});

    return gradeRecords.map((record) => ({
      ...record,
      subject_name: subjectMap[record.subject] || "Unknown Subject",
    }));
  },

  // 2. Update your getGradesByStudent to use both populations
  async getGradesByStudent(studentId) {
    try {
      const { data, error } = await supabaseAdmin
        .from("grades")
        .select(
          `
        *,
        subjects (
          subject_name
        )
      `,
        ) // This tells Supabase to "Join" the subjects table
        .eq("student_id", studentId);

      if (error) throw error;

      return await this._populateSubjectNames(data);

      // Return empty array instead of throwing an error if no grades found
      return data || [];
    } catch (error) {
      throw new Error(`Get student grades error: ${error.message}`);
    }
  },

  // Get grades by teacher
  async getGradesByTeacher(teacherId) {
    try {
      const { data, error } = await supabaseAdmin
        .from("grades")
        .select("*")
        .eq("teacher_id", teacherId);
      if (error) throw error;
      return data;
    } catch (error) {
      throw new Error(`Get teacher grades error: ${error.message}`);
    }
  },

  // Get grades by class
  async getGradesByClass(classId) {
    try {
      const { data, error } = await supabaseAdmin
        .from("grades")
        .select("*")
        .eq("class_id", classId);
      if (error) throw error;

      if (Array.isArray(data) && data.length > 0) {
        const gradesWithNames = await this._populateStudentNames(data);
        return gradesWithNames;
      }

      return data;
    } catch (error) {
      throw new Error(`Get class grades error: ${error.message}`);
    }
  },

  async _ensureSubjectExists(subjectName) {
    const normalizedName = (subjectName || "").toString().trim();
    if (!normalizedName) return null;

    const { data: existingSubject, error: subjectLookupError } =
      await supabaseAdmin
        .from("subjects")
        .select("id")
        .ilike("subject_name", normalizedName)
        .maybeSingle();

    if (subjectLookupError) throw subjectLookupError;
    if (existingSubject?.id) return existingSubject.id;

    const slug =
      normalizedName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "") || "subject";

    const { data: createdSubject, error: subjectCreateError } =
      await supabaseAdmin
        .from("subjects")
        .insert([
          {
            subject_name: normalizedName,
            subject_code: `${slug}-${Date.now().toString().slice(-4)}`,
            description: "Auto-created for grade entry",
          },
        ])
        .select("id")
        .single();

    if (subjectCreateError) throw subjectCreateError;
    return createdSubject?.id || null;
  },

  async _ensureClassExists(className, gradeLevel, schoolYear) {
    const normalizedName = (className || "").toString().trim();
    if (!normalizedName) return null;

    const { data: existingClass, error: classLookupError } = await supabaseAdmin
      .from("classes")
      .select("id, teacher_id")
      .ilike("class_name", normalizedName)
      .maybeSingle();

    if (classLookupError) throw classLookupError;
    if (existingClass?.id) return existingClass.id;

    const { data: createdClass, error: classCreateError } = await supabaseAdmin
      .from("classes")
      .insert([
        {
          class_name: normalizedName,
          section_name: normalizedName,
          grade_level: gradeLevel || "Unassigned",
          school_year: schoolYear || "2026-2027",
        },
      ])
      .select("id")
      .single();

    if (classCreateError) throw classCreateError;
    return createdClass?.id || null;
  },

  async _ensureTeacherExists() {
    const { data: existingTeacher, error: teacherLookupError } =
      await supabaseAdmin.from("teachers").select("id").limit(1).maybeSingle();

    if (teacherLookupError) throw teacherLookupError;
    if (existingTeacher?.id) return existingTeacher.id;

    const email = `default.teacher.${Date.now()}@ias.local`;
    const passwordHash = await bcrypt.hash("TempPassword123!", 10);

    const { data: userData, error: userError } = await supabaseAdmin
      .from("users")
      .insert([
        {
          email,
          password_hash: passwordHash,
          role: "admin",
          status: "Active",
        },
      ])
      .select("id")
      .single();

    if (userError) throw userError;

    const { data: createdTeacher, error: teacherCreateError } =
      await supabaseAdmin
        .from("teachers")
        .insert([
          {
            user_id: userData.id,
            first_name: "Default",
            last_name: "Teacher",
            employee_id: `AUTO-${Date.now()}`,
          },
        ])
        .select("id")
        .single();

    if (teacherCreateError) throw teacherCreateError;
    return createdTeacher?.id || null;
  },

  async _ensureStudentExists(studentName, className, gradeLevel, schoolYear) {
    const normalizedName = (studentName || "").toString().trim();
    if (!normalizedName) return null;

    const { data: existingStudent, error: studentLookupError } =
      await supabaseAdmin
        .from("students")
        .select("id")
        .ilike("name", normalizedName)
        .maybeSingle();

    if (studentLookupError) throw studentLookupError;
    if (existingStudent?.id) return existingStudent.id;

    const email = `student.${Date.now()}@ias.local`;
    const passwordHash = await bcrypt.hash("TempPassword123!", 10);

    const { data: userData, error: userError } = await supabaseAdmin
      .from("users")
      .insert([
        {
          email,
          password_hash: passwordHash,
          role: "student",
          status: "Active",
        },
      ])
      .select("id")
      .single();

    if (userError) throw userError;

    const { data: createdStudent, error: studentCreateError } =
      await supabaseAdmin
        .from("students")
        .insert([
          {
            user_id: userData.id,
            name: normalizedName,
            lrn: `AUTO-${Date.now()}`,
            grade: gradeLevel || "Unassigned",
            section: className || "Unassigned",
            school_year: schoolYear || "2026-2027",
          },
        ])
        .select("id")
        .single();

    if (studentCreateError) throw studentCreateError;
    return createdStudent?.id || null;
  },

  // Create grade with dynamic text-to-UUID resolution
  async createGrade(gradeData) {
    try {
      let {
        student_id,
        class_id,
        subject_id,
        teacher_id,
        student_name,
        class_name,
        subject_name,
      } = gradeData;

      // 1. Resolve Student Name -> student_id if text name is provided
      if (
        student_name &&
        (!student_id || student_id === "00000000-0000-0000-0000-000000000000")
      ) {
        // Try to find an existing student matching this name
        const { data: existingStudent } = await supabaseAdmin
          .from("students")
          .select("id")
          .ilike("name", student_name.trim())
          .maybeSingle();

        if (existingStudent) {
          student_id = existingStudent.id;
        } else {
          const createdStudentId = await this._ensureStudentExists(
            student_name.trim(),
            class_name,
            gradeData.grade_level,
            gradeData.school_year,
          );

          if (!createdStudentId) {
            throw new Error(
              "Unable to create a valid student record for grade entry.",
            );
          }

          student_id = createdStudentId;
        }
      }

      // 2. Resolve Class Name -> class_id and teacher_id if needed
      if (
        class_name &&
        (!class_id || class_id === "00000000-0000-0000-0000-000000000000")
      ) {
        const resolvedClassId = await this._ensureClassExists(
          class_name,
          gradeData.grade_level,
          gradeData.school_year,
        );

        if (resolvedClassId) {
          class_id = resolvedClassId;
        }
      }

      if (!teacher_id && class_id) {
        const { data: foundClassById } = await supabaseAdmin
          .from("classes")
          .select("teacher_id")
          .eq("id", class_id)
          .maybeSingle();
        if (foundClassById?.teacher_id) teacher_id = foundClassById.teacher_id;
      }

      // 3. Resolve Subject Name -> subject_id
      if (
        subject_name &&
        (!subject_id || subject_id === "00000000-0000-0000-0000-000000000000")
      ) {
        const resolvedSubjectId = await this._ensureSubjectExists(subject_name);
        if (resolvedSubjectId) {
          subject_id = resolvedSubjectId;
        }
      }

      if (!teacher_id && class_id) {
        const { data: foundAssignment } = await supabaseAdmin
          .from("subject_class_assignments")
          .select("teacher_id")
          .eq("class_id", class_id)
          .maybeSingle();
        if (foundAssignment && foundAssignment.teacher_id)
          teacher_id = foundAssignment.teacher_id;
      }

      if (!student_name && student_id) {
        const { data: studentRecord, error: studentFetchError } =
          await supabaseAdmin
            .from("students")
            .select("name")
            .eq("id", student_id)
            .maybeSingle();

        if (studentFetchError) throw studentFetchError;
        if (studentRecord && studentRecord.name) {
          student_name = studentRecord.name;
        }
      }

      if (!teacher_id) {
        teacher_id = await this._ensureTeacherExists();
      }

      if (!teacher_id) {
        throw new Error("Unable to resolve teacher_id for grade creation.");
      }

      const school_year = gradeData.school_year || "2026-2027";
      const grading_period = gradeData.grading_period || "1st Semester";

      let existingGradeId = null;
      if (student_id && subject_id && class_id) {
        const { data: existingGrade, error: existingGradeError } =
          await supabaseAdmin
            .from("grades")
            .select("id")
            .eq("student_id", student_id)
            .eq("subject_id", subject_id)
            .eq("class_id", class_id)
            .eq("school_year", school_year)
            .eq("grading_period", grading_period)
            .maybeSingle();

        if (existingGradeError) throw existingGradeError;
        if (existingGrade && existingGrade.id) {
          existingGradeId = existingGrade.id;
        }
      }

      // 4. Clean and reconcile alternate grade properties (e.g., q1_grade vs preliminary_grade)
      const preliminary_grade =
        parseFloat(gradeData.preliminary_grade || gradeData.q1_grade) || 0;
      const midterm_grade =
        parseFloat(gradeData.midterm_grade || gradeData.q2_grade) || 0;
      const final_grade =
        parseFloat(gradeData.final_grade || gradeData.q3_grade) || 0;
      const fourth_period_grade =
        parseFloat(gradeData.fourth_period_grade || gradeData.q4_grade) || 0;

      // Calculate total average
      const average_grade = parseFloat(
        (
          (preliminary_grade +
            midterm_grade +
            final_grade +
            fourth_period_grade) /
          4
        ).toFixed(2),
      );
      const remarks = average_grade >= 75 ? "Passed" : "Failed";

      // 5. Construct a structured payload matching your Supabase Schema perfectly
      const finalPayload = {
        student_id,
        class_id,
        subject_id,
        teacher_id: teacher_id || null,
        preliminary_grade,
        midterm_grade,
        final_grade,
        fourth_period_grade,
        q1_grade: preliminary_grade,
        q2_grade: midterm_grade,
        q3_grade: final_grade,
        q4_grade: fourth_period_grade,
        school_year: gradeData.school_year || "2026-2027",
        grading_period: gradeData.grading_period || "1st Semester",
      };

      if (existingGradeId) {
        const { data, error } = await supabaseAdmin
          .from("grades")
          .update(finalPayload)
          .eq("id", existingGradeId)
          .select();

        if (error) throw error;
        return data[0];
      }

      // 6. Execute insert query
      const { data, error } = await supabaseAdmin
        .from("grades")
        .insert([finalPayload])
        .select();

      if (error) {
        if (
          error.code === "23505" ||
          error.message?.includes("duplicate key value")
        ) {
          const { data: fallbackGrade, error: fallbackError } =
            await supabaseAdmin
              .from("grades")
              .select("id")
              .eq("student_id", student_id)
              .eq("subject_id", subject_id)
              .eq("class_id", class_id)
              .eq("school_year", school_year)
              .eq("grading_period", grading_period)
              .maybeSingle();

          if (fallbackError) throw fallbackError;
          if (fallbackGrade?.id) {
            const { data: updatedData, error: updateError } =
              await supabaseAdmin
                .from("grades")
                .update(finalPayload)
                .eq("id", fallbackGrade.id)
                .select();

            if (updateError) throw updateError;
            return updatedData[0];
          }

          throw new Error(
            "This student already has a grade entry for this subject and section.",
          );
        }
        throw error;
      }
      return data[0];
    } catch (error) {
      throw new Error(`Create grade error: ${error.message}`);
    }
  },

  // Update grade
  async updateGrade(gradeId, updateData) {
    try {
      const allowedFields = [
        "student_id",
        "class_id",
        "subject_id",
        "teacher_id",
        "preliminary_grade",
        "midterm_grade",
        "final_grade",
        "fourth_period_grade",
        "q1_grade",
        "q2_grade",
        "q3_grade",
        "q4_grade",
        "average_grade",
        "remarks",
        "school_year",
        "grading_period",
      ];

      const payload = {};
      Object.keys(updateData).forEach((key) => {
        if (allowedFields.includes(key)) {
          payload[key] = updateData[key];
        }
      });

      const gradeFieldsUpdated = [
        "preliminary_grade",
        "midterm_grade",
        "final_grade",
        "fourth_period_grade",
        "q1_grade",
        "q2_grade",
        "q3_grade",
        "q4_grade",
      ];

      const shouldRecalculate = gradeFieldsUpdated.some((field) =>
        Object.prototype.hasOwnProperty.call(updateData, field),
      );

      if (shouldRecalculate) {
        const { data: gradeData, error: fetchError } = await supabaseAdmin
          .from("grades")
          .select("*")
          .eq("id", gradeId)
          .single();
        if (fetchError) throw fetchError;

        const q1 =
          parseFloat(
            payload.preliminary_grade ??
              payload.q1_grade ??
              gradeData.preliminary_grade ??
              gradeData.q1_grade ??
              0,
          ) || 0;
        const q2 =
          parseFloat(
            payload.midterm_grade ??
              payload.q2_grade ??
              gradeData.midterm_grade ??
              gradeData.q2_grade ??
              0,
          ) || 0;
        const q3 =
          parseFloat(
            payload.final_grade ??
              payload.q3_grade ??
              gradeData.final_grade ??
              gradeData.q3_grade ??
              0,
          ) || 0;
        const q4 =
          parseFloat(
            payload.fourth_period_grade ??
              payload.q4_grade ??
              gradeData.fourth_period_grade ??
              gradeData.q4_grade ??
              0,
          ) || 0;

        payload.preliminary_grade = q1;
        payload.midterm_grade = q2;
        payload.final_grade = q3;
        payload.fourth_period_grade = q4;
        payload.q1_grade = q1;
        payload.q2_grade = q2;
        payload.q3_grade = q3;
        payload.q4_grade = q4;
        payload.average_grade = parseFloat(
          ((q1 + q2 + q3 + q4) / 4).toFixed(2),
        );
        payload.remarks = payload.average_grade >= 75 ? "Passed" : "Failed";
      }

      const { data, error } = await supabaseAdmin
        .from("grades")
        .update(payload)
        .eq("id", gradeId)
        .select();
      if (error) throw error;
      return data[0];
    } catch (error) {
      throw new Error(`Update grade error: ${error.message}`);
    }
  },

  async _populateStudentNames(gradeRecords) {
    const studentIds = Array.from(
      new Set(gradeRecords.map((record) => record.student_id).filter(Boolean)),
    );

    if (studentIds.length === 0) {
      return gradeRecords;
    }

    const { data: students, error: studentError } = await supabaseAdmin
      .from("students")
      .select("id, name")
      .in("id", studentIds);
    if (studentError) throw studentError;

    const studentMap = (students || []).reduce((acc, student) => {
      if (student?.id) acc[student.id] = student.name;
      return acc;
    }, {});

    return gradeRecords.map((record) => ({
      ...record,
      student_name:
        record.student_name || studentMap[record.student_id] || null,
    }));
  },

  // Delete grade
  async deleteGrade(gradeId) {
    try {
      const { error } = await supabaseAdmin
        .from("grades")
        .delete()
        .eq("id", gradeId);
      if (error) throw error;
      return { success: true };
    } catch (error) {
      throw new Error(`Delete grade error: ${error.message}`);
    }
  },
};

module.exports = gradeService;
