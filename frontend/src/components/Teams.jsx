import React, { useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { Users, Plus, Upload, Loader, Image as ImageIcon } from 'lucide-react';
import { useDataCache } from '../DataCache';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
const IMGBB_API_KEY = import.meta.env.VITE_IMGBB_API_KEY;

function Teams() {
  const { teams, publicLoading, refreshTeams } = useDataCache();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState({ name: '', description: '' });
  const [imageFile, setImageFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  
  const token = localStorage.getItem('rs_token');

  const handleImageUpload = async (file) => {
    const fd = new FormData();
    fd.append('image', file);
    
    if (!IMGBB_API_KEY) {
      throw new Error("Missing ImgBB API Key! Please add VITE_IMGBB_API_KEY to your frontend .env file.");
    }
    
    try {
      const res = await axios.post(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, fd);
      return res.data.data.url;
    } catch (err) {
      console.error("Image upload failed", err);
      throw new Error("Failed to upload image");
    }
  };

  const handleCreateTeam = async (e) => {
    e.preventDefault();
    if (!token) return setError('You must be logged in to create a team.');
    
    setUploading(true);
    setError('');
    
    try {
      let imageUrl = null;
      if (imageFile) {
        imageUrl = await handleImageUpload(imageFile);
      }
      
      await axios.post(`${API_URL}/teams`, {
        name: formData.name,
        description: formData.description,
        image_url: imageUrl
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setFormData({ name: '', description: '' });
      setImageFile(null);
      setShowCreateForm(false);
      refreshTeams();
    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'Failed to create team');
    } finally {
      setUploading(false);
    }
  };

  if (publicLoading) {
    return <div className="skeleton" style={{ height: '200px' }}></div>;
  }

  return (
    <div className="teams-page fade-in">
      <div className="header-actions-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h2><Users style={{ verticalAlign: 'middle', marginRight: '8px' }} /> Response Teams</h2>
        {token && (
          <button className="btn btn-primary" onClick={() => setShowCreateForm(!showCreateForm)}>
            <Plus size={18} /> {showCreateForm ? 'Cancel' : 'Create Team'}
          </button>
        )}
      </div>

      {showCreateForm && (
        <div className="card slide-down" style={{ marginBottom: '2rem' }}>
          <h3>Create a New Team</h3>
          {error && <div className="alert alert-danger">{error}</div>}
          <form onSubmit={handleCreateTeam}>
            <div className="form-group">
              <label>Team Name *</label>
              <input 
                type="text" 
                className="form-control" 
                value={formData.name} 
                onChange={(e) => setFormData({...formData, name: e.target.value})} 
                required 
                placeholder="e.g. Downtown Rescue Squad"
              />
            </div>
            <div className="form-group">
              <label>Description</label>
              <textarea 
                className="form-control" 
                value={formData.description} 
                onChange={(e) => setFormData({...formData, description: e.target.value})} 
                rows={3} 
                placeholder="What does your team do?"
              />
            </div>
            <div className="form-group">
              <label>Team Image</label>
              <div className="file-upload-wrapper" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <label className="btn btn-outline" style={{ cursor: 'pointer' }}>
                  <ImageIcon size={18} style={{ marginRight: '8px' }} />
                  Choose Image
                  <input 
                    type="file" 
                    accept="image/*" 
                    onChange={(e) => setImageFile(e.target.files[0])} 
                    style={{ display: 'none' }}
                  />
                </label>
                {imageFile && <span style={{ fontSize: '0.9rem', color: 'var(--text-light)' }}>{imageFile.name}</span>}
              </div>
            </div>
            <button type="submit" className="btn btn-primary" disabled={uploading}>
              {uploading ? <Loader className="spin" size={18} /> : 'Create Team'}
            </button>
          </form>
        </div>
      )}

      <div className="grid">
        {teams.length === 0 ? (
          <p style={{ color: 'var(--text-light)' }}>No teams found. Be the first to create one!</p>
        ) : (
          teams.map(team => (
            <div key={team.id} className="card volunteer-card">
              {team.image_url ? (
                <img 
                  src={team.image_url} 
                  alt={team.name} 
                  style={{ width: 'calc(100% + 3rem)', height: '150px', objectFit: 'cover', borderRadius: '8px 8px 0 0', margin: '-1.5rem -1.5rem 1rem -1.5rem' }} 
                />
              ) : (
                <div style={{ width: 'calc(100% + 3rem)', height: '150px', background: 'var(--bg-dark)', borderRadius: '8px 8px 0 0', margin: '-1.5rem -1.5rem 1rem -1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' }}>
                  <Users size={48} />
                </div>
              )}
              <h3 style={{ marginTop: '0.5rem', marginBottom: '0.5rem' }}>{team.name}</h3>
              <p style={{ color: 'var(--text-light)', fontSize: '0.9rem', marginBottom: '1rem', flex: 1 }}>
                {team.description || "No description provided."}
              </p>
              
              <div className="meta-info" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span className="badge" style={{ background: 'rgba(52, 152, 219, 0.1)', color: 'var(--primary)' }}>
                    {team.members?.[0]?.count || 1} Members
                  </span>
                </div>
                <Link to={`/teams/${team.id}`} className="btn btn-outline" style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}>
                  View Team
                </Link>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default Teams;
