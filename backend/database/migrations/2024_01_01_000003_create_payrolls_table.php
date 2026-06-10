<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('payrolls', function (Blueprint $table) {
            $table->id();
            $table->string('periodo', 7);
            $table->date('fecha_generacion');
            $table->decimal('total_bruto', 12, 2)->default(0);
            $table->decimal('total_isss', 12, 2)->default(0);
            $table->decimal('total_afp', 12, 2)->default(0);
            $table->decimal('total_isr', 12, 2)->default(0);
            $table->decimal('total_descuentos', 12, 2)->default(0);
            $table->decimal('total_neto', 12, 2)->default(0);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('payrolls');
    }
};
