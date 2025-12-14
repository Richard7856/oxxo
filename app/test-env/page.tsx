/**
 * Página temporal para verificar que las variables de entorno se están cargando correctamente
 * Elimina esta página después de verificar que todo funciona
 */

export default function TestEnvPage() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const projectId = process.env.SUPABASE_PROJECT_ID;

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Verificación de Variables de Entorno</h1>
      
      <div className="space-y-4">
        <div className="p-4 border rounded">
          <h2 className="font-semibold mb-2">NEXT_PUBLIC_SUPABASE_URL</h2>
          <p className={supabaseUrl ? "text-green-600" : "text-red-600"}>
            {supabaseUrl ? `✅ ${supabaseUrl}` : "❌ No configurado"}
          </p>
        </div>

        <div className="p-4 border rounded">
          <h2 className="font-semibold mb-2">NEXT_PUBLIC_SUPABASE_ANON_KEY</h2>
          <p className={anonKey ? "text-green-600" : "text-red-600"}>
            {anonKey 
              ? `✅ Configurado (${anonKey.substring(0, 20)}...)` 
              : "❌ No configurado"}
          </p>
          {anonKey && (
            <p className="text-sm text-gray-600 mt-2">
              Longitud: {anonKey.length} caracteres
            </p>
          )}
        </div>

        <div className="p-4 border rounded">
          <h2 className="font-semibold mb-2">SUPABASE_SERVICE_ROLE_KEY</h2>
          <p className={serviceRoleKey ? "text-green-600" : "text-red-600"}>
            {serviceRoleKey 
              ? `✅ Configurado (${serviceRoleKey.substring(0, 20)}...)` 
              : "❌ No configurado (normal, solo disponible en servidor)"}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Nota: Esta variable NO debe estar disponible en el cliente del navegador
          </p>
        </div>

        <div className="p-4 border rounded">
          <h2 className="font-semibold mb-2">SUPABASE_PROJECT_ID</h2>
          <p className={projectId ? "text-green-600" : "text-red-600"}>
            {projectId ? `✅ ${projectId}` : "❌ No configurado"}
          </p>
        </div>
      </div>

      <div className="mt-6 p-4 bg-blue-50 rounded">
        <h3 className="font-semibold mb-2">Instrucciones:</h3>
        <ol className="list-decimal list-inside space-y-1 text-sm">
          <li>Si ves ❌ en alguna variable, reinicia el servidor: <code className="bg-gray-200 px-1 rounded">npm run dev</code></li>
          <li>Si aún no funciona, limpia la caché: <code className="bg-gray-200 px-1 rounded">rm -rf .next</code></li>
          <li>Verifica que el archivo <code className="bg-gray-200 px-1 rounded">.env.local</code> esté en la raíz del proyecto</li>
          <li>Elimina esta página después de verificar que todo funciona</li>
        </ol>
      </div>
    </div>
  );
}

