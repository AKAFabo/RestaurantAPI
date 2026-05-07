// userService.test.js
// Pruebas unitarias del UserService
// Verifica lógica de negocio y uso de cache

import UserService from "../../services/user.service.js";

import {
  invalidateUsersCache,
  invalidateUserCache
} from "../../middlewares/cacheHelper.js";


// Mock del helper de cache
jest.mock("../../middlewares/cacheHelper.js", () => ({
  invalidateUsersCache: jest.fn(),
  invalidateUserCache: jest.fn(),
}));


// ─────────────────────────────────────────────
// SETUP: DAO falso
// ─────────────────────────────────────────────

const createMockUserDAO = () => ({
  getUserById: jest.fn(),
  getUsers: jest.fn(),
  registerUser: jest.fn(),
  getByEmail: jest.fn(),
  updateUser: jest.fn(),
  deleteUser: jest.fn(),
});


// ─────────────────────────────────────────────
// PRUEBAS: getUserById
// ─────────────────────────────────────────────

describe("UserService - getUserById", () => {

  let userService;
  let mockUserDAO;

  beforeEach(() => {

    mockUserDAO = createMockUserDAO();

    userService = new UserService(
      mockUserDAO
    );

    jest.clearAllMocks();
  });

  it("debe retornar un usuario por id", async () => {

    const fakeUser = {
      id: 1,
      email: "test@test.com",
      name: "Luis"
    };

    mockUserDAO.getUserById
      .mockResolvedValue(fakeUser);

    const result = await userService.getUserById(1);

    expect(mockUserDAO.getUserById)
      .toHaveBeenCalledWith(1);

    expect(result).toEqual({
      user: fakeUser
    });
  });

  it("debe propagar el error si el DAO falla", async () => {

    mockUserDAO.getUserById
      .mockRejectedValue(new Error("DB error"));

    await expect(
      userService.getUserById(1)
    ).rejects.toThrow("DB error");
  });

});


// ─────────────────────────────────────────────
// PRUEBAS: getUsers
// ─────────────────────────────────────────────

describe("UserService - getUsers", () => {

  let userService;
  let mockUserDAO;

  beforeEach(() => {

    mockUserDAO = createMockUserDAO();

    userService = new UserService(
      mockUserDAO
    );

    jest.clearAllMocks();
  });

  it("debe retornar todos los usuarios", async () => {

    const fakeUsers = [
      {
        id: 1,
        name: "Luis"
      },
      {
        id: 2,
        name: "Fabricio"
      }
    ];

    mockUserDAO.getUsers
      .mockResolvedValue(fakeUsers);

    const result = await userService.getUsers();

    expect(mockUserDAO.getUsers)
      .toHaveBeenCalled();

    expect(result).toEqual({
      users: fakeUsers
    });
  });

  it("debe propagar el error si el DAO falla", async () => {

    mockUserDAO.getUsers
      .mockRejectedValue(new Error("DB error"));

    await expect(
      userService.getUsers()
    ).rejects.toThrow("DB error");
  });

});


// ─────────────────────────────────────────────
// PRUEBAS: registerUser
// ─────────────────────────────────────────────

describe("UserService - registerUser", () => {

  let userService;
  let mockUserDAO;

  beforeEach(() => {

    mockUserDAO = createMockUserDAO();

    userService = new UserService(
      mockUserDAO
    );

    jest.clearAllMocks();
  });

  it("debe registrar un usuario correctamente", async () => {

    const fakeUser = {
      id: 1,
      email: "test@test.com",
      name: "Luis"
    };

    mockUserDAO.registerUser
      .mockResolvedValue(fakeUser);

    const result = await userService.registerUser({
      email: "test@test.com",
      name: "Luis",
      password: "123456"
    });

    expect(mockUserDAO.registerUser)
      .toHaveBeenCalledWith({
        email: "test@test.com",
        name: "Luis",
        password: "123456"
      });

    expect(invalidateUsersCache)
      .toHaveBeenCalled();

    expect(result).toEqual({
      user: fakeUser
    });
  });

  it("debe propagar el error si el DAO falla", async () => {

    mockUserDAO.registerUser
      .mockRejectedValue(new Error("DB error"));

    await expect(
      userService.registerUser({
        email: "test@test.com",
        name: "Luis",
        password: "123456"
      })
    ).rejects.toThrow("DB error");

    expect(invalidateUsersCache)
      .not.toHaveBeenCalled();
  });

});


