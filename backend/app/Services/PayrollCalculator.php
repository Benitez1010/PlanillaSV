<?php

namespace App\Services;

use App\Models\Employee;
use Carbon\Carbon;

class PayrollCalculator
{
    const ISSS_TASA = 0.03;
    const ISSS_BASE_MAX = 1000.00;
    const ISSS_TOPE = 30.00;

    const AFP_TASA = 0.0725;

    const ISR_TRAMOS = [
        ['desde' => 0.01,  'hasta' => 550.00,   'tasa' => 0,    'cuota_fija' => 0,     'exceso' => 0],
        ['desde' => 550.01, 'hasta' => 895.24,  'tasa' => 0.10, 'cuota_fija' => 17.67, 'exceso' => 550.00],
        ['desde' => 895.25, 'hasta' => 2038.10, 'tasa' => 0.20, 'cuota_fija' => 60.00, 'exceso' => 895.24],
        ['desde' => 2038.11, 'hasta' => INF,     'tasa' => 0.30, 'cuota_fija' => 288.57, 'exceso' => 2038.10],
    ];

    public function calcularISSS(float $salario): float
    {
        $base = min($salario, self::ISSS_BASE_MAX);
        return round(min($base * self::ISSS_TASA, self::ISSS_TOPE), 2);
    }

    public function calcularAFP(float $salario): float
    {
        return round($salario * self::AFP_TASA, 2);
    }

    public function calcularISR(float $rentaGravable): float
    {
        if ($rentaGravable <= 0) return 0;

        foreach (self::ISR_TRAMOS as $tramo) {
            if ($rentaGravable >= $tramo['desde'] && $rentaGravable <= $tramo['hasta']) {
                return round(($rentaGravable - $tramo['exceso']) * $tramo['tasa'] + $tramo['cuota_fija'], 2);
            }
        }

        $ultimo = self::ISR_TRAMOS[3];
        return round(($rentaGravable - $ultimo['exceso']) * $ultimo['tasa'] + $ultimo['cuota_fija'], 2);
    }

    public function calcularBonoQuincena25(float $salario, string $periodo, bool $forzar = false): float
    {
        if (!$forzar) {
            $mes = (int) substr($periodo, 5, 2);
            if ($mes !== 1) return 0;
        }
        if ($salario <= 1500) {
            return round($salario * 0.50, 2);
        }
        return 0;
    }

    public function calcularAguinaldo(float $salario, Carbon $fechaIngreso, string $periodo, bool $forzar = false): float
    {
        $anio = (int) substr($periodo, 0, 4);
        if (!$forzar) {
            $mes = (int) substr($periodo, 5, 2);
            if ($mes !== 12) return 0;
        }

        $corte = Carbon::create($anio, 12, 12);
        $antiguedad = $fechaIngreso->diffInYears($corte);
        $diasLaborados = $fechaIngreso->diffInDays($corte);

        $salarioDiario = $salario / 30;

        if ($diasLaborados < 30) return 0;

        if ($antiguedad < 1) {
            $diasProporcionales = ($diasLaborados / 365) * 15;
            return round($salarioDiario * $diasProporcionales, 2);
        }

        if ($antiguedad < 3) {
            return round($salarioDiario * 15, 2);
        }

        if ($antiguedad < 10) {
            return round($salarioDiario * 19, 2);
        }

        return round($salarioDiario * 21, 2);
    }

    public function calcularVacaciones(float $salario, Carbon $fechaIngreso): array
    {
        $salarioDiario = $salario / 30;
        $baseVacaciones = $salarioDiario * 15;
        $prima = round($baseVacaciones * 0.30, 2);
        $pagoVacaciones = round($baseVacaciones + $prima, 2);

        return [
            'dias_vacaciones' => 15,
            'prima_vacacional' => $prima,
            'pago_vacaciones' => $pagoVacaciones,
        ];
    }

