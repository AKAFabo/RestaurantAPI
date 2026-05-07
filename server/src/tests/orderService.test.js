// orderService.test.js
// Pruebas unitarias del OrderService
// Verifica lógica de negocio, permisos y uso de cache

import OrderService from "../services/order.service.js";
import { invalidateOrdersCache } from "../middlewares/cacheHelper.js";


// Mock del helper de cache
jest.mock("../middlewares/cacheHelper.js", () => ({
  invalidateOrdersCache: jest.fn(),
}));


// ─────────────────────────────────────────────
// SETUP: DAOs falsos
// ─────────────────────────────────────────────

const createMockOrderDAO = () => ({
  create: jest.fn(),
  getById: jest.fn(),
});

const createMockReservationDAO = () => ({
  getByEmail: jest.fn(),
});


// ─────────────────────────────────────────────
// PRUEBAS: createOrder
// ─────────────────────────────────────────────

describe("OrderService - createOrder", () => {

  let orderService;
  let mockOrderDAO;
  let mockReservationDAO;

  beforeEach(() => {

    mockOrderDAO = createMockOrderDAO();
    mockReservationDAO = createMockReservationDAO();

    // Inyección de dependencias
    orderService = new OrderService(
      mockOrderDAO,
      mockReservationDAO
    );

    jest.clearAllMocks();
  });

  // Caso exitoso
  it("debe crear una orden correctamente cuando el usuario existe", async () => {

    const fakeUser = {
      id: 1,
      email: "cliente@restaurante.com"
    };

    const fakeOrder = {
      id: 10,
      user_id: 1,
      restaurant_id: 5,
      reservation_id: 2,
      items: [
        { product_id: 1, quantity: 2 }
      ]
    };

    // Mock usuario encontrado
    mockReservationDAO.getByEmail.mockResolvedValue(fakeUser);

    // Mock orden creada
    mockOrderDAO.create.mockResolvedValue(fakeOrder);

    const result = await orderService.createOrder({
      email: "cliente@restaurante.com",
      restaurant_id: 5,
      reservation_id: 2,
      items: [
        { product_id: 1, quantity: 2 }
      ]
    });

    // Verifica búsqueda del usuario
    expect(mockReservationDAO.getByEmail)
      .toHaveBeenCalledWith("cliente@restaurante.com");

    // Verifica creación de orden
    expect(mockOrderDAO.create)
      .toHaveBeenCalledWith({
        user_id: fakeUser.id,
        restaurant_id: 5,
        reservation_id: 2,
        items: [
          { product_id: 1, quantity: 2 }
        ]
      });

    // Verifica invalidación de cache
    expect(invalidateOrdersCache).toHaveBeenCalled();

    // Resultado esperado
    expect(result).toEqual({ order: fakeOrder });
  });

  // Caso: usuario no existe
  it("debe retornar error USER_NOT_FOUND si el usuario no existe", async () => {

    mockReservationDAO.getByEmail.mockResolvedValue(null);

    const result = await orderService.createOrder({
      email: "noexiste@restaurante.com",
      restaurant_id: 5,
      reservation_id: 2,
      items: [
        { product_id: 1, quantity: 2 }
      ]
    });

    // No debe intentar crear orden
    expect(mockOrderDAO.create).not.toHaveBeenCalled();

    // No debe invalidar cache
    expect(invalidateOrdersCache).not.toHaveBeenCalled();

    expect(result).toEqual({
      error: "USER_NOT_FOUND"
    });
  });

  // Caso: error inesperado
  it("debe propagar el error si el DAO falla", async () => {

    mockReservationDAO.getByEmail
      .mockRejectedValue(new Error("DB error"));

    await expect(
      orderService.createOrder({
        email: "cliente@restaurante.com",
        restaurant_id: 5,
        reservation_id: 2,
        items: [
          { product_id: 1, quantity: 2 }
        ]
      })
    ).rejects.toThrow("DB error");

    // No debe invalidar cache
    expect(invalidateOrdersCache).not.toHaveBeenCalled();
  });

});


