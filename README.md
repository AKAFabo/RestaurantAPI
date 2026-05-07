# Reserva Inteligente de Restaurantes API — Etapa 2

# Integrantes
- Catherin Madriz
- Fabricio Herrera

---

# Descripción del Proyecto

API REST desarrollada para la gestión de restaurantes, reservas, menús, productos y pedidos.

La arquitectura fue evolucionada hacia un entorno distribuido y escalable utilizando microservicios, balanceo de carga, caché, motor de búsqueda y soporte multi-base de datos.

El sistema permite:

- Gestión de usuarios y autenticación
- Administración de menús y productos
- Gestión de reservas y pedidos
- Búsquedas avanzadas mediante ElasticSearch
- Cacheo de respuestas frecuentes con Redis
- Escalabilidad horizontal mediante Docker Compose 
- Compatibilidad dinámica con PostgreSQL o MongoDB 
- Replicación y sharding en MongoDB
- Integración continua y despliegue continuo (CI/CD)

La autenticación se realiza mediante JWT utilizando Keycloak 

---

# Tecnologías Utilizadas

## Backend
- Node.js
- Express

## Bases de Datos
- PostgreSQL
- MongoDB

## Seguridad
- Keycloak
- JWT

## Infraestructura
- Docker
- Docker Compose
- Nginx

## Cache y Búsqueda
- Redis
- ElasticSearch

## Testing
- Jest
- Supertest

## CI/CD
- GitHub Actions

## Documentación
- Swagger

---

## Componentes Principales

- API Principal
- Microservicio de Búsqueda
- ElasticSearch
- Redis
- PostgreSQL
- MongoDB Cluster
- Keycloak
- Nginx Load Balancer

---

# Arquitectura Lógica

La aplicación sigue una arquitectura en capas:

- Routes → Definición de endpoints
- Controllers → Manejo de solicitudes HTTP
- Services → Lógica de negocio
- DAOs / Repositories → Acceso a datos
- Database Layer → Conexión dinámica a PostgreSQL o MongoDB
- Middleware → Autenticación, autorización y caché
- Search Service → Integración con ElasticSearch
- Redis Cache → Respuestas frecuentes

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

##  URL Base del api principal 
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

## Endpoints del Search-Service
- GET /search/products?q=texto
- GET /search/products/category/:categoria
- POST /search/reindex—Reindexarproductosmanualmente. 


##  URL del search-service
```
http://localhost:4000/search 

--- 

## URL principal del sistema 
http://localhost/search/? 

http://localhost/api/?

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

# Compatibilidad PostgreSQL / MongoDB

Para cambiar entre motores de las bases de datos se hace mediante una variable de entorno en el .env

```env
DB=mongo / postgres

---




```
## Levantar el sistema con mongo 
Se levanta el compose con los 2 sharding y sus respectivas replicas 
- docker compose --profile full up

## Escalar servicios manualmente y ver el balanceo
Se levanta la cantidad de contenedores de la api y del search-service que se indiquen en el comando 
- docker-compose up --scale api=3 --scale search-service=2

## Servicio completo 
Si se quiere levantar el mongo con sharding y tambien varias instancias de los microservicios 
- docker-compose --profile full up --build --scale app=3 --scale search-service=2 



