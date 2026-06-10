<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Payroll extends Model
{
    protected $fillable = [
        'periodo',
        'estado',
        'fecha_generacion',
        'total_bruto',
        'total_isss',
        'total_afp',
        'total_isr',
        'total_descuentos',
        'total_neto',
    ];

    protected function casts(): array
    {
        return [
            'fecha_generacion' => 'date',
        ];
    }

    public function details(): HasMany
    {
        return $this->hasMany(PayrollDetail::class);
    }

    public function scopeBorrador($query)
    {
        return $query->where('estado', 'Borrador');
    }

    public function scopeCerrada($query)
    {
        return $query->where('estado', 'Cerrada');
    }

    public function isBorrador(): bool
    {
        return $this->estado === 'Borrador';
    }

    public function isCerrada(): bool
    {
        return $this->estado === 'Cerrada';
    }
}
