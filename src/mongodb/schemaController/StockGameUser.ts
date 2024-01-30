import { StockGameUser } from "../StockGameSchema"
import { MongoId } from "../types"

export namespace StockGameUserSchema{
    export async function findByUserId(userId: MongoId){
        return StockGameUser.findOne({user:userId})
    }
    export function createUser(userId: MongoId){
        return StockGameUser.create({user:userId,totalGames:0})
    }
    export function incrementTotalGames(userId: MongoId){
        StockGameUser.findOneAndUpdate({user:userId},{
            $inc:{totalGames:1}
        }).then()
    }
}