'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { KeyRound, ShieldCheck, Eye, EyeOff } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    // Check if setup is needed or if already logged in
    async function checkStatus() {
      try {
        const res = await fetch('/api/auth/me');
        const data = await res.json();
        if (data.setupRequired) {
          router.push('/setup');
        } else if (data.user) {
          router.push('/');
        }
      } catch (err) {
        console.error('Error checking auth state', err);
      }
    }
    checkStatus();
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (res.ok) {
        router.push('/');
      } else {
        setError(data.error || 'Invalid credentials');
      }
    } catch (err) {
      setError('Connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="setup-container">
      <div className="setup-card">
        <div className="setup-header">
          <div className="setup-logo" style={{ display: 'inline-block' }}>
            <KeyRound size={48} />
          </div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '700', marginTop: '0.5rem' }}>Admin Portal</h2>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
            Venkata Srinivasa Kirana & General Merchant
          </p>
        </div>

        {error && (
          <div style={{ color: 'var(--danger)', fontSize: '0.85rem', marginBottom: '1rem', fontWeight: '500' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Username</label>
            <input
              type="text"
              className="form-control"
              placeholder="Enter username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                className="form-control"
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{ paddingRight: '40px' }}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '10px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--text-light)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: 0
                }}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', padding: '0.75rem', marginTop: '0.5rem' }}
            disabled={loading}
          >
            {loading ? 'Authenticating...' : 'Sign In'}
          </button>
        </form>

        <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
          <a href="/billing" style={{ fontSize: '0.85rem', color: 'var(--primary-color)', fontWeight: '600' }}>
            ← Back to Billing (Staff Counter)
          </a>
        </div>
      </div>
    </div>
  );
}
