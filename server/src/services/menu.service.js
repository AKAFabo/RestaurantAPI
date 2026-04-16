class MenuService {
  constructor(menuDAO) {
    this.menuDAO = menuDAO;
  }

  async getMenuById(id) {
    return await this.menuDAO.getMenuById(id);
  }

  async updateMenuById(id, name) {
    return await this.menuDAO.updateMenuById(id, name);
  }

  async deleteMenu(id) {
    return await this.menuDAO.deleteMenu(id);
  }
}

export default MenuService;