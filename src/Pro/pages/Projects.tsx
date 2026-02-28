import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import type { Contact, Project } from "../lib/types";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/components/ui/use-toast";

import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

const ProjectSchema = z.object({
  title: z.string().min(2).max(240),
  contact_id: z.string().uuid(),
  status: z.enum(["active", "archived", "completed"]).default("active"),
  site_address_line1: z.string().max(200).optional().or(z.literal("")),
  site_address_line2: z.string().max(200).optional().or(z.literal("")),
  site_city: z.string().max(120).optional().or(z.literal("")),
  site_county: z.string().max(120).optional().or(z.literal("")),
  site_postcode: z.string().max(20).optional().or(z.literal("")),
  site_country: z.string().max(80).optional().or(z.literal("")),
  description: z.string().max(4000).optional().or(z.literal("")),
});

type ProjectForm = z.infer<typeof ProjectSchema>;

function n(v?: string) {
  return v && v.trim().length ? v.trim() : null;
}

export default function Projects() {
  const navigate = useNavigate();
  const [contacts, setContacts] = React.useState<Contact[]>([]);
  const [projects, setProjects] = React.useState<(Project & { contact?: Contact })[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [q, setQ] = React.useState("");
  const [open, setOpen] = React.useState(false);

  const form = useForm<ProjectForm>({
    resolver: zodResolver(ProjectSchema),
    defaultValues: {
      title: "",
      contact_id: "",
      status: "active",
      site_address_line1: "",
      site_address_line2: "",
      site_city: "",
      site_county: "",
      site_postcode: "",
      site_country: "UK",
      description: "",
    },
  });

async function load() {
    setLoading(true);

    const [contactsRes, projectsRes] = await Promise.all([
      supabase.from("contacts").select("*").order("updated_at", { ascending: false }),
      supabase.from("projects").select("*").order("updated_at", { ascending: false }),
    ]);

    setLoading(false);

    if (contactsRes.error) {
      toast({ title: "Couldn’t load contacts", description: contactsRes.error.message });
      return;
    }
    if (projectsRes.error) {
      toast({ title: "Couldn’t load projects", description: projectsRes.error.message });
      return;
    }

    const c = (contactsRes.data ?? []) as Contact[];
    const p = (projectsRes.data ?? []) as Project[];

    const map = new Map(c.map((x) => [x.id, x]));
    setContacts(c);
    setProjects(p.map((x) => ({ ...x, contact: map.get(x.contact_id) })));
  }

  React.useEffect(() => {
    load();
  }, []);

  function openCreate() {
    if (contacts.length === 0) {
      toast({
        title: "Create a contact first",
        description: "Projects are attached to a customer record. Add a contact, then create a project.",
      });
      navigate("/contacts");
      return;
    }

    form.reset({
      title: "",
      contact_id: contacts[0].id,
      status: "active",
      site_address_line1: "",
      site_address_line2: "",
      site_city: "",
      site_county: "",
      site_postcode: "",
      site_country: "UK",
      description: "",
    });
    setOpen(true);
  }

async function create(values: ProjectForm) {
    const { data: userData } = await supabase.auth.getUser();
    const userId = userData.user?.id;
    if (!userId) {
      toast({ title: "Not signed in", description: "Please sign in again." });
      return;
    }

    const payload = {
      user_id: userId,
      title: values.title.trim(),
      contact_id: values.contact_id,
      status: values.status,
      site_address_line1: n(values.site_address_line1),
      site_address_line2: n(values.site_address_line2),
      site_city: n(values.site_city),
      site_county: n(values.site_county),
      site_postcode: n(values.site_postcode),
      site_country: n(values.site_country) ?? "UK",
      description: n(values.description),
    };

    const { data, error } = await supabase.from("projects").insert(payload).select("*").single();
    if (error) {
      toast({ title: "Couldn’t create project", description: error.message });
      return;
    }

    toast({ title: "Project created" });
    setOpen(false);

    const project = data as Project;
    navigate(`/projects/${project.id}`);
  }

  const filtered = projects.filter((p) => {
    const hay = `${p.title} ${p.contact?.company_name ?? ""} ${p.contact?.first_name ?? ""} ${p.contact?.last_name ?? ""} ${p.site_postcode ?? ""}`
      .toLowerCase();
    return hay.includes(q.trim().toLowerCase());
  });

return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Projects</h1>
          <p className="text-sm text-muted-foreground">
            Each project ties together your job details and all documents (quotes, invoices, work orders).
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search projects…" className="w-full sm:w-72" />
          <Button onClick={openCreate}>New project</Button>
        </div>
      </div>

      <Card className="rounded-2xl">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Job list</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="py-10 text-sm text-muted-foreground">Loading…</div>
          ) : filtered.length === 0 ? (
            <div className="py-10 text-sm text-muted-foreground">
              No projects yet. Create a project to start saving quotes and invoices.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Project</TableHead>
                    <TableHead className="hidden md:table-cell">Customer</TableHead>
                    <TableHead className="hidden lg:table-cell">Postcode</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-[120px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell className="font-medium">{p.title}</TableCell>
                      <TableCell className="hidden md:table-cell">{contactLabel(p.contact)}</TableCell>
                      <TableCell className="hidden lg:table-cell">{p.site_postcode ?? "—"}</TableCell>
                      <TableCell>
                        <Badge variant={p.status === "active" ? "default" : "secondary"}>{p.status}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button asChild variant="outline" size="sm">
                          <Link to={`/projects/${p.id}`}>Open</Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

<Dialog open={open} onOpenChange={setOpen}>
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a contact" />
                  </SelectTrigger>
                  <SelectContent>
                    {contacts.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {contactLabel(c)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Field label="Site address line 1" id="site_address_line1">
                <Input id="site_address_line1" {...form.register("site_address_line1")} placeholder="If different from billing" />
              </Field>
              <Field label="Site address line 2" id="site_address_line2">
                <Input id="site_address_line2" {...form.register("site_address_line2")} />
              </Field>

              <Field label="City" id="site_city">
                <Input id="site_city" {...form.register("site_city")} />
              </Field>
              <Field label="County" id="site_county">
                <Input id="site_county" {...form.register("site_county")} />
              </Field>

              <Field label="Postcode" id="site_postcode">
                <Input id="site_postcode" {...form.register("site_postcode")} />
              </Field>
              <Field label="Country" id="site_country">
                <Input id="site_country" {...form.register("site_country")} placeholder="UK" />
              </Field>
            </div>

            <Field label="Description" id="description">
              <textarea
                id="description"
                className="min-h-[90px] w-full rounded-md border bg-background px-3 py-2 text-sm"
                placeholder="Scope of work, access constraints, materials, key notes…"
                {...form.register("description")}
              />
            </Field>

            <div className="flex items-center justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="submit">Create project</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Field({ label, id, children }: { label: string; id: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      {children}
    </div>
  );
}

function contactLabel(c?: Contact) {
  if (!c) return "—";
  const name = `${c.first_name ?? ""} ${c.last_name ?? ""}`.trim();
  if (c.company_name && name) return `${name} · ${c.company_name}`;
  return name || c.company_name || c.email || "Contact";
}