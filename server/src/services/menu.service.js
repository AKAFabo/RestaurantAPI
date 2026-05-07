import { invalidateMenusCache } from "../middlewares/cacheHelper.js";


class MenuService {
  // inyeccion de dependecias 
  constructor(menuDAO) { // recibe un dao y lo guarda en la clase 
    this.menuDAO = menuDAO;
  }
  // metodos que delegan al DAO
  async getMenuById(id) {
    return await this.menuDAO.getMenuById(id);
  }

  async updateMenuById(id, name) {
    const result = await this.menuDAO.updateMenuById(id, name);

    await invalidateMenusCache();

    return result;
  }


  async deleteMenu(id) {
    const result = await this.menuDAO.deleteMenu(id);

    await invalidateMenusCache();

    return result;
  }
  async getAllProducts() {
    return await this.menuDAO.getAllProducts();
  }
}

export default MenuService;