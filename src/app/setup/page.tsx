'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { UserCheck, ShieldAlert, KeyRound, Eye, EyeOff } from 'lucide-react';

export default function SetupPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    async function checkSetup() {
      try {
        const res = await fetch('/api/auth/me');
        const data = await res.json();
        if (data.setupRequired === false) {
          router.push('/login');
        }
      } catch (err) {
        console.error('Error checking setup status', err);
      } finally {
        setChecking(false);
      }
    }
    checkSetup();
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });

      const data = await res.json();

      if (res.ok) {
        alert('Setup complete! You can now log in.');
        router.push('/login');
      } else {
        setError(data.error || 'Setup failed.');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (checking) {
    return (
      <div className="setup-container">
        <p>Checking setup status...</p>
      </div>
    );
  }

  return (
    <div className="setup-container">
      <div className="setup-card">
        <div className="setup-header">
          <div className="setup-logo" style={{ display: 'inline-block' }}>
            <ShieldAlert size={48} />
          </div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '700', marginTop: '0.5rem' }}>First-Time Setup</h2>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
            Configure your shop credentials for **Venkata Srinivasa Kirana**
          </p>
        </div>

        <div className="card" style={{ padding: '1rem', border: '1px solid var(--warning)', backgroundColor: 'var(--secondary-light)' }}>
          <p style={{ fontSize: '0.8rem', color: 'var(--secondary-hover)', fontWeight: '600' }}>
            This system is initializing. We will create the default admin account:
            <br />
            <strong>Username: sivanarayana</strong>
          </p>
        </div>

        {error && (
          <div style={{ color: 'var(--danger)', fontSize: '0.85rem', marginBottom: '1rem', fontWeight: '500' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Admin Username</label>
            <input
              type="text"
              className="form-control"
              value="sivanarayana"
              disabled
              style={{ backgroundColor: 'var(--background-color)', cursor: 'not-allowed' }}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Set Admin Password</label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                className="form-control"
                placeholder="Min 6 characters"
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

          <div className="form-group">
            <label className="form-label">Confirm Password</label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                className="form-control"
                placeholder="Repeat password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
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
            {loading ? 'Configuring System...' : 'Complete Setup & Log In'}
          </button>
        </form>
      </div>
    </div>
  );
}
