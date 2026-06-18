# PlanillaSV — Sistema de Planillas de Pago (El Salvador)

Aplicación web completa para gestión de Recursos Humanos y cálculo de planillas con deducciones según la legislación salvadoreña.

## Stack

| Capa | Tecnología |
|------|-----------|
| Backend | Laravel 11 + SQLite |
| Frontend | React 18 + TypeScript + Tailwind CSS 3 |
| PDF | barryvdh/laravel-dompdf |
| Auth | Laravel Sanctum (API tokens) |

## Colores

- Fondo: `#FFFFFF`
- Primario: `#27316E`
- Secundario: `#95BF1D`
- Acento: `#B0DF38`
- Gradiente Sidebar: `from-primary to-blue-900`

## Instalación

```bash
# Backend
cd backend
cp .env.example .env
php artisan migrate --seed
php artisan serve --port=8000

# Frontend
cd frontend
npm install
npm run dev
```

Frontend: `http://localhost:5173` · Backend: `http://localhost:8000`

### Login

| Correo | Contraseña |
|--------|-----------|
| admin@planillas.com | admin123 |

## Datos de Prueba (8 empleados)

| Empleado | Salario | Ingreso | Propósito |
|----------|---------|---------|-----------|
| Carlos Martínez | $450.00 | 2023-01-15 | Exento ISR |
| María García | $750.00 | 2022-06-01 | Tramo 2 ISR |
| José Hernández | $408.80 | 2024-02-20 | Salario mínimo |
| Ana López | $900.00 | 2021-09-10 | Tramo 3 ISR |
| Pedro Ramírez | $1,200.00 | 2020-03-01 | Tramo 3 alto |
| Lucía Mendoza | $2,500.00 | 2019-07-15 | Tramo 4 ISR |
| Roberto Castillo | $365.00 | 2025-01-01 | Bajo mínimo |
| Elena Rivas | $600.00 | 2023-11-20 | Tramo 2 bajo |

## Funcionalidades

### Módulos
- **Dashboard** — 4 tarjetas con estadísticas (empleados activos, planillas del año, horas pendientes, ausencias pendientes), acciones rápidas con modales, últimas planillas
- **Empleados** — CRUD completo con filtro por estado y búsqueda
- **Horas Laboradas** — registro por empleado/período con 4 tipos de hora, aprobación en Borrador, edición antes de aprobar
- **Ausencias** — registro por cantidad de días con datepickers dinámicos, validación de fines de semana, duplicados y bloqueo si hay horas aprobadas en el período
- **Planillas** — generación mensual, refrescar, cerrar, descartar, boleta PDF

### Ciclo de Vida
1. Registrar horas laboradas (Borrador → Aprobado)
2. Registrar ausencias (Borrador → Aprobada)
3. Generar planilla (calcula ISSS/AFP/ISR, bonos, horas, ausencias)
4. Estado Borrador → permite refrescar/recalcular
5. Estado Cerrada → bloquea ediciones, permite descargar boletas

### Validaciones
- **Ausencias duplicadas**: no se permite registrar la misma fecha para el mismo empleado
- **Horas aprobadas bloquean ausencias**: si un empleado ya tiene WorkLogs aprobados en un período, no se pueden registrar ausencias en ese período hasta descartar las horas
- **Edición solo en Borrador**: una vez aprobado un registro (horas o ausencias), no se puede editar ni eliminar

### Cálculos (Ley El Salvador)

#### ISSS (3%)
- Tasa: 3% sobre salario bruto
- Tope: $30.00 (base máxima cotizable $1,000.00)
- Aplica sobre: salario base − descuento ausencias + subsidio incapacidad + vacaciones + pago horas

#### AFP (7.25%)
- Tasa: 7.25% sobre salario bruto
- Sin tope máximo
- Misma base imponible que ISSS

#### ISR (Escala Mensual)
| Rango | Tasa | Cuota Fija | Exceso |
|-------|------|-----------|--------|
| $0.01 – $550.00 | 0% | $0.00 | $0.00 |
| $550.01 – $895.24 | 10% | $17.67 | $550.00 |
| $895.25 – $2,038.10 | 20% | $60.00 | $895.24 |
| $2,038.11+ | 30% | $288.57 | $2,038.10 |

Fórmula: `((RentaGravable − Exceso) × Tasa) + CuotaFija`
Renta Gravable = Base Imponible − ISSS − AFP

