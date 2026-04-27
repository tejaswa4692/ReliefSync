import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { LogIn, Mail, Lock } from 'lucide-react';
import { supabase } from '../supabase';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export default function Login() {
  const [formData, setFormData] = useState({ email: '', password: '' });
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

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      });
      
      if (error) throw error;
      
      navigate('/');
    } catch (err) {
      setError(err.message || 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      // Note: This requires you to enable Google Provider in Supabase Dashboard
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin
        }
      });
      if (error) throw error;
    } catch (err) {
      setError('Google login failed.');
    }
  };

  return (
    <div className="card" style={{ maxWidth: '400px', margin: '4rem auto' }}>
      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <LogIn size={48} color="var(--primary)" />
        <h2 style={{ marginTop: '1rem' }}>Volunteer Login</h2>
      </div>

      {error && (
        <div style={{ padding: '1rem', background: 'rgba(231, 76, 60, 0.1)', color: 'var(--danger)', borderRadius: 'var(--radius)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
        <div>
          <label className="form-label"><Mail size={14} /> Email</label>
          <input 
            type="email" 
            name="email"
            className="form-control" 
            required 
            value={formData.email}
            onChange={handleChange}
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
          />
        </div>

        <button type="submit" className="btn btn-primary btn-full" disabled={loading} style={{ marginTop: '1rem' }}>
          {loading ? 'Logging in...' : 'Sign In'}
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', margin: '1rem 0' }}>
          <hr style={{ flex: 1, opacity: 0.1 }} />
          <span style={{ fontSize: '0.8rem', color: 'var(--text-light)' }}>OR</span>
          <hr style={{ flex: 1, opacity: 0.1 }} />
        </div>

        <button 
          type="button" 
          onClick={handleGoogleLogin}
          className="btn" 
          style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            gap: '0.75rem',
            background: 'white',
            color: '#333',
            border: '1px solid #ddd'
          }}
        >
          <img src="https://www.google.com/favicon.ico" width="16" alt="Google" />
          Continue with Google
        </button>

        <p style={{ textAlign: 'center', fontSize: '0.9rem', color: 'var(--text-light)' }}>
          Don't have an account? <Link to="/signup" style={{ color: 'var(--primary)', fontWeight: 600 }}>Register here</Link>
        </p>
      </form>
    </div>
  );
}
