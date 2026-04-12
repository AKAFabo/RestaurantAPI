import mongoose from 'mongoose';

const connectMongo = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("mongo conectado");
    } catch (error) {
        console.error("error conectando a mongo", error);
        process.exit(1);
    }
};

export default connectMongo;