<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('payroll_details', function (Blueprint $table) {
            $table->decimal('bono_quincena25', 10, 2)->default(0)->after('neto');
            $table->decimal('aguinaldo', 10, 2)->default(0)->after('bono_quincena25');
            $table->decimal('dias_vacaciones', 5, 2)->default(0)->after('aguinaldo');
            $table->decimal('prima_vacacional', 10, 2)->default(0)->after('dias_vacaciones');
            $table->decimal('pago_vacaciones', 10, 2)->default(0)->after('prima_vacacional');
            $table->decimal('horas_normales_diurnas', 8, 2)->default(0)->after('pago_vacaciones');
            $table->decimal('horas_normales_nocturnas', 8, 2)->default(0)->after('horas_normales_diurnas');
            $table->decimal('horas_extra_diurnas', 8, 2)->default(0)->after('horas_normales_nocturnas');
            $table->decimal('horas_extra_nocturnas', 8, 2)->default(0)->after('horas_extra_diurnas');
            $table->decimal('bono_total', 10, 2)->default(0)->after('horas_extra_nocturnas');
        });
    }

    public function down(): void
    {
        Schema::table('payroll_details', function (Blueprint $table) {
            $table->dropColumn([
                'bono_quincena25', 'aguinaldo', 'dias_vacaciones',
                'prima_vacacional', 'pago_vacaciones',
                'horas_normales_diurnas', 'horas_normales_nocturnas',
                'horas_extra_diurnas', 'horas_extra_nocturnas',
                'bono_total',
            ]);
        });
    }
};
