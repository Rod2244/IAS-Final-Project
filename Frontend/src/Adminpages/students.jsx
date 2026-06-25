import React, { useState } from "react";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "../../css/students.css";
import { Users, ActivitySquareIcon, PanelTopInactiveIcon, Edit3Icon, DeleteIcon, UserRoundPen} from 'lucide-react';

const initialStudents = [
  {
    id: 1,
    name: "Juan Dela Cruz",
    lrn: "2023-001234",
    grade: "Grade 3",
    class: "Class A",
    status: "Active",
    dob: "2012-05-18",
    gender: "Male",
    address: "123 Pine St",
    parent: "Ana Dela Cruz",
    contact: "0917-123-4567",
    password: "jd12345",
  },
  {
    id: 2,
    name: "Maria Garcia",
    lrn: "2023-001235",
    grade: "Grade 3",
    class: "Class A",
    status: "Active",
    dob: "2012-07-09",
    gender: "Female",
    address: "45 Oak St",
    parent: "Luis Garcia",
    contact: "0917-234-5678",
    password: "mg2023!",
  },
  {
    id: 3,
    name: "Jose Reyes",
    lrn: "2023-001236",
    grade: "Grade 3",
    class: "Class B",
    status: "Active",
    dob: "2012-11-02",
    gender: "Male",
    address: "78 Elm St",
    parent: "Gloria Reyes",
    contact: "0917-345-6789",
    password: "jrstudent",
  },
  {
    id: 4,
    name: "Ana Santos",
    lrn: "2023-001237",
    grade: "Grade 3",
    class: "Class B",
    status: "Active",
    dob: "2012-03-22",
    gender: "Female",
    address: "90 Maple St",
    parent: "Rogelio Santos",
    contact: "0917-456-7890",
    password: "aspass123",
  },
  {
    id: 5,
    name: "Carlos Mendoza",
    lrn: "2023-001238",
    grade: "Grade 3",
    class: "Class A",
    status: "Active",
    dob: "2012-09-14",
    gender: "Male",
    address: "12 Birch St",
    parent: "May Mendoza",
    contact: "0917-567-8901",
    password: "cmportal",
  },
  {
    id: 6,
    name: "Elena Rodriguez",
    lrn: "2023-001239",
    grade: "Grade 3",
    class: "Class B",
    status: "Active",
    dob: "2012-08-01",
    gender: "Female",
    address: "24 Cedar St",
    parent: "Jose Rodriguez",
    contact: "0917-678-9012",
    password: "erpass!23",
  },
  {
    id: 7,
    name: "Miguel Tan",
    lrn: "2023-001240",
    grade: "Grade 3",
    class: "Class A",
    status: "Active",
    dob: "2012-04-11",
    gender: "Male",
    address: "56 Walnut St",
    parent: "Lina Tan",
    contact: "0917-789-0123",
    password: "mt2023",
  },
  {
    id: 8,
    name: "Sofia Lim",
    lrn: "2023-001241",
    grade: "Grade 3",
    class: "Class B",
    status: "Active",
    dob: "2012-10-27",
    gender: "Female",
    address: "34 Cherry St",
    parent: "Ellen Lim",
    contact: "0917-890-1234",
    password: "slportal",
  },
];

