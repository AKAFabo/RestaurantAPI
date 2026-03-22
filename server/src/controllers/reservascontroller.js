import * as reservationDao from "../daos/menuDao.js" ;

export const createreservaion = async (req,res) =>{
    try{

        const {table_id, reservation_time} = req.body;

        //  Obtener usuario desde el token (Keycloak)
        const user = req.kauth?.grant?.access_token?.content;

        const user_id = user?.sub; //  ID del usuario en Keycloak

        if (!table_id || !reservation_time){

            return res.status(400).json({error:"table_id y reservation time son requerido"});
            
        }

        if (!user_id){
            return res.status(401).json({ error:"usuario no autenticado"})

        }


        const reservation = await reservationDao.createreservaion({user_id,table_id,reservation_time});

        res.status(201).json({
            message:"Reserva creada",
            reservation
        });



    } catch (error){
        console.error("Error creando reserva", error);

        res.status(500).json({error:"Error creando reserva"})

    }

};


export const deletereservation = async (req,res) =>{
    try {

        const { id } = req.params;

        //  Usuario desde token
        const user = req.kauth?.grant?.access_token?.content;
        const user_id = user?.sub;

        // Validaciones
        if (!id) {
        return res.status(400).json({
            error: "ID requerido"
        });
        }

        if (!user_id) {
        return res.status(401).json({
            error: "Usuario no autenticado"
        });
        }

        // DAO
        const result = await reservationDAO.deletereservation(id, user_id);

        if (result === "NOT_FOUND") {
        return res.status(404).json({
            error: "Reserva no encontrada"
        });
        }

        if (result === "NOT_OWNER") {
        return res.status(403).json({
            error: "No puedes cancelar esta reserva"
        });
        }

        if (result === "ALREADY_CANCELLED") {
        return res.status(400).json({
            error: "La reserva ya está cancelada"
        });
        }

        //  OK
        res.json({
        message: "Reserva cancelada correctamente"
        });

    } catch (error) {
        console.error("Error cancelando reserva:", error);

        res.status(500).json({
        error: "Error cancelando reserva"
        });
    }


};