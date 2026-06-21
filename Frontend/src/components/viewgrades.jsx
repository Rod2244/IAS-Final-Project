import React, { useState, useEffect } from 'react';
import { toast, ToastContainer } from 'react-toastify';
import '../../css/viewgrades.css';

const API_BASE_URL = 'http://localhost:5000/api';

const ViewGrades = ({ selectedSubject, selectedSubjectId, selectedSection, onBack }) => {
  const [sectionsList, setSectionsList] = useState([]);
  const [activeTab, setActiveTab] = useState(selectedSection || '');
  const [grades, setGrades] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Inline Spreadsheet Editing Tracking States
  const [editingCell, setEditingCell] = useState(null);
  const [editValue, setEditValue] = useState('');
  
  // Student Modal Toggle States
  const [showAddStudentModal, setShowAddStudentModal] = useState(false);
  const [newStudent, setNewStudent] = useState({
    name: '',
    q1_grade: '',
    q2_grade: '',
    q3_grade: '',
    q4_grade: '',
  });

  // 1. FETCH ASSIGNED SECTIONS FOR THIS SUBJECT
 useEffect(() => {
    const fetchSections = async () => {
      try {
        setIsLoading(true);
        const res = await fetch(`${API_BASE_URL}/subjects/${selectedSubjectId || selectedSubject}/sections`);
        
        if (!res.ok) throw new Error('Route not found or database mismatch');
        
        const data = await res.json();
        setSectionsList(data);
        
        if (data.length > 0) {
          const initialTab = data.find(s => s.name === selectedSection) || data[0];
          setActiveTab(initialTab.name || initialTab.class_name);
        }
      } catch (err) {
        // Fallback: If backend 404s, explicitly build tabs out of what the user clicked
        console.log("Using local tabs fallback layout due to missing backend endpoint.");
        setSectionsList([
          { id: '1', name: selectedSection || 'Class A' },
          { id: '2', name: 'Class B' }
        ]);
        setActiveTab(selectedSection || 'Class A');
      } finally {
        setIsLoading(false);
      }
    };

    fetchSections();
  }, [selectedSubject, selectedSection, selectedSubjectId]);

  // 2. FETCH GRADES FOR THE ACTIVE CLASS SECTION
const fetchClassGrades = async () => {
    if (!activeTab) return;
    try {
      // Fallback strategy: try fetching filtered list if direct route fails
      const res = await fetch(`${API_BASE_URL}/grades`);
      if (res.ok) {
        const json = await res.json();
        const allGrades = json.data || [];
        
        // Filter grades locally to avoid backend 400 parameter type errors
        const filtered = allGrades.filter(g => 
          (g.class_name === activeTab || g.class_id === activeTab) && 
          (g.subject_name === selectedSubject)
        );
        
        // If your database currently has NO rows matching, let's inject empty array safely
        setGrades(filtered);
      }
    } catch (err) {
      console.error('Error fetching grades:', err);
      setGrades([]); // clear on fail to prevent UI breakage
    }
  };

  useEffect(() => {
    fetchClassGrades();
  }, [activeTab, selectedSubject]);

  // --- ARITHMETIC UTILITIES ---
  const calculateDerivedValues = (student) => {
    const q1 = parseFloat(student.q1_grade || student.preliminary) || 0;
    const q2 = parseFloat(student.q2_grade || student.midterm) || 0;
    const q3 = parseFloat(student.q3_grade || student.final) || 0;
    const q4 = parseFloat(student.q4_grade || student.fourth) || 0;
    
    const average = parseFloat(((q1 + q2 + q3 + q4) / 4).toFixed(2));
    const remarks = average >= 75 ? 'Passed' : 'Failed';
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

  const handleCellBlur = () => {
    if (editingCell) {
      const { studentId, field } = editingCell;
      let newValue = parseFloat(editValue);
      
      if (isNaN(newValue)) newValue = 0;
      if (newValue < 0) newValue = 0;
      if (newValue > 100) newValue = 100;

      setGrades(prev => prev.map(student => {
        if (student.id === studentId) {
          const updatedStudent = { ...student, [field]: newValue };
          const { average, remarks } = calculateDerivedValues(updatedStudent);
          return { ...updatedStudent, average_grade: average, remarks };
        }
        return student;
      }));
      setEditingCell(null);
    }
  };

  const handleCellKeyDown = (e) => {
    if (e.key === 'Enter') handleCellBlur();
    if (e.key === 'Escape') setEditingCell(null);
  };

  // --- SAVE OPERATION (BULK PUT / POST) ---
const handleBulkSaveChanges = async () => {
    try {
      setIsSaving(true);
      const response = await fetch(`${API_BASE_URL}/grades/bulk-update`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ grades }),
      });

      if (!response.ok) throw new Error('Database updates rejected.');
      toast.success('Grades saved successfully! 💾', { position: 'top-center' });
    } catch (err) {
      toast.error(`Failed to sync changes: ${err.message}`, { position: 'top-center' });
    } finally {
      setIsSaving(false);
    }
  };

  // --- ADD STUDENT HANDLERS ---
  const openAddStudentModal = () => {
    setNewStudent({ name: '', q1_grade: '', q2_grade: '', q3_grade: '', q4_grade: '' });
    setShowAddStudentModal(true);
  };

  const closeAddStudentModal = () => setShowAddStudentModal(false);

  const handleNewStudentChange = (e) => {
    const { name, value } = e.target;
    setNewStudent(prev => ({ ...prev, [name]: value }));
  };

