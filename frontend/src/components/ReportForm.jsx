import React, { useState } from 'react';
import axios from 'axios';
import { Send, CheckCircle } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export default function ReportForm() {
  const [report, setReport] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!report.trim()) return;

    setLoading(true);
    try {
      const res = await axios.post(`${API_URL}/report`, { content: report });
      setSuccess(res.data.issue);
      setReport('');
    } catch (error) {
      console.error(error);
      alert('Error submitting report.');
    }
    setLoading(false);
  };

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto' }}>
      <h2>Submit Unstructured Report</h2>
      <p style={{ color: 'var(--text-light)', marginBottom: '2rem' }}>
        Paste field reports, social media posts, or SMS messages below. Our AI will automatically extract structured data like location, urgency, and affected individuals.
      </p>

      {success && (
        <div className="card" style={{ borderLeft: '4px solid var(--success)', marginBottom: '2rem' }}>
          <h4 style={{ color: 'var(--success)', display: 'flex', alignItems: 'center', gap: '0.5rem', margin: '0 0 0.5rem 0' }}>
            <CheckCircle size={20} /> Successfully Processed
          </h4>
          <p style={{ margin: 0 }}>Detected: <strong>{success.issue_type}</strong> in <strong>{success.location}</strong></p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="card">
        <div className="form-group">
          <label className="form-label">Raw Report Text</label>
          <textarea
            className="form-control"
            rows="8"
            style={{ resize: 'none', minHeight: '200px' }}
            placeholder="e.g., Heavy flooding in downtown area near Main St. Water levels rising fast, at least 50 families stranded on roofs. Need immediate boat rescue."
            value={report}
            onChange={(e) => setReport(e.target.value)}
          ></textarea>
        </div>
        
        <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
          {loading ? 'AI is processing...' : <><Send size={18} /> Process this report</>}
        </button>
      </form>
    </div>
  );
}
