import React from 'react';
import { NavLink } from 'react-router-dom';
import { Activity, ShieldAlert, HeartHandshake, Zap, Globe, Users, ArrowRight } from 'lucide-react';

export default function Home() {
  return (
    <div className="home-container">
      {/* Hero Section */}
      <section className="hero-section fade-in-up">
        <div className="hero-content">
          <div className="badge-pill pulse-animation">
            <Activity size={14} className="spin-slow" /> AI-Powered Crisis Management
          </div>
          <h1 className="hero-title">
            Coordinate Relief. <br/>
            <span className="text-gradient">Save Lives Faster.</span>
          </h1>
          <p className="hero-subtitle">
            ReliefSync uses advanced artificial intelligence to detect crisis spikes, 
            intelligently match volunteers based on skills and location, and coordinate 
            rapid emergency response in real-time.
          </p>
          <div className="hero-actions">
            <NavLink to="/signup" className="btn btn-primary btn-lg glow-effect">
              Join the Force <ArrowRight size={18} />
            </NavLink>
            <NavLink to="/dashboard" className="btn btn-outline btn-lg glass-btn">
              View Command Center
            </NavLink>
          </div>
        </div>
        
        {/* Abstract Hero Graphic */}
        <div className="hero-graphic float-animation">
          <div className="glass-card mockup-card">
            <div className="mockup-header">
              <div className="dots"><span></span><span></span><span></span></div>
              <div className="title">AI Match Analysis</div>
            </div>
            <div className="mockup-body">
              <div className="alert-row">
                <ShieldAlert color="#ef4444" size={24} />
                <div>
                  <strong>Category 4 Flood Detected</strong>
                  <span>Sector 7G • High Priority</span>
                </div>
              </div>
              <div className="match-row">
                <div className="match-avatar">T</div>
                <div>
                  <strong>Team Alpha Dispatched</strong>
                  <span style={{color: '#10b981'}}>98% Skill Match</span>
                </div>
                <Zap size={16} color="#10b981" />
              </div>
              <div className="match-row">
                <div className="match-avatar" style={{background: '#f59e0b'}}>M</div>
                <div>
                  <strong>Medical Unit Standby</strong>
                  <span style={{color: '#f59e0b'}}>ETA: 4 mins</span>
                </div>
              </div>
            </div>
          </div>
          <div className="glow-orb orb-1"></div>
          <div className="glow-orb orb-2"></div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features-section fade-in-up delay-1">
        <h2 className="section-title">Next-Gen Coordination</h2>
        <div className="grid grid-cols-3">
          <div className="feature-card tilt-effect">
            <div className="feature-icon bg-primary-light">
              <Activity size={28} color="var(--primary)" />
            </div>
            <h3>Real-time AI Detection</h3>
            <p>Our algorithms continuously scan incoming reports to identify crisis spikes before they escalate, providing crucial lead time.</p>
          </div>
          
          <div className="feature-card tilt-effect delay-1">
            <div className="feature-icon bg-success-light">
              <HeartHandshake size={28} color="var(--success)" />
            </div>
            <h3>Smart Volunteer Matching</h3>
            <p>Automatically pairs the right responders to the right missions based on precise geolocation, availability, and specific skill sets.</p>
          </div>
          
          <div className="feature-card tilt-effect delay-2">
            <div className="feature-icon bg-warning-light">
              <Users size={28} color="var(--warning)" />
            </div>
            <h3>Team Ecosystem</h3>
            <p>Form specialized squads, designate leaders, and tackle complex multi-faceted emergencies as a synchronized unit.</p>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="stats-section fade-in-up delay-2">
        <div className="glass-panel">
          <div className="stat-item">
            <div className="stat-value text-gradient">24/7</div>
            <div className="stat-label">AI Monitoring</div>
          </div>
          <div className="divider"></div>
          <div className="stat-item">
            <div className="stat-value text-gradient">&lt;2m</div>
            <div className="stat-label">Average Dispatch Time</div>
          </div>
          <div className="divider"></div>
          <div className="stat-item">
            <div className="stat-value text-gradient">Global</div>
            <div className="stat-label"><Globe size={18}/> Reach</div>
          </div>
        </div>
      </section>
    </div>
  );
}
