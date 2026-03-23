import * as menuDao from "../daos/menuDao.js" ;
export const getMenuById = async (req,res) =>{
    try{

        const { id} = req.params;
        // validacion del id
    if (!id){
        return res.status(400).json({error:"Id requerido"});

    }



    const menu = await menuDao.getMenuById(id);

    if (!menu){
        return res.status(404).json({error:"Menu no encontrado"});
    }


    res.json(menu);
    }
    catch(error){
        console.error(error);
        res.status(500).json({error:"Error obteniendo el menu"});
    }


};

export const updateMenubyId = async (req,res) =>{
    try{

        const { id} = req.params;

        const {name} = req.body;
        // validacion del id
    if (!id){
        return res.status(400).json({error:"Id requerido"});

    }

    if(!name ){
        return res.status(400).json({error:"Nombre requerido"});

    }



    const menu = await menuDao.updateMenubyId(id,name);

    if (!menu){
        return res.status(404).json({error:"Menu no encontrado"});
    }


    res.json({message:"Menu actualizado", menu:menu});
    }
    catch(error){
        console.error(error);
        res.status(500).json({error:"Error obteniendo el menu"});
    }


};



export const deleteMenu = async (req, res) => {
  try {

    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        error: "ID requerido"
      });
    }

    const menu = await menuDao.deleteMenu(id);

    if (!menu) {
      return res.status(404).json({
        error: "Menú no encontrado"
      });
    }

    res.json({
      message: "Menú eliminado correctamente"
    });

  } catch (error) {
    console.error("Error eliminando menú:", error);

    res.status(500).json({
      error: "Error eliminando menú"
    });
  }
};