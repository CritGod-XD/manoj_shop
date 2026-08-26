'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '../components/Navbar';
import html2canvas from 'html2canvas';
import { 
  History, 
  UserPlus, 
  Printer, 
  Eye, 
  Search, 
  Calendar, 
  X,
  UserCheck,
  Download
} from 'lucide-react';

interface BillItem {
  id: number;
  item_name: string;
  quantity: number;
  price: number;
  unit: string;
  item_total: number;
}

interface Bill {
  id: number;
  bill_number: string;
  date: string;
  day_of_week: string;
  total_amount: number;
  total_items: number;
  items?: BillItem[];
}

interface AdminUser {
  id: number;
  username: string;
  role: string;
  created_at: string;
}

export default function AdminPage() {
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);
  const [activeTab, setActiveTab] = useState<'sales' | 'users'>('sales');

  // Sales History State
  const [bills, setBills] = useState<Bill[]>([]);
  const [searchBillNum, setSearchBillNum] = useState('');
  const [searchDate, setSearchDate] = useState('');
  const [billsLoading, setBillsLoading] = useState(true);
  const [selectedBill, setSelectedBill] = useState<Bill | null>(null);

  // Accounts Management State
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [userError, setUserError] = useState('');
  const [userSuccess, setUserSuccess] = useState('');
  const [userLoading, setUserLoading] = useState(false);

  // Reprint State
  const [reprintBill, setReprintBill] = useState<Bill | null>(null);

  useEffect(() => {
    async function checkAuth() {
      try {
        const res = await fetch('/api/auth/me');
        const data = await res.json();
        if (data.setupRequired) {
          router.push('/setup');
          return;
        }
        if (!data.user || data.user.role !== 'admin') {
          router.push('/login');
        } else {
          setIsAdmin(true);
          fetchBills();
          fetchUsers();
        }
      } catch (err) {
        router.push('/login');
      }
    }
    checkAuth();
  }, [router]);

  async function fetchBills() {
    setBillsLoading(true);
    try {
      const query = new URLSearchParams();
      if (searchBillNum) query.append('q', searchBillNum);
      if (searchDate) {
        // Format HTML Date Picker YYYY-MM-DD to DD-MM-YYYY
        const parts = searchDate.split('-');
        if (parts.length === 3) {
          query.append('date', `${parts[2]}-${parts[1]}-${parts[0]}`);
        }
      }

      const res = await fetch(`/api/bills?${query.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setBills(data.bills);
      }
    } catch (err) {
      console.error('Error fetching bills', err);
    } finally {
      setBillsLoading(false);
    }
  }

  async function fetchUsers() {
    try {
      const res = await fetch('/api/auth/users');
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users);
      }
    } catch (err) {
      console.error('Error fetching users', err);
    }
  }

  // Trigger search on bill criteria change
  useEffect(() => {
    if (isAdmin) {
      fetchBills();
    }
  }, [searchBillNum, searchDate, isAdmin]);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setUserError('');
    setUserSuccess('');
    setUserLoading(true);

    try {
      const res = await fetch('/api/auth/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: newUsername, password: newPassword }),
      });

      const data = await res.json();

      if (res.ok) {
        setUserSuccess(`Secondary admin account "${newUsername}" created successfully!`);
        setNewUsername('');
        setNewPassword('');
        fetchUsers();
      } else {
        setUserError(data.error || 'Failed to create user');
      }
    } catch (err) {
      setUserError('Network error');
    } finally {
      setUserLoading(false);
    }
  };

  const handleReprint = (bill: Bill) => {
    setReprintBill(bill);
    setTimeout(() => {
      window.print();
      setReprintBill(null);
    }, 300);
  };

  const downloadReprintAsImage = async (bill: Bill) => {
    setReprintBill(bill);
    
    // Wait for state update to render receipt-print-area in the DOM
    setTimeout(async () => {
      const element = document.getElementById('receipt-print-area');
      if (!element) return;

      try {
        const clone = element.cloneNode(true) as HTMLElement;
        clone.style.display = 'flex';
        clone.style.flexDirection = 'column';
        clone.style.justifyContent = 'space-between';
        clone.style.position = 'fixed';
        clone.style.left = '-9999px';
        clone.style.top = '0';
        clone.style.width = '1152px'; // exactly 1152px width
        clone.style.height = '1536px'; // exactly 1536px height (3:4 aspect)
        clone.style.fontSize = '36px'; // 50% larger font size for 1152px base width
        clone.style.backgroundColor = '#fff';
        clone.style.padding = '40px';
        clone.style.boxSizing = 'border-box';
        clone.style.overflow = 'hidden';

        // Ensure the inner container fills the clone height
        const container = clone.querySelector('.a4-invoice-container') as HTMLElement;
        if (container) {
          container.style.height = '100%';
          container.style.display = 'flex';
          container.style.flexDirection = 'column';
          container.style.justifyContent = 'space-between';
          container.style.boxSizing = 'border-box';
        }

        document.body.appendChild(clone);

        const canvas = await html2canvas(clone, {
          scale: 1, // exact 1:1 pixel match
          width: 1152,
          height: 1536,
          backgroundColor: '#ffffff',
          logging: false,
        });

        document.body.removeChild(clone);

        canvas.toBlob((blob) => {
          if (blob) {
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.download = `Receipt_${bill.bill_number || 'bill'}.png`;
            link.href = url;
            link.click();
            setTimeout(() => URL.revokeObjectURL(url), 100);
          }
        }, 'image/png');
      } catch (error) {
        console.error('Error generating image:', error);
        alert('Failed to generate receipt image');
      } finally {
        setReprintBill(null);
      }
    }, 300);
  };

  // Helper for formatting monospace lines
  const getReceiptLine = (name: string, quantity: number, price: number): string => {
    const nameLimit = 14;
    const qtyRateLimit = 10;
    const priceLimit = 8;

    const formattedName = name.substring(0, nameLimit).padEnd(nameLimit, ' ');
    const qtyRate = `${quantity} x ${price.toFixed(2)}`;
    const formattedQty = qtyRate.substring(0, qtyRateLimit).padStart(qtyRateLimit, ' ');
    const itemTotal = (quantity * price).toFixed(2);
    const formattedPrice = itemTotal.substring(0, priceLimit).padStart(priceLimit, ' ');
    
    return `${formattedName}${formattedQty}${formattedPrice}`;
  };

  if (!isAdmin) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <p>Verifying access...</p>
      </div>
    );
  }

  return (
    <div className="app-container">
      <Navbar />
      <main className="main-content">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Admin Panel</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              Review past store transactions and manage secondary admin credentials.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              onClick={() => setActiveTab('sales')}
              className={`btn ${activeTab === 'sales' ? 'btn-primary' : 'btn-outline'}`}
            >
              Sales History
            </button>
            <button
              onClick={() => setActiveTab('users')}
              className={`btn ${activeTab === 'users' ? 'btn-primary' : 'btn-outline'}`}
            >
              Admin Accounts
            </button>
          </div>
        </div>

        {activeTab === 'sales' ? (
          /* Sales History Tab */
          <div className="card">
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
              <div style={{ position: 'relative', flex: 1, minWidth: '240px', maxWidth: '360px' }}>
                <Search size={18} style={{ position: 'absolute', left: '10px', top: '10px', color: 'var(--text-light)' }} />
                <input
                  type="text"
                  className="form-control"
                  placeholder="Search by Bill Number (e.g. 000001)..."
                  style={{ paddingLeft: '34px' }}
                  value={searchBillNum}
                  onChange={(e) => setSearchBillNum(e.target.value)}
                />
              </div>

              <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Calendar size={18} style={{ color: 'var(--text-light)' }} />
                <input
                  type="date"
                  className="form-control"
                  value={searchDate}
                  onChange={(e) => setSearchDate(e.target.value)}
                  style={{ width: '180px' }}
                />
                {searchDate && (
                  <button 
                    onClick={() => setSearchDate('')}
                    className="btn btn-outline"
                    style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem' }}
                  >
                    Clear Date
                  </button>
                )}
              </div>
            </div>

            {billsLoading ? (
              <p style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>Loading transaction logs...</p>
            ) : bills.length === 0 ? (
              <p style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>No receipts recorded matching criteria.</p>
            ) : (
              <div className="table-responsive">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Bill Number</th>
                      <th>Date</th>
                      <th>Day</th>
                      <th>Total Items</th>
                      <th style={{ textAlign: 'right' }}>Total Amount</th>
                      <th style={{ textAlign: 'center' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bills.map((bill) => (
                      <tr key={bill.id}>
                        <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{bill.bill_number}</td>
                        <td>{bill.date}</td>
                        <td>{bill.day_of_week}</td>
                        <td>{bill.total_items} product lines</td>
                        <td style={{ textAlign: 'right', fontWeight: 600 }}>{bill.total_amount.toFixed(2)}</td>
                        <td style={{ textAlign: 'center' }}>
                          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                            <button 
                              onClick={() => setSelectedBill(bill)} 
                              className="btn btn-outline" 
                              style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem' }}
                              title="View Items"
                            >
                              <Eye size={14} />
                            </button>
                            <button 
                              onClick={() => handleReprint(bill)} 
                              className="btn btn-outline" 
                              style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem' }}
                              title="Reprint Receipt"
                            >
                              <Printer size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ) : (
          /* Accounts management tab */
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '1.5rem' }}>
            
            {/* Create new account form */}
            <div className="card">
              <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
                <UserPlus size={18} style={{ color: 'var(--primary-color)' }} />
                <span>Create Secondary Admin</span>
              </h3>

              {userError && (
                <div style={{ color: 'var(--danger)', fontSize: '0.85rem', marginBottom: '1rem', fontWeight: 500 }}>
                  {userError}
                </div>
              )}
              {userSuccess && (
                <div style={{ color: 'var(--success)', fontSize: '0.85rem', marginBottom: '1rem', fontWeight: 600 }}>
                  {userSuccess}
                </div>
              )}

              <form onSubmit={handleCreateUser}>
                <div className="form-group">
                  <label className="form-label">Username</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Enter secondary username"
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Password</label>
                  <input
                    type="password"
                    className="form-control"
                    placeholder="Enter password (min 6 chars)"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                  />
                </div>

                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ width: '100%', marginTop: '0.5rem' }}
                  disabled={userLoading}
                >
                  {userLoading ? 'Creating User...' : 'Create Account'}
                </button>
              </form>
            </div>

            {/* List of active admin accounts */}
            <div className="card">
              <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
                <UserCheck size={18} style={{ color: 'var(--primary-color)' }} />
                <span>Active Admins</span>
              </h3>

              <div className="table-responsive">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Username</th>
                      <th>Role</th>
                      <th>Created On</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u) => (
                      <tr key={u.id}>
                        <td style={{ fontWeight: 600 }}>{u.username}</td>
                        <td>
                          <span className="badge badge-success" style={{ backgroundColor: 'var(--primary-light)', color: 'var(--primary-color)' }}>
                            {u.role}
                          </span>
                        </td>
                        <td style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                          {new Date(u.created_at).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}
      </main>

      {/* Bill View Detail Modal */}
      {selectedBill && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '480px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>
                Bill No: {selectedBill.bill_number} Details
              </h3>
              <button 
                onClick={() => setSelectedBill(null)} 
                style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ marginBottom: '1.25rem', fontSize: '0.9rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>Date:</span>
                <span style={{ fontWeight: 600 }}>{selectedBill.date} ({selectedBill.day_of_week})</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Grand Total:</span>
                <span style={{ fontWeight: 800, color: 'var(--primary-color)' }}>{selectedBill.total_amount.toFixed(2)}</span>
              </div>
            </div>

            <div className="table-responsive" style={{ border: '1px solid var(--border-color)', borderRadius: 'var(--radius)', maxHeight: '240px', overflowY: 'auto' }}>
              <table className="table" style={{ fontSize: '0.85rem' }}>
                <thead>
                  <tr>
                    <th>Item Name</th>
                    <th>Quantity</th>
                    <th style={{ textAlign: 'right' }}>Unit Price</th>
                    <th style={{ textAlign: 'right' }}>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedBill.items?.map((item) => (
                    <tr key={item.id}>
                      <td style={{ fontWeight: 600 }}>{item.item_name}</td>
                      <td>{item.quantity} {item.unit}</td>
                      <td style={{ textAlign: 'right' }}>{item.price.toFixed(2)}</td>
                      <td style={{ textAlign: 'right', fontWeight: 600 }}>{item.item_total.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1.5rem' }}>
              <button
                onClick={() => setSelectedBill(null)}
                className="btn btn-outline"
              >
                Close
              </button>
              <button
                onClick={() => { downloadReprintAsImage(selectedBill); setSelectedBill(null); }}
                className="btn btn-secondary"
              >
                <Download size={16} />
                <span>Download Image</span>
              </button>
              <button
                onClick={() => { handleReprint(selectedBill); setSelectedBill(null); }}
                className="btn btn-primary"
              >
                <Printer size={16} />
                <span>Reprint Receipt</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Hidden A4 Invoice Reprint Area */}
      {reprintBill && reprintBill.items && (
        <div id="receipt-print-area">
          <div className="a4-invoice-container">
            {/* Invoice Header */}
            <div className="invoice-header">
              <div className="invoice-brand">
                <h1 className="invoice-title">
                  Venkata Srinivasa Kirana and General Merchant
                </h1>
                <div className="invoice-subtitle">
                  చుండూరి సత్యం గారి షాప్
                </div>
                <div className="invoice-contact">
                  Chunduri Sivanarayana | Phone: 9246979013
                </div>
              </div>
              <div className="invoice-meta">
                <div className="invoice-type">Retail Bill</div>
                <div className="invoice-meta-item">
                  <span className="invoice-meta-label">Bill No: </span>
                  <span className="invoice-meta-val">{reprintBill.bill_number} (DUPLICATE)</span>
                </div>
                <div className="invoice-meta-item">
                  <span className="invoice-meta-label">Date: </span>
                  <span className="invoice-meta-val">{reprintBill.date}</span>
                </div>
                <div className="invoice-meta-item">
                  <span className="invoice-meta-label">Day: </span>
                  <span className="invoice-meta-val">{reprintBill.day_of_week}</span>
                </div>
              </div>
            </div>

            {/* Bill To Customer (Cash/Retail Customer) */}
            <div className="invoice-bill-to">
              <div className="invoice-bill-to-title">Billed To</div>
              <div className="invoice-bill-to-name">Cash / Retail Customer</div>
            </div>

            {/* Items Table */}
            <table className="invoice-table">
              <thead>
                <tr>
                  <th style={{ width: '50px' }} className="col-center">S.No</th>
                  <th>Item Name</th>
                  <th style={{ width: '120px' }} className="col-center">Qty</th>
                  <th style={{ width: '120px' }} className="col-right">Rate</th>
                  <th style={{ width: '130px' }} className="col-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                {reprintBill.items.map((item, idx) => {
                  const itemTotal = (item.quantity * item.price).toFixed(2);
                  return (
                    <tr key={idx}>
                      <td className="col-center">{idx + 1}</td>
                      <td style={{ fontWeight: 600 }}>{item.item_name}</td>
                      <td className="col-center">{item.quantity} {item.unit}</td>
                      <td className="col-right">{item.price.toFixed(2)}</td>
                      <td className="col-right" style={{ fontWeight: 600 }}>{itemTotal}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Invoice Summary */}
            <div className="invoice-summary-section">
              <div className="invoice-info-notes">
                <p style={{ fontWeight: 600, marginBottom: '0.25rem' }}>Notes / Terms:</p>
                <p>1. Goods once sold cannot be returned or exchanged.</p>
                <p>2. Please check items at the time of delivery.</p>
              </div>
              <div className="invoice-totals-box">
                <div className="invoice-totals-row">
                  <span>Total Items:</span>
                  <span style={{ fontWeight: 600 }}>{reprintBill.items.length}</span>
                </div>
                <div className="invoice-totals-row grand-total">
                  <span>Grand Total:</span>
                  <span className="invoice-totals-val">{reprintBill.total_amount.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="invoice-footer">
              <div className="invoice-footer-thanks">
                Thank You For Your Business!
              </div>
              <div>Please Visit Again</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
