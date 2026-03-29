export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      households: {
        Row: {
          created_at: string;
          dachshund_count: number;
          household_name: string | null;
          id: string;
        };
        Insert: {
          created_at?: string;
          dachshund_count: number;
          household_name?: string | null;
          id?: string;
        };
        Update: {
          created_at?: string;
          dachshund_count?: number;
          household_name?: string | null;
          id?: string;
        };
        Relationships: [];
      };
      dogs: {
        Row: {
          cartoon_content_type: string | null;
          cartoon_storage_path: string | null;
          content_type: string | null;
          consent_to_gallery: boolean;
          created_at: string;
          household_id: string;
          id: string;
          name: string;
          original_filename: string | null;
          storage_path: string;
        };
        Insert: {
          cartoon_content_type?: string | null;
          cartoon_storage_path?: string | null;
          content_type?: string | null;
          consent_to_gallery?: boolean;
          created_at?: string;
          household_id: string;
          id?: string;
          name: string;
          original_filename?: string | null;
          storage_path: string;
        };
        Update: {
          cartoon_content_type?: string | null;
          cartoon_storage_path?: string | null;
          content_type?: string | null;
          consent_to_gallery?: boolean;
          created_at?: string;
          household_id?: string;
          id?: string;
          name?: string;
          original_filename?: string | null;
          storage_path?: string;
        };
        Relationships: [
          {
            foreignKeyName: "dogs_household_id_fkey";
            columns: ["household_id"];
            referencedRelation: "households";
            referencedColumns: ["id"];
          }
        ];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
