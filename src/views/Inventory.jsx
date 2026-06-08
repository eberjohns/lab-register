import { useState, useEffect, useMemo } from 'react';
import { api } from '../api';
import { Download, Search, Filter, Edit, X, Save } from 'lucide-react';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';

export default function Inventory({ navigate, params }) {
  const [data, setData] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [statusFilter, setStatusFilter] = useState(params?.filter === 'low_stock' ? 'Low Stock' : 'All');
  
  // Edit State
  const [editingItem, setEditingItem] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const fetchItems = async () => {
    setLoading(true);
    try {
      const cats = await api.getCategories();
      setCategories(['All', ...cats]);
      
      const allItems = await api.getAllInventory();
      setData(allItems);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchItems();
  }, []);

  // Filtered Data
  const filteredData = useMemo(() => {
    return data.filter(item => {
      const matchSearch = item.Name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (item.ID && item.ID.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchCat = selectedCategory === 'All' || item._Category === selectedCategory;
      const matchStatus = statusFilter === 'All' || item.Status === statusFilter;
      
      return matchSearch && matchCat && matchStatus;
    });
  }, [data, searchTerm, selectedCategory, statusFilter]);

  const dynamicHeaders = useMemo(() => {
    if (data.length === 0) return [];
    const keys = new Set();
    data.forEach(item => {
      Object.keys(item).forEach(k => {
        if (!['ID', 'Name', 'Quantity', 'Unit', 'Status', '_Category'].includes(k)) {
          keys.add(k);
        }
      });
    });
    return Array.from(keys);
  }, [data]);

  // For the edit form
  const columns = useMemo(() => {
    return ['ID', 'Name', '_Category', 'Quantity', 'Unit', 'Status', ...dynamicHeaders];
  }, [dynamicHeaders]);

  // Calculate Pagination
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const paginatedItems = filteredData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  const handleExport = () => {
    if (filteredData.length === 0) return;
    
    // Prepare data without _Category if viewing specific category, but let's keep it for safety
    const exportData = filteredData.map(item => {
      const row = {};
      Object.keys(item).forEach(col => {
        row[col === '_Category' ? 'Category' : col] = item[col] !== undefined ? item[col] : '';
      });
      return row;
    });

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Inventory");
    XLSX.writeFile(wb, `SmartLab_Inventory_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const handleEditClick = (item) => {
    setEditingItem(item);
    setEditForm({ ...item });
  };

  const handleEditSave = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await api.addItem(editingItem._Category, { ...editForm });
      toast.success("Item updated successfully");
      setEditingItem(null);
      fetchItems();
    } catch (err) {
      toast.error("Failed to update item");
    }
    setIsSaving(false);
  };

  return (
    <div className="inventory-view animate-fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h2>Inventory Database</h2>
        <button className="btn btn-primary" onClick={handleExport} disabled={filteredData.length === 0}>
          <Download size={20} />
          Export this view as Report
        </button>
      </div>

      <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
          
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label"><Search size={16} style={{display:'inline', verticalAlign:'text-bottom', marginRight:'0.25rem'}}/> Search Items</label>
            <input 
              type="text" 
              className="form-control" 
              placeholder="e.g. Beaker" 
              value={searchTerm}
              onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }}
            />
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label"><Filter size={16} style={{display:'inline', verticalAlign:'text-bottom', marginRight:'0.25rem'}}/> Category</label>
            <select 
              className="form-control" 
              value={selectedCategory}
              onChange={e => { setSelectedCategory(e.target.value); setCurrentPage(1); }}
            >
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label"><Filter size={16} style={{display:'inline', verticalAlign:'text-bottom', marginRight:'0.25rem'}}/> Status</label>
            <select 
              className="form-control" 
              value={statusFilter}
              onChange={e => { setStatusFilter(e.target.value); setCurrentPage(1); }}
            >
              <option value="All">All Statuses</option>
              <option value="In Stock">In Stock</option>
              <option value="Low Stock">Low Stock</option>
              <option value="Out of Stock">Out of Stock</option>
            </select>
          </div>
          
        </div>
      </div>

      <div className="table-container">
        {loading ? (
          <div style={{ padding: '2rem' }}>
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="skeleton skeleton-row" style={{ height: '40px', marginBottom: '1rem' }}></div>
            ))}
          </div>
        ) : filteredData.length === 0 ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>No items match your filters.</div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Quantity</th>
                <th>Status</th>
                {dynamicHeaders.map(h => <th key={h}>{h}</th>)}
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedItems.map((item, idx) => (
                <tr key={idx}>
                  <td>{item.ID}</td>
                  <td style={{ fontWeight: '500' }}>{item.Name}</td>
                  <td>{item.Quantity} {item.Unit}</td>
                  <td>
                    <span className={`badge ${item.Status === 'In Stock' ? 'badge-success' : item.Status === 'Low Stock' ? 'badge-warning' : 'badge-danger'}`}>
                      {item.Status}
                    </span>
                  </td>
                  {dynamicHeaders.map(h => (
                    <td key={h}>{item[h] || '-'}</td>
                  ))}
                  <td>
                    <button className="btn btn-secondary" style={{ padding: '0.25rem 0.5rem', fontSize: '0.85rem' }} onClick={() => handleEditClick(item)}>
                      Edit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        
        {!loading && totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', borderTop: '1px solid var(--border-color)' }}>
            <button 
              className="btn btn-secondary" 
              onClick={() => handlePageChange(currentPage - 1)} 
              disabled={currentPage === 1}
            >
              Previous
            </button>
            <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
              Page {currentPage} of {totalPages}
            </span>
            <button 
              className="btn btn-secondary" 
              onClick={() => handlePageChange(currentPage + 1)} 
              disabled={currentPage === totalPages}
            >
              Next
            </button>
          </div>
        )}
      </div>

      {editingItem && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 style={{ margin: 0 }}>Edit Item: {editingItem.Name}</h3>
              <button className="close-btn" onClick={() => setEditingItem(null)}><X size={20} /></button>
            </div>
            <form onSubmit={handleEditSave}>
              <div style={{ maxHeight: '60vh', overflowY: 'auto', paddingRight: '0.5rem' }}>
                {columns.filter(col => col !== '_Category' && col !== 'ID' && col !== 'Last Updated' && col !== 'Status').map(col => (
                  <div className="form-group" key={col}>
                    <label className="form-label">{col}</label>
                    <input 
                      type={['Quantity', 'Threshold', 'Price'].includes(col) ? 'number' : 'text'}
                      step={['Quantity', 'Threshold', 'Price'].includes(col) ? '0.01' : undefined}
                      className="form-control"
                      value={editForm[col] || ''}
                      onChange={e => setEditForm({ ...editForm, [col]: e.target.value })}
                      readOnly={col === 'Name'}
                    />
                  </div>
                ))}
              </div>
              <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setEditingItem(null)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={isSaving}>
                  <Save size={18} /> Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
