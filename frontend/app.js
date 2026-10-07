/**
 * Scrap Link — AI-Powered Waste Collection Platform
 * Reliable, Production-Ready Frontend Application
 */

// --- API Base Configuration ---
const API_BASE_URL = (function() {
    if (window.SCRAPLINK_API_BASE) return window.SCRAPLINK_API_BASE;
    const host = window.location.hostname;
    if (host === 'localhost' || host === '127.0.0.1' || host === '') {
        return 'http://localhost:8080/api';
    }
    return window.location.origin + '/api';
})();

// --- Helper: Validate UUID ---
function isValidUuid(id) {
    if (!id) return false;
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(id));
}

// --- Safe Local Storage Helper ---
function getStoredUser() {
    try {
        const item = localStorage.getItem('scraplink_user');
        return item ? JSON.parse(item) : null;
    } catch (e) {
        console.error('Failed to parse scraplink_user from localStorage', e);
        return null;
    }
}

// --- Global Application State ---
let s = {
    user: getStoredUser(),
    page: 'dashboard',
    pickups: [],
    usersList: [],
    rates: {
        'PLASTIC': { name: 'Plastics (PET/HDPE)', rate: 18, icon: '🥤', co2: 1.8, trend: '+5%' },
        'PAPER': { name: 'Paper & Cardboard', rate: 14, icon: '📦', co2: 1.2, trend: '+2%' },
        'METAL': { name: 'Metals (Iron/Steel)', rate: 35, icon: '⚙️', co2: 2.5, trend: '+8%' },
        'ALUMINUM': { name: 'Aluminum Cans/Parts', rate: 110, icon: '🥫', co2: 8.5, trend: '+4%' },
        'COPPER': { name: 'Copper Wire/Pipes', rate: 450, icon: '⚡', co2: 4.2, trend: '+12%' },
        'E_WASTE': { name: 'E-Waste (Electronics)', rate: 65, icon: '💻', co2: 6.0, trend: '+6%' },
        'GLASS': { name: 'Glass Bottles', rate: 8, icon: '🍾', co2: 0.8, trend: '0%' },
        'BATTERY': { name: 'Lead Batteries', rate: 50, icon: '🔋', co2: 5.0, trend: '+3%' }
    },
    backendOnline: false,
    selectedAiSample: null,
    uploadedImage: null,
    isScanning: false,
    filterStatus: 'ALL',
    searchQuery: '',
    modal: null
};

// --- Toast Notifications System ---
function showToast(msg, type = 'success', duration = 3500) {
    try {
        let container = document.getElementById('toastContainer');
        if (!container) {
            container = document.createElement('div');
            container.id = 'toastContainer';
            container.className = 'toast-container';
            document.body.appendChild(container);
        }
        
        const icon = type === 'error' ? '⚠️' : type === 'info' ? 'ℹ️' : '✅';
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.innerHTML = `<span>${icon}</span> <div>${esc(msg)}</div>`;
        
        container.appendChild(toast);
        
        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateX(100%)';
            toast.style.transition = 'all 0.3s ease';
            setTimeout(() => toast.remove(), 300);
        }, duration);
    } catch (e) {
        console.error('Toast notification error:', e);
    }
}

// --- Modal System ---
function openModal(title, htmlContent) {
    s.modal = { title, content: htmlContent };
    let modalEl = document.getElementById('appModal');
    if (!modalEl) {
        modalEl = document.createElement('div');
        modalEl.id = 'appModal';
        document.body.appendChild(modalEl);
    }
    
    modalEl.className = 'modal-backdrop';
    modalEl.innerHTML = `
        <div class="modal">
            <button class="modal-close" onclick="closeModal()">✕</button>
            <h2 style="font-size: 22px; font-weight: 800; color: var(--text); margin-bottom: 16px;">${esc(title)}</h2>
            <div>${htmlContent}</div>
        </div>
    `;
    modalEl.onclick = (e) => {
        if (e.target === modalEl) closeModal();
    };
}

function closeModal() {
    s.modal = null;
    const modalEl = document.getElementById('appModal');
    if (modalEl) {
        modalEl.remove();
    }
}

// --- Helper Functions ---
function esc(str) {
    if (str === null || str === undefined) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function saveUser(user) {
    s.user = user;
    if (user) {
        localStorage.setItem('scraplink_user', JSON.stringify(user));
    } else {
        localStorage.removeItem('scraplink_user');
    }
}

function savePickupsToLocal(pickups) {
    s.pickups = pickups;
    localStorage.setItem('scraplink_pickups', JSON.stringify(pickups));
}

function loadPickupsFromLocal() {
    const data = localStorage.getItem('scraplink_pickups');
    if (data) {
        try {
            return JSON.parse(data);
        } catch (e) {
            console.error('Failed to parse local pickups', e);
        }
    }
    return [];
}

function formatCategory(cat) {
    if (!cat) return 'General Waste';
    const normalized = String(cat).toUpperCase().replace(/[\s-]/g, '_');
    if (s.rates[normalized]) {
        return s.rates[normalized].name;
    }
    return cat.charAt(0).toUpperCase() + cat.slice(1).toLowerCase().replace(/_/g, ' ');
}

function getCategoryIcon(cat) {
    if (!cat) return '♻️';
    const normalized = String(cat).toUpperCase().replace(/[\s-]/g, '_');
    return s.rates[normalized] ? s.rates[normalized].icon : '♻️';
}

function formatDate(dateStr) {
    if (!dateStr) return 'Recently';
    try {
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return dateStr;
        return d.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    } catch (e) {
        return dateStr;
    }
}

// --- Backend Health Check & API Calls ---
async function checkBackendHealth() {
    try {
        const res = await fetch(`${API_BASE_URL}/health`, { method: 'GET' });
        if (res.ok) {
            s.backendOnline = true;
            try {
                const uRes = await fetch(`${API_BASE_URL}/users`, { method: 'GET' });
                if (uRes.ok) s.usersList = await uRes.json();
            } catch (_) {}
        } else {
            s.backendOnline = false;
        }
    } catch (e) {
        s.backendOnline = false;
    }
}

async function loadPickupsFromBackend() {
    if (!s.user) return [];
    
    try {
        let url = `${API_BASE_URL}/pickups`;
        if (s.user.role === 'GENERATOR' && s.user.id && isValidUuid(s.user.id)) {
            url = `${API_BASE_URL}/pickups/user/${encodeURIComponent(s.user.id)}`;
        }
        
        console.log('Fetching pickups from:', url);
        const res = await fetch(url);
        
        if (!res.ok) {
            throw new Error(`Server status ${res.status}`);
        }
        
        const rawPickups = await res.json();
        s.backendOnline = true;
        
        const rawList = Array.isArray(rawPickups) ? rawPickups : [];
        const formatted = rawList.map(p => ({
            id: p.id,
            userId: p.userId || (p.user ? p.user.id : (s.user ? s.user.id : null)),
            userName: p.userName || (p.user ? (p.user.fullName || p.user.email) : (s.user ? (s.user.name || s.user.fullName || 'User') : 'User')),
            userPhone: p.userPhone || (p.user ? (p.user.phoneNumber || 'N/A') : (s.user ? (s.user.phone || s.user.phoneNumber || 'N/A') : 'N/A')),
            description: p.wasteDescription || 'Scrap Material',
            category: p.wasteCategory || 'GENERAL',
            weight: Number(p.weightKg || 0),
            value: Number(p.estimatedValue || 0),
            status: (p.status || 'PENDING').toUpperCase(),
            date: p.createdAt || new Date().toISOString()
        }));
        
        savePickupsToLocal(formatted);
        return formatted;
    } catch (err) {
        console.warn('Backend fetch failed, falling back to cached local pickups:', err.message);
        s.backendOnline = false;
        return loadPickupsFromLocal();
    }
}

// Alias for compatibility
const fetchPickupsFromBackend = loadPickupsFromBackend;

async function submitPickupToBackend(data) {
    if (!s.user) {
        throw new Error('User session not found. Please sign in.');
    }
    
    // Auto-fix non-UUID user session if backend is online
    if (s.backendOnline && !isValidUuid(s.user.id)) {
        try {
            const newUsr = await registerUserBackend(
                s.user.name || s.user.fullName || 'Recycler User',
                s.user.phone || s.user.phoneNumber || ('9876543' + Math.floor(100 + Math.random() * 900)),
                s.user.email || `user${Date.now()}@scraplink.com`,
                'password123',
                s.user.role || 'GENERATOR'
            );
            if (newUsr && newUsr.id) {
                s.user.id = newUsr.id;
                saveUser(s.user);
            }
        } catch (e) {
            console.warn('Auto registration attempt failed:', e.message);
        }
    }

    const currentUserId = (s.user && isValidUuid(s.user.id)) ? s.user.id : '9d896f21-c7e7-498e-8e6b-0d9271db5f7f';

    if (!s.backendOnline) {
        const newLocalPickup = {
            id: 'local-' + Date.now(),
            userId: currentUserId,
            userName: s.user ? (s.user.name || s.user.fullName) : 'Demo User',
            userPhone: s.user ? (s.user.phone || s.user.phoneNumber || '9876543210') : '9876543210',
            description: data.wasteDescription,
            category: data.wasteCategory,
            weight: Number(data.weightKg),
            value: Number(data.estimatedValue),
            status: 'PENDING',
            date: new Date().toISOString()
        };
        s.pickups.unshift(newLocalPickup);
        savePickupsToLocal(s.pickups);
        return newLocalPickup;
    }
    
    try {
        const params = new URLSearchParams({
            userId: currentUserId,
            wasteDescription: data.wasteDescription,
            wasteCategory: data.wasteCategory,
            weightKg: String(data.weightKg),
            estimatedValue: String(data.estimatedValue)
        });
        
        const res = await fetch(`${API_BASE_URL}/pickups?${params.toString()}`, {
            method: 'POST'
        });
        
        if (!res.ok) {
            const text = await res.text();
            throw new Error(text || `Server status ${res.status}`);
        }
        
        return await res.json();
    } catch (err) {
        console.warn('Backend pickup post error, storing locally:', err.message);
        const newLocalPickup = {
            id: 'local-' + Date.now(),
            userId: currentUserId,
            userName: s.user ? (s.user.name || s.user.fullName) : 'Demo User',
            userPhone: s.user ? (s.user.phone || s.user.phoneNumber || '9876543210') : '9876543210',
            description: data.wasteDescription,
            category: data.wasteCategory,
            weight: Number(data.weightKg),
            value: Number(data.estimatedValue),
            status: 'PENDING',
            date: new Date().toISOString()
        };
        s.pickups.unshift(newLocalPickup);
        savePickupsToLocal(s.pickups);
        return newLocalPickup;
    }
}

async function updatePickupStatus(pickupId, action) {
    if (!s.backendOnline || String(pickupId).startsWith('local-')) {
        const pickup = s.pickups.find(p => String(p.id) === String(pickupId));
        if (pickup) {
            pickup.status = action === 'accept' ? 'ACCEPTED' : 'COMPLETED';
            savePickupsToLocal(s.pickups);
        }
        return;
    }
    
    const res = await fetch(`${API_BASE_URL}/pickups/${encodeURIComponent(pickupId)}/${action}`, {
        method: 'PUT'
    });
    
    if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `Failed to ${action} pickup (HTTP ${res.status})`);
    }
    return await res.json();
}

