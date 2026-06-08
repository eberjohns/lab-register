import { useState, useEffect } from 'react';
import { api } from '../api';
import { Database, Upload, FileSpreadsheet } from 'lucide-react';
import * as XLSX from 'xlsx';
import { toast } from 'sonner';

export default function BulkImport({ navigate }) {
  const [file, setFile] = useState(null);
  const [categories, setCategories] = useState([]);
  const [category, setCategory] = useState('');
  const [isImporting, setIsImporting] = useState(false);

  useEffect(() => {
    const fetchCats = async () => {
      try {
        const cats = await api.getCategories();
        setCategories(cats);
        if (cats.length > 0) setCategory(cats[0]);
      } catch (err) {
        console.error("Failed to load categories", err);
      }
    };
    fetchCats();
  }, []);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleImport = async () => {
    if (!file) {
      toast.error("Please select a file to import");
      return;
    }
    if (!category.trim()) {
      toast.error("Please specify the category to import into");
      return;
    }

    setIsImporting(true);
    
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const json = XLSX.utils.sheet_to_json(worksheet);
        
        if (json.length === 0) {
          toast.error("The uploaded file is empty.");
          setIsImporting(false);
          return;
        }

        // We will loop and add items
        for (const item of json) {
          // Normalize the required fields from potential variations in headers
          const parsedItem = { ...item };
          
          if (!parsedItem.Name) {
            console.warn("Skipping row with missing Name", item);
            continue;
          }
          if (parsedItem.Quantity === undefined) parsedItem.Quantity = 0;
          
          await api.addItem(category.trim(), parsedItem);
        }
        
        toast.success(`Successfully imported ${json.length} items into ${category}`);
        navigate('dashboard');
      } catch (err) {
        console.error("Import error", err);
        toast.error("Failed to parse or import the file.");
      }
      setIsImporting(false);
    };
    
    reader.readAsArrayBuffer(file);
  };

  return (
    <div className="bulk-import-view animate-fade-in" style={{ maxWidth: '600px', margin: '0 auto' }}>
      <h2 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <Database color="var(--primary-color)" /> Bulk Import
      </h2>

      <div className="glass-panel" style={{ padding: '2rem' }}>
        <p className="text-muted" style={{ marginBottom: '1.5rem' }}>
          Upload an Excel (.xlsx) or CSV file. The file MUST have a header row containing at least <code>Name</code> and <code>Quantity</code>. Any other columns will be imported as dynamic category properties.
        </p>

        <div className="form-group">
          <label className="form-label">Category Name</label>
          <select 
            className="form-control" 
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        <div className="form-group">
          <label className="form-label">Select File</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <input 
              type="file" 
              accept=".xlsx, .xls, .csv" 
              onChange={handleFileChange}
              className="form-control"
              style={{ padding: '0.5rem' }}
            />
          </div>
        </div>

        <button 
          className="btn btn-primary" 
          style={{ width: '100%', marginTop: '1rem' }} 
          onClick={handleImport}
          disabled={isImporting || !file || !category}
        >
          <Upload size={20} /> {isImporting ? 'Importing...' : 'Start Import'}
        </button>
      </div>
    </div>
  );
}
