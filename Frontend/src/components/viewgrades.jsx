import React, { useState, useEffect } from "react";
import { toast, ToastContainer } from "react-toastify";
import "../../css/viewgrades.css";

const API_BASE_URL = "http://localhost:5000/api";

const ViewGrades = ({
  selectedSubject,
  selectedSubjectId,
  selectedSection,
  selectedSectionId,
  onBack,
}) => {
  const [sectionsList, setSectionsList] = useState([]);

  // 1. Initialize activeTab state FIRST
  const [activeTab, setActiveTab] = useState(selectedSection || "");

  // 2. Safely run the find operation AFTER activeTab is initialized
  const activeClassId =
    sectionsList.find((s) => {
      const sectionName =
        s.displayName || s.name || s.class_name || s.section_name || "";
      return sectionName === activeTab || s.id === selectedSectionId;
    })?.id ||
    sectionsList?.[0]?.id ||
    null;

  // 3. Declare the rest of your states
  const [grades, setGrades] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    studentId: null,
  });

  // Inline Spreadsheet Editing Tracking States
  const [editingCell, setEditingCell] = useState(null);
  const [editValue, setEditValue] = useState("");

  // Student Modal Toggle States
  const [showAddStudentModal, setShowAddStudentModal] = useState(false);
  const [newStudent, setNewStudent] = useState({ id: "", name: "" });

  // --- STATE FOR ENROLLED STUDENTS LIST ---
  const [enrolledStudents, setEnrolledStudents] = useState([]);
  const [csrfToken, setCsrfToken] = useState("");

  const getCsrfTokenFromCookie = () => {
    const match = document.cookie
      .split("; ")
      .find((row) => row.startsWith("XSRF-TOKEN="));
    return match ? decodeURIComponent(match.split("=")[1]) : null;
  };

  const fetchCsrfToken = async () => {
    try {
      const response = await fetch(
        "http://localhost:5000/api/auth/csrf-token",
        {
          credentials: "include",
          mode: "cors",
          headers: {
            Accept: "application/json",
          },
        },
      );
      if (response.ok) {
        const data = await response.json();
        if (data?.csrfToken) {
          setCsrfToken(data.csrfToken);
          return data.csrfToken;
        }
      }
    } catch (err) {
      console.error("Failed to load CSRF token:", err);
    }

    const cookieToken = getCsrfTokenFromCookie();
    if (cookieToken) {
      setCsrfToken(cookieToken);
      return cookieToken;
    }
    return null;
  };

  useEffect(() => {
    fetchCsrfToken();
  }, []);

  // 1. FETCH ASSIGNED SECTIONS FOR THIS SUBJECT
  useEffect(() => {
    const fetchSections = async () => {
      try {
        setIsLoading(true);
        const res = await fetch(
          `${API_BASE_URL}/subjects/${selectedSubjectId || selectedSubject}/sections`,
        );

        if (!res.ok) throw new Error("Failed to fetch sections");

        const data = await res.json(); // Expected format: [{ id: "...", name: "..." }, ...]
        console.log("Backend sections response:", data);

        setSectionsList(data);

        if (data && data.length > 0) {
          const normalized = data.map((section) => ({
            ...section,
            displayName:
              section.name ||
              section.class_name ||
              section.section_name ||
              "Class A",
          }));

          const firstSection = normalized[0];
          const selectedName = selectedSection || firstSection.displayName;
          const matchedSection = normalized.find(
            (s) => s.displayName === selectedName || s.id === selectedSectionId,
          );

          setSectionsList(normalized);
          setActiveTab(
            matchedSection
              ? matchedSection.displayName
              : firstSection.displayName,
          );
        } else {
          setSectionsList([]);
          setActiveTab("");
        }
      } catch (err) {
        console.error("Error loading sections:", err);
        setSectionsList([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSections();
  }, [selectedSubject, selectedSection, selectedSubjectId, selectedSectionId]);

  const fetchStudentName = async (studentId) => {
    try {
      const res = await fetch(`${API_BASE_URL}/students/${studentId}`);
      if (!res.ok) return null;
      const json = await res.json();
      return json.data?.name || null;
    } catch (err) {
      console.error("Error fetching student name:", err);
      return null;
    }
  };

  const populateStudentNames = async (gradeRows) => {
    const missingNameIds = Array.from(
      new Set(
        gradeRows
          .filter((row) => !row.student_name && row.student_id)
          .map((row) => row.student_id),
      ),
    );

    if (missingNameIds.length === 0) {
      return gradeRows;
    }

    const nameMap = {};
    await Promise.all(
      missingNameIds.map(async (studentId) => {
        const name = await fetchStudentName(studentId);
        if (name) {
          nameMap[studentId] = name;
        }
      }),
    );

    return gradeRows.map((row) => ({
      ...row,
      student_name:
        row.student_name || nameMap[row.student_id] || row.student_name,
    }));
  };

  // 2. FETCH GRADES FOR THE ACTIVE CLASS SECTION
  const fetchClassGrades = async () => {
    if (!activeClassId) {
      setGrades([]);
      return;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/grades/class/${activeClassId}`);
      if (!res.ok) throw new Error("Failed to fetch grades");

      const json = await res.json();
      const classGrades = json.data || [];
      const gradesWithNames = await populateStudentNames(classGrades);

      const filtered =
        selectedSubjectId || selectedSubject
          ? gradesWithNames.filter((g) => {
              const subjectIdMatches =
                g.subject_id === selectedSubjectId ||
                g.subject === selectedSubjectId;
              const subjectNameMatches =
                (g.subject_name &&
                  selectedSubject &&
                  g.subject_name === selectedSubject) ||
                (g.subject && selectedSubject && g.subject === selectedSubject);
              return subjectIdMatches || subjectNameMatches;
            })
          : gradesWithNames;

      setGrades(filtered);
    } catch (err) {
      console.error("Error fetching grades:", err);
      setGrades([]);
    }
  };

  useEffect(() => {
    fetchClassGrades();
  }, [activeClassId, selectedSubjectId]);

  // 3. Fetch students assigned to this specific grade/section when the modal opens
  useEffect(() => {
    const fetchEnrolledStudents = async () => {
      try {
        const sectionName = activeTab;
        let response = await fetch(
          `${API_BASE_URL}/students/section/${encodeURIComponent(sectionName)}`,
        );

        let json = await response.json();
        let allStudents = json.data || [];

        if (!Array.isArray(allStudents) || allStudents.length === 0) {
          const fallbackResponse = await fetch(`${API_BASE_URL}/students`);
          if (fallbackResponse.ok) {
            const fallbackJson = await fallbackResponse.json();
            allStudents = fallbackJson.data || [];
          }
        }

        const normalizedSectionName = sectionName
          .toString()
          .trim()
          .toLowerCase();
        const filteredStudents = Array.isArray(allStudents)
          ? allStudents.filter((student) => {
              const studentSection = (
                student.section ||
                student.className ||
                student.class_name ||
                student.subject_section ||
                ""
              )
                .toString()
                .trim()
                .toLowerCase();
              return (
                studentSection === normalizedSectionName ||
                studentSection.includes(normalizedSectionName) ||
                normalizedSectionName.includes(studentSection)
              );
            })
          : [];

        setEnrolledStudents(
          filteredStudents.length > 0 ? filteredStudents : allStudents,
        );
      } catch (err) {
        console.error("Failed to load enrolled students:", err);
        setEnrolledStudents([]);
      }
    };

    if (showAddStudentModal && activeTab) {
      fetchEnrolledStudents();
    }
  }, [showAddStudentModal, activeTab]);

  // --- ARITHMETIC UTILITIES ---
  const calculateDerivedValues = (student) => {
    const q1 = parseFloat(student.q1_grade || student.preliminary) || 0;
    const q2 = parseFloat(student.q2_grade || student.midterm) || 0;
    const q3 = parseFloat(student.q3_grade || student.final) || 0;
    const q4 = parseFloat(student.q4_grade || student.fourth) || 0;

    const average = parseFloat(((q1 + q2 + q3 + q4) / 4).toFixed(2));
    const remarks = average >= 75 ? "Passed" : "Failed";
    return { average, remarks };
  };

  // --- CELL INTERACTION HANDLERS ---
  const handleCellClick = (studentId, field, value) => {
    setEditingCell({ studentId, field });
    setEditValue(value ?? 0);
  };

  const handleCellChange = (e) => {
    setEditValue(e.target.value);
  };

  const persistGradeChange = async (studentRow) => {
    try {
      const token = csrfToken || (await fetchCsrfToken());
      if (!token) return;

      const payload = {
        ...studentRow,
        student_id: studentRow.student_id || studentRow.studentId || null,
        subject_id: studentRow.subject_id || selectedSubjectId || null,
        subject_name: studentRow.subject_name || selectedSubject || "",
        class_id: studentRow.class_id || activeClassId || null,
        class_name: studentRow.class_name || activeTab || "",
        school_year: studentRow.school_year || "2026-2027",
        grading_period: studentRow.grading_period || "1st Semester",
      };

      const response = await fetch(`${API_BASE_URL}/grades/${studentRow.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "X-CSRF-Token": token,
        },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const json = await response.json().catch(() => ({}));
        throw new Error(json.error || "Failed to save grade");
      }

      const json = await response.json();
      if (json?.data) {
        setGrades((prev) =>
          prev.map((item) =>
            item.id === studentRow.id ? { ...item, ...json.data } : item,
          ),
        );
      }
    } catch (err) {
      console.error("Failed to persist grade change:", err);
    }
  };

  const handleCellBlur = () => {
    if (editingCell) {
      const { studentId, field } = editingCell;
      let newValue = parseFloat(editValue);

      if (isNaN(newValue)) newValue = 0;
      if (newValue < 0) newValue = 0;
      if (newValue > 100) newValue = 100;

      let updatedStudent = null;
      setGrades((prev) =>
        prev.map((student) => {
          if (student.id === studentId) {
            const nextStudent = { ...student, [field]: newValue };

            if (
              field === "q1_grade" ||
              field === "preliminary" ||
              field === "preliminary_grade"
            ) {
              nextStudent.q1_grade = newValue;
              nextStudent.preliminary_grade = newValue;
            }
            if (
              field === "q2_grade" ||
              field === "midterm" ||
              field === "midterm_grade"
            ) {
              nextStudent.q2_grade = newValue;
              nextStudent.midterm_grade = newValue;
            }
            if (
              field === "q3_grade" ||
              field === "final" ||
              field === "final_grade"
            ) {
              nextStudent.q3_grade = newValue;
              nextStudent.final_grade = newValue;
            }
            if (
              field === "q4_grade" ||
              field === "fourth" ||
              field === "fourth_period_grade"
            ) {
              nextStudent.q4_grade = newValue;
              nextStudent.fourth_period_grade = newValue;
            }

            const { average, remarks } = calculateDerivedValues(nextStudent);
            updatedStudent = {
              ...nextStudent,
              average_grade: average,
              remarks,
            };
            return updatedStudent;
          }
          return student;
        }),
      );

      if (updatedStudent) {
        void persistGradeChange(updatedStudent);
      }
      setEditingCell(null);
      setEditValue("");
    }
  };

  const handleCellKeyDown = (e) => {
    if (e.key === "Enter") handleCellBlur();
    if (e.key === "Escape") setEditingCell(null);
  };

  // --- SAVE OPERATION ---
  const handleBulkSaveChanges = async () => {
    try {
      setIsSaving(true);
      const token = csrfToken || (await fetchCsrfToken());
      if (!token) throw new Error("Unable to obtain CSRF token.");

      const response = await fetch(`${API_BASE_URL}/grades/bulk-update`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "X-CSRF-Token": token,
        },
        credentials: "include",
        body: JSON.stringify({ grades }),
      });

      const json = await response.json();
      if (!response.ok) {
        throw new Error(
          json.error || json.message || "Database updates rejected.",
        );
      }

      if (Array.isArray(json.data)) {
        setGrades((prevGrades) =>
          prevGrades.map((oldGrade) => {
            const updatedGrade = json.data.find(
              (newData) => newData.id === oldGrade.id,
            );
            return updatedGrade
              ? { ...updatedGrade, student_name: oldGrade.student_name }
              : oldGrade;
          }),
        );
      }

      toast.success("Grades saved successfully!", { position: "top-center" });
    } catch (err) {
      toast.error(`Failed to sync changes: ${err.message}`, {
        position: "top-center",
      });
    } finally {
      setIsSaving(false);
    }
  };

  // --- SINGLE SAVE OPERATION ---
  const handleSaveSingleGrade = async (student) => {
    try {
      const token = csrfToken || (await fetchCsrfToken());
      if (!token) throw new Error("Unable to obtain CSRF token.");

      const response = await fetch(`${API_BASE_URL}/grades/${student.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "X-CSRF-Token": token,
        },
        credentials: "include",
        body: JSON.stringify(student),
      });

      if (!response.ok) {
        const json = await response.json();
        throw new Error(json.error || "Failed to save grade");
      }

      toast.success(`Saved grades for ${student.student_name}!`, {
        position: "top-center",
      });
    } catch (err) {
      toast.error(`Failed to save: ${err.message}`, { position: "top-center" });
    }
  };

  // --- ADD STUDENT HANDLERS ---
  const openAddStudentModal = async () => {
    setNewStudent({ id: "", name: "" });
    setEnrolledStudents([]);
    await fetchCsrfToken();
    setShowAddStudentModal(true);
  };

  const closeAddStudentModal = () => {
    setShowAddStudentModal(false);
    setNewStudent({ id: "", name: "" });
  };

  const handleNewStudentChange = (e) => {
    const { name, value } = e.target;
    const student = enrolledStudents.find((stu) => stu.name === value);
    setNewStudent((prev) => ({
      ...prev,
      [name]: value,
      id: student?.id || "",
    }));
  };

  // Inside viewgrades.jsx (handleAddStudentSubmit)
  const handleAddStudentSubmit = async (e) => {
    e.preventDefault();

    const resolvedClassId = activeClassId || sectionsList?.[0]?.id || null;
    if (!resolvedClassId) {
      toast.error(
        "Please ensure a valid section/class is assigned to this subject first.",
        { position: "top-center" },
      );
      return;
    }

    let studentId = newStudent.id;
    let studentName = newStudent.name ? newStudent.name.trim() : "";

    try {
      const token = await fetchCsrfToken();
      if (!token) {
        toast.error(
          "Unable to load CSRF token. Please refresh and try again.",
          { position: "top-center" },
        );
        return;
      }

      if (!studentName) {
        toast.error("Please select or enter a student name.", {
          position: "top-center",
        });
        return;
      }

      const payload = {
        student_id: studentId || undefined,
        student_name: studentName,
        subject_name: selectedSubject || "",
        class_name: activeTab || sectionsList?.[0]?.name || "Class A",
        class_id: resolvedClassId,
        subject_id: selectedSubjectId,
        preliminary_grade: 0,
        midterm_grade: 0,
        final_grade: 0,
        fourth_period_grade: 0,
        average_grade: 0,
        remarks: "Failed",
        school_year: "2026-2027",
        grading_period: "1st Semester",
      };

      const response = await fetch(`${API_BASE_URL}/grades`, {
        method: "POST",
        mode: "cors",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          "X-CSRF-Token": token,
        },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      const json = await response.json();
      if (!response.ok) {
        throw new Error(json.error || "Could not assign student entry.");
      }

      toast.success("Student assigned to subject successfully!", {
        position: "top-center",
      });

      const addedRow = {
        id: json.data?.id || crypto.randomUUID(),
        student_name: studentName,
        ...payload,
      };
      setGrades((prev) => [...prev, addedRow]);
    } catch (err) {
      toast.error(`${err.message}`, { position: "top-center" });
    }
  };

  // --- DELETE ENTRY ---
  const confirmDelete = (id) => {
    setDeleteModal({ isOpen: true, studentId: id });
  };

  const executeDelete = async () => {
    const { studentId } = deleteModal;
    try {
      const token = await fetchCsrfToken();
      if (!token) throw new Error("Unable to obtain CSRF token.");

      const response = await fetch(`${API_BASE_URL}/grades/${studentId}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          "X-CSRF-Token": token,
        },
        credentials: "include",
      });

      if (!response.ok) throw new Error("Failed to delete record.");

      toast.success("Record dropped successfully.", { position: "top-center" });
      setGrades((prev) => prev.filter((item) => item.id !== studentId));
    } catch (err) {
      toast.error(err.message, { position: "top-center" });
    } finally {
      setDeleteModal({ isOpen: false, studentId: null });
    }
  };

  // --- PRESENTATION RENDERING ---
  const renderCell = (student, databaseField, localFallbackField) => {
    const activeField =
      student[databaseField] !== undefined ? databaseField : localFallbackField;
    const value = student[activeField] ?? 0;
    const isEditing =
      editingCell &&
      editingCell.studentId === student.id &&
      editingCell.field === activeField;

    if (isEditing) {
      return (
        <input
          type="number"
          min="0"
          max="100"
          value={editValue}
          onChange={handleCellChange}
          onBlur={handleCellBlur}
          onKeyDown={handleCellKeyDown}
          autoFocus
          className="grade-input"
        />
      );
    }

    return (
      <span
        className="grade-cell editable"
        onClick={() => handleCellClick(student.id, activeField, value)}
      >
        {value} <span className="edit-hint">✎</span>
      </span>
    );
  };

  const getAverageColor = (avg) => {
    if (avg >= 90) return "excellent";
    if (avg >= 85) return "very-good";
    if (avg >= 80) return "good";
    if (avg >= 75) return "passed";
    return "failed";
  };

  // --- DYNAMIC SUMMARY COMPILATION STATS ---
  const totalStudents = grades.length;
  const classAvg =
    totalStudents > 0
      ? (
          grades.reduce(
            (sum, s) => sum + (s.average_grade || s.average || 0),
            0,
          ) / totalStudents
        ).toFixed(2)
      : "0.00";
  const highestGrade =
    totalStudents > 0
      ? Math.max(
          ...grades.map((s) => s.average_grade || s.average || 0),
        ).toFixed(2)
      : "0.00";
  const lowestGrade =
    totalStudents > 0
      ? Math.min(
          ...grades.map((s) => s.average_grade || s.average || 0),
        ).toFixed(2)
      : "0.00";
  const passedCount = grades.filter(
    (s) => (s.average_grade || s.average || 0) >= 75,
  ).length;
  const failedCount = totalStudents - passedCount;

  if (isLoading)
    return (
      <div className="view-grades">
        <p>Loading class layouts...</p>
      </div>
    );

  return (
    <div className="view-grades">
      <ToastContainer
        autoClose={2000}
        hideProgressBar={false}
        style={{ zIndex: 99999 }}
      />

      <div className="grades-header">
        <button className="btn-back" onClick={onBack}>
          ← Back to Subjects
        </button>
        <div className="subject-info">
          <h1>{selectedSubject}</h1>
          <p>Manage student records and performance evaluations</p>
        </div>
        <button
          className="btn-save"
          onClick={handleBulkSaveChanges}
          disabled={isSaving}
        >
          {isSaving ? "Saving..." : "Save Changes"}
        </button>
      </div>

      <div className="tabs-container">
        <div className="tabs">
          {sectionsList.map((section) => {
            const sectionName =
              section.displayName ||
              section.name ||
              section.class_name ||
              section.section_name ||
              "Class A";
            return (
              <button
                key={section.id || sectionName}
                className={`tab ${activeTab === sectionName ? "active" : ""}`}
                onClick={() => setActiveTab(sectionName)}
              >
                {sectionName}
              </button>
            );
          })}
        </div>
      </div>

      <div className="grades-container">
        <div className="excel-toolbar">
          <div className="toolbar-info">
            <span className="info-item">
              <strong>Subject:</strong> {selectedSubject}
            </span>
            <span className="info-item">
              <strong>Section:</strong> {activeTab}
            </span>
            <span className="info-item">
              <strong>Students:</strong> {totalStudents}
            </span>
          </div>
          <div className="toolbar-actions">
            <button
              className="btn-toolbar btn-toolbar-primary"
              onClick={openAddStudentModal}
            >
              + Add Student
            </button>
            <button
              className="btn-toolbar"
              onClick={() => window.print()}
              style={{ display: "flex", alignItems: "center", gap: "8px" }}
            >
              {/* SVG Icon for better visuals */}
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="6 9 6 2 18 2 18 9"></polyline>
                <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path>
                <rect x="6" y="14" width="12" height="8"></rect>
              </svg>
              Print Report
            </button>
          </div>
        </div>

        {/* Add Student Modal */}
        {showAddStudentModal && (
          <div className="modal-overlay">
            <div className="modal">
              <div className="modal-header">
                <h2>Add Student to Class</h2>
                <button className="modal-close" onClick={closeAddStudentModal}>
                  ✕
                </button>
              </div>
              <form onSubmit={handleAddStudentSubmit}>
                <div className="modal-body">
                  <div className="form-group">
                    <label>
                      Select Student by Name (Enrolled in {activeTab})
                    </label>
                    <select
                      name="name"
                      value={newStudent.name}
                      onChange={handleNewStudentChange}
                      required
                    >
                      <option value="">-- Select a student --</option>
                      {enrolledStudents.map((stu) => (
                        <option key={stu.id} value={stu.name}>
                          {stu.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <p style={{ fontSize: "13px", color: "#666" }}>
                    Note: Students appearing here belong to the Grade Level
                    associated with this subject and section "
                    <strong>{activeTab}</strong>".
                  </p>
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={closeAddStudentModal}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn-primary">
                    Assign to Subject
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {deleteModal.isOpen && (
          <div className="modal-overlay">
            <div className="modal">
              <div className="modal-header">
                <h2>Confirm Deletion</h2>
              </div>
              <div className="modal-body">
                <p>
                  Are you sure you want to remove this student's grade entry?
                  This action cannot be undone.
                </p>
              </div>
              <div className="modal-footer">
                <button
                  className="btn-secondary"
                  onClick={() =>
                    setDeleteModal({ isOpen: false, studentId: null })
                  }
                >
                  Cancel
                </button>
                <button
                  className="btn-primary"
                  style={{ backgroundColor: "#dc3545" }}
                  onClick={executeDelete}
                >
                  Delete Permanently
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="excel-table-wrapper">
          <table className="excel-table">
            <thead>
              <tr>
                <th className="col-id">#</th>
                <th className="col-name">Student Name</th>
                <th className="col-grade">1st Quarter</th>
                <th className="col-grade">2nd Quarter</th>
                <th className="col-grade">3rd Quarter</th>
                <th className="col-grade">4th Quarter</th>
                <th className="col-average">General Average</th>
                <th className="col-remarks">Remarks</th>
                <th className="col-actions">Actions</th>
              </tr>
            </thead>
            <tbody>
              {grades.map((student, index) => {
                const currentAvg =
                  student.average_grade || student.average || 0;
                const currentRemarks = currentAvg >= 75 ? "Passed" : "Failed";
                return (
                  <tr key={student.id}>
                    <td className="col-id">{index + 1}</td>
                    <td className="col-name">
                      {student.student_name ||
                        student.name ||
                        student.student_id ||
                        "Unknown Student"}
                    </td>
                    <td className="col-grade">
                      {renderCell(student, "q1_grade", "preliminary")}
                    </td>
                    <td className="col-grade">
                      {renderCell(student, "q2_grade", "midterm")}
                    </td>
                    <td className="col-grade">
                      {renderCell(student, "q3_grade", "final")}
                    </td>
                    <td className="col-grade">
                      {renderCell(student, "q4_grade", "fourth")}
                    </td>
                    <td
                      className={`col-average ${getAverageColor(currentAvg)}`}
                    >
                      {currentAvg}
                    </td>
                    <td
                      className={`col-remarks ${currentRemarks.toLowerCase()}`}
                    >
                      {currentRemarks}
                    </td>
                    <td
                      className="col-actions"
                      style={{ display: "flex", gap: "8px" }}
                    >
                      <button
                        className="btn-action save"
                        style={{
                          backgroundColor: "#28a745",
                          color: "white",
                          border: "none",
                          padding: "6px 12px",
                          borderRadius: "4px",
                          cursor: "pointer",
                        }}
                        onClick={() => handleSaveSingleGrade(student)}
                      >
                        Save
                      </button>
                      <button
                        className="btn-action delete"
                        onClick={() => confirmDelete(student.id)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="grades-summary">
          <div className="summary-card">
            <h3>Class Statistics Summary</h3>
            <div className="summary-stats">
              <div className="stat-item">
                <span className="stat-label">Class Average:</span>
                <span className="stat-value">{classAvg}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Highest:</span>
                <span className="stat-value">{highestGrade}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Lowest:</span>
                <span className="stat-value">{lowestGrade}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Passed:</span>
                <span className="stat-value passed">{passedCount}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Failed:</span>
                <span className="stat-value failed">{failedCount}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ViewGrades;
