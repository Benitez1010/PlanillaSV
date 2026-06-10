<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Employee extends Model
{
    protected $fillable = [
        'nombres',
        'apellidos',
        'salario_nominal',
        'fecha_ingreso',
        'estado',
        'aplicar_vacaciones',
        'ultimas_vacaciones',
    ];

    protected function casts(): array
    {
        return [
            'aplicar_vacaciones' => 'boolean',
            'fecha_ingreso' => 'date',
            'ultimas_vacaciones' => 'date',
        ];
    }

    public function workLogs(): HasMany
    {
        return $this->hasMany(WorkLog::class);
    }

    public function payrollDetails(): HasMany
    {
        return $this->hasMany(PayrollDetail::class);
    }

    public function getNombreCompletoAttribute(): string
    {
        return "{$this->nombres} {$this->apellidos}";
    }

    public function yearsOfService(int $cutoffYear): int
    {
        $cutoff = \Carbon\Carbon::create($cutoffYear, 12, 12);
        return $this->fecha_ingreso->diffInYears($cutoff);
    }
}
