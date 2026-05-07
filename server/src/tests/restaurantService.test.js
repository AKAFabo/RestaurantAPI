// restaurantService.test.js
// Pruebas unitarias del RestaurantService
// Verifica lógica de negocio y uso de cache

import RestaurantService from "../services/restaurant.service.js";
import { invalidateRestaurantsCache } from "../middlewares/cacheHelper.js";


// Mock del helper de cache
jest.mock("../middlewares/cacheHelper.js", () => ({
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

    // Inyección de dependencias
    restaurantService = new RestaurantService(
      mockRestaurantDAO
    );

    jest.clearAllMocks();
  });

  // Caso exitoso
  it("debe crear un restaurante correctamente", async () => {

    const fakeRestaurant = {
      id: 1,
      name: "Pizza Hub",
      address: "San José",
      phone: "8888-8888",
      admin_id: 5
    };

    mockRestaurantDAO.createRestaurant
      .mockResolvedValue(fakeRestaurant);

    const result = await restaurantService.createRestaurant({
      name: "Pizza Hub",
      address: "San José",
      phone: "8888-8888",
      admin_id: 5
    });

    // Verifica llamada al DAO
    expect(mockRestaurantDAO.createRestaurant)
      .toHaveBeenCalledWith({
        name: "Pizza Hub",
        address: "San José",
        phone: "8888-8888",
        admin_id: 5
      });

    // Verifica invalidación de cache
    expect(invalidateRestaurantsCache)
      .toHaveBeenCalled();

    // Resultado esperado
    expect(result).toEqual({
      restaurant: fakeRestaurant
    });
  });

  // Caso: error inesperado
  it("debe propagar el error si el DAO falla", async () => {

    mockRestaurantDAO.createRestaurant
      .mockRejectedValue(new Error("DB error"));

    await expect(
      restaurantService.createRestaurant({
        name: "Pizza Hub",
        address: "San José",
        phone: "8888-8888",
        admin_id: 5
      })
    ).rejects.toThrow("DB error");

    // No debe invalidar cache
    expect(invalidateRestaurantsCache)
      .not.toHaveBeenCalled();
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

    restaurantService = new RestaurantService(
      mockRestaurantDAO
    );

    jest.clearAllMocks();
  });

  // Caso exitoso
  it("debe retornar todos los restaurantes", async () => {

    const fakeRestaurants = [
      {
        id: 1,
        name: "Pizza Hub"
      },
      {
        id: 2,
        name: "Burger House"
      }
    ];

    mockRestaurantDAO.getRestaurants
      .mockResolvedValue(fakeRestaurants);

    const result = await restaurantService.getRestaurants();

    // Verifica llamada al DAO
    expect(mockRestaurantDAO.getRestaurants)
      .toHaveBeenCalled();

    // Resultado esperado
    expect(result).toEqual({
      restaurants: fakeRestaurants
    });
  });

  // Caso: error inesperado
  it("debe propagar el error si el DAO falla", async () => {

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

    restaurantService = new RestaurantService(
      mockRestaurantDAO
    );

    jest.clearAllMocks();
  });

  // Caso exitoso
  it("debe crear un menú correctamente", async () => {

    const fakeMenu = {
      id: 1,
      restaurant_id: 5,
      name: "Menú Ejecutivo"
    };

    mockRestaurantDAO.createMenu
      .mockResolvedValue(fakeMenu);

    const result = await restaurantService.createMenu(
      5,
      { name: "Menú Ejecutivo" }
    );

    // Verifica llamada al DAO
    expect(mockRestaurantDAO.createMenu)
      .toHaveBeenCalledWith(
        5,
        { name: "Menú Ejecutivo" }
      );

    // Verifica invalidación de cache
    expect(invalidateRestaurantsCache)
      .toHaveBeenCalled();

    // Resultado esperado
    expect(result).toEqual({
      menu: fakeMenu
    });
  });

  // Caso: error inesperado
  it("debe propagar el error si el DAO falla", async () => {

    mockRestaurantDAO.createMenu
      .mockRejectedValue(new Error("DB error"));

    await expect(
      restaurantService.createMenu(
        5,
        { name: "Menú Ejecutivo" }
      )
    ).rejects.toThrow("DB error");

    // No debe invalidar cache
    expect(invalidateRestaurantsCache)
      .not.toHaveBeenCalled();
  });

});