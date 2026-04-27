import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { User, MapPin, Tag, Save, CheckCircle, Mail, Activity, ShieldAlert, Loader2, Camera, Users, Phone } from 'lucide-react';
import { Link } from 'react-router-dom';

const API_URL = 'http://localhost:8000';
const IMGBB_API_KEY = import.meta.env.VITE_IMGBB_API_KEY; 

export default function Profile({ user, onUpdate }) {
  const [formData, setFormData] = useState({
    name: '',
    location: '',
    skills: '',
    availability: true,
    avatar_url: '',
    phone_number: ''
  });
  const [assignments, setAssignments] = useState([]);
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    const init = async () => {
      await Promise.all([fetchProfile(), fetchAssignments(), fetchTeams()]);
      setLoading(false);
    };
    init();
  }, [user]);

  const fetchProfile = async () => {
    const token = localStorage.getItem('rs_token');
    try {
      const res = await axios.get(`${API_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setFormData({
        name: res.data.name || '',
        location: res.data.location || '',
        skills: (res.data.skills || []).join(', '),
        availability: res.data.availability === true,
        avatar_url: res.data.avatar_url || '',
        phone_number: res.data.phone_number || ''
      });
    } catch (err) {
      console.error("Profile fetch error:", err);
    }
  };

  const fetchAssignments = async () => {
    const token = localStorage.getItem('rs_token');
    try {
      const res = await axios.get(`${API_URL}/assignments/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAssignments(res.data || []);
    } catch (err) {
      console.error("Assignments fetch error:", err);
    }
  };

  const fetchTeams = async () => {
    const token = localStorage.getItem('rs_token');
    try {
      const res = await axios.get(`${API_URL}/users/me/teams`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTeams(res.data || []);
    } catch (err) {
      console.error("Teams fetch error:", err);
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!IMGBB_API_KEY) {
      alert("Missing ImgBB API Key! Please add VITE_IMGBB_API_KEY to your frontend .env file.");
      return;
    }

    setUploading(true);
    const formDataUpload = new FormData();
    formDataUpload.append('image', file);

    try {
      const res = await axios.post(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, formDataUpload);
      const imageUrl = res.data.data.url;
      setFormData(prev => ({ ...prev, avatar_url: imageUrl }));
      alert("Photo uploaded! Remember to click 'Save Changes' below.");
    } catch (err) {
      console.error("ImgBB Upload Failed:", err);
      alert("Failed to upload image.");
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSuccess(false);
    
    const skillsArray = String(formData.skills).split(',').map(s => s.trim()).filter(s => s !== '');
    const token = localStorage.getItem('rs_token');

    try {
      await axios.put(`${API_URL}/auth/me`, 
        { ...formData, skills: skillsArray },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSuccess(true);
      if (onUpdate) onUpdate();
      alert("Profile updated successfully!");
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error("Save Error:", err);
      alert("Failed to save profile.");
    } finally {
      setSaving(false);
    }
  };

  const toggleAvailability = () => {
    setFormData(prev => ({ ...prev, availability: !prev.availability }));
  };

  const isIncomplete = !formData.location || formData.skills.length < 3;

  if (loading) return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div className="card skeleton" style={{ height: '300px' }}></div>
      <div className="card skeleton" style={{ height: '200px' }}></div>
    </div>
  );

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {isIncomplete && (
        <div className="card" style={{ background: 'rgba(231, 76, 60, 0.1)', border: '1px solid var(--danger)', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <ShieldAlert color="var(--danger)" />
          <div style={{ fontSize: '0.9rem' }}>
            <strong>Profile Incomplete:</strong> Please complete your profile to be recommended by the AI.
          </div>
        </div>
      )}

      {/* Profile Info Card */}
      <div className="card">
        <div className="flex-responsive" style={{ justifyContent: 'space-between', marginBottom: '2rem', width: '100%' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
            <div style={{ position: 'relative' }}>
              {(formData.avatar_url || user?.user_metadata?.avatar_url) ? (
                <img 
                  src={formData.avatar_url || user?.user_metadata?.avatar_url} 
                  alt="Avatar" 
                  style={{ width: '90px', height: '90px', borderRadius: '50%', border: '4px solid var(--primary)', objectFit: 'cover' }}
                />
              ) : (
                <div style={{ width: '90px', height: '90px', borderRadius: '50%', background: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '2.5rem' }}>
                  {(formData.name || user?.user_metadata?.full_name || user?.email)?.[0].toUpperCase()}
                </div>
              )}
              
              <label style={{ 
                position: 'absolute', 
                bottom: '0', 
                right: '0', 
                background: 'white', 
                borderRadius: '50%', 
                padding: '6px', 
                cursor: 'pointer', 
                boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <input type="file" style={{ display: 'none' }} accept="image/*" onChange={handleImageUpload} />
                {uploading ? <Loader2 size={16} className="spin" /> : <Camera size={16} color="var(--primary)" />}
              </label>
            </div>
            
            <div>
              <h2 style={{ margin: 0 }}>{formData.name || 'Volunteer Profile'}</h2>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-light)', marginTop: '0.5rem' }}>
                <Mail size={16} /> {user?.email}
              </div>
            </div>
          </div>

          <div className="header-actions" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-light)', marginBottom: '0.5rem', fontWeight: 700 }}>AVAILABILITY</div>
            <div 
              onClick={toggleAvailability}
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '0.75rem', 
                cursor: 'pointer',
                background: formData.availability ? 'rgba(46, 204, 113, 0.1)' : 'var(--border)',
                padding: '0.5rem 1rem',
                borderRadius: '2rem',
                transition: '0.3s'
              }}
            >
              <div style={{ 
                width: '12px', 
                height: '12px', 
                borderRadius: '50%', 
                background: formData.availability ? 'var(--success)' : '#95a5a6' 
              }} />
              <span style={{ fontSize: '0.9rem', fontWeight: 700, color: formData.availability ? 'var(--success)' : '#7f8c8d' }}>
                {formData.availability ? 'Active Duty' : 'Off Duty'}
              </span>
            </div>
          </div>
        </div>
      </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="grid grid-cols-2">
            <div>
              <label className="form-label">Full Name</label>
              <input 
                type="text" 
                className="form-control"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                required
              />
            </div>
            <div>
              <label className="form-label">Location</label>
              <input 
                type="text" 
                className="form-control"
                value={formData.location}
                onChange={(e) => setFormData({...formData, location: e.target.value})}
                required
              />
            </div>
          </div>

          <div>
            <label className="form-label">Skills (comma separated)</label>
            <input 
              type="text" 
              className="form-control"
              value={formData.skills}
              onChange={(e) => setFormData({...formData, skills: e.target.value})}
              placeholder="rescue, medical, driving"
              required
            />
          </div>

          <div>
            <label className="form-label">Phone Number (Optional)</label>
            <input 
              type="tel" 
              className="form-control"
              value={formData.phone_number}
              onChange={(e) => setFormData({...formData, phone_number: e.target.value})}
              placeholder="+1 234 567 8900"
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <button type="submit" className="btn btn-primary" disabled={saving || uploading}>
              {saving ? 'Saving...' : <><Save size={18} /> Save Changes</>}
            </button>
            {success && <span style={{ color: 'var(--success)' }}><CheckCircle size={18} /> Profile Updated!</span>}
          </div>
        </form>
      </div>

      {/* Missions */}
      <div className="card">
        <h3><Activity size={20} /> My Active Missions</h3>
        {assignments.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {assignments.map(a => (
              <div key={a.id} className="card-header" style={{ padding: '1rem', border: '1px solid var(--border)', borderRadius: 'var(--radius)', marginBottom: 0 }}>
                <div>
                  <strong>{a.issues?.issue_type}</strong>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-light)' }}>{a.issues?.location}</div>
                </div>
                <span className="badge">{a.status}</span>
              </div>
            ))}
          </div>
        ) : (
          <p style={{ color: 'var(--text-light)' }}>No active missions.</p>
        )}
      </div>

      {/* Teams */}
      <div className="card">
        <h3><Users size={20} /> My Teams</h3>
        {teams.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {teams.map(t => (
              <div key={t.id} className="card-header" style={{ padding: '1rem', border: '1px solid var(--border)', borderRadius: 'var(--radius)', marginBottom: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  {t.image_url ? (
                    <img src={t.image_url} alt={t.name} style={{ width: '40px', height: '40px', borderRadius: '4px', objectFit: 'cover' }} />
                  ) : (
                    <div style={{ width: '40px', height: '40px', borderRadius: '4px', background: 'var(--bg-dark)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Users size={20} color="var(--primary)" />
                    </div>
                  )}
                  <div>
                    <strong><Link to={`/teams/${t.id}`} style={{ color: 'inherit', textDecoration: 'none' }}>{t.name}</Link></strong>
                    {t.leader_id === user?.id && <span style={{ fontSize: '0.75rem', color: 'var(--warning)', marginLeft: '0.5rem' }}>★ Leader</span>}
                  </div>
                </div>
                <span className={`badge badge-${t.is_approved ? 'low' : 'medium'}`}>
                  {t.is_approved ? 'Approved' : 'Pending'}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p style={{ color: 'var(--text-light)' }}>You are not in any teams.</p>
        )}
      </div>
    </div>
  );
}
