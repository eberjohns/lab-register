import { useState, useEffect } from 'react';
import { 
  Search, 
  Plus, 
  MinusSquare, 
  List, 
  FileText, 
  AlertTriangle,
  Clock,
  Database
} from 'lucide-react';
import { api } from '../api';
import { toast } from 'sonner';

export default function Dashboard({ navigate }) {
  const [activities, setActivities] = useState([]);
  const [lowStockCount, setLowStockCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      try {
        const recent = await api.getRecentActivity();
        setActivities(recent);

        const allItems = await api.getAllInventory();
        const lowStock = allItems.filter(item => {
          const q = parseFloat(item.Quantity);
          const t = parseFloat(item.Threshold) || 0;
          return q <= t && q > 0;
        });
        setLowStockCount(lowStock.length);
      } catch (err) {
        console.error("Failed to load dashboard data", err);
      }
      setLoading(false);
    };

    fetchDashboardData();
  }, []);

  const handleCreateSnapshot = async () => {
    try {
      await api.createSnapshot();
      toast.success("Snapshot created successfully!");
      // Refresh activities to show snapshot action
      const recent = await api.getRecentActivity();
      setActivities(recent);
    } catch (e) {
      toast.error("Failed to create snapshot");
    }
  };

  return (
    <div className="dashboard-container">
      <div className="grid-actions" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        <button className="btn btn-primary" onClick={() => navigate('inventory')} style={{ padding: '1.5rem', flexDirection: 'column', gap: '1rem', fontSize: '1.1rem' }}>
          <List size={32} />
          Inventory
        </button>
        <button className="btn btn-primary" onClick={() => navigate('add_item')} style={{ padding: '1.5rem', flexDirection: 'column', gap: '1rem', fontSize: '1.1rem' }}>
          <Plus size={32} />
          Add Item
        </button>
        <button className="btn btn-primary" onClick={() => navigate('stock_used')} style={{ padding: '1.5rem', flexDirection: 'column', gap: '1rem', fontSize: '1.1rem' }}>
          <MinusSquare size={32} />
          Stock Used
        </button>
        <button className="btn btn-secondary" onClick={() => navigate('bulk_import')} style={{ padding: '1.5rem', flexDirection: 'column', gap: '1rem', fontSize: '1.1rem' }}>
          <Database size={32} />
          Bulk Import
        </button>
        <button className="btn btn-secondary" onClick={() => navigate('fine_register')} style={{ padding: '1.5rem', flexDirection: 'column', gap: '1rem', fontSize: '1.1rem' }}>
          <FileText size={32} />
          Fine Register
        </button>
        <button className="btn btn-secondary" onClick={() => navigate('logs')} style={{ padding: '1.5rem', flexDirection: 'column', gap: '1rem', fontSize: '1.1rem', gridColumn: '1 / -1' }}>
          <Database size={32} />
          Full Audit Logs
        </button>
      </div>

      {lowStockCount > 0 && (
        <div 
          className="glass-panel alert-panel animate-fade-in" 
          style={{ padding: '1.5rem', marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '1rem', cursor: 'pointer', borderLeft: '4px solid var(--warning)' }}
          onClick={() => navigate('inventory', { filter: 'low_stock' })}
        >
          <AlertTriangle color="var(--warning)" size={32} />
          <div>
            <h3 style={{ margin: 0, color: 'var(--warning)' }}>{lowStockCount} Low Stock Items</h3>
            <p className="text-muted" style={{ margin: 0 }}>Click here to view purchase list</p>
          </div>
        </div>
      )}

      <div className="glass-panel activity-panel animate-fade-in" style={{ padding: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
            <Clock size={24} className="text-muted" />
            Recent Activity
          </h2>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button className="btn btn-secondary" onClick={() => navigate('logs')} style={{ fontSize: '0.85rem', padding: '0.5rem 1rem' }}>
              <FileText size={16} />
              View Full Logs
            </button>
            <button className="btn btn-secondary" onClick={handleCreateSnapshot} style={{ fontSize: '0.85rem', padding: '0.5rem 1rem' }}>
              <Database size={16} />
              Create Snapshot
            </button>
          </div>
        </div>

        {loading ? (
          <p className="text-muted">Loading activities...</p>
        ) : activities.length === 0 ? (
          <p className="text-muted">No recent activities.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {activities.map((act, index) => (
              <div key={index} style={{ padding: '1rem', background: 'rgba(0,0,0,0.2)', borderRadius: 'var(--radius-sm)', borderLeft: act.type === 'deduction' ? '3px solid var(--danger)' : act.type === 'fine' ? '3px solid var(--warning)' : act.type === 'snapshot' ? '3px solid var(--primary-color)' : '3px solid var(--success)' }}>
                <p style={{ margin: '0 0 0.25rem 0', fontWeight: '500' }}>{act.message}</p>
                <span className="text-muted" style={{ fontSize: '0.8rem' }}>{new Date(act.time).toLocaleString()}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
