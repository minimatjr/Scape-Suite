// ScapeSuite.jsx
// Main Dashboard Component with Contact Manager & Project Manager

import React, { useState, useEffect, useCallback, useMemo } from 'react';

// ============================================
// MOCK API (Replace with real Supabase imports)
// ============================================
// In production, replace these with:
// import { contactsApi } from './services/contactsApi';
// import { projectsApi, PROJECT_STATUSES, PROJECT_TYPES } from './services/projectsApi';

const mockContacts = [
  {
    id: '1',
    first_name: 'James',
    last_name: 'Morrison',
    company_name: 'Morrison Estates',
    email: 'james@morrisonestates.com',
    phone: '(555) 234-5678',
    mobile: '(555) 987-6543',
    address_line_1: '1420 Maple Grove Lane',
    city: 'Portland',
    state: 'Oregon',
    postal_code: '97201',
    notes: 'Prefers morning appointments. Large backyard project.',
    tags: ['residential', 'premium'],
    created_at: '2024-01-15T10:00:00Z'
  },
  {
    id: '2',
    first_name: 'Sarah',
    last_name: 'Chen',
    company_name: 'Sunrise Commercial Properties',
    email: 'schen@sunrisecp.com',
    phone: '(555) 345-6789',
    address_line_1: '800 Business Park Dr',
    city: 'Seattle',
    state: 'Washington',
    postal_code: '98101',
    tags: ['commercial', 'maintenance'],
    created_at: '2024-02-20T14:30:00Z'
  }
];

const mockProjects = [
  {
    id: 'p1',
    name: 'Morrison Estate - Complete Landscape Redesign',
    contact_id: '1',
    contact: mockContacts[0],
    status: 'in_progress',
    project_type: 'landscaping',
    estimated_value: 45000,
    start_date: '2024-03-01',
    due_date: '2024-06-15',
    description: 'Full landscape redesign including new patio, native garden beds, and irrigation system.',
    created_at: '2024-02-28T09:00:00Z'
  },
  {
    id: 'p2',
    name: 'Sunrise Commercial - Quarterly Maintenance Q2',
    contact_id: '2',
    contact: mockContacts[1],
    status: 'pending',
    project_type: 'maintenance',
    estimated_value: 8500,
    start_date: '2024-04-01',
    due_date: '2024-06-30',
    description: 'Quarterly maintenance contract including lawn care, pruning, and seasonal plantings.',
    created_at: '2024-03-10T11:00:00Z'
  }
];

const PROJECT_STATUSES = [
  { value: 'draft', label: 'Draft', color: '#64748b' },
  { value: 'pending', label: 'Pending', color: '#f59e0b' },
  { value: 'in_progress', label: 'In Progress', color: '#3b82f6' },
  { value: 'completed', label: 'Completed', color: '#10b981' },
  { value: 'cancelled', label: 'Cancelled', color: '#ef4444' },
  { value: 'on_hold', label: 'On Hold', color: '#8b5cf6' }
];

const PROJECT_TYPES = [
  { value: 'landscaping', label: 'Landscaping' },
  { value: 'hardscaping', label: 'Hardscaping' },
  { value: 'maintenance', label: 'Maintenance' },
  { value: 'design', label: 'Design & Planning' },
  { value: 'irrigation', label: 'Irrigation' },
  { value: 'lighting', label: 'Outdoor Lighting' },
  { value: 'fencing', label: 'Fencing' },
  { value: 'tree_service', label: 'Tree Service' },
  { value: 'lawn_care', label: 'Lawn Care' },
  { value: 'other', label: 'Other' }
];

