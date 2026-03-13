/**
 * Database types — Supabase-specific type helpers.
 * Will be generated or refined as Supabase schema evolves.
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

/**
 * Placeholder for Supabase generated types.
 * After running `supabase gen types typescript`, replace this with the generated output.
 */
export interface Database {
  public: {
    Tables: {
      participants: {
        Row: {
          id: string;
          participant_code: string;
          name: string;
          email: string;
          diet_type: string;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["participants"]["Row"], "id" | "created_at" | "updated_at"> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["participants"]["Insert"]>;
      };
      staff_members: {
        Row: {
          id: string;
          name: string;
          default_role: string | null;
          default_location: string | null;
          default_note_markdown: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["staff_members"]["Row"], "id" | "created_at" | "updated_at"> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["staff_members"]["Insert"]>;
      };
      // Additional table types will be added as features are implemented
    };
  };
}
