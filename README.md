# Backend - Sistema de Calidad

Backend del sistema web centralizado de calidad construido con Node.js, Express y TypeScript.

## 🚀 Instalación

```bash
# Instalar dependencias
npm install

# Copiar archivo de variables de entorno
cp .env.example .env

# Editar .env con tus configuraciones
```

## 📦 Configuración de Base de Datos

1. Crear la base de datos PostgreSQL:
```sql
CREATE DATABASE quality_system;
```

2. Ejecutar el script de schema:
```bash
psql -U postgres -d quality_system -f ../database-schema.sql
```

3. Crear usuario administrador inicial:
```bash
npm run build
node dist/scripts/createAdmin.js
```

Credenciales por defecto:
- Email: `admin@empresa.com`
- Password: `Admin123!`

**⚠️ IMPORTANTE:** Cambiar la contraseña después del primer login.

## 🛠️ Scripts Disponibles

```bash
# Desarrollo (con hot-reload)
npm run dev

# Compilar TypeScript
npm run build

# Producción
npm start
```

## 📁 Estructura del Proyecto

```
backend/
├── src/
│   ├── config/          # Configuración (DB, etc)
│   ├── controllers/     # Lógica de negocio
│   ├── middleware/      # Middlewares (auth, etc)
│   ├── routes/          # Definición de rutas
│   ├── scripts/         # Scripts de utilidad
│   ├── types/           # Tipos TypeScript
│   ├── utils/           # Utilidades (audit, shifts)
│   └── server.ts        # Punto de entrada
├── .env.example         # Template de variables
├── package.json
└── tsconfig.json
```

## 🔐 Autenticación y Roles

El sistema usa JWT para autenticación. Roles disponibles:

- **admin**: Acceso total (gestión de usuarios, ver todos los registros, logs)
- **calidad**: Registrar defectos, ver sus propios registros
- **usuario**: Rol base (expandible a futuro)

## 📡 Endpoints de la API

### Autenticación
- `POST /api/auth/login` - Login
- `GET /api/auth/profile` - Obtener perfil (requiere auth)
- `POST /api/auth/change-password` - Cambiar contraseña (requiere auth)

### Usuarios (Solo Admin)
- `GET /api/users` - Listar usuarios
- `POST /api/users` - Crear usuario
- `PUT /api/users/:id` - Actualizar usuario
- `DELETE /api/users/:id` - Eliminar usuario
- `POST /api/users/:id/reset-password` - Resetear contraseña

### Defectos
- `POST /api/defects` - Crear registro (admin, calidad)
- `GET /api/defects/my-records` - Mis registros (admin, calidad)
- `GET /api/defects/all` - Todos los registros (solo admin)
- `GET /api/defects/types` - Tipos de defectos
- `GET /api/defects/stats` - Estadísticas (solo admin)

### Turnos
- `GET /api/shifts` - Obtener configuración de turnos
- `GET /api/shifts/current` - Obtener turno actual
- `PUT /api/shifts/:shiftNumber` - Actualizar turno (solo admin)

### Auditoría (Solo Admin)
- `GET /api/audit` - Obtener logs
- `GET /api/audit/stats` - Estadísticas de auditoría
- `GET /api/audit/:entityType/:entityId` - Logs de una entidad

## 🔧 Variables de Entorno

Ver `.env.example` para todas las variables disponibles.

## 📊 Cálculo Automático de Turno

El sistema calcula automáticamente el turno basado en la hora en que se registra el defecto. La configuración de turnos es editable desde el endpoint `/api/shifts`.

Por defecto:
- Turno 1: 07:00 - 15:00
- Turno 2: 15:00 - 23:00
- Turno 3: 23:00 - 07:00

## 🔍 Logs de Auditoría

Todas las acciones importantes se registran automáticamente:
- Login de usuarios
- Creación/edición/eliminación de usuarios
- Creación de registros de defectos
- Cambios en configuración de turnos

## 🚨 Manejo de Errores

El backend incluye:
- Validación de datos de entrada
- Manejo centralizado de errores
- Logs detallados en desarrollo
- Mensajes de error seguros en producción
