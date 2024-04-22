import type { MongoId } from "../../mongodb/types"

export default interface IFriendRequestCacheManager{
    add(from:MongoId,to:MongoId):Promise<void>
    getRequested(from:MongoId):Promise<Set<string>|undefined>

    remove(from:MongoId,to:MongoId):Promise<boolean>

    has(from:MongoId,to:MongoId):Promise<boolean>
    clear():Promise<void>
}