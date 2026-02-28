import { supabase } from "../../supabaseClient";

/**
 * Uses Postgres function:
 *   public.next_doc_number(p_doc_type public.doc_type) returns text
 */
export function useDocNumber() {
  const nextNumber = async (docType) => {
    const { data, error } = await supabase.rpc("next_doc_number", {
      p_doc_type: docType,
    });

    if (error) {
      console.error("Error generating doc number:", error);
      throw error;
    }
    return data; // e.g. "Q-000123"
  };

  return { nextNumber };
}