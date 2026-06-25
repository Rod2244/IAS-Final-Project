import React, { useState, useEffect } from 'react';
import '../../css/StudentPortal.css';
import { Trophy, FileText, Download } from 'lucide-react';
import { authService, gradeService } from '../services/apiClient';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

const StudentGrades = () => {
  const [grades, setGrades] = useState([]); 
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isDownloadOpen, setIsDownloadOpen] = useState(false);
  const [studentProfile, setStudentProfile] = useState(null);

  useEffect(() => {
    const loadStudentGrades = async () => {
      try {
        setIsLoading(true);
        const currentUser = await authService.getCurrentUser();
        
        const response = await fetch('http://localhost:5000/api/students'); 
        const result = await response.json();
        
        const myStudentProfile = result.data.find(s => s.user_id === currentUser.id);

        if (myStudentProfile) {
          setStudentProfile(myStudentProfile);
        }

        const studentGrades = await gradeService.getByStudent(myStudentProfile.id);

        setGrades(studentGrades || []);
        setIsLoading(false);
      } catch (err) {
        console.error("Load student grades error:", err);
        setError(err.message);
        setIsLoading(false);
      }
    };

    loadStudentGrades();
  }, []);

  const getGradeValue = (item, fieldNames) => {
    for (const field of fieldNames) {
      if (item[field] !== undefined && item[field] !== null) {
        return item[field];
      }
    }
    return 0;
  };

const displayGrades = grades.map((item) => {
  const q1 = getGradeValue(item, ['q1_grade', 'preliminary_grade', 'q1']);
  const q2 = getGradeValue(item, ['q2_grade', 'midterm_grade', 'q2']);
  const q3 = getGradeValue(item, ['q3_grade', 'final_grade', 'q3']);
  const q4 = getGradeValue(item, ['q4_grade', 'fourth_period_grade', 'q4']);
  
  const average = getGradeValue(item, ['average_grade', 'average']) || ((q1 + q2 + q3 + q4) / 4);

  const subjectName = item.subjects?.subject_name || item.subject_name || 'Unknown Subject';
  
  const remarks = item.remarks || (parseFloat(average) >= 75 ? 'Passed' : 'Failed');

  return {
    id: item.id,
    subject_name: subjectName, 
    q1,
    q2,
    q3,
    q4,
    average: parseFloat(average).toFixed(2),
    remarks,
  };
});

const finalAverage = displayGrades.length > 0 
  ? (displayGrades.reduce((sum, item) => sum + parseFloat(item.average), 0) / displayGrades.length).toFixed(2)
  : '0.00';

const handleDownloadCSV = () => {
  const headers = ['Subject', 'Q1', 'Q2', 'Q3', 'Q4', 'Average', 'Remarks'];
  const rows = displayGrades.map((item) => [
    item.subject_name, item.q1, item.q2, item.q3, item.q4, item.average, item.remarks
  ]);
  
  const csv = [headers, ...rows].map((row) => row.join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'My_Grades.csv';
  a.click();
  setIsDownloadOpen(false); 
};

const handleDownloadPDF = () => {
  const doc = new jsPDF();

  doc.setFontSize(18);
  doc.text("Student Report Card", 14, 20);
  doc.setFontSize(12);
  doc.text(`Name: ${studentProfile?.name || 'N/A'}`, 14, 35);
  doc.text(`Grade Level: ${studentProfile?.grade || 'N/A'}`, 14, 42);
  doc.text(`LRN: ${studentProfile?.lrn || 'N/A'}`, 14, 49);

  autoTable(doc, {
    startY: 58, 
    head: [['Subject', 'Q1', 'Q2', 'Q3', 'Q4', 'Average', 'Remarks']],
    body: displayGrades.map(item => [
      item.subject_name, 
      item.q1, 
      item.q2, 
      item.q3, 
      item.q4, 
      item.average, 
      item.remarks
    ]),
  });

  doc.save('My_Grades.pdf');
  setIsDownloadOpen(false);
};

  return (
    <div className="student-page">
      <div className="student-page-header">
        <div>
          <h2 className="section-title">My Grades</h2>
          <p className="student-average-text">
            Final Average: <span>{finalAverage}</span>
          </p>
        </div>

        <div className="student-action-buttons">
          {/* Using your existing .download-btn style */}
          <div className="download-container">
            <button 
              className="download-btn" 
              onClick={() => setIsDownloadOpen(!isDownloadOpen)}
            >
              Download Grades ▾
            </button>

            {isDownloadOpen && (
              <div className="download-menu">
                <button className="download-menu-item" onClick={handleDownloadCSV}>
                  Download as CSV
                </button>
                <button className="download-menu-item" onClick={handleDownloadPDF}>
                  Download as PDF
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <p className="student-note">
        These grades are pulled from your saved record and are view-only.
      </p>

      <div className="table-wrapper">
        {isLoading ? (
          <p>Loading your grades...</p>
        ) : error ? (
          <p className="error-text">Error: {error}</p>
        ) : (
        <table className="grades-table">
          <thead>
            <tr>
              <th>Subject</th>
              <th>Q1</th>
              <th>Q2</th>
              <th>Q3</th>
              <th>Q4</th>
              <th>Average</th>
              <th>Remarks</th>
            </tr>
          </thead>
            <tbody>
            {(displayGrades || []).map((item) => (
                    <tr key={item.id}>
                      <td>{item.subject_name || "N/A"}</td>
                      <td>{item.q1 ?? "-"}</td>
                      <td>{item.q2 ?? "-"}</td>
                      <td>{item.q3 ?? "-"}</td>
                      <td>{item.q4 ?? "-"}</td>
                      <td className="average-cell">{item.average ?? "0"}</td>
                      <td>
                        <span className={`remark-badge ${item.remarks?.toLowerCase() || 'none'}`}>
                          {item.remarks || "N/A"}
                        </span>
                      </td>
                    </tr>
                  ))}
            </tbody>
        </table>
        )}
      </div>
    </div>
  );
};

export default StudentGrades;