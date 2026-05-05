// orderService.test.js
// Pruebas unitarias del OrderService
// Verifica la lógica de negocio: validaciones, permisos y delegación al DAO

import OrderService from "../services/order.service.js";

// ─────────────────────────────────────────────
// SETUP: creamos DAOs falsos antes de cada prueba
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
    // Inyectamos ambos DAOs falsos al service
    orderService = new OrderService(mockOrderDAO, mockReservationDAO);
  });

  // Caso exitoso: usuario existe y orden se crea correctamente
  it("debe crear una orden correctamente cuando el usuario existe", async () => {

    const fakeUser = { id: 1, email: "cliente@restaurante.com" };
    const fakeOrder = {
      id: 10,
      user_id: 1,
      restaurant_id: 5,
      reservation_id: 2,
      items: [{ product_id: 1, quantity: 2 }]
    };

    // El reservationDAO encuentra al usuario por email
    mockReservationDAO.getByEmail.mockResolvedValue(fakeUser);
    // El orderDAO crea la orden correctamente
    mockOrderDAO.create.mockResolvedValue(fakeOrder);

    const result = await orderService.createOrder({
      email: "cliente@restaurante.com",
      restaurant_id: 5,
      reservation_id: 2,
      items: [{ product_id: 1, quantity: 2 }]
    });

    // Verifica que buscó al usuario por email
    expect(mockReservationDAO.getByEmail).toHaveBeenCalledWith("cliente@restaurante.com");
    // Verifica que creó la orden con el user_id correcto
    expect(mockOrderDAO.create).toHaveBeenCalledWith({
      user_id: fakeUser.id,
      restaurant_id: 5,
      reservation_id: 2,
      items: [{ product_id: 1, quantity: 2 }]
    });
    expect(result).toEqual({ order: fakeOrder });
  });

  // Caso: el usuario no existe en la base de datos
  it("debe retornar error USER_NOT_FOUND si el usuario no existe", async () => {

    mockReservationDAO.getByEmail.mockResolvedValue(null);

    const result = await orderService.createOrder({
      email: "noexiste@restaurante.com",
      restaurant_id: 5,
      reservation_id: 2,
      items: [{ product_id: 1, quantity: 2 }]
    });

    // Verifica que no intentó crear la orden
    expect(mockOrderDAO.create).not.toHaveBeenCalled();
    expect(result).toEqual({ error: "USER_NOT_FOUND" });
  });

  // Caso: error inesperado en el DAO
  it("debe propagar el error si el DAO falla", async () => {

    mockReservationDAO.getByEmail.mockRejectedValue(new Error("DB error"));

    await expect(orderService.createOrder({
      email: "cliente@restaurante.com",
      restaurant_id: 5,
      reservation_id: 2,
      items: [{ product_id: 1, quantity: 2 }]
    })).rejects.toThrow("DB error");
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
    orderService = new OrderService(mockOrderDAO, mockReservationDAO);
  });

  // Caso exitoso: admin puede ver cualquier orden
  it("debe retornar la orden si el usuario es admin", async () => {

    const fakeUser = { id: 1, email: "admin@restaurante.com" };
    const fakeOrder = { id: 10, user_id: 99 }; // orden de otro usuario

    mockReservationDAO.getByEmail.mockResolvedValue(fakeUser);
    mockOrderDAO.getById.mockResolvedValue(fakeOrder);

    const result = await orderService.getOrderById({
      id: 10,
      email: "admin@restaurante.com",
      roles: ["admin"] // rol de administrador
    });

    expect(result).toEqual({ order: fakeOrder });
  });

  // Caso exitoso: cliente puede ver su propia orden
  it("debe retornar la orden si el cliente es el dueño", async () => {

    const fakeUser = { id: 5, email: "cliente@restaurante.com" };
    const fakeOrder = { id: 10, user_id: 5 }; // orden del mismo usuario

    mockReservationDAO.getByEmail.mockResolvedValue(fakeUser);
    mockOrderDAO.getById.mockResolvedValue(fakeOrder);

    const result = await orderService.getOrderById({
      id: 10,
      email: "cliente@restaurante.com",
      roles: ["user"]
    });

    expect(result).toEqual({ order: fakeOrder });
  });

  // Caso: cliente intenta ver la orden de otro usuario
  it("debe retornar error FORBIDDEN si el cliente no es dueño de la orden", async () => {

    const fakeUser = { id: 5, email: "cliente@restaurante.com" };
    const fakeOrder = { id: 10, user_id: 99 }; // orden de otro usuario

    mockReservationDAO.getByEmail.mockResolvedValue(fakeUser);
    mockOrderDAO.getById.mockResolvedValue(fakeOrder);

    const result = await orderService.getOrderById({
      id: 10,
      email: "cliente@restaurante.com",
      roles: ["user"] // no es admin
    });

    expect(result).toEqual({ error: "FORBIDDEN" });
  });

  // Caso: el usuario no existe en la base de datos
  it("debe retornar error USER_NOT_FOUND si el usuario no existe", async () => {

    mockReservationDAO.getByEmail.mockResolvedValue(null);

    const result = await orderService.getOrderById({
      id: 10,
      email: "noexiste@restaurante.com",
      roles: ["user"]
    });

    // Verifica que no intentó buscar la orden
    expect(mockOrderDAO.getById).not.toHaveBeenCalled();
    expect(result).toEqual({ error: "USER_NOT_FOUND" });
  });

  // Caso: la orden no existe
  it("debe retornar error ORDER_NOT_FOUND si la orden no existe", async () => {

    const fakeUser = { id: 5, email: "cliente@restaurante.com" };

    mockReservationDAO.getByEmail.mockResolvedValue(fakeUser);
    mockOrderDAO.getById.mockResolvedValue(null); // orden no encontrada

    const result = await orderService.getOrderById({
      id: 99,
      email: "cliente@restaurante.com",
      roles: ["user"]
    });

    expect(result).toEqual({ error: "ORDER_NOT_FOUND" });
  });

  // Caso: error inesperado en el DAO
  it("debe propagar el error si el DAO falla", async () => {

    mockReservationDAO.getByEmail.mockRejectedValue(new Error("DB error"));

    await expect(orderService.getOrderById({
      id: 10,
      email: "cliente@restaurante.com",
      roles: ["user"]
    })).rejects.toThrow("DB error");
  });

});