    public function calcularValorHoras(float $salario, array $horas): array
    {
        $horaDiurna = $salario / 30 / 8;

        // Normales: la base ya cubre 240 h/mes. Solo se paga recargo nocturno (25%).
        $pagoNormal = (float) ($horas['hora_normal_nocturna'] ?? 0) * $horaDiurna * 0.25;

        // Extras: se pagan completas con su recargo.
        $extraDiurna = (float) ($horas['extra_diurna'] ?? 0) * $horaDiurna * 2.00;
        $extraNocturna = (float) ($horas['extra_nocturna'] ?? 0) * $horaDiurna * 2.25;

        return [
            'pago_horas_normales' => round($pagoNormal, 2),
            'pago_horas_extras' => round($extraDiurna + $extraNocturna, 2),
        ];
    }

    public function calcularAusencias(Employee $employee, string $periodo): array
    {
        $ausencias = \App\Models\Absence::aprobados()
            ->porEmpleado($employee->id)
            ->where('fecha_inicio', '<=', "{$periodo}-31")
            ->where('fecha_fin', '>=', "{$periodo}-01")
            ->get();

        $salarioDiario = (float) $employee->salario_nominal / 30;
        $totalDescuento = 0;
        $subsidioIncapacidad = 0;
        $diasInjustificados = 0;
        $diasPermiso = 0;
        $diasIncapacidad = 0;
        $diasSinPago = 0;
        $semanasAfectadas = [];

        foreach ($ausencias as $a) {
            $inicio = $a->fecha_inicio;
            $fin = $a->fecha_fin;

            $inicioPeriodo = max($inicio, "{$periodo}-01");
            $finPeriodo = min($fin, "{$periodo}-31");

            $diasLaborales = 0;

            if (!empty($a->dias)) {
                // Usa las fechas individuales cuando estén disponibles
                foreach ($a->dias as $fechaStr) {
                    $fecha = \Carbon\Carbon::parse($fechaStr);
                    if ($fecha->between($inicioPeriodo, $finPeriodo) && $fecha->dayOfWeek >= 1 && $fecha->dayOfWeek <= 5) {
                        $diasLaborales++;
                    }
                }
            } else {
                // Fallback: contar días laborales en el rango (datos legacy)
                $d = \Carbon\Carbon::parse($inicioPeriodo);
                for (; $d <= $finPeriodo; $d->addDay()) {
                    if ($d->dayOfWeek >= 1 && $d->dayOfWeek <= 5) {
                        $diasLaborales++;
                    }
                }
            }

            if ($diasLaborales <= 0) continue;

            switch ($a->tipo) {
                case 'Injustificada':
                    $totalDescuento += $diasLaborales * $salarioDiario;
                    $diasInjustificados += $diasLaborales;
                    // Rastrea semanas únicas para el cálculo del séptimo día
                    $fechas = !empty($a->dias) ? $a->dias : [];
                    if (empty($fechas)) {
                        $d = \Carbon\Carbon::parse($inicioPeriodo);
                        for (; $d <= $finPeriodo; $d->addDay()) {
                            if ($d->dayOfWeek >= 1 && $d->dayOfWeek <= 5) {
                                $fechas[] = $d->format('Y-m-d');
                            }
                        }
                    }
                    foreach ($fechas as $fechaStr) {
                        $fecha = \Carbon\Carbon::parse($fechaStr);
                        if ($fecha->dayOfWeek >= 1 && $fecha->dayOfWeek <= 5) {
                            $semana = $fecha->isoWeekYear() . '-W' . $fecha->isoWeek();
                            $semanasAfectadas[$semana] = true;
                        }
                    }
                    break;
                case 'Permiso sin goce de sueldo':
                    $totalDescuento += $diasLaborales * $salarioDiario;
                    $diasPermiso += $diasLaborales;
                    break;
                case 'Incapacidad ISSS':
                    $diasPago = min($diasLaborales, 3);
                    $subsidioIncapacidad += $diasPago * $salarioDiario * 1.0;
                    $diasSinPago = $diasLaborales - $diasPago;
                    $diasIncapacidad += $diasLaborales;
                    break;
            }
        }

        // Agrega un séptimo día por cada semana única con ausencia injustificada
        $septimosDias = count($semanasAfectadas);
        $totalDescuento += $septimosDias * $salarioDiario;

        return [
            'dias_injustificados' => $diasInjustificados,
            'dias_permiso' => $diasPermiso,
            'dias_incapacidad' => $diasIncapacidad,
            'dias_incapacidad_sin_pago' => $diasSinPago,
            'monto_isss_referencia' => round($diasSinPago * $salarioDiario * 0.75, 2),
            'septimos_dias' => $septimosDias,
            'total_descuento' => round($totalDescuento, 2),
            'subsidio_incapacidad' => round($subsidioIncapacidad, 2),
        ];
    }