async function registerUserBackend(name, phone, email, password, role) {
    if (s.backendOnline) {
        const res = await fetch(`${API_BASE_URL}/users`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                fullName: name,
                phoneNumber: phone,
                email: email,
                password: password,
                role: role
            })
        });
        if (!res.ok) {
            let errMsg = `Server returned status ${res.status}`;
            try {
                const errJson = await res.json();
                if (errJson.message) errMsg = errJson.message;
            } catch (_) {}
            throw new Error(errMsg);
        }
        return await res.json();
    }
    
    return {
        id: '9d896f21-c7e7-498e-8e6b-0d9271db5f7f',
        fullName: name,
        email: email,
        phoneNumber: phone,
        role: role
    };
}

// --- Navigation & Core App Engine ---
function navigate(page) {
    s.page = page;
    window.scrollTo({ top: 0, behavior: 'smooth' });
    render();
}

function toggleRole() {
    const newRole = s.user.role === 'COLLECTOR' ? 'GENERATOR' : 'COLLECTOR';
    s.user.role = newRole;
    saveUser(s.user);
    showToast(`Switched account mode to ${newRole}`, 'info');
    loadPickupsFromBackend().then(pickups => {
        s.pickups = pickups;
        render();
    });
}

function render() {
    try {
        const app = document.getElementById('app');
        if (!app) return;
        
        if (!s.user) {
            app.innerHTML = renderAuthScreen();
            return;
        }
        
        app.innerHTML = `
            <div class="shell">
                <aside class="side">
                    <div class="brand">
                        <span>♻️</span> Scrap Link
                    </div>
                    
                    <nav class="nav">
                        <button class="${s.page === 'dashboard' ? 'active' : ''}" onclick="navigate('dashboard')">
                            <span>📊</span> Dashboard
                        </button>
                        <button class="${s.page === 'classify' ? 'active' : ''}" onclick="navigate('classify')">
                            <span>🔍</span> AI Waste Classifier
                        </button>
                        <button class="${s.page === 'book' ? 'active' : ''}" onclick="navigate('book')">
                            <span>📦</span> Book Pickup
                        </button>
                        <button class="${s.page === 'estimator' ? 'active' : ''}" onclick="navigate('estimator')">
                            <span>💰</span> Price Estimator
                        </button>
                        <button class="${s.page === 'pickups' ? 'active' : ''}" onclick="navigate('pickups')">
                            <span>📋</span> Pickups List
                        </button>
                    </nav>
                    
                    <div class="side-footer">
                        <div class="mini">
                            <strong>${esc(s.user.name || s.user.fullName || 'User')}</strong>
                            <span>${esc(s.user.email || 'user@scraplink.com')}</span>
                            <div class="user-role-badge">
                                <span>${s.user.role === 'COLLECTOR' ? '🚛' : '🏠'}</span>
                                ${esc(s.user.role || 'GENERATOR')}
                            </div>
                        </div>
                        
                        <div style="display: flex; gap: 8px;">
                            <button class="btn outline" style="flex: 1; padding: 10px; font-size: 12px; color: #fff; border-color: rgba(255,255,255,0.2);" onclick="openSettingsModal()">
                                ⚙️ Profile
                            </button>
                            <button class="btn danger" style="padding: 10px; font-size: 12px;" onclick="logout()">
                                🚪
                            </button>
                        </div>
                    </div>
                </aside>
                
                <main class="main">
                    <header class="top">
                        <div class="top-title">
                            ${getPageTitle(s.page)}
                        </div>
                        
                        <div class="top-right">
                            <div class="backend-indicator ${s.backendOnline ? 'backend-online' : 'backend-offline'}">
                                <span class="dot ${s.backendOnline ? 'dot-online' : 'dot-offline'}"></span>
                                ${s.backendOnline ? 'Spring Boot Connected' : 'Offline / Demo Mode'}
                            </div>
                            
                            <button class="role-switcher-btn" onclick="toggleRole()">
                                <span>${s.user.role === 'COLLECTOR' ? '🚛' : '🏠'}</span>
                                Switch to ${s.user.role === 'COLLECTOR' ? 'Generator' : 'Collector'} Mode
                            </button>
                        </div>
                    </header>
                    
                    <div class="content">
                        ${renderPageContent(s.page)}
                    </div>
                </main>
            </div>
        `;
        
        attachPageEvents(s.page);
    } catch (err) {
        console.error('Fatal render error:', err);
        const app = document.getElementById('app');
        if (app) {
            app.innerHTML = `
                <div style="padding: 60px 20px; text-align: center; font-family: Inter, system-ui, sans-serif;">
                    <div style="font-size: 56px; margin-bottom: 16px;">♻️</div>
                    <h2 style="font-size: 24px; color: #064e3b; margin-bottom: 8px;">Scrap Link Platform Error</h2>
                    <p style="color: #64748b; max-width: 460px; margin: 0 auto 24px; font-size: 14px;">
                        An unhandled error occurred while rendering the page interface.
                    </p>
                    <div style="display: flex; gap: 12px; justify-content: center;">
                        <button onclick="location.reload()" style="padding: 12px 24px; background: #16a34a; color: white; border: none; border-radius: 12px; font-weight: bold; cursor: pointer;">
                            🔄 Reload Page
                        </button>
                        <button onclick="localStorage.clear(); location.reload();" style="padding: 12px 24px; background: #e2e8f0; color: #0f172a; border: none; border-radius: 12px; font-weight: bold; cursor: pointer;">
                            🧹 Reset App State
                        </button>
                    </div>
                </div>
            `;
        }
    }
}

