<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('payroll_details', function (Blueprint $table) {
            $table->decimal('descuento_ausencias', 10, 2)->default(0)->after('pago_horas_extras');
            $table->decimal('subsidio_incapacidad', 10, 2)->default(0)->after('descuento_ausencias');
        });
    }

    public function down(): void
    {
        Schema::table('payroll_details', function (Blueprint $table) {
            $table->dropColumn(['descuento_ausencias', 'subsidio_incapacidad']);
        });
    }
};