// ============================================
// STYLES
// ============================================
const styles = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,100..1000;1,9..40,100..1000&family=Instrument+Serif:ital@0;1&display=swap');

  * {
    box-sizing: border-box;
  }

  .scape-suite {
    --color-bg: #0a0f0d;
    --color-bg-elevated: #121916;
    --color-bg-card: #161f1b;
    --color-bg-input: #1a241f;
    --color-border: #2a3833;
    --color-border-focus: #3d5a4c;
    --color-text: #e8efe9;
    --color-text-secondary: #8fa69a;
    --color-text-muted: #5a7269;
    --color-accent: #4ade80;
    --color-accent-soft: rgba(74, 222, 128, 0.15);
    --color-accent-hover: #22c55e;
    --color-danger: #f87171;
    --color-danger-soft: rgba(248, 113, 113, 0.15);
    --color-warning: #fbbf24;
    --color-info: #60a5fa;
    
    --font-display: 'Instrument Serif', Georgia, serif;
    --font-body: 'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif;
    
    --radius-sm: 6px;
    --radius-md: 10px;
    --radius-lg: 16px;
    --radius-xl: 24px;
    
    --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.3);
    --shadow-md: 0 4px 12px rgba(0, 0, 0, 0.4);
    --shadow-lg: 0 8px 32px rgba(0, 0, 0, 0.5);
    --shadow-glow: 0 0 40px rgba(74, 222, 128, 0.1);
    
    font-family: var(--font-body);
    background: var(--color-bg);
    color: var(--color-text);
    min-height: 100vh;
    line-height: 1.5;
  }

  .scape-suite h1, .scape-suite h2, .scape-suite h3 {
    font-family: var(--font-display);
    font-weight: 400;
    letter-spacing: -0.02em;
  }

  /* Layout */
  .ss-container {
    max-width: 1400px;
    margin: 0 auto;
    padding: 32px 24px;
  }

  .ss-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 40px;
    padding-bottom: 24px;
    border-bottom: 1px solid var(--color-border);
  }

  .ss-logo {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .ss-logo-icon {
    width: 44px;
    height: 44px;
    background: linear-gradient(135deg, var(--color-accent) 0%, #059669 100%);
    border-radius: var(--radius-md);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 22px;
    box-shadow: var(--shadow-glow);
  }

  .ss-logo-text {
    font-family: var(--font-display);
    font-size: 28px;
    color: var(--color-text);
  }

  .ss-logo-text span {
    color: var(--color-accent);
  }

  /* Navigation Tabs */
  .ss-nav {
    display: flex;
    gap: 4px;
    background: var(--color-bg-elevated);
    padding: 4px;
    border-radius: var(--radius-lg);
    border: 1px solid var(--color-border);
  }

  .ss-nav-btn {
    padding: 10px 20px;
    border: none;
    background: transparent;
    color: var(--color-text-secondary);
    font-family: var(--font-body);
    font-size: 14px;
    font-weight: 500;
    border-radius: var(--radius-md);
    cursor: pointer;
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .ss-nav-btn:hover {
    color: var(--color-text);
    background: var(--color-bg-card);
  }

  .ss-nav-btn.active {
    background: var(--color-accent);
    color: var(--color-bg);
  }

  .ss-nav-btn .badge {
    background: var(--color-accent-soft);
    color: var(--color-accent);
    padding: 2px 8px;
    border-radius: 100px;
    font-size: 12px;
    font-weight: 600;
  }

  .ss-nav-btn.active .badge {
    background: rgba(0,0,0,0.2);
    color: var(--color-bg);
  }

  /* Content Area */
  .ss-content {
    display: grid;
    grid-template-columns: 1fr;
    gap: 24px;
  }

  /* Panel */
  .ss-panel {
    background: var(--color-bg-card);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-xl);
    overflow: hidden;
  }

  .ss-panel-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 20px 24px;
    border-bottom: 1px solid var(--color-border);
  }

  .ss-panel-title {
    font-family: var(--font-display);
    font-size: 20px;
    color: var(--color-text);
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .ss-panel-title-icon {
    font-size: 24px;
  }

  .ss-panel-actions {
    display: flex;
    gap: 12px;
    align-items: center;
  }

  /* Search Input */
  .ss-search {
    position: relative;
  }

  .ss-search-icon {
    position: absolute;
    left: 14px;
    top: 50%;
    transform: translateY(-50%);
    color: var(--color-text-muted);
    font-size: 16px;
  }

  .ss-search input {
    background: var(--color-bg-input);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    padding: 10px 14px 10px 42px;
    color: var(--color-text);
    font-family: var(--font-body);
    font-size: 14px;
    width: 280px;
    transition: all 0.2s ease;
  }

  .ss-search input::placeholder {
    color: var(--color-text-muted);
  }

  .ss-search input:focus {
    outline: none;
    border-color: var(--color-border-focus);
    box-shadow: 0 0 0 3px var(--color-accent-soft);
  }

  /* Buttons */
  .ss-btn {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 10px 18px;
    border: none;
    border-radius: var(--radius-md);
    font-family: var(--font-body);
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .ss-btn-primary {
    background: var(--color-accent);
    color: var(--color-bg);
  }

  .ss-btn-primary:hover {
    background: var(--color-accent-hover);
    transform: translateY(-1px);
    box-shadow: var(--shadow-md);
  }

  .ss-btn-secondary {
    background: var(--color-bg-input);
    color: var(--color-text);
    border: 1px solid var(--color-border);
  }

  .ss-btn-secondary:hover {
    background: var(--color-bg-elevated);
    border-color: var(--color-border-focus);
  }

  .ss-btn-ghost {
    background: transparent;
    color: var(--color-text-secondary);
    padding: 8px;
  }

  .ss-btn-ghost:hover {
    background: var(--color-bg-input);
    color: var(--color-text);
  }

  .ss-btn-danger {
    background: var(--color-danger-soft);
    color: var(--color-danger);
    border: 1px solid transparent;
  }

  .ss-btn-danger:hover {
    background: var(--color-danger);
    color: white;
  }

  .ss-btn-sm {
    padding: 6px 12px;
    font-size: 13px;
  }

  .ss-btn-icon {
    padding: 8px;
    width: 36px;
    height: 36px;
    justify-content: center;
  }

  /* Table */
  .ss-table-wrap {
    overflow-x: auto;
  }

  .ss-table {
    width: 100%;
    border-collapse: collapse;
  }

  .ss-table th {
    text-align: left;
    padding: 14px 20px;
    font-size: 12px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--color-text-muted);
    background: var(--color-bg-elevated);
    border-bottom: 1px solid var(--color-border);
  }

  .ss-table td {
    padding: 16px 20px;
    border-bottom: 1px solid var(--color-border);
    vertical-align: middle;
  }

  .ss-table tr:last-child td {
    border-bottom: none;
  }

  .ss-table tr:hover td {
    background: var(--color-bg-elevated);
  }

  .ss-table-name {
    font-weight: 500;
    color: var(--color-text);
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .ss-avatar {
    width: 40px;
    height: 40px;
    background: linear-gradient(135deg, var(--color-accent-soft) 0%, var(--color-bg-input) 100%);
    border-radius: var(--radius-md);
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 600;
    font-size: 14px;
    color: var(--color-accent);
    flex-shrink: 0;
  }

  .ss-table-company {
    font-size: 13px;
    color: var(--color-text-secondary);
    margin-top: 2px;
  }

  .ss-table-contact {
    font-size: 14px;
    color: var(--color-text-secondary);
  }

  .ss-table-contact a {
    color: var(--color-accent);
    text-decoration: none;
  }

  .ss-table-contact a:hover {
    text-decoration: underline;
  }

  /* Tags */
  .ss-tags {
    display: flex;
    gap: 6px;
    flex-wrap: wrap;
  }

  .ss-tag {
    display: inline-block;
    padding: 4px 10px;
    background: var(--color-bg-input);
    border: 1px solid var(--color-border);
    border-radius: 100px;
    font-size: 12px;
    color: var(--color-text-secondary);
  }

  /* Status Badge */
  .ss-status {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 5px 12px;
    border-radius: 100px;
    font-size: 13px;
    font-weight: 500;
  }

  .ss-status-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: currentColor;
  }

  /* Actions Menu */
  .ss-actions {
    display: flex;
    gap: 4px;
    justify-content: flex-end;
  }

  /* Empty State */
  .ss-empty {
    padding: 80px 40px;
    text-align: center;
  }

  .ss-empty-icon {
    font-size: 64px;
    margin-bottom: 20px;
    opacity: 0.5;
  }

  .ss-empty-title {
    font-family: var(--font-display);
    font-size: 24px;
    color: var(--color-text);
    margin-bottom: 8px;
  }

  .ss-empty-text {
    color: var(--color-text-secondary);
    margin-bottom: 24px;
    max-width: 400px;
    margin-left: auto;
    margin-right: auto;
  }

  /* Modal */
  .ss-modal-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.75);
    backdrop-filter: blur(8px);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 24px;
    z-index: 1000;
    animation: fadeIn 0.2s ease;
  }

  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }

  .ss-modal {
    background: var(--color-bg-card);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-xl);
    width: 100%;
    max-width: 640px;
    max-height: 90vh;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    box-shadow: var(--shadow-lg);
    animation: slideUp 0.3s ease;
  }

  .ss-modal-lg {
    max-width: 800px;
  }

  @keyframes slideUp {
    from { 
      opacity: 0;
      transform: translateY(20px);
    }
    to { 
      opacity: 1;
      transform: translateY(0);
    }
  }

  .ss-modal-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 20px 24px;
    border-bottom: 1px solid var(--color-border);
  }

  .ss-modal-title {
    font-family: var(--font-display);
    font-size: 22px;
    color: var(--color-text);
  }

  .ss-modal-close {
    width: 36px;
    height: 36px;
    border: none;
    background: var(--color-bg-input);
    border-radius: var(--radius-md);
    color: var(--color-text-secondary);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 20px;
    transition: all 0.2s ease;
  }

  .ss-modal-close:hover {
    background: var(--color-danger-soft);
    color: var(--color-danger);
  }

  .ss-modal-body {
    padding: 24px;
    overflow-y: auto;
    flex: 1;
  }

  .ss-modal-footer {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
    padding: 20px 24px;
    border-top: 1px solid var(--color-border);
    background: var(--color-bg-elevated);
  }

  /* Form Elements */
  .ss-form-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 20px;
  }

  .ss-form-grid-full {
    grid-column: 1 / -1;
  }

  .ss-field {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .ss-label {
    font-size: 13px;
    font-weight: 500;
    color: var(--color-text-secondary);
  }

  .ss-input, .ss-select, .ss-textarea {
    background: var(--color-bg-input);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    padding: 12px 14px;
    color: var(--color-text);
    font-family: var(--font-body);
    font-size: 14px;
    transition: all 0.2s ease;
  }

  .ss-input::placeholder, .ss-textarea::placeholder {
    color: var(--color-text-muted);
  }

  .ss-input:focus, .ss-select:focus, .ss-textarea:focus {
    outline: none;
    border-color: var(--color-border-focus);
    box-shadow: 0 0 0 3px var(--color-accent-soft);
  }

  .ss-textarea {
    resize: vertical;
    min-height: 100px;
  }

  .ss-select {
    cursor: pointer;
    appearance: none;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%238fa69a'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E");
    background-repeat: no-repeat;
    background-position: right 12px center;
    background-size: 16px;
    padding-right: 40px;
  }

  .ss-form-section {
    margin-bottom: 28px;
  }

  .ss-form-section:last-child {
    margin-bottom: 0;
  }

  .ss-form-section-title {
    font-size: 12px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--color-text-muted);
    margin-bottom: 16px;
    padding-bottom: 8px;
    border-bottom: 1px solid var(--color-border);
  }

  /* Stats Cards */
  .ss-stats {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 16px;
    margin-bottom: 24px;
  }

  .ss-stat-card {
    background: var(--color-bg-card);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-lg);
    padding: 20px;
    display: flex;
    align-items: center;
    gap: 16px;
  }

  .ss-stat-icon {
    width: 48px;
    height: 48px;
    background: var(--color-accent-soft);
    border-radius: var(--radius-md);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 24px;
  }

  .ss-stat-value {
    font-family: var(--font-display);
    font-size: 28px;
    color: var(--color-text);
    line-height: 1;
  }

  .ss-stat-label {
    font-size: 13px;
    color: var(--color-text-secondary);
    margin-top: 4px;
  }

  /* Project Card */
  .ss-project-card {
    background: var(--color-bg-card);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-lg);
    padding: 20px;
    transition: all 0.2s ease;
    cursor: pointer;
  }

  .ss-project-card:hover {
    border-color: var(--color-border-focus);
    transform: translateY(-2px);
    box-shadow: var(--shadow-md);
  }

  .ss-project-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    margin-bottom: 12px;
  }

  .ss-project-name {
    font-weight: 500;
    color: var(--color-text);
    margin-bottom: 4px;
  }

  .ss-project-client {
    font-size: 14px;
    color: var(--color-text-secondary);
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .ss-project-meta {
    display: flex;
    gap: 16px;
    margin-top: 12px;
    padding-top: 12px;
    border-top: 1px solid var(--color-border);
    font-size: 13px;
    color: var(--color-text-secondary);
  }

  .ss-project-meta-item {
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .ss-projects-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
    gap: 16px;
    padding: 24px;
  }

  /* Filter Bar */
  .ss-filter-bar {
    display: flex;
    gap: 12px;
    align-items: center;
    padding: 16px 24px;
    background: var(--color-bg-elevated);
    border-bottom: 1px solid var(--color-border);
    flex-wrap: wrap;
  }

  .ss-filter-chip {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 6px 14px;
    background: var(--color-bg-input);
    border: 1px solid var(--color-border);
    border-radius: 100px;
    font-size: 13px;
    color: var(--color-text-secondary);
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .ss-filter-chip:hover {
    border-color: var(--color-border-focus);
    color: var(--color-text);
  }

  .ss-filter-chip.active {
    background: var(--color-accent-soft);
    border-color: var(--color-accent);
    color: var(--color-accent);
  }

  /* Toast Notification */
  .ss-toast {
    position: fixed;
    bottom: 24px;
    right: 24px;
    background: var(--color-bg-card);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-lg);
    padding: 16px 20px;
    display: flex;
    align-items: center;
    gap: 12px;
    box-shadow: var(--shadow-lg);
    z-index: 2000;
    animation: slideInRight 0.3s ease;
  }

  @keyframes slideInRight {
    from {
      opacity: 0;
      transform: translateX(100px);
    }
    to {
      opacity: 1;
      transform: translateX(0);
    }
  }

  .ss-toast-success {
    border-color: var(--color-accent);
  }

  .ss-toast-error {
    border-color: var(--color-danger);
  }

  .ss-toast-icon {
    font-size: 20px;
  }

  .ss-toast-message {
    font-size: 14px;
    color: var(--color-text);
  }

  /* Detail View */
  .ss-detail-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 32px;
  }

  .ss-detail-back {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    color: var(--color-text-secondary);
    font-size: 14px;
    margin-bottom: 12px;
    cursor: pointer;
    transition: color 0.2s ease;
  }

  .ss-detail-back:hover {
    color: var(--color-accent);
  }

  .ss-detail-title {
    font-family: var(--font-display);
    font-size: 32px;
    color: var(--color-text);
    margin-bottom: 4px;
  }

  .ss-detail-subtitle {
    color: var(--color-text-secondary);
    font-size: 16px;
  }

  .ss-detail-grid {
    display: grid;
    grid-template-columns: 2fr 1fr;
    gap: 24px;
  }

  .ss-detail-section {
    background: var(--color-bg-card);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-lg);
    padding: 24px;
  }

  .ss-detail-section-title {
    font-family: var(--font-display);
    font-size: 18px;
    margin-bottom: 20px;
    color: var(--color-text);
  }

  .ss-info-list {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .ss-info-item {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .ss-info-label {
    font-size: 12px;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--color-text-muted);
  }

  .ss-info-value {
    color: var(--color-text);
    font-size: 15px;
  }

  .ss-info-value a {
    color: var(--color-accent);
    text-decoration: none;
  }

  .ss-info-value a:hover {
    text-decoration: underline;
  }

  /* Quick Actions */
  .ss-quick-actions {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .ss-quick-action {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px 16px;
    background: var(--color-bg-input);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    color: var(--color-text);
    font-size: 14px;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .ss-quick-action:hover {
    background: var(--color-bg-elevated);
    border-color: var(--color-border-focus);
    color: var(--color-accent);
  }

  .ss-quick-action-icon {
    font-size: 18px;
  }

  /* Loading Spinner */
  .ss-spinner {
    width: 24px;
    height: 24px;
    border: 2px solid var(--color-border);
    border-top-color: var(--color-accent);
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  .ss-loading {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 60px;
  }

  /* Responsive */
  @media (max-width: 768px) {
    .ss-container {
      padding: 16px;
    }

    .ss-header {
      flex-direction: column;
      gap: 16px;
      align-items: flex-start;
    }

    .ss-form-grid {
      grid-template-columns: 1fr;
    }

    .ss-detail-grid {
      grid-template-columns: 1fr;
    }

    .ss-search input {
      width: 100%;
    }

    .ss-panel-header {
      flex-direction: column;
      gap: 12px;
      align-items: flex-start;
    }

    .ss-panel-actions {
      width: 100%;
      flex-wrap: wrap;
    }
  }
`;

// ============================================
// ICONS (Simple SVG components)
// ============================================
const Icons = {
  Users: () => (
    <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"/>
    </svg>
  ),
  Folder: () => (
    <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"/>
    </svg>
  ),
  Plus: () => (
    <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"/>
    </svg>
  ),
  Search: () => (
    <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
    </svg>
  ),
  Edit: () => (
    <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
    </svg>
  ),
  Trash: () => (
    <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
    </svg>
  ),
  X: () => (
    <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/>
    </svg>
  ),
  Eye: () => (
    <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
    </svg>
  ),
  ArrowLeft: () => (
    <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"/>
    </svg>
  ),
  Document: () => (
    <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
    </svg>
  ),
  Calendar: () => (
    <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
    </svg>
  ),
  DollarSign: () => (
    <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
    </svg>
  ),
  Check: () => (
    <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"/>
    </svg>
  ),
  AlertCircle: () => (
    <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
    </svg>
  ),
};

// ============================================
// UTILITY FUNCTIONS
// ============================================
const formatDate = (dateString) => {
  if (!dateString) return '—';
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
};

const formatCurrency = (value) => {
  if (!value) return '—';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value);
};

const getInitials = (firstName, lastName) => {
  return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase();
};

const getStatusConfig = (status) => {
  return PROJECT_STATUSES.find(s => s.value === status) || PROJECT_STATUSES[0];
};

// ============================================
// TOAST COMPONENT
// ============================================
const Toast = ({ message, type = 'success', onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className={`ss-toast ss-toast-${type}`}>
      <span className="ss-toast-icon">
        {type === 'success' ? <Icons.Check /> : <Icons.AlertCircle />}
      </span>
      <span className="ss-toast-message">{message}</span>
    </div>
  );
};

// ============================================
// CONTACT FORM MODAL
// ============================================
const ContactModal = ({ contact, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    company_name: '',
    email: '',
    phone: '',
    mobile: '',
    address_line_1: '',
    address_line_2: '',
    city: '',
    state: '',
    postal_code: '',
    country: 'United States',
    notes: '',
    tags: [],
    ...contact
  });
  const [saving, setSaving] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onSave(formData);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="ss-modal-overlay" onClick={onClose}>
      <div className="ss-modal ss-modal-lg" onClick={e => e.stopPropagation()}>
        <div className="ss-modal-header">
          <h2 className="ss-modal-title">
            {contact ? 'Edit Contact' : 'Add New Contact'}
          </h2>
          <button className="ss-modal-close" onClick={onClose}>
            <Icons.X />
          </button>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="ss-modal-body">
            <div className="ss-form-section">
              <div className="ss-form-section-title">Basic Information</div>
              <div className="ss-form-grid">
                <div className="ss-field">
                  <label className="ss-label">First Name *</label>
                  <input
                    type="text"
                    name="first_name"
                    className="ss-input"
                    value={formData.first_name}
                    onChange={handleChange}
                    placeholder="John"
                    required
                  />
                </div>
                <div className="ss-field">
                  <label className="ss-label">Last Name *</label>
                  <input
                    type="text"
                    name="last_name"
                    className="ss-input"
                    value={formData.last_name}
                    onChange={handleChange}
                    placeholder="Smith"
                    required
                  />
                </div>
                <div className="ss-field ss-form-grid-full">
                  <label className="ss-label">Company Name</label>
                  <input
                    type="text"
                    name="company_name"
                    className="ss-input"
                    value={formData.company_name}
                    onChange={handleChange}
                    placeholder="Acme Properties LLC"
                  />
                </div>
              </div>
            </div>

            <div className="ss-form-section">
              <div className="ss-form-section-title">Contact Details</div>
              <div className="ss-form-grid">
                <div className="ss-field">
                  <label className="ss-label">Email</label>
                  <input
                    type="email"
                    name="email"
                    className="ss-input"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="john@example.com"
                  />
                </div>
                <div className="ss-field">
                  <label className="ss-label">Phone</label>
                  <input
                    type="tel"
                    name="phone"
                    className="ss-input"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="(555) 123-4567"
                  />
                </div>
                <div className="ss-field">
                  <label className="ss-label">Mobile</label>
                  <input
                    type="tel"
                    name="mobile"
                    className="ss-input"
                    value={formData.mobile}
                    onChange={handleChange}
                    placeholder="(555) 987-6543"
                  />
                </div>
              </div>
            </div>

            <div className="ss-form-section">
              <div className="ss-form-section-title">Address</div>
              <div className="ss-form-grid">
                <div className="ss-field ss-form-grid-full">
                  <label className="ss-label">Street Address</label>
                  <input
                    type="text"
                    name="address_line_1"
                    className="ss-input"
                    value={formData.address_line_1}
                    onChange={handleChange}
                    placeholder="123 Main Street"
                  />
                </div>
                <div className="ss-field ss-form-grid-full">
                  <label className="ss-label">Address Line 2</label>
                  <input
                    type="text"
                    name="address_line_2"
                    className="ss-input"
                    value={formData.address_line_2}
                    onChange={handleChange}
                    placeholder="Suite 100"
                  />
                </div>
                <div className="ss-field">
                  <label className="ss-label">City</label>
                  <input
                    type="text"
                    name="city"
                    className="ss-input"
                    value={formData.city}
                    onChange={handleChange}
                    placeholder="Portland"
                  />
                </div>
                <div className="ss-field">
                  <label className="ss-label">State/Province</label>
                  <input
                    type="text"
                    name="state"
                    className="ss-input"
                    value={formData.state}
                    onChange={handleChange}
                    placeholder="Oregon"
                  />
                </div>
                <div className="ss-field">
                  <label className="ss-label">Postal Code</label>
                  <input
                    type="text"
                    name="postal_code"
                    className="ss-input"
                    value={formData.postal_code}
                    onChange={handleChange}
                    placeholder="97201"
                  />
                </div>
                <div className="ss-field">
                  <label className="ss-label">Country</label>
                  <input
                    type="text"
                    name="country"
                    className="ss-input"
                    value={formData.country}
                    onChange={handleChange}
                  />
                </div>
              </div>
            </div>

            <div className="ss-form-section">
              <div className="ss-form-section-title">Additional Information</div>
              <div className="ss-field">
                <label className="ss-label">Notes</label>
                <textarea
                  name="notes"
                  className="ss-textarea"
                  value={formData.notes}
                  onChange={handleChange}
                  placeholder="Any additional notes about this contact..."
                />
              </div>
            </div>
          </div>

          <div className="ss-modal-footer">
            <button type="button" className="ss-btn ss-btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="ss-btn ss-btn-primary" disabled={saving}>
              {saving ? (
                <>
                  <div className="ss-spinner" style={{ width: 16, height: 16 }} />
                  Saving...
                </>
              ) : (
                <>
                  <Icons.Check />
                  {contact ? 'Update Contact' : 'Create Contact'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ============================================
// PROJECT FORM MODAL
// ============================================
const ProjectModal = ({ project, contacts, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    name: '',
    contact_id: '',
    description: '',
    status: 'draft',
    project_type: 'landscaping',
    estimated_value: '',
    start_date: '',
    due_date: '',
    site_address_line_1: '',
    site_city: '',
    site_state: '',
    site_postal_code: '',
    notes: '',
    ...project,
    contact_id: project?.contact_id || project?.contact?.id || ''
  });
  const [saving, setSaving] = useState(false);
  const [useContactAddress, setUseContactAddress] = useState(false);

  const selectedContact = contacts.find(c => c.id === formData.contact_id);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleUseContactAddress = () => {
    if (selectedContact) {
      setFormData(prev => ({
        ...prev,
        site_address_line_1: selectedContact.address_line_1 || '',
        site_city: selectedContact.city || '',
        site_state: selectedContact.state || '',
        site_postal_code: selectedContact.postal_code || ''
      }));
      setUseContactAddress(true);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onSave({
        ...formData,
        estimated_value: formData.estimated_value ? parseFloat(formData.estimated_value) : null
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="ss-modal-overlay" onClick={onClose}>
      <div className="ss-modal ss-modal-lg" onClick={e => e.stopPropagation()}>
        <div className="ss-modal-header">
          <h2 className="ss-modal-title">
            {project ? 'Edit Project' : 'Create New Project'}
          </h2>
          <button className="ss-modal-close" onClick={onClose}>
            <Icons.X />
          </button>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="ss-modal-body">
            <div className="ss-form-section">
              <div className="ss-form-section-title">Project Details</div>
              <div className="ss-form-grid">
                <div className="ss-field ss-form-grid-full">
                  <label className="ss-label">Project Name *</label>
                  <input
                    type="text"
                    name="name"
                    className="ss-input"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="e.g., Morrison Estate - Backyard Redesign"
                    required
                  />
                </div>
                <div className="ss-field ss-form-grid-full">
                  <label className="ss-label">Client *</label>
                  <select
                    name="contact_id"
                    className="ss-select"
                    value={formData.contact_id}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Select a client...</option>
                    {contacts.map(contact => (
                      <option key={contact.id} value={contact.id}>
                        {contact.first_name} {contact.last_name}
                        {contact.company_name ? ` — ${contact.company_name}` : ''}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="ss-field">
                  <label className="ss-label">Project Type</label>
                  <select
                    name="project_type"
                    className="ss-select"
                    value={formData.project_type}
                    onChange={handleChange}
                  >
                    {PROJECT_TYPES.map(type => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="ss-field">
                  <label className="ss-label">Status</label>
                  <select
                    name="status"
                    className="ss-select"
                    value={formData.status}
                    onChange={handleChange}
                  >
                    {PROJECT_STATUSES.map(status => (
                      <option key={status.value} value={status.value}>
                        {status.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="ss-field ss-form-grid-full">
                  <label className="ss-label">Description</label>
                  <textarea
                    name="description"
                    className="ss-textarea"
                    value={formData.description}
                    onChange={handleChange}
                    placeholder="Describe the project scope, deliverables, and any special requirements..."
                  />
                </div>
              </div>
            </div>

            <div className="ss-form-section">
              <div className="ss-form-section-title">Timeline & Budget</div>
              <div className="ss-form-grid">
                <div className="ss-field">
                  <label className="ss-label">Estimated Value ($)</label>
                  <input
                    type="number"
                    name="estimated_value"
                    className="ss-input"
                    value={formData.estimated_value}
                    onChange={handleChange}
                    placeholder="25000"
                    min="0"
                    step="100"
                  />
                </div>
                <div className="ss-field">
                  <label className="ss-label">Start Date</label>
                  <input
                    type="date"
                    name="start_date"
                    className="ss-input"
                    value={formData.start_date}
                    onChange={handleChange}
                  />
                </div>
                <div className="ss-field">
                  <label className="ss-label">Due Date</label>
                  <input
                    type="date"
                    name="due_date"
                    className="ss-input"
                    value={formData.due_date}
                    onChange={handleChange}
                  />
                </div>
              </div>
            </div>

            <div className="ss-form-section">
              <div className="ss-form-section-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>Site Location</span>
                {selectedContact && (
                  <button
                    type="button"
                    className="ss-btn ss-btn-secondary ss-btn-sm"
                    onClick={handleUseContactAddress}
                    style={{ textTransform: 'none', letterSpacing: 0 }}
                  >
                    Use client address
                  </button>
                )}
              </div>
              <div className="ss-form-grid">
                <div className="ss-field ss-form-grid-full">
                  <label className="ss-label">Street Address</label>
                  <input
                    type="text"
                    name="site_address_line_1"
                    className="ss-input"
                    value={formData.site_address_line_1}
                    onChange={handleChange}
                    placeholder="123 Project Site Lane"
                  />
                </div>
                <div className="ss-field">
                  <label className="ss-label">City</label>
                  <input
                    type="text"
                    name="site_city"
                    className="ss-input"
                    value={formData.site_city}
                    onChange={handleChange}
                    placeholder="Portland"
                  />
                </div>
                <div className="ss-field">
                  <label className="ss-label">State</label>
                  <input
                    type="text"
                    name="site_state"
                    className="ss-input"
                    value={formData.site_state}
                    onChange={handleChange}
                    placeholder="Oregon"
                  />
                </div>
                <div className="ss-field">
                  <label className="ss-label">Postal Code</label>
                  <input
                    type="text"
                    name="site_postal_code"
                    className="ss-input"
                    value={formData.site_postal_code}
                    onChange={handleChange}
                    placeholder="97201"
                  />
                </div>
              </div>
            </div>

            <div className="ss-form-section">
              <div className="ss-form-section-title">Notes</div>
              <div className="ss-field">
                <textarea
                  name="notes"
                  className="ss-textarea"
                  value={formData.notes}
                  onChange={handleChange}
                  placeholder="Internal notes, reminders, or special instructions..."
                />
              </div>
            </div>
          </div>

          <div className="ss-modal-footer">
            <button type="button" className="ss-btn ss-btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="ss-btn ss-btn-primary" disabled={saving}>
              {saving ? (
                <>
                  <div className="ss-spinner" style={{ width: 16, height: 16 }} />
                  Saving...
                </>
              ) : (
                <>
                  <Icons.Check />
                  {project ? 'Update Project' : 'Create Project'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ============================================
// CONTACT DETAIL VIEW
// ============================================
const ContactDetail = ({ contact, projects, onBack, onEdit, onCreateProject }) => {
  const contactProjects = projects.filter(p => p.contact_id === contact.id);

  return (
    <div>
      <div className="ss-detail-header">
        <div>
          <div className="ss-detail-back" onClick={onBack}>
            <Icons.ArrowLeft /> Back to Contacts
          </div>
          <h1 className="ss-detail-title">
            {contact.first_name} {contact.last_name}
          </h1>
          {contact.company_name && (
            <div className="ss-detail-subtitle">{contact.company_name}</div>
          )}
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <button className="ss-btn ss-btn-secondary" onClick={() => onEdit(contact)}>
            <Icons.Edit /> Edit
          </button>
          <button className="ss-btn ss-btn-primary" onClick={() => onCreateProject(contact)}>
            <Icons.Plus /> New Project
          </button>
        </div>
      </div>

      <div className="ss-detail-grid">
        <div>
          <div className="ss-detail-section" style={{ marginBottom: 24 }}>
            <h3 className="ss-detail-section-title">Contact Information</h3>
            <div className="ss-info-list" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
              <div className="ss-info-item">
                <span className="ss-info-label">Email</span>
                <span className="ss-info-value">
                  {contact.email ? (
                    <a href={`mailto:${contact.email}`}>{contact.email}</a>
                  ) : '—'}
                </span>
              </div>
              <div className="ss-info-item">
                <span className="ss-info-label">Phone</span>
                <span className="ss-info-value">{contact.phone || '—'}</span>
              </div>
              <div className="ss-info-item">
                <span className="ss-info-label">Mobile</span>
                <span className="ss-info-value">{contact.mobile || '—'}</span>
              </div>
              <div className="ss-info-item">
                <span className="ss-info-label">Added</span>
                <span className="ss-info-value">{formatDate(contact.created_at)}</span>
              </div>
            </div>
          </div>

          <div className="ss-detail-section" style={{ marginBottom: 24 }}>
            <h3 className="ss-detail-section-title">Address</h3>
            <div className="ss-info-value">
              {contact.address_line_1 ? (
                <>
                  {contact.address_line_1}<br />
                  {contact.address_line_2 && <>{contact.address_line_2}<br /></>}
                  {contact.city}, {contact.state} {contact.postal_code}<br />
                  {contact.country}
                </>
              ) : (
                '—'
              )}
            </div>
          </div>

          {contact.notes && (
            <div className="ss-detail-section">
              <h3 className="ss-detail-section-title">Notes</h3>
              <p className="ss-info-value" style={{ whiteSpace: 'pre-wrap' }}>
                {contact.notes}
              </p>
            </div>
          )}
        </div>

        <div>
          <div className="ss-detail-section" style={{ marginBottom: 24 }}>
            <h3 className="ss-detail-section-title">Quick Actions</h3>
            <div className="ss-quick-actions">
              <button className="ss-quick-action" onClick={() => onCreateProject(contact)}>
                <span className="ss-quick-action-icon"><Icons.Folder /></span>
                Create New Project
              </button>
              <button className="ss-quick-action">
                <span className="ss-quick-action-icon"><Icons.Document /></span>
                Generate Quote
              </button>
              <button className="ss-quick-action">
                <span className="ss-quick-action-icon"><Icons.Document /></span>
                Generate Invoice
              </button>
            </div>
          </div>

          <div className="ss-detail-section">
            <h3 className="ss-detail-section-title">
              Projects ({contactProjects.length})
            </h3>
            {contactProjects.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {contactProjects.map(project => {
                  const statusConfig = getStatusConfig(project.status);
                  return (
                    <div
                      key={project.id}
                      className="ss-project-card"
                      style={{ padding: 16 }}
                    >
                      <div className="ss-project-name">{project.name}</div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
                        <span
                          className="ss-status"
                          style={{
                            background: `${statusConfig.color}20`,
                            color: statusConfig.color
                          }}
                        >
                          <span className="ss-status-dot" />
                          {statusConfig.label}
                        </span>
                        <span style={{ color: 'var(--color-text-secondary)', fontSize: 13 }}>
                          {formatCurrency(project.estimated_value)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p style={{ color: 'var(--color-text-muted)', fontSize: 14 }}>
                No projects yet. Create one to get started.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================
// CONTACTS LIST VIEW
// ============================================
const ContactsList = ({ contacts, onAdd, onEdit, onDelete, onView }) => {
  const [search, setSearch] = useState('');

  const filteredContacts = useMemo(() => {
    if (!search) return contacts;
    const term = search.toLowerCase();
    return contacts.filter(c =>
      c.first_name?.toLowerCase().includes(term) ||
      c.last_name?.toLowerCase().includes(term) ||
      c.company_name?.toLowerCase().includes(term) ||
      c.email?.toLowerCase().includes(term)
    );
  }, [contacts, search]);

  return (
    <div className="ss-panel">
      <div className="ss-panel-header">
        <h2 className="ss-panel-title">
          <span className="ss-panel-title-icon">👥</span>
          Contacts
        </h2>
        <div className="ss-panel-actions">
          <div className="ss-search">
            <span className="ss-search-icon"><Icons.Search /></span>
            <input
              type="text"
              placeholder="Search contacts..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <button className="ss-btn ss-btn-primary" onClick={onAdd}>
            <Icons.Plus /> Add Contact
          </button>
        </div>
      </div>

      {filteredContacts.length > 0 ? (
        <div className="ss-table-wrap">
          <table className="ss-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Contact</th>
                <th>Location</th>
                <th>Added</th>
                <th style={{ width: 120 }}></th>
              </tr>
            </thead>
            <tbody>
              {filteredContacts.map(contact => (
                <tr key={contact.id}>
                  <td>
                    <div className="ss-table-name">
                      <div className="ss-avatar">
                        {getInitials(contact.first_name, contact.last_name)}
                      </div>
                      <div>
                        <div>{contact.first_name} {contact.last_name}</div>
                        {contact.company_name && (
                          <div className="ss-table-company">{contact.company_name}</div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td>
                    <div className="ss-table-contact">
                      {contact.email && (
                        <div>
                          <a href={`mailto:${contact.email}`}>{contact.email}</a>
                        </div>
                      )}
                      {contact.phone && <div>{contact.phone}</div>}
                    </div>
                  </td>
                  <td>
                    <span style={{ color: 'var(--color-text-secondary)' }}>
                      {contact.city && contact.state
                        ? `${contact.city}, ${contact.state}`
                        : '—'}
                    </span>
                  </td>
                  <td>
                    <span style={{ color: 'var(--color-text-secondary)' }}>
                      {formatDate(contact.created_at)}
                    </span>
                  </td>
                  <td>
                    <div className="ss-actions">
                      <button
                        className="ss-btn ss-btn-ghost ss-btn-icon"
                        title="View"
                        onClick={() => onView(contact)}
                      >
                        <Icons.Eye />
                      </button>
                      <button
                        className="ss-btn ss-btn-ghost ss-btn-icon"
                        title="Edit"
                        onClick={() => onEdit(contact)}
                      >
                        <Icons.Edit />
                      </button>
                      <button
                        className="ss-btn ss-btn-ghost ss-btn-icon"
                        title="Delete"
                        onClick={() => onDelete(contact)}
                        style={{ color: 'var(--color-danger)' }}
                      >
                        <Icons.Trash />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="ss-empty">
          <div className="ss-empty-icon">👥</div>
          <h3 className="ss-empty-title">
            {search ? 'No contacts found' : 'No contacts yet'}
          </h3>
          <p className="ss-empty-text">
            {search
              ? 'Try adjusting your search terms.'
              : 'Add your first client to start managing projects and generating documents.'}
          </p>
          {!search && (
            <button className="ss-btn ss-btn-primary" onClick={onAdd}>
              <Icons.Plus /> Add Your First Contact
            </button>
          )}
        </div>
      )}
    </div>
  );
};

// ============================================
// PROJECTS LIST VIEW
// ============================================
const ProjectsList = ({ projects, contacts, onAdd, onEdit, onDelete, onView }) => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState(null);

  const filteredProjects = useMemo(() => {
    let result = projects;

    if (search) {
      const term = search.toLowerCase();
      result = result.filter(p =>
        p.name?.toLowerCase().includes(term) ||
        p.contact?.first_name?.toLowerCase().includes(term) ||
        p.contact?.last_name?.toLowerCase().includes(term) ||
        p.contact?.company_name?.toLowerCase().includes(term)
      );
    }

    if (statusFilter) {
      result = result.filter(p => p.status === statusFilter);
    }

    return result;
  }, [projects, search, statusFilter]);

  const statusCounts = useMemo(() => {
    const counts = {};
    projects.forEach(p => {
      counts[p.status] = (counts[p.status] || 0) + 1;
    });
    return counts;
  }, [projects]);

  return (
    <div className="ss-panel">
      <div className="ss-panel-header">
        <h2 className="ss-panel-title">
          <span className="ss-panel-title-icon">📁</span>
          Projects
        </h2>
        <div className="ss-panel-actions">
          <div className="ss-search">
            <span className="ss-search-icon"><Icons.Search /></span>
            <input
              type="text"
              placeholder="Search projects..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <button className="ss-btn ss-btn-primary" onClick={onAdd}>
            <Icons.Plus /> New Project
          </button>
        </div>
      </div>

      <div className="ss-filter-bar">
        <button
          className={`ss-filter-chip ${!statusFilter ? 'active' : ''}`}
          onClick={() => setStatusFilter(null)}
        >
          All ({projects.length})
        </button>
        {PROJECT_STATUSES.map(status => (
          statusCounts[status.value] > 0 && (
            <button
              key={status.value}
              className={`ss-filter-chip ${statusFilter === status.value ? 'active' : ''}`}
              onClick={() => setStatusFilter(statusFilter === status.value ? null : status.value)}
            >
              <span
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  background: status.color
                }}
              />
              {status.label} ({statusCounts[status.value]})
            </button>
          )
        ))}
      </div>

      {filteredProjects.length > 0 ? (
        <div className="ss-projects-grid">
          {filteredProjects.map(project => {
            const statusConfig = getStatusConfig(project.status);
            const projectType = PROJECT_TYPES.find(t => t.value === project.project_type);
            
            return (
              <div
                key={project.id}
                className="ss-project-card"
                onClick={() => onView(project)}
              >
                <div className="ss-project-header">
                  <div>
                    <div className="ss-project-name">{project.name}</div>
                    <div className="ss-project-client">
                      <span>👤</span>
                      {project.contact?.first_name} {project.contact?.last_name}
                      {project.contact?.company_name && ` — ${project.contact.company_name}`}
                    </div>
                  </div>
                  <span
                    className="ss-status"
                    style={{
                      background: `${statusConfig.color}20`,
                      color: statusConfig.color
                    }}
                  >
                    <span className="ss-status-dot" />
                    {statusConfig.label}
                  </span>
                </div>
                
                {project.description && (
                  <p style={{
                    color: 'var(--color-text-secondary)',
                    fontSize: 14,
                    marginBottom: 12,
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden'
                  }}>
                    {project.description}
                  </p>
                )}

                <div className="ss-project-meta">
                  {projectType && (
                    <span className="ss-project-meta-item">
                      🌿 {projectType.label}
                    </span>
                  )}
                  {project.estimated_value && (
                    <span className="ss-project-meta-item">
                      <Icons.DollarSign />
                      {formatCurrency(project.estimated_value)}
                    </span>
                  )}
                  {project.due_date && (
                    <span className="ss-project-meta-item">
                      <Icons.Calendar />
                      {formatDate(project.due_date)}
                    </span>
                  )}
                </div>

                <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
                  <button
                    className="ss-btn ss-btn-secondary ss-btn-sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      onEdit(project);
                    }}
                  >
                    <Icons.Edit /> Edit
                  </button>
                  <button
                    className="ss-btn ss-btn-secondary ss-btn-sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(project);
                    }}
                    style={{ color: 'var(--color-danger)' }}
                  >
                    <Icons.Trash />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="ss-empty">
          <div className="ss-empty-icon">📁</div>
          <h3 className="ss-empty-title">
            {search || statusFilter ? 'No projects found' : 'No projects yet'}
          </h3>
          <p className="ss-empty-text">
            {search || statusFilter
              ? 'Try adjusting your search or filters.'
              : 'Create your first project to start organizing work and generating documents.'}
          </p>
          {!search && !statusFilter && contacts.length > 0 && (
            <button className="ss-btn ss-btn-primary" onClick={onAdd}>
              <Icons.Plus /> Create Your First Project
            </button>
          )}
          {contacts.length === 0 && (
            <p style={{ color: 'var(--color-text-muted)', fontSize: 14, marginTop: 16 }}>
              Add a contact first to create a project.
            </p>
          )}
        </div>
      )}
    </div>
  );
};

// ============================================
// MAIN COMPONENT
// ============================================
export default function ScapeSuite() {
  const [activeTab, setActiveTab] = useState('contacts');
  const [contacts, setContacts] = useState(mockContacts);
  const [projects, setProjects] = useState(mockProjects);
  const [selectedContact, setSelectedContact] = useState(null);
  const [selectedProject, setSelectedProject] = useState(null);
  const [editingContact, setEditingContact] = useState(null);
  const [editingProject, setEditingProject] = useState(null);
  const [showContactModal, setShowContactModal] = useState(false);
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
  };

  // Contact handlers
  const handleSaveContact = async (contactData) => {
    if (editingContact) {
      // Update
      setContacts(prev => prev.map(c =>
        c.id === editingContact.id ? { ...c, ...contactData } : c
      ));
      showToast('Contact updated successfully');
    } else {
      // Create
      const newContact = {
        ...contactData,
        id: `c${Date.now()}`,
        created_at: new Date().toISOString()
      };
      setContacts(prev => [newContact, ...prev]);
      showToast('Contact created successfully');
    }
    setShowContactModal(false);
    setEditingContact(null);
  };

  const handleDeleteContact = (contact) => {
    if (window.confirm(`Are you sure you want to delete ${contact.first_name} ${contact.last_name}? This will also delete all associated projects.`)) {
      setContacts(prev => prev.filter(c => c.id !== contact.id));
      setProjects(prev => prev.filter(p => p.contact_id !== contact.id));
      showToast('Contact deleted');
    }
  };

  // Project handlers
  const handleSaveProject = async (projectData) => {
    const contact = contacts.find(c => c.id === projectData.contact_id);
    
    if (editingProject) {
      // Update
      setProjects(prev => prev.map(p =>
        p.id === editingProject.id ? { ...p, ...projectData, contact } : p
      ));
      showToast('Project updated successfully');
    } else {
      // Create
      const newProject = {
        ...projectData,
        id: `p${Date.now()}`,
        contact,
        created_at: new Date().toISOString()
      };
      setProjects(prev => [newProject, ...prev]);
      showToast('Project created successfully');
    }
    setShowProjectModal(false);
    setEditingProject(null);
  };

  const handleDeleteProject = (project) => {
    if (window.confirm(`Are you sure you want to delete "${project.name}"?`)) {
      setProjects(prev => prev.filter(p => p.id !== project.id));
      showToast('Project deleted');
    }
  };

  const handleCreateProjectForContact = (contact) => {
    setEditingProject({ contact_id: contact.id });
    setShowProjectModal(true);
  };

  return (
    <div className="scape-suite">
      <style>{styles}</style>
      
      <div className="ss-container">
        {/* Header */}
        <header className="ss-header">
          <div className="ss-logo">
            <div className="ss-logo-icon">🌿</div>
            <div className="ss-logo-text">
              Scape<span>Suite</span>
            </div>
          </div>
          
          <nav className="ss-nav">
            <button
              className={`ss-nav-btn ${activeTab === 'contacts' ? 'active' : ''}`}
              onClick={() => {
                setActiveTab('contacts');
                setSelectedContact(null);
              }}
            >
              <Icons.Users />
              Contacts
              <span className="badge">{contacts.length}</span>
            </button>
            <button
              className={`ss-nav-btn ${activeTab === 'projects' ? 'active' : ''}`}
              onClick={() => {
                setActiveTab('projects');
                setSelectedProject(null);
              }}
            >
              <Icons.Folder />
              Projects
              <span className="badge">{projects.length}</span>
            </button>
          </nav>
        </header>

        {/* Stats Overview */}
        <div className="ss-stats">
          <div className="ss-stat-card">
            <div className="ss-stat-icon">👥</div>
            <div>
              <div className="ss-stat-value">{contacts.length}</div>
              <div className="ss-stat-label">Total Contacts</div>
            </div>
          </div>
          <div className="ss-stat-card">
            <div className="ss-stat-icon">📁</div>
            <div>
              <div className="ss-stat-value">{projects.length}</div>
              <div className="ss-stat-label">Total Projects</div>
            </div>
          </div>
          <div className="ss-stat-card">
            <div className="ss-stat-icon">🚧</div>
            <div>
              <div className="ss-stat-value">
                {projects.filter(p => p.status === 'in_progress').length}
              </div>
              <div className="ss-stat-label">Active Projects</div>
            </div>
          </div>
          <div className="ss-stat-card">
            <div className="ss-stat-icon">💰</div>
            <div>
              <div className="ss-stat-value">
                {formatCurrency(projects.reduce((sum, p) => sum + (p.estimated_value || 0), 0))}
              </div>
              <div className="ss-stat-label">Pipeline Value</div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="ss-content">
          {activeTab === 'contacts' && !selectedContact && (
            <ContactsList
              contacts={contacts}
              onAdd={() => {
                setEditingContact(null);
                setShowContactModal(true);
              }}
              onEdit={(contact) => {
                setEditingContact(contact);
                setShowContactModal(true);
              }}
              onDelete={handleDeleteContact}
              onView={setSelectedContact}
            />
          )}

          {activeTab === 'contacts' && selectedContact && (
            <ContactDetail
              contact={selectedContact}
              projects={projects}
              onBack={() => setSelectedContact(null)}
              onEdit={(contact) => {
                setEditingContact(contact);
                setShowContactModal(true);
              }}
              onCreateProject={handleCreateProjectForContact}
            />
          )}

          {activeTab === 'projects' && (
            <ProjectsList
              projects={projects}
              contacts={contacts}
              onAdd={() => {
                setEditingProject(null);
                setShowProjectModal(true);
              }}
              onEdit={(project) => {
                setEditingProject(project);
                setShowProjectModal(true);
              }}
              onDelete={handleDeleteProject}
              onView={setSelectedProject}
            />
          )}
        </div>
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
        />
      )}

      {/* Toast Notification */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}
