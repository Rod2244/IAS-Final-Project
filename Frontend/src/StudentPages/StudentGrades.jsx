import React from 'react';
import '../../css/StudentPortal.css';
import { Trophy, FileText, Download } from 'lucide-react';

const StudentGrades = () => {
  const grades = [
    { subject: 'Filipino',   q1: 85, q2: 87, q3: 89, q4: 90, average: 87.75, remarks: 'Passed' },
    { subject: 'GMRC',       q1: 92, q2: 90, q3: 94, q4: 93, average: 92.25, remarks: 'Passed' },
    { subject: 'Language',   q1: 88, q2: 85, q3: 86, q4: 89, average: 87.0,  remarks: 'Passed' },
    { subject: 'Literature', q1: 78, q2: 80, q3: 82, q4: 81, average: 80.25, remarks: 'Passed' },
    { subject: 'Makabansa',  q1: 90, q2: 91, q3: 88, q4: 92, average: 90.25, remarks: 'Passed' },
    { subject: 'Math',       q1: 65, q2: 68, q3: 72, q4: 70, average: 68.75, remarks: 'Failed' },
    { subject: 'Reading',    q1: 60, q2: 64, q3: 70, q4: 73, average: 66.75, remarks: 'Failed' },
  ];

  const handleDownload = () => {
    const headers = ['Subject', 'Q1', 'Q2', 'Q3', 'Q4', 'Average', 'Remarks'];
    const rows = grades.map(g => [g.subject, g.q1, g.q2, g.q3, g.q4, g.average.toFixed(2), g.remarks]);
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'My_Grades.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const finalAverage = (
    grades.reduce((sum, item) => sum + item.average, 0) / grades.length
  ).toFixed(2);

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
          <button className="blue-btn">
            <Trophy size={15} /> View Ranking
          </button>
          <button className="green-btn">
            <FileText size={15} /> Preview Report Card
          </button>
          <button className="download-btn" onClick={handleDownload}>
            <Download size={15} /> Download Grades
          </button>
        </div>
      </div>

      <p className="student-note">
        No ranking has been posted yet. Tap View Ranking to check updates.
      </p>

      <div className="table-wrapper">
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
            {grades.map((item, index) => (
              <tr key={index}>
                <td>{item.subject}</td>
                <td>{item.q1}</td>
                <td>{item.q2}</td>
                <td>{item.q3}</td>
                <td>{item.q4}</td>
                <td className="average-cell">{item.average.toFixed(2)}</td>
                <td>
                  <span className={`remark-badge ${item.remarks.toLowerCase()}`}>
                    {item.remarks}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default StudentGrades;