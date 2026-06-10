<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PayrollDetail extends Model
{
    protected $fillable = [
        'payroll_id',
        'employee_id',
        'salario_base',
        'isss',
        'afp',
        'isr',
        'renta_gravable',
        'total_descuentos',
        'neto',
        'bono_quincena25',
        'aguinaldo',
        'dias_vacaciones',
        'prima_vacacional',
        'pago_vacaciones',
        'horas_normales_diurnas',
        'horas_normales_nocturnas',
        'horas_extra_diurnas',
        'horas_extra_nocturnas',
        'bono_total',
        'pago_horas_normales',
        'pago_horas_extras',
        'descuento_ausencias',
        'subsidio_incapacidad',
    ];

    protected function casts(): array
    {
        return [
            'salario_base' => 'float',
            'isss' => 'float',
            'afp' => 'float',
            'isr' => 'float',
            'renta_gravable' => 'float',
            'total_descuentos' => 'float',
            'neto' => 'float',
            'pago_horas_normales' => 'float',
            'pago_horas_extras' => 'float',
            'descuento_ausencias' => 'float',
            'subsidio_incapacidad' => 'float',
        ];
    }

    public function payroll(): BelongsTo
    {
        return $this->belongsTo(Payroll::class);
    }

    public function employee(): BelongsTo
    {
        return $this->belongsTo(Employee::class);
    }
}
