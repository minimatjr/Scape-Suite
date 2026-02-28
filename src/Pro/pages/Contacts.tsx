import React from "react";
import { supabase } from "../lib/supabaseClient";
import type { Contact } from "../lib/types";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { toast } from "@/components/ui/use-toast";

import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

const ContactSchema = z.object({
  company_name: z.string().max(200).optional().or(z.literal("")),
  first_name: z.string().max(120).optional().or(z.literal("")),
  last_name: z.string().max(120).optional().or(z.literal("")),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().max(50).optional().or(z.literal("")),
  address_line1: z.string().max(200).optional().or(z.literal("")),
  address_line2: z.string().max(200).optional().or(z.literal("")),
  city: z.string().max(120).optional().or(z.literal("")),
  county: z.string().max(120).optional().or(z.literal("")),
  postcode: z.string().max(20).optional().or(z.literal("")),
  country: z.string().max(80).optional().or(z.literal("")),
  notes: z.string().max(4000).optional().or(z.literal("")),
});

type ContactForm = z.infer<typeof ContactSchema>;

function normalize(form: ContactForm) {
  const n = (v?: string) => (v && v.trim().length ? v.trim() : null);
  return {
    company_name: n(form.company_name),
    first_name: n(form.first_name),
    last_name: n(form.last_name),
    email: n(form.email),
    phone: n(form.phone),
    address_line1: n(form.address_line1),
    address_line2: n(form.address_line2),
    city: n(form.city),
    county: n(form.county),
    postcode: n(form.postcode),
    country: n(form.country) ?? "UK",
    notes: n(form.notes),
  };
}

