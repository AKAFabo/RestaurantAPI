import { getMenuById, updateMenubyId, deleteMenu } from "../daos/menuDao.js";
import { pool } from "../config/database.js";

jest.mock("../config/database.js", () => ({
  pool: {
    query: jest.fn()
  }
}));

describe("getMenuById", () => {

  beforeEach(() => {
    jest.clearAllMocks();
  });

  //  Caso exitoso
  it("debe devolver un menu con sus productos", async () => {

    const fakeMenu = { id: 1, restaurant_id: 1, name: "Menu 1", created_at: "2026-01-01" };
    const fakeProducts = [
      { id: 1, name: "Producto 1", description: "Desc", price: 100, available: true }
    ];

    pool.query
      .mockResolvedValueOnce({ rows: [fakeMenu] })
      .mockResolvedValueOnce({ rows: fakeProducts });

    const result = await getMenuById(1);

    expect(pool.query).toHaveBeenCalledTimes(2);
    expect(result).toEqual({ ...fakeMenu, products: fakeProducts });
  });

  //  Menu no existe
  it("debe devolver null si el menu no existe", async () => {

    pool.query.mockResolvedValueOnce({ rows: [] });

    const result = await getMenuById(99);

    expect(result).toBeNull();
  });

  //  Error de BD
  it("debe lanzar error si falla la consulta", async () => {

    pool.query.mockRejectedValue(new Error("DB error"));

    await expect(getMenuById(1)).rejects.toThrow("DB error");
  });

});


describe("updateMenubyId", () => {

  beforeEach(() => {
    jest.clearAllMocks();
  });

  //  Caso exitoso
  it("debe actualizar y retornar el menu", async () => {

    const fakeMenu = { id: 1, restaurant_id: 1, name: "Nuevo nombre", created_at: "2026-01-01" };

    pool.query.mockResolvedValue({ rows: [fakeMenu] });

    const result = await updateMenubyId(1, "Nuevo nombre");

    expect(pool.query).toHaveBeenCalledWith(
      expect.stringContaining("UPDATE menus"),
      ["Nuevo nombre", 1]
    );
    expect(result).toEqual(fakeMenu);
  });

  //  No existe
  it("debe devolver null si el menu no existe", async () => {

    pool.query.mockResolvedValue({ rows: [] });

    const result = await updateMenubyId(99, "Test");

    expect(result).toBeNull();
  });

  //  Error de BD
  it("debe lanzar error si falla la consulta", async () => {

    pool.query.mockRejectedValue(new Error("DB error"));

    await expect(updateMenubyId(1, "Test")).rejects.toThrow("DB error");
  });

});


describe("deleteMenu", () => {

  beforeEach(() => {
    jest.clearAllMocks();
  });

  //  Caso exitoso
  it("debe eliminar y retornar el menu", async () => {

    const fakeMenu = { id: 1, name: "Menu 1" };

    pool.query
      .mockResolvedValueOnce({ rows: [] })       // DELETE order_items
      .mockResolvedValueOnce({ rows: [fakeMenu] }); // DELETE menus

    const result = await deleteMenu(1);

    expect(pool.query).toHaveBeenCalledTimes(2);
    expect(result).toEqual(fakeMenu);
  });

  //  No existe
  it("debe devolver null si el menu no existe", async () => {

    pool.query
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [] });

    const result = await deleteMenu(99);

    expect(result).toBeNull();
  });

  //  Error de BD
  it("debe lanzar error si falla la consulta", async () => {

    pool.query.mockRejectedValue(new Error("DB error"));

    await expect(deleteMenu(1)).rejects.toThrow("DB error");
  });

});
