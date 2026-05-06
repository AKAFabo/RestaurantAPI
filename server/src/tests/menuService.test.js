
// Verifica que el service delega correctamente las operaciones al DAO
// El DAO se inyecta como dependencia, por lo que se mockea manualmente

import MenuService from "../services/menu.service.js";


// SETUP: creamos un DAO falso antes de cada prueba


// Función helper que crea un DAO mock con todos los métodos necesarios
const createMockDAO = () => ({
  getMenuById: jest.fn(),
  updateMenuById: jest.fn(),
  deleteMenu: jest.fn(),
  getAllProducts: jest.fn(),
});


// PRUEBAS: getMenuById
// ─────────────────────────────────────────────
describe("MenuService - getMenuById", () => {

  let menuService;
  let mockDAO;

  beforeEach(() => {
    mockDAO = createMockDAO();
    // Inyectamos el DAO falso al service, simulando la inyección de dependencias real
    menuService = new MenuService(mockDAO);
  });

  // Caso exitoso: el DAO devuelve el menú
  it("debe retornar el menú cuando el DAO lo encuentra", async () => {

    const fakeMenu = { id: 1, name: "Menú del día", products: [] };

    mockDAO.getMenuById.mockResolvedValue(fakeMenu);

    const result = await menuService.getMenuById(1);

    // Verifica que el service llamó al DAO con el id correcto
    expect(mockDAO.getMenuById).toHaveBeenCalledWith(1);
    // Verifica que el resultado es exactamente lo que devolvió el DAO
    expect(result).toEqual(fakeMenu);
  });

  // Caso: menú no encontrado, el DAO devuelve null
  it("debe retornar null cuando el DAO no encuentra el menú", async () => {

    mockDAO.getMenuById.mockResolvedValue(null);

    const result = await menuService.getMenuById(99);

    expect(mockDAO.getMenuById).toHaveBeenCalledWith(99);
    expect(result).toBeNull();
  });

  // Caso: el DAO lanza un error, el service lo propaga
  it("debe propagar el error si el DAO falla", async () => {

    mockDAO.getMenuById.mockRejectedValue(new Error("DB error"));

    await expect(menuService.getMenuById(1)).rejects.toThrow("DB error");
    expect(mockDAO.getMenuById).toHaveBeenCalledWith(1);
  });

});


// PRUEBAS: updateMenuById

describe("MenuService - updateMenuById", () => {

  let menuService;
  let mockDAO;

  beforeEach(() => {
    mockDAO = createMockDAO();
    menuService = new MenuService(mockDAO);
  });

  // Caso exitoso: el DAO actualiza y devuelve el menú actualizado
  it("debe retornar el menú actualizado cuando el DAO lo encuentra", async () => {

    const fakeMenu = { id: 1, name: "Nuevo nombre" };

    mockDAO.updateMenuById.mockResolvedValue(fakeMenu);

    const result = await menuService.updateMenuById(1, "Nuevo nombre");

    // Verifica que el service pasó correctamente el id y el nombre al DAO
    expect(mockDAO.updateMenuById).toHaveBeenCalledWith(1, "Nuevo nombre");
    expect(result).toEqual(fakeMenu);
  });

  // Caso: el menú no existe, el DAO devuelve null
  it("debe retornar null cuando el DAO no encuentra el menú", async () => {

    mockDAO.updateMenuById.mockResolvedValue(null);

    const result = await menuService.updateMenuById(99, "Test");

    expect(mockDAO.updateMenuById).toHaveBeenCalledWith(99, "Test");
    expect(result).toBeNull();
  });

  // Caso: el DAO lanza un error, el service lo propaga
  it("debe propagar el error si el DAO falla", async () => {

    mockDAO.updateMenuById.mockRejectedValue(new Error("DB error"));

    await expect(menuService.updateMenuById(1, "Test")).rejects.toThrow("DB error");
    expect(mockDAO.updateMenuById).toHaveBeenCalledWith(1, "Test");
  });

});


// PRUEBAS: deleteMenu

describe("MenuService - deleteMenu", () => {

  let menuService;
  let mockDAO;

  beforeEach(() => {
    mockDAO = createMockDAO();
    menuService = new MenuService(mockDAO);
  });

  // Caso exitoso: el DAO elimina y devuelve el menú eliminado
  it("debe retornar el menú eliminado cuando el DAO lo encuentra", async () => {

    const fakeMenu = { id: 1, name: "Menú eliminado" };

    mockDAO.deleteMenu.mockResolvedValue(fakeMenu);

    const result = await menuService.deleteMenu(1);

    expect(mockDAO.deleteMenu).toHaveBeenCalledWith(1);
    expect(result).toEqual(fakeMenu);
  });

  // Caso: el menú no existe, el DAO devuelve null
  it("debe retornar null cuando el DAO no encuentra el menú", async () => {

    mockDAO.deleteMenu.mockResolvedValue(null);

    const result = await menuService.deleteMenu(99);

    expect(mockDAO.deleteMenu).toHaveBeenCalledWith(99);
    expect(result).toBeNull();
  });

  // Caso: el DAO lanza un error, el service lo propaga
  it("debe propagar el error si el DAO falla", async () => {

    mockDAO.deleteMenu.mockRejectedValue(new Error("DB error"));

    await expect(menuService.deleteMenu(1)).rejects.toThrow("DB error");
    expect(mockDAO.deleteMenu).toHaveBeenCalledWith(1);
  });

});


// PRUEBAS: getAllProducts

describe("MenuService - getAllProducts", () => {

  let menuService;
  let mockDAO;

  beforeEach(() => {
    mockDAO = createMockDAO();
    menuService = new MenuService(mockDAO);
  });

  // Caso exitoso: el DAO devuelve lista de productos
  it("debe retornar todos los productos cuando el DAO los encuentra", async () => {

    const fakeProducts = [
      { id: 1, name: "Tacos de Canasta", price: 4.50 },
      { id: 2, name: "Agua de Jamaica", price: 2.00 }
    ];

    mockDAO.getAllProducts.mockResolvedValue(fakeProducts);

    const result = await menuService.getAllProducts();

    expect(mockDAO.getAllProducts).toHaveBeenCalled();
    expect(result).toEqual(fakeProducts);
  });

  // Caso: no hay productos, el DAO devuelve lista vacía
  it("debe retornar lista vacía si no hay productos", async () => {

    mockDAO.getAllProducts.mockResolvedValue([]);

    const result = await menuService.getAllProducts();

    expect(mockDAO.getAllProducts).toHaveBeenCalled();
    expect(result).toEqual([]);
  });

  // Caso: el DAO lanza un error, el service lo propaga
  it("debe propagar el error si el DAO falla", async () => {

    mockDAO.getAllProducts.mockRejectedValue(new Error("DB error"));

    await expect(menuService.getAllProducts()).rejects.toThrow("DB error");
    expect(mockDAO.getAllProducts).toHaveBeenCalled();
  });

});