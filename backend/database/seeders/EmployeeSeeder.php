<?php

namespace Database\Seeders;

use App\Models\Employee;
use Illuminate\Database\Seeder;

class EmployeeSeeder extends Seeder
{
    public function run(): void
    {
        $employees = [
            [
                'nombres' => 'Carlos',
                'apellidos' => 'Martínez',
                'salario_nominal' => 450.00,
                'fecha_ingreso' => '2023-01-15',
                'estado' => 'activo',
            ],
            [
                'nombres' => 'María',
                'apellidos' => 'García',
                'salario_nominal' => 750.00,
                'fecha_ingreso' => '2022-06-01',
                'estado' => 'activo',
            ],
            [
                'nombres' => 'José',
                'apellidos' => 'Hernández',
                'salario_nominal' => 408.8,
                'fecha_ingreso' => '2024-02-20',
                'estado' => 'activo',
            ],
            [
                'nombres' => 'Ana',
                'apellidos' => 'López',
                'salario_nominal' => 900.00,
                'fecha_ingreso' => '2021-09-10',
                'estado' => 'activo',
            ],
        ];

        foreach ($employees as $employee) {
            Employee::create($employee);
        }
    }
}
