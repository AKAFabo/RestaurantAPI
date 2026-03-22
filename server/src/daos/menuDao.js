import pool from "../config/database.js";
import { deletemenu } from "../controllers/menuController.js";

export const getById = async (id) => {

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

export const deletemenu = async(id) =>{
  const client = await pool.connect();

  try{
    await client.query("Begin ");

    const checkquery= `SELECT id FROM menus WHERE id = $1`;
    const checkresult= await client.query(checkquery,[id]);

    if (checkresult.rows.length===0){

      await client.query("ROLLBACK");
      return false;
    }

    const deleteProducts=`
      DELETE FROM products
      WHERE menu_id = $1
    `;

    await client.query(deleteProducts,[id]);

    const deletemenuQ = `
      DELETE FROM products
      WHERE menu_id = $1
    `;
    await client.query(deletemenuQ,[id]);

    await client.query("COMMIT");
    return true;





  } catch(error){

    await client.query("ROLLBACK");
    throw error;
  }
  finally{
    client.release();
  }



};