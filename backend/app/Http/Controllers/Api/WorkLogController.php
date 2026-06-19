<?php

namespace App\Http\Controllers\Api;

use App\Models\Absence;
use App\Models\Employee;
use App\Models\WorkLog;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use App\Http\Controllers\Controller;

class WorkLogController extends Controller
{
    public function index(Request $request)
    {
        $query = WorkLog::with('employee');

        if ($request->employee_id) {
            $query->where('employee_id', $request->employee_id);
        }

        if ($request->estado) {
            $query->where('estado', $request->estado);
        }

        if ($request->periodo) {
            $query->where('periodo', $request->periodo);
        }

        if ($request->search) {
            $search = $request->search;
            $query->whereHas('employee', function ($q) use ($search) {
                $q->where('nombres', 'like', "%{$search}%")
                  ->orWhere('apellidos', 'like', "%{$search}%");
            });
        }

        return response()->json($query->orderByDesc('periodo')->get());
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'employee_id' => 'required|exists:employees,id|unique:work_logs,employee_id,NULL,id,periodo,' . $request->periodo,
            'periodo' => 'required|string|max:7',
            'hora_normal_diurna' => 'sometimes|numeric|min:0',
            'hora_normal_nocturna' => 'sometimes|numeric|min:0',
            'extra_diurna' => 'sometimes|numeric|min:0',
            'extra_nocturna' => 'sometimes|numeric|min:0',
        ]);

        $diurna = (float) ($validated['hora_normal_diurna'] ?? 0);
        $nocturna = (float) ($validated['hora_normal_nocturna'] ?? 0);
        if ($diurna + $nocturna > 240) {
            return response()->json(['error' => 'La suma de horas normales (diurna + nocturna) no puede exceder 240.'], 400);
        }

        $validated['estado'] = 'Borrador';

        $workLog = WorkLog::create($validated);
        $workLog->load('employee');

        return response()->json($workLog, 201);
    }

    public function show(WorkLog $workLog)
    {
        $workLog->load('employee');
        return response()->json($workLog);
    }

    public function update(Request $request, WorkLog $workLog)
    {
        if ($workLog->estado === 'Aprobado') {
            return response()->json(['error' => 'No puedes editar horas ya aprobadas.'], 400);
        }

        $validated = $request->validate([
            'employee_id' => [
                'sometimes', 'exists:employees,id',
                Rule::unique('work_logs')->where(fn ($q) =>
                    $q->where('periodo', $request->periodo ?? $workLog->periodo)
                )->ignore($workLog->id),
            ],
            'periodo' => 'sometimes|string|max:7',
            'hora_normal_diurna' => 'sometimes|numeric|min:0',
            'hora_normal_nocturna' => 'sometimes|numeric|min:0',
            'extra_diurna' => 'sometimes|numeric|min:0',
            'extra_nocturna' => 'sometimes|numeric|min:0',
        ]);

        $diurna = (float) ($validated['hora_normal_diurna'] ?? $workLog->hora_normal_diurna);
        $nocturna = (float) ($validated['hora_normal_nocturna'] ?? $workLog->hora_normal_nocturna);
        if ($diurna + $nocturna > 240) {
            return response()->json(['error' => 'La suma de horas normales (diurna + nocturna) no puede exceder 240.'], 400);
        }

        $workLog->update($validated);
        $workLog->load('employee');

        return response()->json($workLog);
    }

    public function destroy(WorkLog $workLog)
    {
        if ($workLog->estado === 'Aprobado') {
            return response()->json(['error' => 'No puedes eliminar horas ya aprobadas.'], 400);
        }

        $workLog->delete();
        return response()->json(null, 204);
    }

    public function approve(WorkLog $workLog)
    {
        if ($workLog->estado === 'Aprobado') {
            return response()->json(['error' => 'Este registro ya está aprobado.'], 400);
        }

        $workLog->update([
            'estado' => 'Aprobado',
            'fecha_aprobacion' => now(),
        ]);

        $workLog->load('employee');

        return response()->json($workLog);
    }

    public function bulkStore(Request $request)
    {
        $request->validate(['periodo' => 'required|string|max:7']);
        $periodo = $request->periodo;
        $employees = Employee::where('estado', 'activo')->get();
        $created = [];
        $skipped = [];

        foreach ($employees as $emp) {
            $exists = WorkLog::porEmpleado($emp->id)->porPeriodo($periodo)->exists();
            if ($exists) {
                $skipped[] = ['id' => $emp->id, 'nombres' => $emp->nombres, 'apellidos' => $emp->apellidos];
                continue;
            }

            $absenceDays = Absence::aprobados()->porEmpleado($emp->id)
                ->where('fecha_inicio', '<=', "{$periodo}-31")
                ->where('fecha_fin', '>=', "{$periodo}-01")
                ->get()
                ->sum(fn ($a) => count($a->dias ?? []));

            $suggestedDiurna = max(0, 240 - $absenceDays * 8);

            $wl = WorkLog::create([
                'employee_id' => $emp->id,
                'periodo' => $periodo,
                'hora_normal_diurna' => $suggestedDiurna,
                'hora_normal_nocturna' => 0,
                'extra_diurna' => 0,
                'extra_nocturna' => 0,
                'estado' => 'Borrador',
            ]);
            $wl->load('employee');
            $created[] = $wl;
        }

        return response()->json([
            'created' => $created,
            'skipped' => $skipped,
            'total_created' => count($created),
            'total_skipped' => count($skipped),
        ], 201);
    }

    public function approveAll(Request $request)
    {
        $query = WorkLog::borrador();
        if ($request->periodo) {
            $query->porPeriodo($request->periodo);
        }

        $count = $query->count();
        $query->update([
            'estado' => 'Aprobado',
            'fecha_aprobacion' => now(),
        ]);

        return response()->json(['aprobados' => $count]);
    }

    public function discardAll(Request $request)
    {
        $query = WorkLog::borrador();
        if ($request->periodo) {
            $query->porPeriodo($request->periodo);
        }

        $count = $query->count();
        $query->delete();

        return response()->json(['descartados' => $count]);
    }

    public function template()
    {
        $employees = Employee::where('estado', 'activo')->orderBy('apellidos')->get();

        $callback = function () use ($employees) {
            $f = fopen('php://output', 'w');
            // UTF-8 BOM para que Excel reconozca acentos
            fwrite($f, "\xEF\xBB\xBF");
            // Encabezados en español
            fputcsv($f, ['ID Empleado', 'Nombres', 'Apellidos', 'Periodo (YYYY-MM)', 'Horas Normales Diurnas', 'Horas Normales Nocturnas', 'Horas Extra Diurnas', 'Horas Extra Nocturnas'], ';');
            foreach ($employees as $emp) {
                fputcsv($f, [$emp->id, $emp->nombres, $emp->apellidos, '', 240, 0, 0, 0], ';');
            }
            fclose($f);
        };

        return response()->stream($callback, 200, [
            'Content-Type' => 'text/csv; charset=UTF-8',
            'Content-Disposition' => 'attachment; filename="plantilla_horas.csv"',
        ]);
    }

    public function import(Request $request)
    {
        $request->validate(['file' => 'required|file|mimes:csv,txt,xlsx,xls']);

        $file = $request->file('file');
        $ext = strtolower($file->getClientOriginalExtension());

        if (in_array($ext, ['xlsx', 'xls'])) {
            $rows = $this->parseXlsx($file->getRealPath());
        } else {
            $rows = $this->parseCsv($file->getRealPath());
        }

        if (count($rows) < 2) {
            return response()->json(['error' => 'El archivo debe contener encabezados y al menos una fila de datos.'], 400);
        }

        $header = array_shift($rows);
        $header = array_map('trim', $header);

        $map = [
            'id empleado' => 'employee_id',
            'nombres' => 'nombres',
            'apellidos' => 'apellidos',
            'periodo (yyyy-mm)' => 'periodo',
            'periodo' => 'periodo',
            'horas normales diurnas' => 'hora_normal_diurna',
            'horas normales nocturnas' => 'hora_normal_nocturna',
            'horas extra diurnas' => 'extra_diurna',
            'horas extra nocturnas' => 'extra_nocturna',
        ];

        $fields = [];
        foreach ($header as $h) {
            $key = strtolower(trim($h));
            $fields[] = $map[$key] ?? null;
        }

        $created = 0;
        $errors = [];

        foreach ($rows as $index => $row) {
            $data = array_combine($fields, $row);

            $empId = (int) ($data['employee_id'] ?? 0);
            $emp = $empId ? Employee::find($empId) : null;
            if (!$emp) {
                $errors[] = "Fila " . ($index + 2) . ": Empleado ID {$empId} no encontrado";
                continue;
            }

            $periodo = $data['periodo'] ?? '';
            if (!preg_match('/^\d{4}-\d{2}$/', $periodo)) {
                $errors[] = "Fila " . ($index + 2) . ": Periodo invalido '{$periodo}' (use YYYY-MM)";
                continue;
            }

            $dup = WorkLog::porEmpleado($empId)->porPeriodo($periodo)->exists();
            if ($dup) {
                $errors[] = "Fila " . ($index + 2) . ": {$emp->nombres} {$emp->apellidos} ya tiene registro en {$periodo}";
                continue;
            }

            $diurna = max(0, (float) str_replace(',', '.', $data['hora_normal_diurna'] ?? 0));
            $nocturna = max(0, (float) str_replace(',', '.', $data['hora_normal_nocturna'] ?? 0));
            if ($diurna + $nocturna > 240) {
                $errors[] = "Fila " . ($index + 2) . ": Suma de horas normales excede 240";
                continue;
            }

            WorkLog::create([
                'employee_id' => $empId,
                'periodo' => $periodo,
                'hora_normal_diurna' => $diurna,
                'hora_normal_nocturna' => $nocturna,
                'extra_diurna' => max(0, (float) str_replace(',', '.', $data['extra_diurna'] ?? 0)),
                'extra_nocturna' => max(0, (float) str_replace(',', '.', $data['extra_nocturna'] ?? 0)),
                'estado' => 'Borrador',
            ]);

            $created++;
        }

        return response()->json([
            'created' => $created,
            'errors' => $errors,
        ]);
    }

    private function parseCsv(string $path): array
    {
        $content = file_get_contents($path);

        if (substr($content, 0, 3) === "\xEF\xBB\xBF") {
            $content = substr($content, 3);
        }

        $lines = explode("\n", $content);
        $lines = array_filter($lines, fn ($l) => trim($l) !== '');
        $lines = array_values($lines);

        if (empty($lines)) return [];

        $delimiter = ';';
        if (count(str_getcsv($lines[0] ?? '', ';')) < 2) {
            $delimiter = ',';
        }

        return array_map(fn ($line) => array_map('trim', str_getcsv($line, $delimiter)), $lines);
    }

    private function parseXlsx(string $path): array
    {
        $zip = new \ZipArchive();
        if ($zip->open($path) !== true) {
            return [];
        }

        $sharedStrings = [];
        $ssContent = $zip->getFromName('xl/sharedStrings.xml');
        if ($ssContent !== false) {
            $ssXml = new \DOMDocument();
            $ssXml->loadXML($ssContent);
            $xpath = new \DOMXPath($ssXml);
            $xpath->registerNamespace('s', 'http://schemas.openxmlformats.org/spreadsheetml/2006/main');
            foreach ($xpath->query('//s:si/s:t') as $t) {
                $sharedStrings[] = $t->textContent;
            }
        }

        $sheetContent = $zip->getFromName('xl/worksheets/sheet1.xml');
        $zip->close();

        if ($sheetContent === false) return [];

        $doc = new \DOMDocument();
        $doc->loadXML($sheetContent);
        $xpath = new \DOMXPath($doc);
        $xpath->registerNamespace('s', 'http://schemas.openxmlformats.org/spreadsheetml/2006/main');

        $rows = [];
        foreach ($xpath->query('//s:sheetData/s:row') as $rowNode) {
            $cellMap = [];
            foreach ($xpath->query('s:c', $rowNode) as $cell) {
                $ref = $cell->getAttribute('r');
                $col = preg_replace('/\d+/', '', $ref);
                $type = $cell->getAttribute('t');
                $vNode = $xpath->query('s:v', $cell)->item(0);
                $value = $vNode ? $vNode->textContent : '';

                if ($type === 's' && $value !== '') {
                    $idx = (int) $value;
                    $cellMap[$col] = $sharedStrings[$idx] ?? '';
                } elseif ($type === 'inlineStr') {
                    $tNode = $xpath->query('s:is/s:t', $cell)->item(0);
                    $cellMap[$col] = $tNode ? $tNode->textContent : '';
                } else {
                    $cellMap[$col] = $value;
                }
            }

            $cells = [];
            foreach (range('A', 'Z') as $letter) {
                if (array_key_exists($letter, $cellMap)) {
                    $cells[] = $cellMap[$letter];
                } else {
                    break;
                }
            }
            if (!empty($cells)) {
                $rows[] = $cells;
            }
        }

        return $rows;
    }
}
