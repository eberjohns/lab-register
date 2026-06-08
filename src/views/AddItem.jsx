import { useState, useEffect, useMemo } from 'react';
import { api } from '../api';
import { Plus, Save } from 'lucide-react';
import { toast } from 'sonner';

export default function AddItem({ navigate }) {
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [inventory, setInventory] = useState([]);
  const [itemName, setItemName] = useState('');
  const [quantity, setQuantity] = useState('');
  
  // Existing item or new item logic
  const [existingItem, setExistingItem] = useState(null);
  const [dynamicFields, setDynamicFields] = useState({});
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const init = async () => {
      const cats = await api.getCategories();
      setCategories(cats);
      if (cats.length > 0) setSelectedCategory(cats[0]);
    };
    init();
  }, []);

  useEffect(() => {
    if (!selectedCategory) return;
    const fetchInv = async () => {
      const data = await api.getInventory(selectedCategory);
      setInventory(data);
    };
    fetchInv();
  }, [selectedCategory]);

  // Autocomplete matching
  const suggestions = useMemo(() => {
    if (!itemName.trim()) return [];
    const lower = itemName.trim().toLowerCase();
    return inventory.filter(item => item.Name.toLowerCase().includes(lower));
  }, [itemName, inventory]);

  const exactMatch = useMemo(() => {
    const lower = itemName.trim().toLowerCase();
    return inventory.find(item => item.Name.toLowerCase() === lower);
  }, [itemName, inventory]);

  useEffect(() => {
    if (exactMatch) {
      setExistingItem(exactMatch);
    } else {
      setExistingItem(null);
    }
  }, [exactMatch]);

  // Discover dynamic fields from existing inventory in this category
  const categoryFields = useMemo(() => {
    if (inventory.length === 0) return ['Unit', 'Threshold', 'Price']; // Default mandatory
    const baseCols = ['ID', 'Name', 'Quantity', 'Status', 'Last Updated', '_Category'];
    const allKeys = new Set();
    inventory.forEach(item => {
      Object.keys(item).forEach(k => {
        if (!baseCols.includes(k)) allKeys.add(k);
      });
    });
    // Ensure mandatory user fields are always present
    ['Unit', 'Threshold', 'Price'].forEach(k => allKeys.add(k));
    return Array.from(allKeys);
  }, [inventory]);

  const handleDynamicFieldChange = (field, value) => {
    setDynamicFields(prev => ({...prev, [field]: value}));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!itemName || !quantity || quantity <= 0) return;
    
    setIsSaving(true);
    try {
      const itemData = {
        Name: itemName.trim(),
        Quantity: parseFloat(quantity),
        ...dynamicFields
      };

      await api.addItem(selectedCategory, itemData);
      toast.success('Stock added successfully!');
      navigate('dashboard');
    } catch (err) {
      toast.error('Error adding item.');
      console.error(err);
    }
    setIsSaving(false);
  };

  return (
    <div className="add-item-view animate-fade-in" style={{ maxWidth: '600px', margin: '0 auto' }}>
      <h2 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <Plus color="var(--primary-color)" /> Add Item / Stock
      </h2>

      <div className="glass-panel" style={{ padding: '2rem' }}>
        <form onSubmit={handleSubmit}>
          
          <div className="form-group">
            <label className="form-label">Category</label>
            <select 
              className="form-control" 
              value={selectedCategory}
              onChange={e => {
                setSelectedCategory(e.target.value);
                setItemName('');
                setExistingItem(null);
                setDynamicFields({});
              }}
              required
            >
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div className="form-group" style={{ position: 'relative' }}>
            <label className="form-label">Item Name</label>
            <input 
              type="text" 
              className="form-control" 
              value={itemName}
              onChange={e => setItemName(e.target.value)}
              placeholder="Start typing to search..."
              required
              autoComplete="off"
            />
            {suggestions.length > 0 && !exactMatch && (
              <div style={{
                position: 'absolute', top: '100%', left: 0, right: 0, 
                background: 'var(--surface-highlight)', 
                border: '1px solid var(--border-color)', 
                borderRadius: 'var(--radius-md)',
                marginTop: '0.25rem',
                zIndex: 10,
                maxHeight: '150px',
                overflowY: 'auto',
                boxShadow: 'var(--shadow-md)'
              }}>
                {suggestions.map(s => (
                  <div 
                    key={s.ID} 
                    style={{ padding: '0.75rem 1rem', cursor: 'pointer', borderBottom: '1px solid rgba(255,255,255,0.05)' }}
                    onClick={() => { setItemName(s.Name); }}
                  >
                    {s.Name} <span className="text-muted" style={{fontSize: '0.85rem'}}>({s.Quantity} {s.Unit} in stock)</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {existingItem ? (
            <div style={{ background: 'rgba(16, 185, 129, 0.1)', padding: '1rem', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
              <p style={{ margin: 0, color: 'var(--success)', fontWeight: '500' }}>Item Found in Inventory!</p>
              <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.9rem' }}>
                Current Stock: {existingItem.Quantity} {existingItem.Unit}<br/>
                Adding stock will automatically increase the quantity.
              </p>
            </div>
          ) : itemName.length > 2 ? (
            <div style={{ background: 'rgba(59, 130, 246, 0.1)', padding: '1rem', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem', border: '1px solid rgba(59, 130, 246, 0.2)' }}>
              <p style={{ margin: 0, color: 'var(--primary-color)', fontWeight: '500' }}>New Item</p>
              <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.9rem' }}>
                A completely new inventory record will be created.
              </p>
            </div>
          ) : null}

          <div className="form-group">
            <label className="form-label">Quantity to Add</label>
            <input 
              type="number" 
              step="0.01"
              className="form-control" 
              value={quantity}
              onChange={e => setQuantity(e.target.value)}
              placeholder="e.g. 5"
              required
            />
          </div>

          {!existingItem && itemName.length > 2 && (
            <>
              <hr style={{ border: 0, borderTop: '1px solid var(--border-color)', margin: '2rem 0' }} />
              <h4 style={{ marginBottom: '1rem' }}>Category Properties</h4>
              {categoryFields.map(field => (
                <div className="form-group" key={field}>
                  <label className="form-label">{field}</label>
                  <input 
                    type={field === 'Threshold' || field === 'Price' ? 'number' : 'text'} 
                    step={field === 'Threshold' || field === 'Price' ? '0.01' : undefined}
                    className="form-control" 
                    value={dynamicFields[field] || ''}
                    onChange={e => handleDynamicFieldChange(field, e.target.value)}
                    required={['Unit', 'Threshold', 'Price'].includes(field)}
                  />
                </div>
              ))}
            </>
          )}

          <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1rem' }} disabled={isSaving}>
            <Save size={20} />
            {isSaving ? 'Saving...' : existingItem ? 'Add Stock' : 'Create Item'}
          </button>
        </form>
      </div>
    </div>
  );
}
