<?php

namespace App\Http\Controllers\Api;

use App\Models\Absence;
use App\Models\Employee;
use App\Models\Payroll;
use App\Models\WorkLog;
use App\Http\Controllers\Controller;

class DashboardController extends Controller
{
    public function stats()
    {
        $activeEmployees = Employee::where('estado', 'activo')->count();
        $totalEmployees = Employee::count();
        $totalPayrolls = Payroll::count();
        $payrollsThisYear = Payroll::where('periodo', 'like', date('Y') . '-%')->count();
        $pendingWorkLogs = WorkLog::where('estado', 'Borrador')->count();
        $pendingAbsences = Absence::where('estado', 'Borrador')->count();
        $latestPayrolls = Payroll::with('details.employee')
            ->orderByDesc('periodo')
            ->limit(5)
            ->get();

        return response()->json([
            'active_employees' => $activeEmployees,
            'total_employees' => $totalEmployees,
            'inactive_employees' => $totalEmployees - $activeEmployees,
            'total_payrolls' => $totalPayrolls,
            'payrolls_this_year' => $payrollsThisYear,
            'pending_work_logs' => $pendingWorkLogs,
            'pending_absences' => $pendingAbsences,
            'latest_payrolls' => $latestPayrolls,
        ]);
    }
}
