import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";

export function useSession() {
  const [session, setSession] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setReady(true);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, sess) => {
      setSession(sess);
      setReady(true);
    });

    return () => sub.subscription?.unsubscribe();
  }, []);

  return { session, ready };
}