// ─────────────────────────────────────────────
// PRUEBAS: getByEmail
// ─────────────────────────────────────────────

describe("UserService - getByEmail", () => {

  let userService;
  let mockUserDAO;

  beforeEach(() => {

    mockUserDAO = createMockUserDAO();

    userService = new UserService(
      mockUserDAO
    );

    jest.clearAllMocks();
  });

  it("debe retornar un usuario por email", async () => {

    const fakeUser = {
      id: 1,
      email: "test@test.com"
    };

    mockUserDAO.getByEmail
      .mockResolvedValue(fakeUser);

    const result = await userService.getByEmail(
      "test@test.com"
    );

    expect(mockUserDAO.getByEmail)
      .toHaveBeenCalledWith("test@test.com");

    expect(result).toEqual({
      user: fakeUser
    });
  });

  it("debe propagar el error si el DAO falla", async () => {

    mockUserDAO.getByEmail
      .mockRejectedValue(new Error("DB error"));

    await expect(
      userService.getByEmail("test@test.com")
    ).rejects.toThrow("DB error");
  });

});


// ─────────────────────────────────────────────
// PRUEBAS: updateUser
// ─────────────────────────────────────────────

describe("UserService - updateUser", () => {

  let userService;
  let mockUserDAO;

  beforeEach(() => {

    mockUserDAO = createMockUserDAO();

    userService = new UserService(
      mockUserDAO
    );

    jest.clearAllMocks();
  });

  it("debe actualizar un usuario correctamente", async () => {

    const fakeUser = {
      id: 1,
      email: "nuevo@test.com",
      name: "Nuevo Nombre"
    };

    mockUserDAO.updateUser
      .mockResolvedValue(fakeUser);

    const result = await userService.updateUser(
      1,
      {
        email: "nuevo@test.com",
        name: "Nuevo Nombre",
        password: "123456"
      }
    );

    expect(mockUserDAO.updateUser)
      .toHaveBeenCalledWith(
        1,
        {
          email: "nuevo@test.com",
          name: "Nuevo Nombre",
          password: "123456"
        }
      );

    expect(invalidateUserCache)
      .toHaveBeenCalledWith(1);

    expect(invalidateUsersCache)
      .toHaveBeenCalled();

    expect(result).toEqual({
      user: fakeUser
    });
  });

  it("debe propagar el error si el DAO falla", async () => {

    mockUserDAO.updateUser
      .mockRejectedValue(new Error("DB error"));

    await expect(
      userService.updateUser(
        1,
        {
          email: "nuevo@test.com",
          name: "Nuevo Nombre",
          password: "123456"
        }
      )
    ).rejects.toThrow("DB error");

    expect(invalidateUserCache)
      .not.toHaveBeenCalled();

    expect(invalidateUsersCache)
      .not.toHaveBeenCalled();
  });

});


// ─────────────────────────────────────────────
// PRUEBAS: deleteUser
// ─────────────────────────────────────────────

describe("UserService - deleteUser", () => {

  let userService;
  let mockUserDAO;

  beforeEach(() => {

    mockUserDAO = createMockUserDAO();

    userService = new UserService(
      mockUserDAO
    );

    jest.clearAllMocks();
  });

  it("debe eliminar un usuario correctamente", async () => {

    const fakeUser = {
      id: 1,
      email: "test@test.com"
    };

    mockUserDAO.deleteUser
      .mockResolvedValue(fakeUser);

    const result = await userService.deleteUser(1);

    expect(mockUserDAO.deleteUser)
      .toHaveBeenCalledWith(1);

    expect(invalidateUsersCache)
      .toHaveBeenCalled();

    expect(invalidateUserCache)
      .toHaveBeenCalledWith(1);

    expect(result).toEqual({
      user: fakeUser
    });
  });

  it("debe propagar el error si el DAO falla", async () => {

    mockUserDAO.deleteUser
      .mockRejectedValue(new Error("DB error"));

    await expect(
      userService.deleteUser(1)
    ).rejects.toThrow("DB error");

    expect(invalidateUsersCache)
      .not.toHaveBeenCalled();

    expect(invalidateUserCache)
      .not.toHaveBeenCalled();
  });

});