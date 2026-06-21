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
                'salario_nominal' => 408.80,
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
            [
                'nombres' => 'Pedro',
                'apellidos' => 'Ramírez',
                'salario_nominal' => 1200.00,
                'fecha_ingreso' => '2020-03-01',
                'estado' => 'activo',
            ],
            [
                'nombres' => 'Lucía',
                'apellidos' => 'Mendoza',
                'salario_nominal' => 2500.00,
                'fecha_ingreso' => '2019-07-15',
                'estado' => 'activo',
            ],
            [
                'nombres' => 'Roberto',
                'apellidos' => 'Castillo',
                'salario_nominal' => 410.00,
                'fecha_ingreso' => '2025-01-01',
                'estado' => 'activo',
            ],
            [
                'nombres' => 'Elena',
                'apellidos' => 'Rivas',
                'salario_nominal' => 600.00,
                'fecha_ingreso' => '2023-11-20',
                'estado' => 'activo',
            ],
        ];

        foreach ($employees as $employee) {
            Employee::create($employee);
        }
    }
}
