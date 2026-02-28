import React, { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../supabaseClient";

// ─────────────────────────────────────────────────────────────────────────────
// PROJECTS MANAGER - Client Project Hub
// ─────────────────────────────────────────────────────────────────────────────

const projectStatuses = [
  { value: "inquiry", label: "Inquiry", color: "#9C9580" },
  { value: "quoted", label: "Quoted", color: "#D9B97A" },
  { value: "approved", label: "Approved", color: "#6B8F5E" },
  { value: "in_progress", label: "In Progress", color: "#3D5C35" },
  { value: "completed", label: "Completed", color: "#C4845A" },
  { value: "invoiced", label: "Invoiced", color: "#8B5E3C" },
  { value: "paid", label: "Paid", color: "#6B3F1E" },
  { value: "on_hold", label: "On Hold", color: "#C54B3D" },
];

const documentTypes = [
  { key: "quote", label: "Quote", path: "/paperwork/quote", icon: "📋" },
  { key: "invoice", label: "Invoice", path: "/paperwork/invoice", icon: "💰" },
  { key: "work_order", label: "Work Order", path: "/paperwork/work-order", icon: "🔧" },
  { key: "schedule", label: "Schedule", path: "/paperwork/schedule", icon: "📅" },
  { key: "deposit_receipt", label: "Deposit Receipt", path: "/paperwork/deposit-receipt", icon: "🧾" },
  { key: "payment_reminder", label: "Payment Reminder", path: "/paperwork/payment-reminder", icon: "⏰" },
];

const emptyProject = {
  name: "",
  description: "",
  site_address: "",
  status: "inquiry",
  contact_id: null,
  estimated_value: "",
  start_date: "",
  end_date: "",
  notes: "",
};

export default function ProjectsManager() {
  const [projects, setProjects] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [selectedProject, setSelectedProject] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState(emptyProject);
  const [saving, setSaving] = useState(false);
  const [view, setView] = useState("board"); // board | list

  // ─── FETCH DATA ────────────────────────────────────────────────────────────
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Fetch projects with contact info
      const { data: projectsData, error: projectsError } = await supabase
        .from("projects")
        .select(`
          *,
          contact:contacts(id, first_name, last_name, company, email, phone)
        `)
        .eq("user_id", user.id)
        .order("updated_at", { ascending: false });

      if (projectsError) throw projectsError;

      // Fetch all contacts for dropdown
      const { data: contactsData, error: contactsError } = await supabase
        .from("contacts")
        .select("id, first_name, last_name, company")
        .eq("user_id", user.id)
        .eq("is_archived", false)
        .order("last_name");

      if (contactsError) throw contactsError;

      setProjects(projectsData || []);
      setContacts(contactsData || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ─── FILTERED PROJECTS ─────────────────────────────────────────────────────
  const filteredProjects = projects.filter((p) => {
    const searchLower = search.toLowerCase();
    const matchesSearch =
      !search ||
      p.name?.toLowerCase().includes(searchLower) ||
      p.site_address?.toLowerCase().includes(searchLower) ||
      p.contact?.first_name?.toLowerCase().includes(searchLower) ||
      p.contact?.last_name?.toLowerCase().includes(searchLower) ||
      p.contact?.company?.toLowerCase().includes(searchLower);

    const matchesStatus = !filterStatus || p.status === filterStatus;

    return matchesSearch && matchesStatus;
  });

  // ─── GROUP BY STATUS (for board view) ──────────────────────────────────────
  const groupedByStatus = projectStatuses.reduce((acc, status) => {
    acc[status.value] = filteredProjects.filter((p) => p.status === status.value);
    return acc;
  }, {});

  // ─── SAVE PROJECT ──────────────────────────────────────────────────────────
  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const projectData = {
        ...editForm,
        user_id: user.id,
        estimated_value: editForm.estimated_value ? parseFloat(editForm.estimated_value) : null,
        updated_at: new Date().toISOString(),
      };

      if (selectedProject?.id) {
        const { error: updateError } = await supabase
          .from("projects")
          .update(projectData)
          .eq("id", selectedProject.id)
          .eq("user_id", user.id);

        if (updateError) throw updateError;
      } else {
        projectData.created_at = new Date().toISOString();
        const { error: insertError } = await supabase
          .from("projects")
          .insert([projectData]);

        if (insertError) throw insertError;
      }

      await fetchData();
      setIsEditing(false);
      setSelectedProject(null);
      setEditForm(emptyProject);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  // ─── DELETE PROJECT ────────────────────────────────────────────────────────
  const handleDelete = async (projectId) => {
    if (!window.confirm("Delete this project? All associated documents will be unlinked.")) {
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error: deleteError } = await supabase
        .from("projects")
        .delete()
        .eq("id", projectId)
        .eq("user_id", user.id);

      if (deleteError) throw deleteError;

      await fetchData();
      setSelectedProject(null);
    } catch (err) {
      setError(err.message);
    }
  };

  // ─── UPDATE STATUS (drag & drop or quick change) ──────────────────────────
  const updateStatus = async (projectId, newStatus) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error: updateError } = await supabase
        .from("projects")
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq("id", projectId)
        .eq("user_id", user.id);

      if (updateError) throw updateError;

      await fetchData();
    } catch (err) {
      setError(err.message);
    }
  };

  // ─── OPEN EDIT FORM ────────────────────────────────────────────────────────
  const openEdit = (project = null) => {
    if (project) {
      setEditForm({
        ...emptyProject,
        ...project,
        estimated_value: project.estimated_value?.toString() || "",
      });
      setSelectedProject(project);
    } else {
      setEditForm(emptyProject);
      setSelectedProject(null);
    }
    setIsEditing(true);
  };

  // ─── GET STATUS INFO ───────────────────────────────────────────────────────
  const getStatusInfo = (status) => projectStatuses.find((s) => s.value === status) || projectStatuses[0];

  // ─── FORMAT CONTACT NAME ───────────────────────────────────────────────────
  const formatContactName = (contact) => {
    if (!contact) return "No client";
    const name = `${contact.first_name || ""} ${contact.last_name || ""}`.trim();
    return contact.company ? `${name} (${contact.company})` : name;
  };

  // ─── RENDER ────────────────────────────────────────────────────────────────
  return (
    <div className="projects-wrap">
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link
        href="https://fonts.googleapis.com/css2?family=Libre+Baskerville:ital,wght@0,400;0,700;1,400&family=Barlow:wght@300;400;500;600&display=swap"
        rel="stylesheet"
      />

      {/* ─── HEADER ───────────────────────────────────────────────────────────── */}
      <header className="projects-header">
        <div className="header-left">
          <div className="header-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
            </svg>
          </div>
          <div>
            <h1>Projects</h1>
            <p className="header-subtitle">
              {projects.length} project{projects.length !== 1 ? "s" : ""} •{" "}
              {projects.filter((p) => p.status === "in_progress").length} active
            </p>
          </div>
        </div>

        <button className="btn-primary" onClick={() => openEdit()}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          New Project
        </button>
      </header>

      {/* ─── TOOLBAR ──────────────────────────────────────────────────────────── */}
      <div className="projects-toolbar">
        <div className="search-box">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            placeholder="Search projects..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="toolbar-filters">
          <select
            className="filter-select"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="">All Statuses</option>
            {projectStatuses.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>

          <div className="view-toggle">
            <button
              className={`view-btn ${view === "board" ? "active" : ""}`}
              onClick={() => setView("board")}
              title="Board view"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="5" height="18" rx="1" />
                <rect x="10" y="3" width="5" height="12" rx="1" />
                <rect x="17" y="3" width="5" height="8" rx="1" />
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
          <span>Loading projects...</span>
        </div>
      )}

      {/* ─── EMPTY STATE ──────────────────────────────────────────────────────── */}
      {!loading && projects.length === 0 && (
        <div className="empty-state">
          <div className="empty-icon">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
              <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
            </svg>
          </div>
          <h3>No projects yet</h3>
          <p>Create your first project to start organizing your client work.</p>
          <button className="btn-primary" onClick={() => openEdit()}>
            Create Your First Project
          </button>
        </div>
      )}

      {/* ─── BOARD VIEW ───────────────────────────────────────────────────────── */}
      {!loading && projects.length > 0 && view === "board" && (
        <div className="projects-board">
          {projectStatuses.map((status) => (
            <div key={status.value} className="board-column">
              <div className="column-header" style={{ borderColor: status.color }}>
                <span className="column-dot" style={{ background: status.color }} />
                <span className="column-title">{status.label}</span>
                <span className="column-count">{groupedByStatus[status.value]?.length || 0}</span>
              </div>

              <div className="column-cards">
                {groupedByStatus[status.value]?.map((project) => (
                  <div
                    key={project.id}
                    className="project-card"
                    onClick={() => setSelectedProject(project)}
                  >
                    <h4 className="project-name">{project.name}</h4>
                    <p className="project-client">{formatContactName(project.contact)}</p>
                    {project.site_address && (
                      <p className="project-address">{project.site_address}</p>
                    )}
                    {project.estimated_value && (
                      <p className="project-value">
                        £{parseFloat(project.estimated_value).toLocaleString("en-GB")}
                      </p>
                    )}
                  </div>
                ))}

                {groupedByStatus[status.value]?.length === 0 && (
                  <div className="column-empty">No projects</div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ─── LIST VIEW ────────────────────────────────────────────────────────── */}
      {!loading && projects.length > 0 && view === "list" && (
        <div className="projects-list">
          <table>
            <thead>
              <tr>
                <th>Project</th>
                <th>Client</th>
                <th>Status</th>
                <th>Value</th>
                <th>Updated</th>
              </tr>
            </thead>
            <tbody>
              {filteredProjects.map((project) => {
                const statusInfo = getStatusInfo(project.status);
                return (
                  <tr
                    key={project.id}
                    onClick={() => setSelectedProject(project)}
                    className="project-row"
                  >
                    <td>
                      <div className="project-cell-name">{project.name}</div>
                      {project.site_address && (
                        <div className="project-cell-address">{project.site_address}</div>
                      )}
                    </td>
                    <td>{formatContactName(project.contact)}</td>
                    <td>
                      <span
                        className="status-badge"
                        style={{ background: statusInfo.color }}
                      >
                        {statusInfo.label}
                      </span>
                    </td>
                    <td>
                      {project.estimated_value
                        ? `£${parseFloat(project.estimated_value).toLocaleString("en-GB")}`
                        : "—"}
                    </td>
                    <td>{new Date(project.updated_at).toLocaleDateString("en-GB")}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* ─── PROJECT DETAIL PANEL ─────────────────────────────────────────────── */}
      {selectedProject && !isEditing && (
        <div className="detail-overlay" onClick={() => setSelectedProject(null)}>
          <div className="detail-panel" onClick={(e) => e.stopPropagation()}>
            <button className="detail-close" onClick={() => setSelectedProject(null)}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>

            <div className="detail-header">
              <h2>{selectedProject.name}</h2>
              <div
                className="detail-status"
                style={{ background: getStatusInfo(selectedProject.status).color }}
              >
                {getStatusInfo(selectedProject.status).label}
              </div>
            </div>

            {selectedProject.description && (
              <p className="detail-description">{selectedProject.description}</p>
            )}

            {/* Client Info */}
            <div className="detail-section">
              <h4>Client</h4>
              {selectedProject.contact ? (
                <div className="client-card">
                  <div className="client-avatar">
                    {selectedProject.contact.first_name?.[0]?.toUpperCase() || "?"}
                    {selectedProject.contact.last_name?.[0]?.toUpperCase() || ""}
                  </div>
                  <div className="client-info">
                    <div className="client-name">{formatContactName(selectedProject.contact)}</div>
                    {selectedProject.contact.email && (
                      <a href={`mailto:${selectedProject.contact.email}`}>{selectedProject.contact.email}</a>
                    )}
                    {selectedProject.contact.phone && (
                      <a href={`tel:${selectedProject.contact.phone}`}>{selectedProject.contact.phone}</a>
                    )}
                  </div>
                </div>
              ) : (
                <p className="no-client">No client assigned</p>
              )}
            </div>

            {/* Project Details */}
            <div className="detail-section">
              <h4>Details</h4>
              <div className="detail-grid">
                {selectedProject.site_address && (
                  <div className="detail-item">
                    <span className="detail-label">Site Address</span>
                    <span className="detail-value">{selectedProject.site_address}</span>
                  </div>
                )}
                {selectedProject.estimated_value && (
                  <div className="detail-item">
                    <span className="detail-label">Estimated Value</span>
                    <span className="detail-value">
                      £{parseFloat(selectedProject.estimated_value).toLocaleString("en-GB")}
                    </span>
                  </div>
                )}
                {selectedProject.start_date && (
                  <div className="detail-item">
                    <span className="detail-label">Start Date</span>
                    <span className="detail-value">
                      {new Date(selectedProject.start_date).toLocaleDateString("en-GB")}
                    </span>
                  </div>
                )}
                {selectedProject.end_date && (
                  <div className="detail-item">
                    <span className="detail-label">End Date</span>
                    <span className="detail-value">
                      {new Date(selectedProject.end_date).toLocaleDateString("en-GB")}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {selectedProject.notes && (
              <div className="detail-section">
                <h4>Notes</h4>
                <p className="detail-notes">{selectedProject.notes}</p>
              </div>
            )}

            {/* Status Quick Change */}
            <div className="detail-section">
              <h4>Change Status</h4>
              <div className="status-selector">
                {projectStatuses.map((s) => (
                  <button
                    key={s.value}
                    className={`status-btn ${selectedProject.status === s.value ? "active" : ""}`}
                    style={{
                      borderColor: s.color,
                      background: selectedProject.status === s.value ? s.color : "transparent",
                      color: selectedProject.status === s.value ? "#fff" : s.color,
                    }}
                    onClick={() => updateStatus(selectedProject.id, s.value)}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Documents */}
            <div className="detail-section">
              <h4>Create Document</h4>
              <div className="documents-grid">
                {documentTypes.map((doc) => (
                  <Link
                    key={doc.key}
                    to={`${doc.path}?project=${selectedProject.id}`}
                    className="document-link"
                  >
                    <span className="doc-icon">{doc.icon}</span>
                    <span className="doc-label">{doc.label}</span>
                  </Link>
                ))}
              </div>
            </div>

            <div className="detail-meta">
              <span>Created {new Date(selectedProject.created_at).toLocaleDateString("en-GB")}</span>
              <span>Updated {new Date(selectedProject.updated_at).toLocaleDateString("en-GB")}</span>
            </div>

            <div className="detail-actions">
              <button className="btn-primary" onClick={() => openEdit(selectedProject)}>
                Edit Project
              </button>
              <button className="btn-danger" onClick={() => handleDelete(selectedProject.id)}>
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
              <h2>{selectedProject ? "Edit Project" : "New Project"}</h2>
              <button className="modal-close" onClick={() => setIsEditing(false)}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <div className="modal-body">
              <div className="form-section">
                <h3>Project Details</h3>
                <label>
                  <span>Project Name *</span>
                  <input
                    type="text"
                    value={editForm.name}
                    onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
                    placeholder="e.g., Smith Garden Renovation"
                    required
                  />
                </label>
                <label>
                  <span>Description</span>
                  <textarea
                    value={editForm.description}
                    onChange={(e) => setEditForm((f) => ({ ...f, description: e.target.value }))}
                    placeholder="Brief description of the project..."
                    rows={3}
                  />
                </label>
                <label>
                  <span>Site Address</span>
                  <input
                    type="text"
                    value={editForm.site_address}
                    onChange={(e) => setEditForm((f) => ({ ...f, site_address: e.target.value }))}
                    placeholder="Where the work will be done"
                  />
                </label>
              </div>

              <div className="form-section">
                <h3>Client</h3>
                <label>
                  <span>Select Client</span>
                  <select
                    value={editForm.contact_id || ""}
                    onChange={(e) =>
                      setEditForm((f) => ({ ...f, contact_id: e.target.value || null }))
                    }
                  >
                    <option value="">— No client selected —</option>
                    {contacts.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.first_name} {c.last_name}
                        {c.company ? ` (${c.company})` : ""}
                      </option>
                    ))}
                  </select>
                </label>
                <p className="form-hint">
                  <Link to="/contacts">+ Add a new contact</Link>
                </p>
              </div>

              <div className="form-section">
                <h3>Status & Timeline</h3>
                <label>
                  <span>Status</span>
                  <select
                    value={editForm.status}
                    onChange={(e) => setEditForm((f) => ({ ...f, status: e.target.value }))}
                  >
                    {projectStatuses.map((s) => (
                      <option key={s.value} value={s.value}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                </label>

                <div className="form-row two-col">
                  <label>
                    <span>Start Date</span>
                    <input
                      type="date"
                      value={editForm.start_date}
                      onChange={(e) => setEditForm((f) => ({ ...f, start_date: e.target.value }))}
                    />
                  </label>
                  <label>
                    <span>End Date</span>
                    <input
                      type="date"
                      value={editForm.end_date}
                      onChange={(e) => setEditForm((f) => ({ ...f, end_date: e.target.value }))}
                    />
                  </label>
                </div>

                <label>
                  <span>Estimated Value (£)</span>
                  <input
                    type="number"
                    value={editForm.estimated_value}
                    onChange={(e) => setEditForm((f) => ({ ...f, estimated_value: e.target.value }))}
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                  />
                </label>
              </div>

              <div className="form-section">
                <h3>Notes</h3>
                <textarea
                  value={editForm.notes}
                  onChange={(e) => setEditForm((f) => ({ ...f, notes: e.target.value }))}
                  placeholder="Internal notes about this project..."
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
                disabled={saving || !editForm.name}
              >
                {saving ? "Saving..." : selectedProject ? "Save Changes" : "Create Project"}
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
  .projects-wrap {
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
    max-width: 1600px;
    margin: 0 auto;
  }

  /* ── HEADER ─────────────────────────────────────────────────────────────── */
  .projects-header {
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
    background: linear-gradient(135deg, var(--timber) 0%, var(--clay) 100%);
    border-radius: 14px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--white);
  }

  .projects-header h1 {
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
    text-decoration: none;
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
  .projects-toolbar {
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

  /* ── ERROR / LOADING / EMPTY ────────────────────────────────────────────── */
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

  /* ── BOARD VIEW ─────────────────────────────────────────────────────────── */
  .projects-board {
    display: flex;
    gap: 16px;
    overflow-x: auto;
    padding-bottom: 20px;
  }

  .board-column {
    flex: 0 0 280px;
    background: var(--cream);
    border-radius: 12px;
    padding: 16px;
    min-height: 400px;
  }

  .column-header {
    display: flex;
    align-items: center;
    gap: 10px;
    padding-bottom: 12px;
    margin-bottom: 12px;
    border-bottom: 2px solid;
  }

  .column-dot {
    width: 10px;
    height: 10px;
    border-radius: 50%;
  }

  .column-title {
    font-size: 0.85rem;
    font-weight: 600;
    color: var(--bark);
    flex: 1;
  }

  .column-count {
    font-size: 0.75rem;
    font-weight: 500;
    color: var(--stone);
    background: var(--white);
    padding: 2px 8px;
    border-radius: 10px;
  }

  .column-cards {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .column-empty {
    font-size: 0.8rem;
    color: var(--stone);
    text-align: center;
    padding: 20px;
  }

  .project-card {
    background: var(--white);
    border: 1px solid var(--parchment);
    border-radius: 10px;
    padding: 14px;
    cursor: pointer;
    transition: all 0.2s;
  }
  .project-card:hover {
    border-color: var(--sage);
    box-shadow: 0 4px 12px rgba(0,0,0,0.08);
    transform: translateY(-2px);
  }

  .project-name {
    font-family: 'Libre Baskerville', serif;
    font-size: 0.9rem;
    font-weight: 400;
    margin: 0 0 6px;
    color: var(--bark);
  }

  .project-client {
    font-size: 0.8rem;
    color: var(--timber);
    margin: 0 0 4px;
  }

  .project-address {
    font-size: 0.75rem;
    color: var(--stone);
    margin: 0;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .project-value {
    font-size: 0.8rem;
    font-weight: 600;
    color: var(--moss);
    margin: 8px 0 0;
  }

  /* ── LIST VIEW ──────────────────────────────────────────────────────────── */
  .projects-list {
    background: var(--white);
    border: 1px solid var(--parchment);
    border-radius: 12px;
    overflow: hidden;
  }

  .projects-list table {
    width: 100%;
    border-collapse: collapse;
  }

  .projects-list th {
    text-align: left;
    padding: 14px 20px;
    font-size: 0.7rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: var(--stone);
    background: var(--cream);
    border-bottom: 1px solid var(--parchment);
  }

  .projects-list td {
    padding: 16px 20px;
    font-size: 0.9rem;
    border-bottom: 1px solid var(--parchment);
    vertical-align: middle;
  }

  .project-row {
    cursor: pointer;
    transition: background 0.15s;
  }
  .project-row:hover { background: var(--cream); }

  .project-cell-name {
    font-family: 'Libre Baskerville', serif;
    color: var(--bark);
  }

  .project-cell-address {
    font-size: 0.8rem;
    color: var(--stone);
    margin-top: 4px;
  }

  .status-badge {
    display: inline-block;
    padding: 4px 12px;
    border-radius: 12px;
    font-size: 0.75rem;
    font-weight: 500;
    color: #fff;
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
    max-width: 520px;
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
    align-items: flex-start;
    justify-content: space-between;
    gap: 16px;
    margin-bottom: 12px;
    padding-right: 40px;
  }

  .detail-header h2 {
    font-family: 'Libre Baskerville', serif;
    font-size: 1.4rem;
    font-weight: 400;
    margin: 0;
    color: var(--bark);
  }

  .detail-status {
    padding: 6px 14px;
    border-radius: 14px;
    font-size: 0.75rem;
    font-weight: 500;
    color: #fff;
    white-space: nowrap;
  }

  .detail-description {
    font-size: 0.95rem;
    color: var(--stone);
    line-height: 1.6;
    margin: 0 0 24px;
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

  /* Client Card */
  .client-card {
    display: flex;
    gap: 14px;
    padding: 14px;
    background: var(--cream);
    border-radius: 10px;
  }

  .client-avatar {
    width: 44px;
    height: 44px;
    background: linear-gradient(135deg, var(--timber) 0%, var(--clay) 100%);
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--white);
    font-weight: 600;
    font-size: 0.85rem;
    flex-shrink: 0;
  }

  .client-info {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .client-name {
    font-weight: 500;
    color: var(--bark);
  }

  .client-info a {
    font-size: 0.85rem;
    color: var(--moss);
    text-decoration: none;
  }
  .client-info a:hover { text-decoration: underline; }

  .no-client {
    font-size: 0.9rem;
    color: var(--stone);
    font-style: italic;
    margin: 0;
  }

  /* Detail Grid */
  .detail-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;
  }

  .detail-item {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .detail-label {
    font-size: 0.75rem;
    color: var(--stone);
  }

  .detail-value {
    font-size: 0.9rem;
    color: var(--ink);
  }

  .detail-notes {
    font-size: 0.9rem;
    line-height: 1.6;
    color: var(--ink);
    margin: 0;
    white-space: pre-wrap;
  }

  /* Status Selector */
  .status-selector {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }

  .status-btn {
    padding: 6px 14px;
    border: 1.5px solid;
    border-radius: 16px;
    font-size: 0.75rem;
    font-weight: 500;
    cursor: pointer;
    font-family: inherit;
    transition: all 0.2s;
    background: transparent;
  }
  .status-btn:hover { transform: translateY(-1px); }

  /* Documents Grid */
  .documents-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 10px;
  }

  .document-link {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6px;
    padding: 16px 12px;
    background: var(--cream);
    border: 1px solid var(--parchment);
    border-radius: 10px;
    text-decoration: none;
    transition: all 0.2s;
  }
  .document-link:hover {
    background: var(--white);
    border-color: var(--sage);
    transform: translateY(-2px);
  }

  .doc-icon { font-size: 1.5rem; }
  .doc-label {
    font-size: 0.75rem;
    color: var(--bark);
    text-align: center;
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
  .form-section textarea,
  .form-section select {
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
  .form-section textarea:focus,
  .form-section select:focus {
    outline: none;
    border-color: var(--sage);
    box-shadow: 0 0 0 3px rgba(107, 143, 94, 0.15);
  }

  .form-section textarea {
    resize: vertical;
    min-height: 80px;
  }

  .form-row {
    display: grid;
    gap: 14px;
  }
  .form-row.two-col { grid-template-columns: 1fr 1fr; }

  .form-hint {
    font-size: 0.8rem;
    color: var(--stone);
    margin: -8px 0 0;
  }
  .form-hint a {
    color: var(--moss);
    text-decoration: none;
  }
  .form-hint a:hover { text-decoration: underline; }

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
    .projects-wrap { padding: 20px; }
    .projects-header { flex-direction: column; align-items: flex-start; gap: 16px; }
    .projects-toolbar { flex-direction: column; align-items: stretch; }
    .toolbar-filters { flex-wrap: wrap; }
    .form-row.two-col { grid-template-columns: 1fr; }
    .detail-panel { max-width: 100%; }
    .modal { max-width: 100%; margin: 0; border-radius: 12px; }
    .documents-grid { grid-template-columns: repeat(2, 1fr); }
    .detail-grid { grid-template-columns: 1fr; }
  }
`;
