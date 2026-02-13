import React, { useState } from 'react';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import Home from './components/Home';
import AuthGate from "@/auth/AuthGate";

import OfflineCollect from './components/OfflineCollect';

function App() {
  const [mode, setMode] = useState('home'); // 'home', 'phikwe', 'general', 'collect'

  const handleSelectMode = (newMode) => {
    setMode(newMode);
  };

  const handleBackToHome = () => {
    setMode('home');
  };

  return (
    <AuthGate>
      <Layout onBackToHome={handleBackToHome} isHome={mode === 'home'}>
        {mode === 'home' ? (
          <Home onSelectMode={handleSelectMode} />
        ) : mode === 'collect' ? (
          <OfflineCollect onBack={handleBackToHome} />
        ) : (
          <Dashboard mode={mode} onBack={handleBackToHome} />
        )}
      </Layout>
    </AuthGate>
  );
}

export default App;
