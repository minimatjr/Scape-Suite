import React, { useState, useEffect, useCallback } from 'react';

// Supabase client configuration
const SUPABASE_URL = 'YOUR_SUPABASE_URL';
const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY';

// Simple Supabase client wrapper
const supabase = {
  from: (table) => ({
    select: async (columns = '*') => {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/${table}?select=${columns}`, {
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json'
        }
      });
      const data = await response.json();
      return { data, error: response.ok ? null : data };
    },
    insert: async (record) => {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
        method: 'POST',
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        },
        body: JSON.stringify(record)
      });
      const data = await response.json();
      return { data, error: response.ok ? null : data };
    },
    update: async (record) => ({
      eq: async (column, value) => {
        const response = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${column}=eq.${value}`, {
          method: 'PATCH',
          headers: {
            'apikey': SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation'
          },
          body: JSON.stringify(record)
        });
        const data = await response.json();
        return { data, error: response.ok ? null : data };
      }
    }),
    delete: async () => ({
      eq: async (column, value) => {
        const response = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${column}=eq.${value}`, {
          method: 'DELETE',
          headers: {
            'apikey': SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json'
          }
        });
        return { error: response.ok ? null : await response.json() };
      }
    })
  }),
  auth: {
    getUser: async () => {
      // In production, implement proper auth
      return { data: { user: { id: 'demo-user-id' } } };
    }
  }
};

// Icons as SVG components
const Icons = {
  Users: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
      <circle cx="9" cy="7" r="4"/>
      <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
      <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  ),
  Folder: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
    </svg>
  ),
  Plus: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19"/>
      <line x1="5" y1="12" x2="19" y2="12"/>
    </svg>
  ),
  Search: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8"/>
      <line x1="21" y1="21" x2="16.65" y2="16.65"/>
    </svg>
  ),
  Edit: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
    </svg>
  ),
  Trash: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6"/>
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
    </svg>
  ),
  X: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18"/>
      <line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
  ),
  ChevronRight: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 18 15 12 9 6"/>
    </svg>
  ),
  File: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
      <polyline points="14 2 14 8 20 8"/>
      <line x1="16" y1="13" x2="8" y2="13"/>
      <line x1="16" y1="17" x2="8" y2="17"/>
      <polyline points="10 9 9 9 8 9"/>
    </svg>
  ),
  Invoice: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="3" width="20" height="18" rx="2"/>
      <line x1="8" y1="7" x2="16" y2="7"/>
      <line x1="8" y1="11" x2="16" y2="11"/>
      <line x1="8" y1="15" x2="12" y2="15"/>
    </svg>
  ),
  Quote: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
    </svg>
  ),
  Calendar: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
      <line x1="16" y1="2" x2="16" y2="6"/>
      <line x1="8" y1="2" x2="8" y2="6"/>
      <line x1="3" y1="10" x2="21" y2="10"/>
    </svg>
  ),
  Building: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="2" width="16" height="20" rx="2" ry="2"/>
      <path d="M9 22v-4h6v4"/>
      <line x1="8" y1="6" x2="8" y2="6"/>
      <line x1="12" y1="6" x2="12" y2="6"/>
      <line x1="16" y1="6" x2="16" y2="6"/>
      <line x1="8" y1="10" x2="8" y2="10"/>
      <line x1="12" y1="10" x2="12" y2="10"/>
      <line x1="16" y1="10" x2="16" y2="10"/>
      <line x1="8" y1="14" x2="8" y2="14"/>
      <line x1="12" y1="14" x2="12" y2="14"/>
      <line x1="16" y1="14" x2="16" y2="14"/>
    </svg>
  ),
  MapPin: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
      <circle cx="12" cy="10" r="3"/>
    </svg>
  ),
  Phone: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
    </svg>
  ),
  Mail: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
      <polyline points="22,6 12,13 2,6"/>
    </svg>
  ),
  Check: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  ),
  Clock: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <polyline points="12 6 12 12 16 14"/>
    </svg>
  ),
  Leaf: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z"/>
      <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/>
    </svg>
  )
};

// Document type definitions
const DOCUMENT_TYPES = [
  { id: 'quote', name: 'Quote', icon: Icons.Quote, color: '#3B82F6' },
  { id: 'invoice', name: 'Invoice', icon: Icons.Invoice, color: '#10B981' },
  { id: 'contract', name: 'Contract', icon: Icons.File, color: '#8B5CF6' },
  { id: 'work_order', name: 'Work Order', icon: Icons.Calendar, color: '#F59E0B' },
  { id: 'estimate', name: 'Estimate', icon: Icons.File, color: '#EC4899' },
  { id: 'receipt', name: 'Receipt', icon: Icons.Invoice, color: '#06B6D4' }
];

// Project status definitions
const PROJECT_STATUSES = [
  { id: 'pending', name: 'Pending', color: '#F59E0B' },
  { id: 'in_progress', name: 'In Progress', color: '#3B82F6' },
  { id: 'completed', name: 'Completed', color: '#10B981' },
  { id: 'on_hold', name: 'On Hold', color: '#6B7280' },
  { id: 'cancelled', name: 'Cancelled', color: '#EF4444' }
];

// Styles
const styles = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,100..1000;1,9..40,100..1000&family=Playfair+Display:wght@400;500;600;700&display=swap');
  
  :root {
    --color-earth-900: #1a1612;
    --color-earth-800: #2d2620;
    --color-earth-700: #3d352d;
    --color-earth-600: #5c4f42;
    --color-earth-500: #7a6a58;
    --color-earth-400: #a08b74;
    --color-earth-300: #c4b49c;
    --color-earth-200: #e0d5c5;
    --color-earth-100: #f0ebe3;
    --color-earth-50: #f8f6f2;
    
    --color-moss-900: #0f2818;
    --color-moss-800: #1a3d26;
    --color-moss-700: #245234;
    --color-moss-600: #2d6843;
    --color-moss-500: #3d8a58;
    --color-moss-400: #5aaa76;
    --color-moss-300: #84c99a;
    --color-moss-200: #b3e0c0;
    --color-moss-100: #d9f0e0;
    --color-moss-50: #ecf8ef;
    
    --color-stone-900: #1c1c1e;
    --color-stone-800: #2c2c2e;
    --color-stone-700: #3a3a3c;
    --color-stone-600: #48484a;
    --color-stone-500: #636366;
    --color-stone-400: #8e8e93;
    --color-stone-300: #aeaeb2;
    --color-stone-200: #d1d1d6;
    --color-stone-100: #e5e5ea;
    --color-stone-50: #f2f2f7;
    
    --shadow-sm: 0 1px 2px rgba(26, 22, 18, 0.05);
    --shadow-md: 0 4px 6px -1px rgba(26, 22, 18, 0.08), 0 2px 4px -1px rgba(26, 22, 18, 0.04);
    --shadow-lg: 0 10px 15px -3px rgba(26, 22, 18, 0.08), 0 4px 6px -2px rgba(26, 22, 18, 0.04);
    --shadow-xl: 0 20px 25px -5px rgba(26, 22, 18, 0.1), 0 10px 10px -5px rgba(26, 22, 18, 0.04);
    
    --radius-sm: 6px;
    --radius-md: 10px;
    --radius-lg: 14px;
    --radius-xl: 20px;
    
    --transition-fast: 150ms cubic-bezier(0.4, 0, 0.2, 1);
    --transition-normal: 250ms cubic-bezier(0.4, 0, 0.2, 1);
    --transition-slow: 350ms cubic-bezier(0.4, 0, 0.2, 1);
  }
  
  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }
  
  .scape-suite-manager {
    font-family: 'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif;
    background: linear-gradient(165deg, var(--color-earth-50) 0%, var(--color-moss-50) 50%, var(--color-earth-100) 100%);
    min-height: 100vh;
    color: var(--color-earth-900);
    position: relative;
    overflow-x: hidden;
  }
  
  .scape-suite-manager::before {
    content: '';
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: 
      radial-gradient(ellipse 800px 600px at 20% 10%, rgba(61, 138, 88, 0.06) 0%, transparent 50%),
      radial-gradient(ellipse 600px 400px at 80% 80%, rgba(160, 139, 116, 0.08) 0%, transparent 50%);
    pointer-events: none;
    z-index: 0;
  }
  
  .manager-container {
    position: relative;
    z-index: 1;
    max-width: 1440px;
    margin: 0 auto;
    padding: 32px;
    display: flex;
    flex-direction: column;
    min-height: 100vh;
  }
  
  /* Header */
  .manager-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 32px;
    padding-bottom: 24px;
    border-bottom: 1px solid var(--color-earth-200);
  }
  
  .brand {
    display: flex;
    align-items: center;
    gap: 14px;
  }
  
  .brand-icon {
    width: 48px;
    height: 48px;
    background: linear-gradient(135deg, var(--color-moss-600) 0%, var(--color-moss-700) 100%);
    border-radius: var(--radius-lg);
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    box-shadow: var(--shadow-md), inset 0 1px 0 rgba(255,255,255,0.15);
  }
  
  .brand-text h1 {
    font-family: 'Playfair Display', Georgia, serif;
    font-size: 24px;
    font-weight: 600;
    color: var(--color-earth-900);
    letter-spacing: -0.5px;
  }
  
  .brand-text span {
    font-size: 13px;
    color: var(--color-earth-500);
    font-weight: 500;
  }
  
  /* Navigation Tabs */
  .nav-tabs {
    display: flex;
    gap: 8px;
    background: rgba(255, 255, 255, 0.6);
    backdrop-filter: blur(10px);
    padding: 6px;
    border-radius: var(--radius-lg);
    border: 1px solid var(--color-earth-200);
  }
  
  .nav-tab {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 20px;
    border: none;
    background: transparent;
    border-radius: var(--radius-md);
    font-family: inherit;
    font-size: 14px;
    font-weight: 500;
    color: var(--color-earth-600);
    cursor: pointer;
    transition: all var(--transition-fast);
  }
  
  .nav-tab:hover {
    background: var(--color-earth-100);
    color: var(--color-earth-800);
  }
  
  .nav-tab.active {
    background: var(--color-moss-600);
    color: white;
    box-shadow: var(--shadow-sm);
  }
  
  /* Main Layout */
  .main-layout {
    display: grid;
    grid-template-columns: 380px 1fr;
    gap: 24px;
    flex: 1;
  }
  
  /* Panels */
  .panel {
    background: rgba(255, 255, 255, 0.85);
    backdrop-filter: blur(20px);
    border-radius: var(--radius-xl);
    border: 1px solid var(--color-earth-200);
    box-shadow: var(--shadow-lg);
    overflow: hidden;
    display: flex;
    flex-direction: column;
  }
  
  .panel-header {
    padding: 20px 24px;
    border-bottom: 1px solid var(--color-earth-100);
    display: flex;
    align-items: center;
    justify-content: space-between;
    background: linear-gradient(180deg, rgba(255,255,255,0.8) 0%, rgba(255,255,255,0.4) 100%);
  }
  
  .panel-title {
    font-family: 'Playfair Display', Georgia, serif;
    font-size: 18px;
    font-weight: 600;
    color: var(--color-earth-900);
  }
  
  .panel-count {
    font-size: 13px;
    color: var(--color-earth-500);
    font-weight: 500;
    margin-left: 10px;
  }
  
  .panel-body {
    flex: 1;
    overflow-y: auto;
    padding: 16px;
  }
  
  /* Search Bar */
  .search-bar {
    position: relative;
    margin-bottom: 16px;
  }
  
  .search-bar input {
    width: 100%;
    padding: 12px 16px 12px 44px;
    border: 1px solid var(--color-earth-200);
    border-radius: var(--radius-md);
    font-family: inherit;
    font-size: 14px;
    background: white;
    color: var(--color-earth-900);
    transition: all var(--transition-fast);
  }
  
  .search-bar input:focus {
    outline: none;
    border-color: var(--color-moss-400);
    box-shadow: 0 0 0 3px rgba(61, 138, 88, 0.1);
  }
  
  .search-bar input::placeholder {
    color: var(--color-earth-400);
  }
  
  .search-bar svg {
    position: absolute;
    left: 14px;
    top: 50%;
    transform: translateY(-50%);
    color: var(--color-earth-400);
  }
  
  /* List Items */
  .list-item {
    padding: 16px;
    border-radius: var(--radius-md);
    cursor: pointer;
    transition: all var(--transition-fast);
    border: 1px solid transparent;
    margin-bottom: 8px;
  }
  
  .list-item:hover {
    background: var(--color-earth-50);
    border-color: var(--color-earth-200);
  }
  
  .list-item.selected {
    background: var(--color-moss-50);
    border-color: var(--color-moss-300);
  }
  
  .list-item-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    margin-bottom: 8px;
  }
  
  .list-item-name {
    font-weight: 600;
    font-size: 15px;
    color: var(--color-earth-900);
  }
  
  .list-item-company {
    font-size: 13px;
    color: var(--color-earth-600);
    display: flex;
    align-items: center;
    gap: 6px;
    margin-top: 2px;
  }
  
  .list-item-meta {
    display: flex;
    gap: 16px;
    font-size: 12px;
    color: var(--color-earth-500);
  }
  
  .list-item-meta span {
    display: flex;
    align-items: center;
    gap: 4px;
  }
  
  .list-item-actions {
    display: flex;
    gap: 4px;
    opacity: 0;
    transition: opacity var(--transition-fast);
  }
  
  .list-item:hover .list-item-actions {
    opacity: 1;
  }
  
  .action-btn {
    width: 32px;
    height: 32px;
    border: none;
    background: transparent;
    border-radius: var(--radius-sm);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--color-earth-500);
    transition: all var(--transition-fast);
  }
  
  .action-btn:hover {
    background: var(--color-earth-100);
    color: var(--color-earth-700);
  }
  
  .action-btn.danger:hover {
    background: #FEE2E2;
    color: #DC2626;
  }
  
  /* Status Badge */
  .status-badge {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 4px 10px;
    border-radius: 20px;
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
  
  .status-badge::before {
    content: '';
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: currentColor;
  }
  
  /* Detail View */
  .detail-view {
    padding: 32px;
    overflow-y: auto;
  }
  
  .detail-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    margin-bottom: 32px;
  }
  
  .detail-title {
    font-family: 'Playfair Display', Georgia, serif;
    font-size: 28px;
    font-weight: 600;
    color: var(--color-earth-900);
    margin-bottom: 4px;
  }
  
  .detail-subtitle {
    font-size: 15px;
    color: var(--color-earth-500);
    display: flex;
    align-items: center;
    gap: 8px;
  }
  
  .detail-actions {
    display: flex;
    gap: 12px;
  }
  
  /* Buttons */
  .btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 10px 20px;
    border: none;
    border-radius: var(--radius-md);
    font-family: inherit;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: all var(--transition-fast);
  }
  
  .btn-primary {
    background: linear-gradient(135deg, var(--color-moss-600) 0%, var(--color-moss-700) 100%);
    color: white;
    box-shadow: var(--shadow-sm), inset 0 1px 0 rgba(255,255,255,0.15);
  }
  
  .btn-primary:hover {
    transform: translateY(-1px);
    box-shadow: var(--shadow-md), inset 0 1px 0 rgba(255,255,255,0.15);
  }
  
  .btn-secondary {
    background: white;
    color: var(--color-earth-700);
    border: 1px solid var(--color-earth-200);
  }
  
  .btn-secondary:hover {
    background: var(--color-earth-50);
    border-color: var(--color-earth-300);
  }
  
  .btn-ghost {
    background: transparent;
    color: var(--color-earth-600);
    padding: 8px 12px;
  }
  
  .btn-ghost:hover {
    background: var(--color-earth-100);
    color: var(--color-earth-800);
  }
  
  .btn-icon {
    width: 40px;
    height: 40px;
    padding: 0;
    border-radius: var(--radius-md);
  }
  
  /* Info Cards */
  .info-section {
    margin-bottom: 32px;
  }
  
  .info-section-title {
    font-size: 12px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    color: var(--color-earth-400);
    margin-bottom: 16px;
    display: flex;
    align-items: center;
    gap: 8px;
  }
  
  .info-section-title::after {
    content: '';
    flex: 1;
    height: 1px;
    background: var(--color-earth-200);
  }
  
  .info-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 16px;
  }
  
  .info-card {
    background: var(--color-earth-50);
    border-radius: var(--radius-md);
    padding: 16px;
  }
  
  .info-card-label {
    font-size: 12px;
    color: var(--color-earth-500);
    margin-bottom: 4px;
    display: flex;
    align-items: center;
    gap: 6px;
  }
  
  .info-card-value {
    font-size: 15px;
    font-weight: 500;
    color: var(--color-earth-900);
  }
  
  .info-card.full {
    grid-column: span 2;
  }
  
  /* Documents Grid */
  .documents-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 12px;
    margin-top: 16px;
  }
  
  .document-card {
    background: white;
    border: 1px solid var(--color-earth-200);
    border-radius: var(--radius-md);
    padding: 16px;
    cursor: pointer;
    transition: all var(--transition-fast);
    text-align: center;
  }
  
  .document-card:hover {
    border-color: var(--color-moss-400);
    transform: translateY(-2px);
    box-shadow: var(--shadow-md);
  }
  
  .document-card svg {
    margin-bottom: 8px;
  }
  
  .document-card-name {
    font-size: 13px;
    font-weight: 500;
    color: var(--color-earth-800);
  }
  
  .document-card-meta {
    font-size: 11px;
    color: var(--color-earth-500);
    margin-top: 4px;
  }
  
  /* Add Document Types */
  .add-document-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 12px;
    margin-top: 16px;
  }
  
  .add-document-btn {
    background: white;
    border: 2px dashed var(--color-earth-200);
    border-radius: var(--radius-md);
    padding: 20px 16px;
    cursor: pointer;
    transition: all var(--transition-fast);
    text-align: center;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
  }
  
  .add-document-btn:hover {
    border-color: var(--color-moss-400);
    background: var(--color-moss-50);
  }
  
  .add-document-btn svg {
    opacity: 0.7;
  }
  
  .add-document-btn span {
    font-size: 13px;
    font-weight: 500;
    color: var(--color-earth-700);
  }
  
  /* Modal */
  .modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(26, 22, 18, 0.5);
    backdrop-filter: blur(4px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    animation: fadeIn 200ms ease-out;
  }
  
  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  
  .modal {
    background: white;
    border-radius: var(--radius-xl);
    box-shadow: var(--shadow-xl);
    width: 100%;
    max-width: 600px;
    max-height: 90vh;
    overflow: hidden;
    animation: slideUp 300ms cubic-bezier(0.16, 1, 0.3, 1);
  }
  
  @keyframes slideUp {
    from { 
      opacity: 0;
      transform: translateY(20px) scale(0.98);
    }
    to { 
      opacity: 1;
      transform: translateY(0) scale(1);
    }
  }
  
  .modal-header {
    padding: 24px;
    border-bottom: 1px solid var(--color-earth-100);
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  
  .modal-title {
    font-family: 'Playfair Display', Georgia, serif;
    font-size: 22px;
    font-weight: 600;
    color: var(--color-earth-900);
  }
  
  .modal-close {
    width: 36px;
    height: 36px;
    border: none;
    background: var(--color-earth-100);
    border-radius: var(--radius-sm);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--color-earth-600);
    transition: all var(--transition-fast);
  }
  
  .modal-close:hover {
    background: var(--color-earth-200);
    color: var(--color-earth-800);
  }
  
  .modal-body {
    padding: 24px;
    overflow-y: auto;
    max-height: calc(90vh - 160px);
  }
  
  .modal-footer {
    padding: 20px 24px;
    border-top: 1px solid var(--color-earth-100);
    display: flex;
    justify-content: flex-end;
    gap: 12px;
    background: var(--color-earth-50);
  }
  
  /* Form Elements */
  .form-group {
    margin-bottom: 20px;
  }
  
  .form-label {
    display: block;
    font-size: 13px;
    font-weight: 500;
    color: var(--color-earth-700);
    margin-bottom: 6px;
  }
  
  .form-input {
    width: 100%;
    padding: 12px 14px;
    border: 1px solid var(--color-earth-200);
    border-radius: var(--radius-md);
    font-family: inherit;
    font-size: 14px;
    color: var(--color-earth-900);
    background: white;
    transition: all var(--transition-fast);
  }
  
  .form-input:focus {
    outline: none;
    border-color: var(--color-moss-400);
    box-shadow: 0 0 0 3px rgba(61, 138, 88, 0.1);
  }
  
  .form-input::placeholder {
    color: var(--color-earth-400);
  }
  
  .form-row {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 16px;
  }
  
  .form-select {
    width: 100%;
    padding: 12px 14px;
    border: 1px solid var(--color-earth-200);
    border-radius: var(--radius-md);
    font-family: inherit;
    font-size: 14px;
    color: var(--color-earth-900);
    background: white;
    cursor: pointer;
    transition: all var(--transition-fast);
    appearance: none;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%237a6a58' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E");
    background-repeat: no-repeat;
    background-position: right 12px center;
    padding-right: 36px;
  }
  
  .form-select:focus {
    outline: none;
    border-color: var(--color-moss-400);
    box-shadow: 0 0 0 3px rgba(61, 138, 88, 0.1);
  }
  
  .form-textarea {
    min-height: 100px;
    resize: vertical;
  }
  
  /* Empty State */
  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 60px 40px;
    text-align: center;
    color: var(--color-earth-500);
  }
  
  .empty-state svg {
    width: 64px;
    height: 64px;
    margin-bottom: 20px;
    opacity: 0.4;
  }
  
  .empty-state h3 {
    font-family: 'Playfair Display', Georgia, serif;
    font-size: 20px;
    font-weight: 600;
    color: var(--color-earth-700);
    margin-bottom: 8px;
  }
  
  .empty-state p {
    font-size: 14px;
    max-width: 300px;
    line-height: 1.6;
    margin-bottom: 20px;
  }
  
  /* Project Card */
  .project-card {
    background: white;
    border: 1px solid var(--color-earth-200);
    border-radius: var(--radius-md);
    padding: 16px;
    margin-bottom: 12px;
    transition: all var(--transition-fast);
  }
  
  .project-card:hover {
    border-color: var(--color-moss-300);
    box-shadow: var(--shadow-md);
  }
  
  .project-card-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    margin-bottom: 12px;
  }
  
  .project-card-title {
    font-weight: 600;
    font-size: 15px;
    color: var(--color-earth-900);
    margin-bottom: 4px;
  }
  
  .project-card-client {
    font-size: 13px;
    color: var(--color-earth-500);
  }
  
  .project-card-footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding-top: 12px;
    border-top: 1px solid var(--color-earth-100);
  }
  
  .project-card-docs {
    font-size: 12px;
    color: var(--color-earth-500);
    display: flex;
    align-items: center;
    gap: 4px;
  }
  
  .project-card-date {
    font-size: 12px;
    color: var(--color-earth-400);
    display: flex;
    align-items: center;
    gap: 4px;
  }
  
  /* Toast Notification */
  .toast {
    position: fixed;
    bottom: 24px;
    right: 24px;
    background: var(--color-earth-900);
    color: white;
    padding: 14px 20px;
    border-radius: var(--radius-md);
    box-shadow: var(--shadow-xl);
    display: flex;
    align-items: center;
    gap: 12px;
    animation: slideInRight 300ms cubic-bezier(0.16, 1, 0.3, 1);
    z-index: 1001;
  }
  
  @keyframes slideInRight {
    from {
      opacity: 0;
      transform: translateX(100%);
    }
    to {
      opacity: 1;
      transform: translateX(0);
    }
  }
  
  .toast.success {
    background: var(--color-moss-700);
  }
  
  .toast.error {
    background: #DC2626;
  }
  
  /* Loading Spinner */
  .spinner {
    width: 20px;
    height: 20px;
    border: 2px solid rgba(255,255,255,0.3);
    border-top-color: white;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }
  
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
  
  /* Scrollbar Styling */
  .panel-body::-webkit-scrollbar,
  .modal-body::-webkit-scrollbar,
  .detail-view::-webkit-scrollbar {
    width: 8px;
  }
  
  .panel-body::-webkit-scrollbar-track,
  .modal-body::-webkit-scrollbar-track,
  .detail-view::-webkit-scrollbar-track {
    background: transparent;
  }
  
  .panel-body::-webkit-scrollbar-thumb,
  .modal-body::-webkit-scrollbar-thumb,
  .detail-view::-webkit-scrollbar-thumb {
    background: var(--color-earth-300);
    border-radius: 4px;
  }
  
  .panel-body::-webkit-scrollbar-thumb:hover,
  .modal-body::-webkit-scrollbar-thumb:hover,
  .detail-view::-webkit-scrollbar-thumb:hover {
    background: var(--color-earth-400);
  }
  
  /* Responsive */
  @media (max-width: 1200px) {
    .main-layout {
      grid-template-columns: 340px 1fr;
    }
  }
  
  @media (max-width: 900px) {
    .main-layout {
      grid-template-columns: 1fr;
    }
    
    .manager-container {
      padding: 20px;
    }
    
    .documents-grid,
    .add-document-grid {
      grid-template-columns: repeat(2, 1fr);
    }
  }
`;

// Main Component
export default function ScapeSuiteManager() {
  // State
  const [activeTab, setActiveTab] = useState('contacts');
  const [contacts, setContacts] = useState([]);
  const [projects, setProjects] = useState([]);
  const [selectedContact, setSelectedContact] = useState(null);
  const [selectedProject, setSelectedProject] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showContactModal, setShowContactModal] = useState(false);
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [editingContact, setEditingContact] = useState(null);
  const [editingProject, setEditingProject] = useState(null);
  const [toast, setToast] = useState(null);
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState(null);
  
  // Demo data for preview (remove in production)
  useEffect(() => {
    // Simulated data for demonstration
    const demoContacts = [
      {
        id: '1',
        first_name: 'James',
        last_name: 'Morrison',
        company: 'Morrison Properties LLC',
        email: 'james@morrisonproperties.com',
        phone: '(555) 234-5678',
        address: '1234 Oak Lane',
        city: 'Springfield',
        state: 'IL',
        zip: '62701',
        notes: 'Prefers communication via email. Large residential property.',
        created_at: '2024-01-15T10:00:00Z'
      },
      {
        id: '2',
        first_name: 'Sarah',
        last_name: 'Chen',
        company: 'Greenview Estates',
        email: 'sarah.chen@greenview.com',
        phone: '(555) 345-6789',
        address: '5678 Maple Drive',
        city: 'Oak Park',
        state: 'IL',
        zip: '60301',
        notes: 'HOA contact for community landscaping.',
        created_at: '2024-02-20T14:30:00Z'
      },
      {
        id: '3',
        first_name: 'Michael',
        last_name: 'Torres',
        company: '',
        email: 'mtorres@email.com',
        phone: '(555) 456-7890',
        address: '910 Pine Street',
        city: 'Naperville',
        state: 'IL',
        zip: '60540',
        notes: 'Residential client, annual maintenance contract.',
        created_at: '2024-03-05T09:15:00Z'
      }
    ];
    
    const demoProjects = [
      {
        id: '1',
        contact_id: '1',
        name: 'Spring Garden Renovation',
        description: 'Complete backyard redesign including new flower beds, irrigation system, and patio extension.',
        status: 'in_progress',
        start_date: '2024-03-01',
        end_date: '2024-04-15',
        total_value: 15000,
        documents: [
          { id: 'd1', type: 'quote', name: 'Initial Quote', created_at: '2024-02-20' },
          { id: 'd2', type: 'contract', name: 'Service Agreement', created_at: '2024-02-25' }
        ],
        created_at: '2024-02-18T11:00:00Z'
      },
      {
        id: '2',
        contact_id: '2',
        name: 'HOA Common Area Maintenance',
        description: 'Monthly maintenance contract for Greenview Estates common areas including mowing, trimming, and seasonal plantings.',
        status: 'in_progress',
        start_date: '2024-01-01',
        end_date: '2024-12-31',
        total_value: 48000,
        documents: [
          { id: 'd3', type: 'contract', name: 'Annual Contract', created_at: '2023-12-15' },
          { id: 'd4', type: 'invoice', name: 'January Invoice', created_at: '2024-01-31' },
          { id: 'd5', type: 'invoice', name: 'February Invoice', created_at: '2024-02-29' }
        ],
        created_at: '2023-12-10T16:00:00Z'
      },
      {
        id: '3',
        contact_id: '3',
        name: 'Front Yard Hardscaping',
        description: 'Installation of flagstone walkway and retaining wall.',
        status: 'pending',
        start_date: '2024-04-01',
        end_date: '2024-04-20',
        total_value: 8500,
        documents: [
          { id: 'd6', type: 'estimate', name: 'Project Estimate', created_at: '2024-03-10' }
        ],
        created_at: '2024-03-08T13:45:00Z'
      }
    ];
    
    setContacts(demoContacts);
    setProjects(demoProjects);
    setUserId('demo-user-id');
  }, []);
  
  // Show toast notification
  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }, []);
  
  // Filter contacts based on search
  const filteredContacts = contacts.filter(contact => {
    const searchLower = searchQuery.toLowerCase();
    return (
      contact.first_name.toLowerCase().includes(searchLower) ||
      contact.last_name.toLowerCase().includes(searchLower) ||
      (contact.company && contact.company.toLowerCase().includes(searchLower)) ||
      contact.email.toLowerCase().includes(searchLower)
    );
  });
  
  // Filter projects based on search
  const filteredProjects = projects.filter(project => {
    const searchLower = searchQuery.toLowerCase();
    const contact = contacts.find(c => c.id === project.contact_id);
    return (
      project.name.toLowerCase().includes(searchLower) ||
      (contact && `${contact.first_name} ${contact.last_name}`.toLowerCase().includes(searchLower))
    );
  });
  
  // Get projects for a contact
  const getContactProjects = (contactId) => {
    return projects.filter(p => p.contact_id === contactId);
  };
  
  // Get contact for a project
  const getProjectContact = (contactId) => {
    return contacts.find(c => c.id === contactId);
  };
  
  // Handle save contact
  const handleSaveContact = async (contactData) => {
    setLoading(true);
    try {
      if (editingContact) {
        // Update existing contact
        const updatedContacts = contacts.map(c => 
          c.id === editingContact.id ? { ...c, ...contactData } : c
        );
        setContacts(updatedContacts);
        if (selectedContact?.id === editingContact.id) {
          setSelectedContact({ ...selectedContact, ...contactData });
        }
        showToast('Contact updated successfully');
      } else {
        // Create new contact
        const newContact = {
          ...contactData,
          id: Date.now().toString(),
          user_id: userId,
          created_at: new Date().toISOString()
        };
        setContacts([...contacts, newContact]);
        showToast('Contact created successfully');
      }
      setShowContactModal(false);
      setEditingContact(null);
    } catch (error) {
      showToast('Error saving contact', 'error');
    } finally {
      setLoading(false);
    }
  };
  
  // Handle delete contact
  const handleDeleteContact = async (contactId) => {
    if (!window.confirm('Are you sure you want to delete this contact? All associated projects will also be removed.')) {
      return;
    }
    
    try {
      setContacts(contacts.filter(c => c.id !== contactId));
      setProjects(projects.filter(p => p.contact_id !== contactId));
      if (selectedContact?.id === contactId) {
        setSelectedContact(null);
      }
      showToast('Contact deleted successfully');
    } catch (error) {
      showToast('Error deleting contact', 'error');
    }
  };
  
  // Handle save project
  const handleSaveProject = async (projectData) => {
    setLoading(true);
    try {
      if (editingProject) {
        // Update existing project
        const updatedProjects = projects.map(p => 
          p.id === editingProject.id ? { ...p, ...projectData } : p
        );
        setProjects(updatedProjects);
        if (selectedProject?.id === editingProject.id) {
          setSelectedProject({ ...selectedProject, ...projectData });
        }
        showToast('Project updated successfully');
      } else {
        // Create new project
        const newProject = {
          ...projectData,
          id: Date.now().toString(),
          user_id: userId,
          documents: [],
          created_at: new Date().toISOString()
        };
        setProjects([...projects, newProject]);
        showToast('Project created successfully');
      }
      setShowProjectModal(false);
      setEditingProject(null);
    } catch (error) {
      showToast('Error saving project', 'error');
    } finally {
      setLoading(false);
    }
  };
  
  // Handle delete project
  const handleDeleteProject = async (projectId) => {
    if (!window.confirm('Are you sure you want to delete this project?')) {
      return;
    }
    
    try {
      setProjects(projects.filter(p => p.id !== projectId));
      if (selectedProject?.id === projectId) {
        setSelectedProject(null);
      }
      showToast('Project deleted successfully');
    } catch (error) {
      showToast('Error deleting project', 'error');
    }
  };
  
  // Handle create document
  const handleCreateDocument = (projectId, docType) => {
    const project = projects.find(p => p.id === projectId);
    const contact = getProjectContact(project.contact_id);
    
    // This would integrate with your document generation forms
    console.log('Creating document:', { project, contact, docType });
    showToast(`Opening ${docType.name} generator...`);
    
    // Add document to project
    const newDoc = {
      id: Date.now().toString(),
      type: docType.id,
      name: `New ${docType.name}`,
      created_at: new Date().toISOString().split('T')[0]
    };
    
    const updatedProjects = projects.map(p => {
      if (p.id === projectId) {
        return { ...p, documents: [...(p.documents || []), newDoc] };
      }
      return p;
    });
    
    setProjects(updatedProjects);
    if (selectedProject?.id === projectId) {
      setSelectedProject({ ...selectedProject, documents: [...(selectedProject.documents || []), newDoc] });
    }
  };
  
  // Format date
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };
  
  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0
    }).format(amount);
  };
  
  // Get status style
  const getStatusStyle = (statusId) => {
    const status = PROJECT_STATUSES.find(s => s.id === statusId);
    return status ? { color: status.color, backgroundColor: `${status.color}15` } : {};
  };
  
  return (
    <>
      <style>{styles}</style>
      <div className="scape-suite-manager">
        <div className="manager-container">
          {/* Header */}
          <header className="manager-header">
            <div className="brand">
              <div className="brand-icon">
                <Icons.Leaf />
              </div>
              <div className="brand-text">
                <h1>Scape Suite</h1>
                <span>Client & Project Manager</span>
              </div>
            </div>
            
            <nav className="nav-tabs">
              <button 
                className={`nav-tab ${activeTab === 'contacts' ? 'active' : ''}`}
                onClick={() => {
                  setActiveTab('contacts');
                  setSelectedProject(null);
                  setSearchQuery('');
                }}
              >
                <Icons.Users />
                Contacts
              </button>
              <button 
                className={`nav-tab ${activeTab === 'projects' ? 'active' : ''}`}
                onClick={() => {
                  setActiveTab('projects');
                  setSelectedContact(null);
                  setSearchQuery('');
                }}
              >
                <Icons.Folder />
                Projects
              </button>
            </nav>
          </header>
          
          {/* Main Content */}
          <main className="main-layout">
            {/* List Panel */}
            <aside className="panel">
              <div className="panel-header">
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <span className="panel-title">
                    {activeTab === 'contacts' ? 'Contacts' : 'Projects'}
                  </span>
                  <span className="panel-count">
                    {activeTab === 'contacts' ? filteredContacts.length : filteredProjects.length}
                  </span>
                </div>
                <button 
                  className="btn btn-primary"
                  onClick={() => {
                    if (activeTab === 'contacts') {
                      setEditingContact(null);
                      setShowContactModal(true);
                    } else {
                      setEditingProject(null);
                      setShowProjectModal(true);
                    }
                  }}
                >
                  <Icons.Plus />
                  Add {activeTab === 'contacts' ? 'Contact' : 'Project'}
                </button>
              </div>
              
              <div className="panel-body">
                <div className="search-bar">
                  <Icons.Search />
                  <input 
                    type="text"
                    placeholder={`Search ${activeTab}...`}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                
                {activeTab === 'contacts' ? (
                  filteredContacts.length > 0 ? (
                    filteredContacts.map(contact => (
                      <div 
                        key={contact.id}
                        className={`list-item ${selectedContact?.id === contact.id ? 'selected' : ''}`}
                        onClick={() => setSelectedContact(contact)}
                      >
                        <div className="list-item-header">
                          <div>
                            <div className="list-item-name">
                              {contact.first_name} {contact.last_name}
                            </div>
                            {contact.company && (
                              <div className="list-item-company">
                                <Icons.Building />
                                {contact.company}
                              </div>
                            )}
                          </div>
                          <div className="list-item-actions">
                            <button 
                              className="action-btn"
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingContact(contact);
                                setShowContactModal(true);
                              }}
                            >
                              <Icons.Edit />
                            </button>
                            <button 
                              className="action-btn danger"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteContact(contact.id);
                              }}
                            >
                              <Icons.Trash />
                            </button>
                          </div>
                        </div>
                        <div className="list-item-meta">
                          <span>
                            <Icons.Folder />
                            {getContactProjects(contact.id).length} projects
                          </span>
                          <span>
                            <Icons.MapPin />
                            {contact.city}, {contact.state}
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="empty-state">
                      <Icons.Users />
                      <h3>No Contacts Yet</h3>
                      <p>Add your first client contact to start managing projects and generating documents.</p>
                      <button 
                        className="btn btn-primary"
                        onClick={() => {
                          setEditingContact(null);
                          setShowContactModal(true);
                        }}
                      >
                        <Icons.Plus />
                        Add Contact
                      </button>
                    </div>
                  )
                ) : (
                  filteredProjects.length > 0 ? (
                    filteredProjects.map(project => {
                      const contact = getProjectContact(project.contact_id);
                      const status = PROJECT_STATUSES.find(s => s.id === project.status);
                      return (
                        <div 
                          key={project.id}
                          className={`list-item ${selectedProject?.id === project.id ? 'selected' : ''}`}
                          onClick={() => setSelectedProject(project)}
                        >
                          <div className="list-item-header">
                            <div>
                              <div className="list-item-name">{project.name}</div>
                              {contact && (
                                <div className="list-item-company">
                                  <Icons.Users />
                                  {contact.first_name} {contact.last_name}
                                </div>
                              )}
                            </div>
                            <div className="list-item-actions">
                              <button 
                                className="action-btn"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setEditingProject(project);
                                  setShowProjectModal(true);
                                }}
                              >
                                <Icons.Edit />
                              </button>
                              <button 
                                className="action-btn danger"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteProject(project.id);
                                }}
                              >
                                <Icons.Trash />
                              </button>
                            </div>
                          </div>
                          <div className="list-item-meta">
                            <span 
                              className="status-badge"
                              style={getStatusStyle(project.status)}
                            >
                              {status?.name || project.status}
                            </span>
                            <span>
                              <Icons.File />
                              {project.documents?.length || 0} docs
                            </span>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="empty-state">
                      <Icons.Folder />
                      <h3>No Projects Yet</h3>
                      <p>Create a project to start generating quotes, invoices, and other documents for your clients.</p>
                      <button 
                        className="btn btn-primary"
                        onClick={() => {
                          setEditingProject(null);
                          setShowProjectModal(true);
                        }}
                      >
                        <Icons.Plus />
                        Create Project
                      </button>
                    </div>
                  )
                )}
              </div>
            </aside>
            
            {/* Detail Panel */}
            <section className="panel">
              {activeTab === 'contacts' && selectedContact ? (
                <div className="detail-view">
                  <div className="detail-header">
                    <div>
                      <h2 className="detail-title">
                        {selectedContact.first_name} {selectedContact.last_name}
                      </h2>
                      <p className="detail-subtitle">
                        {selectedContact.company && (
                          <>
                            <Icons.Building />
                            {selectedContact.company}
                          </>
                        )}
                      </p>
                    </div>
                    <div className="detail-actions">
                      <button 
                        className="btn btn-secondary"
                        onClick={() => {
                          setEditingContact(selectedContact);
                          setShowContactModal(true);
                        }}
                      >
                        <Icons.Edit />
                        Edit
                      </button>
                      <button 
                        className="btn btn-primary"
                        onClick={() => {
                          setEditingProject({ contact_id: selectedContact.id });
                          setShowProjectModal(true);
                        }}
                      >
                        <Icons.Plus />
                        New Project
                      </button>
                    </div>
                  </div>
                  
                  <div className="info-section">
                    <h3 className="info-section-title">Contact Information</h3>
                    <div className="info-grid">
                      <div className="info-card">
                        <div className="info-card-label">
                          <Icons.Mail />
                          Email
                        </div>
                        <div className="info-card-value">{selectedContact.email}</div>
                      </div>
                      <div className="info-card">
                        <div className="info-card-label">
                          <Icons.Phone />
                          Phone
                        </div>
                        <div className="info-card-value">{selectedContact.phone}</div>
                      </div>
                      <div className="info-card full">
                        <div className="info-card-label">
                          <Icons.MapPin />
                          Address
                        </div>
                        <div className="info-card-value">
                          {selectedContact.address}<br />
                          {selectedContact.city}, {selectedContact.state} {selectedContact.zip}
                        </div>
                      </div>
                      {selectedContact.notes && (
                        <div className="info-card full">
                          <div className="info-card-label">Notes</div>
                          <div className="info-card-value">{selectedContact.notes}</div>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="info-section">
                    <h3 className="info-section-title">
                      Projects ({getContactProjects(selectedContact.id).length})
                    </h3>
                    {getContactProjects(selectedContact.id).length > 0 ? (
                      getContactProjects(selectedContact.id).map(project => {
                        const status = PROJECT_STATUSES.find(s => s.id === project.status);
                        return (
                          <div 
                            key={project.id} 
                            className="project-card"
                            onClick={() => {
                              setActiveTab('projects');
                              setSelectedProject(project);
                              setSelectedContact(null);
                            }}
                            style={{ cursor: 'pointer' }}
                          >
                            <div className="project-card-header">
                              <div>
                                <div className="project-card-title">{project.name}</div>
                                <div className="project-card-client">
                                  {project.description?.substring(0, 60)}...
                                </div>
                              </div>
                              <span 
                                className="status-badge"
                                style={getStatusStyle(project.status)}
                              >
                                {status?.name}
                              </span>
                            </div>
                            <div className="project-card-footer">
                              <div className="project-card-docs">
                                <Icons.File />
                                {project.documents?.length || 0} documents
                              </div>
                              <div className="project-card-date">
                                <Icons.Calendar />
                                {formatDate(project.start_date)}
                              </div>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="empty-state" style={{ padding: '40px 20px' }}>
                        <Icons.Folder />
                        <h3>No Projects</h3>
                        <p>Create a project for this client to start generating documents.</p>
                        <button 
                          className="btn btn-primary"
                          onClick={() => {
                            setEditingProject({ contact_id: selectedContact.id });
                            setShowProjectModal(true);
                          }}
                        >
                          <Icons.Plus />
                          Create Project
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ) : activeTab === 'projects' && selectedProject ? (
                <div className="detail-view">
                  <div className="detail-header">
                    <div>
                      <h2 className="detail-title">{selectedProject.name}</h2>
                      <p className="detail-subtitle">
                        {getProjectContact(selectedProject.contact_id) && (
                          <>
                            <Icons.Users />
                            {getProjectContact(selectedProject.contact_id).first_name}{' '}
                            {getProjectContact(selectedProject.contact_id).last_name}
                          </>
                        )}
                      </p>
                    </div>
                    <div className="detail-actions">
                      <span 
                        className="status-badge"
                        style={getStatusStyle(selectedProject.status)}
                      >
                        {PROJECT_STATUSES.find(s => s.id === selectedProject.status)?.name}
                      </span>
                      <button 
                        className="btn btn-secondary"
                        onClick={() => {
                          setEditingProject(selectedProject);
                          setShowProjectModal(true);
                        }}
                      >
                        <Icons.Edit />
                        Edit
                      </button>
                    </div>
                  </div>
                  
                  <div className="info-section">
                    <h3 className="info-section-title">Project Details</h3>
                    <div className="info-grid">
                      <div className="info-card">
                        <div className="info-card-label">
                          <Icons.Calendar />
                          Start Date
                        </div>
                        <div className="info-card-value">{formatDate(selectedProject.start_date)}</div>
                      </div>
                      <div className="info-card">
                        <div className="info-card-label">
                          <Icons.Calendar />
                          End Date
                        </div>
                        <div className="info-card-value">{formatDate(selectedProject.end_date)}</div>
                      </div>
                      {selectedProject.total_value && (
                        <div className="info-card">
                          <div className="info-card-label">Total Value</div>
                          <div className="info-card-value">{formatCurrency(selectedProject.total_value)}</div>
                        </div>
                      )}
                      <div className="info-card full">
                        <div className="info-card-label">Description</div>
                        <div className="info-card-value">{selectedProject.description}</div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Client Info Section */}
                  {getProjectContact(selectedProject.contact_id) && (
                    <div className="info-section">
                      <h3 className="info-section-title">Client Information</h3>
                      <div className="info-grid">
                        <div className="info-card">
                          <div className="info-card-label">
                            <Icons.Users />
                            Contact
                          </div>
                          <div className="info-card-value">
                            {getProjectContact(selectedProject.contact_id).first_name}{' '}
                            {getProjectContact(selectedProject.contact_id).last_name}
                          </div>
                        </div>
                        <div className="info-card">
                          <div className="info-card-label">
                            <Icons.Mail />
                            Email
                          </div>
                          <div className="info-card-value">
                            {getProjectContact(selectedProject.contact_id).email}
                          </div>
                        </div>
                        <div className="info-card">
                          <div className="info-card-label">
                            <Icons.Phone />
                            Phone
                          </div>
                          <div className="info-card-value">
                            {getProjectContact(selectedProject.contact_id).phone}
                          </div>
                        </div>
                        <div className="info-card">
                          <div className="info-card-label">
                            <Icons.MapPin />
                            Location
                          </div>
                          <div className="info-card-value">
                            {getProjectContact(selectedProject.contact_id).city},{' '}
                            {getProjectContact(selectedProject.contact_id).state}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Documents Section */}
                  <div className="info-section">
                    <h3 className="info-section-title">
                      Documents ({selectedProject.documents?.length || 0})
                    </h3>
                    
                    {selectedProject.documents && selectedProject.documents.length > 0 && (
                      <div className="documents-grid">
                        {selectedProject.documents.map(doc => {
                          const docType = DOCUMENT_TYPES.find(d => d.id === doc.type);
                          const DocIcon = docType?.icon || Icons.File;
                          return (
                            <div key={doc.id} className="document-card">
                              <DocIcon style={{ color: docType?.color }} />
                              <div className="document-card-name">{doc.name}</div>
                              <div className="document-card-meta">{formatDate(doc.created_at)}</div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                    
                    <h4 style={{ 
                      fontSize: '13px', 
                      fontWeight: 500, 
                      color: 'var(--color-earth-600)',
                      marginTop: '24px',
                      marginBottom: '12px'
                    }}>
                      Create New Document
                    </h4>
                    <div className="add-document-grid">
                      {DOCUMENT_TYPES.map(docType => {
                        const DocIcon = docType.icon;
                        return (
                          <button 
                            key={docType.id}
                            className="add-document-btn"
                            onClick={() => handleCreateDocument(selectedProject.id, docType)}
                          >
                            <DocIcon style={{ color: docType.color }} />
                            <span>{docType.name}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="detail-view">
                  <div className="empty-state">
                    {activeTab === 'contacts' ? <Icons.Users /> : <Icons.Folder />}
                    <h3>Select a {activeTab === 'contacts' ? 'Contact' : 'Project'}</h3>
                    <p>
                      Choose a {activeTab === 'contacts' ? 'contact' : 'project'} from the list to view details and manage documents.
                    </p>
                  </div>
                </div>
              )}
            </section>
          </main>
        </div>
        
        {/* Contact Modal */}
        {showContactModal && (
          <ContactModal 
            contact={editingContact}
            onClose={() => {
              setShowContactModal(false);
              setEditingContact(null);
            }}
            onSave={handleSaveContact}
            loading={loading}
          />
        )}
        
        {/* Project Modal */}
        {showProjectModal && (
          <ProjectModal 
            project={editingProject}
            contacts={contacts}
            onClose={() => {
              setShowProjectModal(false);
              setEditingProject(null);
            }}
            onSave={handleSaveProject}
            loading={loading}
          />
        )}
        
        {/* Toast */}
        {toast && (
          <div className={`toast ${toast.type}`}>
            {toast.type === 'success' ? <Icons.Check /> : <Icons.X />}
            {toast.message}
          </div>
        )}
      </div>
    </>
  );
}

// Contact Modal Component
function ContactModal({ contact, onClose, onSave, loading }) {
  const [formData, setFormData] = useState({
    first_name: contact?.first_name || '',
    last_name: contact?.last_name || '',
    company: contact?.company || '',
    email: contact?.email || '',
    phone: contact?.phone || '',
    address: contact?.address || '',
    city: contact?.city || '',
    state: contact?.state || '',
    zip: contact?.zip || '',
    notes: contact?.notes || ''
  });
  
  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };
  
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">
            {contact ? 'Edit Contact' : 'Add New Contact'}
          </h2>
          <button className="modal-close" onClick={onClose}>
            <Icons.X />
          </button>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">First Name *</label>
                <input 
                  type="text"
                  className="form-input"
                  value={formData.first_name}
                  onChange={e => setFormData({ ...formData, first_name: e.target.value })}
                  required
                  placeholder="John"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Last Name *</label>
                <input 
                  type="text"
                  className="form-input"
                  value={formData.last_name}
                  onChange={e => setFormData({ ...formData, last_name: e.target.value })}
                  required
                  placeholder="Smith"
                />
              </div>
            </div>
            
            <div className="form-group">
              <label className="form-label">Company</label>
              <input 
                type="text"
                className="form-input"
                value={formData.company}
                onChange={e => setFormData({ ...formData, company: e.target.value })}
                placeholder="Smith Properties LLC"
              />
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Email *</label>
                <input 
                  type="email"
                  className="form-input"
                  value={formData.email}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                  required
                  placeholder="john@example.com"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Phone *</label>
                <input 
                  type="tel"
                  className="form-input"
                  value={formData.phone}
                  onChange={e => setFormData({ ...formData, phone: e.target.value })}
                  required
                  placeholder="(555) 123-4567"
                />
              </div>
            </div>
            
            <div className="form-group">
              <label className="form-label">Street Address</label>
              <input 
                type="text"
                className="form-input"
                value={formData.address}
                onChange={e => setFormData({ ...formData, address: e.target.value })}
                placeholder="123 Main Street"
              />
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">City</label>
                <input 
                  type="text"
                  className="form-input"
                  value={formData.city}
                  onChange={e => setFormData({ ...formData, city: e.target.value })}
                  placeholder="Springfield"
                />
              </div>
              <div className="form-group">
                <label className="form-label">State</label>
                <input 
                  type="text"
                  className="form-input"
                  value={formData.state}
                  onChange={e => setFormData({ ...formData, state: e.target.value })}
                  placeholder="IL"
                  maxLength={2}
                />
              </div>
            </div>
            
            <div className="form-group">
              <label className="form-label">ZIP Code</label>
              <input 
                type="text"
                className="form-input"
                value={formData.zip}
                onChange={e => setFormData({ ...formData, zip: e.target.value })}
                placeholder="62701"
                style={{ maxWidth: '150px' }}
              />
            </div>
            
            <div className="form-group">
              <label className="form-label">Notes</label>
              <textarea 
                className="form-input form-textarea"
                value={formData.notes}
                onChange={e => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Additional notes about this client..."
              />
            </div>
          </div>
          
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? <span className="spinner" /> : null}
              {contact ? 'Save Changes' : 'Add Contact'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Project Modal Component
function ProjectModal({ project, contacts, onClose, onSave, loading }) {
  const [formData, setFormData] = useState({
    contact_id: project?.contact_id || '',
    name: project?.name || '',
    description: project?.description || '',
    status: project?.status || 'pending',
    start_date: project?.start_date || new Date().toISOString().split('T')[0],
    end_date: project?.end_date || '',
    total_value: project?.total_value || ''
  });
  
  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };
  
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">
            {project?.id ? 'Edit Project' : 'Create New Project'}
          </h2>
          <button className="modal-close" onClick={onClose}>
            <Icons.X />
          </button>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-group">
              <label className="form-label">Client *</label>
              <select 
                className="form-select"
                value={formData.contact_id}
                onChange={e => setFormData({ ...formData, contact_id: e.target.value })}
                required
              >
                <option value="">Select a client...</option>
                {contacts.map(contact => (
                  <option key={contact.id} value={contact.id}>
                    {contact.first_name} {contact.last_name}
                    {contact.company ? ` (${contact.company})` : ''}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="form-group">
              <label className="form-label">Project Name *</label>
              <input 
                type="text"
                className="form-input"
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                required
                placeholder="Spring Garden Renovation"
              />
            </div>
            
            <div className="form-group">
              <label className="form-label">Description</label>
              <textarea 
                className="form-input form-textarea"
                value={formData.description}
                onChange={e => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe the project scope and details..."
              />
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Status</label>
                <select 
                  className="form-select"
                  value={formData.status}
                  onChange={e => setFormData({ ...formData, status: e.target.value })}
                >
                  {PROJECT_STATUSES.map(status => (
                    <option key={status.id} value={status.id}>
                      {status.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Total Value</label>
                <input 
                  type="number"
                  className="form-input"
                  value={formData.total_value}
                  onChange={e => setFormData({ ...formData, total_value: e.target.value })}
                  placeholder="15000"
                  min="0"
                  step="0.01"
                />
              </div>
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Start Date</label>
                <input 
                  type="date"
                  className="form-input"
                  value={formData.start_date}
                  onChange={e => setFormData({ ...formData, start_date: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label className="form-label">End Date</label>
                <input 
                  type="date"
                  className="form-input"
                  value={formData.end_date}
                  onChange={e => setFormData({ ...formData, end_date: e.target.value })}
                />
              </div>
            </div>
          </div>
          
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? <span className="spinner" /> : null}
              {project?.id ? 'Save Changes' : 'Create Project'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
