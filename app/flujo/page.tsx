export default function FlujoPage() {
    return (
        <div className="min-h-screen bg-gray-950 text-white p-6 font-sans">
            <div className="max-w-7xl mx-auto">

                {/* Header */}
                <div className="mb-10 text-center">
                    <h1 className="text-3xl font-bold text-white tracking-tight">OXXO Logistics</h1>
                    <p className="text-gray-400 mt-1 text-sm">Diagrama de flujos y vistas por rol</p>
                </div>

                {/* Roles Overview */}
                <div className="grid grid-cols-3 gap-4 mb-10">
                    <RoleCard
                        color="blue"
                        icon="🚛"
                        title="Conductor"
                        subtitle="Driver"
                        desc="Crea y gestiona reportes de entrega. Sube evidencias, tickets y chatea con el agente comercial."
                        route="/conductor"
                    />
                    <RoleCard
                        color="emerald"
                        icon="💼"
                        title="Comercial"
                        subtitle="Agente"
                        desc="Monitorea incidentes por zona. Atiende chats en tiempo real y cierra reportes."
                        route="/comercial"
                    />
                    <RoleCard
                        color="purple"
                        icon="🔧"
                        title="Administrador"
                        subtitle="Admin"
                        desc="Gestiona usuarios, zonas y exportaciones. Acceso total al sistema."
                        route="/admin"
                    />
                </div>

                {/* Lifecycle */}
                <Section title="Ciclo de Vida del Reporte" icon="🔄">
                    <div className="flex items-center gap-2 flex-wrap">
                        {[
                            { label: 'draft', color: 'bg-gray-700 text-gray-200', desc: 'Reporte creado' },
                            { label: '→', color: '', desc: '' },
                            { label: 'submitted', color: 'bg-yellow-800 text-yellow-200', desc: 'Enviado' },
                            { label: '→', color: '', desc: '' },
                            { label: 'resolved_by_driver', color: 'bg-blue-800 text-blue-200', desc: 'Conductor marcó resuelto' },
                            { label: '→', color: '', desc: '' },
                            { label: 'completed', color: 'bg-green-800 text-green-200', desc: 'Cerrado por comercial' },
                            { label: '→', color: '', desc: '' },
                            { label: 'archived', color: 'bg-gray-800 text-gray-400', desc: 'Archivado' },
                        ].map((item, i) =>
                            item.label === '→' ? (
                                <span key={i} className="text-gray-500 text-lg font-bold">→</span>
                            ) : (
                                <div key={i} className="flex flex-col items-center gap-1">
                                    <span className={`px-3 py-1 rounded-full text-xs font-mono font-semibold ${item.color}`}>
                                        {item.label}
                                    </span>
                                    <span className="text-gray-500 text-[10px]">{item.desc}</span>
                                </div>
                            )
                        )}
                    </div>
                    <div className="mt-4 flex items-center gap-2">
                        <span className="text-gray-500 text-xs">También:</span>
                        <span className="px-3 py-1 rounded-full text-xs font-mono font-semibold bg-red-900 text-red-200">timed_out</span>
                        <span className="text-gray-500 text-xs">→ cuando expiran los 20 min sin respuesta</span>
                        <span className="text-gray-500 text-xs ml-4">→ también puede ir a</span>
                        <span className="px-3 py-1 rounded-full text-xs font-mono font-semibold bg-green-800 text-green-200">completed</span>
                    </div>
                </Section>

                {/* Conductor Flow */}
                <Section title="Flujo Conductor" icon="🚛" color="blue">
                    <div className="grid grid-cols-1 gap-3">

                        {/* Step 1 */}
                        <FlowRow step="1" label="Validar Tienda" route="/conductor" badge="draft">
                            <Detail>Ingresa código de tienda (ej: 50CUE)</Detail>
                            <Detail>Valida contra n8n webhook → crea reporte en DB</Detail>
                        </FlowRow>

                        {/* Step 2 */}
                        <FlowRow step="2" label="Seleccionar Tipo de Reporte" route="/conductor/nuevo-reporte/[id]" badge="draft">
                            <TypeBadge color="blue" label="📦 Entrega" />
                            <TypeBadge color="orange" label="🔒 Tienda Cerrada" />
                            <TypeBadge color="gray" label="⚖️ Báscula" />
                        </FlowRow>

                        {/* Branch: Entrega */}
                        <div className="ml-6 border-l-2 border-blue-800 pl-4 space-y-3">
                            <p className="text-blue-400 text-xs font-semibold uppercase tracking-widest mb-2">Rama: Entrega</p>

                            <FlowRow step="2a" label="Subir Evidencia de Llegada" route="/conductor/nuevo-reporte/[id]/flujo?step=evidence">
                                <Detail>2 fotos requeridas: frente + interior del camión</Detail>
                                <Detail>Compresión automática si &gt;2MB</Detail>
                            </FlowRow>

                            <FlowRow step="2b" label="Carrito de Incidentes" route="/conductor/nuevo-reporte/[id]/flujo?step=incidents">
                                <Detail>Selección de productos afectados de lista predefinida</Detail>
                                <Detail>Foto por producto → sube a bucket evidence</Detail>
                                <Detail>Tipos: rechazo completo / parcial / devolución / faltante / sobrante</Detail>
                            </FlowRow>

                            <FlowRow step="2c" label="Ticket Principal" route="/conductor/nuevo-reporte/[id]/flujo?step=ticket">
                                <Detail>Sube foto del ticket de entrega</Detail>
                                <Detail>Claude Vision (claude-sonnet-4-6) extrae datos estructurados</Detail>
                                <Detail>Conductor revisa y confirma los datos extraídos</Detail>
                            </FlowRow>

                            <FlowRow step="2d" label="Ticket de Merma (opcional)" route="/conductor/nuevo-reporte/[id]/ticket-merma-review">
                                <Detail>Mismo flujo de extracción para ticket de devolución</Detail>
                            </FlowRow>

                            <FlowRow step="2e" label="Chat con Comercial" route="/conductor/chat/[id]" badge="submitted">
                                <Detail>Timer 20 min en tiempo real (Supabase Realtime)</Detail>
                                <Detail>Puede subir fotos adicionales al chat</Detail>
                                <Detail>Botón &quot;Problema Resuelto&quot; → resolved_by_driver</Detail>
                            </FlowRow>

                            <FlowRow step="2f" label="Finalizar" route="/conductor/nuevo-reporte/[id]/flujo?step=finish" badge="submitted">
                                <Detail>Confirmación y cierre del flujo conductor</Detail>
                            </FlowRow>
                        </div>

                        {/* Branch: Tienda Cerrada */}
                        <div className="ml-6 border-l-2 border-orange-800 pl-4 space-y-3">
                            <p className="text-orange-400 text-xs font-semibold uppercase tracking-widest mb-2">Rama: Tienda Cerrada</p>
                            <FlowRow step="2a" label="Chat directo" route="/conductor/chat/[id]" badge="submitted">
                                <Detail>Sin pasos de evidencia ni ticket</Detail>
                                <Detail>Si expira el timer → auto-cierra con timed_out</Detail>
                                <Detail>Comercial decide si la tienda abrió o no</Detail>
                            </FlowRow>
                        </div>
                    </div>
                </Section>

                {/* Comercial Flow */}
                <Section title="Flujo Comercial" icon="💼" color="emerald">
                    <div className="grid grid-cols-1 gap-3">
                        <FlowRow step="1" label="Dashboard" route="/comercial">
                            <Detail>Lista de reportes activos: draft, submitted, resolved_by_driver</Detail>
                            <Detail>Notificaciones push cuando llega un nuevo mensaje</Detail>
                        </FlowRow>
                        <FlowRow step="2" label="Detalle del Reporte" route="/comercial/reporte/[id]">
                            <Detail>Tab Resumen: info de tienda, conductor, estado</Detail>
                            <Detail>Tab Timeline: historial de eventos</Detail>
                            <Detail>Tab Tickets: breakdown recibidos vs merma con totales</Detail>
                            <Detail>Evidencias con visor de fotos</Detail>
                        </FlowRow>
                        <FlowRow step="3" label="Chat en Tiempo Real" route="/comercial/chat/[id]">
                            <Detail>Recibe mensajes del conductor via Supabase Realtime</Detail>
                            <Detail>Timer countdown visible</Detail>
                            <Detail>Claude analiza cada mensaje para detectar resolución automática</Detail>
                            <Detail>Botón &quot;Cerrar Chat&quot; → completed</Detail>
                        </FlowRow>
                    </div>
                </Section>

                {/* Admin Flow */}
                <Section title="Flujo Administrador" icon="🔧" color="purple">
                    <div className="grid grid-cols-1 gap-3">
                        <FlowRow step="1" label="Panel Admin" route="/admin">
                            <Detail>Gestión de usuarios (roles, zonas)</Detail>
                            <Detail>Vista completa de todos los reportes</Detail>
                            <Detail>Exportación de datos</Detail>
                        </FlowRow>
                        <FlowRow step="2" label="Detalle Reporte (Admin)" route="/admin/reporte/[id]">
                            <Detail>Misma vista que comercial + acciones admin</Detail>
                        </FlowRow>
                        <FlowRow step="3" label="Chat (Admin)" route="/admin/chat/[id]">
                            <Detail>Puede intervenir en cualquier chat activo</Detail>
                        </FlowRow>
                    </div>
                </Section>

                {/* AI & Tech */}
                <Section title="Integraciones Técnicas" icon="⚙️">
                    <div className="grid grid-cols-2 gap-4">
                        <TechCard icon="🤖" title="Claude Vision (Extracción de Tickets)" model="claude-sonnet-4-6">
                            <Detail>Extrae: número folio, fecha, productos, cantidades, precios</Detail>
                            <Detail>Retry con backoff 5s/10s</Detail>
                            <Detail>Fallback: entrada manual si falla</Detail>
                        </TechCard>
                        <TechCard icon="🧠" title="Claude (Análisis de Resolución)" model="claude-sonnet-4-6">
                            <Detail>Analiza cada mensaje del conductor</Detail>
                            <Detail>Detecta si el problema fue resuelto</Detail>
                            <Detail>Confianza mínima 0.7 para marcar resuelto</Detail>
                        </TechCard>
                        <TechCard icon="🔔" title="Push Notifications (PWA)" model="">
                            <Detail>Web Push con VAPID keys</Detail>
                            <Detail>Service Worker en public/sw.js</Detail>
                            <Detail>Notificaciones a todos los comerciales/admins</Detail>
                        </TechCard>
                        <TechCard icon="⚡" title="Supabase Realtime" model="">
                            <Detail>Canal por reporte: chat_messages_{"{reportId}"}</Detail>
                            <Detail>Subscription en INSERT de tabla messages</Detail>
                            <Detail>Auto-scroll al recibir mensaje</Detail>
                        </TechCard>
                    </div>
                </Section>

                {/* DB Tables */}
                <Section title="Tablas Principales" icon="🗄️">
                    <div className="grid grid-cols-3 gap-3">
                        {[
                            { table: 'user_profiles', fields: ['id', 'role (conductor|comercial|administrador)', 'display_name', 'full_name', 'zona'] },
                            { table: 'reportes', fields: ['id', 'user_id', 'store_codigo', 'store_nombre', 'tipo_reporte', 'status', 'evidence (JSONB)', 'ticket_data (JSONB)', 'timeout_at'] },
                            { table: 'messages', fields: ['id', 'reporte_id', 'text', 'image_url', 'sender (user|agent|system)', 'sender_user_id', 'created_at'] },
                            { table: 'processed_tickets', fields: ['id', 'reporte_id', 'ticket_type', 'extracted_data', 'confirmed_at'] },
                            { table: 'stores', fields: ['id', 'codigo_tienda', 'nombre', 'zona', 'activo'] },
                            { table: 'push_subscriptions', fields: ['id', 'user_id', 'endpoint', 'keys (JSONB)', 'created_at'] },
                        ].map(({ table, fields }) => (
                            <div key={table} className="bg-gray-900 rounded-lg p-3 border border-gray-800">
                                <p className="font-mono text-yellow-400 text-xs font-bold mb-2">{table}</p>
                                <ul className="space-y-1">
                                    {fields.map(f => (
                                        <li key={f} className="text-gray-400 text-[11px] font-mono">{f}</li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </div>
                </Section>

                <div className="text-center text-gray-700 text-xs mt-8">
                    OXXO Logistics — Actualizado 2026 · Solo zona CDMX
                </div>
            </div>
        </div>
    );
}

/* ── Sub-components ─────────────────────────────────────────── */

function RoleCard({ color, icon, title, subtitle, desc, route }: {
    color: string; icon: string; title: string; subtitle: string; desc: string; route: string;
}) {
    const colors: Record<string, string> = {
        blue: 'border-blue-700 bg-blue-950',
        emerald: 'border-emerald-700 bg-emerald-950',
        purple: 'border-purple-700 bg-purple-950',
    };
    const textColors: Record<string, string> = {
        blue: 'text-blue-300',
        emerald: 'text-emerald-300',
        purple: 'text-purple-300',
    };
    return (
        <div className={`rounded-xl border p-5 ${colors[color]}`}>
            <div className="text-3xl mb-2">{icon}</div>
            <div className={`font-bold text-lg ${textColors[color]}`}>{title}</div>
            <div className="text-gray-500 text-xs mb-3">{subtitle} · <span className="font-mono">{route}</span></div>
            <p className="text-gray-300 text-sm leading-relaxed">{desc}</p>
        </div>
    );
}

function Section({ title, icon, color, children }: {
    title: string; icon: string; color?: string; children: React.ReactNode;
}) {
    return (
        <div className="mb-8">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <span>{icon}</span> {title}
            </h2>
            <div className="bg-gray-900 rounded-xl border border-gray-800 p-5">
                {children}
            </div>
        </div>
    );
}

function FlowRow({ step, label, route, badge, children }: {
    step: string; label: string; route: string; badge?: string; children: React.ReactNode;
}) {
    const badgeColors: Record<string, string> = {
        draft: 'bg-gray-700 text-gray-300',
        submitted: 'bg-yellow-800 text-yellow-200',
        completed: 'bg-green-800 text-green-200',
    };
    return (
        <div className="flex gap-4 items-start">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-800 border border-gray-700 flex items-center justify-center text-xs font-bold text-gray-300">
                {step}
            </div>
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="text-white font-medium text-sm">{label}</span>
                    <span className="font-mono text-gray-600 text-[11px]">{route}</span>
                    {badge && (
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold ${badgeColors[badge] || 'bg-gray-700 text-gray-300'}`}>
                            → {badge}
                        </span>
                    )}
                </div>
                <div className="space-y-0.5">{children}</div>
            </div>
        </div>
    );
}

function Detail({ children }: { children: React.ReactNode }) {
    return <p className="text-gray-400 text-xs ml-0 flex items-start gap-1"><span className="text-gray-600">·</span>{children}</p>;
}

function TypeBadge({ color, label }: { color: string; label: string }) {
    const colors: Record<string, string> = {
        blue: 'bg-blue-900 text-blue-200 border-blue-800',
        orange: 'bg-orange-900 text-orange-200 border-orange-800',
        gray: 'bg-gray-800 text-gray-300 border-gray-700',
    };
    return <span className={`inline-flex px-2 py-1 rounded text-xs font-medium border ${colors[color]}`}>{label}</span>;
}

function TechCard({ icon, title, model, children }: {
    icon: string; title: string; model: string; children: React.ReactNode;
}) {
    return (
        <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
            <div className="flex items-center gap-2 mb-2">
                <span className="text-lg">{icon}</span>
                <div>
                    <p className="text-white text-sm font-medium">{title}</p>
                    {model && <p className="text-gray-500 text-[11px] font-mono">{model}</p>}
                </div>
            </div>
            <div className="space-y-0.5">{children}</div>
        </div>
    );
}
