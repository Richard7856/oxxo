/**
 * Database type definitions
 * Auto-generated from Supabase schema
 * Run: npm run db:types
 */

export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[];

export type UserRole = 'conductor' | 'comercial' | 'administrador';

export type ReporteState =
    | 'draft'
    | 'submitted'
    | 'resolved_by_driver'
    | 'timed_out'
    | 'completed'
    | 'archived';

export type ReporteType =
    | 'rechazo_completo'
    | 'rechazo_parcial'
    | 'devolucion'
    | 'faltante'
    | 'sobrante'
    | 'entrega'
    | 'tienda_cerrada'
    | 'bascula';

export type MessageSender = 'user' | 'agent' | 'system';

export interface Database {
    public: {
        Tables: {
            user_profiles: {
                Row: {
                    id: string;
                    email: string;
                    display_name: string;
                    role: UserRole;
                    zona: string | null;
                    avatar_url: string | null;
                    is_active: boolean;
                    metadata: Json;
                    created_at: string;
                    updated_at: string;
                };
                Insert: {
                    id: string;
                    email: string;
                    display_name: string;
                    role?: UserRole;
                    zona?: string | null;
                    avatar_url?: string | null;
                    is_active?: boolean;
                    metadata?: Json;
                };
                Update: {
                    email?: string;
                    display_name?: string;
                    role?: UserRole;
                    zona?: string | null;
                    avatar_url?: string | null;
                    is_active?: boolean;
                    metadata?: Json;
                };
            };
            stores: {
                Row: {
                    id: string;
                    codigo_tienda: string;
                    nombre: string;
                    zona: string;
                    direccion: string | null;
                    ciudad: string | null;
                    estado: string | null;
                    metadata: Json;
                    created_at: string;
                    updated_at: string;
                };
                Insert: {
                    id?: string;
                    codigo_tienda: string;
                    nombre: string;
                    zona: string;
                    direccion?: string | null;
                    ciudad?: string | null;
                    estado?: string | null;
                    metadata?: Json;
                    created_at?: string;
                    updated_at?: string;
                };
                Update: {
                    codigo_tienda?: string;
                    nombre?: string;
                    zona?: string;
                    direccion?: string | null;
                    ciudad?: string | null;
                    estado?: string | null;
                    metadata?: Json;
                };
            };
            reportes: {
                Row: {
                    id: string;
                    user_id: string;
                    store_id: string;
                    status: ReporteState;
                    tipo_reporte: ReporteType | null;
                    store_codigo: string;
                    store_nombre: string;
                    store_zona: string;
                    conductor_nombre: string;
                    motivo: string | null;
                    rechazo_details: Json | null;
                    ticket_data: Json | null;
                    ticket_image_url: string | null;
                    ticket_extraction_confirmed: boolean;
                    return_ticket_data: Json | null;
                    return_ticket_image_url: string | null;
                    return_ticket_extraction_confirmed: boolean;
                    evidence: Json;
                    incident_details: Json | null;
                    created_at: string;
                    updated_at: string;
                    submitted_at: string | null;
                    resolved_at: string | null;
                    timeout_at: string | null;
                    metadata: Json;
                };
                Insert: {
                    id?: string;
                    user_id: string;
                    store_id: string;
                    status?: ReporteState;
                    tipo_reporte?: ReporteType | null;
                    store_codigo: string;
                    store_nombre: string;
                    store_zona: string;
                    conductor_nombre: string;
                    motivo?: string | null;
                    rechazo_details?: Json | null;
                    ticket_data?: Json | null;
                    ticket_image_url?: string | null;
                    ticket_extraction_confirmed?: boolean;
                    return_ticket_data?: Json | null;
                    return_ticket_image_url?: string | null;
                    return_ticket_extraction_confirmed?: boolean;
                    evidence?: Json;
                    incident_details?: Json | null;
                    metadata?: Json;
                };
                Update: {
                    status?: ReporteState;
                    tipo_reporte?: ReporteType | null;
                    motivo?: string | null;
                    rechazo_details?: Json | null;
                    ticket_data?: Json | null;
                    ticket_image_url?: string | null;
                    ticket_extraction_confirmed?: boolean;
                    return_ticket_data?: Json | null;
                    return_ticket_image_url?: string | null;
                    return_ticket_extraction_confirmed?: boolean;
                    evidence?: Json;
                    incident_details?: Json | null;
                    metadata?: Json;
                };
            };
            messages: {
                Row: {
                    id: string;
                    reporte_id: string;
                    sender: MessageSender;
                    sender_user_id: string | null;
                    text: string | null;
                    image_url: string | null;
                    ai_resolution_detected: boolean | null;
                    ai_confidence: number | null;
                    created_at: string;
                };
                Insert: {
                    id?: string;
                    reporte_id: string;
                    sender: MessageSender;
                    sender_user_id?: string | null;
                    text?: string | null;
                    image_url?: string | null;
                    ai_resolution_detected?: boolean | null;
                    ai_confidence?: number | null;
                };
                Update: {
                    ai_resolution_detected?: boolean | null;
                    ai_confidence?: number | null;
                };
            };
            processed_tickets: {
                Row: {
                    id: string;
                    reporte_id: string | null;
                    ticket_number: string;
                    store_cr: string;
                    fecha: string;
                    total_amount: number;
                    items: Json;
                    ticket_image_url: string;
                    submitted_at: string;
                    submitted_by: string;
                    metadata: Json;
                };
                Insert: {
                    id?: string;
                    reporte_id?: string | null;
                    ticket_number: string;
                    store_cr: string;
                    fecha: string;
                    total_amount: number;
                    items: Json;
                    ticket_image_url: string;
                    submitted_by: string;
                    metadata?: Json;
                };
                Update: {
                    metadata?: Json;
                };
            };
        };
        Functions: {
            create_reporte_atomic: {
                Args: {
                    p_user_id: string;
                    p_store_id: string;
                    p_tipo_reporte: ReporteType;
                    p_conductor_nombre: string;
                    p_motivo?: string;
                    p_ticket_data?: Json;
                    p_ticket_image_url?: string;
                };
                Returns: string;
            };
        };
    };
}
