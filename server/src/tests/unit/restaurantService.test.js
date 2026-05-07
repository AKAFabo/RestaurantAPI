// restaurantService.test.js

import RestaurantService from "../../services/restaurant.service.js";
import { invalidateRestaurantsCache } from "../../middlewares/cacheHelper.js";

// Mock del helper de cache
jest.mock("../../middlewares/cacheHelper.js", () => ({
  invalidateRestaurantsCache: jest.fn(),
}));

// ─────────────────────────────────────────────
// SETUP: DAO falso
// ─────────────────────────────────────────────

const createMockRestaurantDAO = () => ({
  createRestaurant: jest.fn(),
  getRestaurants: jest.fn(),
  createMenu: jest.fn(),
});

// ─────────────────────────────────────────────
// PRUEBAS: createRestaurant
// ─────────────────────────────────────────────

describe("RestaurantService - createRestaurant", () => {

  let restaurantService;
  let mockRestaurantDAO;

  beforeEach(() => {
    mockRestaurantDAO = createMockRestaurantDAO();
    restaurantService = new RestaurantService(mockRestaurantDAO);
    jest.clearAllMocks();
  });

  it("debe crear un restaurante correctamente (sin mesas)", async () => {

    const fakeRestaurant = {
      id: 1,
      name: "Pizza Hub",
      address: "San José",
      phone: "8888-8888",
      admin_id: 5
    };

    mockRestaurantDAO.createRestaurant.mockResolvedValue(fakeRestaurant);

    const result = await restaurantService.createRestaurant({
      name: "Pizza Hub",
      address: "San José",
      phone: "8888-8888",
      admin_id: 5,
      tables: [] // 👈 nuevo
    });

    expect(mockRestaurantDAO.createRestaurant).toHaveBeenCalledWith({
      name: "Pizza Hub",
      address: "San José",
      phone: "8888-8888",
      admin_id: 5,
      tables: []
    });

    expect(invalidateRestaurantsCache).toHaveBeenCalled();

    expect(result).toEqual({
      restaurant: fakeRestaurant
    });
  });

  it("debe crear un restaurante con mesas", async () => {

    const fakeRestaurant = {
      id: 1,
      name: "Pizza Hub",
      admin_id: 5
    };

    const tables = [
      { table_number: 1, capacity: 2 },
      { table_number: 2, capacity: 4 }
    ];

    mockRestaurantDAO.createRestaurant.mockResolvedValue(fakeRestaurant);

    const result = await restaurantService.createRestaurant({
      name: "Pizza Hub",
      address: "San José",
      phone: "8888-8888",
      admin_id: 5,
      tables
    });

    expect(mockRestaurantDAO.createRestaurant).toHaveBeenCalledWith({
      name: "Pizza Hub",
      address: "San José",
      phone: "8888-8888",
      admin_id: 5,
      tables
    });

    expect(invalidateRestaurantsCache).toHaveBeenCalled();

    expect(result).toEqual({
      restaurant: fakeRestaurant
    });
  });

  it("debe propagar error si el DAO falla", async () => {

    mockRestaurantDAO.createRestaurant
      .mockRejectedValue(new Error("DB error"));

    await expect(
      restaurantService.createRestaurant({
        name: "Pizza Hub",
        address: "San José",
        phone: "8888-8888",
        admin_id: 5,
        tables: []
      })
    ).rejects.toThrow("DB error");

    expect(invalidateRestaurantsCache).not.toHaveBeenCalled();
  });

});

// ─────────────────────────────────────────────
// PRUEBAS: getRestaurants
// ─────────────────────────────────────────────

describe("RestaurantService - getRestaurants", () => {

  let restaurantService;
  let mockRestaurantDAO;

  beforeEach(() => {
    mockRestaurantDAO = createMockRestaurantDAO();
    restaurantService = new RestaurantService(mockRestaurantDAO);
    jest.clearAllMocks();
  });

  it("debe retornar todos los restaurantes", async () => {

    const fakeRestaurants = [
      { id: 1, name: "Pizza Hub" },
      { id: 2, name: "Burger House" }
    ];

    mockRestaurantDAO.getRestaurants.mockResolvedValue(fakeRestaurants);

    const result = await restaurantService.getRestaurants();

    expect(mockRestaurantDAO.getRestaurants).toHaveBeenCalled();

    expect(result).toEqual({
      restaurants: fakeRestaurants
    });
  });

  it("debe propagar error si el DAO falla", async () => {

    mockRestaurantDAO.getRestaurants
      .mockRejectedValue(new Error("DB error"));

    await expect(
      restaurantService.getRestaurants()
    ).rejects.toThrow("DB error");
  });

});

// ─────────────────────────────────────────────
// PRUEBAS: createMenu
// ─────────────────────────────────────────────

describe("RestaurantService - createMenu", () => {

  let restaurantService;
  let mockRestaurantDAO;

  beforeEach(() => {
    mockRestaurantDAO = createMockRestaurantDAO();
    restaurantService = new RestaurantService(mockRestaurantDAO);
    jest.clearAllMocks();
  });

  it("debe crear un menú correctamente (sin productos)", async () => {

    const fakeMenu = {
      id: 1,
      restaurant_id: 5,
      name: "Menú Ejecutivo"
    };

    mockRestaurantDAO.createMenu.mockResolvedValue(fakeMenu);

    const result = await restaurantService.createMenu(
      5,
      { name: "Menú Ejecutivo", products: [] }
    );

    expect(mockRestaurantDAO.createMenu).toHaveBeenCalledWith(
      5,
      { name: "Menú Ejecutivo", products: [] }
    );

    expect(invalidateRestaurantsCache).toHaveBeenCalled();

    expect(result).toEqual({
      menu: fakeMenu
    });
  });

  it("debe crear un menú con productos", async () => {

    const fakeMenu = {
      id: 1,
      restaurant_id: 5,
      name: "Menú Pizzas"
    };

    const products = [
      {
        name: "Pizza",
        category: "Comida",
        price: 5000,
        available: true
      }
    ];

    mockRestaurantDAO.createMenu.mockResolvedValue(fakeMenu);

    const result = await restaurantService.createMenu(
      5,
      { name: "Menú Pizzas", products }
    );

    expect(mockRestaurantDAO.createMenu).toHaveBeenCalledWith(
      5,
      { name: "Menú Pizzas", products }
    );

    expect(invalidateRestaurantsCache).toHaveBeenCalled();

    expect(result).toEqual({
      menu: fakeMenu
    });
  });

  it("debe propagar error si el DAO falla", async () => {

    mockRestaurantDAO.createMenu
      .mockRejectedValue(new Error("DB error"));

    await expect(
      restaurantService.createMenu(
        5,
        { name: "Menú Ejecutivo", products: [] }
      )
    ).rejects.toThrow("DB error");

    expect(invalidateRestaurantsCache).not.toHaveBeenCalled();
  });

});