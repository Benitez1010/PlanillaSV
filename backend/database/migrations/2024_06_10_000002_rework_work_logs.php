<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('work_logs', function (Blueprint $table) {
            $table->dropColumn(['horas_ordinarias', 'horas_extra_diurnas', 'horas_extra_nocturnas']);
        });

        Schema::table('work_logs', function (Blueprint $table) {
            $table->decimal('hora_normal_diurna', 8, 2)->default(0)->after('periodo');
            $table->decimal('hora_normal_nocturna', 8, 2)->default(0)->after('hora_normal_diurna');
            $table->decimal('extra_diurna', 8, 2)->default(0)->after('hora_normal_nocturna');
            $table->decimal('extra_nocturna', 8, 2)->default(0)->after('extra_diurna');
            $table->string('estado', 20)->default('Borrador')->after('extra_nocturna');
            $table->timestamp('fecha_aprobacion')->nullable()->after('estado');
        });
    }

    public function down(): void
    {
        Schema::table('work_logs', function (Blueprint $table) {
            $table->dropColumn(['hora_normal_diurna', 'hora_normal_nocturna', 'extra_diurna', 'extra_nocturna', 'estado', 'fecha_aprobacion']);
        });

        Schema::table('work_logs', function (Blueprint $table) {
            $table->decimal('horas_ordinarias', 8, 2)->default(0);
            $table->decimal('horas_extra_diurnas', 8, 2)->default(0);
            $table->decimal('horas_extra_nocturnas', 8, 2)->default(0);
        });
    }
};