#### Horas
- **Valor hora base**: `SalarioNominal ÷ 30 ÷ 8`
- **Normal diurna**: $0 (ya cubierta por salario base de 240 h/mes)
- **Normal nocturna**: recargo 25% → `horas × valorHora × 0.25`
- **Extra diurna**: ×2.0 → `horas × valorHora × 2.00`
- **Extra nocturna**: ×2.25 → `horas × valorHora × 2.25`

#### Ausencias
- **Injustificada**: descuenta `días laborales × salarioDiario` + 1 séptimo día por cada semana ISO única con faltas. Séptimo día: `1 × salarioDiario` por semana
- **Permiso sin goce**: descuenta `días exactos × salarioDiario`
- **Incapacidad ISSS**: empresa paga 75% × salarioDiario por los primeros 3 días. Desde el día 4: 0% (asume ISSS)

#### Bonos
- **Quincena25 (Enero)**: 50% del salario si ≤ $1,500. Sin descuentos ISSS/AFP/ISR
- **Aguinaldo (Diciembre)**: corte al 12 de diciembre. <1 año: proporcional a 15 días. 1-3 años: 15 días. 3-10 años: 19 días. 10+: 21 días. Sin descuentos

#### Vacaciones
- 15 días de salario + 30% prima vacacional
- Afecto a ISSS/AFP/ISR
- Se aplican por empleado vía checkbox al generar planilla

### Interfaz
- **Sidebar**: degradado `from-primary to-blue-900`, indicador activo con borde secundario, logo con fondo semitransparente
- **Modales**: fondo blanco sólido con barra superior decorativa `border-t-4 border-secondary`
- **Estados de carga**: spinner en todas las páginas mientras cargan datos
- **Períodos**: selector `<input type="month">` en todos los formularios
- **Logo**: `logo2.png` (fondo transparente) en sidebar y login

### Boleta de Pago (PDF)
- Encabezado: empresa "Grupo NSV S.A. de C.V", NIT `0614-27081-105-3`
- Ingresos: salario ordinario, recargo nocturno (25%), extra diurna (×2.0), extra nocturna (×2.25), bono quincena25, aguinaldo, vacaciones, subsidio incapacidad
- Deducciones: desglose de ausencias por tipo con días, ISSS, AFP, ISR
- Total neto a pagar

## API Endpoints (29)

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/api/login` | Iniciar sesión |
| POST | `/api/logout` | Cerrar sesión |
| GET | `/api/me` | Usuario actual |
| GET | `/api/dashboard/stats` | Estadísticas (con pendientes) |
| GET/POST | `/api/employees` | Listar/Crear empleados |
| GET/PUT/DELETE | `/api/employees/{id}` | CRUD empleado |
| GET | `/api/employees/{id}/eligible-vacation` | Elegible vacaciones |
| GET/POST | `/api/work-logs` | Listar/Crear horas |
| GET/PUT/DELETE | `/api/work-logs/{id}` | CRUD horas (editar en Borrador) |
| PATCH | `/api/work-logs/{id}/approve` | Aprobar horas |
| GET/POST | `/api/absences` | Listar/Crear ausencias |
| GET/PUT/DELETE | `/api/absences/{id}` | CRUD ausencias (editar en Borrador) |
| PATCH | `/api/absences/{id}/approve` | Aprobar ausencia |
| GET | `/api/payrolls` | Listar planillas |
| GET | `/api/payrolls/{id}` | Ver detalle planilla |
| POST | `/api/payrolls/generate` | Generar planilla |
| PATCH | `/api/payrolls/{id}/close` | Cerrar planilla |
| DELETE | `/api/payrolls/{id}/discard` | Descartar planilla |
| POST | `/api/payrolls/{id}/refresh` | Recalcular planilla |
| GET | `/api/payrolls/{id}/receipt/{employee}` | Descargar boleta PDF |

## Docker

```bash
docker compose up --build
```

- PHP-FPM 8.3 con extensiones necesarias (sqlite3, dom, mbstring)
- Nginx con multi-stage build (Node → compila frontend → sirve desde nginx alpine)
- Entrypoint migra y siembra DB al iniciar
- Archivos de caché de Laravel precargados en build

Backend: `http://localhost:8000` · Frontend: `http://localhost`
