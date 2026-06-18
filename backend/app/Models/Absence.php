<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Absence extends Model
{
    protected $fillable = [
        'employee_id',
        'tipo',
        'fecha_inicio',
        'fecha_fin',
        'dias',
        'estado',
    ];

    protected function casts(): array
    {
        return [
            'fecha_inicio' => 'date',
            'fecha_fin' => 'date',
            'dias' => 'array',
        ];
    }

    public function employee(): BelongsTo
    {
        return $this->belongsTo(Employee::class);
    }

    public function scopeAprobados($query)
    {
        return $query->where('estado', 'Aprobada');
    }

    public function scopeBorrador($query)
    {
        return $query->where('estado', 'Borrador');
    }

    public function scopePorEmpleado($query, int $employeeId)
    {
        return $query->where('employee_id', $employeeId);
    }
}
