import React, { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Layout from "./components/Layout";
import Dashboard from "./Adminpages/Dashboard";
import ManageSubjects from "./Adminpages/managesubjects";
import Students from "./Adminpages/students";
import ProfileSettings from "./Adminpages/profilesettings";
import ViewGrades from "./components/viewgrades";
import AuthPage from "./Adminpages/Auth";
import StudentLayout from "./StudentPages/StudentLayout";

import "./App.css";

// Protected Route Component
const ProtectedRoute = ({ element, isAuthenticated }) => {
  return isAuthenticated ? element : <Navigate to="/login" replace />;
};

const LayoutWrapper = () => {
  const [currentPage, setCurrentPage] = useState("dashboard");
  const [selectedSubject, setSelectedSubject] = useState("");
  const [selectedSection, setSelectedSection] = useState("");

  const renderPage = () => {
    switch (currentPage) {
      case "dashboard":
        return <Dashboard />;
      case "subjects":
        return (
          <ManageSubjects
            onOpenClass={(subject, section) => {
              setSelectedSubject(subject);
              setSelectedSection(section || "Class A");
              setCurrentPage("viewgrades");
            }}
          />
        );
      case "students":
        return <Students />;
      case "settings":
        return <ProfileSettings />;
      case "viewgrades":
        return (
          <ViewGrades
            selectedSubject={selectedSubject}
            selectedSection={selectedSection}
            onBack={() => setCurrentPage("subjects")}
          />
        );
      default:
        return <Dashboard />;
    }
  };

  return (
    <Layout currentPage={currentPage} setCurrentPage={setCurrentPage}>
      {renderPage()}
    </Layout>
  );
};

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    // Initialize state from localStorage immediately
    return !!localStorage.getItem("authToken");
  });

  useEffect(() => {
    // Listen for storage changes (when user logs in/out from another tab)
    const handleStorageChange = (e) => {
      if (e.key === "authToken") {
        setIsAuthenticated(!!e.newValue);
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<AuthPage />} />
        <Route path="/auth" element={<AuthPage />} />
        <Route
          path="/"
          element={
            isAuthenticated ? (
              <Navigate to="/dashboard" replace />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/*"
          element={
            <ProtectedRoute
              element={<LayoutWrapper />}
              isAuthenticated={isAuthenticated}
            />
          }
        />
        <Route path="/student" element={<StudentLayout />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
