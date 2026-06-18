<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        DB::statement('PRAGMA foreign_keys = OFF');

        DB::table('work_logs')->truncate();
        DB::table('absences')->truncate();
        DB::table('payroll_details')->truncate();
        DB::table('payrolls')->truncate();
        DB::table('employees')->truncate();

        DB::statement('PRAGMA foreign_keys = ON');

        $this->call([
            EmployeeSeeder::class,
            AdminUserSeeder::class,
        ]);
    }
}
