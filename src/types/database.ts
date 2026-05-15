export type OrgRole = "owner" | "admin" | "member";

export type OrgPlan = "starter" | "pro" | "enterprise";

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      organizations: {
        Row: {
          id: string;
          name: string;
          slug: string;
          plan: OrgPlan;
          settings: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          plan?: OrgPlan;
          settings?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
          plan?: OrgPlan;
          settings?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      organization_members: {
        Row: {
          organization_id: string;
          user_id: string;
          role: OrgRole;
          created_at: string;
        };
        Insert: {
          organization_id: string;
          user_id: string;
          role?: OrgRole;
          created_at?: string;
        };
        Update: {
          organization_id?: string;
          user_id?: string;
          role?: OrgRole;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "organization_members_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      tracked_entities: {
        Row: {
          id: string;
          organization_id: string;
          type: string;
          name: string;
          domain: string | null;
          description: string | null;
          metadata: Json;
          is_active: boolean;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          type: string;
          name: string;
          domain?: string | null;
          description?: string | null;
          metadata?: Json;
          is_active?: boolean;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          type?: string;
          name?: string;
          domain?: string | null;
          description?: string | null;
          metadata?: Json;
          is_active?: boolean;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "tracked_entities_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      intelligence_events: {
        Row: {
          id: string;
          organization_id: string;
          entity_id: string;
          source_url: string | null;
          source_type: string;
          event_type: string;
          title: string;
          summary: string;
          implication: string | null;
          raw_content: string | null;
          signal_score: number;
          metadata: Json;
          is_dismissed: boolean;
          dismissed_at: string | null;
          dismissed_by: string | null;
          detected_at: string;
          published_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          entity_id: string;
          source_url?: string | null;
          source_type: string;
          event_type: string;
          title: string;
          summary: string;
          implication?: string | null;
          raw_content?: string | null;
          signal_score?: number;
          metadata?: Json;
          is_dismissed?: boolean;
          dismissed_at?: string | null;
          dismissed_by?: string | null;
          detected_at?: string;
          published_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          entity_id?: string;
          source_url?: string | null;
          source_type?: string;
          event_type?: string;
          title?: string;
          summary?: string;
          implication?: string | null;
          raw_content?: string | null;
          signal_score?: number;
          metadata?: Json;
          is_dismissed?: boolean;
          dismissed_at?: string | null;
          dismissed_by?: string | null;
          detected_at?: string;
          published_at?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "intelligence_events_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "intelligence_events_entity_id_fkey";
            columns: ["entity_id"];
            isOneToOne: false;
            referencedRelation: "tracked_entities";
            referencedColumns: ["id"];
          },
        ];
      };
      ingestion_jobs: {
        Row: {
          id: string;
          organization_id: string;
          entity_id: string;
          rule_id: string | null;
          source_type: string;
          source_url: string;
          status: string;
          result_type: string | null;
          raw_content: string | null;
          snapshot_path: string | null;
          previous_snapshot_path: string | null;
          diff_summary: string | null;
          error_message: string | null;
          started_at: string | null;
          completed_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          entity_id: string;
          rule_id?: string | null;
          source_type: string;
          source_url: string;
          status?: string;
          result_type?: string | null;
          raw_content?: string | null;
          snapshot_path?: string | null;
          previous_snapshot_path?: string | null;
          diff_summary?: string | null;
          error_message?: string | null;
          started_at?: string | null;
          completed_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          entity_id?: string;
          rule_id?: string | null;
          source_type?: string;
          source_url?: string;
          status?: string;
          result_type?: string | null;
          raw_content?: string | null;
          snapshot_path?: string | null;
          previous_snapshot_path?: string | null;
          diff_summary?: string | null;
          error_message?: string | null;
          started_at?: string | null;
          completed_at?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "ingestion_jobs_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "ingestion_jobs_entity_id_fkey";
            columns: ["entity_id"];
            isOneToOne: false;
            referencedRelation: "tracked_entities";
            referencedColumns: ["id"];
          },
        ];
      };
      intelligence_embeddings: {
        Row: {
          id: string;
          organization_id: string;
          source_type: string;
          source_id: string;
          chunk_kind: string;
          chunk_index: number;
          content: string;
          content_hash: string;
          embedding: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          source_type: string;
          source_id: string;
          chunk_kind: string;
          chunk_index?: number;
          content: string;
          content_hash: string;
          embedding?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          source_type?: string;
          source_id?: string;
          chunk_kind?: string;
          chunk_index?: number;
          content?: string;
          content_hash?: string;
          embedding?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      entity_relationships: {
        Row: {
          id: string;
          organization_id: string;
          from_entity_id: string;
          to_entity_id: string;
          relationship_type: string;
          metadata: Json;
          valid_from: string | null;
          valid_until: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          from_entity_id: string;
          to_entity_id: string;
          relationship_type: string;
          metadata?: Json;
          valid_from?: string | null;
          valid_until?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          from_entity_id?: string;
          to_entity_id?: string;
          relationship_type?: string;
          metadata?: Json;
          valid_from?: string | null;
          valid_until?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      event_relationships: {
        Row: {
          id: string;
          organization_id: string;
          from_event_id: string;
          to_event_id: string;
          relationship_type: string;
          metadata: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          from_event_id: string;
          to_event_id: string;
          relationship_type: string;
          metadata?: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          from_event_id?: string;
          to_event_id?: string;
          relationship_type?: string;
          metadata?: Json;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      create_organization_with_owner: {
        Args: { p_name: string; p_slug: string };
        Returns: string;
      };
      match_intelligence_embeddings: {
        Args: {
          p_organization_id: string;
          p_query_embedding: string;
          p_match_count?: number;
          p_min_similarity?: number;
        };
        Returns: {
          source_type: string;
          source_id: string;
          chunk_kind: string;
          semantic_similarity: number;
        }[];
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}

export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type Organization = Database["public"]["Tables"]["organizations"]["Row"];
export type OrganizationMember =
  Database["public"]["Tables"]["organization_members"]["Row"];
export type TrackedEntity =
  Database["public"]["Tables"]["tracked_entities"]["Row"];
export type IntelligenceEvent =
  Database["public"]["Tables"]["intelligence_events"]["Row"];
export type IngestionJob =
  Database["public"]["Tables"]["ingestion_jobs"]["Row"];
