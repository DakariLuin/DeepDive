import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import RegistrationPage from './pages/RegistrationPage';
import AuthorizationPage from './pages/AuthorizationPage';
import HomePage from './pages/HomePage';
import TokenChecker from './pages/Test';
import Profile from './pages/ProfilePage';
import Editor from './components/Editor';
import CharacterViewer from './components/Viewer.jsx';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/registration" element={<RegistrationPage />} />
        <Route path="/" element={<HomePage />} />
        <Route path="/authorization" element={<AuthorizationPage />} />
        <Route path="/protected" element={<TokenChecker />} />
        <Route path="/viewer" element={<CharacterViewer />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/editor" element={<Editor />} />

      </Routes>
    </Router>
  );
}

export default App;