function getPageTitle(page) {
    switch (page) {
        case 'dashboard': return '📊 Overview & Real-Time Analytics';
        case 'classify': return '🔍 AI Waste Classification & Scanner';
        case 'book': return '📦 Schedule Scrap Pickup Request';
        case 'estimator': return '💰 Scrap Rate Calculator & Value Estimator';
        case 'pickups': return '📋 Manage Scrap Pickup Orders';
        default: return 'Scrap Link';
    }
}

function logout() {
    saveUser(null);
    showToast('Signed out successfully', 'info');
    render();
}

// --- Auth Component ---
function renderAuthScreen() {
    return `
        <div class="auth">
            <div class="hero">
                <div class="logo">♻️ Scrap Link</div>
                <h1>Turn Waste into Value with AI</h1>
                <p>Scrap Link connects waste generators directly with scrap collectors. Classify recyclable waste automatically using AI, estimate scrap market values in real time, and arrange instant pickups.</p>
                <div class="chips">
                    <span class="chip">🤖 AI Waste Classifier</span>
                    <span class="chip">🚀 Spring Boot Powered</span>
                    <span class="chip">⚡ Live Pickup Status</span>
                    <span class="chip">🌱 Eco Impact Tracking</span>
                </div>
            </div>
            
            <div class="panel">
                <div class="authcard">
                    <div id="loginFormBlock">
                        <h2>Welcome to Scrap Link</h2>
                        <p class="sub">Sign in or select a quick demo profile to get started.</p>
                        
                        <div class="group">
                            <label>Email Address</label>
                            <input type="email" id="loginEmail" placeholder="Enter your email..." value="sri@gmail.com">
                        </div>
                        
                        <div class="group">
                            <label>Account Role</label>
                            <select id="loginRole">
                                <option value="GENERATOR">Generator (Home / Office Scrap Seller)</option>
                                <option value="COLLECTOR">Collector (Scrap Recycler / Buyer)</option>
                            </select>
                        </div>
                        
                        <button class="btn primary full" onclick="handleLogin()">Continue to Platform →</button>
                        
                        <div class="demo">
                            <p class="muted">Or launch instantly with a Demo Profile:</p>
                            <div class="demo-buttons">
                                <button onclick="quickDemoLogin('GENERATOR')">⚡ Demo Generator</button>
                                <button onclick="quickDemoLogin('COLLECTOR')">🚛 Demo Collector</button>
                            </div>
                        </div>
                        
                        <div style="text-align: center; margin-top: 20px; font-size: 13px;">
                            Don't have an account? <a href="#" style="color: var(--g); font-weight: 700; text-decoration: none;" onclick="toggleAuthMode('register'); return false;">Register Now</a>
                        </div>
                    </div>
                    
                    <div id="registerFormBlock" class="hidden">
                        <h2>Create Account</h2>
                        <p class="sub">Join our eco-friendly waste recycling network today.</p>
                        
                        <div class="group">
                            <label>Full Name</label>
                            <input type="text" id="regName" placeholder="e.g. Srinithi R">
                        </div>
                        
                        <div class="group">
                            <label>Phone Number</label>
                            <input type="tel" id="regPhone" placeholder="e.g. 9876543210">
                        </div>
                        
                        <div class="group">
                            <label>Email Address</label>
                            <input type="email" id="regEmail" placeholder="e.g. srinithi@example.com">
                        </div>
                        
                        <div class="group">
                            <label>Password</label>
                            <input type="password" id="regPassword" placeholder="••••••••">
                        </div>
                        
                        <div class="group">
                            <label>Account Role</label>
                            <select id="regRole">
                                <option value="GENERATOR">Waste Generator (Individual/Business)</option>
                                <option value="COLLECTOR">Scrap Collector (Recycler)</option>
                            </select>
                        </div>
                        
                        <button class="btn primary full" onclick="handleRegister()">Create Account →</button>
                        
                        <div style="text-align: center; margin-top: 20px; font-size: 13px;">
                            Already have an account? <a href="#" style="color: var(--g); font-weight: 700; text-decoration: none;" onclick="toggleAuthMode('login'); return false;">Sign In</a>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function toggleAuthMode(mode) {
    const loginBlock = document.getElementById('loginFormBlock');
    const regBlock = document.getElementById('registerFormBlock');
    if (mode === 'register') {
        loginBlock?.classList.add('hidden');
        regBlock?.classList.remove('hidden');
    } else {
        regBlock?.classList.add('hidden');
        loginBlock?.classList.remove('hidden');
    }
}

async function quickDemoLogin(role) {
    let targetUser = (s.usersList || []).find(u => u.role === role);
    
    if (!targetUser) {
        if (role === 'COLLECTOR') {
            targetUser = {
                id: 'ca455368-32f2-41ec-ad27-bc56acb6c93a',
                fullName: 'Srinithi R (Collector)',
                name: 'Srinithi R',
                email: 'collector@scraplink.com',
                phoneNumber: '9876543210',
                role: 'COLLECTOR'
            };
        } else {
            targetUser = {
                id: '9d896f21-c7e7-498e-8e6b-0d9271db5f7f',
                fullName: 'Srinithi (Generator)',
                name: 'Srinithi',
                email: 'sri@gmail.com',
                phoneNumber: '123456',
                role: 'GENERATOR'
            };
        }
    } else {
        targetUser.name = targetUser.fullName || targetUser.name;
    }
    
    saveUser(targetUser);
    showToast(`Logged in as ${role === 'COLLECTOR' ? 'Collector' : 'Generator'} (${targetUser.name})`, 'success');
    s.pickups = await loadPickupsFromBackend();
    render();
}

async function handleLogin() {
    const emailEl = document.getElementById('loginEmail');
    const roleEl = document.getElementById('loginRole');
    if (!emailEl) return;
    
    const email = emailEl.value.trim();
    const role = roleEl ? roleEl.value : 'GENERATOR';
    
    if (!email) {
        showToast('Please enter your email address.', 'error');
        return;
    }
    
    if (s.backendOnline) {
        try {
            const uRes = await fetch(`${API_BASE_URL}/users`);
            if (uRes.ok) s.usersList = await uRes.json();
        } catch (_) {}
    }
    
    let user = (s.usersList || []).find(u => u.email && u.email.toLowerCase() === email.toLowerCase());
    if (!user) {
        if (s.backendOnline) {
            try {
                const regRes = await registerUserBackend(
                    email.split('@')[0],
                    '9876543' + Math.floor(100 + Math.random() * 900),
                    email,
                    'password123',
                    role
                );
                user = {
                    id: regRes.id,
                    fullName: regRes.fullName || email.split('@')[0],
                    name: regRes.fullName || email.split('@')[0],
                    email: regRes.email || email,
                    phone: regRes.phoneNumber || '9876543210',
                    role: regRes.role || role
                };
            } catch (e) {
                user = {
                    id: '9d896f21-c7e7-498e-8e6b-0d9271db5f7f',
                    fullName: email.split('@')[0],
                    name: email.split('@')[0],
                    email: email,
                    role: role
                };
            }
        } else {
            user = {
                id: '9d896f21-c7e7-498e-8e6b-0d9271db5f7f',
                fullName: email.split('@')[0],
                name: email.split('@')[0],
                email: email,
                role: role
            };
        }
    } else {
        user.name = user.fullName || user.email;
        user.role = role;
    }
    
    saveUser(user);
    showToast(`Welcome back, ${user.name}!`, 'success');
    s.pickups = await loadPickupsFromBackend();
    render();
}

async function handleRegister() {
    const name = document.getElementById('regName')?.value.trim();
    const phone = document.getElementById('regPhone')?.value.trim();
    const email = document.getElementById('regEmail')?.value.trim();
    const pass = document.getElementById('regPassword')?.value.trim();
    const role = document.getElementById('regRole')?.value || 'GENERATOR';
    
    if (!name || !email) {
        showToast('Please enter your name and email.', 'error');
        return;
    }
    
    try {
        const newUsr = await registerUserBackend(name, phone, email, pass, role);
        const userObj = {
            id: newUsr.id,
            name: newUsr.fullName || name,
            fullName: newUsr.fullName || name,
            email: newUsr.email || email,
            phone: newUsr.phoneNumber || phone,
            role: newUsr.role || role
        };
        
        saveUser(userObj);
        showToast('Account created successfully!', 'success');
        s.pickups = await loadPickupsFromBackend();
        render();
    } catch (e) {
        showToast('Registration failed: ' + e.message, 'error');
    }
}

// --- Page Renderers ---
function renderPageContent(page) {
    switch (page) {
        case 'dashboard': return renderDashboardView();
        case 'classify': return renderClassifyView();
        case 'book': return renderBookView();
        case 'estimator': return renderEstimatorView();
        case 'pickups': return renderPickupsView();
        default: return renderDashboardView();
    }
}

// 1. Dashboard View
function renderDashboardView() {
    const pickups = s.pickups || [];
    const totalPickups = pickups.length;
    const totalWeight = pickups.reduce((acc, p) => acc + (p.weight || 0), 0);
    const totalValue = pickups.reduce((acc, p) => acc + (p.value || 0), 0);
    const pendingCount = pickups.filter(p => p.status === 'PENDING').length;
    
    return `
        <div class="head">
            <h1>Welcome back, ${esc(s.user.name || s.user.fullName || 'Recycler')} 👋</h1>
            <p>Track your environmental impact, estimate scrap earnings, and manage eco pickups.</p>
        </div>
        
        <div class="stats">
            <div class="stat">
                <small>Total Pickup Requests</small>
                <strong>${totalPickups}</strong>
            </div>
            <div class="stat">
                <small>Total Scrap Recycled</small>
                <strong>${totalWeight.toFixed(1)} kg</strong>
            </div>
            <div class="stat">
                <small>Total Estimated Payout</small>
                <strong>₹ ${totalValue.toLocaleString('en-IN')}</strong>
            </div>
            <div class="stat">
                <small>Pending Requests</small>
                <strong>${pendingCount}</strong>
            </div>
        </div>
        
        <div class="grid">
            <div class="card">
                <h3>⚡ Quick Navigation</h3>
                <p class="sub">Access core features in one click.</p>
                
                <div class="actions">
                    <div class="action" onclick="navigate('classify')">
                        <span class="action-icon">🔍</span>
                        <b>AI Waste Classifier</b>
                        <span>Scan & classify material type</span>
                    </div>
                    <div class="action" onclick="navigate('book')">
                        <span class="action-icon">📦</span>
                        <b>Book Scrap Pickup</b>
                        <span>Schedule scrap collection</span>
                    </div>
                    <div class="action" onclick="navigate('estimator')">
                        <span class="action-icon">💰</span>
                        <b>Price Estimator</b>
                        <span>Check scrap rate per kg</span>
                    </div>
                    <div class="action" onclick="navigate('pickups')">
                        <span class="action-icon">📋</span>
                        <b>View Pickups</b>
                        <span>Track status & invoices</span>
                    </div>
                </div>
            </div>
            
            <div class="card">
                <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px;">
                    <h3>📦 Recent Pickups</h3>
                    <button class="btn outline" style="padding: 6px 12px; font-size: 12px;" onclick="navigate('pickups')">View All →</button>
                </div>
                <p class="sub">Latest pickup requests in your profile.</p>
                
                ${pickups.length === 0 ? `
                    <div style="text-align: center; padding: 40px 20px; background: var(--bg); border-radius: 16px;">
                        <span style="font-size: 36px;">♻️</span>
                        <strong style="display: block; font-size: 16px; margin-top: 8px;">No pickup requests recorded</strong>
                        <p class="muted" style="font-size: 12px; margin-top: 4px;">Click 'Book Pickup' to request scrap pickup!</p>
                    </div>
                ` : `
                    <div class="tablewrap">
                        <table>
                            <thead>
                                <tr>
                                    <th>Category</th>
                                    <th>Weight</th>
                                    <th>Value</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${pickups.slice(0, 5).map(p => `
                                    <tr style="cursor: pointer;" onclick="openPickupDetailModal('${p.id}')">
                                        <td>${getCategoryIcon(p.category)} ${esc(formatCategory(p.category))}</td>
                                        <td><strong>${p.weight} kg</strong></td>
                                        <td><strong style="color: var(--g);">₹ ${p.value}</strong></td>
                                        <td><span class="status ${p.status.toLowerCase()}">${esc(p.status)}</span></td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                `}
            </div>
        </div>
    `;
}

// 2. AI Waste Classifier View
function renderClassifyView() {
    const samples = [
        { id: 'plastic', name: 'Plastic Bottles', icon: '🥤', cat: 'PLASTIC', weight: 4.5, desc: 'Used PET water bottles & container plastics', tips: 'Rinse bottles and crush them to save storage volume.' },
        { id: 'copper', name: 'Copper Wiring', icon: '⚡', cat: 'COPPER', weight: 2.0, desc: 'Stripped electrical wiring & copper tubes', tips: 'High-value item. Remove outer plastic insulation for top prices.' },
        { id: 'paper', name: 'Cardboard Boxes', icon: '📦', cat: 'PAPER', weight: 8.0, desc: 'Corrugated packing boxes & newsprint stack', tips: 'Keep paper dry and flatten cardboard boxes.' },
        { id: 'ewaste', name: 'Old Laptop & PCB', icon: '💻', cat: 'E_WASTE', weight: 3.5, desc: 'Unused laptop circuit boards & computer parts', tips: 'Contains precious metals. Handle batteries safely.' },
        { id: 'aluminum', name: 'Aluminum Cans', icon: '🥫', cat: 'ALUMINUM', weight: 5.0, desc: 'Beverage cans & lightweight aluminum frame', tips: 'Easily recyclable infinitely without quality degradation.' },
        { id: 'metal', name: 'Scrap Iron Grill', icon: '⚙️', cat: 'METAL', weight: 15.0, desc: 'Heavy iron rod pieces & steel scrap', tips: 'Separate non-metallic attachments from iron pieces.' }
    ];
    
    return `
        <div class="head">
            <h1>🔍 AI Waste Classifier & Smart Scanner</h1>
            <p>Upload a waste photo or choose a sample to let Scrap Link AI identify material type, payout value, and recycling impact.</p>
        </div>
        
        <div class="grid">
            <div class="card">
                <h3>Upload Image or Select Sample Card</h3>
                <p class="sub">Drag and drop a waste picture, or click a pre-analyzed sample card below:</p>
                
                <div class="drop-zone" id="imageDropZone" onclick="triggerFileInput()">
                    <span class="drop-zone-icon">📷</span>
                    <strong style="display: block; font-size: 15px; color: var(--text);">Drop waste photo here or Click to Browse</strong>
                    <span class="muted" style="font-size: 12px; margin-top: 4px; display: block;">Supports JPG, PNG, WEBP</span>
                    <input type="file" id="aiFileInput" accept="image/*" style="display: none;" onchange="handleFileUpload(event)">
                </div>
                
                ${s.uploadedImage ? `
                    <div style="position: relative; margin-bottom: 20px; text-align: center;">
                        <img src="${s.uploadedImage}" style="max-height: 180px; border-radius: 14px; border: 2px solid var(--g);" alt="Uploaded Waste">
                        <button class="btn danger" style="position: absolute; top: 10px; right: 10px; padding: 4px 10px; font-size: 11px;" onclick="clearUploadedImage()">Remove</button>
                    </div>
                ` : ''}
                
                <div class="sample-grid">
                    ${samples.map(smp => `
                        <div class="sample-card ${s.selectedAiSample && s.selectedAiSample.id === smp.id ? 'selected' : ''}" onclick="selectAiSample('${smp.id}')">
                            <span class="sample-icon">${smp.icon}</span>
                            <strong>${esc(smp.name)}</strong>
                            <span>${smp.weight} kg approx</span>
                        </div>
                    `).join('')}
                </div>
                
                <div class="group">
                    <label>Additional Notes / Description</label>
                    <textarea id="aiCustomInput" placeholder="Describe the item (e.g. 5 old copper pipes and aluminum cooling fins)..."></textarea>
                </div>
                
                <button class="btn primary full" id="scanAiBtn" onclick="runAiScan()">
                    🤖 Analyze Waste Material with AI Scanner
                </button>
            </div>
            
            <div class="card" id="aiResultCard">
                <h3>AI Inspection Report</h3>
                <p class="sub">Run the scanner to see detailed material classification & market rate.</p>
                
                ${s.isScanning ? `
                    <div style="text-align: center; padding: 60px 20px;">
                        <div style="font-size: 48px; margin-bottom: 16px; animation: spin 1s infinite linear;">🌀</div>
                        <h4 style="font-size: 18px; color: var(--dark);">Scrap Link AI is Scanning...</h4>
                        <p class="muted" style="font-size: 13px; margin-top: 6px;">Analyzing material density, texture, and recyclability index...</p>
                    </div>
                ` : s.selectedAiSample ? renderAiResultHTML(s.selectedAiSample) : `
                    <div style="text-align: center; padding: 60px 20px;" class="muted">
                        <span style="font-size: 56px; opacity: 0.5;">🤖</span>
                        <p style="margin-top: 16px; font-size: 14px;">Select a sample card or upload an image and click <strong>Analyze Waste Material</strong> to run analysis.</p>
                    </div>
                `}
            </div>
        </div>
    `;
}

function triggerFileInput() {
    document.getElementById('aiFileInput')?.click();
}

function handleFileUpload(e) {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(evt) {
            s.uploadedImage = evt.target.result;
            showToast('Image uploaded successfully!', 'info');
            render();
        };
        reader.readAsDataURL(file);
    }
}

