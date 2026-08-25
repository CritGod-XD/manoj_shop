'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '../components/Navbar';
import { 
  Plus, 
  Edit3, 
  Trash2, 
  Upload, 
  Search, 
  AlertTriangle, 
  Check, 
  ArrowUp, 
  ArrowDown, 
  ChevronRight,
  X 
} from 'lucide-react';

interface Item {
  id: number;
  code: string | null;
  name: string;
  price: number;
  quantity: number;
  unit: string;
  category: string;
}

interface UploadSummary {
  totalRows: number;
  updatesCount: number;
  additionsCount: number;
  noChangeCount: number;
  pricesIncreased: number;
  pricesDecreased: number;
}

interface UploadPreviewItem extends Item {
  originalPrice?: number;
  originalQuantity?: number;
  originalUnit?: string;
  originalCategory?: string;
  status: 'update' | 'addition' | 'no_change';
}

export default function InventoryPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [items, setItems] = useState<Item[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  // Manual Add/Edit Form State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
  const [currentItemId, setCurrentItemId] = useState<number | null>(null);
  const [formName, setFormName] = useState('');
  const [formPrice, setFormPrice] = useState('');
  const [formQty, setFormQty] = useState('');
  const [formUnit, setFormUnit] = useState('pcs');
  const [formCategory, setFormCategory] = useState('');
  const [formCode, setFormCode] = useState('');
  const [formError, setFormError] = useState('');
  const [formSaving, setFormSaving] = useState(false);

  // Excel Upload State
  const [activeTab, setActiveTab] = useState<'list' | 'upload'>('list');
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [uploadPreview, setUploadPreview] = useState<{
    summary: UploadSummary;
    items: UploadPreviewItem[];
  } | null>(null);
  const [commitLoading, setCommitLoading] = useState(false);

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
          fetchInventory();
        }
      } catch (err) {
        router.push('/login');
      }
    }
    checkAuth();
  }, [router]);

  async function fetchInventory() {
    setLoading(true);
    try {
      const res = await fetch(`/api/inventory?q=${search}`);
      if (res.ok) {
        const data = await res.json();
        setItems(data.items);
      }
    } catch (err) {
      console.error('Error fetching inventory', err);
    } finally {
      setLoading(false);
    }
  }

  // Trigger search when typing
  useEffect(() => {
    if (isAdmin) {
      const delayDebounce = setTimeout(() => {
        fetchInventory();
      }, 300);
      return () => clearTimeout(delayDebounce);
    }
  }, [search, isAdmin]);

  // Modal Handlers
  const openAddModal = () => {
    setModalMode('add');
    setCurrentItemId(null);
    setFormName('');
    setFormPrice('');
    setFormQty('');
    setFormUnit('pcs');
    setFormCategory('');
    setFormCode('');
    setFormError('');
    setIsModalOpen(true);
  };

  const openEditModal = (item: Item) => {
    setModalMode('edit');
    setCurrentItemId(item.id);
    setFormName(item.name);
    setFormPrice(item.price.toString());
    setFormQty(item.quantity.toString());
    setFormUnit(item.unit);
    setFormCategory(item.category);
    setFormCode(item.code || '');
    setFormError('');
    setIsModalOpen(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setFormSaving(true);

    const payload = {
      name: formName,
      price: parseFloat(formPrice),
      quantity: parseFloat(formQty),
      unit: formUnit,
      category: formCategory,
      code: formCode || null,
    };

    try {
      const url = modalMode === 'add' ? '/api/inventory' : `/api/inventory/${currentItemId}`;
      const method = modalMode === 'add' ? 'POST' : 'PUT';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (res.ok) {
        setIsModalOpen(false);
        fetchInventory();
      } else {
        setFormError(data.error || 'Failed to save item');
      }
    } catch (err) {
      setFormError('Connection error. Please try again.');
    } finally {
      setFormSaving(false);
    }
  };

  const handleDeleteItem = async (item: Item) => {
    if (confirm(`Are you sure you want to delete "${item.name}"?`)) {
      try {
        const res = await fetch(`/api/inventory/${item.id}`, { method: 'DELETE' });
        if (res.ok) {
          fetchInventory();
        } else {
          const data = await res.json();
          alert(data.error || 'Failed to delete item');
        }
      } catch (err) {
        alert('Connection error');
      }
    }
  };

  // Excel Upload Handlers
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setUploadFile(file);
      setUploadPreview(null);
      setUploadLoading(true);

      const formData = new FormData();
      formData.append('file', file);

      try {
        const res = await fetch('/api/inventory/upload/preview', {
          method: 'POST',
          body: formData,
        });

        const data = await res.json();

        if (res.ok) {
          setUploadPreview(data);
        } else {
          alert(data.error || 'Failed to parse Excel file');
        }
      } catch (err) {
        alert('Upload failed. Please try again.');
      } finally {
        setUploadLoading(false);
      }
    }
  };

  const handleLoadDemoFile = async () => {
    setUploadLoading(true);
    setUploadPreview(null);
    setUploadFile(null);
    try {
      const res = await fetch('/api/inventory/upload/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sample: true }),
      });

      const data = await res.json();

      if (res.ok) {
        setUploadPreview(data);
        // Set a mock file name to show in the UI
        setUploadFile(new File([], 'sample_inventory.xlsx'));
      } else {
        alert(data.error || 'Failed to load demo sample file');
      }
    } catch (err) {
      alert('Network error while loading demo file.');
    } finally {
      setUploadLoading(false);
    }
  };

  const handleCommitUpload = async () => {
    if (!uploadPreview) return;

    setCommitLoading(true);
    try {
      const res = await fetch('/api/inventory/upload/commit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: uploadPreview.items }),
      });

      const data = await res.json();

      if (res.ok) {
        alert('Stock uploaded and committed successfully!');
        setUploadPreview(null);
        setUploadFile(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
        setActiveTab('list');
        fetchInventory();
      } else {
        alert(data.error || 'Failed to commit updates');
      }
    } catch (err) {
      alert('Network error during commit.');
    } finally {
      setCommitLoading(false);
    }
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
            <h2 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Inventory Management</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              Add, update, or search items manually, or upload spreadsheets.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              onClick={() => setActiveTab('list')}
              className={`btn ${activeTab === 'list' ? 'btn-primary' : 'btn-outline'}`}
            >
              Stock List
            </button>
            <button
              onClick={() => setActiveTab('upload')}
              className={`btn ${activeTab === 'upload' ? 'btn-primary' : 'btn-outline'}`}
            >
              Excel Bulk Update
            </button>
          </div>
        </div>

        {activeTab === 'list' ? (
          /* Inventory Table list tab */
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', marginBottom: '1.5rem' }}>
              <div style={{ position: 'relative', flex: 1, maxWidth: '400px' }}>
                <Search size={18} style={{ position: 'absolute', left: '10px', top: '10px', color: 'var(--text-light)' }} />
                <input
                  type="text"
                  className="form-control"
                  placeholder="Search stock by name or barcode..."
                  style={{ paddingLeft: '34px' }}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <button onClick={openAddModal} className="btn btn-secondary">
                <Plus size={18} />
                <span>Add New Item</span>
              </button>
            </div>

            {loading ? (
              <p style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>Loading inventory...</p>
            ) : items.length === 0 ? (
              <p style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>No items found in stock.</p>
            ) : (
              <div className="table-responsive">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Barcode</th>
                      <th>Item Name</th>
                      <th>Category</th>
                      <th style={{ textAlign: 'right' }}>Price</th>
                      <th style={{ textAlign: 'right' }}>Stock Quantity</th>
                      <th>Unit</th>
                      <th style={{ textAlign: 'center' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item) => (
                      <tr key={item.id}>
                        <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem' }}>{item.code || '-'}</td>
                        <td style={{ fontWeight: 600 }}>{item.name}</td>
                        <td>
                          <span className="badge badge-success" style={{ backgroundColor: 'var(--primary-light)', color: 'var(--primary-color)' }}>
                            {item.category}
                          </span>
                        </td>
                        <td style={{ textAlign: 'right', fontWeight: 600 }}>₹{(item.price || 0).toFixed(2)}</td>
                        <td style={{ textAlign: 'right', fontWeight: 600 }}>
                          <span className={`badge ${(item.quantity || 0) <= 10 ? ((item.quantity || 0) <= 0 ? 'badge-danger' : 'badge-warning') : 'badge-success'}`}>
                            {(item.quantity || 0).toFixed(2)}
                          </span>
                        </td>
                        <td style={{ color: 'var(--text-muted)' }}>{item.unit}</td>
                        <td style={{ textAlign: 'center' }}>
                          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                            <button onClick={() => openEditModal(item)} className="btn btn-outline" style={{ padding: '0.25rem 0.5rem' }}>
                              <Edit3 size={14} />
                            </button>
                            <button onClick={() => handleDeleteItem(item)} className="btn btn-outline" style={{ padding: '0.25rem 0.5rem', color: 'var(--danger)' }}>
                              <Trash2 size={14} />
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
          /* Excel Bulk Upload tab */
          <div className="card">
            <div style={{ border: '2px dashed var(--border-color)', borderRadius: 'var(--radius)', padding: '2rem', textAlign: 'center', marginBottom: '1.5rem', backgroundColor: 'var(--background-color)' }}>
              <Upload size={48} style={{ color: 'var(--text-light)', marginBottom: '1rem' }} />
              <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '0.5rem' }}>Upload Stock Spreadsheet</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
                Supported formats: `.xlsx`, `.xls`. Spreadsheets are matched by item name/barcode.
              </p>
              
              <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', alignItems: 'center' }}>
                <input
                  type="file"
                  accept=".xlsx, .xls"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  style={{ display: 'none' }}
                />
                <button onClick={() => fileInputRef.current?.click()} className="btn btn-outline">
                  Select File
                </button>
                <button 
                  onClick={handleLoadDemoFile} 
                  className="btn btn-outline"
                  style={{ borderColor: 'var(--secondary-color)', color: 'var(--secondary-color)' }}
                  disabled={uploadLoading}
                >
                  Load Demo Sample File
                </button>
                {uploadFile && (
                  <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>
                    {uploadFile.name} ({(uploadFile.size / 1024).toFixed(1)} KB)
                  </span>
                )}
              </div>

              {uploadLoading && (
                <div style={{ marginTop: '1.5rem', color: 'var(--primary-color)', fontWeight: '600' }}>
                  Processing spreadsheet file... Please wait...
                </div>
              )}
            </div>

            {/* Changes Preview Section */}
            {uploadPreview && (
              <div style={{ marginTop: '2rem' }}>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
                  Bulk Import Preview
                </h3>

                {/* Summary boxes */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
                  <div className="stat-card" style={{ padding: '0.75rem 1rem' }}>
                    <div style={{ fontSize: '1.25rem', fontWeight: 700 }}>{uploadPreview.summary.updatesCount}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Items to Update</div>
                  </div>
                  <div className="stat-card" style={{ padding: '0.75rem 1rem' }}>
                    <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--success)' }}>{uploadPreview.summary.additionsCount}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>New Items to Add</div>
                  </div>
                  <div className="stat-card" style={{ padding: '0.75rem 1rem' }}>
                    <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--secondary-color)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      <ArrowUp size={16} /> {uploadPreview.summary.pricesIncreased}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Prices Increased</div>
                  </div>
                  <div className="stat-card" style={{ padding: '0.75rem 1rem' }}>
                    <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--danger)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      <ArrowDown size={16} /> {uploadPreview.summary.pricesDecreased}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Prices Decreased</div>
                  </div>
                </div>

                {/* Details Table */}
                <div className="table-responsive" style={{ maxHeight: '400px', overflowY: 'auto', marginBottom: '1.5rem', border: '1px solid var(--border-color)', borderRadius: 'var(--radius)' }}>
                  <table className="table">
                    <thead style={{ position: 'sticky', top: 0, zIndex: 1 }}>
                      <tr>
                        <th>Status</th>
                        <th>Item Name</th>
                        <th>Category</th>
                        <th style={{ textAlign: 'right' }}>Price (Prev → New)</th>
                        <th style={{ textAlign: 'right' }}>Quantity (Prev → New)</th>
                        <th>Unit</th>
                      </tr>
                    </thead>
                    <tbody>
                      {uploadPreview.items
                        .filter(i => i.status !== 'no_change')
                        .map((item, idx) => {
                          const currentPrice = item.price || 0;
                          const currentQty = item.quantity || 0;
                          const origPrice = item.originalPrice || 0;
                          const origQty = item.originalQuantity || 0;
                          const priceChanged = item.originalPrice !== undefined && Math.abs(currentPrice - origPrice) > 0.001;
                          const qtyChanged = item.originalQuantity !== undefined && Math.abs(currentQty - origQty) > 0.001;
                          
                          return (
                            <tr key={idx}>
                              <td>
                                <span className={`badge ${item.status === 'addition' ? 'badge-success' : 'badge-warning'}`}>
                                  {item.status === 'addition' ? 'NEW' : 'UPDATE'}
                                </span>
                              </td>
                              <td style={{ fontWeight: 600 }}>{item.name}</td>
                              <td>{item.category}</td>
                              <td style={{ textAlign: 'right', fontWeight: 600 }}>
                                {priceChanged ? (
                                  <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.25rem' }}>
                                    <span style={{ textDecoration: 'line-through', color: 'var(--text-light)', fontSize: '0.8rem' }}>
                                      ₹{origPrice.toFixed(2)}
                                    </span>
                                    <ChevronRight size={12} style={{ color: 'var(--text-light)' }} />
                                    <span style={{ color: currentPrice > origPrice ? 'var(--success)' : 'var(--danger)' }}>
                                      ₹{currentPrice.toFixed(2)}
                                    </span>
                                  </span>
                                ) : (
                                  <span>₹{currentPrice.toFixed(2)}</span>
                                )}
                              </td>
                              <td style={{ textAlign: 'right' }}>
                                {qtyChanged ? (
                                  <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.25rem' }}>
                                    <span style={{ textDecoration: 'line-through', color: 'var(--text-light)', fontSize: '0.8rem' }}>
                                      {origQty.toFixed(1)}
                                    </span>
                                    <ChevronRight size={12} style={{ color: 'var(--text-light)' }} />
                                    <span>{currentQty.toFixed(1)}</span>
                                  </span>
                                ) : (
                                  <span>{currentQty.toFixed(1)}</span>
                                )}
                              </td>
                              <td>{item.unit}</td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                  <button
                    onClick={() => { setUploadPreview(null); setUploadFile(null); if (fileInputRef.current) fileInputRef.current.value = ''; }}
                    className="btn btn-outline"
                    disabled={commitLoading}
                  >
                    Cancel Upload
                  </button>
                  <button
                    onClick={handleCommitUpload}
                    className="btn btn-primary"
                    disabled={commitLoading}
                  >
                    {commitLoading ? 'Committing Changes...' : 'Confirm & Commit to Database'}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Manual Item Add/Edit Modal */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>
                {modalMode === 'add' ? 'Add New Product' : 'Edit Product Details'}
              </h3>
              <button 
                onClick={() => setIsModalOpen(false)} 
                style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
              >
                <X size={20} />
              </button>
            </div>

            {formError && (
              <div style={{ color: 'var(--danger)', fontSize: '0.85rem', marginBottom: '1rem', fontWeight: '500' }}>
                {formError}
              </div>
            )}

            <form onSubmit={handleFormSubmit}>
              <div className="form-group">
                <label className="form-label">Barcode / Item Code (Optional)</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Scan or enter code"
                  value={formCode}
                  onChange={(e) => setFormCode(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Item Name *</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. Sugar 1kg"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Price (₹) *</label>
                  <input
                    type="number"
                    step="any"
                    className="form-control"
                    placeholder="0.00"
                    value={formPrice}
                    onChange={(e) => setFormPrice(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Stock Quantity *</label>
                  <input
                    type="number"
                    step="any"
                    className="form-control"
                    placeholder="0"
                    value={formQty}
                    onChange={(e) => setFormQty(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Unit *</label>
                  <select
                    className="form-control"
                    value={formUnit}
                    onChange={(e) => setFormUnit(e.target.value)}
                    required
                  >
                    <option value="pcs">pcs (Pieces)</option>
                    <option value="kg">kg (Kilograms)</option>
                    <option value="litre">litre (Litres)</option>
                    <option value="packet">packet (Packets)</option>
                    <option value="box">box (Boxes)</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Category *</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. Staples, Snacks"
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1.5rem' }}>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="btn btn-outline"
                  disabled={formSaving}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={formSaving}
                >
                  {formSaving ? 'Saving...' : 'Save Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
