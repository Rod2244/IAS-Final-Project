import React, { useState } from 'react';
import '../../css/viewgrades.css';

const ViewGrades = ({ selectedSubject, selectedSection, onBack }) => {
  const [activeTab, setActiveTab] = useState(selectedSection || 'Class A');
  const [grades, setGrades] = useState({
    'Class A': [
      { id: 1, name: 'Juan Dela Cruz', preliminary: 85, midterm: 88, final: 90, fourth: 88, average: 87.75, remarks: 'Passed' },
      { id: 2, name: 'Maria Garcia', preliminary: 92, midterm: 89, final: 94, fourth: 91, average: 91.50, remarks: 'Passed' },
      { id: 3, name: 'Jose Reyes', preliminary: 78, midterm: 82, final: 80, fourth: 79, average: 79.75, remarks: 'Passed' },
      { id: 4, name: 'Ana Santos', preliminary: 88, midterm: 90, final: 85, fourth: 89, average: 88.00, remarks: 'Passed' },
      { id: 5, name: 'Carlos Mendoza', preliminary: 75, midterm: 78, final: 72, fourth: 76, average: 75.25, remarks: 'Passed' },
      { id: 6, name: 'Sofia Rodriguez', preliminary: 95, midterm: 92, final: 96, fourth: 94, average: 94.25, remarks: 'Passed' },
      { id: 7, name: 'Miguel Torres', preliminary: 82, midterm: 85, final: 88, fourth: 85, average: 85.00, remarks: 'Passed' },
      { id: 8, name: 'Isabella Cruz', preliminary: 90, midterm: 88, final: 92, fourth: 90, average: 90.00, remarks: 'Passed' },
    ],
    'Class B': [
      { id: 9, name: 'Pedro Santos', preliminary: 80, midterm: 82, final: 85, fourth: 83, average: 82.50, remarks: 'Passed' },
      { id: 10, name: 'Elena Garcia', preliminary: 88, midterm: 90, final: 87, fourth: 88, average: 88.25, remarks: 'Passed' },
      { id: 11, name: 'Ramon Reyes', preliminary: 72, midterm: 75, final: 78, fourth: 75, average: 75.00, remarks: 'Passed' },
      { id: 12, name: 'Carmen Mendoza', preliminary: 85, midterm: 88, final: 90, fourth: 87, average: 87.50, remarks: 'Passed' },
      { id: 13, name: 'Antonio Rodriguez', preliminary: 78, midterm: 80, final: 82, fourth: 81, average: 80.25, remarks: 'Passed' },
      { id: 14, name: 'Rosa Torres', preliminary: 92, midterm: 94, final: 90, fourth: 92, average: 92.00, remarks: 'Passed' },
      { id: 15, name: 'Luis Cruz', preliminary: 86, midterm: 84, final: 88, fourth: 86, average: 86.00, remarks: 'Passed' },
      { id: 16, name: 'Teresa Garcia', preliminary: 90, midterm: 92, final: 89, fourth: 91, average: 90.50, remarks: 'Passed' },
    ]
  });

  const [editingCell, setEditingCell] = useState(null);
  const [editValue, setEditValue] = useState('');
  const [showAddStudentModal, setShowAddStudentModal] = useState(false);
  const [newStudent, setNewStudent] = useState({
    name: '',
    preliminary: '',
    midterm: '',
    final: '',
    fourth: '',
  });

  const handleCellClick = (studentId, field, value) => {
    setEditingCell({ studentId, field });
    setEditValue(value);
  };

  const openAddStudentModal = () => {
    setNewStudent({ name: '', preliminary: '', midterm: '', final: '', fourth: '' });
    setShowAddStudentModal(true);
  };

  const closeAddStudentModal = () => {
    setShowAddStudentModal(false);
  };

  const handleNewStudentChange = (e) => {
    const { name, value } = e.target;
    setNewStudent((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddStudentSubmit = (e) => {
    e.preventDefault();
    const name = newStudent.name.trim();
    if (!name) return;

    const preliminary = parseFloat(newStudent.preliminary) || 0;
    const midterm = parseFloat(newStudent.midterm) || 0;
    const final = parseFloat(newStudent.final) || 0;
    const fourth = parseFloat(newStudent.fourth) || 0;
    const average = parseFloat(((preliminary + midterm + final + fourth) / 4).toFixed(2));
    const remarks = average >= 75 ? 'Passed' : 'Failed';

    setGrades((prev) => ({
      ...prev,
      [activeTab]: [
        ...prev[activeTab],
        {
          id: Date.now(),
          name,
          preliminary,
          midterm,
          final,
          fourth,
          average,
          remarks,
        },
      ],
    }));

    closeAddStudentModal();
  };

  const handleCellChange = (e) => {
    setEditValue(e.target.value);
  };

  const handleCellBlur = () => {
    if (editingCell) {
      const { studentId, field } = editingCell;
      const newValue = parseFloat(editValue);
      
      if (!isNaN(newValue) && newValue >= 0 && newValue <= 100) {
        setGrades(prev => ({
          ...prev,
          [activeTab]: prev[activeTab].map(student => {
            if (student.id === studentId) {
              const updatedStudent = { ...student, [field]: newValue };
              const avg = (updatedStudent.preliminary + updatedStudent.midterm + updatedStudent.final + updatedStudent.fourth) / 4;
              updatedStudent.average = parseFloat(avg.toFixed(2));
              updatedStudent.remarks = avg >= 75 ? 'Passed' : 'Failed';
              return updatedStudent;
            }
            return student;
          })
        }));
      }
      setEditingCell(null);
    }
  };

  const handleCellKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleCellBlur();
    } else if (e.key === 'Escape') {
      setEditingCell(null);
    }
  };

  const renderCell = (student, field, value) => {
    const isEditing = editingCell && editingCell.studentId === student.id && editingCell.field === field;
    
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

    const isEditable = ['preliminary', 'midterm', 'final', 'fourth'].includes(field);
    return (
      <span 
        className={`grade-cell ${isEditable ? 'editable' : ''}`}
        onClick={() => isEditable && handleCellClick(student.id, field, value)}
      >
        {value}
        {isEditable && <span className="edit-hint">✎</span>}
      </span>
    );
  };

  const getAverageColor = (average) => {
    if (average >= 90) return 'excellent';
    if (average >= 85) return 'very-good';
    if (average >= 80) return 'good';
    if (average >= 75) return 'passed';
    return 'failed';
  };

  const getRemarksColor = (remarks) => {
    return remarks === 'Passed' ? 'passed' : 'failed';
  };

  return (
    <div className="view-grades">
      <div className="grades-header">
        <button className="btn-back" onClick={onBack}>
          ← Back to Subjects
        </button>
        <div className="subject-info">
          <h1>{selectedSubject}</h1>
          <p>Grade 3 • Manage student grades by section</p>
        </div>
        <button className="btn-save">Save Changes</button>
      </div>

      <div className="tabs-container">
        <div className="tabs">
          {Object.keys(grades).map((section) => (
            <button
              key={section}
              className={`tab ${activeTab === section ? 'active' : ''}`}
              onClick={() => setActiveTab(section)}
            >
              {section}
              <span className="student-count">{grades[section].length} students</span>
            </button>
          ))}
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
              <strong>Total Students:</strong> {grades[activeTab].length}
            </span>
          </div>
          <div className="toolbar-actions">
            <button className="btn-toolbar btn-toolbar-primary" onClick={openAddStudentModal}>Add Student</button>
            <button className="btn-toolbar">Export to Excel</button>
            <button className="btn-toolbar">Print</button>
          </div>
        </div>

        {showAddStudentModal && (
          <div className="modal-overlay">
            <div className="modal">
              <div className="modal-header">
                <h2>Add Student</h2>
                <button className="modal-close" onClick={closeAddStudentModal}>✕</button>
              </div>
              <form className="student-modal-form" onSubmit={handleAddStudentSubmit}>
                <div className="modal-body">
                  <div className="form-group">
                    <label>Student Name</label>
                    <input
                      type="text"
                      name="name"
                      value={newStudent.name}
                      onChange={handleNewStudentChange}
                      placeholder="Enter student name"
                      required
                    />
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label>1st Quarter</label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        name="preliminary"
                        value={newStudent.preliminary}
                        onChange={handleNewStudentChange}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>2nd Quarter</label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        name="midterm"
                        value={newStudent.midterm}
                        onChange={handleNewStudentChange}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>3rd Quarter</label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        name="final"
                        value={newStudent.final}
                        onChange={handleNewStudentChange}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>4th Quarter</label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        name="fourth"
                        value={newStudent.fourth}
                        onChange={handleNewStudentChange}
                        required
                      />
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn-secondary" onClick={closeAddStudentModal}>
                    Cancel
                  </button>
                  <button type="submit" className="btn-primary">
                    Add Student
                  </button>
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
              {grades[activeTab].map((student, index) => (
                <tr key={student.id} className={editingCell && editingCell.studentId === student.id ? 'editing' : ''}>
                  <td className="col-id">{index + 1}</td>
                  <td className="col-name">{student.name}</td>
                  <td className="col-grade">
                    {renderCell(student, 'preliminary', student.preliminary)}
                  </td>
                  <td className="col-grade">
                    {renderCell(student, 'midterm', student.midterm)}
                  </td>
                  <td className="col-grade">
                    {renderCell(student, 'final', student.final)}
                  </td>
                  <td className="col-grade">
                    {renderCell(student, 'fourth', student.fourth)}
                  </td>
                  <td className={`col-average ${getAverageColor(student.average)}`}>
                    {student.average}
                  </td>
                  <td className={`col-remarks ${getRemarksColor(student.remarks)}`}>
                    {student.remarks}
                  </td>
                  <td className="col-actions">
                    <button className="btn-action edit" onClick={() => handleCellClick(student.id, 'preliminary', student.preliminary)}>
                      Edit
                    </button>
                    <button className="btn-action delete">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="grades-summary">
          <div className="summary-card">
            <h3>Class Statistics</h3>
            <div className="summary-stats">
              <div className="stat-item">
                <span className="stat-label">Class Average:</span>
                <span className="stat-value">
                  {(grades[activeTab].reduce((sum, s) => sum + s.average, 0) / grades[activeTab].length).toFixed(2)}
                </span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Highest:</span>
                <span className="stat-value">
                  {Math.max(...grades[activeTab].map(s => s.average)).toFixed(2)}
                </span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Lowest:</span>
                <span className="stat-value">
                  {Math.min(...grades[activeTab].map(s => s.average)).toFixed(2)}
                </span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Passed:</span>
                <span className="stat-value passed">
                  {grades[activeTab].filter(s => s.remarks === 'Passed').length}
                </span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Failed:</span>
                <span className="stat-value failed">
                  {grades[activeTab].filter(s => s.remarks === 'Failed').length}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ViewGrades;