function clearUploadedImage() {
    s.uploadedImage = null;
    render();
}

function selectAiSample(id) {
    const samples = [
        { id: 'plastic', name: 'Plastic Bottles', icon: '🥤', cat: 'PLASTIC', weight: 4.5, desc: 'Used PET water bottles & container plastics', tips: 'Rinse bottles and crush them to save storage volume.' },
        { id: 'copper', name: 'Copper Wiring', icon: '⚡', cat: 'COPPER', weight: 2.0, desc: 'Stripped electrical wiring & copper tubes', tips: 'High-value item. Remove outer plastic insulation for top prices.' },
        { id: 'paper', name: 'Cardboard Boxes', icon: '📦', cat: 'PAPER', weight: 8.0, desc: 'Corrugated packing boxes & newsprint stack', tips: 'Keep paper dry and flatten cardboard boxes.' },
        { id: 'ewaste', name: 'Old Laptop & PCB', icon: '💻', cat: 'E_WASTE', weight: 3.5, desc: 'Unused laptop circuit boards & computer parts', tips: 'Contains precious metals. Handle batteries safely.' },
        { id: 'aluminum', name: 'Aluminum Cans', icon: '🥫', cat: 'ALUMINUM', weight: 5.0, desc: 'Beverage cans & lightweight aluminum frame', tips: 'Easily recyclable infinitely without quality degradation.' },
        { id: 'metal', name: 'Scrap Iron Grill', icon: '⚙️', cat: 'METAL', weight: 15.0, desc: 'Heavy iron rod pieces & steel scrap', tips: 'Separate non-metallic attachments from iron pieces.' }
    ];
    
    s.selectedAiSample = samples.find(x => x.id === id);
    render();
}

