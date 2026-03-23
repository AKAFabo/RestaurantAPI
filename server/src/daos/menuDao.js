import { pool } from "../config/database.js";


export const getMenuById = async (id) => {

  //  Obtener datos  del menú
  const menuQuery = `
    SELECT id, restaurant_id, name, created_at
    FROM menus
    WHERE id = $1
  `;

  const menuResult = await pool.query(menuQuery, [id]);

  //  No existe
  if (menuResult.rows.length === 0) {
    return null;
  }

  const menu = menuResult.rows[0];

  // Obtener productos del menú
  const productsQuery = `
    SELECT id, name, description, price, available
    FROM products
    WHERE menu_id = $1
  `;

  const productsResult = await pool.query(productsQuery, [id]);

  //  Agregar productos al menú
  menu.products = productsResult.rows;

  return menu;
};



export const updateMenubyId = async(id,name)=>{
    const query = `
    UPDATE menus
    SET name = $1
    WHERE id = $2
    RETURNING id, restaurant_id, name, created_at
  `;


    const values = [name,id]
    const result = await pool.query(query,values)

    if (result.rows.length===0){
      return null;
    }

    return result.rows[0];
}



export const deleteMenu = async (id) => {

  // borrar order_items relacionados
  await pool.query(`
    DELETE FROM order_items
    WHERE product_id IN (
      SELECT id FROM products WHERE menu_id = $1
    )
  `, [id]);

  //  borrar menu esto borrar products en cascade
  const result = await pool.query(`
    DELETE FROM menus
    WHERE id = $1
    RETURNING *
  `, [id]);

  return result.rows[0] || null;
};