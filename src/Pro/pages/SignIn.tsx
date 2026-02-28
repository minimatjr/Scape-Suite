import React from "react";
import { supabase } from "../pro/lib/supabaseClient";
import { useNavigate } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/components/ui/use-toast";

export default function SignIn() {
  const navigate = useNavigate();
  const [email, setEmail] = React.useState("");
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate("/contacts");
    });
  }, [navigate]);

  async function sendLink(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/contacts`,
      },
    });
    setLoading(false);

    if (error) {
      toast({ title: "Sign-in failed", description: error.message });
      return;
    }

    toast({
      title: "Check your email",
      description: "We sent you a sign-in link.",
    });
  }

  return (
    <div className="min-h-screen grid place-items-center bg-background px-6">
      <Card className="w-full max-w-md rounded-2xl">
        <CardHeader>
          <CardTitle>Sign in to Scape Suite</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={sendLink} className="space-y-3">
            <div className="text-sm text-muted-foreground">
              Use your email to receive a secure magic link.
            </div>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
              required
            />
            <Button className="w-full" disabled={loading} type="submit">
              {loading ? "Sending…" : "Send sign-in link"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}