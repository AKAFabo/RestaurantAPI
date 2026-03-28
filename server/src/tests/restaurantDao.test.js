import restaurantDAO from "../daos/restaurantDao.js";
import { pool } from "../config/database.js";

jest.mock("../config/database.js", () => ({
  pool: {
    query: jest.fn()
  }
}));

describe("createRestaurant", () => {

  beforeEach(() => {
    jest.clearAllMocks();
  });

  //  Caso exitoso
  it("debe crear un restaurante correctamente", async () => {

    const fakeRestaurant = { id: 1, name: "Mi Restaurante", address: "Calle 1", phone: "12345678", admin_id: 1 };

    pool.query.mockResolvedValue({ rows: [fakeRestaurant] });

    const result = await restaurantDAO.createRestaurant({
      name: "Mi Restaurante",
      address: "Calle 1",
      phone: "12345678",
      admin_id: 1
    });

    expect(pool.query).toHaveBeenCalledWith(
      expect.stringContaining("INSERT INTO restaurants"),
      ["Mi Restaurante", "Calle 1", "12345678", 1]
    );
    expect(result).toEqual(fakeRestaurant);
  });

  //  Error de BD
  it("debe lanzar error si falla la consulta", async () => {

    pool.query.mockRejectedValue(new Error("DB error"));

    await expect(restaurantDAO.createRestaurant({
      name: "Test",
      address: "Test",
      phone: "123",
      admin_id: 1
    })).rejects.toThrow("DB error");
  });

});


describe("getRestaurants", () => {

  beforeEach(() => {
    jest.clearAllMocks();
  });

  //  Caso exitoso
  it("debe devolver la lista de restaurantes", async () => {

    const fakeRestaurants = [
      { id: 1, name: "Restaurante A" },
      { id: 2, name: "Restaurante B" }
    ];

    pool.query.mockResolvedValue({ rows: fakeRestaurants });

    const result = await restaurantDAO.getRestaurants();

    expect(pool.query).toHaveBeenCalledWith("SELECT * FROM restaurants");
    expect(result).toEqual(fakeRestaurants);
  });

  //  Error de BD
  it("debe lanzar error si falla la consulta", async () => {

    pool.query.mockRejectedValue(new Error("DB error"));

    await expect(restaurantDAO.getRestaurants()).rejects.toThrow("DB error");
  });

});


describe("createMenu", () => {

  beforeEach(() => {
    jest.clearAllMocks();
  });

  //  Caso exitoso
  it("debe crear un menu correctamente", async () => {

    const fakeMenu = { id: 1, restaurant_id: 5, name: "Menu Almuerzo" };

    pool.query.mockResolvedValue({ rows: [fakeMenu] });

    const result = await restaurantDAO.createMenu(5, { name: "Menu Almuerzo" });

    expect(pool.query).toHaveBeenCalledWith(
      expect.stringContaining("INSERT INTO menus"),
      [5, "Menu Almuerzo"]
    );
    expect(result).toEqual(fakeMenu);
  });

  //  Error de BD
  it("debe lanzar error si falla la consulta", async () => {

    pool.query.mockRejectedValue(new Error("DB error"));

    await expect(restaurantDAO.createMenu(5, { name: "Test" })).rejects.toThrow("DB error");
  });

});