const handleAddStudentSubmit = async (e) => {
    e.preventDefault();
    
    // 1. Safely grab the text name entered in the modal input form
    const name = newStudent.name ? newStudent.name.trim() : "";
    if (!name) return;

    // 2. Parse quarterly grades into plain numeric formats
    const q1 = parseFloat(newStudent.q1_grade) || 0;
    const q2 = parseFloat(newStudent.q2_grade) || 0;
    const q3 = parseFloat(newStudent.q3_grade) || 0;
    const q4 = parseFloat(newStudent.q4_grade) || 0;
    
    const calculatedAverage = parseFloat(((q1 + q2 + q3 + q4) / 4).toFixed(2));
    const finalRemarks = calculatedAverage >= 75 ? 'Passed' : 'Failed';

    // 3. Build text-descriptive payload so the backend service resolves real entity UUIDs
    const payload = {
      student_name: name,
      subject_name: selectedSubject || "Math", 
      class_name: activeTab || "Class A",
      
      // Match explicit column types for your schema
      preliminary_grade: q1,
      midterm_grade: q2,
      final_grade: q3,
      fourth_period_grade: q4,
      average_grade: calculatedAverage,
      remarks: finalRemarks,
      school_year: "2026-2027",
      grading_period: "1st Semester"
    };

    try {
      const response = await fetch(`${API_BASE_URL}/grades`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const json = await response.json();

      if (!response.ok) {
        throw new Error(json.error || 'Could not add student entry.');
      }
      
      toast.success('Student added successfully! 🎉', { position: 'top-center' });
      
      // 4. Append the database record directly to your local grid array list state
      const addedRow = {
        id: json.data?.id || crypto.randomUUID(),
        student_name: name,
        ...payload
      };
      
      setGrades(prev => [...prev, addedRow]);
      closeAddStudentModal();
    } catch (err) {
      toast.error(`${err.message}`, { position: 'top-center' });
    }
  };

  // --- DELETE ENTRY ---
  const handleDeleteStudent = async (id) => {
    if (!window.confirm('Are you sure you want to delete this grading sheet row?')) return;
    try {
      const response = await fetch(`${API_BASE_URL}/grades/${id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Failed to drop column row.');
      toast.success('Record dropped.', { position: 'top-center' });
      setGrades(prev => prev.filter(item => item.id !== id));
    } catch (err) {
      toast.error(err.message, { position: 'top-center' });
    }
  };

  // --- PRESENTATION RENDERING RENDERER ---
  const renderCell = (student, databaseField, localFallbackField) => {
    const activeField = student[databaseField] !== undefined ? databaseField : localFallbackField;
    const value = student[activeField] ?? 0;
    const isEditing = editingCell && editingCell.studentId === student.id && editingCell.field === activeField;
    
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
    if (avg >= 90) return 'excellent';
    if (avg >= 85) return 'very-good';
    if (avg >= 80) return 'good';
    if (avg >= 75) return 'passed';
    return 'failed';
  };

  // --- DYNAMIC SUMMARY COMPILATION STATS ---
  const totalStudents = grades.length;
  const classAvg = totalStudents > 0 
    ? (grades.reduce((sum, s) => sum + (s.average_grade || s.average || 0), 0) / totalStudents).toFixed(2) 
    : '0.00';
  const highestGrade = totalStudents > 0 ? Math.max(...grades.map(s => s.average_grade || s.average || 0)).toFixed(2) : '0.00';
  const lowestGrade = totalStudents > 0 ? Math.min(...grades.map(s => s.average_grade || s.average || 0)).toFixed(2) : '0.00';
  const passedCount = grades.filter(s => (s.average_grade || s.average || 0) >= 75).length;
  const failedCount = totalStudents - passedCount;

  if (isLoading) return <div className="view-grades"><p>Loading class layouts...</p></div>;

  return (
    <div className="view-grades">
      <ToastContainer autoClose={2000} hideProgressBar={false} style={{ zIndex: 99999 }} />
      
      <div className="grades-header">
        <button className="btn-back" onClick={onBack}>← Back to Subjects</button>
        <div className="subject-info">
          <h1>{selectedSubject}</h1>
          <p>Manage student records and performance evaluations</p>
        </div>
        <button className="btn-save" onClick={handleBulkSaveChanges} disabled={isSaving}>
          {isSaving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      <div className="tabs-container">
        <div className="tabs">
          {sectionsList.map((section) => {
            const sectionName = section.name || section.class_name;
            return (
              <button
                key={section.id}
                className={`tab ${activeTab === sectionName ? 'active' : ''}`}
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
            <span className="info-item"><strong>Subject:</strong> {selectedSubject}</span>
            <span className="info-item"><strong>Section:</strong> {activeTab}</span>
            <span className="info-item"><strong>Students:</strong> {totalStudents}</span>
          </div>
          <div className="toolbar-actions">
            <button className="btn-toolbar btn-toolbar-primary" onClick={openAddStudentModal}>Add Student</button>
            <button className="btn-toolbar" onClick={() => window.print()}>Print Report</button>
          </div>
        </div>

        {showAddStudentModal && (
          <div className="modal-overlay">
            <div className="modal">
              <div className="modal-header">
                <h2>Add New Student Entry</h2>
                <button className="modal-close" onClick={closeAddStudentModal}>✕</button>
              </div>
              <form className="student-modal-form" onSubmit={handleAddStudentSubmit}>
                <div className="modal-body">
                  <div className="form-group">
                    <label>Student Full Name</label>
                    <input type="text" name="name" value={newStudent.name} onChange={handleNewStudentChange} required placeholder="Last Name, First Name" />
                  </div>
                  <div className="form-row">
                    <div className="form-group"><label>1st Quarter</label><input type="number" min="0" max="100" name="q1_grade" value={newStudent.q1_grade} onChange={handleNewStudentChange} required /></div>
                    <div className="form-group"><label>2nd Quarter</label><input type="number" min="0" max="100" name="q2_grade" value={newStudent.q2_grade} onChange={handleNewStudentChange} required /></div>
                    <div className="form-group"><label>3rd Quarter</label><input type="number" min="0" max="100" name="q3_grade" value={newStudent.q3_grade} onChange={handleNewStudentChange} required /></div>
                    <div className="form-group"><label>4th Quarter</label><input type="number" min="0" max="100" name="q4_grade" value={newStudent.q4_grade} onChange={handleNewStudentChange} required /></div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn-secondary" onClick={closeAddStudentModal}>Cancel</button>
                  <button type="submit" className="btn-primary">Add Student</button>
                </div>
              </form>
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
                const currentAvg = student.average_grade || student.average || 0;
                const currentRemarks = currentAvg >= 75 ? 'Passed' : 'Failed';
                return (
                  <tr key={student.id}>
                    <td className="col-id">{index + 1}</td>
                    <td className="col-name">{student.student_name || student.name}</td>
                    <td className="col-grade">{renderCell(student, 'q1_grade', 'preliminary')}</td>
                    <td className="col-grade">{renderCell(student, 'q2_grade', 'midterm')}</td>
                    <td className="col-grade">{renderCell(student, 'q3_grade', 'final')}</td>
                    <td className="col-grade">{renderCell(student, 'q4_grade', 'fourth')}</td>
                    <td className={`col-average ${getAverageColor(currentAvg)}`}>{currentAvg}</td>
                    <td className={`col-remarks ${currentRemarks.toLowerCase()}`}>{currentRemarks}</td>
                    <td className="col-actions">
                      <button className="btn-action delete" onClick={() => handleDeleteStudent(student.id)}>Delete</button>
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
              <div className="stat-item"><span className="stat-label">Class Average:</span><span className="stat-value">{classAvg}</span></div>
              <div className="stat-item"><span className="stat-label">Highest:</span><span className="stat-value">{highestGrade}</span></div>
              <div className="stat-item"><span className="stat-label">Lowest:</span><span className="stat-value">{lowestGrade}</span></div>
              <div className="stat-item"><span className="stat-label">Passed:</span><span className="stat-value passed">{passedCount}</span></div>
              <div className="stat-item"><span className="stat-label">Failed:</span><span className="stat-value failed">{failedCount}</span></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ViewGrades;