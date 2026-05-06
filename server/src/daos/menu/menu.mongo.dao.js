import mongoose from "mongoose";
import MenuDAO from "./menu.dao.abstract.js";
import Menu from "../../models/menu.Model.js";

class MongoMenuDAO extends MenuDAO{

    
    getMenuById = async(id)=>{
        const objectId = new mongoose.Types.ObjectId(id);// transforma al tipo correcto
        // buscar el menu

        const menu = await Menu.findById(objectId).lean(); // busca el menu con el id 

        if(!menu){ // si no hay menu retorna null 
            return null
        }
        
        return menu;
    };


    // udpdate del menu 
    updateMenuById = async (id,name) =>{
        const objectId = new mongoose.Types.ObjectId(id); // transforma al tipo

        const updateMenu= await Menu.findByIdAndUpdate( // le actualiza el nombre 
            objectId,{name},{new:true} // devuelve el menu actualizado
        ).lean();
        if(!updateMenu){
            return null;
        }
        return updateMenu

    };

    // delete menu 

    deleteMenu = async (id) => {

        const deletedMenu = await Menu.findByIdAndDelete(id).lean(); // borra el menu por id 

        return deletedMenu || null;
    };

    async getAllProducts() {

    // traer todos los menus
    const menus = await Menu.find().lean();// obtiene todos los menus 

    let products = [];

    for (const menu of menus) {// recorre cada menu

      if (!menu.products) continue;// verifica si tiene productos

      for (const product of menu.products) { // recorre cada menu y obtiene el producto 

        products.push({
          id: product._id,
          name: product.name,
          description: product.description || "Producto sin descripción",
          category: product.category,
          price: product.price
        });

      }
    }

    return products; // retorna el array de productos 
  }

}
export default new MongoMenuDAO();