'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { ShoppingBag, Key, LayoutDashboard, ClipboardList, LogOut, User } from 'lucide-react';

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<{ username: string; role: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkAuth() {
      try {
        const res = await fetch('/api/auth/me');
        const data = await res.json();
        if (data.setupRequired) {
          router.push('/setup');
        } else if (data.user) {
          setUser(data.user);
        } else {
          setUser(null);
        }
      } catch (err) {
        console.error('Error checking auth', err);
      } finally {
        setLoading(false);
      }
    }
    checkAuth();
  }, [pathname, router]);

  const handleLogout = async () => {
    try {
      const res = await fetch('/api/auth/logout', { method: 'POST' });
      if (res.ok) {
        setUser(null);
        router.push('/login');
      }
    } catch (err) {
      console.error('Error logging out', err);
    }
  };

  return (
    <header className="navbar">
      <div className="navbar-brand">
        <Link href="/" style={{ color: 'inherit', textDecoration: 'none' }}>
          <h1 className="navbar-title">Venkata Srinivasa Kirana and General Merchant</h1>
          <span className="navbar-subtitle">చుండూరి సత్యం గారి షాప్</span>
        </Link>
      </div>

      <nav className="navbar-menu">
        <Link href="/" className={`nav-link ${pathname === '/' ? 'active' : ''}`}>
          <LayoutDashboard size={18} />
          <span>Home</span>
        </Link>
        
        <Link href="/billing" className={`nav-link ${pathname === '/billing' ? 'active' : ''}`}>
          <ShoppingBag size={18} />
          <span>Billing</span>
        </Link>

        <Link href="/inventory" className={`nav-link ${pathname === '/inventory' ? 'active' : ''}`}>
          <ClipboardList size={18} />
          <span>Inventory</span>
        </Link>

        {user ? (
          <>
            <Link href="/admin" className={`nav-link ${pathname === '/admin' ? 'active' : ''}`}>
              <User size={18} />
              <span>Admin ({user.username})</span>
            </Link>
            <button onClick={handleLogout} className="nav-link" style={{ background: 'none', border: 'none', cursor: 'pointer', font: 'inherit' }}>
              <LogOut size={18} />
              <span>Logout</span>
            </button>
          </>
        ) : (
          <Link href="/login" className={`nav-link ${pathname === '/login' ? 'active' : ''}`}>
            <Key size={18} />
            <span>Admin Login</span>
          </Link>
        )}
      </nav>
    </header>
  );
}
