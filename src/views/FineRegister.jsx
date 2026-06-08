import { useState } from 'react';
import { api } from '../api';
import { FileText, Save } from 'lucide-react';
import { toast } from 'sonner';

export default function FineRegister({ navigate }) {
  const [formData, setFormData] = useState({
    Name: '',
    Category: 'Student', // UG / PG / Faculty / Student
    Item: '',
    "Fine Amount": '',
    Remarks: ''
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.Name || !formData.Item || !formData["Fine Amount"]) {
      toast.error("Please fill all mandatory fields correctly.");
      return;
    }

    setIsSubmitting(true);
    try {
      await api.addFine({
        ...formData,
        "Fine Amount": parseFloat(formData["Fine Amount"])
      });
      toast.success('Fine recorded successfully!');
      navigate('dashboard');
    } catch (err) {
      toast.error('Failed to record fine.');
      console.error(err);
    }
    setIsSubmitting(false);
  };

  return (
    <div className="fine-register-view animate-fade-in" style={{ maxWidth: '600px', margin: '0 auto' }}>
      <h2 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <FileText color="var(--warning)" /> Fine Register
      </h2>

      <div className="glass-panel" style={{ padding: '2rem' }}>
        <form onSubmit={handleSubmit}>
          
          <div className="form-group">
            <label className="form-label">Person Name</label>
            <input 
              type="text" 
              name="Name"
              className="form-control" 
              value={formData.Name}
              onChange={handleChange}
              placeholder="e.g. Alan Walker"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Category</label>
            <select 
              name="Category"
              className="form-control" 
              value={formData.Category}
              onChange={handleChange}
            >
              <option value="Student">Student (General)</option>
              <option value="UG">Undergraduate (UG)</option>
              <option value="PG">Postgraduate (PG)</option>
              <option value="Faculty">Faculty</option>
              <option value="Staff">Staff</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Item Damaged / Lost</label>
            <input 
              type="text" 
              name="Item"
              className="form-control" 
              value={formData.Item}
              onChange={handleChange}
              placeholder="e.g. Beaker 250 ml"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Fine Amount</label>
            <input 
              type="number" 
              name="Fine Amount"
              step="0.01"
              className="form-control" 
              value={formData["Fine Amount"]}
              onChange={handleChange}
              placeholder="e.g. 50"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Remarks</label>
            <textarea 
              name="Remarks"
              className="form-control" 
              value={formData.Remarks}
              onChange={handleChange}
              placeholder="e.g. Broken during practical experiment"
              rows={3}
            ></textarea>
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1rem', background: 'linear-gradient(135deg, var(--warning) 0%, #d97706 100%)' }} disabled={isSubmitting}>
            <Save size={20} /> Record Fine
          </button>
        </form>
      </div>
    </div>
  );
}
