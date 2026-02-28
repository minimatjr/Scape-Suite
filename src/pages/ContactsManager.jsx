import React, { useEffect, useState, useCallback } from "react";
import { supabase } from "../supabaseClient";

// ─────────────────────────────────────────────────────────────────────────────
// CONTACTS MANAGER - Professional Client Contact Book
// ─────────────────────────────────────────────────────────────────────────────

const emptyContact = {
  first_name: "",
  last_name: "",
  company: "",
  email: "",
  phone: "",
  mobile: "",
  address_line1: "",
  address_line2: "",
  city: "",
  county: "",
  postcode: "",
  country: "United Kingdom",
  notes: "",
  tags: [],
  is_archived: false,
};

const tagOptions = [
  "Residential",
  "Commercial",
  "Repeat Client",
  "Referral",
  "High Value",
  "Pending Payment",
  "VIP",
];

export default function ContactsManager() {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [filterTag, setFilterTag] = useState("");
  const [showArchived, setShowArchived] = useState(false);
  const [selectedContact, setSelectedContact] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState(emptyContact);
  const [saving, setSaving] = useState(false);
  const [view, setView] = useState("grid"); // grid | list

  // ─── FETCH CONTACTS ────────────────────────────────────────────────────────
  const fetchContacts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      let query = supabase
        .from("contacts")
        .select("*")
        .eq("user_id", user.id)
        .order("last_name", { ascending: true });

      if (!showArchived) {
        query = query.eq("is_archived", false);
      }

      const { data, error: fetchError } = await query;
      if (fetchError) throw fetchError;

      setContacts(data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [showArchived]);

  useEffect(() => {
    fetchContacts();
  }, [fetchContacts]);

  // ─── FILTERED CONTACTS ─────────────────────────────────────────────────────
  const filteredContacts = contacts.filter((c) => {
    const searchLower = search.toLowerCase();
    const matchesSearch =
      !search ||
      c.first_name?.toLowerCase().includes(searchLower) ||
      c.last_name?.toLowerCase().includes(searchLower) ||
      c.company?.toLowerCase().includes(searchLower) ||
      c.email?.toLowerCase().includes(searchLower) ||
      c.phone?.includes(search) ||
      c.mobile?.includes(search) ||
      c.postcode?.toLowerCase().includes(searchLower);

    const matchesTag = !filterTag || (c.tags && c.tags.includes(filterTag));

    return matchesSearch && matchesTag;
  });

  // ─── CREATE / UPDATE CONTACT ───────────────────────────────────────────────
  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const contactData = {
        ...editForm,
        user_id: user.id,
        updated_at: new Date().toISOString(),
      };

      if (selectedContact?.id) {
        // Update existing
        const { error: updateError } = await supabase
          .from("contacts")
          .update(contactData)
          .eq("id", selectedContact.id)
          .eq("user_id", user.id);

        if (updateError) throw updateError;
      } else {
        // Create new
        contactData.created_at = new Date().toISOString();
        const { error: insertError } = await supabase
          .from("contacts")
          .insert([contactData]);

        if (insertError) throw insertError;
      }

      await fetchContacts();
      setIsEditing(false);
      setSelectedContact(null);
      setEditForm(emptyContact);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  // ─── DELETE CONTACT ────────────────────────────────────────────────────────
  const handleDelete = async (contactId) => {
    if (!window.confirm("Are you sure you want to delete this contact? This cannot be undone.")) {
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error: deleteError } = await supabase
        .from("contacts")
        .delete()
        .eq("id", contactId)
        .eq("user_id", user.id);

      if (deleteError) throw deleteError;

      await fetchContacts();
      setSelectedContact(null);
    } catch (err) {
      setError(err.message);
    }
  };

  // ─── ARCHIVE / UNARCHIVE ───────────────────────────────────────────────────
  const handleArchive = async (contactId, archive) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error: updateError } = await supabase
        .from("contacts")
        .update({ is_archived: archive, updated_at: new Date().toISOString() })
        .eq("id", contactId)
        .eq("user_id", user.id);

      if (updateError) throw updateError;

      await fetchContacts();
      if (selectedContact?.id === contactId) {
        setSelectedContact(null);
      }
    } catch (err) {
      setError(err.message);
    }
  };

  // ─── OPEN EDIT FORM ────────────────────────────────────────────────────────
  const openEdit = (contact = null) => {
    if (contact) {
      setEditForm({ ...emptyContact, ...contact });
      setSelectedContact(contact);
    } else {
      setEditForm(emptyContact);
      setSelectedContact(null);
    }
    setIsEditing(true);
  };

  // ─── TAG TOGGLE ────────────────────────────────────────────────────────────
  const toggleTag = (tag) => {
    setEditForm((prev) => {
      const tags = prev.tags || [];
      if (tags.includes(tag)) {
        return { ...prev, tags: tags.filter((t) => t !== tag) };
      } else {
        return { ...prev, tags: [...tags, tag] };
      }
    });
  };

  // ─── RENDER ────────────────────────────────────────────────────────────────
  return (
    <div className="contacts-wrap">
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link
        href="https://fonts.googleapis.com/css2?family=Libre+Baskerville:ital,wght@0,400;0,700;1,400&family=Barlow:wght@300;400;500;600&display=swap"
        rel="stylesheet"
      />

      {/* ─── HEADER ───────────────────────────────────────────────────────────── */}
      <header className="contacts-header">
        <div className="header-left">
          <div className="header-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          </div>
          <div>
            <h1>Client Contacts</h1>
            <p className="header-subtitle">
              {contacts.length} contact{contacts.length !== 1 ? "s" : ""} •{" "}
              {contacts.filter((c) => !c.is_archived).length} active
            </p>
          </div>
        </div>

        <button className="btn-primary" onClick={() => openEdit()}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Add Contact
        </button>
      </header>

      {/* ─── TOOLBAR ──────────────────────────────────────────────────────────── */}
      <div className="contacts-toolbar">
        <div className="search-box">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            placeholder="Search contacts..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="toolbar-filters">
          <select
            className="filter-select"
            value={filterTag}
            onChange={(e) => setFilterTag(e.target.value)}
          >
            <option value="">All Tags</option>
            {tagOptions.map((tag) => (
              <option key={tag} value={tag}>
                {tag}
              </option>
            ))}
          </select>

          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={showArchived}
              onChange={(e) => setShowArchived(e.target.checked)}
            />
            Show archived
          </label>

          <div className="view-toggle">
            <button
              className={`view-btn ${view === "grid" ? "active" : ""}`}
              onClick={() => setView("grid")}
              title="Grid view"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="7" height="7" />
                <rect x="14" y="3" width="7" height="7" />
                <rect x="14" y="14" width="7" height="7" />
                <rect x="3" y="14" width="7" height="7" />
              </svg>
            </button>
            <button
              className={`view-btn ${view === "list" ? "active" : ""}`}
              onClick={() => setView("list")}
              title="List view"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="8" y1="6" x2="21" y2="6" />
                <line x1="8" y1="12" x2="21" y2="12" />
                <line x1="8" y1="18" x2="21" y2="18" />
                <line x1="3" y1="6" x2="3.01" y2="6" />
                <line x1="3" y1="12" x2="3.01" y2="12" />
                <line x1="3" y1="18" x2="3.01" y2="18" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* ─── ERROR ────────────────────────────────────────────────────────────── */}
      {error && (
        <div className="error-banner">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="15" y1="9" x2="9" y2="15" />
            <line x1="9" y1="9" x2="15" y2="15" />
          </svg>
          {error}
        </div>
      )}

      {/* ─── LOADING ──────────────────────────────────────────────────────────── */}
      {loading && (
        <div className="loading-state">
          <div className="spinner" />
          <span>Loading contacts...</span>
        </div>
      )}

      {/* ─── EMPTY STATE ──────────────────────────────────────────────────────── */}
      {!loading && filteredContacts.length === 0 && (
        <div className="empty-state">
          <div className="empty-icon">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          </div>
          <h3>No contacts found</h3>
          <p>
            {search || filterTag
              ? "Try adjusting your search or filters."
              : "Add your first client contact to get started."}
          </p>
          {!search && !filterTag && (
            <button className="btn-primary" onClick={() => openEdit()}>
              Add Your First Contact
            </button>
          )}
        </div>
      )}

      {/* ─── CONTACTS GRID / LIST ─────────────────────────────────────────────── */}
      {!loading && filteredContacts.length > 0 && (
        <div className={`contacts-${view}`}>
          {filteredContacts.map((contact) => (
            <div
              key={contact.id}
              className={`contact-card ${contact.is_archived ? "archived" : ""} ${
                selectedContact?.id === contact.id ? "selected" : ""
              }`}
              onClick={() => setSelectedContact(contact)}
            >
              <div className="contact-avatar">
                {contact.first_name?.[0]?.toUpperCase() || "?"}
                {contact.last_name?.[0]?.toUpperCase() || ""}
              </div>

              <div className="contact-info">
                <h3 className="contact-name">
                  {contact.first_name} {contact.last_name}
                  {contact.is_archived && <span className="archived-badge">Archived</span>}
                </h3>
                {contact.company && <p className="contact-company">{contact.company}</p>}
                {contact.email && <p className="contact-detail">{contact.email}</p>}
                {(contact.phone || contact.mobile) && (
                  <p className="contact-detail">{contact.mobile || contact.phone}</p>
                )}
              </div>

              {contact.tags && contact.tags.length > 0 && (
                <div className="contact-tags">
                  {contact.tags.slice(0, 2).map((tag) => (
                    <span key={tag} className="tag">
                      {tag}
                    </span>
                  ))}
                  {contact.tags.length > 2 && (
                    <span className="tag tag-more">+{contact.tags.length - 2}</span>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ─── CONTACT DETAIL PANEL ─────────────────────────────────────────────── */}
      {selectedContact && !isEditing && (
        <div className="detail-overlay" onClick={() => setSelectedContact(null)}>
          <div className="detail-panel" onClick={(e) => e.stopPropagation()}>
            <button className="detail-close" onClick={() => setSelectedContact(null)}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>

            <div className="detail-header">
              <div className="detail-avatar">
                {selectedContact.first_name?.[0]?.toUpperCase() || "?"}
                {selectedContact.last_name?.[0]?.toUpperCase() || ""}
              </div>
              <div>
                <h2>
                  {selectedContact.first_name} {selectedContact.last_name}
                </h2>
                {selectedContact.company && <p className="detail-company">{selectedContact.company}</p>}
              </div>
            </div>

            {selectedContact.tags && selectedContact.tags.length > 0 && (
              <div className="detail-tags">
                {selectedContact.tags.map((tag) => (
                  <span key={tag} className="tag">
                    {tag}
                  </span>
                ))}
              </div>
            )}

            <div className="detail-section">
              <h4>Contact Information</h4>
              {selectedContact.email && (
                <div className="detail-row">
                  <span className="detail-label">Email</span>
                  <a href={`mailto:${selectedContact.email}`}>{selectedContact.email}</a>
                </div>
              )}
              {selectedContact.phone && (
                <div className="detail-row">
                  <span className="detail-label">Phone</span>
                  <a href={`tel:${selectedContact.phone}`}>{selectedContact.phone}</a>
                </div>
              )}
              {selectedContact.mobile && (
                <div className="detail-row">
                  <span className="detail-label">Mobile</span>
                  <a href={`tel:${selectedContact.mobile}`}>{selectedContact.mobile}</a>
                </div>
              )}
            </div>

            {(selectedContact.address_line1 || selectedContact.city || selectedContact.postcode) && (
              <div className="detail-section">
                <h4>Address</h4>
                <address className="detail-address">
                  {selectedContact.address_line1 && <div>{selectedContact.address_line1}</div>}
                  {selectedContact.address_line2 && <div>{selectedContact.address_line2}</div>}
                  {(selectedContact.city || selectedContact.county) && (
                    <div>
                      {selectedContact.city}
                      {selectedContact.city && selectedContact.county && ", "}
                      {selectedContact.county}
                    </div>
                  )}
                  {selectedContact.postcode && <div>{selectedContact.postcode}</div>}
                  {selectedContact.country && selectedContact.country !== "United Kingdom" && (
                    <div>{selectedContact.country}</div>
                  )}
                </address>
              </div>
            )}

            {selectedContact.notes && (
              <div className="detail-section">
                <h4>Notes</h4>
                <p className="detail-notes">{selectedContact.notes}</p>
              </div>
            )}

            <div className="detail-meta">
              <span>Created {new Date(selectedContact.created_at).toLocaleDateString("en-GB")}</span>
              {selectedContact.updated_at && (
                <span>Updated {new Date(selectedContact.updated_at).toLocaleDateString("en-GB")}</span>
              )}
            </div>

            <div className="detail-actions">
              <button className="btn-primary" onClick={() => openEdit(selectedContact)}>
                Edit Contact
              </button>
              {selectedContact.is_archived ? (
                <button
                  className="btn-secondary"
                  onClick={() => handleArchive(selectedContact.id, false)}
                >
                  Restore
                </button>
              ) : (
                <button
                  className="btn-secondary"
                  onClick={() => handleArchive(selectedContact.id, true)}
                >
                  Archive
                </button>
              )}
              <button className="btn-danger" onClick={() => handleDelete(selectedContact.id)}>
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── EDIT / CREATE MODAL ──────────────────────────────────────────────── */}
      {isEditing && (
        <div className="modal-overlay" onClick={() => setIsEditing(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{selectedContact ? "Edit Contact" : "New Contact"}</h2>
              <button className="modal-close" onClick={() => setIsEditing(false)}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <div className="modal-body">
              <div className="form-section">
                <h3>Personal Details</h3>
                <div className="form-row two-col">
                  <label>
                    <span>First Name *</span>
                    <input
                      type="text"
                      value={editForm.first_name}
                      onChange={(e) => setEditForm((f) => ({ ...f, first_name: e.target.value }))}
                      required
                    />
                  </label>
                  <label>
                    <span>Last Name *</span>
                    <input
                      type="text"
                      value={editForm.last_name}
                      onChange={(e) => setEditForm((f) => ({ ...f, last_name: e.target.value }))}
                      required
                    />
                  </label>
                </div>
                <label>
                  <span>Company</span>
                  <input
                    type="text"
                    value={editForm.company}
                    onChange={(e) => setEditForm((f) => ({ ...f, company: e.target.value }))}
                  />
                </label>
              </div>

              <div className="form-section">
                <h3>Contact Details</h3>
                <label>
                  <span>Email</span>
                  <input
                    type="email"
                    value={editForm.email}
                    onChange={(e) => setEditForm((f) => ({ ...f, email: e.target.value }))}
                  />
                </label>
                <div className="form-row two-col">
                  <label>
                    <span>Phone</span>
                    <input
                      type="tel"
                      value={editForm.phone}
                      onChange={(e) => setEditForm((f) => ({ ...f, phone: e.target.value }))}
                    />
                  </label>
                  <label>
                    <span>Mobile</span>
                    <input
                      type="tel"
                      value={editForm.mobile}
                      onChange={(e) => setEditForm((f) => ({ ...f, mobile: e.target.value }))}
                    />
                  </label>
                </div>
              </div>

              <div className="form-section">
                <h3>Address</h3>
                <label>
                  <span>Address Line 1</span>
                  <input
                    type="text"
                    value={editForm.address_line1}
                    onChange={(e) => setEditForm((f) => ({ ...f, address_line1: e.target.value }))}
                  />
                </label>
                <label>
                  <span>Address Line 2</span>
                  <input
                    type="text"
                    value={editForm.address_line2}
                    onChange={(e) => setEditForm((f) => ({ ...f, address_line2: e.target.value }))}
                  />
                </label>
                <div className="form-row three-col">
                  <label>
                    <span>City / Town</span>
                    <input
                      type="text"
                      value={editForm.city}
                      onChange={(e) => setEditForm((f) => ({ ...f, city: e.target.value }))}
                    />
                  </label>
                  <label>
                    <span>County</span>
                    <input
                      type="text"
                      value={editForm.county}
                      onChange={(e) => setEditForm((f) => ({ ...f, county: e.target.value }))}
                    />
                  </label>
                  <label>
                    <span>Postcode</span>
                    <input
                      type="text"
                      value={editForm.postcode}
                      onChange={(e) => setEditForm((f) => ({ ...f, postcode: e.target.value }))}
                    />
                  </label>
                </div>
              </div>

              <div className="form-section">
                <h3>Tags</h3>
                <div className="tag-selector">
                  {tagOptions.map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      className={`tag-btn ${editForm.tags?.includes(tag) ? "selected" : ""}`}
                      onClick={() => toggleTag(tag)}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>

              <div className="form-section">
                <h3>Notes</h3>
                <textarea
                  value={editForm.notes}
                  onChange={(e) => setEditForm((f) => ({ ...f, notes: e.target.value }))}
                  placeholder="Internal notes about this client..."
                  rows={4}
                />
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setIsEditing(false)}>
                Cancel
              </button>
              <button
                className="btn-primary"
                onClick={handleSave}
                disabled={saving || !editForm.first_name || !editForm.last_name}
              >
                {saving ? "Saving..." : selectedContact ? "Save Changes" : "Create Contact"}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{styles}</style>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// STYLES
// ─────────────────────────────────────────────────────────────────────────────

const styles = `
  /* ── VARIABLES ──────────────────────────────────────────────────────────── */
  .contacts-wrap {
    --ink: #1A1208;
    --bark: #3B2410;
    --timber: #6B3F1E;
    --soil: #8B5E3C;
    --clay: #C4845A;
    --straw: #D9B97A;
    --moss: #3D5C35;
    --sage: #6B8F5E;
    --fern: #A8C49A;
    --cream: #F4EDD8;
    --parchment: #EDE0C4;
    --white: #FBF8F1;
    --stone: #9C9580;
    --red: #C54B3D;
    --red-light: #FDF2F1;

    font-family: 'Barlow', sans-serif;
    color: var(--ink);
    min-height: 100vh;
    padding: 32px 48px;
    max-width: 1400px;
    margin: 0 auto;
  }

  /* ── HEADER ─────────────────────────────────────────────────────────────── */
  .contacts-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 32px;
  }

  .header-left {
    display: flex;
    align-items: center;
    gap: 16px;
  }

  .header-icon {
    width: 52px;
    height: 52px;
    background: linear-gradient(135deg, var(--moss) 0%, var(--sage) 100%);
    border-radius: 14px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--white);
  }

  .contacts-header h1 {
    font-family: 'Libre Baskerville', serif;
    font-size: 1.75rem;
    font-weight: 400;
    margin: 0;
    color: var(--bark);
  }

  .header-subtitle {
    margin: 4px 0 0;
    font-size: 0.875rem;
    color: var(--stone);
  }

  /* ── BUTTONS ────────────────────────────────────────────────────────────── */
  .btn-primary {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 12px 24px;
    background: var(--moss);
    color: var(--white);
    border: none;
    border-radius: 10px;
    font-size: 0.9rem;
    font-weight: 500;
    cursor: pointer;
    font-family: inherit;
    transition: all 0.2s;
  }
  .btn-primary:hover { background: var(--sage); transform: translateY(-1px); }
  .btn-primary:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }

  .btn-secondary {
    padding: 12px 24px;
    background: transparent;
    color: var(--bark);
    border: 1.5px solid var(--parchment);
    border-radius: 10px;
    font-size: 0.9rem;
    font-weight: 500;
    cursor: pointer;
    font-family: inherit;
    transition: all 0.2s;
  }
  .btn-secondary:hover { border-color: var(--stone); background: var(--cream); }

  .btn-danger {
    padding: 12px 24px;
    background: transparent;
    color: var(--red);
    border: 1.5px solid var(--red-light);
    border-radius: 10px;
    font-size: 0.9rem;
    font-weight: 500;
    cursor: pointer;
    font-family: inherit;
    transition: all 0.2s;
  }
  .btn-danger:hover { background: var(--red-light); border-color: var(--red); }

  /* ── TOOLBAR ────────────────────────────────────────────────────────────── */
  .contacts-toolbar {
    display: flex;
    gap: 16px;
    align-items: center;
    flex-wrap: wrap;
    margin-bottom: 24px;
    padding: 16px 20px;
    background: var(--white);
    border: 1px solid var(--parchment);
    border-radius: 12px;
  }

  .search-box {
    flex: 1;
    min-width: 240px;
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px 16px;
    background: var(--cream);
    border-radius: 8px;
    border: 1px solid transparent;
    transition: all 0.2s;
  }
  .search-box:focus-within {
    border-color: var(--sage);
    background: var(--white);
  }
  .search-box svg { color: var(--stone); flex-shrink: 0; }
  .search-box input {
    flex: 1;
    border: none;
    background: transparent;
    font-size: 0.9rem;
    color: var(--ink);
    outline: none;
    font-family: inherit;
  }
  .search-box input::placeholder { color: var(--stone); }

  .toolbar-filters {
    display: flex;
    align-items: center;
    gap: 16px;
  }

  .filter-select {
    padding: 10px 16px;
    border: 1px solid var(--parchment);
    border-radius: 8px;
    font-size: 0.875rem;
    color: var(--ink);
    background: var(--white);
    cursor: pointer;
    font-family: inherit;
  }

  .checkbox-label {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 0.875rem;
    color: var(--stone);
    cursor: pointer;
  }
  .checkbox-label input { accent-color: var(--moss); }

  .view-toggle {
    display: flex;
    gap: 4px;
    padding: 4px;
    background: var(--cream);
    border-radius: 8px;
  }
  .view-btn {
    padding: 8px;
    background: transparent;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    color: var(--stone);
    transition: all 0.2s;
  }
  .view-btn:hover { color: var(--bark); }
  .view-btn.active { background: var(--white); color: var(--moss); box-shadow: 0 1px 3px rgba(0,0,0,0.1); }

  /* ── ERROR BANNER ───────────────────────────────────────────────────────── */
  .error-banner {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 16px 20px;
    background: var(--red-light);
    border: 1px solid var(--red);
    border-radius: 10px;
    color: var(--red);
    margin-bottom: 24px;
    font-size: 0.9rem;
  }

  /* ── LOADING ────────────────────────────────────────────────────────────── */
  .loading-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 80px;
    color: var(--stone);
  }
  .spinner {
    width: 32px;
    height: 32px;
    border: 3px solid var(--parchment);
    border-top-color: var(--moss);
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
    margin-bottom: 16px;
  }
  @keyframes spin { to { transform: rotate(360deg); } }

  /* ── EMPTY STATE ────────────────────────────────────────────────────────── */
  .empty-state {
    text-align: center;
    padding: 80px 40px;
    background: var(--cream);
    border-radius: 16px;
    border: 2px dashed var(--parchment);
  }
  .empty-icon { color: var(--stone); margin-bottom: 20px; }
  .empty-state h3 {
    font-family: 'Libre Baskerville', serif;
    font-size: 1.25rem;
    margin: 0 0 8px;
    color: var(--bark);
  }
  .empty-state p {
    margin: 0 0 24px;
    color: var(--stone);
    font-size: 0.95rem;
  }

  /* ── CONTACTS GRID ──────────────────────────────────────────────────────── */
  .contacts-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
    gap: 20px;
  }

  .contacts-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .contacts-list .contact-card {
    flex-direction: row;
    align-items: center;
  }
  .contacts-list .contact-avatar { width: 44px; height: 44px; font-size: 0.9rem; }
  .contacts-list .contact-info { flex: 1; }
  .contacts-list .contact-tags { margin-top: 0; }

  .contact-card {
    display: flex;
    flex-direction: column;
    gap: 12px;
    padding: 20px;
    background: var(--white);
    border: 1px solid var(--parchment);
    border-radius: 12px;
    cursor: pointer;
    transition: all 0.2s;
  }
  .contact-card:hover {
    border-color: var(--sage);
    box-shadow: 0 4px 20px rgba(61, 92, 53, 0.1);
    transform: translateY(-2px);
  }
  .contact-card.selected {
    border-color: var(--moss);
    box-shadow: 0 4px 20px rgba(61, 92, 53, 0.15);
  }
  .contact-card.archived { opacity: 0.6; }

  .contact-avatar {
    width: 52px;
    height: 52px;
    background: linear-gradient(135deg, var(--timber) 0%, var(--clay) 100%);
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--white);
    font-weight: 600;
    font-size: 1rem;
    flex-shrink: 0;
  }

  .contact-info { flex: 1; min-width: 0; }

  .contact-name {
    font-family: 'Libre Baskerville', serif;
    font-size: 1rem;
    font-weight: 400;
    margin: 0 0 4px;
    color: var(--bark);
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .archived-badge {
    font-family: 'Barlow', sans-serif;
    font-size: 0.65rem;
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    padding: 3px 8px;
    background: var(--stone);
    color: var(--white);
    border-radius: 4px;
  }

  .contact-company {
    font-size: 0.85rem;
    color: var(--timber);
    margin: 0 0 8px;
  }

  .contact-detail {
    font-size: 0.8rem;
    color: var(--stone);
    margin: 2px 0;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .contact-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin-top: 8px;
  }

  .tag {
    font-size: 0.7rem;
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 0.03em;
    padding: 4px 10px;
    background: var(--fern);
    color: var(--bark);
    border-radius: 4px;
  }
  .tag-more {
    background: var(--parchment);
    color: var(--stone);
  }

  /* ── DETAIL PANEL ───────────────────────────────────────────────────────── */
  .detail-overlay {
    position: fixed;
    inset: 0;
    background: rgba(26, 18, 8, 0.4);
    z-index: 100;
    display: flex;
    justify-content: flex-end;
    animation: fadeIn 0.2s ease;
  }
  @keyframes fadeIn { from { opacity: 0; } }

  .detail-panel {
    width: 100%;
    max-width: 480px;
    background: var(--white);
    height: 100%;
    overflow-y: auto;
    padding: 32px;
    position: relative;
    animation: slideIn 0.3s ease;
  }
  @keyframes slideIn { from { transform: translateX(100%); } }

  .detail-close {
    position: absolute;
    top: 24px;
    right: 24px;
    background: var(--cream);
    border: none;
    width: 36px;
    height: 36px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    color: var(--stone);
    transition: all 0.2s;
  }
  .detail-close:hover { background: var(--parchment); color: var(--bark); }

  .detail-header {
    display: flex;
    align-items: center;
    gap: 16px;
    margin-bottom: 20px;
  }

  .detail-avatar {
    width: 64px;
    height: 64px;
    background: linear-gradient(135deg, var(--timber) 0%, var(--clay) 100%);
    border-radius: 14px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--white);
    font-weight: 600;
    font-size: 1.25rem;
  }

  .detail-header h2 {
    font-family: 'Libre Baskerville', serif;
    font-size: 1.4rem;
    font-weight: 400;
    margin: 0;
    color: var(--bark);
  }

  .detail-company {
    font-size: 0.95rem;
    color: var(--timber);
    margin: 4px 0 0;
  }

  .detail-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-bottom: 28px;
  }

  .detail-section {
    margin-bottom: 24px;
    padding-bottom: 24px;
    border-bottom: 1px solid var(--parchment);
  }

  .detail-section h4 {
    font-size: 0.7rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: var(--stone);
    margin: 0 0 12px;
  }

  .detail-row {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    margin-bottom: 8px;
  }

  .detail-label {
    font-size: 0.85rem;
    color: var(--stone);
  }

  .detail-row a {
    color: var(--moss);
    text-decoration: none;
    font-size: 0.9rem;
  }
  .detail-row a:hover { text-decoration: underline; }

  .detail-address {
    font-style: normal;
    font-size: 0.9rem;
    line-height: 1.7;
    color: var(--ink);
  }

  .detail-notes {
    font-size: 0.9rem;
    line-height: 1.6;
    color: var(--ink);
    margin: 0;
    white-space: pre-wrap;
  }

  .detail-meta {
    display: flex;
    gap: 20px;
    font-size: 0.75rem;
    color: var(--stone);
    margin-bottom: 28px;
  }

  .detail-actions {
    display: flex;
    gap: 12px;
    flex-wrap: wrap;
  }

  /* ── MODAL ──────────────────────────────────────────────────────────────── */
  .modal-overlay {
    position: fixed;
    inset: 0;
    background: rgba(26, 18, 8, 0.5);
    z-index: 200;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 24px;
    animation: fadeIn 0.2s ease;
  }

  .modal {
    width: 100%;
    max-width: 640px;
    max-height: 90vh;
    background: var(--white);
    border-radius: 16px;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    animation: modalIn 0.3s ease;
  }
  @keyframes modalIn { from { opacity: 0; transform: scale(0.95) translateY(20px); } }

  .modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 24px 28px;
    border-bottom: 1px solid var(--parchment);
  }

  .modal-header h2 {
    font-family: 'Libre Baskerville', serif;
    font-size: 1.25rem;
    font-weight: 400;
    margin: 0;
    color: var(--bark);
  }

  .modal-close {
    background: var(--cream);
    border: none;
    width: 36px;
    height: 36px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    color: var(--stone);
    transition: all 0.2s;
  }
  .modal-close:hover { background: var(--parchment); color: var(--bark); }

  .modal-body {
    padding: 28px;
    overflow-y: auto;
    flex: 1;
  }

  .form-section {
    margin-bottom: 28px;
  }
  .form-section:last-child { margin-bottom: 0; }

  .form-section h3 {
    font-size: 0.7rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: var(--stone);
    margin: 0 0 16px;
    padding-bottom: 8px;
    border-bottom: 1px solid var(--parchment);
  }

  .form-section label {
    display: block;
    margin-bottom: 14px;
  }

  .form-section label span {
    display: block;
    font-size: 0.8rem;
    font-weight: 500;
    color: var(--bark);
    margin-bottom: 6px;
  }

  .form-section input,
  .form-section textarea {
    width: 100%;
    padding: 12px 16px;
    border: 1px solid var(--parchment);
    border-radius: 8px;
    font-size: 0.9rem;
    color: var(--ink);
    background: var(--white);
    font-family: inherit;
    transition: all 0.2s;
  }
  .form-section input:focus,
  .form-section textarea:focus {
    outline: none;
    border-color: var(--sage);
    box-shadow: 0 0 0 3px rgba(107, 143, 94, 0.15);
  }

  .form-section textarea {
    resize: vertical;
    min-height: 100px;
  }

  .form-row {
    display: grid;
    gap: 14px;
  }
  .form-row.two-col { grid-template-columns: 1fr 1fr; }
  .form-row.three-col { grid-template-columns: 1fr 1fr 1fr; }

  .tag-selector {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }

  .tag-btn {
    padding: 8px 16px;
    border: 1px solid var(--parchment);
    border-radius: 20px;
    background: var(--white);
    font-size: 0.8rem;
    color: var(--stone);
    cursor: pointer;
    transition: all 0.2s;
    font-family: inherit;
  }
  .tag-btn:hover { border-color: var(--sage); color: var(--moss); }
  .tag-btn.selected {
    background: var(--fern);
    border-color: var(--sage);
    color: var(--bark);
  }

  .modal-footer {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
    padding: 20px 28px;
    border-top: 1px solid var(--parchment);
    background: var(--cream);
  }

  /* ── RESPONSIVE ─────────────────────────────────────────────────────────── */
  @media (max-width: 768px) {
    .contacts-wrap { padding: 20px; }
    .contacts-header { flex-direction: column; align-items: flex-start; gap: 16px; }
    .contacts-toolbar { flex-direction: column; align-items: stretch; }
    .toolbar-filters { flex-wrap: wrap; }
    .form-row.two-col, .form-row.three-col { grid-template-columns: 1fr; }
    .detail-panel { max-width: 100%; }
    .modal { max-width: 100%; margin: 0; border-radius: 12px; }
  }
`;
