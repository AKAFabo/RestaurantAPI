import MenuService from "../../services/menu.service.js";
import { invalidateMenusCache } from "../../middlewares/cacheHelper.js";


// Mock del helper de cache
jest.mock("../../middlewares/cacheHelper.js", () => ({
  invalidateMenusCache: jest.fn(),
}));


// Helper para crear DAO falso
const createMockDAO = () => ({
  getMenuById: jest.fn(),
  updateMenuById: jest.fn(),
  deleteMenu: jest.fn(),
  getAllProducts: jest.fn(),
});


// ─────────────────────────────────────────────
// PRUEBAS: getMenuById
// ─────────────────────────────────────────────

describe("MenuService - getMenuById", () => {

  let menuService;
  let mockDAO;

  beforeEach(() => {
    mockDAO = createMockDAO();
    menuService = new MenuService(mockDAO);

    jest.clearAllMocks();
  });

  it("debe retornar el menú cuando el DAO lo encuentra", async () => {

    const fakeMenu = { id: 1, name: "Menú del día", products: [] };

    mockDAO.getMenuById.mockResolvedValue(fakeMenu);

    const result = await menuService.getMenuById(1);

    expect(mockDAO.getMenuById).toHaveBeenCalledWith(1);
    expect(result).toEqual(fakeMenu);
  });

  it("debe retornar null cuando el DAO no encuentra el menú", async () => {

    mockDAO.getMenuById.mockResolvedValue(null);

    const result = await menuService.getMenuById(99);

    expect(mockDAO.getMenuById).toHaveBeenCalledWith(99);
    expect(result).toBeNull();
  });

  it("debe propagar el error si el DAO falla", async () => {

    mockDAO.getMenuById.mockRejectedValue(new Error("DB error"));

    await expect(menuService.getMenuById(1))
      .rejects
      .toThrow("DB error");

    expect(mockDAO.getMenuById).toHaveBeenCalledWith(1);
  });

});


// ─────────────────────────────────────────────
// PRUEBAS: updateMenuById
// ─────────────────────────────────────────────

describe("MenuService - updateMenuById", () => {

  let menuService;
  let mockDAO;

  beforeEach(() => {
    mockDAO = createMockDAO();
    menuService = new MenuService(mockDAO);

    jest.clearAllMocks();
  });

  it("debe retornar el menú actualizado y limpiar cache", async () => {

    const fakeMenu = { id: 1, name: "Nuevo nombre" };

    mockDAO.updateMenuById.mockResolvedValue(fakeMenu);

    const result = await menuService.updateMenuById(1, "Nuevo nombre");

    expect(mockDAO.updateMenuById)
      .toHaveBeenCalledWith(1, "Nuevo nombre");

    // Verifica invalidación de cache
    expect(invalidateMenusCache).toHaveBeenCalled();

    expect(result).toEqual(fakeMenu);
  });

  it("debe retornar null cuando el DAO no encuentra el menú", async () => {

    mockDAO.updateMenuById.mockResolvedValue(null);

    const result = await menuService.updateMenuById(99, "Test");

    expect(mockDAO.updateMenuById)
      .toHaveBeenCalledWith(99, "Test");

    expect(invalidateMenusCache).toHaveBeenCalled();

    expect(result).toBeNull();
  });

  it("debe propagar el error si el DAO falla", async () => {

    mockDAO.updateMenuById.mockRejectedValue(new Error("DB error"));

    await expect(menuService.updateMenuById(1, "Test"))
      .rejects
      .toThrow("DB error");

    expect(mockDAO.updateMenuById)
      .toHaveBeenCalledWith(1, "Test");

    // No debería invalidar cache si falla antes
    expect(invalidateMenusCache).not.toHaveBeenCalled();
  });

});


// ─────────────────────────────────────────────
// PRUEBAS: deleteMenu
// ─────────────────────────────────────────────

describe("MenuService - deleteMenu", () => {

  let menuService;
  let mockDAO;

  beforeEach(() => {
    mockDAO = createMockDAO();
    menuService = new MenuService(mockDAO);

    jest.clearAllMocks();
  });

  it("debe retornar el menú eliminado y limpiar cache", async () => {

    const fakeMenu = { id: 1, name: "Menú eliminado" };

    mockDAO.deleteMenu.mockResolvedValue(fakeMenu);

    const result = await menuService.deleteMenu(1);

    expect(mockDAO.deleteMenu).toHaveBeenCalledWith(1);

    expect(invalidateMenusCache).toHaveBeenCalled();

    expect(result).toEqual(fakeMenu);
  });

  it("debe retornar null cuando el DAO no encuentra el menú", async () => {

    mockDAO.deleteMenu.mockResolvedValue(null);

    const result = await menuService.deleteMenu(99);

    expect(mockDAO.deleteMenu).toHaveBeenCalledWith(99);

    expect(invalidateMenusCache).toHaveBeenCalled();

    expect(result).toBeNull();
  });

  it("debe propagar el error si el DAO falla", async () => {

    mockDAO.deleteMenu.mockRejectedValue(new Error("DB error"));

    await expect(menuService.deleteMenu(1))
      .rejects
      .toThrow("DB error");

    expect(mockDAO.deleteMenu).toHaveBeenCalledWith(1);

    expect(invalidateMenusCache).not.toHaveBeenCalled();
  });

});


// ─────────────────────────────────────────────
// PRUEBAS: getAllProducts
// ─────────────────────────────────────────────

describe("MenuService - getAllProducts", () => {

  let menuService;
  let mockDAO;

  beforeEach(() => {
    mockDAO = createMockDAO();
    menuService = new MenuService(mockDAO);

    jest.clearAllMocks();
  });

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

  it("debe retornar lista vacía si no hay productos", async () => {

    mockDAO.getAllProducts.mockResolvedValue([]);

    const result = await menuService.getAllProducts();

    expect(mockDAO.getAllProducts).toHaveBeenCalled();

    expect(result).toEqual([]);
  });

  it("debe propagar el error si el DAO falla", async () => {

    mockDAO.getAllProducts.mockRejectedValue(new Error("DB error"));

    await expect(menuService.getAllProducts())
      .rejects
      .toThrow("DB error");

    expect(mockDAO.getAllProducts).toHaveBeenCalled();
  });

});