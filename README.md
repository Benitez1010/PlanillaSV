# Sistema de Planillas de Pago - El Salvador

Aplicación web completa para gestión de Recursos Humanos y cálculo de planillas con deducciones según la legislación salvadoreña.

## Stack Tecnológico

- **Backend**: Laravel 11 + SQLite
- **Frontend**: React 18 + TypeScript + Tailwind CSS 3
- **Base de Datos**: SQLite

## Paleta de Colores

- Fondo: `#FFFFFF`
- Primario: `#27316E` (Barra de navegación, headers)
- Secundario: `#95BF1D` (Botones, badges)
- Acento: `#B0DF38` (Hover)

## Requisitos Previos

- PHP 8.3+
- Composer
- Node.js 18+

## Instalación y Ejecución

### 1. Backend (Laravel)

```bash
cd backend
cp .env.example .env  # ya configurado para SQLite
php artisan migrate --seed
php artisan serve --port=8000
```

El backend estará en: `http://localhost:8000`

### 2. Frontend (React)

```bash
cd frontend
npm install
npm run dev
```

El frontend estará en: `http://localhost:5173`

## API Endpoints

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/dashboard/stats` | Estadísticas del dashboard |
| GET/POST | `/api/employees` | Listar/Crear empleados |
| GET/PUT/DELETE | `/api/employees/{id}` | CRUD empleado |
| GET/POST | `/api/work-logs` | Listar/Crear horas laboradas |
| GET | `/api/payrolls` | Listar planillas |
| GET | `/api/payrolls/{id}` | Ver detalle de planilla |
| POST | `/api/payrolls/generate` | Generar planilla |

## Cálculos (Ley de El Salvador)

### ISSS (3%)
- Tasa: 3% sobre salario bruto
- Tope: $30.00 (base máxima cotizable $1,000.00)

### AFP (7.25%)
- Tasa: 7.25% sobre salario bruto
- Sin tope máximo

### ISR (Escala Mensual)
- $0.01 - $550.00: Exento
- $550.01 - $895.24: 10% sobre exceso + $17.67
- $895.25 - $2,038.10: 20% sobre exceso + $60.00
- $2,038.11+: 30% sobre exceso + $288.57

## Datos de Prueba

| Empleado | Salario |
|----------|---------|
| Carlos Martínez | $450.00 |
| María García | $750.00 |
| José Hernández | $400.00 |
| Ana López | $900.00 |
