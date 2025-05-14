import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import RegistrationPage from './pages/RegistrationPage';
import AuthorizationPage from './pages/AuthorizationPage';
import HomePage from './pages/HomePage';
import TokenChecker from './pages/Test';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/registration" element={<RegistrationPage />} />
        <Route path="/" element={<HomePage />} />
        <Route path="/authorization" element={<AuthorizationPage />} />
        <Route path="/profile" element={<AuthorizationPage />} />
        <Route path="/protected" element={<TokenChecker />} />
      </Routes>
    </Router>
  );
}

export default App;