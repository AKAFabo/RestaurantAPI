# Configuración y Uso de Metabase

## Descripción

Metabase es la herramienta de visualización utilizada para construir los dashboards del proyecto. Se conecta directamente a la base de datos PostgreSQL utilizada por el sistema y permite crear consultas, gráficos y dashboards interactivos

---

# Requisitos Previos

Antes de iniciar Metabase deben estar ejecutándose:

- PostgreSQL (`db`)
- Metabase (`metabase`)


---

# Iniciar Metabase

Si el contenedor no está ejecutándose:

```bash
docker compose up -d metabase
```

Verificar estado:

```bash
docker ps
```

---

# Acceso a Metabase

Abrir en el navegador:

```text
http://localhost:3000
```

---

# Configuración Inicial

La primera vez que se ejecuta Metabase se solicita:

## Crear usuario administrador

Completar:

- Nombre
- Correo electrónico
- Contraseña

---

# Conexión a PostgreSQL

Seleccionar:

```text
PostgreSQL
```

Configurar:

| Campo | Valor |
|---------|---------|
| Host | postgres_db |
| Puerto | 5432 |
| Base de Datos | restaurant_db |
| Usuario | postgres |
| Contraseña | postgres |

> Los valores deben ajustarse según las variables definidas en el archivo `.env`.

Guardar conexión.

---
# Consultas SQL Utilizadas

Los dashboards fueron construidos utilizando consultas SQL almacenadas en la carpeta:

```text
dashboard/sql/
```

Archivos disponibles:

## ingresos.sql

Utilizado para generar el Dashboard 1:

```text
Ingresos por mes y categoría de producto
```

Este dashboard permite visualizar:

- Ingresos generados por mes.
- Distribución de ventas por categoría de producto.

---

## zonas.sql

Utilizado para generar el Dashboard 2:

```text
Actividad de clientes por zona geográfica
```

Este dashboard permite visualizar:

- Cantidad de pedidos por zona.
- Actividad de los clientes según ubicación.


---

## EstadisticasPedidos.sql

Utilizado para generar el Dashboard 3:

```text
Estadísticas de pedidos completados vs cancelados
```

Este dashboard permite visualizar:

- Cantidad de pedidos completados.
- Cantidad de pedidos cancelados.


---

# Creación de Consultas SQL

Seleccionar:

```text
+ New
```

Luego:

```text
SQL Query
```

Elegir la base de datos PostgreSQL configurada.

---

# Creación de Visualizaciones

Una vez obtenidos los datos:

Seleccionar:

```text
Visualization
```

Elegir el tipo de gráfico:

- Barras
- Líneas
- Pastel
- Tabla
- Área
- Indicadores

Configurar los ejes según corresponda.

Guardar la visualización.

---

# Creación de Dashboards

Seleccionar:

```text
+ New Dashboard
```

Asignar nombre al dashboard.



Agregar visualizaciones previamente guardadas.

---

# Dashboards Implementados

## Dashboard 1

Ingresos por mes y categoría de producto.

Muestra:

- Ventas mensuales
- Categorías de productos
- Ingresos generados

---

## Dashboard 2

Actividad de clientes por zona geográfica.

Muestra:

- Cantidad de pedidos por zona
- Ingresos generados por ubicación

---

## Dashboard 3

Pedidos completados versus cancelados.

Muestra:

- Distribución de estados de pedidos
- Evolución mensual de estados

---