export default function Contacts() {
  const [contacts, setContacts] = React.useState<Contact[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [query, setQuery] = React.useState("");
  const [open, setOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<Contact | null>(null);

  const form = useForm<ContactForm>({
    resolver: zodResolver(ContactSchema),
    defaultValues: {
      company_name: "",
      first_name: "",
      last_name: "",
      email: "",
      phone: "",
      address_line1: "",
      address_line2: "",
      city: "",
      county: "",
      postcode: "",
      country: "UK",
      notes: "",
    },
  });

async function load() {
    setLoading(true);
    const { data, error } = await supabase
      .from("contacts")
      .select("*")
      .order("updated_at", { ascending: false });

    setLoading(false);

    if (error) {
      toast({ title: "Couldn’t load contacts", description: error.message });
      return;
    }

    setContacts((data ?? []) as Contact[]);
  }

  React.useEffect(() => {
    load();
  }, []);

  function startCreate() {
    setEditing(null);
    form.reset({
      company_name: "",
      first_name: "",
      last_name: "",
      email: "",
      phone: "",
      address_line1: "",
      address_line2: "",
      city: "",
      county: "",
      postcode: "",
      country: "UK",
      notes: "",
    });
    setOpen(true);
  }

function startEdit(c: Contact) {
    setEditing(c);
    form.reset({
      company_name: c.company_name ?? "",
      first_name: c.first_name ?? "",
      last_name: c.last_name ?? "",
      email: c.email ?? "",
      phone: c.phone ?? "",
      address_line1: c.address_line1 ?? "",
      address_line2: c.address_line2 ?? "",
      city: c.city ?? "",
      county: c.county ?? "",
      postcode: c.postcode ?? "",
      country: c.country ?? "UK",
      notes: c.notes ?? "",
    });
    setOpen(true);
  }

  async function save(values: ContactForm) {
    const { data: userData } = await supabase.auth.getUser();
    const userId = userData.user?.id;
    if (!userId) {
      toast({ title: "Not signed in", description: "Please sign in again." });
      return;
    }

const payload = { ...normalize(values), user_id: userId };

    const res = editing
      ? await supabase.from("contacts").update(payload).eq("id", editing.id).select("*").single()
      : await supabase.from("contacts").insert(payload).select("*").single();

    if (res.error) {
      toast({ title: "Couldn’t save contact", description: res.error.message });
      return;
    }

    toast({ title: editing ? "Contact updated" : "Contact created" });
    setOpen(false);
    setEditing(null);
    await load();
  }

  async function remove(c: Contact) {
    if (!confirm(`Delete contact “${displayName(c)}”? This cannot be undone.`)) return;
    const { error } = await supabase.from("contacts").delete().eq("id", c.id);
    if (error) {
      toast({ title: "Couldn’t delete", description: error.message });
      return;
    }
    toast({ title: "Contact deleted" });
    await load();
  }

  const filtered = contacts.filter((c) => {
    const hay = `${c.company_name ?? ""} ${c.first_name ?? ""} ${c.last_name ?? ""} ${c.email ?? ""} ${c.phone ?? ""}`
      .toLowerCase();
    return hay.includes(query.trim().toLowerCase());
  });

return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Contacts</h1>
          <p className="text-sm text-muted-foreground">
            Save customer details once, then reuse them across projects, quotes and invoices.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search contacts…"
            className="w-full sm:w-72"
          />
          <Button onClick={startCreate}>New contact</Button>
        </div>
      </div>

<Card className="rounded-2xl">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Customer list</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="py-10 text-sm text-muted-foreground">Loading…</div>
          ) : filtered.length === 0 ? (
            <div className="py-10 text-sm text-muted-foreground">
              No contacts yet. Create your first customer to start building projects.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead className="hidden md:table-cell">Company</TableHead>
                    <TableHead className="hidden md:table-cell">Email</TableHead>
                    <TableHead className="hidden lg:table-cell">Phone</TableHead>
                    <TableHead className="hidden lg:table-cell">Postcode</TableHead>
                    <TableHead className="w-[80px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell className="font-medium">{displayName(c)}</TableCell>
                      <TableCell className="hidden md:table-cell">{c.company_name ?? "—"}</TableCell>
                      <TableCell className="hidden md:table-cell">{c.email ?? "—"}</TableCell>
                      <TableCell className="hidden lg:table-cell">{c.phone ?? "—"}</TableCell>
                      <TableCell className="hidden lg:table-cell">{c.postcode ?? "—"}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">Actions</Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => startEdit(c)}>Edit</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => remove(c)} className="text-destructive">
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
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
        <DialogTrigger asChild>
          <span />
        </DialogTrigger>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit contact" : "New contact"}</DialogTitle>
          </DialogHeader>

          <form onSubmit={form.handleSubmit(save)} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Company" id="company_name">
                <Input id="company_name" {...form.register("company_name")} placeholder="e.g., Acme Property Ltd" />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="First name" id="first_name">
                  <Input id="first_name" {...form.register("first_name")} placeholder="Jane" />
                </Field>
                <Field label="Last name" id="last_name">
                  <Input id="last_name" {...form.register("last_name")} placeholder="Smith" />
                </Field>
              </div>

              <Field label="Email" id="email">
                <Input id="email" type="email" {...form.register("email")} placeholder="jane@client.com" />
              </Field>
              <Field label="Phone" id="phone">
                <Input id="phone" {...form.register("phone")} placeholder="+44…" />
              </Field>

              <Field label="Address line 1" id="address_line1">
                <Input id="address_line1" {...form.register("address_line1")} placeholder="House number / street" />
              </Field>
              <Field label="Address line 2" id="address_line2">
                <Input id="address_line2" {...form.register("address_line2")} placeholder="Area / district" />
              </Field>

              <Field label="City" id="city">
                <Input id="city" {...form.register("city")} placeholder="City" />
              </Field>
              <Field label="County" id="county">
                <Input id="county" {...form.register("county")} placeholder="County" />
              </Field>

              <Field label="Postcode" id="postcode">
                <Input id="postcode" {...form.register("postcode")} placeholder="Postcode" />
              </Field>
              <Field label="Country" id="country">
                <Input id="country" {...form.register("country")} placeholder="UK" />
              </Field>
            </div>

            <Field label="Notes" id="notes">
              <textarea
                id="notes"
                className="min-h-[90px] w-full rounded-md border bg-background px-3 py-2 text-sm"
                placeholder="Gate code, preferred contact method, invoicing notes…"
                {...form.register("notes")}
              />
            </Field>

            <div className="flex items-center justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Save</Button>
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

function displayName(c: Contact) {
  const full = `${c.first_name ?? ""} ${c.last_name ?? ""}`.trim();
  if (full) return full;
  if (c.company_name) return c.company_name;
  return "Unnamed contact";
}