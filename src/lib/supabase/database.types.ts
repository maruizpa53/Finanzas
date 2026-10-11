// Generado desde el esquema de Supabase (proyecto finanzas-personales).
// Regenerar después de cada migración.
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

type E = Database["public"]["Enums"]

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      accounts: {
        Row: {
          activa: boolean
          color: string | null
          created_at: string
          cupo: number | null
          dia_corte: number | null
          dia_pago: number | null
          icono: string | null
          id: string
          institucion: string | null
          nombre: string
          notas: string | null
          orden: number
          saldo_inicial: number
          saldo_inicial_fecha: string
          tipo: E["tipo_cuenta"]
          ultimos4: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          activa?: boolean
          color?: string | null
          created_at?: string
          cupo?: number | null
          dia_corte?: number | null
          dia_pago?: number | null
          icono?: string | null
          id?: string
          institucion?: string | null
          nombre: string
          notas?: string | null
          orden?: number
          saldo_inicial?: number
          saldo_inicial_fecha?: string
          tipo: E["tipo_cuenta"]
          ultimos4?: string | null
          updated_at?: string
          user_id?: string
        }
        Update: Partial<Database["public"]["Tables"]["accounts"]["Insert"]>
        Relationships: []
      }
      budgets: {
        Row: {
          alerta_100: boolean
          alerta_80: boolean
          categoria_id: string
          created_at: string
          id: string
          mes: string | null
          monto: number
          monto_diario_habil: number
          notas: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          alerta_100?: boolean
          alerta_80?: boolean
          categoria_id: string
          created_at?: string
          id?: string
          mes?: string | null
          monto?: number
          monto_diario_habil?: number
          notas?: string | null
          updated_at?: string
          user_id?: string
        }
        Update: Partial<Database["public"]["Tables"]["budgets"]["Insert"]>
        Relationships: [
          {
            foreignKeyName: "budgets_categoria_id_fkey"
            columns: ["categoria_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          activa: boolean
          beneficiario_default: E["beneficiario"] | null
          bolsa_default: E["bolsa"] | null
          color: string | null
          created_at: string
          es_fijo: boolean
          icono: string | null
          id: string
          nombre: string
          orden: number
          parent_id: string | null
          tipo: E["tipo_categoria"]
          updated_at: string
          user_id: string
        }
        Insert: {
          activa?: boolean
          beneficiario_default?: E["beneficiario"] | null
          bolsa_default?: E["bolsa"] | null
          color?: string | null
          created_at?: string
          es_fijo?: boolean
          icono?: string | null
          id?: string
          nombre: string
          orden?: number
          parent_id?: string | null
          tipo?: E["tipo_categoria"]
          updated_at?: string
          user_id?: string
        }
        Update: Partial<Database["public"]["Tables"]["categories"]["Insert"]>
        Relationships: [
          {
            foreignKeyName: "categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      categorization_rules: {
        Row: {
          activa: boolean
          beneficiario: E["beneficiario"] | null
          bolsa: E["bolsa"] | null
          categoria_id: string | null
          created_at: string
          id: string
          origen: string
          patron: string
          prioridad: number
          tipo_patron: string
          updated_at: string
          user_id: string
          veces_aplicada: number
        }
        Insert: {
          activa?: boolean
          beneficiario?: E["beneficiario"] | null
          bolsa?: E["bolsa"] | null
          categoria_id?: string | null
          created_at?: string
          id?: string
          origen?: string
          patron: string
          prioridad?: number
          tipo_patron?: string
          updated_at?: string
          user_id?: string
          veces_aplicada?: number
        }
        Update: Partial<Database["public"]["Tables"]["categorization_rules"]["Insert"]>
        Relationships: []
      }
      chat_messages: {
        Row: {
          content: Json
          conversation_id: string
          created_at: string
          id: string
          role: string
          user_id: string
        }
        Insert: {
          content: Json
          conversation_id?: string
          created_at?: string
          id?: string
          role: string
          user_id?: string
        }
        Update: Partial<Database["public"]["Tables"]["chat_messages"]["Insert"]>
        Relationships: []
      }
      debt_payments: {
        Row: {
          capital: number
          created_at: string
          debt_id: string
          fecha: string
          id: string
          interes: number
          monto_total: number
          notas: string | null
          transaction_id: string | null
          user_id: string
        }
        Insert: {
          capital?: number
          created_at?: string
          debt_id: string
          fecha?: string
          id?: string
          interes?: number
          monto_total: number
          notas?: string | null
          transaction_id?: string | null
          user_id?: string
        }
        Update: Partial<Database["public"]["Tables"]["debt_payments"]["Insert"]>
        Relationships: []
      }
      debts: {
        Row: {
          acreedor: string
          categoria_id: string | null
          created_at: string
          cuota: number | null
          dia_pago: number | null
          estado: string
          id: string
          interes_mensual: number | null
          monto_original: number | null
          notas: string | null
          saldo_fecha: string
          saldo_inicial: number | null
          solo_intereses: boolean
          tasa_mensual: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          acreedor: string
          categoria_id?: string | null
          created_at?: string
          cuota?: number | null
          dia_pago?: number | null
          estado?: string
          id?: string
          interes_mensual?: number | null
          monto_original?: number | null
          notas?: string | null
          saldo_fecha?: string
          saldo_inicial?: number | null
          solo_intereses?: boolean
          tasa_mensual?: number | null
          updated_at?: string
          user_id?: string
        }
        Update: Partial<Database["public"]["Tables"]["debts"]["Insert"]>
        Relationships: []
      }
      import_batches: {
        Row: {
          archivo_path: string | null
          banco: string
          created_at: string
          cuenta_id: string | null
          error: string | null
          estado: string
          filas_duplicadas: number
          filas_importadas: number
          filas_total: number
          formato: string | null
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          archivo_path?: string | null
          banco: string
          created_at?: string
          cuenta_id?: string | null
          error?: string | null
          estado?: string
          filas_duplicadas?: number
          filas_importadas?: number
          filas_total?: number
          formato?: string | null
          id?: string
          updated_at?: string
          user_id?: string
        }
        Update: Partial<Database["public"]["Tables"]["import_batches"]["Insert"]>
        Relationships: []
      }
      income_sources: {
        Row: {
          activa: boolean
          bolsa: E["bolsa"]
          categoria_id: string | null
          created_at: string
          cuenta_id: string | null
          dia_pago: number | null
          es_variable: boolean
          frecuencia: E["frecuencia"]
          id: string
          monto_esperado: number | null
          nombre: string
          notas: string | null
          tipo: string
          updated_at: string
          user_id: string
        }
        Insert: {
          activa?: boolean
          bolsa?: E["bolsa"]
          categoria_id?: string | null
          created_at?: string
          cuenta_id?: string | null
          dia_pago?: number | null
          es_variable?: boolean
          frecuencia?: E["frecuencia"]
          id?: string
          monto_esperado?: number | null
          nombre: string
          notas?: string | null
          tipo: string
          updated_at?: string
          user_id?: string
        }
        Update: Partial<Database["public"]["Tables"]["income_sources"]["Insert"]>
        Relationships: []
      }
      lemon_settlements: {
        Row: {
          archivo_path: string | null
          created_at: string
          estado: E["estado_corte"]
          fecha_corte: string
          fecha_reembolso: string | null
          id: string
          monto_presentado: number | null
          monto_reembolsado: number
          notas: string | null
          periodo_desde: string | null
          periodo_hasta: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          archivo_path?: string | null
          created_at?: string
          estado?: E["estado_corte"]
          fecha_corte: string
          fecha_reembolso?: string | null
          id?: string
          monto_presentado?: number | null
          monto_reembolsado?: number
          notas?: string | null
          periodo_desde?: string | null
          periodo_hasta?: string | null
          updated_at?: string
          user_id?: string
        }
        Update: Partial<Database["public"]["Tables"]["lemon_settlements"]["Insert"]>
        Relationships: []
      }
      recurring_items: {
        Row: {
          activo: boolean
          beneficiario: E["beneficiario"] | null
          bolsa: E["bolsa"]
          categoria_id: string | null
          created_at: string
          cuenta_id: string | null
          dia_pago: number | null
          es_variable: boolean
          fecha_fin: string | null
          fecha_inicio: string
          frecuencia: E["frecuencia"]
          id: string
          monto_esperado: number | null
          nombre: string
          notas: string | null
          tipo: E["tipo_categoria"]
          updated_at: string
          user_id: string
        }
        Insert: {
          activo?: boolean
          beneficiario?: E["beneficiario"] | null
          bolsa?: E["bolsa"]
          categoria_id?: string | null
          created_at?: string
          cuenta_id?: string | null
          dia_pago?: number | null
          es_variable?: boolean
          fecha_fin?: string | null
          fecha_inicio?: string
          frecuencia?: E["frecuencia"]
          id?: string
          monto_esperado?: number | null
          nombre: string
          notas?: string | null
          tipo?: E["tipo_categoria"]
          updated_at?: string
          user_id?: string
        }
        Update: Partial<Database["public"]["Tables"]["recurring_items"]["Insert"]>
        Relationships: []
      }
      recurring_occurrences: {
        Row: {
          created_at: string
          estado: E["estado_pago_recurrente"]
          fecha_vencimiento: string
          id: string
          monto_esperado: number | null
          recurring_item_id: string
          transaction_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          estado?: E["estado_pago_recurrente"]
          fecha_vencimiento: string
          id?: string
          monto_esperado?: number | null
          recurring_item_id: string
          transaction_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Update: Partial<Database["public"]["Tables"]["recurring_occurrences"]["Insert"]>
        Relationships: []
      }
      savings: {
        Row: {
          activo: boolean
          acumulado_inicial: number
          aporte_mensual: number | null
          categoria_id: string | null
          created_at: string
          dia_aporte: number | null
          fecha_entrega: string | null
          fecha_inicio: string | null
          id: string
          meta_monto: number | null
          nombre: string
          notas: string | null
          organizador: string | null
          tipo: string
          updated_at: string
          user_id: string
        }
        Insert: {
          activo?: boolean
          acumulado_inicial?: number
          aporte_mensual?: number | null
          categoria_id?: string | null
          created_at?: string
          dia_aporte?: number | null
          fecha_entrega?: string | null
          fecha_inicio?: string | null
          id?: string
          meta_monto?: number | null
          nombre: string
          notas?: string | null
          organizador?: string | null
          tipo?: string
          updated_at?: string
          user_id?: string
        }
        Update: Partial<Database["public"]["Tables"]["savings"]["Insert"]>
        Relationships: []
      }
      savings_contributions: {
        Row: {
          created_at: string
          fecha: string
          id: string
          monto: number
          notas: string | null
          saving_id: string
          transaction_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          fecha?: string
          id?: string
          monto: number
          notas?: string | null
          saving_id: string
          transaction_id?: string | null
          user_id?: string
        }
        Update: Partial<Database["public"]["Tables"]["savings_contributions"]["Insert"]>
        Relationships: []
      }
      transactions: {
        Row: {
          adjunto_path: string | null
          beneficiario: E["beneficiario"] | null
          bolsa: E["bolsa"]
          categoria_id: string | null
          comercio: string | null
          created_at: string
          cuenta_destino_id: string | null
          cuenta_id: string
          descripcion: string
          fecha: string
          id: string
          import_batch_id: string | null
          import_hash: string | null
          lemon_settlement_id: string | null
          monto: number
          notas: string | null
          origen: E["origen_movimiento"]
          recurring_item_id: string | null
          reembolso_estado: E["estado_reembolso"] | null
          tipo: E["tipo_movimiento"]
          updated_at: string
          user_id: string
        }
        Insert: {
          adjunto_path?: string | null
          beneficiario?: E["beneficiario"] | null
          bolsa?: E["bolsa"]
          categoria_id?: string | null
          comercio?: string | null
          created_at?: string
          cuenta_destino_id?: string | null
          cuenta_id: string
          descripcion: string
          fecha?: string
          id?: string
          import_batch_id?: string | null
          import_hash?: string | null
          lemon_settlement_id?: string | null
          monto: number
          notas?: string | null
          origen?: E["origen_movimiento"]
          recurring_item_id?: string | null
          reembolso_estado?: E["estado_reembolso"] | null
          tipo: E["tipo_movimiento"]
          updated_at?: string
          user_id?: string
        }
        Update: Partial<Database["public"]["Tables"]["transactions"]["Insert"]>
        Relationships: []
      }
      user_settings: {
        Row: {
          bolsa_default: E["bolsa"]
          categoria_default_id: string | null
          created_at: string
          cuenta_default_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          bolsa_default?: E["bolsa"]
          categoria_default_id?: string | null
          created_at?: string
          cuenta_default_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Update: Partial<Database["public"]["Tables"]["user_settings"]["Insert"]>
        Relationships: []
      }
    }
    Views: {
      account_balances: {
        Row: {
          cupo: number | null
          id: string | null
          nombre: string | null
          saldo: number | null
          tipo: E["tipo_cuenta"] | null
          ultimos4: string | null
          user_id: string | null
        }
        Relationships: []
      }
      debt_balances: {
        Row: {
          acreedor: string | null
          cuota: number | null
          id: string | null
          saldo_actual: number | null
          saldo_inicial: number | null
          solo_intereses: boolean | null
          user_id: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      beneficiario: "yo" | "hogar" | "matias" | "hijo_menor" | "esposa" | "milo"
      bolsa: "personal" | "lemon" | "freelance"
      estado_corte: "presentado" | "reembolsado_parcial" | "reembolsado"
      estado_pago_recurrente: "pendiente" | "pagado" | "omitido"
      estado_reembolso: "pendiente" | "presentado" | "reembolsado"
      frecuencia: "diaria_habil" | "semanal" | "quincenal" | "mensual" | "bimestral" | "anual"
      origen_movimiento: "manual" | "chat" | "importacion"
      tipo_categoria: "gasto" | "ingreso"
      tipo_cuenta: "debito" | "credito" | "billetera" | "efectivo"
      tipo_movimiento: "gasto" | "ingreso" | "transferencia" | "pago_tarjeta"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database["public"]

export type Tables<T extends keyof (PublicSchema["Tables"] & PublicSchema["Views"])> =
  (PublicSchema["Tables"] & PublicSchema["Views"])[T] extends { Row: infer R } ? R : never

export type TablesInsert<T extends keyof PublicSchema["Tables"]> =
  PublicSchema["Tables"][T]["Insert"]

export type Enums<T extends keyof PublicSchema["Enums"]> = PublicSchema["Enums"][T]
