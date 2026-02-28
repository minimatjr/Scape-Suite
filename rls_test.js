import { createClient } from "@supabase/supabase-js";

const url = process.env.SUPABASE_URL;
const anon = process.env.SUPABASE_ANON_KEY;

async function signIn(email, password) {
  const supabase = createClient(url, anon);
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return { supabase, user: data.user };
}

async function main() {
  // Sign in as User A
  const a = await signIn("a@test.com", "PASSWORD_A");
  console.log("User A id:", a.user.id);

  // Insert a contact as A (IMPORTANT: include user_id)
  const { data: aContact, error: aContactErr } = await a.supabase
    .from("contacts")
    .insert({ user_id: a.user.id, name: "A Contact" })
    .select()
    .single();

  if (aContactErr) throw aContactErr;
  console.log("A created contact:", aContact);

  // Sign in as User B
  const b = await signIn("b@test.com", "PASSWORD_B");
  console.log("User B id:", b.user.id);

  // As B: select contacts (should NOT see A's contact)
  const { data: bContacts, error: bSelErr } = await b.supabase
    .from("contacts")
    .select("*");

  if (bSelErr) throw bSelErr;
  console.log("B can see contacts:", bContacts);

  // As B: try to create a project linked to A's contact (should FAIL if your constraint is enabled)
  const { data: bProj, error: bProjErr } = await b.supabase
    .from("projects")
    .insert({ user_id: b.user.id, name: "B Project", contact_id: aContact.id })
    .select()
    .single();

  console.log("B create project result:", { bProj, bProjErr: bProjErr?.message });
}

main().catch((e) => {
  console.error("Test failed:", e.message);
  process.exit(1);
});