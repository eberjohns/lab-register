import { useState, useEffect } from 'react';
import { 
  Beaker, 
  Search, 
  Plus, 
  MinusSquare, 
  List, 
  AlertTriangle, 
  Download, 
  X,
  FileText
} from 'lucide-react';
import { api } from './api';

// --- Views ---
import Dashboard from './views/Dashboard';
import Inventory from './views/Inventory';
import AddItem from './views/AddItem';
import StockUsed from './views/StockUsed';
import FineRegister from './views/FineRegister';
import BulkImport from './views/BulkImport';
import Manual from './views/Manual';
import Logs from './views/Logs';
import { Toaster } from 'sonner';

function App() {
  const apiUrl = new URLSearchParams(window.location.search).get('api');
  const [currentView, setCurrentView] = useState(apiUrl ? 'dashboard' : 'manual');
  const [viewParams, setViewParams] = useState(null); // To pass data to views, e.g., low stock filter

  const navigate = (view, params = null) => {
    setCurrentView(view);
    setViewParams(params);
  };

  // If no API URL is provided, ONLY show the manual, without the app header.
  if (!apiUrl) {
    return (
      <div className="container animate-fade-in" style={{ maxWidth: '800px', margin: '0 auto', paddingTop: '4rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <div className="logo-icon" style={{ margin: '0 auto 1rem auto', width: '64px', height: '64px' }}>
            <Beaker color="white" size={36} />
          </div>
          <h1 style={{ fontSize: '3rem' }}>Smart Lab Register</h1>
          <p className="text-muted">A lightweight, modern laboratory inventory system.</p>
        </div>
        <Manual />
      </div>
    );
  }

  return (
    <div className="container animate-fade-in">
      <Toaster position="bottom-right" theme="light" />
      <header className="app-header">
        <div className="logo-container" onClick={() => navigate('dashboard')} style={{cursor: 'pointer'}}>
          <div className="logo-icon">
            <Beaker color="white" size={24} />
          </div>
          <span className="logo-text">Smart Lab</span>
        </div>
        
        {currentView !== 'dashboard' && (
          <button className="btn btn-secondary" onClick={() => navigate('dashboard')}>
            Back to Dashboard
          </button>
        )}
      </header>

      <main>
        {currentView === 'dashboard' && <Dashboard navigate={navigate} />}
        {currentView === 'inventory' && <Inventory navigate={navigate} params={viewParams} />}
        {currentView === 'add_item' && <AddItem navigate={navigate} />}
        {currentView === 'stock_used' && <StockUsed navigate={navigate} />}
        {currentView === 'fine_register' && <FineRegister navigate={navigate} />}
        {currentView === 'bulk_import' && <BulkImport navigate={navigate} />}
        {currentView === 'logs' && <Logs navigate={navigate} />}
      </main>
    </div>
  );
}

export default App;
