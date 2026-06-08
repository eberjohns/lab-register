import { useState, useEffect } from 'react';
import { api } from '../api';
import { ClipboardList, Filter } from 'lucide-react';

export default function Logs({ navigate }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('All');

  useEffect(() => {
    const fetchLogs = async () => {
      setLoading(true);
      try {
        const data = await api.getAllLogs();
        setLogs(data);
      } catch (err) {
        console.error("Failed to fetch logs", err);
      }
      setLoading(false);
    };
    fetchLogs();
  }, []);

  const filteredLogs = logs.filter(l => filterType === 'All' || l.type === filterType);

  // Get unique types for the filter dropdown
  const uniqueTypes = ['All', ...new Set(logs.map(l => l.type))];

  return (
    <div className="logs-view animate-fade-in" style={{ maxWidth: '1000px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
          <ClipboardList color="var(--primary-color)" /> Audit Logs & Statement
        </h2>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Filter size={16} className="text-muted" />
          <select 
            className="form-control" 
            style={{ width: 'auto', padding: '0.5rem', fontSize: '0.9rem' }}
            value={filterType}
            onChange={e => setFilterType(e.target.value)}
          >
            {uniqueTypes.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
      </div>

      <div className="table-container">
        {loading ? (
          <div style={{ padding: '2rem' }}>
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="skeleton skeleton-row" style={{ height: '40px', marginBottom: '1rem' }}></div>
            ))}
          </div>
        ) : filteredLogs.length === 0 ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>No records found.</div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Date & Time</th>
                <th>Action</th>
                <th>Item</th>
                <th>Qty / Amount</th>
                <th>Details</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.map((log, idx) => {
                const isDeduction = log.type === 'Stock Used' || log.type === 'Fine Added' || (log.quantity && String(log.quantity).startsWith('-'));
                const qtyColor = isDeduction ? 'var(--danger)' : 'var(--success)';
                
                return (
                  <tr key={idx}>
                    <td style={{ whiteSpace: 'nowrap' }}>{new Date(log.time).toLocaleString()}</td>
                    <td>
                      <span className={`badge ${isDeduction ? (log.type === 'Fine Added' ? 'badge-warning' : 'badge-danger') : 'badge-success'}`}>
                        {log.type}
                      </span>
                    </td>
                    <td style={{ fontWeight: '500' }}>{log.item}</td>
                    <td style={{ color: qtyColor, fontWeight: '600' }}>{log.quantity}</td>
                    <td className="text-muted" style={{ fontSize: '0.9rem' }}>{log.details}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
