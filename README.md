# ♻️ EcoChain

MVP de **auditoría interna de merma** para empresas: responde dónde se genera el desperdicio, cuánto dinero cuesta y si la operación está mejorando.

## Los 4 módulos

| Módulo | Qué hace |
|---|---|
| **Panel ejecutivo** | KPIs del año, comparativa mes contra mes con el año anterior, pérdida neta, puntos críticos por área/máquina, materiales y motivos más frecuentes. |
| **Registro de merma** | Alta, edición y eliminación de lotes. Cada lote guarda fecha, área/máquina, material, kilos, motivo y observaciones. El costo se calcula solo. |
| **Catálogos y costos** | Administra materiales (con costo por kg) y áreas/máquinas. Los registros inactivos dejan de aparecer al capturar merma. |
| **Salida a reciclaje** | Selecciona lotes en almacén, regístralos como enviados a una recicladora y anota el monto recuperado. |

### Lógica financiera

```
Costo de la merma   = Σ (kilos del lote × costo por kg del material)
Resultado del envío = monto recuperado − costo de la merma
```

- Si el resultado es **positivo**, se muestra como **ganancia neta** (recuperaste más de lo que costó la materia prima).
- Si es **negativo**, se muestra como **pérdida neta** con el valor absoluto.

En el panel ejecutivo la fórmula se presenta como pérdida:

```
Pérdida neta del año = costo de la merma − monto recuperado por reciclaje
```

Si el monto recuperado supera el costo, el KPI cambia a **Ganancia neta del año**.

### Años en el panel

El selector de año del panel ejecutivo se arma con:

- Todos los años que tienen al menos un lote registrado.
- El año actual, aunque todavía no tenga registros.

Así puedes consultar años futuros (por ejemplo 2027) o pasados (2023) sin tocar código.

También puedes abrir un año o un módulo directo con la URL:

```
http://localhost:5173/?anio=2027
http://localhost:5173/?modulo=envios
```

### Estados y motivos

- Estados del lote: `EN_ALMACEN`, `ENVIADO`.
- Motivos: `FALLA_CALIBRACION`, `CORTE_DEFECTUOSO`, `MATERIAL_CADUCADO`, `ERROR_OPERACION`, `CONTAMINACION`, `OTRO`.

## Estructura

```
/docker-compose.yml
/client/   -> React + Vite (Nginx en Docker, puerto 80)
/service/  -> Spring Boot 3 / Java 17 (puerto 8080)
```

## Levantar todo con Docker

```bash
docker compose up -d --build
```

| Servicio | URL |
|---|---|
| Frontend | http://localhost |
| Backend | http://localhost:8080/api/dashboard |
| MySQL | localhost:3306 (db: `ecochain`, user: `root`, pass: `root`) |

> Requiere Docker Desktop instalado y corriendo.

## Desarrollo local (sin Docker)

### 1. Base de datos

MySQL debe estar corriendo en `localhost:3306`.

En Windows, si instalaste MySQL Server, abre PowerShell **como administrador**:

```powershell
net start MySQL80
Set-Service MySQL80 -StartupType Automatic
```

Crea la base (Hibernate crea las tablas con `ddl-auto=update`):

```sql
CREATE DATABASE IF NOT EXISTS ecochain
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

La configuración por defecto está en `service/src/main/resources/application.properties`:

```properties
spring.datasource.url=jdbc:mysql://localhost:3306/ecochain?useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=UTC
spring.datasource.username=root
spring.datasource.password=root
```

Si tu contraseña de MySQL es distinta, cámbiala ahí o usa variables de entorno:

```powershell
$env:SPRING_DATASOURCE_PASSWORD="TU_PASSWORD"
```

### 2. Backend

```powershell
cd service
mvn spring-boot:run
```

Disponible en http://localhost:8080

### 3. Frontend

```powershell
cd client
npm install
npm run dev
```

Disponible en http://localhost:5173 (Vite hace proxy de `/api` hacia el puerto 8080).

## API principal

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/api/dashboard?anio=2026` | KPIs, serie mensual, top áreas/materiales/motivos y `aniosDisponibles`. |
| GET | `/api/lotes` | Lista lotes. Filtros: `estado`, `idArea`, `idMaterial`, `desde`, `hasta`, `anio`. |
| GET | `/api/lotes/disponibles` | Lotes en almacén listos para envío. |
| GET | `/api/lotes/{id}` | Detalle de un lote. |
| POST | `/api/lotes` | Crea un lote. |
| PUT | `/api/lotes/{id}` | Actualiza un lote (solo si no fue enviado). |
| DELETE | `/api/lotes/{id}` | Elimina un lote (solo si no fue enviado). |
| GET/POST/PUT/DELETE | `/api/materiales` | Catálogo de materiales y costo por kg. |
| GET/POST/PUT/DELETE | `/api/areas` | Catálogo de áreas y máquinas. |
| GET | `/api/envios` | Historial de envíos con sus lotes. |
| POST | `/api/envios` | Crea un envío y marca los lotes como `ENVIADO`. |
| DELETE | `/api/envios/{id}` | Revierte el envío y regresa los lotes a `EN_ALMACEN`. |

