<?php

namespace App\Http\Controllers\Api;

use App\Models\Absence;
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
            'fecha_inicio' => 'required|date',
            'fecha_fin' => 'required|date|after_or_equal:fecha_inicio',
        ]);

        $validated['estado'] = 'Borrador';

        $absence = Absence::create($validated);
        $absence->load('employee');

        return response()->json($absence, 201);
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
            'fecha_inicio' => 'sometimes|date',
            'fecha_fin' => 'sometimes|date|after_or_equal:fecha_inicio',
        ]);

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
}
