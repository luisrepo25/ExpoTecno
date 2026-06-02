<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

/**
 * PersonaController
 * ═══════════════════════════════════════════════════════════════════════
 * Aplica las buenas prácticas de seguridad expuestas en la Lámina 07
 * de la presentación del grupo:
 *
 *  1. CONTRA SQL INJECTION: Se usa el Query Builder de Laravel (DB::table)
 *     que internamente trabaja con PDO y sentencias preparadas. Esto es el
 *     equivalente moderno de pg_escape_string() o mysqli_real_escape_string()
 *     — pero automático y a prueba de errores humanos.
 *
 *     ❌ Vulnerable (PHP clásico):
 *        "SELECT * FROM persona WHERE per_nom LIKE '%" . $_GET['q'] . "%'"
 *
 *     ✅ Seguro (Query Builder / PDO):
 *        DB::table('persona')->where('per_nom', 'ilike', "%{$buscar}%")
 *        → PDO genera internamente: WHERE per_nom ILIKE ?  con binding [$buscar]
 *
 *  2. VALIDACIÓN SERVER-SIDE: Toda entrada del usuario pasa por
 *     $request->validate() antes de tocar la base de datos. Si falla,
 *     Laravel devuelve 422 Unprocessable Entity con el JSON de errores.
 *
 *  3. AJAX / INERTIA: Cuando Inertia detecta el header "X-Inertia: true"
 *     en la petición, devuelve JSON puro (no HTML). El cliente (Vue) recibe
 *     ese JSON y actualiza el DOM sin recargar la página — esto ES AJAX.
 * ═══════════════════════════════════════════════════════════════════════
 */
class PersonaController extends Controller
{
    /**
     * Lista personas con búsqueda AJAX en tiempo real.
     *
     * FLUJO AJAX (alineado con Lámina 04 y 10):
     *   [Cliente]  →  GET /?buscar=juan  (header X-Inertia: true)
     *   [Servidor] →  Detecta header → responde JSON, NO HTML
     *   [Cliente]  →  Inertia recibe JSON → Vue actualiza solo props.personas
     *
     * BÚSQUEDA PostgreSQL:
     *   Se usa ILIKE en lugar de LIKE porque PostgreSQL distingue entre
     *   mayúsculas y minúsculas. ILIKE hace la búsqueda case-insensitive.
     *   Equivalente SQL nativo: WHERE per_nom ILIKE '%juan%'
     */
    public function index(Request $request)
    {
        $buscar = trim($request->input('buscar', ''));

        // Query Builder con PDO: cada %{$buscar}% se pasa como binding,
        // nunca se concatena directamente al SQL → inmune a SQL Injection.
        $personas = DB::table('persona')
            ->when($buscar, function ($query, $buscar) {
                $query->where('per_nom',  'ilike', "%{$buscar}%")
                      ->orWhere('per_appm', 'ilike', "%{$buscar}%")
                      ->orWhere('per_cel',  'ilike', "%{$buscar}%")
                      ->orWhere('per_cod',  'ilike', "%{$buscar}%");
            })
            ->orderBy('per_nom', 'asc')
            ->select(
                'per_cod', 'per_nom', 'per_appm', 'per_prof',
                'per_telf', 'per_cel', 'per_email', 'per_dir',
                'per_fnac', 'per_lnac', 'per_est', 'per_foto'
            )
            ->limit(100)
            ->get();
        return Inertia::render('Agenda', [
            'personas' => $personas,
            'filtros'  => ['buscar' => $buscar],
        ]);
    }

    /**
     * Registra una nueva persona.
     *
     * SEGURIDAD (Lámina 07):
     *   $request->validate() valida en el servidor ANTES de insertar.
     *   Si falla → 422 Unprocessable Entity con JSON de errores.
     *   Nunca confiar solo en la validación del frontend (JavaScript).
     */
    public function store(Request $request)
    {
        // Validación server-side: equivalente moderno de verificar $_POST manualmente
        $request->validate([
            'per_cod'   => 'required|string|max:20',
            'per_nom'   => 'required|string|max:100',
            'per_appm'  => 'required|string|max:100',
            'per_prof'  => 'nullable|string|max:100',
            'per_telf'  => 'nullable|string|max:20',
            'per_cel'   => 'required|string|max:20',
            'per_email' => 'nullable|email|max:100',
            'per_dir'   => 'nullable|string|max:200',
            'per_fnac'  => 'nullable|date',
            'per_lnac'  => 'nullable|string|max:100',
            'per_foto'  => 'nullable|image|max:4096',
        ]);

        $perCod   = trim($request->input('per_cod'));
        $fotoPath = null;

        if ($request->hasFile('per_foto')) {
            $fotoPath = $this->subirFoto($request->file('per_foto'), $perCod);
        }

        // INSERT con PDO: los valores son bindings, no concatenaciones
        DB::table('persona')->insert([
            'per_cod'    => $perCod,
            'per_nom'    => trim($request->input('per_nom')),
            'per_appm'   => trim($request->input('per_appm')),
            'per_prof'   => trim($request->input('per_prof', '')),
            'per_telf'   => trim($request->input('per_telf', '')),
            'per_cel'    => trim($request->input('per_cel')),
            'per_email'  => trim($request->input('per_email', '')),
            'per_dir'    => trim($request->input('per_dir', '')),
            'per_fnac'   => $request->input('per_fnac') ?: null,
            'per_lnac'   => trim($request->input('per_lnac', '')),
            'per_est'    => true,
            'per_foto'   => $fotoPath,
            'per_create' => now(),
            'per_update' => now(),
        ]);

        return redirect()->route('agenda.index');
    }

    /**
     * Actualiza la foto de una persona existente.
     *
     * Inertia intercepta el redirect() y lo convierte en una visita AJAX:
     * el cliente recibe el JSON actualizado sin recargar toda la página.
     */
    public function update(Request $request, string $per_cod)
    {
        $request->validate([
            'per_foto' => 'required|image|max:4096',
        ]);

        $fotoPath = $this->subirFoto($request->file('per_foto'), trim($per_cod));

        DB::table('persona')
            ->where('per_cod', 'like', '%' . trim($per_cod) . '%')
            ->update([
                'per_foto'   => $fotoPath,
                'per_update' => now(),
            ]);

        return redirect()->route('agenda.index');
    }

    /**
     * Sube la foto al servidor FTP de tecnoweb con el mismo formato que
     * el sistema PHP: {per_cod}_{timestamp}.{ext}
     * Devuelve solo el nombre de archivo (compatible con ambos sistemas).
     * Si FTP falla, guarda en storage local y devuelve la URL completa.
     */
    private function subirFoto($archivo, string $perCod): string
    {
        $ext    = $archivo->getClientOriginalExtension();
        $nombre = $perCod . '_' . time() . '.' . $ext;

        try {
            $ftpHost = config('filesystems.disks.ftp_tecnoweb.host', '');
            if ($ftpHost) {
                Storage::disk('ftp_tecnoweb')->put($nombre, file_get_contents($archivo));
                return $nombre;
            }
        } catch (\Throwable $e) {
            // FTP no disponible o ext-ftp no cargada → fallback a storage local.
            // \Throwable captura tanto Exception como Error (p.ej. FTP_BINARY undefined).
        }

        $stored = $archivo->store('fotos', 'public');
        return Storage::url($stored);
    }
}
