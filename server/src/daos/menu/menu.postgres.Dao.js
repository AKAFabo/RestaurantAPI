import MenuDAO from "./menu.dao.abstract.js";
import { pool } from "../../config/database.js";

class PostgresMenuDAO extends MenuDAO {

  async getMenuById(id) {

    const menuQuery = `
      SELECT id, restaurant_id, name, created_at
      FROM menus
      WHERE id = $1
    `;

    const menuResult = await pool.query(menuQuery, [id]);

    if (menuResult.rows.length === 0) {
      return null;
    }

    const menu = menuResult.rows[0];

    const productsQuery = `
      SELECT id, name, description, price, available,category
      FROM products
      WHERE menu_id = $1
    `;

    const productsResult = await pool.query(productsQuery, [id]);

    menu.products = productsResult.rows;

    return menu;
  }

  async updateMenuById(id, name) {

    const query = `
      UPDATE menus
      SET name = $1
      WHERE id = $2
      RETURNING id, restaurant_id, name, created_at
    `;

    const values = [name, id];
    const result = await pool.query(query, values);

    if (result.rows.length === 0) {
      return null;
    }

    return result.rows[0];
  }

  async deleteMenu(id) {

    await pool.query(`
      DELETE FROM order_items
      WHERE product_id IN (
        SELECT id FROM products WHERE menu_id = $1
      )
    `, [id]);

    const result = await pool.query(`
      DELETE FROM menus
      WHERE id = $1
      RETURNING *
    `, [id]);

    return result.rows[0] || null;
  }

  getAllProducts = async () => {
    const query = `
      SELECT 
        id,
        name,
        description,
        category,
        price
      FROM products
    `;

    const result = await pool.query(query);

    return result.rows;
  };

}

export default new PostgresMenuDAO();