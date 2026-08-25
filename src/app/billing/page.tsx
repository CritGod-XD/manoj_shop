'use client';

import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import html2canvas from 'html2canvas';
import { 
  Search, 
  Trash2, 
  Plus, 
  Minus, 
  ShoppingBag, 
  Printer, 
  X, 
  RefreshCw,
  CheckCircle,
  Download
} from 'lucide-react';

interface Item {
  id: number;
  code: string | null;
  name: string;
  price: number;
  quantity: number; // stock
  unit: string;
  category: string;
}

interface CartItem extends Item {
  cartQuantity: number;
}

interface FinalizedBill {
  billNumber: string;
  date: string;
  dayOfWeek: string;
  items: Array<{
    name: string;
    quantity: number;
    price: number;
    unit: string;
  }>;
  totalAmount: number;
}

const teluguDictionary: Record<string, string> = {
  "oil": "ఆయిల్",
  "tea": "టీ",
  "milk": "పాలు",
  "soap": "సబ్బు",
  "brush": "బ్రెష్",
  "liquid": "లిక్విడ్",
  "paste": "పేస్ట్",
  "past": "పేస్ట్",
  "shampoo": "షాంపూ",
  "powder": "పౌడర్",
  "masala": "మసాలా",
  "pencil": "పెన్సిల్",
  "gold": "గోల్డ్",
  "fresh": "ఫ్రెష్",
  "dark": "డార్క్",
  "chocolate": "చాక్లెట్",
  "cholacte": "చాక్లెట్",
  "biscuit": "బిస్కట్",
  "biscut": "బిస్కట్",
  "bis": "బిస్",
  "sugar": "చక్కెర",
  "salt": "ఉప్పు",
  "rice": "బియ్యం",
  "dal": "పప్పు",
  "water": "నీరు",
  "glass": "గ్లాస్",
  "bag": "బ్యాగ్",
  "book": "బుక్",
  "pen": "పెన్",
  "bottle": "బాటిల్",
  "bottils": "బాటిల్స్",
  "chicken": "చికెన్",
  "good": "గుడ్",
  "day": "డే",
  "tiger": "టైగర్",
  "coffee": "కాఫీ",
  "cofee": "కాఫీ",
  "coconut": "కొబ్బరి",
  "sweet": "స్వీట్",
  "hot": "హాట్",
  "chilli": "మిరపకాయ",
  "turmeric": "పసుపు",
  "ghee": "నెయ్యి",
  "butter": "వెన్న",
  "ginger": "అల్లం",
  "garlic": "వెల్లుల్లి",
  "onion": "ఉల్లిపాయ",
  "potato": "బంగాళాదుంప",
  "tomato": "టొమాటో",
  "lemon": "నిమ్మకాయ",
  "egg": "గుడ్డు",
  "bread": "బ్రెడ్",
  "bun": "బన్",
  "cake": "కేక్",
  "chips": "చిప్స్",
  "allam": "అల్లం",
  "karam": "కారం",
  "pooja": "పూజ",
  "bath": "బాత్",
  "hair": "హెయిర్",
  "children": "చిల్డ్రన్",
  "sensitive": "సెన్సిటివ్",
  "eclairs": "ఎక్లైర్స్",
  "eclars": "ఎక్లైర్స్",
  "silk": "సిల్క్",
  "natural": "నేచురల్",
  "strong": "స్ట్రాంగ్",
  "durbar": "దర్బార్",
  "nitya": "నిత్య",
  "athisaya": "అతిశయ",
  "dhoop": "ధూప్",
  "gandam": "గంధం",
  "dabbalu": "డబ్బాలు",
  "balapalu": "బలపాలు",
  "vidya": "విద్య",
  "good day": "గుడ్ డే",
  "general": "జనరల్",
  "merchant": "మర్చంట్",
  "store": "స్టోర్",
  "shop": "షాప్",
  "allout": "ఆలౌట్",
  "fan": "ఫ్యాన్",
  "mission": "మిషన్",
  "allwin": "ఆల్విన్",
  "amar": "అమర్",
  "ambica": "అంబిక",
  "amrutanjan": "అమృతాంజన్",
  "anchor": "యాంకర్",
  "gel": "జెల్",
  "apsara": "అప్సర",
  "arial": "ఏరియల్",
  "surf": "సర్ఫ్",
  "ashoka": "అశోక",
  "aswini": "అశ్విని",
  "badam": "బాదాం",
  "papidi": "పాపిడి",
  "barest": "బారెస్ట్",
  "burest": "బ్యూరెస్ట్",
  "big": "బిగ్",
  "babool": "బబూల్",
  "black": "బ్లాక్",
  "rose": "రోజ్",
  "bleaching": "బ్లీచింగ్",
  "boondi": "బూంది",
  "chakka": "చక్క",
  "boost": "బూస్ట్",
  "boro": "బోరో",
  "plus": "ప్లస్",
  "brita": "బ్రిటా",
  "britania": "బ్రిటానియా",
  "marieligold": "మారీగోల్డ్",
  "mariegold": "మారీగోల్డ్",
  "marri": "మర్రి",
  "bikes": "బైక్స్",
  "chocolush": "చోకోలష్",
  "bru": "బ్రూ",
  "buds": "బడ్స్",
  "bulugu": "బులుగు",
  "butterfun": "బటర్‌ఫన్",
  "winkies": "వింకీస్",
  "center": "సెంటర్",
  "fruit": "ఫ్రూట్",
  "centiwin": "సెంటివిన్",
  "centwin": "సెంటివిన్",
  "blead": "బ్లేడ్",
  "bleads": "బ్లేడ్లు",
  "chakpice": "చాక్‌పీస్",
  "chandrika": "చంద్రిక",
  "china": "చైనా",
  "chinthol": "సింథాల్",
  "old": "ఓల్డ్",
  "colgate": "కోల్గేట్",
  "close": "క్లోజ్",
  "up": "అప్",
  "pepsodent": "పెప్సోడెంట్",
  "dettol": "డెట్టాల్",
  "lifebuoy": "లైఫ్‌బాయ్",
  "pears": "పియర్స్",
  "lux": "లక్స్",
  "santoor": "సంతూర్",
  "dove": "డవ్",
  "vivel": "వివెల్",
  "fiama": "ఫియామా",
  "medimix": "మెడిమిక్స్",
  "rin": "రిన్",
  "excel": "ఎక్సెల్",
  "tide": "టైడ్",
  "wheel": "వీల్",
  "ghadi": "ఘడి",
  "vim": "విమ్",
  "exo": "ఎక్సో",
  "pril": "ప్రిల్",
  "fortune": "ఫార్చ్యూన్",
  "sunflower": "సన్‌ఫ్లవర్",
  "freedom": "ఫ్రీడమ్",
  "gold drop": "గోల్డ్ డ్రాప్",
  "gemini": "జెమిని",
  "tata": "టాటా",
  "red": "రెడ్",
  "label": "లేబుల్",
  "taj": "తాజ్",
  "mahal": "మహల్",
  "wagh": "వాగ్",
  "bakri": "బక్రీ",
  "horlicks": "హార్లిక్స్",
  "complan": "కాంప్లాన్",
  "bournvita": "బోర్నవిటా",
  "pediasure": "పిడియాషూర్"
};

