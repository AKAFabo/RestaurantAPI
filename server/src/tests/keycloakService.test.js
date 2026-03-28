import { createKeycloakUser, updateKeycloakUser, deleteKeycloakUser } from "../services/keycloakService.js";
import axios from "axios";

jest.mock("axios");

const KEYCLOAK_URL = process.env.KEYCLOAK_URL || "http://keycloak:8080";
const REALM = process.env.KEYCLOAK_REALM || "restaurant-realm";

describe("createKeycloakUser", () => {

  beforeEach(() => {
    jest.clearAllMocks();
  });

  //  Caso exitoso
  it("debe crear un usuario en Keycloak", async () => {

    // getAdminToken
    axios.post.mockResolvedValueOnce({ data: { access_token: "admin-token" } });
    // create user
    axios.post.mockResolvedValueOnce({});
    // getUserIdByEmail
    axios.get.mockResolvedValueOnce({ data: [{ id: "kc-user-id" }] });
    // getRole
    axios.get.mockResolvedValueOnce({ data: { id: "role-id", name: "client" } });
    // assignRoleToUser
    axios.post.mockResolvedValueOnce({});

    await createKeycloakUser({ email: "test@mail.com", password: "123456", name: "Test" });

    // getAdminToken call
    expect(axios.post).toHaveBeenCalledWith(
      expect.stringContaining("/realms/master/protocol/openid-connect/token"),
      expect.any(URLSearchParams),
      expect.any(Object)
    );

    // create user call
    expect(axios.post).toHaveBeenCalledWith(
      expect.stringContaining(`/admin/realms/${REALM}/users`),
      expect.objectContaining({
        username: "test@mail.com",
        email: "test@mail.com",
        enabled: true,
        firstName: "Test"
      }),
      expect.any(Object)
    );
  });

  //  Error al obtener admin token
  it("debe lanzar error si falla la obtención del admin token", async () => {

    axios.post.mockRejectedValueOnce(new Error("KC unavailable"));

    await expect(createKeycloakUser({
      email: "test@mail.com",
      password: "123456",
      name: "Test"
    })).rejects.toThrow("KC unavailable");
  });

});


describe("updateKeycloakUser", () => {

  beforeEach(() => {
    jest.clearAllMocks();
  });

  //  Caso exitoso
  it("debe actualizar un usuario en Keycloak", async () => {

    // getAdminToken
    axios.post.mockResolvedValueOnce({ data: { access_token: "admin-token" } });
    // getUserIdByEmail
    axios.get.mockResolvedValueOnce({ data: [{ id: "kc-user-id" }] });
    // update user info
    axios.put.mockResolvedValueOnce({});
    // reset password
    axios.put.mockResolvedValueOnce({});

    await updateKeycloakUser("old@mail.com", {
      email: "new@mail.com",
      name: "New Name",
      password: "newpass"
    });

    // update user call
    expect(axios.put).toHaveBeenCalledWith(
      expect.stringContaining("/users/kc-user-id"),
      expect.objectContaining({ firstName: "New Name", email: "new@mail.com" }),
      expect.any(Object)
    );

    // reset password call
    expect(axios.put).toHaveBeenCalledWith(
      expect.stringContaining("/users/kc-user-id/reset-password"),
      expect.objectContaining({ type: "password", value: "newpass", temporary: false }),
      expect.any(Object)
    );
  });

  //  Usuario no encontrado en Keycloak
  it("debe lanzar error si el usuario no existe en Keycloak", async () => {

    // getAdminToken
    axios.post.mockResolvedValueOnce({ data: { access_token: "admin-token" } });
    // getUserIdByEmail retorna vacío
    axios.get.mockResolvedValueOnce({ data: [] });

    await expect(updateKeycloakUser("noexiste@mail.com", {
      email: "new@mail.com",
      name: "New",
      password: "newpass"
    })).rejects.toThrow("User not found in Keycloak");
  });

});


describe("deleteKeycloakUser", () => {

  beforeEach(() => {
    jest.clearAllMocks();
  });

  //  Caso exitoso
  it("debe eliminar un usuario de Keycloak", async () => {

    // getAdminToken
    axios.post.mockResolvedValueOnce({ data: { access_token: "admin-token" } });
    // getUserIdByEmail
    axios.get.mockResolvedValueOnce({ data: [{ id: "kc-user-id" }] });
    // delete user
    axios.delete.mockResolvedValueOnce({});

    await deleteKeycloakUser("test@mail.com");

    expect(axios.delete).toHaveBeenCalledWith(
      expect.stringContaining("/users/kc-user-id"),
      expect.any(Object)
    );
  });

  //  Usuario no encontrado
  it("debe lanzar error si el usuario no existe en Keycloak", async () => {

    // getAdminToken
    axios.post.mockResolvedValueOnce({ data: { access_token: "admin-token" } });
    // getUserIdByEmail retorna vacío
    axios.get.mockResolvedValueOnce({ data: [] });

    await expect(deleteKeycloakUser("noexiste@mail.com"))
      .rejects.toThrow("User not found in Keycloak");
  });

  //  Error de conexión
  it("debe lanzar error si falla la conexión a Keycloak", async () => {

    axios.post.mockRejectedValueOnce(new Error("KC unavailable"));

    await expect(deleteKeycloakUser("test@mail.com"))
      .rejects.toThrow("KC unavailable");
  });

});
