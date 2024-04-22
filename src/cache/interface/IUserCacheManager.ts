import type { MongoId } from "../../mongodb/types";
import type { IUserCache } from "./IUserCache";

export default interface IUserCacheManager{
    getUser(id:MongoId):Promise<IUserCache>
    invalidate(id:MongoId):void
}