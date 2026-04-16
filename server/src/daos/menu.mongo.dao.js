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
    updateMenubyId = async (id,name) =>{

        const updateMenu= await Menu.findByIdAndUpdate(
            id,{name},{new:true} // devuelve el menu actualizado
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

}
export default new MongoMenuDAO();