import userController from "../controllers/userController.js";
import * as userDAO from "../daos/userDao.js";
import * as keycloakService from "../services/keycloakService.js";
import axios from "axios";

jest.mock("../daos/userDao.js");
jest.mock("../services/keycloakService.js");
jest.mock("axios");

// Helper: default export is an object, so we reference userDAO.default
const dao = userDAO.default;

describe("getUsers", () => {

  //  Caso exitoso
  it("debe devolver la lista de usuarios", async () => {

    const fakeUsers = [
      { id: 1, email: "a@mail.com", name: "User A" },
      { id: 2, email: "b@mail.com", name: "User B" }
    ];

    dao.getUsers.mockResolvedValue(fakeUsers);

    const req = {};
    const res = {
      json: jest.fn()
    };

    await userController.getUsers(req, res);

    expect(dao.getUsers).toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith(fakeUsers);
  });

  //  Error interno
  it("debe devolver 500 si ocurre un error", async () => {

    dao.getUsers.mockRejectedValue(new Error("DB error"));

    const req = {};
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };

    await userController.getUsers(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: "Error fetching users" });
  });

});


describe("registerUser", () => {

  //  Caso exitoso
  it("debe registrar un usuario correctamente", async () => {

    const fakeUser = { id: 1, email: "test@mail.com", name: "Test" };

    dao.registerUser.mockResolvedValue(fakeUser);

    const req = {
      body: { email: "test@mail.com", name: "Test", password: "123456" }
    };

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };

    await userController.registerUser(req, res);

    expect(dao.registerUser).toHaveBeenCalledWith({
      email: "test@mail.com",
      name: "Test",
      password: "123456"
    });
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(fakeUser);
  });

  //  Faltan datos
  it("debe devolver 400 si faltan datos", async () => {

    const req = {
      body: { email: "test@mail.com" }
    };

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };

    await userController.registerUser(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: "Email, name and password are required" });
  });

  //  Error interno
  it("debe devolver 500 si ocurre un error", async () => {

    dao.registerUser.mockRejectedValue(new Error("DB error"));

    const req = {
      body: { email: "test@mail.com", name: "Test", password: "123456" }
    };

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };

    await userController.registerUser(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: "Error registering user" });
  });

});


describe("authUser", () => {

  //  Caso exitoso
  it("debe autenticar un usuario correctamente", async () => {

    const fakeTokenData = { access_token: "abc123", token_type: "Bearer" };

    axios.post.mockResolvedValue({ data: fakeTokenData });

    const req = {
      body: { email: "test@mail.com", password: "123456" }
    };

    const res = {
      json: jest.fn()
    };

    await userController.authUser(req, res);

    expect(axios.post).toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith(fakeTokenData);
  });

  //  Faltan datos
  it("debe devolver 400 si faltan datos", async () => {

    const req = {
      body: { email: "test@mail.com" }
    };

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };

    await userController.authUser(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: "Email and password are required" });
  });

  //  Credenciales inválidas
  it("debe devolver 401 si las credenciales son inválidas", async () => {

    axios.post.mockRejectedValue(new Error("Invalid credentials"));

    const req = {
      body: { email: "test@mail.com", password: "wrong" }
    };

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };

    await userController.authUser(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: "Invalid email or password" });
  });

});


describe("getMe", () => {

  //  Caso exitoso
  it("debe devolver la info del usuario autenticado", async () => {

    const fakeDbUser = { id: 1, email: "test@mail.com", name: "Test" };

    dao.getByEmail.mockResolvedValue(fakeDbUser);

    const req = {
      kauth: {
        grant: {
          access_token: {
            content: {
              email: "test@mail.com",
              realm_access: { roles: ["client"] }
            }
          }
        }
      }
    };

    const res = {
      json: jest.fn()
    };

    await userController.getMe(req, res);

    expect(dao.getByEmail).toHaveBeenCalledWith("test@mail.com");
    expect(res.json).toHaveBeenCalledWith({
      email: "test@mail.com",
      name: "Test",
      id: 1,
      roles: ["client"]
    });
  });

  //  Usuario no encontrado en BD
  it("debe devolver 404 si el usuario no existe en la BD", async () => {

    dao.getByEmail.mockResolvedValue(null);

    const req = {
      kauth: {
        grant: {
          access_token: {
            content: {
              email: "noexiste@mail.com",
              realm_access: { roles: [] }
            }
          }
        }
      }
    };

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };

    await userController.getMe(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: "User not found in database" });
  });

  //  Error interno
  it("debe devolver 500 si ocurre un error", async () => {

    dao.getByEmail.mockRejectedValue(new Error("DB error"));

    const req = {
      kauth: {
        grant: {
          access_token: {
            content: { email: "test@mail.com" }
          }
        }
      }
    };

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };

    await userController.getMe(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: "Error fetching user info" });
  });

});


