# PlanillaSV — Sistema de Planillas de Pago (El Salvador)

Aplicación web completa para gestión de Recursos Humanos y cálculo de planillas con deducciones según la legislación salvadoreña.

## Stack

| Capa | Tecnología |
|------|-----------|
| Backend | Laravel 11 + SQLite |
| Frontend | React 18 + TypeScript + Tailwind CSS 3 |
| PDF | barryvdh/laravel-dompdf |
| Auth | Laravel Sanctum (API tokens) |

## Requisitos

- PHP 8.3+ con extensiones: `sqlite3`, `dom`, `mbstring`, `zip`, `xml`, `gd` (para dompdf)
- Node.js 18+ y npm
- Composer 2.x

## Colores

- Fondo: `#FFFFFF`
- Primario: `#27316E`
- Secundario: `#95BF1D`
- Acento: `#B0DF38`
- Gradiente Sidebar: `from-primary to-blue-900`

## Instalación

```bash
# 1. Clonar y entrar al proyecto
git clone <repo> PlanillaSV
cd PlanillaSV

# 2. Backend
cd backend
cp .env.example .env
composer install --no-dev
php artisan key:generate
php artisan migrate --seed
php artisan serve --port=8000

# 3. Frontend (otra terminal)
cd frontend
npm ci
npm run dev
```

Frontend: `http://localhost:5173` · Backend: `http://localhost:8000`

### Login

| Correo | Contraseña |
|--------|-----------|
| admin@planillas.com | admin123 |

### Variables de Entorno

El archivo `.env.example` incluye valores por defecto funcionales. Variables clave:

| Variable | Defecto | Descripción |
|----------|---------|-------------|
| `MIN_SALARY` | `408.80` | Salario mínimo mensual vigente en El Salvador |
| `DB_CONNECTION` | `sqlite` | Motor de base de datos |

### Resetear Base de Datos

Para limpiar la BD y volver a sembrar datos de prueba:

```bash
cd backend
php artisan db:wipe --force     # Elimina todas las tablas
php artisan migrate --force      # Recrea tablas
php artisan db:seed --force      # Ejecuta todos los seeders
php artisan optimize:clear       # Limpia caché
```

El `DatabaseSeeder` trunca todas las tablas y ejecuta:
- `EmployeeSeeder` — 8 empleados de prueba
- `AdminUserSeeder` — usuario `admin@planillas.com` / `admin123`

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
- **Empleados** — CRUD completo con filtro por estado y búsqueda. Validación de salario mínimo. No se eliminan si tienen planillas cerradas
- **Horas Laboradas** — registro por empleado/período con 4 tipos de hora (normal diurna, normal nocturna, extra diurna, extra nocturna):
  - Límite de 240 h normales (diurna + nocturna)
  - Balanceo automático: al cambiar nocturna, se ajusta diurna para mantener máximo 240
  - Sugerencia de horas basada en ausencias aprobadas del período
  - Aprobación individual o masiva (todas en Borrador)
  - Descarte individual o masivo
  - Descarga de plantilla CSV (delimitador `;` para Excel en español)
  - Importación de archivos CSV ( `;` o `,` ) y XLSX
  - Validación de valores negativos con `min="0"` y mensajes en español
- **Ausencias** — registro con 3 tipos:
  - **Injustificada**: descuenta días laborales + 1 séptimo día por semana ISO
  - **Permiso sin goce de sueldo**: descuenta días exactos
  - **Incapacidad ISSS**: empresa paga 75% × salario diario primeros 3 días, desde día 4 asume ISSS
  - Datepickers dinámicos para seleccionar múltiples fechas
  - Validación: no fines de semana, no duplicados por empleado/fecha
  - Bloqueo: si el empleado tiene horas aprobadas en el período, no se pueden registrar ausencias
  - Aprobación individual
- **Planillas** — generación mensual con cálculo completo:
  - Prorrateo del salario por horas trabajadas (`factor = horas_normales / 240`)
  - ISSS (3%, tope $30), AFP (7.25%), ISR (escala mensual 4 tramos)
  - Pago de horas (nocturnas, extras diurnas/nocturnas)
  - Bonos (Quincena25 en enero, Aguinaldo en diciembre)
  - Vacaciones (15 días + 30% prima, por aniversario de ingreso)
  - Descuento de ausencias
  - Refrescar, cerrar, descartar
  - Boleta de pago en PDF

### Ciclo de Vida

1. Registrar horas laboradas (Borrador → Aprobado)
2. Registrar ausencias (Borrador → Aprobada)
3. Generar planilla (calcula ISSS/AFP/ISR, bonos, horas, ausencias, prorrateo)
4. Estado Borrador → permite refrescar/recalcular
5. Estado Cerrada → bloquea ediciones, permite descargar boletas

### Validaciones

