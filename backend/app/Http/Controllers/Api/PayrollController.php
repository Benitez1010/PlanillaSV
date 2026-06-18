<?php

namespace App\Http\Controllers\Api;

use App\Models\Employee;
use App\Models\Payroll;
use App\Models\PayrollDetail;
use App\Models\WorkLog;
use App\Services\PayrollCalculator;
use Illuminate\Http\Request;
use App\Http\Controllers\Controller;

class PayrollController extends Controller
{
    public function __construct(
        protected PayrollCalculator $calculator
    ) {}

    public function index(Request $request)
    {
        $query = Payroll::with('details.employee');

        if ($request->estado) {
            $query->where('estado', $request->estado);
        }

        if ($request->search) {
            $query->where('periodo', 'like', "%{$request->search}%");
        }

        return response()->json($query->orderByDesc('periodo')->get());
    }

    public function show(Payroll $payroll)
    {
        $payroll->load('details.employee');
        return response()->json($payroll);
    }

    public function generate(Request $request)
    {
        $validated = $request->validate([
            'periodo' => 'required|string|max:7',
            'vacaciones_ids' => 'sometimes|array',
            'vacaciones_ids.*' => 'integer|exists:employees,id',
        ]);

        $periodo = $validated['periodo'];
        $vacacionesIds = $validated['vacaciones_ids'] ?? [];

        if (Payroll::where('periodo', $periodo)->exists()) {
            return response()->json([
                'error' => 'Ya existe una planilla para este período.',
            ], 400);
        }

        $employees = Employee::where('estado', 'activo')
            ->whereDate('fecha_ingreso', '<=', "{$periodo}-01")
            ->get();

        if ($employees->isEmpty()) {
            return response()->json([
                'error' => 'No hay empleados activos.',
            ], 400);
        }

        $totalBruto = 0;
        $totalISSS = 0;
        $totalAFP = 0;
        $totalISR = 0;
        $totalDescuentos = 0;
        $totalNeto = 0;
        $detalles = [];

        foreach ($employees as $employee) {
            $aplicarVac = in_array($employee->id, $vacacionesIds);
            $horas = $this->getHorasAprobadas($employee->id, $periodo);
            $ausencias = $this->calculator->calcularAusencias($employee, $periodo);
            $calc = $this->calculator->calcularEmpleado($employee, $periodo, $aplicarVac, $horas, $ausencias);

            $detalles[] = [
                'employee_id' => $employee->id,
                'salario_base' => $calc['salario_base'],
                'isss' => $calc['isss'],
                'afp' => $calc['afp'],
                'isr' => $calc['isr'],
                'renta_gravable' => $calc['renta_gravable'],
                'total_descuentos' => $calc['total_descuentos'],
                'neto' => $calc['neto'],
                'bono_quincena25' => $calc['bono_quincena25'],
                'aguinaldo' => $calc['aguinaldo'],
                'dias_vacaciones' => $calc['dias_vacaciones'],
                'prima_vacacional' => $calc['prima_vacacional'],
                'pago_vacaciones' => $calc['pago_vacaciones'],
                'bono_total' => $calc['bono_total'],
                'horas_normales_diurnas' => $horas['hora_normal_diurna'],
                'horas_normales_nocturnas' => $horas['hora_normal_nocturna'],
                'horas_extra_diurnas' => $horas['extra_diurna'],
                'horas_extra_nocturnas' => $horas['extra_nocturna'],
                'pago_horas_normales' => $calc['pago_horas_normales'],
                'pago_horas_extras' => $calc['pago_horas_extras'],
                'descuento_ausencias' => $calc['descuento_ausencias'],
                'subsidio_incapacidad' => $calc['subsidio_incapacidad'],
            ];

            $totalBruto += $calc['salario_base'] + $calc['bono_total'] + $calc['pago_vacaciones'] + $calc['pago_horas_normales'] + $calc['pago_horas_extras'] + $calc['subsidio_incapacidad'];
            $totalBruto -= $calc['descuento_ausencias'];
            $totalISSS += $calc['isss'];
            $totalAFP += $calc['afp'];
            $totalISR += $calc['isr'];
            $totalDescuentos += $calc['total_descuentos'];
            $totalNeto += $calc['neto'];

            if ($aplicarVac) {
                $employee->update([
                    'aplicar_vacaciones' => false,
                    'ultimas_vacaciones' => now(),
                ]);
            }
        }

        $payroll = Payroll::create([
            'periodo' => $periodo,
            'estado' => 'Borrador',
            'fecha_generacion' => now(),
            'total_bruto' => $totalBruto,
            'total_isss' => $totalISSS,
            'total_afp' => $totalAFP,
            'total_isr' => $totalISR,
            'total_descuentos' => $totalDescuentos,
            'total_neto' => $totalNeto,
        ]);

        foreach ($detalles as $detalle) {
            $detalle['payroll_id'] = $payroll->id;
            PayrollDetail::create($detalle);
        }

        $payroll->load('details.employee');

        return response()->json($payroll, 201);
    }

