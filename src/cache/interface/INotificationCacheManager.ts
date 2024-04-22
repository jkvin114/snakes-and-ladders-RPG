import { MongoId } from "../../mongodb/types"

export default interface INotificationCacheManager{
    post(userId:MongoId):Promise<void>
    consume(userId:MongoId):Promise<boolean>
}