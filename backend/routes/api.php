<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\EmployeeController;
use App\Http\Controllers\Api\WorkLogController;
use App\Http\Controllers\Api\PayrollController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\AbsenceController;

// Public routes
Route::post('/login', [AuthController::class, 'login']);

// Protected routes
Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/me', [AuthController::class, 'me']);

    Route::get('/dashboard/stats', [DashboardController::class, 'stats']);

    Route::apiResource('employees', EmployeeController::class);
    Route::get('employees/{employee}/eligible-vacation', [EmployeeController::class, 'eligibleForVacation']);

    Route::apiResource('work-logs', WorkLogController::class);
    Route::patch('work-logs/{work_log}/approve', [WorkLogController::class, 'approve']);

    Route::get('payrolls', [PayrollController::class, 'index']);
    Route::get('payrolls/{payroll}', [PayrollController::class, 'show']);
    Route::post('payrolls/generate', [PayrollController::class, 'generate']);
    Route::patch('payrolls/{payroll}/close', [PayrollController::class, 'close']);
    Route::delete('payrolls/{payroll}/discard', [PayrollController::class, 'discard']);
    Route::post('payrolls/{payroll}/refresh', [PayrollController::class, 'refresh']);
    Route::get('payrolls/{payroll}/receipt/{employee}', [PayrollController::class, 'receipt']);

    Route::apiResource('absences', AbsenceController::class);
    Route::patch('absences/{absence}/approve', [AbsenceController::class, 'approve']);
});