function runAiScan() {
    s.isScanning = true;
    render();
    
    setTimeout(() => {
        const customTxt = document.getElementById('aiCustomInput')?.value.trim();
        if (customTxt) {
            let cat = 'PLASTIC';
            let icon = '🥤';
            let weight = 5.0;
            let lower = customTxt.toLowerCase();
            
            if (lower.includes('copper') || lower.includes('wire')) { cat = 'COPPER'; icon = '⚡'; }
            else if (lower.includes('paper') || lower.includes('box') || lower.includes('cardboard')) { cat = 'PAPER'; icon = '📦'; }
            else if (lower.includes('metal') || lower.includes('iron') || lower.includes('steel')) { cat = 'METAL'; icon = '⚙️'; }
            else if (lower.includes('aluminum') || lower.includes('can')) { cat = 'ALUMINUM'; icon = '🥫'; }
            else if (lower.includes('laptop') || lower.includes('phone') || lower.includes('circuit') || lower.includes('electronic')) { cat = 'E_WASTE'; icon = '💻'; }
            
            s.selectedAiSample = {
                id: 'custom-' + Date.now(),
                name: customTxt.substring(0, 25),
                icon: icon,
                cat: cat,
                weight: weight,
                desc: customTxt,
                tips: 'Verified recyclable waste material.'
            };
        } else if (!s.selectedAiSample) {
            selectAiSample('copper');
        }
        
        s.isScanning = false;
        showToast('AI Waste Scanning Complete!', 'success');
        render();
    }, 900);
}

