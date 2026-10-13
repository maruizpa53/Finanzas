// Generado desde Supabase (generate_typescript_types). No editar a mano.
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
          tipo: Database["public"]["Enums"]["tipo_cuenta"]
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
          tipo: Database["public"]["Enums"]["tipo_cuenta"]
          ultimos4?: string | null
          updated_at?: string
          user_id?: string
        }
        Update: {
          activa?: boolean
          color?: string | null
          created_at?: string
          cupo?: number | null
          dia_corte?: number | null
          dia_pago?: number | null
          icono?: string | null
          id?: string
          institucion?: string | null
          nombre?: string
          notas?: string | null
          orden?: number
          saldo_inicial?: number
          saldo_inicial_fecha?: string
          tipo?: Database["public"]["Enums"]["tipo_cuenta"]
          ultimos4?: string | null
          updated_at?: string
          user_id?: string
        }
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
        Update: {
          alerta_100?: boolean
          alerta_80?: boolean
          categoria_id?: string
          created_at?: string
          id?: string
          mes?: string | null
          monto?: number
          monto_diario_habil?: number
          notas?: string | null
          updated_at?: string
          user_id?: string
        }
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
          beneficiario_default:
            | Database["public"]["Enums"]["beneficiario"]
            | null
          bolsa_default: Database["public"]["Enums"]["bolsa"] | null
          color: string | null
          created_at: string
          es_fijo: boolean
          icono: string | null
          id: string
          nombre: string
          orden: number
          parent_id: string | null
          tipo: Database["public"]["Enums"]["tipo_categoria"]
          updated_at: string
          user_id: string
        }
        Insert: {
          activa?: boolean
          beneficiario_default?:
            | Database["public"]["Enums"]["beneficiario"]
            | null
          bolsa_default?: Database["public"]["Enums"]["bolsa"] | null
          color?: string | null
          created_at?: string
          es_fijo?: boolean
          icono?: string | null
          id?: string
          nombre: string
          orden?: number
          parent_id?: string | null
          tipo?: Database["public"]["Enums"]["tipo_categoria"]
          updated_at?: string
          user_id?: string
        }
        Update: {
          activa?: boolean
          beneficiario_default?:
            | Database["public"]["Enums"]["beneficiario"]
            | null
          bolsa_default?: Database["public"]["Enums"]["bolsa"] | null
          color?: string | null
          created_at?: string
          es_fijo?: boolean
          icono?: string | null
          id?: string
          nombre?: string
          orden?: number
          parent_id?: string | null
          tipo?: Database["public"]["Enums"]["tipo_categoria"]
          updated_at?: string
          user_id?: string
        }
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
          beneficiario: Database["public"]["Enums"]["beneficiario"] | null
          bolsa: Database["public"]["Enums"]["bolsa"] | null
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
          beneficiario?: Database["public"]["Enums"]["beneficiario"] | null
          bolsa?: Database["public"]["Enums"]["bolsa"] | null
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
        Update: {
          activa?: boolean
          beneficiario?: Database["public"]["Enums"]["beneficiario"] | null
          bolsa?: Database["public"]["Enums"]["bolsa"] | null
          categoria_id?: string | null
          created_at?: string
          id?: string
          origen?: string
          patron?: string
          prioridad?: number
          tipo_patron?: string
          updated_at?: string
          user_id?: string
          veces_aplicada?: number
        }
        Relationships: [
          {
            foreignKeyName: "categorization_rules_categoria_id_fkey"
            columns: ["categoria_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
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
        Update: {
          content?: Json
          conversation_id?: string
          created_at?: string
          id?: string
          role?: string
          user_id?: string
        }
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
        Update: {
          capital?: number
          created_at?: string
          debt_id?: string
          fecha?: string
          id?: string
          interes?: number
          monto_total?: number
          notas?: string | null
          transaction_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "debt_payments_debt_id_fkey"
            columns: ["debt_id"]
            isOneToOne: false
            referencedRelation: "debt_balances"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "debt_payments_debt_id_fkey"
            columns: ["debt_id"]
            isOneToOne: false
            referencedRelation: "debts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "debt_payments_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          },
        ]
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
        Update: {
          acreedor?: string
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
        Relationships: [
          {
            foreignKeyName: "debts_categoria_id_fkey"
            columns: ["categoria_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
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
        Update: {
          archivo_path?: string | null
          banco?: string
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
        Relationships: [
          {
            foreignKeyName: "import_batches_cuenta_id_fkey"
            columns: ["cuenta_id"]
            isOneToOne: false
            referencedRelation: "account_balances"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "import_batches_cuenta_id_fkey"
            columns: ["cuenta_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      income_sources: {
        Row: {
          activa: boolean
          bolsa: Database["public"]["Enums"]["bolsa"]
          categoria_id: string | null
          created_at: string
          cuenta_id: string | null
          dia_pago: number | null
          es_variable: boolean
          frecuencia: Database["public"]["Enums"]["frecuencia"]
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
          bolsa?: Database["public"]["Enums"]["bolsa"]
          categoria_id?: string | null
          created_at?: string
          cuenta_id?: string | null
          dia_pago?: number | null
          es_variable?: boolean
          frecuencia?: Database["public"]["Enums"]["frecuencia"]
          id?: string
          monto_esperado?: number | null
          nombre: string
          notas?: string | null
          tipo: string
          updated_at?: string
          user_id?: string
        }
        Update: {
          activa?: boolean
          bolsa?: Database["public"]["Enums"]["bolsa"]
          categoria_id?: string | null
          created_at?: string
          cuenta_id?: string | null
          dia_pago?: number | null
          es_variable?: boolean
          frecuencia?: Database["public"]["Enums"]["frecuencia"]
          id?: string
          monto_esperado?: number | null
          nombre?: string
          notas?: string | null
          tipo?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "income_sources_categoria_id_fkey"
            columns: ["categoria_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "income_sources_cuenta_id_fkey"
            columns: ["cuenta_id"]
            isOneToOne: false
            referencedRelation: "account_balances"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "income_sources_cuenta_id_fkey"
            columns: ["cuenta_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      lemon_settlements: {
        Row: {
          archivo_path: string | null
          created_at: string
          estado: Database["public"]["Enums"]["estado_corte"]
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
          estado?: Database["public"]["Enums"]["estado_corte"]
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
        Update: {
          archivo_path?: string | null
          created_at?: string
          estado?: Database["public"]["Enums"]["estado_corte"]
          fecha_corte?: string
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
        Relationships: []
      }
      projects: {
        Row: {
          activo: boolean
          created_at: string
          emoji: string | null
          fecha_fin: string | null
          fecha_inicio: string | null
          id: string
          moneda: string | null
          nombre: string
          notas: string | null
          presupuesto: number | null
          tag_id: string | null
          tasa_cambio: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          activo?: boolean
          created_at?: string
          emoji?: string | null
          fecha_fin?: string | null
          fecha_inicio?: string | null
          id?: string
          moneda?: string | null
          nombre: string
          notas?: string | null
          presupuesto?: number | null
          tag_id?: string | null
          tasa_cambio?: number | null
          updated_at?: string
          user_id?: string
        }
        Update: {
          activo?: boolean
          created_at?: string
          emoji?: string | null
          fecha_fin?: string | null
          fecha_inicio?: string | null
          id?: string
          moneda?: string | null
          nombre?: string
          notas?: string | null
          presupuesto?: number | null
          tag_id?: string | null
          tasa_cambio?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "projects_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "tags"
            referencedColumns: ["id"]
          },
        ]
      }
      recurring_items: {
        Row: {
          activo: boolean
          beneficiario: Database["public"]["Enums"]["beneficiario"] | null
          bolsa: Database["public"]["Enums"]["bolsa"]
          categoria_id: string | null
          created_at: string
          cuenta_id: string | null
          dia_pago: number | null
          es_variable: boolean
          fecha_fin: string | null
          fecha_inicio: string
          frecuencia: Database["public"]["Enums"]["frecuencia"]
          id: string
          monto_esperado: number | null
          nombre: string
          notas: string | null
          tipo: Database["public"]["Enums"]["tipo_categoria"]
          updated_at: string
          user_id: string
        }
        Insert: {
          activo?: boolean
          beneficiario?: Database["public"]["Enums"]["beneficiario"] | null
          bolsa?: Database["public"]["Enums"]["bolsa"]
          categoria_id?: string | null
          created_at?: string
          cuenta_id?: string | null
          dia_pago?: number | null
          es_variable?: boolean
          fecha_fin?: string | null
          fecha_inicio?: string
          frecuencia?: Database["public"]["Enums"]["frecuencia"]
          id?: string
          monto_esperado?: number | null
          nombre: string
          notas?: string | null
          tipo?: Database["public"]["Enums"]["tipo_categoria"]
          updated_at?: string
          user_id?: string
        }
        Update: {
          activo?: boolean
          beneficiario?: Database["public"]["Enums"]["beneficiario"] | null
          bolsa?: Database["public"]["Enums"]["bolsa"]
          categoria_id?: string | null
          created_at?: string
          cuenta_id?: string | null
          dia_pago?: number | null
          es_variable?: boolean
          fecha_fin?: string | null
          fecha_inicio?: string
          frecuencia?: Database["public"]["Enums"]["frecuencia"]
          id?: string
          monto_esperado?: number | null
          nombre?: string
          notas?: string | null
          tipo?: Database["public"]["Enums"]["tipo_categoria"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "recurring_items_categoria_id_fkey"
            columns: ["categoria_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recurring_items_cuenta_id_fkey"
            columns: ["cuenta_id"]
            isOneToOne: false
            referencedRelation: "account_balances"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recurring_items_cuenta_id_fkey"
            columns: ["cuenta_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      recurring_occurrences: {
        Row: {
          created_at: string
          estado: Database["public"]["Enums"]["estado_pago_recurrente"]
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
          estado?: Database["public"]["Enums"]["estado_pago_recurrente"]
          fecha_vencimiento: string
          id?: string
          monto_esperado?: number | null
          recurring_item_id: string
          transaction_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Update: {
          created_at?: string
          estado?: Database["public"]["Enums"]["estado_pago_recurrente"]
          fecha_vencimiento?: string
          id?: string
          monto_esperado?: number | null
          recurring_item_id?: string
          transaction_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "recurring_occurrences_recurring_item_id_fkey"
            columns: ["recurring_item_id"]
            isOneToOne: false
            referencedRelation: "recurring_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recurring_occurrences_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          },
        ]
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
        Update: {
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
          nombre?: string
          notas?: string | null
          organizador?: string | null
          tipo?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "savings_categoria_id_fkey"
            columns: ["categoria_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
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
        Update: {
          created_at?: string
          fecha?: string
          id?: string
          monto?: number
          notas?: string | null
          saving_id?: string
          transaction_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "savings_contributions_saving_id_fkey"
            columns: ["saving_id"]
            isOneToOne: false
            referencedRelation: "savings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "savings_contributions_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      tags: {
        Row: {
          activa: boolean
          color: string | null
          created_at: string
          descripcion: string | null
          emoji: string | null
          grupo: string
          id: string
          nombre: string
          orden: number
          user_id: string
        }
        Insert: {
          activa?: boolean
          color?: string | null
          created_at?: string
          descripcion?: string | null
          emoji?: string | null
          grupo?: string
          id?: string
          nombre: string
          orden?: number
          user_id?: string
        }
        Update: {
          activa?: boolean
          color?: string | null
          created_at?: string
          descripcion?: string | null
          emoji?: string | null
          grupo?: string
          id?: string
          nombre?: string
          orden?: number
          user_id?: string
        }
        Relationships: []
      }
      transaction_tags: {
        Row: {
          tag_id: string
          transaction_id: string
          user_id: string
        }
        Insert: {
          tag_id: string
          transaction_id: string
          user_id?: string
        }
        Update: {
          tag_id?: string
          transaction_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "transaction_tags_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "tags"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transaction_tags_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      transactions: {
        Row: {
          adjunto_path: string | null
          beneficiario: Database["public"]["Enums"]["beneficiario"] | null
          bolsa: Database["public"]["Enums"]["bolsa"]
          categoria_id: string | null
          comercio: string | null
          created_at: string
          cuenta_destino_id: string | null
          cuenta_id: string
          descripcion: string
          fecha: string
          grupo_id: string | null
          id: string
          import_batch_id: string | null
          import_hash: string | null
          lemon_settlement_id: string | null
          moneda_original: string | null
          monto: number
          monto_original: number | null
          notas: string | null
          origen: Database["public"]["Enums"]["origen_movimiento"]
          recurring_item_id: string | null
          reembolso_estado:
            | Database["public"]["Enums"]["estado_reembolso"]
            | null
          revisado: boolean
          tipo: Database["public"]["Enums"]["tipo_movimiento"]
          updated_at: string
          user_id: string
        }
        Insert: {
          adjunto_path?: string | null
          beneficiario?: Database["public"]["Enums"]["beneficiario"] | null
          bolsa?: Database["public"]["Enums"]["bolsa"]
          categoria_id?: string | null
          comercio?: string | null
          created_at?: string
          cuenta_destino_id?: string | null
          cuenta_id: string
          descripcion: string
          fecha?: string
          grupo_id?: string | null
          id?: string
          import_batch_id?: string | null
          import_hash?: string | null
          lemon_settlement_id?: string | null
          moneda_original?: string | null
          monto: number
          monto_original?: number | null
          notas?: string | null
          origen?: Database["public"]["Enums"]["origen_movimiento"]
          recurring_item_id?: string | null
          reembolso_estado?:
            | Database["public"]["Enums"]["estado_reembolso"]
            | null
          revisado?: boolean
          tipo: Database["public"]["Enums"]["tipo_movimiento"]
          updated_at?: string
          user_id?: string
        }
        Update: {
          adjunto_path?: string | null
          beneficiario?: Database["public"]["Enums"]["beneficiario"] | null
          bolsa?: Database["public"]["Enums"]["bolsa"]
          categoria_id?: string | null
          comercio?: string | null
          created_at?: string
          cuenta_destino_id?: string | null
          cuenta_id?: string
          descripcion?: string
          fecha?: string
          grupo_id?: string | null
          id?: string
          import_batch_id?: string | null
          import_hash?: string | null
          lemon_settlement_id?: string | null
          moneda_original?: string | null
          monto?: number
          monto_original?: number | null
          notas?: string | null
          origen?: Database["public"]["Enums"]["origen_movimiento"]
          recurring_item_id?: string | null
          reembolso_estado?:
            | Database["public"]["Enums"]["estado_reembolso"]
            | null
          revisado?: boolean
          tipo?: Database["public"]["Enums"]["tipo_movimiento"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "transactions_categoria_id_fkey"
            columns: ["categoria_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_cuenta_destino_id_fkey"
            columns: ["cuenta_destino_id"]
            isOneToOne: false
            referencedRelation: "account_balances"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_cuenta_destino_id_fkey"
            columns: ["cuenta_destino_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_cuenta_id_fkey"
            columns: ["cuenta_id"]
            isOneToOne: false
            referencedRelation: "account_balances"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_cuenta_id_fkey"
            columns: ["cuenta_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_import_batch_id_fkey"
            columns: ["import_batch_id"]
            isOneToOne: false
            referencedRelation: "import_batches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_lemon_settlement_id_fkey"
            columns: ["lemon_settlement_id"]
            isOneToOne: false
            referencedRelation: "lemon_settlements"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_recurring_item_id_fkey"
            columns: ["recurring_item_id"]
            isOneToOne: false
            referencedRelation: "recurring_items"
            referencedColumns: ["id"]
          },
        ]
      }
      user_settings: {
        Row: {
          bolsa_default: Database["public"]["Enums"]["bolsa"]
          calendario_token: string | null
          categoria_default_id: string | null
          created_at: string
          cuenta_default_id: string | null
          reparto_ingreso: Json
          tags_default: string[]
          updated_at: string
          user_id: string
        }
        Insert: {
          bolsa_default?: Database["public"]["Enums"]["bolsa"]
          calendario_token?: string | null
          categoria_default_id?: string | null
          created_at?: string
          cuenta_default_id?: string | null
          reparto_ingreso?: Json
          tags_default?: string[]
          updated_at?: string
          user_id?: string
        }
        Update: {
          bolsa_default?: Database["public"]["Enums"]["bolsa"]
          calendario_token?: string | null
          categoria_default_id?: string | null
          created_at?: string
          cuenta_default_id?: string | null
          reparto_ingreso?: Json
          tags_default?: string[]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_settings_categoria_default_id_fkey"
            columns: ["categoria_default_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_settings_cuenta_default_id_fkey"
            columns: ["cuenta_default_id"]
            isOneToOne: false
            referencedRelation: "account_balances"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_settings_cuenta_default_id_fkey"
            columns: ["cuenta_default_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      account_balances: {
        Row: {
          cupo: number | null
          id: string | null
          nombre: string | null
          saldo: number | null
          tipo: Database["public"]["Enums"]["tipo_cuenta"] | null
          ultimos4: string | null
          user_id: string | null
        }
        Insert: {
          cupo?: number | null
          id?: string | null
          nombre?: string | null
          saldo?: never
          tipo?: Database["public"]["Enums"]["tipo_cuenta"] | null
          ultimos4?: string | null
          user_id?: string | null
        }
        Update: {
          cupo?: number | null
          id?: string | null
          nombre?: string | null
          saldo?: never
          tipo?: Database["public"]["Enums"]["tipo_cuenta"] | null
          ultimos4?: string | null
          user_id?: string | null
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
        Insert: {
          acreedor?: string | null
          cuota?: number | null
          id?: string | null
          saldo_actual?: never
          saldo_inicial?: number | null
          solo_intereses?: boolean | null
          user_id?: string | null
        }
        Update: {
          acreedor?: string | null
          cuota?: number | null
          id?: string | null
          saldo_actual?: never
          saldo_inicial?: number | null
          solo_intereses?: boolean | null
          user_id?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      calendario_feed: { Args: { p_token: string }; Returns: Json }
    }
    Enums: {
      beneficiario: "yo" | "hogar" | "matias" | "hijo_menor" | "esposa" | "milo"
      bolsa: "personal" | "lemon" | "freelance"
      estado_corte: "presentado" | "reembolsado_parcial" | "reembolsado"
      estado_pago_recurrente: "pendiente" | "pagado" | "omitido"
      estado_reembolso: "pendiente" | "presentado" | "reembolsado"
      frecuencia:
        | "diaria_habil"
        | "semanal"
        | "quincenal"
        | "mensual"
        | "bimestral"
        | "anual"
      origen_movimiento: "manual" | "chat" | "importacion"
      tipo_categoria: "gasto" | "ingreso" | "transferencia"
      tipo_cuenta: "debito" | "credito" | "billetera" | "efectivo"
      tipo_movimiento: "gasto" | "ingreso" | "transferencia" | "pago_tarjeta"
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
    Enums: {
      beneficiario: ["yo", "hogar", "matias", "hijo_menor", "esposa", "milo"],
      bolsa: ["personal", "lemon", "freelance"],
      estado_corte: ["presentado", "reembolsado_parcial", "reembolsado"],
      estado_pago_recurrente: ["pendiente", "pagado", "omitido"],
      estado_reembolso: ["pendiente", "presentado", "reembolsado"],
      frecuencia: [
        "diaria_habil",
        "semanal",
        "quincenal",
        "mensual",
        "bimestral",
        "anual",
      ],
      origen_movimiento: ["manual", "chat", "importacion"],
      tipo_categoria: ["gasto", "ingreso", "transferencia"],
      tipo_cuenta: ["debito", "credito", "billetera", "efectivo"],
      tipo_movimiento: ["gasto", "ingreso", "transferencia", "pago_tarjeta"],
    },
  },
} as const
