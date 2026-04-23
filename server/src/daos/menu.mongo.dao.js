import mongoose from "mongoose";
import MenuDAO from "./menu.dao.abstract.js";
import Menu from "../models/menu.Model.js"

class MongoMenuDAO extends MenuDAO{

    // get menu by id 
    getMenuById = async(id)=>{
        const objectId = new mongoose.Types.ObjectId(id);
        // buscar el menu

        const menu = await Menu.findById(objectId).lean();

        if(!menu){
            return null
        }
        
        return menu;
    };


    // udpdate del menu 
    updateMenuById = async (id,name) =>{
        const objectId = new mongoose.Types.ObjectId(id);

        const updateMenu= await Menu.findByIdAndUpdate(
            objectId,{name},{new:true} // devuelve el menu actualizado
        ).lean();
        if(!updateMenu){
            return null;
        }
        return updateMenu

    };

    // delete menu 

    deleteMenu = async (id) => {

        const deletedMenu = await Menu.findByIdAndDelete(id).lean();

        return deletedMenu || null;
    };

    async getAllProducts() {

    // traer todos los menus
    const menus = await Menu.find().lean();

    let products = [];

    for (const menu of menus) {

      if (!menu.products) continue;

      for (const product of menu.products) {

        products.push({
          id: product._id,
          name: product.name,
          description: product.description || "Producto sin descripción",
          category: product.category,
          price: product.price
        });

      }
    }

    return products;
  }

}
export default new MongoMenuDAO();