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
      gallery_cards: {
        Row: {
          created_at: string;
          id: string;
          image_path: string;
          is_published: boolean;
          name: string;
          sort_order: number;
        };
        Insert: {
          created_at?: string;
          id?: string;
          image_path: string;
          is_published?: boolean;
          name: string;
          sort_order?: number;
        };
        Update: {
          created_at?: string;
          id?: string;
          image_path?: string;
          is_published?: boolean;
          name?: string;
          sort_order?: number;
        };
        Relationships: [];
      };
      gallery_card_votes: {
        Row: {
          created_at: string;
          gallery_card_id: string;
          id: string;
          voter_token: string;
        };
        Insert: {
          created_at?: string;
          gallery_card_id: string;
          id?: string;
          voter_token: string;
        };
        Update: {
          created_at?: string;
          gallery_card_id?: string;
          id?: string;
          voter_token?: string;
        };
        Relationships: [
          {
            foreignKeyName: "gallery_card_votes_gallery_card_id_fkey";
            columns: ["gallery_card_id"];
            referencedRelation: "gallery_cards";
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