const Students = () => {
  const [students, setStudents] = useState(initialStudents);
  const [showModal, setShowModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showTempPasswordModal, setShowTempPasswordModal] = useState(false);
  const [showGradesModal, setShowGradesModal] = useState(false);
  const [tempPasswordData, setTempPasswordData] = useState(null);
  const [editingStudent, setEditingStudent] = useState(null);
  const [viewingStudent, setViewingStudent] = useState(null);
  const [editingStudentForGrades, setEditingStudentForGrades] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showEditPassword, setShowEditPassword] = useState(false);
  const [createAccountChecked, setCreateAccountChecked] = useState(false);
  const [isCreatingAccount, setIsCreatingAccount] = useState(false);
  const [gradesData, setGradesData] = useState({
    philippine_history: { q1: "", q2: "", q3: "", q4: "" },
    filipino: { q1: "", q2: "", q3: "", q4: "" },
    gmrc: { q1: "", q2: "", q3: "", q4: "" },
    language: { q1: "", q2: "", q3: "", q4: "" },
    literature: { q1: "", q2: "", q3: "", q4: "" },
    makabansa: { q1: "", q2: "", q3: "", q4: "" },
    math: { q1: "", q2: "", q3: "", q4: "" },
    reading: { q1: "", q2: "", q3: "", q4: "" },
    remarks: "",
  });
  const [formData, setFormData] = useState({
    name: "",
    lrn: "",
    email: "",
    grade: "Grade 3",
    class: "Class A",
    status: "Active",
    dob: "",
    gender: "",
    address: "",
    parent: "",
    contact: "",
    password: "",
  });

  const openAddModal = () => {
    setEditingStudent(null);
    setCreateAccountChecked(false);
    setFormData({
      name: "",
      lrn: "",
      email: "",
      grade: "Grade 3",
      class: "Class A",
      status: "Active",
      dob: "",
      gender: "",
      address: "",
      parent: "",
      contact: "",
      password: "",
    });
    setShowModal(true);
  };

  const openEditModal = (student) => {
    setEditingStudent(student.id);
    setFormData({
      name: student.name,
      lrn: student.lrn,
      grade: student.grade,
      class: student.class,
      status: student.status,
      dob: student.dob || "",
      gender: student.gender || "",
      address: student.address || "",
      parent: student.parent || "",
      contact: student.contact || "",
      password: student.password || "",
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingStudent(null);
    setShowEditPassword(false);
  };

  const handleFormChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Generate random password
  const generateRandomPassword = () => {
    const uppercase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const lowercase = "abcdefghijklmnopqrstuvwxyz";
    const numbers = "0123456789";
    const special = "!@#$%^&*";
    const allChars = uppercase + lowercase + numbers + special;

    let password = "";
    // Ensure at least one of each type
    password += uppercase[Math.floor(Math.random() * uppercase.length)];
    password += lowercase[Math.floor(Math.random() * lowercase.length)];
    password += numbers[Math.floor(Math.random() * numbers.length)];
    password += special[Math.floor(Math.random() * special.length)];

    // Fill remaining characters randomly
    for (let i = password.length; i < 12; i++) {
      password += allChars[Math.floor(Math.random() * allChars.length)];
    }

    // Shuffle the password
    password = password
      .split("")
      .sort(() => Math.random() - 0.5)
      .join("");
    return password;
  };

  const handleGeneratePassword = () => {
    const newPassword = generateRandomPassword();
    setFormData((prev) => ({
      ...prev,
      password: newPassword,
    }));
  };

  const handleRegenerateTempPassword = () => {
    const newPassword = generateRandomPassword();
    setTempPasswordData((prev) => ({
      ...prev,
      tempPassword: newPassword,
    }));
  };

  // Helper function to get CSRF token from cookies
  const getCsrfToken = () => {
    const name = "XSRF-TOKEN=";
    const decodedCookie = decodeURIComponent(document.cookie);
    const cookieArray = decodedCookie.split(";");
    for (let cookie of cookieArray) {
      cookie = cookie.trim();
      if (cookie.indexOf(name) === 0) {
        return cookie.substring(name.length, cookie.length);
      }
    }
    return "";
  };

  // Helper function to fetch CSRF token from server
  const fetchCsrfToken = async () => {
    try {
      const response = await fetch(
        "http://localhost:5000/api/auth/csrf-token",
        {
          method: "GET",
          credentials: "include",
        },
      );
      if (response.ok) {
        const data = await response.json();
        return data.csrfToken;
      }
    } catch (error) {
      console.error("Failed to fetch CSRF token:", error);
    }
    return "";
  };

  const handleSaveStudent = async (event) => {
    event.preventDefault();

    // If creating account, call the API endpoint
    if (createAccountChecked) {
      if (!formData.email) {
        toast.error("Email is required to create an account");
        return;
      }

      setIsCreatingAccount(true);
      try {
        // First, try to get token from cookies; if not found, fetch from server
        let csrfToken = getCsrfToken();
        if (!csrfToken) {
          csrfToken = await fetchCsrfToken();
        }
        const response = await fetch(
          "http://localhost:5000/api/students/admin/create-account",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "X-CSRF-Token": csrfToken,
            },
            credentials: "include",
            body: JSON.stringify({
              name: formData.name,
              lrn: formData.lrn,
              email: formData.email,
              grade: formData.grade,
              className: formData.class,
              dateOfBirth: formData.dob,
              gender: formData.gender,
              address: formData.address,
              parentName: formData.parent,
              parentContact: formData.contact,
            }),
          },
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Failed to create student account");
        }

        // Show temporary password modal
        setTempPasswordData({
          name: formData.name,
          email: formData.email,
          tempPassword: data.temporaryPassword,
        });
        setShowTempPasswordModal(true);

        // Add to local students list
        setStudents((prev) => [
          ...prev,
          {
            id: data.student.id,
            name: formData.name,
            lrn: formData.lrn,
            grade: formData.grade,
            class: formData.class,
            status: "Active",
            dob: formData.dob,
            gender: formData.gender,
            address: formData.address,
            parent: formData.parent,
            contact: formData.contact,
            email: formData.email,
          },
        ]);

        closeModal();
      } catch (error) {
        toast.error(`Error creating account: ${error.message}`);
        console.error("Account creation error:", error);
      } finally {
        setIsCreatingAccount(false);
      }
    } else {
      // Original behavior: just update local state without account creation
      if (editingStudent) {
        setStudents((prev) =>
          prev.map((student) =>
            student.id === editingStudent
              ? { ...student, ...formData }
              : student,
          ),
        );
      } else {
        setStudents((prev) => [
          ...prev,
          {
            id: Date.now(),
            ...formData,
            password: formData.password || "default123",
          },
        ]);
      }

      closeModal();
    }
  };

  const handleDeleteStudent = (id) => {
    if (window.confirm("Delete this student?")) {
      setStudents((prev) => prev.filter((student) => student.id !== id));
      toast.success("Student deleted successfully");
    }
  };

  const openViewModal = (student) => {
    setViewingStudent(student);
    setShowViewModal(true);
  };

  const closeViewModal = () => {
    setShowViewModal(false);
    setViewingStudent(null);
    setShowPassword(false);
  };

  const openGradesModal = (student) => {
    setEditingStudentForGrades(student);
    setGradesData({
      philippine_history: { q1: "", q2: "", q3: "", q4: "" },
      filipino: { q1: "", q2: "", q3: "", q4: "" },
      gmrc: { q1: "", q2: "", q3: "", q4: "" },
      language: { q1: "", q2: "", q3: "", q4: "" },
      literature: { q1: "", q2: "", q3: "", q4: "" },
      makabansa: { q1: "", q2: "", q3: "", q4: "" },
      math: { q1: "", q2: "", q3: "", q4: "" },
      reading: { q1: "", q2: "", q3: "", q4: "" },
      remarks: "",
    });
    setShowGradesModal(true);
  };

  const closeGradesModal = () => {
    setShowGradesModal(false);
    setEditingStudentForGrades(null);
    setGradesData({
      philippine_history: { q1: "", q2: "", q3: "", q4: "" },
      filipino: { q1: "", q2: "", q3: "", q4: "" },
      gmrc: { q1: "", q2: "", q3: "", q4: "" },
      language: { q1: "", q2: "", q3: "", q4: "" },
      literature: { q1: "", q2: "", q3: "", q4: "" },
      makabansa: { q1: "", q2: "", q3: "", q4: "" },
      math: { q1: "", q2: "", q3: "", q4: "" },
      reading: { q1: "", q2: "", q3: "", q4: "" },
      remarks: "",
    });
  };

  const handleGradesChange = (event) => {
    const { name, value } = event.target;
    setGradesData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSaveGrades = async (event) => {
    event.preventDefault();

    // Validate that at least one subject has all quarters filled
    const subjectsToSave = [];
    const subjectNames = [
      "Filipino",
      "GMRC",
      "Language",
      "Literature",
      "Makabansa",
      "Math",
      "Reading",
    ];
    const subjectKeys = [
      "filipino",
      "gmrc",
      "language",
      "literature",
      "makabansa",
      "math",
      "reading",
    ];

    for (let i = 0; i < subjectKeys.length; i++) {
      const key = subjectKeys[i];
      const grades = gradesData[key];

      // Check if any quarter has a value
      if (grades.q1 || grades.q2 || grades.q3 || grades.q4) {
        // If any quarter is filled, all must be filled
        if (!grades.q1 || !grades.q2 || !grades.q3 || !grades.q4) {
          toast.error(`${subjectNames[i]}: All quarterly grades are required`);
          return;
        }

        // Validate grades are 0-100
        const q1 = parseFloat(grades.q1);
        const q2 = parseFloat(grades.q2);
        const q3 = parseFloat(grades.q3);
        const q4 = parseFloat(grades.q4);

        if (
          isNaN(q1) ||
          isNaN(q2) ||
          isNaN(q3) ||
          isNaN(q4) ||
          q1 < 0 ||
          q1 > 100 ||
          q2 < 0 ||
          q2 > 100 ||
          q3 < 0 ||
          q3 > 100 ||
          q4 < 0 ||
          q4 > 100
        ) {
          toast.error(`${subjectNames[i]}: Grades must be between 0-100`);
          return;
        }

        const average = ((q1 + q2 + q3 + q4) / 4).toFixed(2);
        subjectsToSave.push({
          subject: subjectNames[i],
          q1: q1,
          q2: q2,
          q3: q3,
          q4: q4,
          average: average,
        });
      }
    }

    if (subjectsToSave.length === 0) {
      toast.error("Please enter grades for at least one subject");
      return;
    }

    try {
      // Save all grades at once
      const response = await fetch("http://localhost:5000/api/grades/batch", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          student_id: editingStudentForGrades.id,
          student_name: editingStudentForGrades.name,
          class_name: editingStudentForGrades.class,
          grade_level: editingStudentForGrades.grade,
          grades: subjectsToSave,
          remarks: gradesData.remarks || "Completed",
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to save grades");
      }

      toast.success(
        `Grades saved for ${editingStudentForGrades.name} (${subjectsToSave.length} subjects)`,
      );
      closeGradesModal();
    } catch (error) {
      toast.error(`Error saving grades: ${error.message}`);
      console.error("Grades save error:", error);
    }
  };

  const totalStudents = students.length;
  const activeStudents = students.filter(
    (student) => student.status === "Active",
  ).length;
  const inactiveStudents = totalStudents - activeStudents;

  return (
    <div className="students-page">
      <div className="page-header">
        <h1>Students Management</h1>
        <button className="btn-primary" onClick={openAddModal}>
          + Add New Student
        </button>
      </div>

      {/* Stats Cards */}
      <div className="stats-row">
        <div className="stat-card-small">
          <div className="stat-icon-small blue">
            <Users size={24} />
          </div>
          <div className="stat-info-small">
            <h3>Total Students</h3>
            <p className="stat-number-small">{totalStudents}</p>
          </div>
        </div>
        
        <div className="stat-card-small">
          <div className="stat-icon-small green">
            <ActivitySquareIcon size={24} />
          </div>
          <div className="stat-info-small">
            <h3>Active</h3>
            <p className="stat-number-small">{activeStudents}</p>
          </div>
        </div>
        
        <div className="stat-card-small">
          <div className="stat-icon-small orange">
            <PanelTopInactiveIcon size={24} />
          </div>
          <div className="stat-info-small">
            <h3>Inactive</h3>
            <p className="stat-number-small">{inactiveStudents}</p>
          </div>
        </div>
      </div>

      {/* Filter Section */}
      <div className="filter-section">
        <div className="filter-group">
          <label>Grade Level:</label>
          <select
            name="grade"
            value={formData.grade}
            onChange={handleFormChange}
          >
            <option>All Grades</option>
            <option>Grade 1</option>
            <option>Grade 2</option>
            <option>Grade 3</option>
            <option>Grade 4</option>
            <option>Grade 5</option>
            <option>Grade 6</option>
          </select>
        </div>
        <div className="filter-group">
          <label>Class:</label>
          <select
            name="class"
            value={formData.class}
            onChange={handleFormChange}
          >
            <option>All Classes</option>
            <option>Class A</option>
            <option>Class B</option>
          </select>
        </div>
        <div className="filter-group">
          <label>Status:</label>
          <select
            name="status"
            value={formData.status}
            onChange={handleFormChange}
          >
            <option>All Status</option>
            <option>Active</option>
            <option>Inactive</option>
          </select>
        </div>
        <div className="search-box">
          <input type="text" placeholder="Search student..." />
          <span className="search-icon">🔍</span>
        </div>
      </div>

      {/* Students Table */}
      <div className="students-table-container">
        <table className="students-table">
          <thead>
            <tr>
              <th>Student Name</th>
              <th>LRN</th>
              <th>Grade Level</th>
              <th>Class</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {students.map((student) => (
              <tr key={student.id}>
                <td>
                  <div className="student-cell">
                    <div className="student-avatar-small">
                      {student.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </div>
                    <span className="student-name">{student.name}</span>
                  </div>
                </td>
                <td>{student.lrn}</td>
                <td>{student.grade}</td>
                <td>
                  <span
                    className={`class-badge-small ${student.class === "Class A" ? "class-a" : "class-b"}`}
                  >
                    {student.class}
                  </span>
                </td>
                <td>
                  <span
                    className={`status-badge ${student.status === "Active" ? "active" : "inactive"}`}
                  >
                    {student.status}
                  </span>
                </td>
                <td>
                  <div className="action-buttons">
                    <button
                      className="btn-icon"
                      title="View"
                      onClick={() => openViewModal(student)}
                    >
                      <svg
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                        <circle cx="12" cy="12" r="3"></circle>
                      </svg>
                    </button>
                    <button
                      className="btn-icon"
                      title="Edit Grades"
                      onClick={() => openGradesModal(student)}
                    >
                      <Edit3Icon size={24} />
                    </button>
                    <button
                      className="btn-icon"
                      title="Edit"
                      onClick={() => openEditModal(student)}
                    >
                      <UserRoundPen size={24} />
                    </button>
                    <button
                      className="btn-icon"
                      title="Delete"
                      onClick={() => handleDeleteStudent(student.id)}
                    >
                      <DeleteIcon size={24} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add/Edit Student Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2>{editingStudent ? "Edit Student" : "Add New Student"}</h2>
              <button className="modal-close" onClick={closeModal}>
                ✕
              </button>
            </div>
            <form className="student-form" onSubmit={handleSaveStudent}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Student Name *</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleFormChange}
                    placeholder="Enter student name"
                    required
                  />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Email (For Account Creation)</label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleFormChange}
                      placeholder="Enter student email"
                      disabled={!createAccountChecked}
                    />
                  </div>
                  <div
                    className="form-group"
                    style={{
                      display: "flex",
                      alignItems: "flex-end",
                      gap: "0.5rem",
                    }}
                  >
                    <label style={{ marginBottom: "0" }}>
                      <input
                        type="checkbox"
                        checked={createAccountChecked}
                        onChange={(e) =>
                          setCreateAccountChecked(e.target.checked)
                        }
                        style={{ marginRight: "0.5rem" }}
                      />
                      Create Auth Account
                    </label>
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>LRN *</label>
                    <input
                      type="text"
                      name="lrn"
                      value={formData.lrn}
                      onChange={handleFormChange}
                      placeholder="Enter LRN"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Status *</label>
                    <select
                      name="status"
                      value={formData.status}
                      onChange={handleFormChange}
                      required
                    >
                      <option>Active</option>
                      <option>Inactive</option>
                    </select>
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Grade Level *</label>
                    <select
                      name="grade"
                      value={formData.grade}
                      onChange={handleFormChange}
                      required
                    >
                      <option>Grade 1</option>
                      <option>Grade 2</option>
                      <option>Grade 3</option>
                      <option>Grade 4</option>
                      <option>Grade 5</option>
                      <option>Grade 6</option>
                    </select>
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Student Portal Password *</label>
                    <div className="password-input-wrapper">
                      <input
                        type={showEditPassword ? "text" : "password"}
                        name="password"
                        value={formData.password}
                        onChange={handleFormChange}
                        placeholder="Enter portal password"
                        required
                      />
                      <button
                        type="button"
                        className="btn-password-toggle"
                        onClick={() => setShowEditPassword(!showEditPassword)}
                        title={
                          showEditPassword ? "Hide password" : "Show password"
                        }
                      >
                        <svg
                          width="20"
                          height="20"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          {showEditPassword ? (
                            <>
                              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                              <circle cx="12" cy="12" r="3"></circle>
                            </>
                          ) : (
                            <>
                              <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                              <line x1="1" y1="1" x2="23" y2="23"></line>
                            </>
                          )}
                        </svg>
                      </button>
                    </div>
                  </div>
                  <div className="form-group">
                    <label>Gender</label>
                    <select
                      name="gender"
                      value={formData.gender}
                      onChange={handleFormChange}
                    >
                      <option value="">Select Gender</option>
                      <option>Male</option>
                      <option>Female</option>
                    </select>
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Date of Birth</label>
                    <input
                      type="date"
                      name="dob"
                      value={formData.dob}
                      onChange={handleFormChange}
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label>Address</label>
                  <textarea
                    name="address"
                    value={formData.address}
                    onChange={handleFormChange}
                    placeholder="Enter address"
                    rows="3"
                  ></textarea>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Parent/Guardian Name</label>
                    <input
                      type="text"
                      name="parent"
                      value={formData.parent}
                      onChange={handleFormChange}
                      placeholder="Enter parent/guardian name"
                    />
                  </div>
                  <div className="form-group">
                    <label>Contact Number</label>
                    <input
                      type="tel"
                      name="contact"
                      value={formData.contact}
                      onChange={handleFormChange}
                      placeholder="Enter contact number"
                    />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={closeModal}
                  disabled={isCreatingAccount}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={
                    isCreatingAccount ||
                    (createAccountChecked && !formData.email)
                  }
                >
                  {isCreatingAccount
                    ? "Creating Account..."
                    : editingStudent
                      ? "Save Changes"
                      : "Add Student"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showViewModal && viewingStudent && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2>Student Details</h2>
              <button className="modal-close" onClick={closeViewModal}>
                ✕
              </button>
            </div>
            <div className="modal-body">
              <div className="view-section">
                <div className="view-row">
                  <div className="view-field">
                    <label>Student Name</label>
                    <p>{viewingStudent.name}</p>
                  </div>
                  <div className="view-field">
                    <label>LRN</label>
                    <p>{viewingStudent.lrn}</p>
                  </div>
                </div>
                <div className="view-row">
                  <div className="view-field">
                    <label>Status</label>
                    <p>
                      <span
                        className={`status-badge ${viewingStudent.status === "Active" ? "active" : "inactive"}`}
                      >
                        {viewingStudent.status}
                      </span>
                    </p>
                  </div>
                  <div className="view-field">
                    <label>Grade Level</label>
                    <p>{viewingStudent.grade}</p>
                  </div>
                </div>
                <div className="view-row">
                  <div className="view-field">
                    <label>Class</label>
                    <p>
                      <span
                        className={`class-badge-small ${viewingStudent.class === "Class A" ? "class-a" : "class-b"}`}
                      >
                        {viewingStudent.class}
                      </span>
                    </p>
                  </div>
                  <div className="view-field">
                    <label>Gender</label>
                    <p>{viewingStudent.gender}</p>
                  </div>
                </div>
                <div className="view-row">
                  <div className="view-field">
                    <label>Student Portal Password</label>
                    <div className="password-display">
                      <p>
                        {showPassword
                          ? viewingStudent.password
                          : "•".repeat((viewingStudent.password || "").length)}
                      </p>
                      <button
                        type="button"
                        className="btn-password-toggle"
                        onClick={() => setShowPassword(!showPassword)}
                        title={showPassword ? "Hide password" : "Show password"}
                      >
                        <svg
                          width="20"
                          height="20"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          {showPassword ? (
                            <>
                              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                              <circle cx="12" cy="12" r="3"></circle>
                            </>
                          ) : (
                            <>
                              <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                              <line x1="1" y1="1" x2="23" y2="23"></line>
                            </>
                          )}
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
                <div className="view-row">
                  <div className="view-field">
                    <label>Date of Birth</label>
                    <p>{viewingStudent.dob}</p>
                  </div>
                  <div className="view-field">
                    <label>Contact Number</label>
                    <p>{viewingStudent.contact}</p>
                  </div>
                </div>
                <div className="view-row-full">
                  <div className="view-field">
                    <label>Address</label>
                    <p>{viewingStudent.address}</p>
                  </div>
                </div>
                <div className="view-row">
                  <div className="view-field">
                    <label>Parent/Guardian Name</label>
                    <p>{viewingStudent.parent}</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="btn-secondary"
                onClick={closeViewModal}
              >
                Close
              </button>
              <button
                type="button"
                className="btn-primary"
                onClick={() => {
                  openEditModal(viewingStudent);
                  closeViewModal();
                }}
              >
                Edit Student
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Temporary Password Modal */}
      {showTempPasswordModal && tempPasswordData && (
        <div className="modal-overlay">
          <div className="modal" style={{ maxWidth: "500px" }}>
            <div className="modal-header">
              <h2>✅ Account Created Successfully</h2>
              <button
                className="modal-close"
                onClick={() => setShowTempPasswordModal(false)}
              >
                ✕
              </button>
            </div>
            <div className="modal-body">
              <div style={{ padding: "1rem 0" }}>
                <p
                  style={{
                    marginBottom: "1.5rem",
                    color: "#666",
                    fontSize: "0.95rem",
                  }}
                >
                  A new student account has been created. Please share the
                  temporary password below with the student. The student will be
                  required to change this password on their first login.
                </p>

                <div
                  style={{
                    backgroundColor: "#f5f5f5",
                    padding: "1rem",
                    borderRadius: "6px",
                    marginBottom: "1.5rem",
                  }}
                >
                  <div style={{ marginBottom: "0.75rem" }}>
                    <label
                      style={{
                        fontWeight: "600",
                        fontSize: "0.85rem",
                        color: "#666",
                      }}
                    >
                      Student Name:
                    </label>
                    <p style={{ margin: "0.25rem 0 0 0", fontSize: "0.95rem" }}>
                      {tempPasswordData.name}
                    </p>
                  </div>
                  <div style={{ marginBottom: "0.75rem" }}>
                    <label
                      style={{
                        fontWeight: "600",
                        fontSize: "0.85rem",
                        color: "#666",
                      }}
                    >
                      Email/Username:
                    </label>
                    <p style={{ margin: "0.25rem 0 0 0", fontSize: "0.95rem" }}>
                      {tempPasswordData.email}
                    </p>
                  </div>
                  <div>
                    <label
                      style={{
                        fontWeight: "600",
                        fontSize: "0.85rem",
                        color: "#666",
                      }}
                    >
                      Temporary Password:
                    </label>
                    <div
                      style={{
                        display: "flex",
                        gap: "0.5rem",
                        marginTop: "0.25rem",
                      }}
                    >
                      <code
                        style={{
                          backgroundColor: "#fff",
                          padding: "0.5rem 0.75rem",
                          borderRadius: "4px",
                          border: "1px solid #ddd",
                          fontFamily: "monospace",
                          fontSize: "1rem",
                          letterSpacing: "0.05em",
                          flex: 1,
                        }}
                      >
                        {tempPasswordData.tempPassword}
                      </code>
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(
                            tempPasswordData.tempPassword,
                          );
                          toast.success("Password copied to clipboard!");
                        }}
                        style={{
                          padding: "0.5rem 1rem",
                          backgroundColor: "#007bff",
                          color: "white",
                          border: "none",
                          borderRadius: "4px",
                          cursor: "pointer",
                          fontSize: "0.85rem",
                          fontWeight: "600",
                        }}
                      >
                        Copy
                      </button>
                      <button
                        type="button"
                        onClick={handleRegenerateTempPassword}
                        style={{
                          padding: "0.5rem 1rem",
                          backgroundColor: "#10b981",
                          color: "white",
                          border: "none",
                          borderRadius: "4px",
                          cursor: "pointer",
                          fontSize: "0.85rem",
                          fontWeight: "600",
                        }}
                      >
                        🔄 Generate
                      </button>
                    </div>
                  </div>
                </div>

                <div
                  style={{
                    backgroundColor: "#fffacd",
                    padding: "0.75rem",
                    borderRadius: "4px",
                    borderLeft: "3px solid #ff9800",
                    marginBottom: "1.5rem",
                  }}
                >
                  <strong style={{ fontSize: "0.9rem" }}>⚠️ Important:</strong>
                  <p
                    style={{
                      margin: "0.5rem 0 0 0",
                      fontSize: "0.85rem",
                      color: "#666",
                    }}
                  >
                    The student must change this password on their first login.
                    Keep this password secure and share it only with the
                    student.
                  </p>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="btn-primary"
                onClick={() => setShowTempPasswordModal(false)}
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Grades Modal */}
      {showGradesModal && (
        <div className="modal-overlay">
          <div
            className="modal"
            style={{ maxWidth: "900px", maxHeight: "85vh", overflowY: "auto" }}
          >
            <div className="modal-header">
              <h2>Edit Grades - {editingStudentForGrades?.name}</h2>
              <button className="modal-close" onClick={closeGradesModal}>
                ✕
              </button>
            </div>
            <form className="student-form" onSubmit={handleSaveGrades}>
              <div className="modal-body">
                <div
                  style={{
                    marginBottom: "1.5rem",
                    padding: "0.75rem",
                    backgroundColor: "#e3f2fd",
                    borderRadius: "4px",
                  }}
                >
                  <p
                    style={{ margin: 0, fontSize: "0.85rem", color: "#1976d2" }}
                  >
                    <strong>Student:</strong> {editingStudentForGrades?.name} |
                    <strong style={{ marginLeft: "0.5rem" }}>LRN:</strong>{" "}
                    {editingStudentForGrades?.lrn} |
                    <strong style={{ marginLeft: "0.5rem" }}>Class:</strong>{" "}
                    {editingStudentForGrades?.class}
                  </p>
                </div>

                {/* Grades Table */}
                <div style={{ overflowX: "auto", marginBottom: "1.5rem" }}>
                  <table
                    style={{
                      width: "100%",
                      borderCollapse: "collapse",
                      fontSize: "14px",
                    }}
                  >
                    <thead>
                      <tr
                        style={{
                          backgroundColor: "#f5f5f5",
                          borderBottom: "2px solid #ddd",
                        }}
                      >
                        <th
                          style={{
                            padding: "10px",
                            textAlign: "left",
                            fontWeight: "600",
                          }}
                        >
                          Subject
                        </th>
                        <th
                          style={{
                            padding: "10px",
                            textAlign: "center",
                            fontWeight: "600",
                          }}
                        >
                          Q1
                        </th>
                        <th
                          style={{
                            padding: "10px",
                            textAlign: "center",
                            fontWeight: "600",
                          }}
                        >
                          Q2
                        </th>
                        <th
                          style={{
                            padding: "10px",
                            textAlign: "center",
                            fontWeight: "600",
                          }}
                        >
                          Q3
                        </th>
                        <th
                          style={{
                            padding: "10px",
                            textAlign: "center",
                            fontWeight: "600",
                          }}
                        >
                          Q4
                        </th>
                        <th
                          style={{
                            padding: "10px",
                            textAlign: "center",
                            fontWeight: "600",
                          }}
                        >
                          Average
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        "Filipino",
                        "GMRC",
                        "Language",
                        "Literature",
                        "Makabansa",
                        "Math",
                        "Reading",
                      ].map((subject, idx) => {
                        const subjectKey = subject
                          .toLowerCase()
                          .replace(/\s+/g, "_");
                        const grades = gradesData[subjectKey] || {
                          q1: "",
                          q2: "",
                          q3: "",
                          q4: "",
                        };
                        const q1 = parseFloat(grades.q1) || 0;
                        const q2 = parseFloat(grades.q2) || 0;
                        const q3 = parseFloat(grades.q3) || 0;
                        const q4 = parseFloat(grades.q4) || 0;
                        const average =
                          grades.q1 && grades.q2 && grades.q3 && grades.q4
                            ? ((q1 + q2 + q3 + q4) / 4).toFixed(2)
                            : "—";

                        return (
                          <tr
                            key={idx}
                            style={{ borderBottom: "1px solid #eee" }}
                          >
                            <td style={{ padding: "10px", fontWeight: "500" }}>
                              {subject}
                            </td>
                            <td style={{ padding: "8px", textAlign: "center" }}>
                              <input
                                type="number"
                                min="0"
                                max="100"
                                value={grades.q1}
                                onChange={(e) => {
                                  setGradesData((prev) => ({
                                    ...prev,
                                    [subjectKey]: {
                                      ...prev[subjectKey],
                                      q1: e.target.value,
                                    },
                                  }));
                                }}
                                placeholder="0"
                                style={{
                                  width: "50px",
                                  padding: "6px",
                                  border: "1px solid #ccc",
                                  borderRadius: "4px",
                                  textAlign: "center",
                                  fontSize: "13px",
                                }}
                              />
                            </td>
                            <td style={{ padding: "8px", textAlign: "center" }}>
                              <input
                                type="number"
                                min="0"
                                max="100"
                                value={grades.q2}
                                onChange={(e) => {
                                  setGradesData((prev) => ({
                                    ...prev,
                                    [subjectKey]: {
                                      ...prev[subjectKey],
                                      q2: e.target.value,
                                    },
                                  }));
                                }}
                                placeholder="0"
                                style={{
                                  width: "50px",
                                  padding: "6px",
                                  border: "1px solid #ccc",
                                  borderRadius: "4px",
                                  textAlign: "center",
                                  fontSize: "13px",
                                }}
                              />
                            </td>
                            <td style={{ padding: "8px", textAlign: "center" }}>
                              <input
                                type="number"
                                min="0"
                                max="100"
                                value={grades.q3}
                                onChange={(e) => {
                                  setGradesData((prev) => ({
                                    ...prev,
                                    [subjectKey]: {
                                      ...prev[subjectKey],
                                      q3: e.target.value,
                                    },
                                  }));
                                }}
                                placeholder="0"
                                style={{
                                  width: "50px",
                                  padding: "6px",
                                  border: "1px solid #ccc",
                                  borderRadius: "4px",
                                  textAlign: "center",
                                  fontSize: "13px",
                                }}
                              />
                            </td>
                            <td style={{ padding: "8px", textAlign: "center" }}>
                              <input
                                type="number"
                                min="0"
                                max="100"
                                value={grades.q4}
                                onChange={(e) => {
                                  setGradesData((prev) => ({
                                    ...prev,
                                    [subjectKey]: {
                                      ...prev[subjectKey],
                                      q4: e.target.value,
                                    },
                                  }));
                                }}
                                placeholder="0"
                                style={{
                                  width: "50px",
                                  padding: "6px",
                                  border: "1px solid #ccc",
                                  borderRadius: "4px",
                                  textAlign: "center",
                                  fontSize: "13px",
                                }}
                              />
                            </td>
                            <td
                              style={{
                                padding: "10px",
                                textAlign: "center",
                                fontWeight: "600",
                                color:
                                  average !== "—"
                                    ? average >= 75
                                      ? "#4caf50"
                                      : "#f44336"
                                    : "#999",
                              }}
                            >
                              {average}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <div className="form-group">
                  <label>Notes/Remarks</label>
                  <textarea
                    value={gradesData.remarks || ""}
                    onChange={(e) =>
                      setGradesData((prev) => ({
                        ...prev,
                        remarks: e.target.value,
                      }))
                    }
                    placeholder="Enter any notes or remarks"
                    rows="3"
                    style={{ width: "100%" }}
                  ></textarea>
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={closeGradesModal}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Save All Grades
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Students;
