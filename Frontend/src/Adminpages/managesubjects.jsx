import React, { useState, useEffect } from "react";
import "../../css/managesubs.css";

// 1. Import React Toastify elements
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// The URL where your Node.js backend is running
const API_BASE_URL = "http://localhost:5000/api";

const ManageSubjects = ({ onOpenClass = () => {} }) => {
  const [subjects, setSubjects] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const [gradeFilter, setGradeFilter] = useState("All Grades");
  const [classFilter, setClassFilter] = useState("All Classes");
  const [subjectFilter, setSubjectFilter] = useState("All Subjects");

  // Modal Visibility States
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const [subjectToEdit, setSubjectToEdit] = useState(null);
  const [subjectToDelete, setSubjectToDelete] = useState(null);

  const [formValues, setFormValues] = useState({
    name: "",
    icon: "📘",
    grade: "Grade 3",
    sections: [{ name: "Class A", students: "0" }],
  });
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

  // --- API BACKEND OPERATIONS ---

  const fetchSubjects = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`${API_BASE_URL}/subjects`);
      if (!response.ok)
        throw new Error("Failed to fetch subjects from server.");

      const data = await response.json();
      setSubjects(data);
    } catch (err) {
      setError(err.message);
      toast.error(`Error loading database: ${err.message}`, {
        position: "top-center",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSubjects();
  }, []);

  useEffect(() => {
    fetchCsrfToken();
  }, []);

  const handleAddSubject = async (event) => {
    event.preventDefault();
    if (!formValues.name.trim()) {
      toast.error("Please enter a subject name.", { position: "top-center" });
      return;
    }

    const subjectName = formValues.name.trim();
    const payload = {
      name: subjectName,
      icon: formValues.icon,
      grade: formValues.grade,
      sections: formValues.sections.map((section) => ({
        id: section.id || section.class_id,
        name: section.name,
        class_name: section.class_name || section.name,
        section_name: section.section_name || "",
        students: Number(section.students) || 0,
      })),
    };

    try {
      const token = await fetchCsrfToken();
      if (!token) throw new Error("Unable to obtain CSRF token.");

      const response = await fetch(`${API_BASE_URL}/subjects`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-CSRF-Token": token,
        },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error("Failed to add new subject.");

      closeAddModal();
      toast.success(`"${subjectName}" added successfully!`, {
        position: "top-center",
      });

      const fetchResponse = await fetch(`${API_BASE_URL}/subjects`);
      if (fetchResponse.ok) {
        const data = await fetchResponse.json();
        setSubjects(data);
      }
    } catch (err) {
      toast.error(`Error adding subject: ${err.message}`, {
        position: "top-center",
      });
    }
  };

  // Inside managesubjects.jsx (handleEditSubject)
  const handleEditSubject = async (event) => {
    event.preventDefault();
    if (!formValues.name.trim() || !subjectToEdit) return;

    const payload = {
      name: formValues.name.trim(),
      icon: formValues.icon,
      grade: formValues.grade,
      sections: formValues.sections.map((section) => ({
        id: section.id || section.class_id || section.classId || null,
        name: section.name,
        class_name: section.class_name || section.name,
        section_name: section.section_name || "",
        students: Number(section.students) || 0,
      })),
    };

    try {
      const token = await fetchCsrfToken();
      if (!token) throw new Error("Unable to obtain CSRF token.");

      const response = await fetch(
        `${API_BASE_URL}/subjects/${subjectToEdit.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            "X-CSRF-Token": token,
          },
          credentials: "include",
          body: JSON.stringify(payload),
        },
      );

      if (!response.ok) throw new Error("Failed to update subject.");

      closeEditModal();
      toast.success("Subject updated successfully!", {
        position: "top-center",
      });

      // Refresh silently
      const fetchResponse = await fetch(`${API_BASE_URL}/subjects`);
      if (fetchResponse.ok) {
        const data = await fetchResponse.json();
        setSubjects(data);
      }
    } catch (err) {
      toast.error(`Error updating subject: ${err.message}`, {
        position: "top-center",
      });
    }
  };

  const handleConfirmDelete = async () => {
    if (!subjectToDelete) return;

    try {
      const token = await fetchCsrfToken();
      if (!token) throw new Error("Unable to obtain CSRF token.");

      const response = await fetch(
        `${API_BASE_URL}/subjects/${subjectToDelete.id}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            "X-CSRF-Token": token,
          },
          credentials: "include",
        },
      );

      const json = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(
          json.error || json.message || "Failed to delete subject.",
        );
      }

      setSubjects((prev) =>
        prev.filter((item) => item.id !== subjectToDelete.id),
      );
      closeDeleteModal();
      toast.success("Subject deleted successfully.", {
        position: "top-center",
      });
    } catch (err) {
      toast.error(`Error deleting subject: ${err.message}`, {
        position: "top-center",
      });
    }
  };

  // --- MODAL & FORM HANDLERS ---

  const openAddModal = () => {
    setFormValues({
      name: "",
      icon: "📘",
      grade: "Grade 3",
      sections: [{ name: "Class A", students: "0" }],
    });
    setShowAddModal(true);
  };

  const closeAddModal = () => setShowAddModal(false);

  // --- NEW: OPEN EDIT MODAL ---
  const openEditModal = (subject) => {
    setSubjectToEdit(subject);
    setFormValues({
      name: subject.name || "",
      icon: subject.icon || "📘",
      grade: subject.grade || "Grade 3",
      sections: (
        subject.classes ||
        subject.sections || [{ name: "Class A", students: "0" }]
      ).map((section) => ({
        id: section.id || section.class_id || section.classId || null,
        name:
          section.name ||
          (section.class_name && section.section_name
            ? `${section.class_name} - ${section.section_name}`
            : section.class_name || section.section_name || "Class A"),
        class_name: section.class_name || section.name || "",
        section_name: section.section_name || "",
        students: section.students || "0",
      })),
    });
    setShowEditModal(true);
  };

  const closeEditModal = () => {
    setSubjectToEdit(null);
    setShowEditModal(false);
    setFormValues({
      name: "",
      icon: "📘",
      grade: "Grade 3",
      sections: [{ name: "Class A", students: "0" }],
    });
  };

  const openDeleteModal = (subject) => {
    setSubjectToDelete(subject);
    setShowDeleteModal(true);
  };

  const closeDeleteModal = () => {
    setSubjectToDelete(null);
    setShowDeleteModal(false);
  };

  const handleFormChange = (event) => {
    const { name, value } = event.target;
    setFormValues((prev) => ({ ...prev, [name]: value }));
  };

  const parseSectionName = (rawName) => {
    const name = (rawName || "").toString().trim();
    if (name.includes(" - ")) {
      const [class_name, section_name] = name.split(" - ", 2);
      return {
        class_name: class_name.trim(),
        section_name: section_name.trim(),
      };
    }
    return {
      class_name: name,
      section_name: "",
    };
  };

  const handleSectionChange = (index, event) => {
    const { name, value } = event.target;
    setFormValues((prev) => ({
      ...prev,
      sections: prev.sections.map((section, idx) => {
        if (idx !== index) return section;
        const updated = { ...section, [name]: value };
        if (name === "name") {
          const parsed = parseSectionName(value);
          return {
            ...updated,
            class_name: parsed.class_name,
            section_name: parsed.section_name,
          };
        }
        return updated;
      }),
    }));
  };

  const addSection = () => {
    setFormValues((prev) => ({
      ...prev,
      sections: [...prev.sections, { name: "Class A", students: "0" }],
    }));
  };

  const removeSection = (index) => {
    setFormValues((prev) => ({
      ...prev,
      sections: prev.sections.filter((_, idx) => idx !== index),
    }));
  };

  // --- FILTER LOGIC ---
  const uniqueSubjectNames = [
    "All Subjects",
    ...new Set(subjects.map((s) => s.name || s.subject_name).filter(Boolean)),
  ];
  const uniqueGrades = [
    "All Grades",
    ...new Set(subjects.map((s) => s.grade || s.grade_level).filter(Boolean)),
  ];
  const uniqueClasses = [
    "All Classes",
    ...new Set(
      subjects.reduce((acc, currentSub) => {
        if (currentSub.classes && Array.isArray(currentSub.classes)) {
          currentSub.classes.forEach((c) => {
            const nameToPush =
              c.name ||
              c.class_name ||
              (c.section_name
                ? `${c.class_name || ""} ${c.section_name}`.trim()
                : null);
            if (nameToPush) acc.push(nameToPush);
          });
        }
        if (currentSub.class_name) acc.push(currentSub.class_name);
        if (currentSub.section_name) acc.push(currentSub.section_name);
        return acc;
      }, []),
    ),
  ];

  const filteredSubjects = subjects.filter((subject) => {
    const sName = subject.name || subject.subject_name;
    const sGrade = subject.grade || subject.grade_level;

    const matchesSubject =
      subjectFilter === "All Subjects" || sName === subjectFilter;
    const matchesGrade = gradeFilter === "All Grades" || sGrade === gradeFilter;

    const matchesClass =
      classFilter === "All Classes" ||
      subject.class_name === classFilter ||
      subject.section_name === classFilter ||
      (subject.classes &&
        Array.isArray(subject.classes) &&
        subject.classes.some((c) => {
          const cName = c.name || c.class_name || c.section_name;
          return cName === classFilter;
        }));

    return matchesSubject && matchesGrade && matchesClass;
  });

  if (isLoading)
    return (
      <div className="manage-subjects">
        <p>Loading subjects database...</p>
      </div>
    );
  if (error)
    return (
      <div className="manage-subjects">
        <p style={{ color: "red" }}>Error: {error}</p>
      </div>
    );

  return (
    <div className="manage-subjects">
      <ToastContainer
        position="top-center"
        autoClose={3000}
        hideProgressBar={false}
        style={{ zIndex: 99999 }}
      />

      <div className="page-header">
        <div>
          <h1>Manage Subjects</h1>
          <p style={{ margin: "6px 0 0", color: "#cbd5e1", fontSize: "14px" }}>
            This page manages the subjects assigned for each grade level and
            feeds the grade-entry form in Students.
          </p>
        </div>
        <button className="btn-primary" onClick={openAddModal}>
          + Add New Subject
        </button>
      </div>

      <div className="filter-section">
        <div className="filter-group">
          <label>Subject:</label>
          <select
            value={subjectFilter}
            onChange={(e) => setSubjectFilter(e.target.value)}
          >
            {uniqueSubjectNames.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        </div>
        <div className="filter-group">
          <label>Grade Level:</label>
          <select
            value={gradeFilter}
            onChange={(e) => setGradeFilter(e.target.value)}
          >
            {uniqueGrades.map((grade) => (
              <option key={grade} value={grade}>
                {grade}
              </option>
            ))}
          </select>
        </div>
        <div className="filter-group">
          <label>Section / Class:</label>
          <select
            value={classFilter}
            onChange={(e) => setClassFilter(e.target.value)}
          >
            {uniqueClasses.map((className) => (
              <option key={className} value={className}>
                {className}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="subjects-grid">
        {filteredSubjects.map((subject) => (
          <div className="subject-card" key={subject.id}>
            <div className="subject-header">
              <div className="subject-icon">{subject.icon}</div>
              <div className="subject-info">
                <h3>{subject.name}</h3>
                <p>{subject.grade}</p>
              </div>
            </div>

            <div
              className="subject-actions"
              style={{ display: "flex", gap: "8px", marginTop: "15px" }}
            >
              <button
                className="btn-primary"
                style={{ flex: 1, padding: "8px" }}
                onClick={() => {
                  const section =
                    (subject.classes || subject.sections || [])[0] || {};
                  const displayName =
                    section.name ||
                    (section.class_name && section.section_name
                      ? `${section.class_name} - ${section.section_name}`
                      : section.class_name || section.section_name) ||
                    "Class A";
                  onOpenClass(
                    subject.name,
                    subject.id,
                    displayName,
                    section.id || section.class_id || null,
                  );
                }}
              >
                Open Class
              </button>
              <button
                className="btn-secondary"
                style={{ flex: 1, padding: "8px" }}
                onClick={() => openEditModal(subject)}
              >
                Edit
              </button>
              <button
                className="btn-secondary"
                style={{
                  flex: 1,
                  padding: "8px",
                  color: "#d9534f",
                  borderColor: "#d9534f",
                }}
                onClick={() => openDeleteModal(subject)}
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* --- ADD MODAL --- */}
      {showAddModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2>Add New Subject</h2>
              <button className="modal-close" onClick={closeAddModal}>
                ✕
              </button>
            </div>
            <form className="subject-form" onSubmit={handleAddSubject}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Subject Name</label>
                  <input
                    type="text"
                    name="name"
                    value={formValues.name}
                    onChange={handleFormChange}
                    placeholder="Enter new subject"
                    required
                  />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Grade Level</label>
                    <select
                      name="grade"
                      value={formValues.grade}
                      onChange={handleFormChange}
                    >
                      <option>Grade 1</option>
                      <option>Grade 2</option>
                      <option>Grade 3</option>
                      <option>Grade 4</option>
                      <option>Grade 5</option>
                      <option>Grade 6</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Icon</label>
                    <input
                      type="text"
                      name="icon"
                      value={formValues.icon}
                      onChange={handleFormChange}
                    />
                  </div>
                </div>
                <div className="section-header">
                  <span>Sections</span>
                  <button
                    type="button"
                    className="btn-small add-section"
                    onClick={addSection}
                  >
                    + Add Section
                  </button>
                </div>
                {formValues.sections.map((section, index) => (
                  <div className="form-row" key={index}>
                    <div className="form-group">
                      <label>Section Name</label>
                      <input
                        type="text"
                        name="name"
                        value={section.name}
                        onChange={(event) => handleSectionChange(index, event)}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>Student Count</label>
                      <input
                        type="number"
                        name="students"
                        value={section.students}
                        onChange={(event) => handleSectionChange(index, event)}
                        min="0"
                        required
                      />
                    </div>
                    <div className="form-group section-remove-group">
                      <button
                        type="button"
                        className="btn-small delete"
                        onClick={() => removeSection(index)}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={closeAddModal}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Add Subject
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- EDIT MODAL --- */}
      {showEditModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2>Edit Subject</h2>
              <button className="modal-close" onClick={closeEditModal}>
                ✕
              </button>
            </div>
            <form className="subject-form" onSubmit={handleEditSubject}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Subject Name</label>
                  <input
                    type="text"
                    name="name"
                    value={formValues.name}
                    onChange={handleFormChange}
                    required
                  />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Grade Level</label>
                    <select
                      name="grade"
                      value={formValues.grade}
                      onChange={handleFormChange}
                    >
                      <option>Grade 1</option>
                      <option>Grade 2</option>
                      <option>Grade 3</option>
                      <option>Grade 4</option>
                      <option>Grade 5</option>
                      <option>Grade 6</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Icon</label>
                    <input
                      type="text"
                      name="icon"
                      value={formValues.icon}
                      onChange={handleFormChange}
                    />
                  </div>
                </div>
                <div className="section-header">
                  <span>Sections</span>
                  <button
                    type="button"
                    className="btn-small add-section"
                    onClick={addSection}
                  >
                    + Add Section
                  </button>
                </div>
                {formValues.sections.map((section, index) => (
                  <div className="form-row" key={index}>
                    <div className="form-group">
                      <label>Section Name</label>
                      <input
                        type="text"
                        name="name"
                        value={section.name}
                        onChange={(event) => handleSectionChange(index, event)}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>Student Count</label>
                      <input
                        type="number"
                        name="students"
                        value={section.students}
                        onChange={(event) => handleSectionChange(index, event)}
                        min="0"
                        required
                      />
                    </div>
                    <div className="form-group section-remove-group">
                      <button
                        type="button"
                        className="btn-small delete"
                        onClick={() => removeSection(index)}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={closeEditModal}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- DELETE MODAL --- */}
      {showDeleteModal && (
        <div className="modal-overlay">
          <div className="modal confirmation-modal">
            <div className="modal-header">
              <h2>Confirm Deletion</h2>
              <button className="modal-close" onClick={closeDeleteModal}>
                ✕
              </button>
            </div>
            <div className="modal-body">
              <p>
                Are you sure you want to delete the subject{" "}
                <strong>{subjectToDelete?.name}</strong> and all its assigned
                classes?
              </p>
              <p
                style={{ color: "#d9534f", fontSize: "14px", marginTop: "8px" }}
              >
                ⚠️ This action cannot be undone.
              </p>
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="btn-secondary"
                onClick={closeDeleteModal}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn-small delete"
                style={{ padding: "10px 20px", borderRadius: "6px" }}
                onClick={handleConfirmDelete}
              >
                Delete Permanently
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageSubjects;
