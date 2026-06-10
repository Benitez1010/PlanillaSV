<?php

namespace App\Http\Controllers\Api;

use App\Models\Employee;
use App\Models\Payroll;
use App\Http\Controllers\Controller;

class DashboardController extends Controller
{
    public function stats()
    {
        $activeEmployees = Employee::where('estado', 'activo')->count();
        $totalEmployees = Employee::count();
        $totalPayrolls = Payroll::count();
        $latestPayrolls = Payroll::with('details.employee')
            ->orderByDesc('periodo')
            ->limit(5)
            ->get();

        return response()->json([
            'active_employees' => $activeEmployees,
            'total_employees' => $totalEmployees,
            'total_payrolls' => $totalPayrolls,
            'latest_payrolls' => $latestPayrolls,
        ]);
    }
}
