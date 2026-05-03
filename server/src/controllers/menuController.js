import { menuService } from "../services/config.js";
import os from "os";
export const getMenuById = async (req,res) =>{
  console.log(" API  desde:", os.hostname());
    try{

        const { id} = req.params;
        // validacion del id
    if (!id){
        return res.status(400).json({error:"Id requerido"});

    }



    const menu = await menuService.getMenuById(id); // obtener informacion del menu

    if (!menu){
        return res.status(404).json({error:"Menu no encontrado"});
    }


    res.json(menu); // devolver informacion 
    }
    catch(error){
        console.error(error);
        res.status(500).json({error:"Error obteniendo el menu"});
    }


};

export const updateMenubyId = async (req,res) =>{
    console.log(" API  desde:", os.hostname());
    try{
        // parametros
        const { id} = req.params;

        const {name} = req.body;
        // validacion del id
    if (!id){
        return res.status(400).json({error:"Id requerido"});

    }

    if(!name ){ // validacion del nombre
        return res.status(400).json({error:"Nombre requerido"});

    }



    const menu = await menuService.updateMenuById(id, name); // hacer la actualizacionn

    if (!menu){ // errores posibles 
        return res.status(404).json({error:"Menu no encontrado"});
    }


    res.json({message:"Menu actualizado", menu:menu}); // si se encontro sin problemas
    }
    catch(error){
        console.error(error);
        res.status(500).json({error:"Error obteniendo el menu"});
    }


};



export const deleteMenu = async (req, res) => {
  console.log(" API  desde:", os.hostname());
  try {

    const { id } = req.params; // parametro del url

    if (!id) {// validacion del id 
      return res.status(400).json({
        error: "ID requerido"
      });
    }

    const menu = await menuService.deleteMenu(id); // elimina el menu y devuelve

    if (!menu) { // en caso de que no se encuentre el menu que se queria eliminar 
      return res.status(404).json({
        error: "Menú no encontrado"
      });
    }

    res.json({ // caso exitoso
      message: "Menú eliminado correctamente"
    });

  } catch (error) {
    console.error("Error eliminando menú:", error);

    res.status(500).json({
      error: "Error eliminando menú"
    });
  }
};



export const getAllProducts = async (req, res) => { // para el elastic search que necesita todos los productos 
   console.log(" API productos desde:", os.hostname());
  try {

    const products = await menuService.getAllProducts(); // llama al service para obtener los productos 

    res.json(products);

  } catch (error) {
    console.error("Error obteniendo productos:", error);

    res.status(500).json({
      error: "Error obteniendo productos"
    });
  }
};