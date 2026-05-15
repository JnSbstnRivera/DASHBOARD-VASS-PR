export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  __InternalSupabase: { PostgrestVersion: "14.5" };
  vass: {
    Tables: {
      ventas: {
        Row: {
          id: number;
          mes: string | null;
          producto: string | null;
          procedencia: string | null;
          financiamiento: string | null;
          closing_date: string | null;
          telefono: string | null;
          contrato: string | null;
          asesor: string | null;
          comision: number | null;
          lead_numero: string | null;
          procedencia_lead: string | null;
          consultor: string | null;
          tipo_asistencia: string | null;
          observaciones: string | null;
          source_file: string | null;
          inserted_at: string | null;
        };
        Insert: Partial<Database["vass"]["Tables"]["ventas"]["Row"]>;
        Update: Partial<Database["vass"]["Tables"]["ventas"]["Row"]>;
        Relationships: [];
      };
      seguimiento: {
        Row: {
          id: number;
          hoja_origen: string | null;
          mes: string | null;
          fecha: string | null;
          procedencia: string | null;
          asesor: string | null;
          lead_numero: string | null;
          producto: string | null;
          financiamiento: string | null;
          id_aplicacion: string | null;
          consultor: string | null;
          cliente: string | null;
          telefono: string | null;
          status: string | null;
          observacion: string | null;
          seguimiento_extra: string | null;
          source_file: string | null;
          inserted_at: string | null;
        };
        Insert: Partial<Database["vass"]["Tables"]["seguimiento"]["Row"]>;
        Update: Partial<Database["vass"]["Tables"]["seguimiento"]["Row"]>;
        Relationships: [];
      };
      upload_log: {
        Row: {
          id: number;
          uploaded_at: string | null;
          archivo: string | null;
          filas_cargadas: number | null;
          uploaded_by: string | null;
          notas: string | null;
        };
        Insert: Partial<Database["vass"]["Tables"]["upload_log"]["Row"]>;
        Update: Partial<Database["vass"]["Tables"]["upload_log"]["Row"]>;
        Relationships: [];
      };
    };
    Views: { [_ in never]: never };
    Functions: { [_ in never]: never };
    Enums: { [_ in never]: never };
    CompositeTypes: { [_ in never]: never };
  };
};