function transliterateWordToTelugu(word: string): string {
  if (!word) return "";
  if (/[^\x00-\x7F]/.test(word)) return word;

  const lower = word.toLowerCase();
  
  if (teluguDictionary[lower]) {
    return teluguDictionary[lower];
  }
  
  if (/^[0-9\W]+$/.test(word)) {
    return word;
  }

  let temp = lower;
  
  if (temp.startsWith("aa")) { temp = "ఆ" + temp.slice(2); }
  else if (temp.startsWith("a")) { temp = "అ" + temp.slice(1); }
  else if (temp.startsWith("ee")) { temp = "ఈ" + temp.slice(2); }
  else if (temp.startsWith("e")) { temp = "ఎ" + temp.slice(1); }
  else if (temp.startsWith("oo")) { temp = "ఊ" + temp.slice(2); }
  else if (temp.startsWith("u")) { temp = "ఉ" + temp.slice(1); }
  else if (temp.startsWith("i")) { temp = "ఇ" + temp.slice(1); }
  else if (temp.startsWith("o")) { temp = "ఒ" + temp.slice(1); }

  const rules = [
    { en: "ch", te: "చ" },
    { en: "sh", te: "ష" },
    { en: "th", te: "త" },
    { en: "bh", te: "భ" },
    { en: "dh", te: "ధ" },
    { en: "ph", te: "ఫ" },
    { en: "kh", te: "ఖ" },
    { en: "gh", te: "ఘ" },
    { en: "b", te: "బ" },
    { en: "c", te: "క" },
    { en: "d", te: "డ" },
    { en: "f", te: "ఫ" },
    { en: "g", te: "గ" },
    { en: "h", te: "హ" },
    { en: "j", te: "జ" },
    { en: "k", te: "క" },
    { en: "l", te: "ల" },
    { en: "m", te: "మ" },
    { en: "n", te: "న" },
    { en: "p", te: "ప" },
    { en: "r", te: "ర" },
    { en: "s", te: "స" },
    { en: "t", te: "ట" },
    { en: "v", te: "వ" },
    { en: "w", te: "వ" },
    { en: "y", te: "య" },
    { en: "z", te: "జ" },
    { en: "oo", te: "ూ" },
    { en: "ee", te: "ీ" },
    { en: "ea", te: "ీ" },
    { en: "ai", te: "ై" },
    { en: "ou", te: "ౌ" },
    { en: "a", te: "ా" },
    { en: "e", te: "ె" },
    { en: "i", te: "ి" },
    { en: "o", te: "ో" },
    { en: "u", te: "ు" }
  ];

  for (const rule of rules) {
    temp = temp.replaceAll(rule.en, rule.te);
  }

  return temp;
}

