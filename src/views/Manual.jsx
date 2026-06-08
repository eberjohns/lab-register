import { BookOpen, Copy, Check } from 'lucide-react';
import { useState } from 'react';
import codeGs from '../../code.gs?raw';

export default function Manual({ navigate }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(codeGs);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="manual-view animate-fade-in" style={{ maxWidth: '800px', margin: '0 auto' }}>
      <h2 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <BookOpen color="var(--primary-color)" /> Manual & Setup Instructions
      </h2>

      <div className="glass-panel" style={{ padding: '2rem', lineHeight: '1.6' }}>
        <h3>1. Google Sheets Formatting</h3>
        <p>The system expects a Google Sheet with tabs functioning as categories.</p>
        <ul>
          <li><strong>Inventory Tabs:</strong> Create sheets for each category (e.g., <code>Chemicals</code>, <code>Glassware</code>).</li>
          <li><strong>Required Columns:</strong> Every inventory sheet MUST contain the following headers exactly: <code>Name</code>, <code>Quantity</code>, <code>Unit</code>, <code>Threshold</code>, <code>Price</code>.</li>
          <li><strong>System Tabs:</strong> The system reserves sheets starting with an underscore (<code>_</code>) such as <code>_Receipts</code> and <code>_Fines</code>. Do not manually edit these.</li>
        </ul>

        <h3 style={{ marginTop: '2rem' }}>2. Connecting the Backend</h3>
        <p>This web application runs on top of Google Apps Script to write directly to your Google Sheet.</p>
        <ol>
          <li>Open your Google Sheet.</li>
          <li>Click on <strong>Extensions &gt; Apps Script</strong>.</li>
          <li>Copy the contents of the <code>code.gs</code> file below and paste it into the Apps Script editor, completely replacing any existing code.</li>
          
          <div style={{ position: 'relative', margin: '1rem 0', background: 'var(--surface-highlight)', borderRadius: 'var(--radius-md)', padding: '1rem', overflow: 'hidden' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
              <span style={{ fontFamily: 'monospace', fontWeight: '600' }}>code.gs</span>
              <button 
                onClick={handleCopy} 
                className="btn btn-secondary" 
                style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem' }}
              >
                {copied ? <><Check size={14} /> Copied</> : <><Copy size={14} /> Copy to Clipboard</>}
              </button>
            </div>
            <pre style={{ margin: 0, maxHeight: '250px', overflowY: 'auto', fontSize: '0.85rem' }}>
              <code>{codeGs}</code>
            </pre>
          </div>

          <li>Click the Save icon.</li>
          <li>Click <strong>Deploy &gt; New deployment</strong>.</li>
          <li>Select type: <strong>Web app</strong>.</li>
          <li>Execute as: <strong>Me</strong>. Who has access: <strong>Anyone</strong>.</li>
          <li>Click Deploy. You will be prompted to authorize access to your Google Account.</li>
          <li>Copy the resulting Web App URL and add it to the URL of this dashboard as a parameter: <br/><code>?api=YOUR_APPS_SCRIPT_URL</code></li>
        </ol>

        <h3 style={{ marginTop: '2rem' }}>3. Using the Web Interface</h3>
        <p>Once you load the app with the <code>?api=...</code> parameter, the manual will disappear and the actual dashboard will load, connected directly to your Google Sheet.</p>
      </div>
    </div>
  );
}