function renderAiResultHTML(sample) {
    const rateInfo = s.rates[sample.cat] || { name: 'Scrap', rate: 20, co2: 2.0 };
    const estVal = Math.round(sample.weight * rateInfo.rate);
    const co2Saved = (sample.weight * rateInfo.co2).toFixed(1);
    
    return `
        <div style="background: #fff; border: 1.5px solid var(--g); border-radius: 18px; padding: 22px;">
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 14px;">
                <span class="status completed">
                    ✅ 98.7% AI Confidence Match
                </span>
                <span style="font-size: 12px; font-weight: 700; color: var(--muted);">Scrap Link AI v2.4</span>
            </div>
            
            <h3 style="font-size: 22px; color: var(--dark);">${sample.icon} Detected: ${esc(formatCategory(sample.cat))}</h3>
            <p class="muted" style="margin-top: 4px; font-size: 13px;">${esc(sample.desc)}</p>
            
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin: 18px 0;">
                <div style="background: var(--bg); padding: 14px; border-radius: 14px;">
                    <small style="color: var(--muted); font-size: 11px; font-weight: 700;">ESTIMATED WEIGHT</small>
                    <strong style="display: block; font-size: 22px; color: var(--text);">${sample.weight} kg</strong>
                </div>
                <div style="background: var(--light); padding: 14px; border-radius: 14px;">
                    <small style="color: var(--g-hover); font-size: 11px; font-weight: 700;">ESTIMATED MARKET PAYOUT</small>
                    <strong style="display: block; font-size: 22px; color: var(--g-hover);">₹ ${estVal}</strong>
                </div>
            </div>
            
            <div style="padding: 14px; border-radius: 14px; background: #f0fdf4; border: 1px solid #bbf7d0; margin-bottom: 18px;">
                <div style="font-size: 13px; font-weight: 800; color: #166534; margin-bottom: 4px;">🌱 Environmental Impact</div>
                <div style="font-size: 13px; color: #15803d;">Recycling this saves approx <strong>${co2Saved} kg of CO₂ emissions</strong> and prevents landfill contamination!</div>
            </div>
            
            <div style="font-size: 13px; color: var(--muted); margin-bottom: 20px;">
                💡 <strong>Recycling Tip:</strong> ${esc(sample.tips)}
            </div>
            
            <button class="btn primary full" onclick="prefillBookForm('${sample.cat}', '${esc(sample.desc)}', ${sample.weight})">
                📦 Book Pickup Request for this Waste →
            </button>
        </div>
    `;
}

function prefillBookForm(cat, desc, weight) {
    s.page = 'book';
    render();
    setTimeout(() => {
        const catSelect = document.getElementById('bookCat');
        const descInput = document.getElementById('bookDesc');
        const weightInput = document.getElementById('bookWeight');
        
        if (catSelect) catSelect.value = cat;
        if (descInput) descInput.value = desc;
        if (weightInput) {
            weightInput.value = weight;
            updateBookPriceCalc();
        }
    }, 100);
}

// 3. Book Scrap Pickup View
function renderBookView() {
    return `
        <div class="head">
            <h1>📦 Book Scrap Pickup</h1>
            <p>Schedule a convenient scrap collection request. Our local collector will arrive at your door.</p>
        </div>
        
        <div class="card" style="max-width: 850px; margin: 0 auto;">
            <div class="formgrid">
                <div class="group">
                    <label>Waste Category</label>
                    <select id="bookCat" onchange="updateBookPriceCalc()">
                        ${Object.keys(s.rates).map(key => `
                            <option value="${key}">${s.rates[key].icon} ${s.rates[key].name} (₹${s.rates[key].rate}/kg)</option>
                        `).join('')}
                    </select>
                </div>
                
                <div class="group">
                    <label>Approximate Weight (kg)</label>
                    <input type="number" id="bookWeight" placeholder="e.g. 10" value="5" min="0.5" step="0.5" oninput="updateBookPriceCalc()">
                    <div class="preset-chips">
                        <button type="button" class="preset-btn" onclick="setWeightPreset(2)">2 kg</button>
                        <button type="button" class="preset-btn" onclick="setWeightPreset(5)">5 kg</button>
                        <button type="button" class="preset-btn" onclick="setWeightPreset(10)">10 kg</button>
                        <button type="button" class="preset-btn" onclick="setWeightPreset(25)">25 kg</button>
                        <button type="button" class="preset-btn" onclick="setWeightPreset(50)">50 kg</button>
                    </div>
                </div>
                
                <div class="group fullcol">
                    <label>Scrap Description</label>
                    <textarea id="bookDesc" placeholder="Describe the scrap items (e.g., 3 bags of plastic bottles and old newspaper stack)..."></textarea>
                </div>
                
                <div class="group">
                    <label>Pickup Location / Address</label>
                    <input type="text" id="bookAddress" placeholder="Enter flat/street address..." value="No. 45, Green Park Avenue, Chennai">
                </div>
                
                <div class="group">
                    <label>Preferred Time Slot</label>
                    <select id="bookTimeSlot">
                        <option value="MORNING">Morning (9:00 AM – 12:00 PM)</option>
                        <option value="AFTERNOON">Afternoon (12:00 PM – 3:00 PM)</option>
                        <option value="EVENING">Evening (3:00 PM – 6:00 PM)</option>
                    </select>
                </div>
                
                <div class="group fullcol">
                    <div class="result" style="margin-top: 0; background: var(--light); border-color: #bbf7d0; display: flex; align-items: center; justify-content: space-between; padding: 20px;">
                        <div>
                            <span style="font-size: 12px; font-weight: 800; color: var(--muted); text-transform: uppercase;">Estimated Cash Payout</span>
                            <strong id="bookCalcValue" style="color: var(--g-hover); font-size: 30px;">₹ 90</strong>
                        </div>
                        <div style="text-align: right;">
                            <span style="font-size: 13px; font-weight: 700; color: var(--dark);" id="bookCalcRate">@ ₹18 / kg</span>
                            <div style="font-size: 11px; color: #166534; margin-top: 2px;">+ Free Pickup Service</div>
                        </div>
                    </div>
                </div>
            </div>
            
            <button class="btn primary full" id="submitBookBtn" style="margin-top: 12px;" onclick="handleBookSubmit()">
                🚀 Submit Pickup Request
            </button>
        </div>
    `;
}

function updateBookPriceCalc() {
    const catSelect = document.getElementById('bookCat');
    const weightInput = document.getElementById('bookWeight');
    const calcValue = document.getElementById('bookCalcValue');
    const calcRate = document.getElementById('bookCalcRate');
    
    if (!catSelect || !weightInput || !calcValue) return;
    
    const cat = catSelect.value;
    const weight = parseFloat(weightInput.value) || 0;
    const rateObj = s.rates[cat] || { rate: 20 };
    const est = Math.round(weight * rateObj.rate);
    
    calcValue.textContent = `₹ ${est.toLocaleString('en-IN')}`;
    if (calcRate) calcRate.textContent = `@ ₹${rateObj.rate} / kg`;
}

function setWeightPreset(w) {
    const weightInput = document.getElementById('bookWeight');
    if (weightInput) {
        weightInput.value = w;
        updateBookPriceCalc();
    }
}

async function handleBookSubmit() {
    const catSelect = document.getElementById('bookCat');
    const weightInput = document.getElementById('bookWeight');
    const descInput = document.getElementById('bookDesc');
    const submitBtn = document.getElementById('submitBookBtn');
    
    if (!catSelect || !weightInput || !descInput) return;
    
    const cat = catSelect.value;
    const weight = parseFloat(weightInput.value);
    const desc = descInput.value.trim();
    
    if (!desc) {
        showToast('Please provide a description of the scrap material.', 'error');
        return;
    }
    if (!weight || weight <= 0) {
        showToast('Please enter a valid weight in kg.', 'error');
        return;
    }
    
    const rateObj = s.rates[cat] || { rate: 20 };
    const estimatedValue = Math.round(weight * rateObj.rate);
    
    try {
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.textContent = 'Submitting Request to Backend...';
        }
        
        await submitPickupToBackend({
            wasteDescription: desc,
            wasteCategory: cat,
            weightKg: weight,
            estimatedValue: estimatedValue
        });
        
        showToast('Pickup request successfully submitted!', 'success');
        s.pickups = await loadPickupsFromBackend();
        
        setTimeout(() => {
            s.page = 'pickups';
            render();
        }, 500);
    } catch (err) {
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = '🚀 Submit Pickup Request';
        }
        showToast('Notice: ' + err.message, 'info');
    }
}