function translateItemNameToTelugu(name: string): string {
  if (!name) return "";
  return name.split(/(\s+)/).map(part => {
    if (/^\s+$/.test(part)) return part;
    const wordClean = part.replace(/^[^a-zA-Z]+/, "").replace(/[^a-zA-Z]+$/, "");
    if (!wordClean) return part;
    const translated = transliterateWordToTelugu(wordClean);
    return part.replace(wordClean, translated);
  }).join("");
}

export default function BillingPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [finalizedBill, setFinalizedBill] = useState<FinalizedBill | null>(null);
  const [isPrinting, setIsPrinting] = useState(false);
  const [useTelugu, setUseTelugu] = useState(false);
  const [mobileTab, setMobileTab] = useState<'catalog' | 'cart'>('catalog');

  // Load catalog items and categories
  useEffect(() => {
    fetchInventory();
  }, [search, selectedCategory]);

  async function fetchInventory() {
    try {
      const query = new URLSearchParams();
      if (search) query.append('q', search);
      if (selectedCategory) query.append('category', selectedCategory);

      const res = await fetch(`/api/inventory?${query.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setItems(data.items);
        // Load categories on initial load or if empty
        if (categories.length === 0) {
          setCategories(data.categories);
        }
      }
    } catch (err) {
      console.error('Error loading inventory', err);
    } finally {
      setLoading(false);
    }
  }

  // Cart operations
  const addToCart = (item: Item) => {
    setCart((prevCart) => {
      const existing = prevCart.find((i) => i.id === item.id);
      if (existing) {
        return prevCart.map((i) => 
          i.id === item.id 
            ? { ...i, cartQuantity: i.cartQuantity + 1 }
            : i
        );
      }
      return [...prevCart, { ...item, cartQuantity: 1 }];
    });
  };

  const updateQuantity = (itemId: number, qty: number) => {
    if (qty <= 0) {
      removeFromCart(itemId);
      return;
    }
    setCart((prevCart) =>
      prevCart.map((i) => (i.id === itemId ? { ...i, cartQuantity: qty } : i))
    );
  };

  const removeFromCart = (itemId: number) => {
    setCart((prevCart) => prevCart.filter((i) => i.id !== itemId));
  };

  const clearCart = () => {
    setCart([]);
  };

  const runningTotal = cart.reduce((sum, item) => sum + item.price * item.cartQuantity, 0);

  // Finalize bill and print
  const handleFinalizeAndPrint = async () => {
    if (cart.length === 0) return;

    try {
      const res = await fetch('/api/bills', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: cart.map(i => ({
            name: i.name,
            quantity: i.cartQuantity,
            price: i.price,
            unit: i.unit
          })),
          totalAmount: runningTotal
        })
      });

      if (res.ok) {
        const data = await res.json();
        
        const billInfo: FinalizedBill = {
          billNumber: data.billNumber,
          date: data.date,
          dayOfWeek: data.dayOfWeek,
          items: cart.map(i => ({
            name: i.name,
            quantity: i.cartQuantity,
            price: i.price,
            unit: i.unit
          })),
          totalAmount: runningTotal
        };

        setFinalizedBill(billInfo);
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to finalize bill');
      }
    } catch (err) {
      alert('Network error, please try again.');
    }
  };

  const downloadReceiptAsImage = async () => {
    const element = document.getElementById('receipt-print-area');
    if (!element) return;

    try {
      // Force element to be temporarily visible on screen for capture
      const clone = element.cloneNode(true) as HTMLElement;
      clone.style.display = 'block';
      clone.style.position = 'fixed';
      clone.style.left = '-9999px';
      clone.style.top = '0';
      clone.style.width = '800px'; // width on screen for clean A4 aspect rendering
      clone.style.backgroundColor = '#fff';
      clone.style.padding = '20px';
      document.body.appendChild(clone);

      const canvas = await html2canvas(clone, {
        scale: 2, // high res
        backgroundColor: '#ffffff',
        logging: false,
      });

      document.body.removeChild(clone);

      canvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.download = `Receipt_${finalizedBill?.billNumber || 'bill'}.png`;
          link.href = url;
          link.click();
          // Clean up the URL
          setTimeout(() => URL.revokeObjectURL(url), 100);
        }
      }, 'image/png');
    } catch (error) {
      console.error('Error generating image:', error);
      alert('Failed to generate receipt image');
    }
  };

  const handleCloseReceiptModal = () => {
    clearCart();
    setFinalizedBill(null);
    fetchInventory();
  };

  const getReceiptLine = (name: string, quantity: number, price: number): string => {
    const nameLimit = 14;
    const qtyRateLimit = 10;
    const priceLimit = 8;

    // Truncate name if too long, or pad
    const formattedName = name.substring(0, nameLimit).padEnd(nameLimit, ' ');
    
    // Qty x Rate
    const qtyRate = `${quantity} x ${price.toFixed(2)}`;
    const formattedQty = qtyRate.substring(0, qtyRateLimit).padStart(qtyRateLimit, ' ');
    
    // Item Total Price
    const itemTotal = (quantity * price).toFixed(2);
    const formattedPrice = itemTotal.substring(0, priceLimit).padStart(priceLimit, ' ');
    
    return `${formattedName}${formattedQty}${formattedPrice}`;
  };

  return (
    <div className="app-container">
      <Navbar />
      <main className="main-content">
        {/* Mobile Tab Toggle */}
        <div className="mobile-tabs-container">
          <button
            onClick={() => setMobileTab('catalog')}
            className={`mobile-tab-btn ${mobileTab === 'catalog' ? 'active' : ''}`}
          >
            Catalog ({items.length})
          </button>
          <button
            onClick={() => setMobileTab('cart')}
            className={`mobile-tab-btn ${mobileTab === 'cart' ? 'active' : ''}`}
          >
            Cart ({cart.reduce((sum, item) => sum + item.cartQuantity, 0)}) - ₹{runningTotal.toFixed(2)}
          </button>
        </div>

        <div className="billing-layout">
          
          {/* Item Catalog (Left) */}
          <div className={`billing-catalog ${mobileTab !== 'catalog' ? 'mobile-hidden' : ''}`}>
            <div className="search-container">
              <div style={{ position: 'relative', flex: 1 }}>
                <Search size={18} style={{ position: 'absolute', left: '10px', top: '10px', color: 'var(--text-light)' }} />
                <input
                  type="text"
                  className="form-control"
                  placeholder="Search item by name or barcode..."
                  style={{ paddingLeft: '34px' }}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <button 
                onClick={() => { setSearch(''); setSelectedCategory(''); }} 
                className="btn btn-outline" 
                title="Reset Filters"
              >
                <RefreshCw size={16} />
              </button>
            </div>

            {/* Categories scroll area */}
            <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', paddingBottom: '0.5rem', borderBottom: '1px solid var(--border-color)' }}>
              <button
                onClick={() => setSelectedCategory('')}
                className={`btn ${selectedCategory === '' ? 'btn-primary' : 'btn-outline'}`}
                style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem', whiteSpace: 'nowrap' }}
              >
                All Categories
              </button>
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`btn ${selectedCategory === cat ? 'btn-primary' : 'btn-outline'}`}
                  style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem', whiteSpace: 'nowrap' }}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Items catalog grid */}
            <div className="scrollable-y">
              {loading ? (
                <p style={{ textAlign: 'center', color: 'var(--text-muted)' }}>Loading items...</p>
              ) : items.length === 0 ? (
                <p style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No items found.</p>
              ) : (
                <div className="catalog-grid">
                  {items.map((item) => {
                    const isLow = item.quantity <= 10;
                    return (
                      <div
                        key={item.id}
                        className="catalog-card"
                        onClick={() => addToCart(item)}
                      >
                        <div className="catalog-card-name">{item.name}</div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: '0.5rem' }}>
                          <span className="catalog-card-price">₹{item.price.toFixed(2)}</span>
                          <span 
                            className="catalog-card-stock"
                            style={{ 
                              color: item.quantity <= 0 ? 'var(--danger)' : isLow ? 'var(--secondary-hover)' : 'var(--text-muted)',
                              fontWeight: isLow ? 600 : 400
                            }}
                          >
                            {item.quantity.toFixed(1)} {item.unit}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Billing Cart (Right) */}
          <div className={`billing-cart ${mobileTab !== 'cart' ? 'mobile-hidden' : ''}`}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <ShoppingBag size={18} style={{ color: 'var(--primary-color)' }} />
              <span>Current Cart ({cart.length} items)</span>
            </h3>

            <div className="scrollable-y" style={{ borderTop: '1px solid var(--border-color)' }}>
              {cart.length === 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)', padding: '2rem 0' }}>
                  <ShoppingBag size={36} style={{ strokeWidth: 1.5, marginBottom: '0.5rem' }} />
                  <p>Cart is empty</p>
                  <p style={{ fontSize: '0.75rem' }}>Select items from the left to add them</p>
                </div>
              ) : (
                <div>
                  <div style={{ display: 'grid', gridTemplateColumns: '2fr 1.5fr 1fr 0.5fr', padding: '0.25rem 0', fontWeight: '600', fontSize: '0.8rem', borderBottom: '2px solid var(--border-color)', color: 'var(--text-muted)' }}>
                    <span>Item</span>
                    <span>Qty</span>
                    <span style={{ textAlign: 'right' }}>Total</span>
                    <span></span>
                  </div>
                  {cart.map((item) => (
                    <div key={item.id} className="cart-item-row">
                      <div className="cart-item-name">
                        {item.name}
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          ₹{item.price.toFixed(2)} / {item.unit}
                        </div>
                      </div>
                      
                      <div className="cart-qty-ctrl">
                        <button
                          onClick={() => updateQuantity(item.id, item.cartQuantity - 1)}
                          className="btn btn-outline"
                          style={{ padding: '0.15rem 0.35rem', borderRadius: '4px' }}
                        >
                          <Minus size={12} />
                        </button>
                        <input
                          type="number"
                          step="any"
                          className="cart-qty-input"
                          value={item.cartQuantity}
                          onChange={(e) => updateQuantity(item.id, parseFloat(e.target.value) || 0)}
                        />
                        <button
                          onClick={() => updateQuantity(item.id, item.cartQuantity + 1)}
                          className="btn btn-outline"
                          style={{ padding: '0.15rem 0.35rem', borderRadius: '4px' }}
                        >
                          <Plus size={12} />
                        </button>
                      </div>

                      <div style={{ textAlign: 'right', fontWeight: 600, fontSize: '0.9rem' }}>
                        ₹{(item.price * item.cartQuantity).toFixed(2)}
                      </div>

                      <div style={{ textAlign: 'right' }}>
                        <button
                          onClick={() => removeFromCart(item.id)}
                          style={{ border: 'none', background: 'none', color: 'var(--danger)', cursor: 'pointer' }}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Cart Footer */}
            <div className="cart-total-footer">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '1.1rem', fontWeight: 700 }}>GRAND TOTAL:</span>
                <span style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--primary-color)' }}>
                  ₹{runningTotal.toFixed(2)}
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '0.5rem' }}>
                <button
                  onClick={clearCart}
                  className="btn btn-outline btn-danger"
                  style={{ color: 'white', fontWeight: 600 }}
                  disabled={cart.length === 0}
                >
                  Clear
                </button>
                <button
                  onClick={handleFinalizeAndPrint}
                  className="btn btn-primary"
                  style={{ padding: '0.75rem' }}
                  disabled={cart.length === 0}
                >
                  <Printer size={18} />
                  <span>Finalize & Print</span>
                </button>
              </div>
            </div>
          </div>

        </div>
      </main>
      {/* Hidden A4 Invoice Print Area */}
      {finalizedBill && (
        <div id="receipt-print-area">
          <div className="a4-invoice-container">
            {/* Invoice Header */}
            <div className="invoice-header">
              <div className="invoice-brand">
                <h1 className="invoice-title">
                  {useTelugu ? "వెంకట శ్రీనివాస కిరాణా అండ్ జనరల్ మర్చంట్" : "Venkata Srinivasa Kirana and General Merchant"}
                </h1>
                <div className="invoice-subtitle">
                  {useTelugu ? "చుండూరి సత్యం గారి షాప్" : "Chunduri Satyam Gari Shop"}
                </div>
                <div className="invoice-contact">
                  {useTelugu ? "చుండూరి శివనారాయణ | ఫోన్: 9246979013" : "Chunduri Sivanarayana | Phone: 9246979013"}
                </div>
              </div>
              <div className="invoice-meta">
                <div className="invoice-type">{useTelugu ? "రిటైల్ బిల్" : "Retail Bill"}</div>
                <div className="invoice-meta-item">
                  <span className="invoice-meta-label">{useTelugu ? "బిల్ నెం: " : "Bill No: "}</span>
                  <span className="invoice-meta-val">{finalizedBill.billNumber}</span>
                </div>
                <div className="invoice-meta-item">
                  <span className="invoice-meta-label">{useTelugu ? "తేదీ: " : "Date: "}</span>
                  <span className="invoice-meta-val">{finalizedBill.date}</span>
                </div>
                <div className="invoice-meta-item">
                  <span className="invoice-meta-label">{useTelugu ? "రోజు: " : "Day: "}</span>
                  <span className="invoice-meta-val">{finalizedBill.dayOfWeek}</span>
                </div>
              </div>
            </div>

            {/* Bill To Customer (Cash/Retail Customer) */}
            <div className="invoice-bill-to">
              <div className="invoice-bill-to-title">{useTelugu ? "కస్టమర్ వివరాలు" : "Billed To"}</div>
              <div className="invoice-bill-to-name">{useTelugu ? "నగదు / రిటైల్ కస్టమర్" : "Cash / Retail Customer"}</div>
            </div>

            {/* Items Table */}
            <table className="invoice-table">
              <thead>
                <tr>
                  <th style={{ width: '50px' }} className="col-center">S.No</th>
                  <th>{useTelugu ? "వస్తువు పేరు" : "Item Name"}</th>
                  <th style={{ width: '120px' }} className="col-center">{useTelugu ? "పరిమాణం" : "Qty"}</th>
                  <th style={{ width: '120px' }} className="col-right">{useTelugu ? "ధర" : "Rate"}</th>
                  <th style={{ width: '130px' }} className="col-right">{useTelugu ? "మొత్తం" : "Amount"}</th>
                </tr>
              </thead>
              <tbody>
                {finalizedBill.items.map((item, idx) => {
                  const displayName = useTelugu ? translateItemNameToTelugu(item.name) : item.name;
                  const itemTotal = (item.quantity * item.price).toFixed(2);
                  return (
                    <tr key={idx}>
                      <td className="col-center">{idx + 1}</td>
                      <td style={{ fontWeight: 600 }}>{displayName}</td>
                      <td className="col-center">{item.quantity} {item.unit}</td>
                      <td className="col-right">₹{item.price.toFixed(2)}</td>
                      <td className="col-right" style={{ fontWeight: 600 }}>₹{itemTotal}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Invoice Summary */}
            <div className="invoice-summary-section">
              <div className="invoice-info-notes">
                <p style={{ fontWeight: 600, marginBottom: '0.25rem' }}>
                  {useTelugu ? "గమనికలు:" : "Notes / Terms:"}
                </p>
                <p>{useTelugu ? "1. కొనుగోలు చేసిన వస్తువులు తిరిగి తీసుకోబడవు." : "1. Goods once sold cannot be returned or exchanged."}</p>
                <p>{useTelugu ? "2. దయచేసి డెలివరీ సమయంలో వస్తువులను తనిఖీ చేయండి." : "2. Please check items at the time of delivery."}</p>
              </div>
              <div className="invoice-totals-box">
                <div className="invoice-totals-row">
                  <span>{useTelugu ? "మొత్తం వస్తువులు:" : "Total Items:"}</span>
                  <span style={{ fontWeight: 600 }}>{finalizedBill.items.length}</span>
                </div>
                <div className="invoice-totals-row grand-total">
                  <span>{useTelugu ? "మొత్తం:" : "Grand Total:"}</span>
                  <span className="invoice-totals-val">₹{finalizedBill.totalAmount.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="invoice-footer">
              <div className="invoice-footer-thanks">
                {useTelugu ? "సందర్శించినందుకు ధన్యవాదాలు!" : "Thank You For Your Business!"}
              </div>
              <div>{useTelugu ? "మళ్లీ రండి" : "Please Visit Again"}</div>
            </div>
          </div>
        </div>
      )}

      {/* Bill Finalized Dialog Modal (Visible only on screen, hidden in print) */}
      {finalizedBill && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '400px' }}>
            <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
              <div style={{ color: 'var(--success)', marginBottom: '0.5rem', display: 'flex', justifyContent: 'center' }}>
                <CheckCircle size={48} />
              </div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Bill Finalized!</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Bill No: {finalizedBill.billNumber}</p>
              
              {/* Telugu Toggle Checkbox */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginTop: '0.75rem', padding: '0.5rem', backgroundColor: 'var(--background-color)', borderRadius: 'var(--radius)' }}>
                <input
                  type="checkbox"
                  id="telugu-toggle"
                  style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: 'var(--primary-color)' }}
                  checked={useTelugu}
                  onChange={(e) => setUseTelugu(e.target.checked)}
                />
                <label htmlFor="telugu-toggle" style={{ fontWeight: 600, fontSize: '0.9rem', cursor: 'pointer', color: 'var(--text-main)' }}>
                  Translate to Telugu (తెలుగు)
                </label>
              </div>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <button onClick={() => window.print()} className="btn btn-primary" style={{ width: '100%' }}>
                <Printer size={18} />
                <span>Print (Computer Browser)</span>
              </button>
              
              <button onClick={downloadReceiptAsImage} className="btn btn-secondary" style={{ width: '100%' }}>
                <Download size={18} />
                <span>Download Image (Phone Print)</span>
              </button>
              
              <button onClick={handleCloseReceiptModal} className="btn btn-outline" style={{ width: '100%', marginTop: '0.5rem' }}>
                Close & Next Bill
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
