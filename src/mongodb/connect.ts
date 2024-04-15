import mongoose from "mongoose"
require('dotenv').config({path:__dirname+'/../../config/.env'})
import CONFIG from "../../config/config.json"
import { Logger } from "../logger"


export const connectMongoDB=async function(){

    Logger.log("connecting to mongodb ")
    try{
        if(CONFIG.localDB && process.env.MONGODB_URL_LOCAL){
            await mongoose.connect(process.env.MONGODB_URL_LOCAL)
        }
        else if(process.env.MONGODB_URL)
        await mongoose.connect(process.env.MONGODB_URL)
    }
    catch(e){
        Logger.err('mongodb Connection Failed!');
    }
    
}