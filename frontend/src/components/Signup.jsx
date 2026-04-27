import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { UserPlus, Mail, Lock, User, MapPin, Tag, Phone } from 'lucide-react';
import { supabase } from '../supabase';

const API_URL = 'http://localhost:8000';

export default function Signup() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    location: '',
    skills: '',
    phone_number: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    const skillsArray = formData.skills.split(',').map(s => s.trim()).filter(s => s !== '');

    try {
      // 1. Auth Signup
      const { data, error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.name,
          }
        }
      });
      
      if (error) throw error;

      // 2. Profile Update (Trigger will have created the initial row)
      if (data.user) {
        await axios.put(`${API_URL}/auth/me`, {
          name: formData.name,
          location: formData.location,
          skills: skillsArray,
          phone_number: formData.phone_number || null
        }, {
          headers: { Authorization: `Bearer ${data.session?.access_token}` }
        });
      }

      navigate('/login');
    } catch (err) {
      setError(err.message || 'Signup failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card" style={{ maxWidth: '500px', margin: '2rem auto' }}>
      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <UserPlus size={48} color="var(--primary)" />
        <h2 style={{ marginTop: '1rem' }}>Volunteer Registration</h2>
        <p style={{ color: 'var(--text-light)' }}>Join the ReliefSync network</p>
      </div>

      {error && (
        <div style={{ padding: '1rem', background: 'rgba(231, 76, 60, 0.1)', color: 'var(--danger)', borderRadius: 'var(--radius)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
        <div>
          <label className="form-label"><Mail size={14} /> Email Address</label>
          <input 
            type="email" 
            name="email"
            className="form-control" 
            required 
            value={formData.email}
            onChange={handleChange}
            placeholder="email@example.com"
          />
        </div>

        <div>
          <label className="form-label"><Lock size={14} /> Password</label>
          <input 
            type="password" 
            name="password"
            className="form-control" 
            required 
            value={formData.password}
            onChange={handleChange}
            placeholder="Min 6 characters"
          />
        </div>

        <div>
          <label className="form-label"><User size={14} /> Full Name</label>
          <input 
            type="text" 
            name="name"
            className="form-control" 
            required 
            value={formData.name}
            onChange={handleChange}
            placeholder="John Doe"
          />
        </div>

        <div>
          <label className="form-label"><MapPin size={14} /> Base Location</label>
          <input 
            type="text" 
            name="location"
            className="form-control" 
            required 
            value={formData.location}
            onChange={handleChange}
            placeholder="e.g. South River Bank"
          />
        </div>

        <div>
          <label className="form-label"><Tag size={14} /> Skills (comma separated)</label>
          <input 
            type="text" 
            name="skills"
            className="form-control" 
            required 
            value={formData.skills}
            onChange={handleChange}
            placeholder="medical, rescue, logistics"
          />
        </div>

        <div>
          <label className="form-label"><Phone size={14} /> Phone Number (Optional)</label>
          <input 
            type="tel" 
            name="phone_number"
            className="form-control" 
            value={formData.phone_number}
            onChange={handleChange}
            placeholder="+1 234 567 8900"
          />
        </div>

        <button type="submit" className="btn btn-primary btn-full" disabled={loading} style={{ marginTop: '1rem' }}>
          {loading ? 'Creating Account...' : 'Register as Volunteer'}
        </button>

        <p style={{ textAlign: 'center', fontSize: '0.9rem', color: 'var(--text-light)' }}>
          Already have an account? <Link to="/login" style={{ color: 'var(--primary)', fontWeight: 600 }}>Login here</Link>
        </p>
      </form>
    </div>
  );
}
