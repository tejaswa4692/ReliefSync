import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, NavLink, Navigate } from 'react-router-dom';
import { Activity, ShieldAlert, HeartHandshake, Send, LogIn, LogOut, Mail, User as UserIcon } from 'lucide-react';
import axios from 'axios';
import { supabase } from './supabase';
import Dashboard from './components/Dashboard';
import ReportForm from './components/ReportForm';
import VolunteerMatching from './components/VolunteerMatching';
import Login from './components/Login';
import Signup from './components/Signup';
import Profile from './components/Profile';
import Inbox from './components/Inbox';
import VolunteersList from './components/VolunteersList';
import VolunteerDetail from './components/VolunteerDetail';

const API_URL = 'http://localhost:8000';

function App() {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [hasNewReports, setHasNewReports] = useState(false);

  const fetchProfile = async (token) => {
    try {
      const res = await axios.get(`${API_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setProfile(res.data);
    } catch (err) {
      console.error("Profile fetch failed", err);
    }
  };

  useEffect(() => {
    console.log("App mounted, checking session...");
    
    // 1. Initial Check
    const initSession = async () => {
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      setSession(currentSession);
      if (currentSession) {
        localStorage.setItem('rs_token', currentSession.access_token);
        fetchProfile(currentSession.access_token);
      }
      setLoading(false);
    };

    initSession();

    // 2. Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, newSession) => {
      setSession(newSession);
      if (newSession) {
        localStorage.setItem('rs_token', newSession.access_token);
        fetchProfile(newSession.access_token);
      } else {
        localStorage.removeItem('rs_token');
        setProfile(null);
      }
    });

    // 3. Real-time Notifications for new issues
    const issuesSubscription = supabase
      .channel('public:issues')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'issues' }, (payload) => {
        console.log('New issue detected!', payload);
        setHasNewReports(true);
      })
      .subscribe((status) => {
        console.log("Realtime subscription status:", status);
      });

    return () => {
      subscription.unsubscribe();
      supabase.removeChannel(issuesSubscription);
    };
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem('rs_token');
    setProfile(null);
    setSession(null);
    window.location.href = '/login';
  };

  if (loading) return <div className="skeleton" style={{ height: '100vh' }}></div>;

  return (
    <Router>
      <div className="app">
        <header>
          <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
            <NavLink to="/" style={{ textDecoration: 'none', color: 'inherit', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <Activity size={28} color="var(--primary)" />
              <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800, letterSpacing: '-0.02em' }}>ReliefSync</h1>
            </NavLink>
            <nav>
              <NavLink to="/" className={({isActive}) => isActive ? "active" : ""}>
                <ShieldAlert size={18} /> Dashboard
              </NavLink>
              <NavLink to="/report" className={({isActive}) => isActive ? "active" : ""}>
                <Send size={18} /> Submit Report
              </NavLink>
              <NavLink to="/volunteer" className={({isActive}) => isActive ? "active" : ""}>
                <HeartHandshake size={18} /> Volunteers
              </NavLink>
              {session && (
                <NavLink 
                  to="/inbox" 
                  className={({isActive}) => isActive ? "active" : ""}
                  onClick={() => setHasNewReports(false)}
                  style={{ position: 'relative' }}
                >
                  <Mail size={18} /> Inbox
                  {hasNewReports && (
                    <span style={{ 
                      position: 'absolute', 
                      top: '8px', 
                      right: '8px', 
                      width: '8px', 
                      height: '8px', 
                      background: 'var(--danger)', 
                      borderRadius: '50%',
                      border: '2px solid white',
                      boxShadow: '0 0 5px rgba(231, 76, 60, 0.5)'
                    }} />
                  )}
                </NavLink>
              )}
            </nav>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
            {session?.user ? (
              <>
                <NavLink to="/profile" style={{ textDecoration: 'none', color: 'inherit' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}>
                    <div style={{ textAlign: 'right', fontSize: '0.85rem' }}>
                      <div style={{ fontWeight: 600, color: 'var(--primary)' }}>
                        {profile?.name || session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'Volunteer'}
                      </div>
                      <div style={{ color: 'var(--text-light)', fontSize: '0.75rem' }}>
                        {profile?.location || 'New Volunteer'}
                      </div>
                    </div>
                    {(profile?.avatar_url || session.user.user_metadata?.avatar_url) ? (
                      <img 
                        src={profile?.avatar_url || session.user.user_metadata.avatar_url} 
                        alt="Avatar" 
                        style={{ width: '40px', height: '40px', borderRadius: '50%', border: '2px solid var(--primary)', objectFit: 'cover' }}
                      />
                    ) : (
                      <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '1.1rem' }}>
                        {(profile?.name || session.user.user_metadata?.full_name || session.user.email)?.[0].toUpperCase()}
                      </div>
                    )}
                  </div>
                </NavLink>
                <button 
                  onClick={() => supabase.auth.signOut()}
                  className="btn"
                  style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'transparent', color: 'var(--danger)', padding: '0.5rem' }}
                  title="Logout"
                >
                  <LogOut size={20} />
                </button>
              </>
            ) : (
              <NavLink to="/login" className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <LogIn size={18} /> Login
              </NavLink>
            )}
          </div>
        </header>

        <main className="container">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route 
              path="/report" 
              element={session ? <ReportForm /> : <Navigate to="/login" />} 
            />
            <Route path="/volunteer" element={<VolunteersList />} />
            <Route path="/volunteers/:id" element={<VolunteerDetail />} />
            <Route 
              path="/match/:id" 
              element={session ? <VolunteerMatching /> : <Navigate to="/login" />} 
            />
            <Route 
              path="/inbox" 
              element={session ? <Inbox /> : <Navigate to="/login" />} 
            />
            <Route path="/profile" element={session ? <Profile user={session.user} onUpdate={() => fetchProfile(session.access_token)} /> : <Navigate to="/login" />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
