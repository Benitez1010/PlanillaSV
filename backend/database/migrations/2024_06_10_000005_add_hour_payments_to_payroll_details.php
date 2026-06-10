<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('payroll_details', function (Blueprint $table) {
            $table->decimal('pago_horas_normales', 10, 2)->default(0)->after('bono_total');
            $table->decimal('pago_horas_extras', 10, 2)->default(0)->after('pago_horas_normales');
        });
    }

    public function down(): void
    {
        Schema::table('payroll_details', function (Blueprint $table) {
            $table->dropColumn(['pago_horas_normales', 'pago_horas_extras']);
        });
    }
};
