export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      anexos: {
        Row: {
          arquivo_url: string
          created_at: string
          id: string
          imovel_id: string | null
          inquilino_id: string | null
          nome: string
          tipo: string | null
          user_id: string
        }
        Insert: {
          arquivo_url: string
          created_at?: string
          id?: string
          imovel_id?: string | null
          inquilino_id?: string | null
          nome: string
          tipo?: string | null
          user_id: string
        }
        Update: {
          arquivo_url?: string
          created_at?: string
          id?: string
          imovel_id?: string | null
          inquilino_id?: string | null
          nome?: string
          tipo?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "anexos_imovel_id_fkey"
            columns: ["imovel_id"]
            isOneToOne: false
            referencedRelation: "imoveis"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "anexos_inquilino_id_fkey"
            columns: ["inquilino_id"]
            isOneToOne: false
            referencedRelation: "inquilinos"
            referencedColumns: ["id"]
          },
        ]
      }
      contratos: {
        Row: {
          arquivo_url: string | null
          created_at: string
          data_fim: string | null
          data_inicio: string | null
          id: string
          imovel_id: string | null
          inquilino_id: string | null
          observacoes: string | null
          user_id: string
          valor_aluguel: number | null
          valor_caucao: number | null
        }
        Insert: {
          arquivo_url?: string | null
          created_at?: string
          data_fim?: string | null
          data_inicio?: string | null
          id?: string
          imovel_id?: string | null
          inquilino_id?: string | null
          observacoes?: string | null
          user_id: string
          valor_aluguel?: number | null
          valor_caucao?: number | null
        }
        Update: {
          arquivo_url?: string | null
          created_at?: string
          data_fim?: string | null
          data_inicio?: string | null
          id?: string
          imovel_id?: string | null
          inquilino_id?: string | null
          observacoes?: string | null
          user_id?: string
          valor_aluguel?: number | null
          valor_caucao?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "contratos_imovel_id_fkey"
            columns: ["imovel_id"]
            isOneToOne: false
            referencedRelation: "imoveis"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contratos_inquilino_id_fkey"
            columns: ["inquilino_id"]
            isOneToOne: false
            referencedRelation: "inquilinos"
            referencedColumns: ["id"]
          },
        ]
      }
      despesas: {
        Row: {
          ano: number
          comprovante_url: string | null
          created_at: string
          data_despesa: string | null
          descricao: string | null
          forma_pagamento: string | null
          id: string
          imovel_id: string | null
          mes: number
          tipo: string
          user_id: string
          valor: number
        }
        Insert: {
          ano: number
          comprovante_url?: string | null
          created_at?: string
          data_despesa?: string | null
          descricao?: string | null
          forma_pagamento?: string | null
          id?: string
          imovel_id?: string | null
          mes: number
          tipo: string
          user_id: string
          valor?: number
        }
        Update: {
          ano?: number
          comprovante_url?: string | null
          created_at?: string
          data_despesa?: string | null
          descricao?: string | null
          forma_pagamento?: string | null
          id?: string
          imovel_id?: string | null
          mes?: number
          tipo?: string
          user_id?: string
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "despesas_imovel_id_fkey"
            columns: ["imovel_id"]
            isOneToOne: false
            referencedRelation: "imoveis"
            referencedColumns: ["id"]
          },
        ]
      }
      imoveis: {
        Row: {
          bairro: string | null
          cidade: string | null
          created_at: string
          dia_vencimento: number
          dormitorios: number | null
          endereco: string | null
          estado: string | null
          foto_url: string | null
          fotos: Json
          id: string
          metragem: number | null
          nome: string
          observacoes: string | null
          status: string
          user_id: string
          valor_aluguel: number
        }
        Insert: {
          bairro?: string | null
          cidade?: string | null
          created_at?: string
          dia_vencimento?: number
          dormitorios?: number | null
          endereco?: string | null
          estado?: string | null
          foto_url?: string | null
          fotos?: Json
          id?: string
          metragem?: number | null
          nome: string
          observacoes?: string | null
          status?: string
          user_id: string
          valor_aluguel?: number
        }
        Update: {
          bairro?: string | null
          cidade?: string | null
          created_at?: string
          dia_vencimento?: number
          dormitorios?: number | null
          endereco?: string | null
          estado?: string | null
          foto_url?: string | null
          fotos?: Json
          id?: string
          metragem?: number | null
          nome?: string
          observacoes?: string | null
          status?: string
          user_id?: string
          valor_aluguel?: number
        }
        Relationships: []
      }
      inquilinos: {
        Row: {
          contrato_nome: string | null
          contrato_url: string | null
          cpf: string | null
          created_at: string
          data_entrada: string | null
          data_saida: string | null
          dia_vencimento: number | null
          email: string | null
          endereco_anterior: string | null
          id: string
          imovel_id: string | null
          nome: string
          observacoes: string | null
          rg: string | null
          status: string
          telefone: string | null
          user_id: string
          valor_aluguel: number | null
          valor_caucao: number | null
          whatsapp: string | null
        }
        Insert: {
          contrato_nome?: string | null
          contrato_url?: string | null
          cpf?: string | null
          created_at?: string
          data_entrada?: string | null
          data_saida?: string | null
          dia_vencimento?: number | null
          email?: string | null
          endereco_anterior?: string | null
          id?: string
          imovel_id?: string | null
          nome: string
          observacoes?: string | null
          rg?: string | null
          status?: string
          telefone?: string | null
          user_id: string
          valor_aluguel?: number | null
          valor_caucao?: number | null
          whatsapp?: string | null
        }
        Update: {
          contrato_nome?: string | null
          contrato_url?: string | null
          cpf?: string | null
          created_at?: string
          data_entrada?: string | null
          data_saida?: string | null
          dia_vencimento?: number | null
          email?: string | null
          endereco_anterior?: string | null
          id?: string
          imovel_id?: string | null
          nome?: string
          observacoes?: string | null
          rg?: string | null
          status?: string
          telefone?: string | null
          user_id?: string
          valor_aluguel?: number | null
          valor_caucao?: number | null
          whatsapp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "inquilinos_imovel_id_fkey"
            columns: ["imovel_id"]
            isOneToOne: false
            referencedRelation: "imoveis"
            referencedColumns: ["id"]
          },
        ]
      }
      pagamentos: {
        Row: {
          ano: number
          comprovante_url: string | null
          created_at: string
          data_pagamento: string | null
          data_vencimento: string | null
          forma_pagamento: string | null
          id: string
          imovel_id: string | null
          inquilino_id: string | null
          mes: number
          observacoes: string | null
          status: string
          user_id: string
          valor: number
        }
        Insert: {
          ano: number
          comprovante_url?: string | null
          created_at?: string
          data_pagamento?: string | null
          data_vencimento?: string | null
          forma_pagamento?: string | null
          id?: string
          imovel_id?: string | null
          inquilino_id?: string | null
          mes: number
          observacoes?: string | null
          status?: string
          user_id: string
          valor?: number
        }
        Update: {
          ano?: number
          comprovante_url?: string | null
          created_at?: string
          data_pagamento?: string | null
          data_vencimento?: string | null
          forma_pagamento?: string | null
          id?: string
          imovel_id?: string | null
          inquilino_id?: string | null
          mes?: number
          observacoes?: string | null
          status?: string
          user_id?: string
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "pagamentos_imovel_id_fkey"
            columns: ["imovel_id"]
            isOneToOne: false
            referencedRelation: "imoveis"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pagamentos_inquilino_id_fkey"
            columns: ["inquilino_id"]
            isOneToOne: false
            referencedRelation: "inquilinos"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string | null
          id: string
          nome: string | null
          telefone: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          id: string
          nome?: string | null
          telefone?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          id?: string
          nome?: string | null
          telefone?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
