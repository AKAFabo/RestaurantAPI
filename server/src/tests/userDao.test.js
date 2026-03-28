import userDAO from "../daos/userDao.js";
import { pool } from "../config/database.js";
import * as keycloakService from "../services/keycloakService.js";

jest.mock("../config/database.js", () => ({
  pool: {
    query: jest.fn()
  }
}));

jest.mock("../services/keycloakService.js");

describe("getUserById", () => {

  beforeEach(() => {
    jest.clearAllMocks();
  });

  //  Caso exitoso
  it("debe devolver un usuario por id", async () => {

    const fakeUser = { id: 1, email: "test@mail.com", name: "Test" };

    pool.query.mockResolvedValue({ rows: [fakeUser] });

    const result = await userDAO.getUserById(1);

    expect(pool.query).toHaveBeenCalledWith("SELECT * FROM users WHERE id = $1", [1]);
    expect(result).toEqual(fakeUser);
  });

  //  No existe
  it("debe devolver undefined si no existe", async () => {

    pool.query.mockResolvedValue({ rows: [] });

    const result = await userDAO.getUserById(99);

    expect(result).toBeUndefined();
  });

});


describe("getUsers", () => {

  beforeEach(() => {
    jest.clearAllMocks();
  });

  //  Caso exitoso
  it("debe devolver la lista de usuarios", async () => {

    const fakeUsers = [
      { id: 1, email: "a@mail.com", name: "User A" },
      { id: 2, email: "b@mail.com", name: "User B" }
    ];

    pool.query.mockResolvedValue({ rows: fakeUsers });

    const result = await userDAO.getUsers();

    expect(pool.query).toHaveBeenCalledWith("SELECT * FROM users");
    expect(result).toEqual(fakeUsers);
  });

  //  Error de BD
  it("debe lanzar error si falla la consulta", async () => {

    pool.query.mockRejectedValue(new Error("DB error"));

    await expect(userDAO.getUsers()).rejects.toThrow("DB error");
  });

});


describe("registerUser", () => {

  beforeEach(() => {
    jest.clearAllMocks();
  });

  //  Caso exitoso
  it("debe registrar un usuario correctamente", async () => {

    const fakeUser = { id: 1, email: "test@mail.com", name: "Test" };

    keycloakService.createKeycloakUser.mockResolvedValue();
    pool.query.mockResolvedValue({ rows: [fakeUser] });

    const result = await userDAO.registerUser({
      email: "test@mail.com",
      name: "Test",
      password: "123456"
    });

    expect(keycloakService.createKeycloakUser).toHaveBeenCalledWith({
      email: "test@mail.com",
      name: "Test",
      password: "123456"
    });
    expect(pool.query).toHaveBeenCalledWith(
      expect.stringContaining("INSERT INTO users"),
      expect.arrayContaining(["test@mail.com", "Test"])
    );
    expect(result).toEqual(fakeUser);
  });

  //  Error en Keycloak
  it("debe lanzar error si falla Keycloak", async () => {

    keycloakService.createKeycloakUser.mockRejectedValue(new Error("KC error"));

    await expect(userDAO.registerUser({
      email: "test@mail.com",
      name: "Test",
      password: "123456"
    })).rejects.toThrow("KC error");
  });

  //  Error en BD
  it("debe lanzar error si falla la inserción en BD", async () => {

    keycloakService.createKeycloakUser.mockResolvedValue();
    pool.query.mockRejectedValue(new Error("DB error"));

    await expect(userDAO.registerUser({
      email: "test@mail.com",
      name: "Test",
      password: "123456"
    })).rejects.toThrow("DB error");
  });

});


describe("getByEmail", () => {

  beforeEach(() => {
    jest.clearAllMocks();
  });

  //  Caso exitoso
  it("debe devolver un usuario por email", async () => {

    const fakeUser = { id: 1, email: "test@mail.com", name: "Test" };

    pool.query.mockResolvedValue({ rows: [fakeUser] });

    const result = await userDAO.getByEmail("test@mail.com");

    expect(pool.query).toHaveBeenCalledWith(
      expect.stringContaining("WHERE email"),
      ["test@mail.com"]
    );
    expect(result).toEqual(fakeUser);
  });

  //  No existe
  it("debe devolver undefined si no existe", async () => {

    pool.query.mockResolvedValue({ rows: [] });

    const result = await userDAO.getByEmail("noexiste@mail.com");

    expect(result).toBeUndefined();
  });

  //  Error de BD
  it("debe lanzar error si falla la consulta", async () => {

    pool.query.mockRejectedValue(new Error("DB error"));

    await expect(userDAO.getByEmail("test@mail.com")).rejects.toThrow("DB error");
  });

});


describe("updateUser", () => {

  beforeEach(() => {
    jest.clearAllMocks();
  });

  //  Caso exitoso
  it("debe actualizar un usuario correctamente", async () => {

    const fakeUser = { id: 1, email: "new@mail.com", name: "New" };

    pool.query.mockResolvedValue({ rows: [fakeUser] });

    const result = await userDAO.updateUser(1, {
      email: "new@mail.com",
      name: "New",
      password: "newpass"
    });

    expect(pool.query).toHaveBeenCalledWith(
      expect.stringContaining("UPDATE users"),
      expect.arrayContaining(["new@mail.com", "New", 1])
    );
    expect(result).toEqual(fakeUser);
  });

  //  Error de BD
  it("debe lanzar error si falla la consulta", async () => {

    pool.query.mockRejectedValue(new Error("DB error"));

    await expect(userDAO.updateUser(1, {
      email: "new@mail.com",
      name: "New",
      password: "newpass"
    })).rejects.toThrow("DB error");
  });

});


describe("deleteUser", () => {

  beforeEach(() => {
    jest.clearAllMocks();
  });

  //  Caso exitoso
  it("debe eliminar un usuario correctamente", async () => {

    pool.query.mockResolvedValue({ rows: [] });

    await userDAO.deleteUser(1);

    expect(pool.query).toHaveBeenCalledWith("DELETE FROM users WHERE id = $1", [1]);
  });

  //  Error de BD
  it("debe lanzar error si falla la consulta", async () => {

    pool.query.mockRejectedValue(new Error("DB error"));

    await expect(userDAO.deleteUser(1)).rejects.toThrow("DB error");
  });

});
