<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('work_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('employee_id')->constrained()->cascadeOnDelete();
            $table->string('periodo', 7);
            $table->decimal('horas_ordinarias', 8, 2)->default(0);
            $table->decimal('horas_extra_diurnas', 8, 2)->default(0);
            $table->decimal('horas_extra_nocturnas', 8, 2)->default(0);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('work_logs');
    }
};
