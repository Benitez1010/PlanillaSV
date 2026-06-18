<?php

namespace App\Http\Controllers\Api;

use App\Models\Absence;
use App\Models\WorkLog;
use Illuminate\Http\Request;
use App\Http\Controllers\Controller;

class AbsenceController extends Controller
{
    public function index(Request $request)
    {
        $query = Absence::with('employee');

        if ($request->employee_id) {
            $query->where('employee_id', $request->employee_id);
        }

        if ($request->tipo) {
            $query->where('tipo', $request->tipo);
        }

        if ($request->estado) {
            $query->where('estado', $request->estado);
        }

        if ($request->periodo) {
            $query->where(function ($q) use ($request) {
                $q->where('fecha_inicio', 'like', $request->periodo . '%')
                  ->orWhere('fecha_fin', 'like', $request->periodo . '%');
            });
        }

        if ($request->search) {
            $search = $request->search;
            $query->whereHas('employee', function ($q) use ($search) {
                $q->where('nombres', 'like', "%{$search}%")
                  ->orWhere('apellidos', 'like', "%{$search}%");
            });
        }

        return response()->json($query->orderByDesc('created_at')->get());
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'employee_id' => 'required|exists:employees,id',
            'tipo' => 'required|in:Injustificada,Permiso sin goce de sueldo,Incapacidad ISSS',
            'dias' => 'required|array|min:1',
            'dias.*' => 'required|date',
        ]);

        $this->validarDiasLaborables($validated['dias']);
        $this->validarSinDuplicados($validated['employee_id'], $validated['dias']);
        $this->validarSinHorasAprobadas($validated['employee_id'], $validated['dias']);

        $fechas = collect($validated['dias'])->map(fn ($d) => \Carbon\Carbon::parse($d));
        $validated['fecha_inicio'] = $fechas->min()->format('Y-m-d');
        $validated['fecha_fin'] = $fechas->max()->format('Y-m-d');
        $validated['estado'] = 'Borrador';

        $absence = Absence::create($validated);
        $absence->load('employee');

        $warning = $this->advertenciaHorasPendientes($validated['employee_id'], $validated['dias']);

        $response = $absence->toArray();
        if ($warning) {
            $response['warning'] = $warning;
        }

        return response()->json($response, 201);
    }

    public function show(Absence $absence)
    {
        $absence->load('employee');
        return response()->json($absence);
    }

    public function update(Request $request, Absence $absence)
    {
        if ($absence->estado === 'Aprobada') {
            return response()->json(['error' => 'No puedes editar ausencias ya aprobadas.'], 400);
        }

        $validated = $request->validate([
            'employee_id' => 'sometimes|exists:employees,id',
            'tipo' => 'sometimes|in:Injustificada,Permiso sin goce de sueldo,Incapacidad ISSS',
            'dias' => 'sometimes|array|min:1',
            'dias.*' => 'required_with:dias|date',
        ]);

        if (isset($validated['dias'])) {
            $this->validarDiasLaborables($validated['dias']);
            $this->validarSinDuplicados($validated['employee_id'] ?? $absence->employee_id, $validated['dias'], $absence->id);
            $this->validarSinHorasAprobadas($validated['employee_id'] ?? $absence->employee_id, $validated['dias']);
            $fechas = collect($validated['dias'])->map(fn ($d) => \Carbon\Carbon::parse($d));
            $validated['fecha_inicio'] = $fechas->min()->format('Y-m-d');
            $validated['fecha_fin'] = $fechas->max()->format('Y-m-d');
        }

        $absence->update($validated);
        $absence->load('employee');

        return response()->json($absence);
    }

    public function destroy(Absence $absence)
    {
        if ($absence->estado === 'Aprobada') {
            return response()->json(['error' => 'No puedes eliminar ausencias ya aprobadas.'], 400);
        }

        $absence->delete();
        return response()->json(null, 204);
    }

    public function approve(Absence $absence)
    {
        if ($absence->estado === 'Aprobada') {
            return response()->json(['error' => 'Esta ausencia ya está aprobada.'], 400);
        }

        $absence->update(['estado' => 'Aprobada']);
        $absence->load('employee');

        return response()->json($absence);
    }

    private function validarDiasLaborables(array $dias): void
    {
        $diasSemana = collect($dias)->map(fn ($d) => \Carbon\Carbon::parse($d)->dayOfWeek);
        if ($diasSemana->contains(function (int $dow) {
            return $dow === 0 || $dow === 6;
        })) {
            abort(422, 'No se pueden seleccionar sábados ni domingos.');
        }
    }

    private function validarSinDuplicados(int $employeeId, array $dias, ?int $excludeId = null): void
    {
        $query = Absence::where('employee_id', $employeeId);
        if ($excludeId) {
            $query->where('id', '!=', $excludeId);
        }

        $existentes = $query->get();

        foreach ($dias as $fecha) {
            foreach ($existentes as $existente) {
                $fechasExistente = $existente->dias ?? [$existente->fecha_inicio, $existente->fecha_fin];
                if (in_array($fecha, $fechasExistente)) {
                    abort(422, "El empleado ya tiene una ausencia registrada el día {$fecha}.");
                }
            }
        }
    }

    private function validarSinHorasAprobadas(int $employeeId, array $dias): void
    {
        $periodos = collect($dias)
            ->map(fn ($d) => substr($d, 0, 7))
            ->unique();

        foreach ($periodos as $periodo) {
            $tieneHoras = WorkLog::aprobados()
                ->porEmpleado($employeeId)
                ->porPeriodo($periodo)
                ->exists();

            if ($tieneHoras) {
                abort(422, "El empleado ya tiene horas aprobadas en {$periodo}. No puedes registrar ausencias en un período con horas ya liquidadas.");
            }
        }
    }

    private function advertenciaHorasPendientes(int $employeeId, array $dias): ?string
    {
        $periodos = collect($dias)
            ->map(fn ($d) => substr($d, 0, 7))
            ->unique();

        foreach ($periodos as $periodo) {
            $tienePendientes = WorkLog::borrador()
                ->porEmpleado($employeeId)
                ->porPeriodo($periodo)
                ->exists();

            if ($tienePendientes) {
                return "Este empleado tiene horas pendientes por aprobar en {$periodo}. Recuerda aprobarlas antes de generar planilla.";
            }
        }

        return null;
    }
}