// ─────────────────────────────────────────────
// PRUEBAS: getOrderById
// ─────────────────────────────────────────────

describe("OrderService - getOrderById", () => {

  let orderService;
  let mockOrderDAO;
  let mockReservationDAO;

  beforeEach(() => {

    mockOrderDAO = createMockOrderDAO();
    mockReservationDAO = createMockReservationDAO();

    orderService = new OrderService(
      mockOrderDAO,
      mockReservationDAO
    );

    jest.clearAllMocks();
  });

  // Caso: admin puede ver cualquier orden
  it("debe retornar la orden si el usuario es admin", async () => {

    const fakeUser = {
      id: 1,
      email: "admin@restaurante.com"
    };

    const fakeOrder = {
      id: 10,
      user_id: 99
    };

    mockReservationDAO.getByEmail.mockResolvedValue(fakeUser);

    mockOrderDAO.getById.mockResolvedValue(fakeOrder);

    const result = await orderService.getOrderById({
      id: 10,
      email: "admin@restaurante.com",
      roles: ["admin"]
    });

    expect(mockReservationDAO.getByEmail)
      .toHaveBeenCalledWith("admin@restaurante.com");

    expect(mockOrderDAO.getById)
      .toHaveBeenCalledWith(10);

    expect(result).toEqual({
      order: fakeOrder
    });
  });

  // Caso: cliente ve su propia orden
  it("debe retornar la orden si el cliente es el dueño", async () => {

    const fakeUser = {
      id: 5,
      email: "cliente@restaurante.com"
    };

    const fakeOrder = {
      id: 10,
      user_id: 5
    };

    mockReservationDAO.getByEmail.mockResolvedValue(fakeUser);

    mockOrderDAO.getById.mockResolvedValue(fakeOrder);

    const result = await orderService.getOrderById({
      id: 10,
      email: "cliente@restaurante.com",
      roles: ["user"]
    });

    expect(result).toEqual({
      order: fakeOrder
    });
  });

  // Caso: cliente intenta ver orden ajena
  it("debe retornar error FORBIDDEN si el cliente no es dueño de la orden", async () => {

    const fakeUser = {
      id: 5,
      email: "cliente@restaurante.com"
    };

    const fakeOrder = {
      id: 10,
      user_id: 99
    };

    mockReservationDAO.getByEmail.mockResolvedValue(fakeUser);

    mockOrderDAO.getById.mockResolvedValue(fakeOrder);

    const result = await orderService.getOrderById({
      id: 10,
      email: "cliente@restaurante.com",
      roles: ["user"]
    });

    expect(result).toEqual({
      error: "FORBIDDEN"
    });
  });

  // Caso: usuario no existe
  it("debe retornar error USER_NOT_FOUND si el usuario no existe", async () => {

    mockReservationDAO.getByEmail.mockResolvedValue(null);

    const result = await orderService.getOrderById({
      id: 10,
      email: "noexiste@restaurante.com",
      roles: ["user"]
    });

    // No debe buscar la orden
    expect(mockOrderDAO.getById).not.toHaveBeenCalled();

    expect(result).toEqual({
      error: "USER_NOT_FOUND"
    });
  });

  // Caso: orden no existe
  it("debe retornar error ORDER_NOT_FOUND si la orden no existe", async () => {

    const fakeUser = {
      id: 5,
      email: "cliente@restaurante.com"
    };

    mockReservationDAO.getByEmail.mockResolvedValue(fakeUser);

    mockOrderDAO.getById.mockResolvedValue(null);

    const result = await orderService.getOrderById({
      id: 99,
      email: "cliente@restaurante.com",
      roles: ["user"]
    });

    expect(result).toEqual({
      error: "ORDER_NOT_FOUND"
    });
  });

  // Caso: error inesperado
  it("debe propagar el error si el DAO falla", async () => {

    mockReservationDAO.getByEmail
      .mockRejectedValue(new Error("DB error"));

    await expect(
      orderService.getOrderById({
        id: 10,
        email: "cliente@restaurante.com",
        roles: ["user"]
      })
    ).rejects.toThrow("DB error");
  });

});