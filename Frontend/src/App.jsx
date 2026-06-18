import React, { useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import Dashboard from './Adminpages/Dashboard'
import ManageSubjects from './Adminpages/managesubjects'
import Students from './Adminpages/students'
import ProfileSettings from './Adminpages/profilesettings'
import ViewGrades from './components/viewgrades'
import AuthPage from './Adminpages/Auth'
import './App.css'

const LayoutWrapper = () => {
  const [currentPage, setCurrentPage] = useState('dashboard')
  const [selectedSubject, setSelectedSubject] = useState('')
  const [selectedSection, setSelectedSection] = useState('')

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard />
      case 'subjects':
        return (
          <ManageSubjects
            onOpenClass={(subject, section) => {
              setSelectedSubject(subject)
              setSelectedSection(section || 'Class A')
              setCurrentPage('viewgrades')
            }}
          />
        )
      case 'students':
        return <Students />
      case 'settings':
        return <ProfileSettings />
      case 'viewgrades':
        return (
          <ViewGrades
            selectedSubject={selectedSubject}
            selectedSection={selectedSection}
            onBack={() => setCurrentPage('subjects')}
          />
        )
      default:
        return <Dashboard />
    }
  }

  return (
    <Layout currentPage={currentPage} setCurrentPage={setCurrentPage}>
      {renderPage()}
    </Layout>
  )
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<AuthPage />} />
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/*" element={<LayoutWrapper />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
