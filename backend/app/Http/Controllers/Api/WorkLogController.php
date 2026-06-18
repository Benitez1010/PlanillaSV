<?php

namespace App\Http\Controllers\Api;

use App\Models\WorkLog;
use Illuminate\Http\Request;
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
            'employee_id' => 'sometimes|exists:employees,id',
            'periodo' => 'sometimes|string|max:7',
            'hora_normal_diurna' => 'sometimes|numeric|min:0',
            'hora_normal_nocturna' => 'sometimes|numeric|min:0',
            'extra_diurna' => 'sometimes|numeric|min:0',
            'extra_nocturna' => 'sometimes|numeric|min:0',
        ]);

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
}