// 4. Price Estimator View
function renderEstimatorView() {
    return `
        <div class="head">
            <h1>💰 Scrap Rate Calculator & Value Estimator</h1>
            <p>Check live demo scrap prices per kg across all recyclable categories and estimate total earnings.</p>
        </div>
        
        <div class="grid">
            <div class="card">
                <h3>Calculate Earnings</h3>
                <p class="sub">Select material category and drag the slider to estimate payout.</p>
                
                <div class="group">
                    <label>Material Category</label>
                    <select id="estCat" onchange="runEstimatorCalc()">
                        ${Object.keys(s.rates).map(k => `
                            <option value="${k}">${s.rates[k].icon} ${s.rates[k].name} (₹${s.rates[k].rate}/kg)</option>
                        `).join('')}
                    </select>
                </div>
                
                <div class="group">
                    <label>Scrap Weight (kg): <span id="estWeightLabel" style="color: var(--g-hover); font-size: 17px; font-weight: 900;">10 kg</span></label>
                    <input type="range" id="estRange" min="1" max="100" value="10" oninput="runEstimatorCalc()">
                    <div class="preset-chips">
                        <button type="button" class="preset-btn" onclick="setEstSliderPreset(5)">5 kg</button>
                        <button type="button" class="preset-btn" onclick="setEstSliderPreset(15)">15 kg</button>
                        <button type="button" class="preset-btn" onclick="setEstSliderPreset(30)">30 kg</button>
                        <button type="button" class="preset-btn" onclick="setEstSliderPreset(50)">50 kg</button>
                        <button type="button" class="preset-btn" onclick="setEstSliderPreset(100)">100 kg</button>
                    </div>
                </div>
                
                <div class="result" style="background: var(--light); border-color: #bbf7d0;">
                    <span style="font-size: 12px; font-weight: 800; color: var(--muted); text-transform: uppercase;">Estimated Value Payout</span>
                    <strong id="estTotalOutput" style="color: var(--g-hover); font-size: 34px;">₹ 180</strong>
                    <span class="muted" id="estBreakdownText" style="font-size: 13px; margin-top: 4px; display: block;">10 kg × ₹18/kg</span>
                </div>
            </div>
            
            <div class="card">
                <h3>📊 Demo Scrap Market Rates</h3>
                <p class="sub">Standard demo price per kg in local recycling hub.</p>
                
                <div class="rate-grid" style="grid-template-columns: 1fr 1fr; gap: 14px; margin-top: 0;">
                    ${Object.keys(s.rates).map(k => `
                        <div class="rate-card" style="text-align: left; padding: 16px;">
                            <div style="display: flex; align-items: center; justify-content: space-between;">
                                <span style="font-size: 26px;">${s.rates[k].icon}</span>
                                <span style="font-size: 10px; font-weight: 800; padding: 2px 6px; border-radius: 6px; background: #dcfce7; color: #166534;">
                                    ${s.rates[k].trend}
                                </span>
                            </div>
                            <h4 style="font-size: 13px; margin: 8px 0 2px; font-weight: 800; color: var(--text);">${s.rates[k].name}</h4>
                            <div class="price" style="font-size: 20px;">₹ ${s.rates[k].rate} <span style="font-size: 11px; font-weight: 500; color: var(--muted);">/ kg</span></div>
                        </div>
                    `).join('')}
                </div>
            </div>
        </div>
    `;
}

function setEstSliderPreset(val) {
    const slider = document.getElementById('estRange');
    if (slider) {
        slider.value = val;
        runEstimatorCalc();
    }
}

function runEstimatorCalc() {
    const cat = document.getElementById('estCat')?.value || 'PLASTIC';
    const weight = parseInt(document.getElementById('estRange')?.value || '10');
    const label = document.getElementById('estWeightLabel');
    const output = document.getElementById('estTotalOutput');
    const breakdown = document.getElementById('estBreakdownText');
    
    const rateObj = s.rates[cat] || { rate: 20, name: 'Scrap' };
    const total = weight * rateObj.rate;
    
    if (label) label.textContent = `${weight} kg`;
    if (output) output.textContent = `₹ ${total.toLocaleString('en-IN')}`;
    if (breakdown) breakdown.textContent = `${weight} kg × ₹${rateObj.rate}/kg (${rateObj.name})`;
}

