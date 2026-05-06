// mockKeycloak.js
// Usuarios falsos para inyectar en req.kauth durante pruebas

export const mockAdminUser = {
  email: "carlos.vindas@lasazontica.com",
  realm_access: { roles: ["admin"] }
};

export const mockClientUser = {
  email: "carlos.mora@lasazontica.com",
  realm_access: { roles: ["user"] }
};