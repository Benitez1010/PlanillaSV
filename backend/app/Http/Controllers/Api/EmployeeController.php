<?php

namespace App\Http\Controllers\Api;

use App\Models\Employee;
use App\Models\PayrollDetail;
use Illuminate\Http\Request;
use App\Http\Controllers\Controller;
use App\Http\Requests\StoreEmployeeRequest;

class EmployeeController extends Controller
{
    public function index(Request $request)
    {
        $query = Employee::orderBy('apellidos');

        if ($request->search) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('nombres', 'like', "%{$search}%")
                  ->orWhere('apellidos', 'like', "%{$search}%");
            });
        }

        if ($request->estado) {
            $query->where('estado', $request->estado);
        }

        return response()->json($query->get());
    }

    public function store(StoreEmployeeRequest $request)
    {
        $employee = Employee::create($request->validated());
        return response()->json($employee, 201);
    }

    public function show(Employee $employee)
    {
        return response()->json($employee);
    }

    public function update(StoreEmployeeRequest $request, Employee $employee)
    {
        $data = $request->validated();
        if (isset($data['aplicar_vacaciones'])) {
            $data['aplicar_vacaciones'] = in_array($data['aplicar_vacaciones'], ['1', 1, true], true);
        }
        $employee->update($data);
        return response()->json($employee);
    }

    public function destroy(Employee $employee)
    {
        $inPayroll = PayrollDetail::where('employee_id', $employee->id)
            ->whereHas('payroll', function ($q) {
                $q->where('estado', 'Cerrada');
            })->exists();

        if ($inPayroll) {
            return response()->json([
                'error' => 'No puedes eliminar un empleado que ya tiene registros en planillas cerradas.',
            ], 400);
        }

        $employee->delete();
        return response()->json(null, 204);
    }

    public function eligibleForVacation(Employee $employee)
    {
        $now = now();
        $ingreso = $employee->fecha_ingreso;

        $isAnniversary = $ingreso->month === $now->month && $ingreso->year < $now->year;

        return response()->json([
            'eligible' => $isAnniversary && !$employee->aplicar_vacaciones,
        ]);
    }
}
