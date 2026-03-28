#  Reserva Inteligente de Restaurantes API

##  Descripción del Proyecto
API REST desarrollada  para la gestión de reservas en restaurantes. Permite manejar usuarios, autenticación, menús, reservas y pedidos.

Incluye autenticación basada en JWT mediante Keycloak, contenedorización con Docker y pruebas unitarias e integración.

---

## Tecnologías Utilizadas
- Node.js
- Express
- PostgreSQL
- Keycloak
- Docker
- Jest / Supertest
- Swagger

---

## Arquitectura
La aplicación sigue una arquitectura en capas:

- **Routes** → Definición de endpoints
- **Controllers** → Lógica de negocio
- **Database** → Conexión a PostgreSQL
- **Middleware** → Autenticación con Keycloak

---

##  Estructura del Proyecto
```
src/
 ├── controllers/
 ├── routes/
 ├── config/
 ├── keycloak/
 ├── tests/
 |__ services/
 ├── db/
 |── docs/
 |── daos/
 └── server,js
```

---

##  Requisitos Previos
- Node.js instalado
- Docker instalado
- Levantar el Docker Compose 

---


##  Autenticación con Keycloak

La autenticación se delega a Keycloak, el cual actúa como proveedor de identidad. 

Keycloak genera un token JWT (JSON Web Token) que contiene información del usuario, como:

- Identidad del usuario (id, username)
- Roles y permisos
- Tiempo de expiración

Este token es firmado digitalmente para garantizar su integridad.

El cliente obtiene este token JWT tras autenticarse y lo utiliza en cada solicitud a la API. El backend valida este token mediante middleware, asegurando su integridad y verificando los permisos del usuario sin manejar credenciales directamente

### Roles
- **admin** 
- **client** 

---

##  URL Base
```
http://localhost:3001/api
```

---

## Endpoints 

### Auth
- POST /auth/register
- POST /auth/login

### Users
- GET /users/me
- PUT /users/:id
- DELETE /users/:id

### Menus
- GET /menus/:id
- PUT /menus/:id (admin)
- DELETE /menus/:id (admin)

### Reservations
- POST /reservations (client)
- DELETE /reservations/:id (client)

### Orders
- POST /orders (client)
- GET /orders/:id

---

## Swagger
Documentación disponible en:
```
http://localhost:3001/api-docs
```

---

##  Pruebas
Se utilizo Jest / Supertest para la realizacion de las pruebas 

Comando para ejecutar pruebas:
```
npm test
```

Incluye:
- Pruebas unitarias
- Pruebas de integración


---

##  Docker

### Dockerfile
La API se encuentra contenerizada en el dockerfile

---

## Docker Compose

### Ejecutar servicios
```
docker-compose up -d
```

### Servicios incluidos:
- PostgreSQL
- Adminer
- Keycloak
- Dockerfile

---

##  Base de Datos

Se utiliza PostgreSQL como motor de base de datos.

Adminer disponible en:
```
http://localhost:1212
```

---

## Notas Finales

- Asegurarse de que Keycloak esté corriendo antes de probar endpoints protegidos
- Verificar que el token no esté expirado
- Usar rol adecuado según endpoint

---


