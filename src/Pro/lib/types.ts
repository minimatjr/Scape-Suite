export type Contact = {
  id: string;
  user_id: string;
  company_name: string | null;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  address_line1: string | null;
  address_line2: string | null;
  city: string | null;
  county: string | null;
  postcode: string | null;
  country: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type Project = {
  id: string;
  user_id: string;
  contact_id: string;
  title: string;
  status: "active" | "archived" | "completed";
  site_address_line1: string | null;
  site_address_line2: string | null;
  site_city: string | null;
  site_county: string | null;
  site_postcode: string | null;
  site_country: string | null;
  start_date: string | null;
  end_date: string | null;
  tags: string[];
  description: string | null;
  created_at: string;
  updated_at: string;
};

export type ProjectDocument = {
  id: string;
  user_id: string;
  project_id: string;
  doc_type: "quote" | "invoice" | "work_order" | "proposal" | "other";
  title: string;
  status: "draft" | "sent" | "accepted" | "paid" | "void";
  payload: Record<string, unknown>;
  pdf_path: string | null;
  created_at: string;
  updated_at: string;
};