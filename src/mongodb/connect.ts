import mongoose from "mongoose"
require('dotenv').config({path:__dirname+'/../../config/.env'})
import CONFIG from "../../config/config.json"


export const connectMongoDB=async function(){

    console.log("connecting to mongodb ")
    try{
        if(CONFIG.localDB && process.env.MONGODB_URL_LOCAL){
            await mongoose.connect(process.env.MONGODB_URL_LOCAL)
        }
        else if(process.env.MONGODB_URL)
        await mongoose.connect(process.env.MONGODB_URL)
    }
    catch(e){
        console.log('mongodb Connection Failed!');
    }
    
}