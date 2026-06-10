<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreEmployeeRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $minSalary = (float) env('MIN_SALARY', 408.80);
        $isUpdate = $this->isMethod('PUT') || $this->isMethod('PATCH');

        $rules = [
            'nombres' => ($isUpdate ? 'sometimes|' : 'required|') . 'string|max:255',
            'apellidos' => ($isUpdate ? 'sometimes|' : 'required|') . 'string|max:255',
            'salario_nominal' => ($isUpdate ? 'sometimes|' : 'required|') . 'numeric|min:0',
            'fecha_ingreso' => ($isUpdate ? 'sometimes|' : 'required|') . 'date|before_or_equal:today',
            'estado' => 'sometimes|string|in:activo,inactivo',
            'aplicar_vacaciones' => 'sometimes|in:true,false,1,0,"1","0",true,false',
        ];

        return $rules;
    }

    public function messages(): array
    {
        return [
            'fecha_ingreso.before_or_equal' => 'La fecha de ingreso no puede ser posterior a hoy.',
            'salario_nominal.min' => 'El salario no puede ser negativo.',
        ];
    }

    public function withValidator($validator)
    {
        $minSalary = (float) env('MIN_SALARY', 408.80);
        $validator->after(function ($validator) use ($minSalary) {
            $salario = $this->input('salario_nominal');
            if ($salario !== null && (float) $salario > 0 && (float) $salario < $minSalary) {
                $validator->errors()->add(
                    'salario_nominal',
                    "El salario mínimo vigente en El Salvador es \${$minSalary}."
                );
            }
        });
    }

    protected function prepareForValidation(): void
    {
        if ($this->has('aplicar_vacaciones')) {
            $val = $this->input('aplicar_vacaciones');
            $this->merge([
                'aplicar_vacaciones' => in_array($val, ['true', '1', 1, true], true) ? '1' : '0',
            ]);
        }
    }
}
