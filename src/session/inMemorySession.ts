import {Request} from 'express';
import {  getNewJwt, getSessionId, getSessionIdFromSocket } from "./jwt"
import { v4 as uuidv4 } from 'uuid';
import type { Socket } from 'socket.io';
import { Counter } from '../RPGGame/core/Util';
import { MongoId } from '../mongodb/types';
import { UserCache } from '../cache/cache';
import { R } from '../Room/RoomStorage';
import { UserSchema } from '../mongodb/schemaController/User';
import { User } from '../mongodb/UserDBSchema';

export interface ISession{
    isLogined:boolean
    id:string
    time:Date
    
    userId?:string
    username?:string
    boardDataId?:string
    roomname?:string
    turn?:number
    ip?:string
}

export interface IUserStatus{
    sessionIds:Set<string>
    chatRooms:Set<string>
    sockets:Counter<string>
    username:string
    lastActive?:Date
}
const SessionStore = new Map<string,ISession>()
const UserStatus = new Map<string,IUserStatus>()  // user id  => status

const STATUS_PRIPROTY = [
    "rpggame","marblegame","matching","rpgspectate"
]

export namespace SessionManager{

    export function getAll(){
        return [...SessionStore.values()]
    }
    export function getAllUsers(){
        let users=[]
        for(const [id,status] of UserStatus.entries()){
            users.push({
                id:id,
                username:status.username,
                chatRooms:[...status.chatRooms],
                sessionIds:[...status.sessionIds],
                lastActive:status.lastActive,
                sockets:status.sockets.toArray()
            })
        }
        return users

    }
    export function hasSession(userId:string){
        return UserStatus.has(userId)
    }
    export function getSessionsByUserId(userId:string):ISession[]{
        const status = UserStatus.get(userId)
        if(!status) return []
        return [...status.sessionIds].map(id=>SessionStore.get(id))
    }
    /**
     * create a new session and return a jwt containing session id
     * @returns 
     */
    export function createSession(){
        
        const id = uuidv4()
        SessionStore.set(id,{id:id,isLogined:false,time:new Date()})
        return getNewJwt(id)
    }
    export function getSessionById(id:string):ISession{
        return SessionStore.get(id)
    }
    export function getSession(req:Request):ISession{
        
        let id= getSessionId(req)
        return SessionStore.get(id)
    }
    export function deleteSession(req:Request){
        let id= getSessionId(req)
        SessionStore.delete(id)
    }
    export function isValid(req:Request){
        let id= getSessionId(req)
        return SessionStore.has(id)
    }
    function isLoginValid(session:ISession){
        if(!session || !session.isLogined || !session.userId || !UserStatus.has(session.userId)) return false
        return true
    }
    export function onEnterChatRoom(session:ISession,roomId:MongoId){
        if(!isLoginValid(session)) return
        UserStatus.get(session.userId).chatRooms.add(String(roomId))

    }
    export function onLeaveChatRoom(session:ISession,roomId:MongoId){
        if(!isLoginValid(session)) return
        UserStatus.get(session.userId).chatRooms.delete(String(roomId))
    }
    export function isUserInChatRoom(userId:MongoId,roomId:MongoId){
        if(!UserStatus.has(String(userId))) return false
        return UserStatus.get(String(userId)).chatRooms.has(String(roomId))
    }
    export function onSocketConnect(session:ISession,type:string){
        if(!isLoginValid(session) || !type) return
        UserStatus.get(session.userId).sockets.add(type)
        
    }
    export async function onSocketAccess(session:ISession){
        if(!isLoginValid(session)) return
        UserStatus.get(session.userId).lastActive = new Date()
        
    }
    export function onSocketDisconnect(session:ISession,type:string){
        if(!isLoginValid(session) || !type) return

        UserStatus.get(session.userId).sockets.delete(type)
        UserStatus.get(session.userId).lastActive = new Date()
        UserSchema.updateLastActive(session.userId).then()
    }
    export function getGameByUserId(userId:string):string|null{
        const status = UserStatus.get(userId)
        if(!status || status.sessionIds.size <=0 || status.sockets.countItem("rpggame") <=0) return null
        
        for(const sid of status.sessionIds){
            if(SessionStore.get(sid).roomname && SessionStore.get(sid).turn!==undefined && SessionStore.get(sid).turn>=0)
            {
                let rname = SessionStore.get(sid).roomname
                if(R.getRPGRoom(rname).isGameStarted)
                    return rname
            }
        }
        return null
    }
    /**
     * 
     * @param userId 
     * @returns [last active date, status type]
     */
    export function getStatus(userId:MongoId):[Date,string|null]{
        userId=String(userId)

        if(UserStatus.has(userId)){
            const statusSet = UserStatus.get(userId).sockets
            const last=UserStatus.get(userId).lastActive

            if(statusSet.size===0) return [last,null]
            for(const type of STATUS_PRIPROTY){
                if(statusSet.countItem(type)>0)
                    return [last,type]
            }
            return [last,"online"]
        }
        else return [null,null]
    }
    export function login(req:Request,userId:string,username:string){
        try{
            let id= getSessionId(req)
            SessionStore.get(id).isLogined=true
            SessionStore.get(id).userId=userId
         //   SessionIds.set(userId,id)
            if(UserStatus.has(userId)){
                UserStatus.get(userId).sessionIds.add(id)
            }
            else{
                UserStatus.set(userId,{
                    sessionIds:new Set<string>().add(id),
                    sockets:new Counter<string>(),
                    chatRooms:new Set<string>(),
                    username:username
                })
            }
            return true
        }
        catch(e)
        {
            console.error(e)
            return false
        }
    }
    export function logout(req:Request){
        try{
            let id= getSessionId(req)
            const session = SessionStore.get(id)
            session.isLogined=false
           // SessionIds.delete(session.userId)
           if(UserStatus.has(session.userId)){
                UserStatus.get(session.userId).sessionIds.delete(id)
                if(UserStatus.get(session.userId).sessionIds.size===0)
                    UserStatus.get(session.userId).sockets.clear()
            }
            delete session.userId
            delete session.username
            delete session.boardDataId
            return true
        }
        catch(e)
        {
            console.error(e)
            return false
        }
    }
}

