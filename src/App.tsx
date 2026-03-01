/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { 
  LayoutGrid, 
  ShoppingCart, 
  History, 
  Settings, 
  Plus, 
  Minus, 
  Trash2, 
  Search, 
  ChevronRight, 
  Printer, 
  Moon, 
  Sun, 
  LogOut, 
  User as UserIcon,
  CreditCard,
  Wallet,
  Banknote,
  Save,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Product, Category, CartItem, Transaction, User, SavedBill } from './types';

export default function App() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [activeCategory, setActiveCategory] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [activeTab, setActiveTab] = useState<'pos' | 'history' | 'settings'>('pos');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(true);
  const [pin, setPin] = useState('');
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'qris' | 'debit'>('cash');
  const [cashAmount, setCashAmount] = useState<string>('');
  const [isMobileCartOpen, setIsMobileCartOpen] = useState(false);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [savedBills, setSavedBills] = useState<SavedBill[]>([]);
  const [isSaveBillModalOpen, setIsSaveBillModalOpen] = useState(false);
  const [tableName, setTableName] = useState('');

  // Fetch initial data
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [prodRes, catRes, transRes, billRes] = await Promise.all([
        fetch('/api/products'),
        fetch('/api/categories'),
        fetch('/api/transactions'),
        fetch('/api/saved-bills')
      ]);
      setProducts(await prodRes.json());
      setCategories(await catRes.json());
      setTransactions(await transRes.json());
      setSavedBills(await billRes.json());
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchesCategory = activeCategory === null || p.category_id === activeCategory;
      const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [products, activeCategory, searchQuery]);

  const cartTotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  }, [cart]);

  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const removeFromCart = (productId: number) => {
    setCart(prev => prev.filter(item => item.id !== productId));
  };

  const updateQuantity = (productId: number, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === productId) {
        const newQty = Math.max(1, item.quantity + delta);
        return { ...item, quantity: newQty };
      }
      return item;
    }));
  };

  const handleLogin = async () => {
    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin })
      });
      if (res.ok) {
        const user = await res.json();
        setCurrentUser(user);
        setIsLoginModalOpen(false);
        setPin('');
      } else {
        alert('PIN Salah!');
      }
    } catch (error) {
      console.error('Login error:', error);
    }
  };

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    
    const transactionData = {
      total: cartTotal,
      payment_method: paymentMethod,
      cashier_name: currentUser?.name || 'Unknown',
      items: cart
    };

    try {
      const res = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(transactionData)
      });
      if (res.ok) {
        setCart([]);
        setIsPaymentModalOpen(false);
        setCashAmount('');
        fetchData();
        alert('Transaksi Berhasil!');
      }
    } catch (error) {
      console.error('Checkout error:', error);
    }
  };

  const saveBill = async () => {
    if (!tableName || cart.length === 0) return;
    try {
      const res = await fetch('/api/saved-bills', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ table_name: tableName, items: cart })
      });
      if (res.ok) {
        setCart([]);
        setTableName('');
        setIsSaveBillModalOpen(false);
        fetchData();
      }
    } catch (error) {
      console.error('Save bill error:', error);
    }
  };

  const loadBill = (bill: SavedBill) => {
    setCart(JSON.parse(bill.items));
    setActiveTab('pos');
    fetch(`/api/saved-bills/${bill.id}`, { method: 'DELETE' }).then(() => fetchData());
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);
  };

  if (isLoginModalOpen) {
    return (
      <div className={`min-h-screen flex items-center justify-center p-4 ${isDarkMode ? 'bg-zinc-950 text-white' : 'bg-zinc-100 text-zinc-900'}`}>
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`w-full max-w-md p-8 rounded-3xl shadow-2xl ${isDarkMode ? 'bg-zinc-900 border border-zinc-800' : 'bg-white'}`}
        >
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-emerald-500 rounded-2xl mx-auto flex items-center justify-center mb-4 shadow-lg shadow-emerald-500/20">
              <LayoutGrid className="text-white w-10 h-10" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight">PRIME NEXUS POS</h1>
            <p className="text-zinc-500 mt-2">Silakan masukkan PIN Kasir</p>
          </div>
          
          <div className="grid grid-cols-3 gap-4 mb-6">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 'C', 0, 'OK'].map((num) => (
              <button
                key={num}
                onClick={() => {
                  if (num === 'C') setPin('');
                  else if (num === 'OK') handleLogin();
                  else if (pin.length < 4) setPin(prev => prev + num);
                }}
                className={`h-16 rounded-2xl text-xl font-semibold transition-all active:scale-95 ${
                  num === 'OK' ? 'bg-emerald-500 text-white hover:bg-emerald-600' :
                  num === 'C' ? 'bg-rose-500 text-white hover:bg-rose-600' :
                  isDarkMode ? 'bg-zinc-800 hover:bg-zinc-700' : 'bg-zinc-100 hover:bg-zinc-200'
                }`}
              >
                {num}
              </button>
            ))}
          </div>
          <div className="flex justify-center gap-2">
            {[...Array(4)].map((_, i) => (
              <div key={i} className={`w-4 h-4 rounded-full border-2 ${pin.length > i ? 'bg-emerald-500 border-emerald-500' : 'border-zinc-300'}`} />
            ))}
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen flex flex-col md:flex-row ${isDarkMode ? 'bg-zinc-950 text-white' : 'bg-zinc-50 text-zinc-900'} font-sans`}>
      {/* Sidebar - Desktop */}
      <aside className={`hidden md:flex flex-col w-20 lg:w-64 border-r transition-colors ${isDarkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-200'}`}>
        <div className="p-6 flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center shrink-0">
            <LayoutGrid className="text-white w-6 h-6" />
          </div>
          <span className="font-bold text-xl tracking-tight hidden lg:block">NEXUS POS</span>
        </div>

        <nav className="flex-1 px-4 space-y-2 mt-4">
          <button 
            onClick={() => setActiveTab('pos')}
            className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${activeTab === 'pos' ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' : 'hover:bg-zinc-100 dark:hover:bg-zinc-800'}`}
          >
            <ShoppingCart className="w-5 h-5" />
            <span className="hidden lg:block font-medium">Kasir</span>
          </button>
          <button 
            onClick={() => setActiveTab('history')}
            className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${activeTab === 'history' ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' : 'hover:bg-zinc-100 dark:hover:bg-zinc-800'}`}
          >
            <History className="w-5 h-5" />
            <span className="hidden lg:block font-medium">Riwayat</span>
          </button>
          <button 
            onClick={() => setActiveTab('settings')}
            className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${activeTab === 'settings' ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' : 'hover:bg-zinc-100 dark:hover:bg-zinc-800'}`}
          >
            <Settings className="w-5 h-5" />
            <span className="hidden lg:block font-medium">Pengaturan</span>
          </button>
        </nav>

        <div className="p-4 border-t border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center gap-3 p-3">
            <div className="w-8 h-8 bg-zinc-200 dark:bg-zinc-800 rounded-full flex items-center justify-center">
              <UserIcon className="w-4 h-4" />
            </div>
            <div className="hidden lg:block">
              <p className="text-sm font-semibold truncate">{currentUser?.name}</p>
              <p className="text-xs text-zinc-500 capitalize">{currentUser?.role}</p>
            </div>
          </div>
          <button 
            onClick={() => setIsLoginModalOpen(true)}
            className="w-full flex items-center gap-3 p-3 rounded-xl text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-all mt-2"
          >
            <LogOut className="w-5 h-5" />
            <span className="hidden lg:block font-medium">Keluar</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <header className={`h-16 border-b flex items-center justify-between px-6 shrink-0 ${isDarkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-200'}`}>
          <div className="flex items-center gap-4 flex-1 max-w-xl">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 w-4 h-4" />
              <input 
                type="text" 
                placeholder="Cari menu..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`w-full pl-10 pr-4 py-2 rounded-xl border focus:ring-2 focus:ring-emerald-500 outline-none transition-all ${isDarkMode ? 'bg-zinc-800 border-zinc-700' : 'bg-zinc-50 border-zinc-200'}`}
              />
            </div>
          </div>
          <div className="flex items-center gap-3 ml-4">
            <button 
              onClick={() => setIsDarkMode(!isDarkMode)}
              className={`p-2 rounded-xl border transition-all ${isDarkMode ? 'bg-zinc-800 border-zinc-700 hover:bg-zinc-700' : 'bg-white border-zinc-200 hover:bg-zinc-50'}`}
            >
              {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
            <div className="md:hidden">
               <button 
                onClick={() => setIsMobileCartOpen(true)}
                className="p-2 rounded-xl bg-emerald-500 text-white relative"
              >
                <ShoppingCart className="w-5 h-5" />
                {cart.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center">
                    {cart.length}
                  </span>
                )}
              </button>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'pos' && (
            <div className="space-y-6">
              {/* Categories */}
              <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar">
                <button 
                  onClick={() => setActiveCategory(null)}
                  className={`px-6 py-2 rounded-xl whitespace-nowrap font-medium transition-all ${activeCategory === null ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' : 'bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800'}`}
                >
                  Semua
                </button>
                {categories.map(cat => (
                  <button 
                    key={cat.id}
                    onClick={() => setActiveCategory(cat.id)}
                    className={`px-6 py-2 rounded-xl whitespace-nowrap font-medium transition-all ${activeCategory === cat.id ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' : 'bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800'}`}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>

              {/* Products Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                <AnimatePresence mode='popLayout'>
                  {filteredProducts.map(product => (
                    <motion.div 
                      layout
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      key={product.id}
                      onClick={() => addToCart(product)}
                      className={`group cursor-pointer rounded-2xl border transition-all hover:shadow-xl active:scale-95 ${isDarkMode ? 'bg-zinc-900 border-zinc-800 hover:border-emerald-500/50' : 'bg-white border-zinc-200 hover:border-emerald-500/50'}`}
                    >
                      <div className="aspect-square overflow-hidden rounded-t-2xl relative">
                        <img 
                          src={product.image} 
                          alt={product.name}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover transition-transform group-hover:scale-110"
                        />
                        <div className="absolute top-2 right-2 bg-emerald-500 text-white text-[10px] font-bold px-2 py-1 rounded-lg">
                          {product.category_name}
                        </div>
                      </div>
                      <div className="p-4">
                        <h3 className="font-semibold text-sm line-clamp-1">{product.name}</h3>
                        <p className="text-emerald-500 font-bold mt-1">{formatCurrency(product.price)}</p>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>
          )}

          {activeTab === 'history' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold">Riwayat Transaksi</h2>
              <div className="grid gap-4">
                {transactions.map(tx => (
                  <div key={tx.id} className={`p-4 rounded-2xl border ${isDarkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-200'}`}>
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-bold text-lg">TX-{tx.id.toString().padStart(5, '0')}</p>
                        <p className="text-sm text-zinc-500">{new Date(tx.created_at).toLocaleString('id-ID')}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-emerald-500 text-lg">{formatCurrency(tx.total)}</p>
                        <p className="text-xs uppercase font-bold text-zinc-400">{tx.payment_method}</p>
                      </div>
                    </div>
                    <div className="text-sm text-zinc-500 border-t border-zinc-100 dark:border-zinc-800 pt-2 mt-2">
                      Kasir: {tx.cashier_name}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="max-w-2xl space-y-8">
              <section>
                <h2 className="text-2xl font-bold mb-4">Manajemen Meja / Tagihan Tersimpan</h2>
                <div className="grid grid-cols-2 gap-4">
                  {savedBills.map(bill => (
                    <div key={bill.id} className={`p-4 rounded-2xl border flex justify-between items-center ${isDarkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-200'}`}>
                      <div>
                        <p className="font-bold">{bill.table_name}</p>
                        <p className="text-xs text-zinc-500">{new Date(bill.created_at).toLocaleTimeString()}</p>
                      </div>
                      <button 
                        onClick={() => loadBill(bill)}
                        className="p-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600"
                      >
                        Buka
                      </button>
                    </div>
                  ))}
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-bold mb-4">Printer Thermal</h2>
                <div className={`p-6 rounded-2xl border ${isDarkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-200'}`}>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <Printer className="w-6 h-6 text-emerald-500" />
                      <div>
                        <p className="font-bold">Status Printer</p>
                        <p className="text-sm text-zinc-500">Printer Bluetooth/USB Terdeteksi</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse" />
                      <span className="text-sm font-medium">Ready</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <button className="p-3 rounded-xl border border-zinc-200 dark:border-zinc-700 font-medium hover:bg-zinc-50 dark:hover:bg-zinc-800">Format Standar</button>
                    <button className="p-3 rounded-xl border border-zinc-200 dark:border-zinc-700 font-medium hover:bg-zinc-50 dark:hover:bg-zinc-800">Format Klasik</button>
                  </div>
                </div>
              </section>
            </div>
          )}
        </div>
      </main>

      {/* Cart Sidebar - Desktop */}
      <aside className={`hidden xl:flex flex-col w-96 border-l shrink-0 ${isDarkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-200'}`}>
        <div className="p-6 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-emerald-500" />
            Keranjang
          </h2>
          <button 
            onClick={() => setCart([])}
            className="text-zinc-400 hover:text-rose-500 transition-colors"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-zinc-400 space-y-4">
              <div className="w-16 h-16 bg-zinc-100 dark:bg-zinc-800 rounded-full flex items-center justify-center">
                <ShoppingCart className="w-8 h-8" />
              </div>
              <p className="font-medium">Keranjang masih kosong</p>
            </div>
          ) : (
            cart.map(item => (
              <div key={item.id} className="flex gap-4">
                <img src={item.image} className="w-16 h-16 rounded-xl object-cover" referrerPolicy="no-referrer" />
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-sm truncate">{item.name}</h4>
                  <p className="text-emerald-500 font-bold text-sm">{formatCurrency(item.price)}</p>
                  <div className="flex items-center gap-3 mt-2">
                    <button 
                      onClick={() => updateQuantity(item.id, -1)}
                      className="w-6 h-6 rounded-lg border border-zinc-200 dark:border-zinc-700 flex items-center justify-center hover:bg-zinc-50 dark:hover:bg-zinc-800"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="font-bold text-sm">{item.quantity}</span>
                    <button 
                      onClick={() => updateQuantity(item.id, 1)}
                      className="w-6 h-6 rounded-lg border border-zinc-200 dark:border-zinc-700 flex items-center justify-center hover:bg-zinc-50 dark:hover:bg-zinc-800"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                </div>
                <button 
                  onClick={() => removeFromCart(item.id)}
                  className="text-zinc-300 hover:text-rose-500 self-start"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))
          )}
        </div>

        <div className="p-6 border-t border-zinc-200 dark:border-zinc-800 space-y-4">
          <div className="flex justify-between items-center text-zinc-500">
            <span>Subtotal</span>
            <span>{formatCurrency(cartTotal)}</span>
          </div>
          <div className="flex justify-between items-center text-xl font-bold">
            <span>Total</span>
            <span className="text-emerald-500">{formatCurrency(cartTotal)}</span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <button 
              onClick={() => setIsSaveBillModalOpen(true)}
              disabled={cart.length === 0}
              className="flex items-center justify-center gap-2 p-3 rounded-xl border border-zinc-200 dark:border-zinc-700 font-bold hover:bg-zinc-50 dark:hover:bg-zinc-800 disabled:opacity-50"
            >
              <Save className="w-5 h-5" />
              Simpan
            </button>
            <button 
              onClick={() => setIsPaymentModalOpen(true)}
              disabled={cart.length === 0}
              className="flex items-center justify-center gap-2 p-3 rounded-xl bg-emerald-500 text-white font-bold hover:bg-emerald-600 shadow-lg shadow-emerald-500/20 disabled:opacity-50"
            >
              Bayar
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </aside>

      {/* Floating Cart Button - Mobile */}
      <AnimatePresence>
        {cart.length > 0 && !isMobileCartOpen && (
          <motion.div 
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-6 left-6 right-6 md:hidden z-40"
          >
            <button 
              onClick={() => setIsMobileCartOpen(true)}
              className="w-full bg-emerald-500 text-white p-4 rounded-2xl shadow-2xl flex items-center justify-between font-bold"
            >
              <div className="flex items-center gap-3">
                <div className="bg-white/20 p-2 rounded-xl">
                  <ShoppingCart className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs opacity-80">{cart.length} Item</p>
                  <p>{formatCurrency(cartTotal)}</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                Lihat Keranjang
                <ChevronRight className="w-5 h-5" />
              </div>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile Cart Modal */}
      <AnimatePresence>
        {isMobileCartOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 md:hidden flex flex-col"
          >
            <motion.div 
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              className={`mt-auto rounded-t-[32px] flex flex-col max-h-[90vh] ${isDarkMode ? 'bg-zinc-900' : 'bg-white'}`}
            >
              <div className="p-6 flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800">
                <h2 className="text-xl font-bold">Keranjang Pesanan</h2>
                <button onClick={() => setIsMobileCartOpen(false)} className="p-2 rounded-full bg-zinc-100 dark:bg-zinc-800">
                  <X className="w-6 h-6" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {cart.map(item => (
                  <div key={item.id} className="flex gap-4">
                    <img src={item.image} className="w-20 h-20 rounded-2xl object-cover" referrerPolicy="no-referrer" />
                    <div className="flex-1">
                      <h4 className="font-bold">{item.name}</h4>
                      <p className="text-emerald-500 font-bold">{formatCurrency(item.price)}</p>
                      <div className="flex items-center gap-4 mt-2">
                        <button onClick={() => updateQuantity(item.id, -1)} className="w-8 h-8 rounded-xl border border-zinc-200 dark:border-zinc-700 flex items-center justify-center"><Minus className="w-4 h-4" /></button>
                        <span className="font-bold">{item.quantity}</span>
                        <button onClick={() => updateQuantity(item.id, 1)} className="w-8 h-8 rounded-xl border border-zinc-200 dark:border-zinc-700 flex items-center justify-center"><Plus className="w-4 h-4" /></button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="p-6 border-t border-zinc-100 dark:border-zinc-800 space-y-4">
                <div className="flex justify-between items-center text-2xl font-bold">
                  <span>Total</span>
                  <span className="text-emerald-500">{formatCurrency(cartTotal)}</span>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <button 
                    onClick={() => { setIsSaveBillModalOpen(true); setIsMobileCartOpen(false); }}
                    className="p-4 rounded-2xl border border-zinc-200 dark:border-zinc-700 font-bold"
                  >
                    Simpan
                  </button>
                  <button 
                    onClick={() => { setIsPaymentModalOpen(true); setIsMobileCartOpen(false); }}
                    className="p-4 rounded-2xl bg-emerald-500 text-white font-bold"
                  >
                    Bayar
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Payment Modal */}
      <AnimatePresence>
        {isPaymentModalOpen && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className={`w-full max-w-2xl rounded-[32px] overflow-hidden shadow-2xl ${isDarkMode ? 'bg-zinc-900' : 'bg-white'}`}
            >
              <div className="p-8 flex flex-col md:flex-row gap-8">
                <div className="flex-1 space-y-6">
                  <h2 className="text-2xl font-bold">Pilih Pembayaran</h2>
                  <div className="grid gap-3">
                    <button 
                      onClick={() => setPaymentMethod('cash')}
                      className={`p-4 rounded-2xl border flex items-center gap-4 transition-all ${paymentMethod === 'cash' ? 'border-emerald-500 bg-emerald-500/10' : 'border-zinc-200 dark:border-zinc-800'}`}
                    >
                      <div className={`p-3 rounded-xl ${paymentMethod === 'cash' ? 'bg-emerald-500 text-white' : 'bg-zinc-100 dark:bg-zinc-800'}`}>
                        <Banknote className="w-6 h-6" />
                      </div>
                      <div className="text-left">
                        <p className="font-bold">Tunai / Cash</p>
                        <p className="text-xs text-zinc-500">Bayar dengan uang fisik</p>
                      </div>
                    </button>
                    <button 
                      onClick={() => setPaymentMethod('qris')}
                      className={`p-4 rounded-2xl border flex items-center gap-4 transition-all ${paymentMethod === 'qris' ? 'border-emerald-500 bg-emerald-500/10' : 'border-zinc-200 dark:border-zinc-800'}`}
                    >
                      <div className={`p-3 rounded-xl ${paymentMethod === 'qris' ? 'bg-emerald-500 text-white' : 'bg-zinc-100 dark:bg-zinc-800'}`}>
                        <Wallet className="w-6 h-6" />
                      </div>
                      <div className="text-left">
                        <p className="font-bold">QRIS</p>
                        <p className="text-xs text-zinc-500">Scan kode QR untuk bayar</p>
                      </div>
                    </button>
                    <button 
                      onClick={() => setPaymentMethod('debit')}
                      className={`p-4 rounded-2xl border flex items-center gap-4 transition-all ${paymentMethod === 'debit' ? 'border-emerald-500 bg-emerald-500/10' : 'border-zinc-200 dark:border-zinc-800'}`}
                    >
                      <div className={`p-3 rounded-xl ${paymentMethod === 'debit' ? 'bg-emerald-500 text-white' : 'bg-zinc-100 dark:bg-zinc-800'}`}>
                        <CreditCard className="w-6 h-6" />
                      </div>
                      <div className="text-left">
                        <p className="font-bold">Kartu Debit/Kredit</p>
                        <p className="text-xs text-zinc-500">Gesek atau Tap kartu</p>
                      </div>
                    </button>
                  </div>
                </div>

                <div className="w-full md:w-72 space-y-6">
                  <div className={`p-6 rounded-2xl ${isDarkMode ? 'bg-zinc-800' : 'bg-zinc-50'}`}>
                    <p className="text-sm text-zinc-500 mb-1">Total Tagihan</p>
                    <p className="text-3xl font-bold text-emerald-500">{formatCurrency(cartTotal)}</p>
                  </div>

                  {paymentMethod === 'cash' && (
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-bold mb-2 block">Uang Diterima</label>
                        <input 
                          type="number" 
                          value={cashAmount}
                          onChange={(e) => setCashAmount(e.target.value)}
                          placeholder="0"
                          className={`w-full p-4 rounded-xl border text-xl font-bold outline-none focus:ring-2 focus:ring-emerald-500 ${isDarkMode ? 'bg-zinc-800 border-zinc-700' : 'bg-white border-zinc-200'}`}
                        />
                      </div>
                      {Number(cashAmount) >= cartTotal && (
                        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                          <p className="text-sm text-zinc-500">Kembalian</p>
                          <p className="text-xl font-bold text-emerald-500">{formatCurrency(Number(cashAmount) - cartTotal)}</p>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="flex gap-3">
                    <button 
                      onClick={() => setIsPaymentModalOpen(false)}
                      className="flex-1 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 font-bold"
                    >
                      Batal
                    </button>
                    <button 
                      onClick={handleCheckout}
                      disabled={paymentMethod === 'cash' && Number(cashAmount) < cartTotal}
                      className="flex-1 p-4 rounded-2xl bg-emerald-500 text-white font-bold hover:bg-emerald-600 disabled:opacity-50"
                    >
                      Selesai
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Save Bill Modal */}
      <AnimatePresence>
        {isSaveBillModalOpen && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className={`w-full max-w-md p-8 rounded-[32px] ${isDarkMode ? 'bg-zinc-900' : 'bg-white'}`}
            >
              <h2 className="text-2xl font-bold mb-6">Simpan Tagihan</h2>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-bold mb-2 block">Nama Meja / Pelanggan</label>
                  <input 
                    type="text" 
                    value={tableName}
                    onChange={(e) => setTableName(e.target.value)}
                    placeholder="Contoh: Meja 05"
                    className={`w-full p-4 rounded-xl border outline-none focus:ring-2 focus:ring-emerald-500 ${isDarkMode ? 'bg-zinc-800 border-zinc-700' : 'bg-white border-zinc-200'}`}
                  />
                </div>
                <div className="flex gap-3">
                  <button onClick={() => setIsSaveBillModalOpen(false)} className="flex-1 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 font-bold">Batal</button>
                  <button onClick={saveBill} className="flex-1 p-4 rounded-2xl bg-emerald-500 text-white font-bold">Simpan</button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