    public function close(Payroll $payroll)
    {
        if ($payroll->isCerrada()) {
            return response()->json(['error' => 'La planilla ya está cerrada.'], 400);
        }

        $payroll->update(['estado' => 'Cerrada']);
        return response()->json($payroll);
    }

    public function discard(Payroll $payroll)
    {
        if (!$payroll->isBorrador()) {
            return response()->json(['error' => 'Solo puedes descartar planillas en Borrador.'], 400);
        }

        $payroll->details()->delete();
        $payroll->delete();

        return response()->json(null, 204);
    }

    public function refresh(Request $request, Payroll $payroll)
    {
        if (!$payroll->isBorrador()) {
            return response()->json(['error' => 'Solo puedes refrescar planillas en Borrador.'], 400);
        }

        $validated = $request->validate([
            'vacaciones_ids' => 'sometimes|array',
            'vacaciones_ids.*' => 'integer|exists:employees,id',
        ]);

        $vacacionesIds = $validated['vacaciones_ids'] ?? [];
        $periodo = $payroll->periodo;
        $employees = Employee::where('estado', 'activo')
            ->whereDate('fecha_ingreso', '<=', "{$periodo}-01")
            ->get();

        $payroll->details()->delete();

        $totalBruto = 0;
        $totalISSS = 0;
        $totalAFP = 0;
        $totalISR = 0;
        $totalDescuentos = 0;
        $totalNeto = 0;

        foreach ($employees as $employee) {
            $aplicarVac = in_array($employee->id, $vacacionesIds);
            $horas = $this->getHorasAprobadas($employee->id, $periodo);
            $ausencias = $this->calculator->calcularAusencias($employee, $periodo);
            $calc = $this->calculator->calcularEmpleado($employee, $periodo, $aplicarVac, $horas, $ausencias);

            PayrollDetail::create([
                'payroll_id' => $payroll->id,
                'employee_id' => $employee->id,
                'salario_base' => $calc['salario_base'],
                'isss' => $calc['isss'],
                'afp' => $calc['afp'],
                'isr' => $calc['isr'],
                'renta_gravable' => $calc['renta_gravable'],
                'total_descuentos' => $calc['total_descuentos'],
                'neto' => $calc['neto'],
                'bono_quincena25' => $calc['bono_quincena25'],
                'aguinaldo' => $calc['aguinaldo'],
                'dias_vacaciones' => $calc['dias_vacaciones'],
                'prima_vacacional' => $calc['prima_vacacional'],
                'pago_vacaciones' => $calc['pago_vacaciones'],
                'bono_total' => $calc['bono_total'],
                'horas_normales_diurnas' => $horas['hora_normal_diurna'],
                'horas_normales_nocturnas' => $horas['hora_normal_nocturna'],
                'horas_extra_diurnas' => $horas['extra_diurna'],
                'horas_extra_nocturnas' => $horas['extra_nocturna'],
                'pago_horas_normales' => $calc['pago_horas_normales'],
                'pago_horas_extras' => $calc['pago_horas_extras'],
                'descuento_ausencias' => $calc['descuento_ausencias'],
                'subsidio_incapacidad' => $calc['subsidio_incapacidad'],
            ]);

            $totalBruto += $calc['salario_base'] + $calc['bono_total'] + $calc['pago_vacaciones'] + $calc['pago_horas_normales'] + $calc['pago_horas_extras'] + $calc['subsidio_incapacidad'];
            $totalBruto -= $calc['descuento_ausencias'];
            $totalISSS += $calc['isss'];
            $totalAFP += $calc['afp'];
            $totalISR += $calc['isr'];
            $totalDescuentos += $calc['total_descuentos'];
            $totalNeto += $calc['neto'];
        }

        $payroll->update([
            'total_bruto' => $totalBruto,
            'total_isss' => $totalISSS,
            'total_afp' => $totalAFP,
            'total_isr' => $totalISR,
            'total_descuentos' => $totalDescuentos,
            'total_neto' => $totalNeto,
        ]);

        $payroll->load('details.employee');

        return response()->json($payroll);
    }

    public function receipt(Request $request, Payroll $payroll, Employee $employee)
    {
        $detail = $payroll->details()->where('employee_id', $employee->id)->with('employee')->firstOrFail();

        $pdf = \Barryvdh\DomPDF\Facade\Pdf::loadView('pdf.receipt', [
            'payroll' => $payroll,
            'detail' => $detail,
        ]);

        $filename = "boleta_{$employee->nombres}_{$employee->apellidos}_{$payroll->periodo}.pdf";

        if ($request->query('download') === 'inline') {
            return $pdf->stream($filename);
        }

        return $pdf->download($filename);
    }

    private function getHorasAprobadas(int $employeeId, string $periodo): array
    {
        $workLogs = WorkLog::aprobados()
            ->porEmpleado($employeeId)
            ->porPeriodo($periodo)
            ->get();

        return [
            'hora_normal_diurna' => $workLogs->sum('hora_normal_diurna'),
            'hora_normal_nocturna' => $workLogs->sum('hora_normal_nocturna'),
            'extra_diurna' => $workLogs->sum('extra_diurna'),
            'extra_nocturna' => $workLogs->sum('extra_nocturna'),
        ];
    }
}