describe("updateUser", () => {

  //  Caso exitoso
  it("debe actualizar un usuario correctamente", async () => {

    const fakeCurrentUser = { id: 1, email: "old@mail.com", name: "Old" };
    const fakeUpdatedUser = { id: 1, email: "new@mail.com", name: "New" };

    dao.getUserById.mockResolvedValue(fakeCurrentUser);
    keycloakService.updateKeycloakUser.mockResolvedValue();
    dao.updateUser.mockResolvedValue(fakeUpdatedUser);

    const req = {
      params: { id: 1 },
      body: { email: "new@mail.com", name: "New", password: "newpass" }
    };

    const res = {
      json: jest.fn()
    };

    await userController.updateUser(req, res);

    expect(dao.getUserById).toHaveBeenCalledWith(1);
    expect(keycloakService.updateKeycloakUser).toHaveBeenCalledWith("old@mail.com", {
      email: "new@mail.com",
      name: "New",
      password: "newpass"
    });
    expect(dao.updateUser).toHaveBeenCalledWith(1, {
      email: "new@mail.com",
      name: "New",
      password: "newpass"
    });
    expect(res.json).toHaveBeenCalledWith(fakeUpdatedUser);
  });

  //  Faltan datos
  it("debe devolver 400 si faltan datos", async () => {

    const req = {
      params: { id: 1 },
      body: { email: "test@mail.com" }
    };

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };

    await userController.updateUser(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: "Email, name and password are required" });
  });

  //  Usuario no existe
  it("debe devolver 404 si el usuario no existe", async () => {

    dao.getUserById.mockResolvedValue(null);

    const req = {
      params: { id: 99 },
      body: { email: "new@mail.com", name: "New", password: "newpass" }
    };

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };

    await userController.updateUser(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: "User not found" });
  });

  //  Error interno
  it("debe devolver 500 si ocurre un error", async () => {

    dao.getUserById.mockResolvedValue({ id: 1, email: "old@mail.com" });
    keycloakService.updateKeycloakUser.mockRejectedValue(new Error("KC error"));

    const req = {
      params: { id: 1 },
      body: { email: "new@mail.com", name: "New", password: "newpass" }
    };

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };

    await userController.updateUser(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: "Error updating user" });
  });

});


describe("deleteUser", () => {

  //  Caso exitoso
  it("debe eliminar un usuario correctamente", async () => {

    dao.getUserById.mockResolvedValue({ id: 1, email: "test@mail.com" });
    keycloakService.deleteKeycloakUser.mockResolvedValue();
    dao.deleteUser.mockResolvedValue();

    const req = {
      params: { id: 1 }
    };

    const res = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn()
    };

    await userController.deleteUser(req, res);

    expect(dao.getUserById).toHaveBeenCalledWith(1);
    expect(keycloakService.deleteKeycloakUser).toHaveBeenCalledWith("test@mail.com");
    expect(dao.deleteUser).toHaveBeenCalledWith(1);
    expect(res.status).toHaveBeenCalledWith(204);
    expect(res.send).toHaveBeenCalled();
  });

  //  Usuario no existe
  it("debe devolver 404 si el usuario no existe", async () => {

    dao.getUserById.mockResolvedValue(null);

    const req = {
      params: { id: 99 }
    };

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };

    await userController.deleteUser(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: "User not found" });
  });

  //  Error interno
  it("debe devolver 500 si ocurre un error", async () => {

    dao.getUserById.mockResolvedValue({ id: 1, email: "test@mail.com" });
    keycloakService.deleteKeycloakUser.mockRejectedValue(new Error("KC error"));

    const req = {
      params: { id: 1 }
    };

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };

    await userController.deleteUser(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
  });

});