Ejemplo de `POST /api/lotes`:

```json
{
  "kilos": 12.5,
  "fecha": "2026-11-25",
  "idMaterial": 1,
  "idArea": 1,
  "motivo": "FALLA_CALIBRACION",
  "observaciones": "Detectado al cambiar el molde"
}
```

Ejemplo de `POST /api/envios`:

```json
{
  "fecha": "2026-11-25",
  "recicladora": "Recicladora Delta",
  "montoRecuperado": 850.0,
  "notas": "Factura A-1024",
  "loteIds": [1, 2, 3]
}
```

## Autenticación y permisos

El sistema funciona con **sesiones por token** y dos roles:

| Rol | Módulos que ve | Pued hacer |
|---|---|---|
| **Operador** | Registro de merma | Alta, edición y eliminación de lotes. Sin ver el dashboard ni ajustar catálogos. |
| **Administrador** | Panel ejecutivo, Catálogos y costos, Salida a reciclaje | Consultar y ver los datos, nada de registro de merma. |

Endpoints de autenticación:

```
POST /api/auth/login   { "email": "...", "password": "..." } → { "token", "usuario" }
GET  /api/auth/me
POST /api/auth/logout
```

- El token se guarda en `localStorage` y se envía en el header `Authorization: Bearer ...` (token devuelto en el login).
- Debe iniciar sesión con las credenciales de demo (o con las de un usuario real, creado directamente en la base de datos `usuarios`).

El interceptor de Spring (`AuthInterceptor`) bloquea cualquier `/api/**` sin token, y la anotación `@RequiereRol` restringe cada acción (casos de rol incorrecto se devuelven con `{"status":403,"error":"Forbidden","message":"..."}`).

### Usuarios de demo (generados automáticamente si no existen)

```
admin@ecochain.mx / admin123          → ADMINISTRADOR
operador@ecochain.mx / operador123    → OPERADOR
```

Cámbialos desde la base de datos en la tabla `usuarios` (columna `password_hash`).

## Filtros de registro de merma

El registro de merma muestra los lotes con filtros por:

- **Año** (lote creados con fechas futuras o pasadas: 2027, 2023).
- **Desde** / **Hasta** (fechas libres).
- Estado, área, material y búsqueda por texto.

## Datos de demostración

`ecochain.seed-demo=true` (valor por defecto):

- Si los catálogos están vacíos, crea materiales y áreas de ejemplo.
- Si **no hay ningún lote**, genera lotes de ejemplo del año actual y anterior, más dos envíos a reciclaje.
- Si ya tienes lotes, no los toca: solo normaliza estados viejos a `EN_ALMACEN` y motivos vacíos a `OTRO`.

Para arrancar sin datos de ejemplo:

```properties
ecochain.seed-demo=false
```

## Detalles técnicos

- **Hibernate** crea/actualiza el esquema (`ddl-auto=update`); no hace falta ejecutar SQL de tablas.
- **Gráficas** hechas con SVG puro, sin librerías adicionales.
- **CORS** habilitado con `@CrossOrigin(origins = "*")`.
- **Nginx** hace proxy de `/api/` al contenedor `backend` en Docker.
- Los errores de negocio (material en uso, lote ya enviado, etc.) regresan `400`, `404` o `409` con un mensaje claro en `message`.
