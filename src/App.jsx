import React from 'react';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import AuthGate from "@/auth/AuthGate";

function App() {
  return (
    <AuthGate>
      <Layout>
        <Dashboard />
      </Layout>
    </AuthGate>
  );
}

export default App;