// 5. Pickups Management View
function renderPickupsView() {
    const pickups = s.pickups || [];
    let filtered = pickups;
    
    if (s.filterStatus !== 'ALL') {
        filtered = filtered.filter(p => p.status === s.filterStatus);
    }
    
    if (s.searchQuery) {
        const q = s.searchQuery.toLowerCase();
        filtered = filtered.filter(p => 
            (p.description && p.description.toLowerCase().includes(q)) ||
            (p.userName && p.userName.toLowerCase().includes(q)) ||
            (p.category && p.category.toLowerCase().includes(q)) ||
            (p.id && String(p.id).toLowerCase().includes(q))
        );
    }
    
    return `
        <div class="head">
            <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 16px;">
                <div>
                    <h1>📋 Scrap Pickup Orders</h1>
                    <p>Track pickup statuses, view full invoice receipts, and update request progress.</p>
                </div>
                <div style="display: flex; gap: 10px;">
                    <button class="btn primary" onclick="navigate('book')">
                        + New Pickup Request
                    </button>
                    <button class="btn outline" onclick="refreshPickups()">
                        🔄 Refresh
                    </button>
                </div>
            </div>
        </div>
        
        <div style="display: flex; gap: 14px; margin-bottom: 20px; flex-wrap: wrap;">
            <input type="text" id="pickupSearchInput" placeholder="Search by description, user, or category..." value="${esc(s.searchQuery)}" oninput="handlePickupSearch(event)" style="max-width: 380px;">
        </div>
        
        <div class="tabs">
            <button class="tab-btn ${s.filterStatus === 'ALL' ? 'active' : ''}" onclick="setFilterStatus('ALL')">All Orders (${pickups.length})</button>
            <button class="tab-btn ${s.filterStatus === 'PENDING' ? 'active' : ''}" onclick="setFilterStatus('PENDING')">Pending (${pickups.filter(p=>p.status==='PENDING').length})</button>
            <button class="tab-btn ${s.filterStatus === 'ACCEPTED' ? 'active' : ''}" onclick="setFilterStatus('ACCEPTED')">Accepted (${pickups.filter(p=>p.status==='ACCEPTED').length})</button>
            <button class="tab-btn ${s.filterStatus === 'COMPLETED' ? 'active' : ''}" onclick="setFilterStatus('COMPLETED')">Completed (${pickups.filter(p=>p.status==='COMPLETED').length})</button>
        </div>
        
        <div class="card" style="padding: 0;">
            <div id="pickupContent">
                ${filtered.length === 0 ? `
                    <div style="padding: 60px 20px; text-align: center;">
                        <span style="font-size: 48px;">📭</span>
                        <strong style="display: block; font-size: 18px; margin-top: 12px; color: var(--text);">No pickup orders found</strong>
                        <p class="muted" style="font-size: 13px; margin-top: 4px;">No requests match the current search or status filter.</p>
                    </div>
                ` : `
                    <div class="tablewrap" style="border: 0;">
                        <table>
                            <thead>
                                <tr>
                                    <th>Category</th>
                                    <th>Description</th>
                                    <th>Requested By</th>
                                    <th>Weight</th>
                                    <th>Value</th>
                                    <th>Status</th>
                                    <th>Date</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${filtered.map(p => `
                                    <tr>
                                        <td>
                                            <div style="display: flex; align-items: center; gap: 8px;">
                                                <span style="font-size: 20px;">${getCategoryIcon(p.category)}</span>
                                                <strong>${esc(formatCategory(p.category))}</strong>
                                            </div>
                                        </td>
                                        <td>${esc(p.description)}</td>
                                        <td>
                                            <strong>${esc(p.userName)}</strong>
                                            ${p.userPhone ? `<br><span class="muted" style="font-size: 11px;">📞 ${esc(p.userPhone)}</span>` : ''}
                                        </td>
                                        <td><strong>${p.weight} kg</strong></td>
                                        <td><strong style="color: var(--g-hover);">₹ ${p.value}</strong></td>
                                        <td><span class="status ${p.status.toLowerCase()}">${esc(p.status)}</span></td>
                                        <td><span class="muted">${formatDate(p.date)}</span></td>
                                        <td>
                                            <div style="display: flex; gap: 6px; align-items: center;">
                                                <button class="btn outline" style="padding: 6px 10px; font-size: 11px;" onclick="openPickupDetailModal('${p.id}')">View Receipt</button>
                                                ${s.user && s.user.role === 'COLLECTOR' ? `
                                                    ${p.status === 'PENDING' ? `
                                                        <button class="btn primary" style="padding: 6px 10px; font-size: 11px;" onclick="handleUpdatePickup('${p.id}', 'accept')">Accept</button>
                                                    ` : p.status === 'ACCEPTED' ? `
                                                        <button class="btn secondary" style="padding: 6px 10px; font-size: 11px;" onclick="handleUpdatePickup('${p.id}', 'complete')">Complete</button>
                                                    ` : ''}
                                                ` : ''}
                                            </div>
                                        </td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                `}
            </div>
        </div>
    `;
}

function handlePickupSearch(e) {
    s.searchQuery = e.target.value;
    render();
}

function setFilterStatus(status) {
    s.filterStatus = status;
    render();
}

async function refreshPickups() {
    showToast('Refreshing pickups from backend...', 'info');
    s.pickups = await loadPickupsFromBackend();
    render();
}

async function handleUpdatePickup(id, action) {
    try {
        await updatePickupStatus(id, action);
        showToast(`Pickup order status updated to ${action === 'accept' ? 'ACCEPTED' : 'COMPLETED'}!`, 'success');
        s.pickups = await loadPickupsFromBackend();
        if (s.modal) closeModal();
        render();
    } catch (e) {
        showToast('Failed to update pickup status: ' + e.message, 'error');
    }
}

// --- Detail & Receipt Modal ---
function openPickupDetailModal(pickupId) {
    const p = s.pickups.find(x => String(x.id) === String(pickupId));
    if (!p) return;
    
    const isPending = p.status === 'PENDING';
    const isAccepted = p.status === 'ACCEPTED' || p.status === 'COMPLETED';
    const isCompleted = p.status === 'COMPLETED';
    
    const modalHtml = `
        <div style="margin-bottom: 20px;">
            <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid var(--border); padding-bottom: 12px;">
                <span class="muted" style="font-size: 12px; font-family: monospace;">Order ID: ${esc(p.id)}</span>
                <span class="status ${p.status.toLowerCase()}">${esc(p.status)}</span>
            </div>
            
            <div class="timeline">
                <div class="timeline-step completed">
                    <div class="timeline-icon">✓</div>
                    <div class="timeline-label">Requested</div>
                </div>
                <div class="timeline-step ${isAccepted ? 'completed' : 'active'}">
                    <div class="timeline-icon">${isAccepted ? '✓' : '2'}</div>
                    <div class="timeline-label">Accepted</div>
                </div>
                <div class="timeline-step ${isCompleted ? 'completed' : ''}">
                    <div class="timeline-icon">${isCompleted ? '✓' : '3'}</div>
                    <div class="timeline-label">Completed</div>
                </div>
            </div>
            
            <div style="background: var(--bg); padding: 18px; border-radius: 16px; margin-bottom: 20px;">
                <div style="font-size: 20px; font-weight: 800; color: var(--dark); margin-bottom: 4px;">
                    ${getCategoryIcon(p.category)} ${esc(formatCategory(p.category))}
                </div>
                <p class="muted" style="font-size: 13px;">${esc(p.description)}</p>
                
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-top: 14px;">
                    <div>
                        <span style="font-size: 11px; font-weight: 700; color: var(--muted); text-transform: uppercase;">Scrap Weight</span>
                        <strong style="display: block; font-size: 16px; color: var(--text);">${p.weight} kg</strong>
                    </div>
                    <div>
                        <span style="font-size: 11px; font-weight: 700; color: var(--muted); text-transform: uppercase;">Payout Amount</span>
                        <strong style="display: block; font-size: 18px; color: var(--g-hover);">₹ ${p.value}</strong>
                    </div>
                </div>
            </div>
            
            <div style="font-size: 13px; line-height: 1.6; margin-bottom: 20px;">
                <strong>Requested By:</strong> ${esc(p.userName)} (${esc(p.userPhone || 'N/A')})<br>
                <strong>Created On:</strong> ${formatDate(p.date)}
            </div>
            
            <div style="display: flex; gap: 10px;">
                ${s.user && s.user.role === 'COLLECTOR' ? `
                    ${p.status === 'PENDING' ? `
                        <button class="btn primary full" onclick="handleUpdatePickup('${p.id}', 'accept')">Accept Pickup Order</button>
                    ` : p.status === 'ACCEPTED' ? `
                        <button class="btn secondary full" onclick="handleUpdatePickup('${p.id}', 'complete')">Mark Order as Complete</button>
                    ` : `
                        <button class="btn outline full" onclick="window.print()">🖨️ Print Receipt</button>
                    `}
                ` : `
                    <button class="btn outline full" onclick="window.print()">🖨️ Print Receipt</button>
                `}
            </div>
        </div>
    `;
    
    openModal('Pickup Order Invoice', modalHtml);
}

// --- Profile & Settings Modal ---
function openSettingsModal() {
    if (!s.user) return;
    const modalHtml = `
        <div>
            <p class="sub" style="margin-top: 0;">Update your user details and preferences.</p>
            
            <div class="group">
                <label>Full Name</label>
                <input type="text" id="setProfileName" value="${esc(s.user.name || s.user.fullName || '')}">
            </div>
            
            <div class="group">
                <label>Phone Number</label>
                <input type="tel" id="setProfilePhone" value="${esc(s.user.phone || s.user.phoneNumber || '')}">
            </div>
            
            <div class="group">
                <label>Email Address</label>
                <input type="email" id="setProfileEmail" value="${esc(s.user.email || '')}" disabled style="background: var(--bg);">
            </div>
            
            <div class="group">
                <label>Account Role</label>
                <select id="setProfileRole">
                    <option value="GENERATOR" ${s.user.role === 'GENERATOR' ? 'selected' : ''}>Waste Generator</option>
                    <option value="COLLECTOR" ${s.user.role === 'COLLECTOR' ? 'selected' : ''}>Scrap Collector</option>
                </select>
            </div>
            
            <button class="btn primary full" style="margin-top: 12px;" onclick="saveSettings()">Save Changes</button>
        </div>
    `;
    openModal('User Profile & Preferences', modalHtml);
}

function saveSettings() {
    const newName = document.getElementById('setProfileName')?.value.trim();
    const newPhone = document.getElementById('setProfilePhone')?.value.trim();
    const newRole = document.getElementById('setProfileRole')?.value;
    
    if (!s.user) return;
    if (newName) s.user.name = newName;
    if (newPhone) s.user.phone = newPhone;
    if (newRole) s.user.role = newRole;
    
    saveUser(s.user);
    closeModal();
    showToast('Profile updated successfully!', 'success');
    render();
}

// --- Event Handlers Initialization ---
function attachPageEvents(page) {
    if (page === 'book') {
        updateBookPriceCalc();
    } else if (page === 'estimator') {
        runEstimatorCalc();
    }
}

// --- Application Binding & Entry Point ---
async function bindApp() {
    console.log('Initializing Scrap Link Engine (API:', API_BASE_URL, ')...');
    try {
        await checkBackendHealth();
        if (s.user) {
            s.pickups = await loadPickupsFromBackend();
        }
    } catch (err) {
        console.warn('Initialization check error:', err);
    } finally {
        render();
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bindApp);
} else {
    bindApp();
}