    public function calcularEmpleado(Employee $employee, string $periodo, bool $aplicarVacaciones = false, array $horas = [], array $ausencias = [], bool $pagarAguinaldo = false, bool $pagarQuincena25 = false): array
    {
        $salarioNominal = (float) $employee->salario_nominal;

        $bonoQuincena25 = $this->calcularBonoQuincena25($salarioNominal, $periodo, $pagarQuincena25);
        $aguinaldo = $this->calcularAguinaldo($salarioNominal, $employee->fecha_ingreso, $periodo, $pagarAguinaldo);

        $vacacionData = ['dias_vacaciones' => 0, 'prima_vacacional' => 0, 'pago_vacaciones' => 0];
        if ($aplicarVacaciones) {
            $vacacionData = $this->calcularVacaciones($salarioNominal, $employee->fecha_ingreso);
        }

        $pagoHoras = $this->calcularValorHoras($salarioNominal, $horas);

        $bonosSinDescuento = $bonoQuincena25 + $aguinaldo;
        $baseConVacaciones = $vacacionData['pago_vacaciones'];

        $descuentoAusencias = $ausencias['total_descuento'] ?? 0;
        $subsidioIncapacidad = $ausencias['subsidio_incapacidad'] ?? 0;

        $horasNormales = ($horas['hora_normal_diurna'] ?? 0) + ($horas['hora_normal_nocturna'] ?? 0);
        $factorHoras = min($horasNormales / 240, 1);
        $baseAjustada = $salarioNominal * $factorHoras - $descuentoAusencias + $subsidioIncapacidad;
        $salarioBruto = $baseAjustada + $bonosSinDescuento + $baseConVacaciones + $pagoHoras['pago_horas_normales'] + $pagoHoras['pago_horas_extras'];
        $baseImponible = $baseAjustada + $baseConVacaciones + $pagoHoras['pago_horas_normales'] + $pagoHoras['pago_horas_extras'];

        $isss = $this->calcularISSS($baseImponible);
        $afp = $this->calcularAFP($baseImponible);
        $rentaGravable = $baseImponible - $isss - $afp;
        $isr = $this->calcularISR($rentaGravable);
        $totalDescuentos = $isss + $afp + $isr;
        $neto = $salarioBruto - $totalDescuentos;

        return [
            'salario_base' => $salarioNominal,
            'isss' => $isss,
            'afp' => $afp,
            'isr' => $isr,
            'renta_gravable' => $rentaGravable,
            'total_descuentos' => $totalDescuentos + $descuentoAusencias,
            'neto' => $neto,
            'bono_quincena25' => $bonoQuincena25,
            'aguinaldo' => $aguinaldo,
            'dias_vacaciones' => $vacacionData['dias_vacaciones'],
            'prima_vacacional' => $vacacionData['prima_vacacional'],
            'pago_vacaciones' => $vacacionData['pago_vacaciones'],
            'bono_total' => $bonosSinDescuento,
            'pago_horas_normales' => $pagoHoras['pago_horas_normales'],
            'pago_horas_extras' => $pagoHoras['pago_horas_extras'],
            'descuento_ausencias' => $descuentoAusencias,
            'subsidio_incapacidad' => $subsidioIncapacidad,
        ];
    }
}