- **Horas**: suma normal diurna + nocturna ≤ 240. Edición/eliminación solo en Borrador
- **Ausencias duplicadas**: no se permite registrar la misma fecha para el mismo empleado
- **Horas aprobadas bloquean ausencias**: si un empleado ya tiene WorkLogs aprobados en un período, no se pueden registrar ausencias
- **Edición solo en Borrador**: una vez aprobado (horas o ausencias), no se puede editar ni eliminar
- **Empleados en planillas cerradas**: no se pueden eliminar
- **Salario mínimo**: no puede ser inferior al configurado en `MIN_SALARY`
- **Valores negativos**: inputs de horas con `min="0"` y validación en español
- **Importación CSV/XLSX**: detección automática de delimitador (`;` o `,`), validación de empleado, período y duplicados

### Cálculos (Ley El Salvador)

#### Prorrateo por Horas

El salario base se prorratea según las horas normales trabajadas:

```
factorHoras = min((hora_normal_diurna + hora_normal_nocturna) / 240, 1)
salarioProrrateado = salarioNominal × factorHoras
baseAjustada = salarioProrrateado − descuentoAusencias + subsidioIncapacidad
```

#### ISSS (3%)

- Tasa: 3% sobre salario bruto
- Tope: $30.00 (base máxima cotizable $1,000.00)
- Aplica sobre: base ajustada + vacaciones + pago horas
- Patronal: 7.50%

#### AFP (7.25%)

- Tasa: 7.25% sobre salario bruto
- Sin tope máximo
- Misma base imponible que ISSS
- Patronal: 8.75%

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

- **Injustificada**: descuenta `días laborales × salarioDiario` + 1 séptimo día por cada semana ISO única con faltas
- **Permiso sin goce**: descuenta `días exactos × salarioDiario`
- **Incapacidad ISSS**: empresa paga 75% × salarioDiario por los primeros 3 días. Desde el día 4: 0% (asume ISSS)

#### Bonos

- **Quincena25 (Enero)**: 50% del salario si ≤ $1,500. Sin descuentos ISSS/AFP/ISR
- **Aguinaldo (Diciembre)**: corte al 12 de diciembre.
  - <1 año: proporcional a 15 días
  - 1-3 años: 15 días
  - 3-10 años: 19 días
  - 10+: 21 días
  - Sin descuentos

#### Vacaciones

- 15 días de salario + 30% prima vacacional
- Afecto a ISSS/AFP/ISR
- Se aplican por empleado vía checkbox al generar planilla
- Filtro por mes de ingreso (aniversario) y año anterior al período

### Interfaz

- **Login**: pantalla dividida (logo + branding izquierda, formulario derecha), fondo con orbes decorativos, campos oscuros con iconos
- **Sidebar**: degradado `from-primary to-blue-900`, indicador activo con borde secundario, logo circular
- **Modales**: animación con `@keyframes` (fade + scale), barra superior decorativa `border-t-4 border-secondary` (por defecto) o `border-red-500` (confirmación de eliminación)
- **ConfirmModal**: usa Modal internamente con borde rojo, mensaje de confirmación y botón de acción
- **Estados de carga**: spinner en todas las páginas mientras cargan datos
- **Períodos**: selector `<input type="month">` en todos los formularios
- **Logo**: `logo.png` y `logo2.png` en sidebar y login

### Boleta de Pago (PDF)

- Encabezado: empresa "Grupo NSV S.A. de C.V", NIT `0614-27081-105-3`
- Ingresos: salario ordinario (prorrateado por horas), recargo nocturno (25%), extra diurna (×2.0), extra nocturna (×2.25), bonos (Quincena25 + Aguinaldo), vacaciones, subsidio incapacidad
- Deducciones: desglose de ausencias por tipo con días, ISSS (3%), AFP (7.25%), ISR (renta)
- Aportes patronales: ISSS (7.50%), AFP (8.75%)
- Total neto a pagar

## API Endpoints (34)

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/api/login` | Iniciar sesión |
| POST | `/api/logout` | Cerrar sesión |
| GET | `/api/me` | Usuario actual |
| GET | `/api/dashboard/stats` | Estadísticas (con pendientes) |
| GET/POST | `/api/employees` | Listar/Crear empleados |
| GET/PUT/DELETE | `/api/employees/{id}` | CRUD empleado |
| GET | `/api/employees/{id}/eligible-vacation` | Elegible vacaciones |
| POST | `/api/work-logs/bulk` | Crear horas para todos los activos sin registro |
| PATCH | `/api/work-logs/approve-all` | Aprobar todas las horas en Borrador |
| DELETE | `/api/work-logs/discard-all` | Descartar todas las horas en Borrador |
| GET | `/api/work-logs/template` | Descargar plantilla CSV |
| POST | `/api/work-logs/import` | Importar archivo CSV o XLSX |
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

- PHP-FPM 8.3 con extensiones necesarias (sqlite3, dom, mbstring, zip, xml)
- Nginx con multi-stage build (Node → compila frontend → sirve desde nginx alpine)
- Entrypoint migra y siembra DB solo si no hay empleados (siembra condicional)
- Archivos de caché de Laravel precargados en build

Backend: `http://localhost:8000` · Frontend: `http://localhost`
