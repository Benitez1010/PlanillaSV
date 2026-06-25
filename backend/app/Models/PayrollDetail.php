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

    protected $appends = ['pago_horas_extras_diurnas', 'pago_horas_extras_nocturnas', 'isss_patronal', 'afp_patronal'];

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
            'bono_quincena25' => 'float',
            'aguinaldo' => 'float',
            'dias_vacaciones' => 'float',
            'prima_vacacional' => 'float',
            'pago_vacaciones' => 'float',
            'horas_normales_diurnas' => 'float',
            'horas_normales_nocturnas' => 'float',
            'horas_extra_diurnas' => 'float',
            'horas_extra_nocturnas' => 'float',
            'bono_total' => 'float',
            'pago_horas_normales' => 'float',
            'pago_horas_extras' => 'float',
            'descuento_ausencias' => 'float',
            'subsidio_incapacidad' => 'float',
        ];
    }

    public function getPagoHorasExtrasDiurnasAttribute(): float
    {
        return round($this->horas_extra_diurnas * ($this->salario_base / 240) * 2.0, 2);
    }

    public function getPagoHorasExtrasNocturnasAttribute(): float
    {
        return round($this->horas_extra_nocturnas * ($this->salario_base / 240) * 2.25, 2);
    }

    public function getIsssPatronalAttribute(): float
    {
        return round(min($this->salario_base, 1000) * 0.075, 2);
    }

    public function getAfpPatronalAttribute(): float
    {
        return round($this->salario_base * 0.0875, 2);
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
