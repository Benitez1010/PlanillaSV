<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Boleta de Pago</title>
    <style>
        body { font-family: 'DejaVu Sans', sans-serif; font-size: 11px; color: #333; }
        .header { text-align: center; margin-bottom: 20px; border-bottom: 2px solid #27316E; padding-bottom: 10px; }
        .header h1 { color: #27316E; margin: 0; font-size: 18px; }
        .header p { margin: 2px 0; color: #666; font-size: 10px; }
        .title { text-align: center; font-size: 14px; font-weight: bold; color: #27316E; margin-bottom: 15px; }
        .info { width: 100%; margin-bottom: 15px; }
        .info td { padding: 2px 8px; font-size: 10px; }
        .info .label { color: #666; width: 140px; }
        table.detalle { width: 100%; border-collapse: collapse; margin-bottom: 10px; }
        table.detalle th { background: #27316E; color: white; padding: 6px 8px; text-align: left; font-size: 10px; }
        table.detalle td { padding: 4px 8px; border-bottom: 1px solid #ddd; font-size: 10px; }
        table.detalle .right { text-align: right; }
        table.detalle .total { font-weight: bold; border-top: 2px solid #27316E; }
        table.detalle .total td { padding: 6px 8px; }
        .neto { font-size: 14px; font-weight: bold; color: #27316E; text-align: right; margin-top: 10px; }
        .footer { text-align: center; margin-top: 20px; font-size: 9px; color: #999; border-top: 1px solid #ddd; padding-top: 8px; }
    </style>
</head>
<body>
    <div class="header">
        <h1>Grupo NSV S.A. de C.V</h1>
        <p>NIT: 0614-27081-105-3</p>
        <p>{{ $direccion ?? 'San Salvador, El Salvador' }}</p>
    </div>

    <div class="title">BOLETA DE PAGO</div>

    <table class="info">
        <tr><td class="label">Empleado:</td><td>{{ $detail->employee->nombre_completo }}</td></tr>
        <tr><td class="label">Período:</td><td>{{ $payroll->periodo }}</td></tr>
        <tr><td class="label">Salario Nominal:</td><td>${{ number_format($detail->salario_base, 2) }}</td></tr>
    </table>

    <table class="detalle">
        <tr>
            <th colspan="2">INGRESOS</th>
            <th class="right">Monto</th>
        </tr>
        <tr>
            <td colspan="2">Salario Ordinario</td>
            <td class="right">${{ number_format($detail->salario_base, 2) }}</td>
        </tr>
        @if ($detail->pago_horas_normales > 0)
        <tr>
            <td colspan="2">Recargo Nocturno (25%) — {{ number_format($detail->horas_normales_nocturnas) }} h</td>
            <td class="right">${{ number_format($detail->pago_horas_normales, 2) }}</td>
        </tr>
        @endif
        @if ($detail->horas_extra_diurnas > 0)
        <tr>
            <td colspan="2">Horas Extra Diurnas (×2.0) — {{ number_format($detail->horas_extra_diurnas) }} h</td>
            <td class="right">${{ number_format($detail->horas_extra_diurnas * ($detail->salario_base / 240) * 2.0, 2) }}</td>
        </tr>
        @endif
        @if ($detail->horas_extra_nocturnas > 0)
        <tr>
            <td colspan="2">Horas Extra Nocturnas (×2.25) — {{ number_format($detail->horas_extra_nocturnas) }} h</td>
            <td class="right">${{ number_format($detail->horas_extra_nocturnas * ($detail->salario_base / 240) * 2.25, 2) }}</td>
        </tr>
        @endif
        @if ($detail->bono_quincena25 > 0)
        <tr>
            <td colspan="2">Bono Quincena25</td>
            <td class="right">${{ number_format($detail->bono_quincena25, 2) }}</td>
        </tr>
        @endif
        @if ($detail->aguinaldo > 0)
        <tr>
            <td colspan="2">Aguinaldo</td>
            <td class="right">${{ number_format($detail->aguinaldo, 2) }}</td>
        </tr>
        @endif
        @if ($detail->pago_vacaciones > 0)
        <tr>
            <td colspan="2">Vacaciones (15 días + 30% prima)</td>
            <td class="right">${{ number_format($detail->pago_vacaciones, 2) }}</td>
        </tr>
        @endif
        @if ($detail->subsidio_incapacidad > 0)
        <tr>
            <td colspan="2">Subsidio ISSS (75% primeros 3 días)</td>
            <td class="right">${{ number_format($detail->subsidio_incapacidad, 2) }}</td>
        </tr>
        @endif
        <tr class="total">
            <td colspan="2">Total Ingresos</td>
            <td class="right">${{ number_format(
                $detail->salario_base + $detail->pago_horas_normales + $detail->pago_horas_extras +
                $detail->bono_quincena25 + $detail->aguinaldo + $detail->pago_vacaciones +
                $detail->subsidio_incapacidad, 2) }}</td>
        </tr>
    </table>

    <table class="detalle">
        <tr>
            <th colspan="2">DEDUCCIONES</th>
            <th class="right">Monto</th>
        </tr>
        @if (count($ausencias) > 0)
            @foreach ($ausencias as $a)
                @php
                    $dias = !empty($a->dias) ? count($a->dias) : 0;
                    if ($dias === 0) {
                        $inicio = \Carbon\Carbon::parse($a->fecha_inicio);
                        $fin = \Carbon\Carbon::parse($a->fecha_fin);
                        for ($d = $inicio->copy(); $d <= $fin; $d->addDay()) {
                            if ($d->dayOfWeek >= 1 && $d->dayOfWeek <= 5) $dias++;
                        }
                    }
                    $monto = $dias * $salarioDiario;
                @endphp
                <tr>
                    <td colspan="2">{{ $a->tipo }} — {{ $dias }} día(s)</td>
                    <td class="right">${{ number_format($monto, 2) }}</td>
                </tr>
            @endforeach
        @endif
        <tr>
            <td colspan="2">ISSS (3%)</td>
            <td class="right">${{ number_format($detail->isss, 2) }}</td>
        </tr>
        <tr>
            <td colspan="2">AFP (7.25%)</td>
            <td class="right">${{ number_format($detail->afp, 2) }}</td>
        </tr>
        <tr>
            <td colspan="2">ISR (Renta)</td>
            <td class="right">${{ number_format($detail->isr, 2) }}</td>
        </tr>
        <tr class="total">
            <td colspan="2">Total Deducciones</td>
            <td class="right">${{ number_format($detail->total_descuentos, 2) }}</td>
        </tr>
    </table>

    <div class="neto">
        Total Neto a Pagar: ${{ number_format($detail->neto, 2) }}
    </div>

    <div class="footer">
        Este documento es un comprobante de pago. Conserve para sus registros.
    </div>
</body>
</html>
