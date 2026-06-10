<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('payroll_details', function (Blueprint $table) {
            $table->id();
            $table->foreignId('payroll_id')->constrained()->cascadeOnDelete();
            $table->foreignId('employee_id')->constrained()->cascadeOnDelete();
            $table->decimal('salario_base', 10, 2);
            $table->decimal('isss', 10, 2);
            $table->decimal('afp', 10, 2);
            $table->decimal('isr', 10, 2);
            $table->decimal('renta_gravable', 10, 2);
            $table->decimal('total_descuentos', 10, 2);
            $table->decimal('neto', 10, 2);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('payroll_details');
    }
};
