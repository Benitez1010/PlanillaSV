<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class WorkLog extends Model
{
    protected $fillable = [
        'employee_id',
        'periodo',
        'hora_normal_diurna',
        'hora_normal_nocturna',
        'extra_diurna',
        'extra_nocturna',
        'estado',
        'fecha_aprobacion',
    ];

    protected function casts(): array
    {
        return [
            'fecha_aprobacion' => 'datetime',
        ];
    }

    public function employee(): BelongsTo
    {
        return $this->belongsTo(Employee::class);
    }

    public function scopeAprobados($query)
    {
        return $query->where('estado', 'Aprobado');
    }

    public function scopeBorrador($query)
    {
        return $query->where('estado', 'Borrador');
    }

    public function scopePorPeriodo($query, string $periodo)
    {
        return $query->where('periodo', $periodo);
    }

    public function scopePorEmpleado($query, int $employeeId)
    {
        return $query->where('employee_id', $employeeId);
    }
}
