import { useState, useEffect, useMemo } from 'react';
import { api } from '../api';
import { MinusSquare, Plus, Trash2, Send } from 'lucide-react';
import { toast } from 'sonner';

export default function StockUsed({ navigate }) {
  const [faculty, setFaculty] = useState('');
  const [purpose, setPurpose] = useState('');
  const [cart, setCart] = useState([]);
  
  // Current item being added to cart
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [inventory, setInventory] = useState([]);
  const [itemName, setItemName] = useState('');
  const [quantity, setQuantity] = useState('');
  
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  const suggestions = useMemo(() => {
    if (!itemName.trim()) return [];
    const lower = itemName.trim().toLowerCase();
    return inventory.filter(item => item.Name.toLowerCase().includes(lower));
  }, [itemName, inventory]);

  const exactMatch = useMemo(() => {
    const lower = itemName.trim().toLowerCase();
    return inventory.find(item => item.Name.toLowerCase() === lower);
  }, [itemName, inventory]);

  const handleAddToCart = () => {
    if (!exactMatch || !quantity || quantity <= 0) {
      toast.error("Please select a valid item and quantity.");
      return;
    }
    if (parseFloat(quantity) > exactMatch.Quantity) {
      toast.error(`Cannot deduct more than available stock (${exactMatch.Quantity} ${exactMatch.Unit}).`);
      return;
    }
    
    setCart([...cart, { 
      category: selectedCategory, 
      Name: exactMatch.Name, 
      Quantity: parseFloat(quantity),
      Unit: exactMatch.Unit
    }]);
    
    setItemName('');
    setQuantity('');
  };

  const removeFromCart = (index) => {
    setCart(cart.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!faculty || !purpose || cart.length === 0) {
      toast.error("Please fill in faculty, purpose, and add at least one item.");
      return;
    }

    setIsSubmitting(true);
    try {
      await api.deductItems(faculty, purpose, cart);
      toast.success("Stock usage recorded successfully!");
      navigate('dashboard');
    } catch (err) {
      toast.error("Failed to record stock usage.");
      console.error(err);
    }
    setIsSubmitting(false);
  };

  return (
    <div className="stock-used-view animate-fade-in" style={{ maxWidth: '800px', margin: '0 auto' }}>
      <h2 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <MinusSquare color="var(--danger)" /> Record Stock Usage
      </h2>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
        
        {/* Left Side: Add to Cart */}
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <h4 style={{ marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>Item Details</h4>
          
          <div className="form-group">
            <label className="form-label">Category</label>
            <select 
              className="form-control" 
              value={selectedCategory}
              onChange={e => {
                setSelectedCategory(e.target.value);
                setItemName('');
              }}
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
              placeholder="Search item..."
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
                overflowY: 'auto'
              }}>
                {suggestions.map(s => (
                  <div 
                    key={s.ID} 
                    style={{ padding: '0.5rem 1rem', cursor: 'pointer', borderBottom: '1px solid rgba(255,255,255,0.05)' }}
                    onClick={() => setItemName(s.Name)}
                  >
                    {s.Name} <span className="text-muted">({s.Quantity} {s.Unit})</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="form-group">
            <label className="form-label">Quantity to Use</label>
            <input 
              type="number" 
              step="0.01"
              className="form-control" 
              value={quantity}
              onChange={e => setQuantity(e.target.value)}
            />
            {exactMatch && (
              <span className="text-muted" style={{ fontSize: '0.8rem', marginTop: '0.25rem', display: 'block' }}>
                Available: {exactMatch.Quantity} {exactMatch.Unit}
              </span>
            )}
          </div>

          <button type="button" className="btn btn-secondary" style={{ width: '100%' }} onClick={handleAddToCart}>
            <Plus size={18} /> Add to List
          </button>
        </div>

        {/* Right Side: Cart & Checkout */}
        <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column' }}>
          <h4 style={{ marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>Transaction Details</h4>
          
          <div className="form-group">
            <label className="form-label">Faculty / Staff Name</label>
            <input 
              type="text" 
              className="form-control" 
              value={faculty}
              onChange={e => setFaculty(e.target.value)}
              placeholder="e.g. Dr. Thomas"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Purpose</label>
            <input 
              type="text" 
              className="form-control" 
              value={purpose}
              onChange={e => setPurpose(e.target.value)}
              placeholder="e.g. BSc Chemistry Practical"
            />
          </div>

          <div style={{ flex: 1, border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '1rem', marginBottom: '1.5rem', background: 'rgba(0,0,0,0.2)', overflowY: 'auto', maxHeight: '200px' }}>
            <h5 style={{ margin: '0 0 0.5rem 0' }}>Items ({cart.length})</h5>
            {cart.length === 0 ? (
              <p className="text-muted" style={{ fontSize: '0.9rem', margin: 0 }}>No items added yet.</p>
            ) : (
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {cart.map((item, idx) => (
                  <li key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <div>
                      <div style={{ fontWeight: '500' }}>{item.Name}</div>
                      <div className="text-muted" style={{ fontSize: '0.8rem' }}>{item.Quantity} {item.Unit}</div>
                    </div>
                    <button type="button" onClick={() => removeFromCart(idx)} style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', padding: '0.25rem' }}>
                      <Trash2 size={16} />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <button 
            type="button" 
            className="btn btn-primary" 
            style={{ width: '100%', marginTop: 'auto' }} 
            onClick={handleSubmit}
            disabled={isSubmitting || cart.length === 0 || !faculty || !purpose}
          >
            <Send size={18} /> Confirm & Record
          </button>
        </div>
      </div>
    </div>
  );
}
