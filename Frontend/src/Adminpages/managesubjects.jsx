import React, { useState } from 'react';
import '../../css/managesubs.css';

const initialSubjects = [
  {
    id: 1,
    name: 'Mathematics',
    icon: '🧮',
    grade: 'Grade 3',
    classes: [
      { name: 'Class A', students: 23 },
      { name: 'Class B', students: 22 },
    ],
  },
  {
    id: 2,
    name: 'English',
    icon: '✏️',
    grade: 'Grade 3',
    classes: [
      { name: 'Class A', students: 23 },
      { name: 'Class B', students: 22 },
    ],
  },
  {
    id: 3,
    name: 'Science',
    icon: '🔬',
    grade: 'Grade 3',
    classes: [
      { name: 'Class A', students: 23 },
      { name: 'Class B', students: 22 },
    ],
  },
];

const ManageSubjects = ({ onOpenClass = () => {} }) => {
  const [gradeFilter, setGradeFilter] = useState('All Grades');
  const [classFilter, setClassFilter] = useState('All Classes');
  const [subjectFilter, setSubjectFilter] = useState('All Subjects');
  const [subjects, setSubjects] = useState(initialSubjects);
  const [showAddModal, setShowAddModal] = useState(false);
  const [formValues, setFormValues] = useState({
    name: '',
    icon: '📘',
    grade: 'Grade 3',
    sections: [
      { name: 'Class A', students: '0' },
    ],
  });

  const openAddModal = () => {
    setFormValues({
      name: '',
      icon: '📘',
      grade: 'Grade 3',
      sections: [
        { name: 'Class A', students: '0' },
      ],
    });
    setShowAddModal(true);
  };

  const closeAddModal = () => {
    setShowAddModal(false);
  };

  const handleFormChange = (event) => {
    const { name, value } = event.target;
    setFormValues((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSectionChange = (index, event) => {
    const { name, value } = event.target;
    setFormValues((prev) => ({
      ...prev,
      sections: prev.sections.map((section, idx) =>
        idx === index ? { ...section, [name]: value } : section
      ),
    }));
  };

  const addSection = () => {
    setFormValues((prev) => ({
      ...prev,
      sections: [...prev.sections, { name: 'Class A', students: '0' }],
    }));
  };

  const removeSection = (index) => {
    setFormValues((prev) => ({
      ...prev,
      sections: prev.sections.filter((_, idx) => idx !== index),
    }));
  };

  const handleAddSubject = (event) => {
    event.preventDefault();
    if (!formValues.name.trim()) return;

    setSubjects((prev) => [
      ...prev,
      {
        id: Date.now(),
        name: formValues.name.trim(),
        icon: formValues.icon,
        grade: formValues.grade,
        classes: formValues.sections.map((section) => ({
          name: section.name,
          students: Number(section.students) || 0,
        })),
      },
    ]);
    closeAddModal();
  };

  const filteredSubjects = subjects.filter((subject) => {
    const matchesGrade = gradeFilter === 'All Grades' || subject.grade === gradeFilter;
    const matchesSubject = subjectFilter === 'All Subjects' || subject.name === subjectFilter;
    const matchesClass =
      classFilter === 'All Classes' || subject.classes.some((c) => c.name === classFilter);
    return matchesGrade && matchesSubject && matchesClass;
  });

  return (
    <div className="manage-subjects">
      <div className="page-header">
        <h1>Manage Subjects</h1>
        <button className="btn-primary" onClick={openAddModal}>
          + Add New Subject
        </button>
      </div>

      <div className="filter-section">
        <div className="filter-group">
          <label>Subject:</label>
          <select value={subjectFilter} onChange={(e) => setSubjectFilter(e.target.value)}>
            <option>All Subjects</option>
            {subjects.map((subject) => (
              <option key={subject.id}>{subject.name}</option>
            ))}
          </select>
        </div>
        <div className="filter-group">
          <label>Grade Level:</label>
          <select value={gradeFilter} onChange={(e) => setGradeFilter(e.target.value)}>
            <option>All Grades</option>
            <option>Grade 1</option>
            <option>Grade 2</option>
            <option>Grade 3</option>
          </select>
        </div>
        <div className="filter-group">
          <label>Class:</label>
          <select value={classFilter} onChange={(e) => setClassFilter(e.target.value)}>
            <option>All Classes</option>
            <option>Class 1A</option>
            <option>Class 1B</option>
            <option>Class A</option>
            <option>Class B</option>
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
            <div className="subject-classes">
              {subject.classes.map((classInfo) => (
                <div
                  className="class-item clickable"
                  key={classInfo.name}
                  onClick={() => onOpenClass(subject.name, classInfo.name)}
                >
                  <span className="class-name">{classInfo.name}</span>
                  <span className="student-count">{classInfo.students} students</span>
                </div>
              ))}
            </div>
            <div className="subject-actions">
              <button className="btn-secondary" onClick={() => onOpenClass(subject.name, subject.classes[0]?.name || '')}>
                Open Class
              </button>
              <button
                className="btn-secondary"
                onClick={() => setSubjects((prev) => prev.filter((item) => item.id !== subject.id))}
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

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
                    <select name="grade" value={formValues.grade} onChange={handleFormChange}>
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
                  <button type="button" className="btn-small add-section" onClick={addSection}>
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
                      <button type="button" className="btn-small delete" onClick={() => removeSection(index)}>
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={closeAddModal}>
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
    </div>
  );
};

export default ManageSubjects;
