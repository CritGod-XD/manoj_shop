'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from './components/Navbar';
import { 
  TrendingUp, 
  Receipt, 
  Layers, 
  AlertTriangle, 
  ArrowRight,
  ClipboardList
} from 'lucide-react';

interface DashboardData {
  todaySales: number;
  todayBillCount: number;
  totalItems: number;
  lowStockCount: number;
  recentBills: Array<{
    id: number;
    bill_number: string;
    date: string;
    day_of_week: string;
    total_amount: number;
    total_items: number;
  }>;
  lowStockItems: Array<{
    id: number;
    name: string;
    quantity: number;
    unit: string;
    price: number;
  }>;
}

export default function DashboardPage() {
  const router = useRouter();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        const authRes = await fetch('/api/auth/me');
        const authData = await authRes.json();
        
        if (authData.setupRequired) {
          router.push('/setup');
          return;
        }

        if (!authData.user) {
          // If not logged in, redirect directly to staff billing screen
          router.push('/billing');
          return;
        }

        const statsRes = await fetch('/api/reports/dashboard');
        if (statsRes.ok) {
          const statsData = await statsRes.json();
          setData(statsData);
        } else {
          router.push('/login');
        }
      } catch (err) {
        console.error('Error fetching dashboard data', err);
      } finally {
        setLoading(false);
      }
    }

    fetchStats();
  }, [router]);

  if (loading) {
    return (
      <div className="app-container">
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', flexDirection: 'column' }}>
          <p style={{ fontWeight: 600 }}>Loading Dashboard...</p>
        </div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="app-container">
      <Navbar />
      <main className="main-content">
        <div style={{ marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700 }}>POS Dashboard</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Daily store statistics and inventory status.
          </p>
        </div>

        {/* Stats Cards */}
        <div className="dashboard-grid">
          <div className="stat-card">
            <div className="stat-icon" style={{ backgroundColor: 'rgba(25, 135, 84, 0.1)', color: 'var(--success)' }}>
              <TrendingUp size={24} />
            </div>
            <div className="stat-info">
              <span className="stat-label">Today's Sales</span>
              <span className="stat-value">₹{data.todaySales.toFixed(2)}</span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon" style={{ backgroundColor: 'var(--primary-light)', color: 'var(--primary-color)' }}>
              <Receipt size={24} />
            </div>
            <div className="stat-info">
              <span className="stat-label">Today's Bills</span>
              <span className="stat-value">{data.todayBillCount}</span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon" style={{ backgroundColor: 'var(--secondary-light)', color: 'var(--secondary-color)' }}>
              <Layers size={24} />
            </div>
            <div className="stat-info">
              <span className="stat-label">Total Unique Products</span>
              <span className="stat-value">{data.totalItems}</span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon" style={{ backgroundColor: data.lowStockCount > 0 ? 'rgba(220, 53, 69, 0.1)' : 'var(--primary-light)', color: data.lowStockCount > 0 ? 'var(--danger)' : 'var(--success)' }}>
              <AlertTriangle size={24} />
            </div>
            <div className="stat-info">
              <span className="stat-label">Low Stock Items</span>
              <span className="stat-value">{data.lowStockCount}</span>
            </div>
          </div>
        </div>

        {/* Dashboard Sections */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '1.5rem' }}>
          
          {/* Recent Bills */}
          <div className="card" style={{ marginBottom: 0 }}>
            <div className="card-header">
              <h3 className="card-title">Recent Transactions</h3>
              <button onClick={() => router.push('/admin')} className="btn btn-outline" style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem' }}>
                View All <ArrowRight size={14} />
              </button>
            </div>
            {data.recentBills.length === 0 ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                No bills printed today.
              </div>
            ) : (
              <div className="table-responsive">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Bill No.</th>
                      <th>Date / Day</th>
                      <th>Items</th>
                      <th style={{ textAlign: 'right' }}>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.recentBills.map((bill) => (
                      <tr key={bill.id}>
                        <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{bill.bill_number}</td>
                        <td>{bill.date} ({bill.day_of_week})</td>
                        <td>{bill.total_items} items</td>
                        <td style={{ textAlign: 'right', fontWeight: 600 }}>₹{bill.total_amount.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Low Stock Alerts */}
          <div className="card" style={{ marginBottom: 0 }}>
            <div className="card-header">
              <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <AlertTriangle size={18} style={{ color: data.lowStockCount > 0 ? 'var(--danger)' : 'var(--success)' }} />
                <span>Low Stock Warnings</span>
              </h3>
              <button onClick={() => router.push('/inventory')} className="btn btn-outline" style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem' }}>
                Manage Stock
              </button>
            </div>
            {data.lowStockItems.length === 0 ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--success)', fontWeight: 500 }}>
                All inventory quantities are healthy!
              </div>
            ) : (
              <div className="table-responsive">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Item Name</th>
                      <th style={{ textAlign: 'right' }}>Price</th>
                      <th style={{ textAlign: 'right' }}>Stock Left</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.lowStockItems.map((item) => (
                      <tr key={item.id}>
                        <td style={{ fontWeight: 500 }}>{item.name}</td>
                        <td style={{ textAlign: 'right' }}>₹{item.price.toFixed(2)}</td>
                        <td style={{ textAlign: 'right' }}>
                          <span className={`badge ${item.quantity <= 0 ? 'badge-danger' : 'badge-warning'}`}>
                            {item.quantity} {item.unit}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </div>
      </main>
    </div>
  );
}
