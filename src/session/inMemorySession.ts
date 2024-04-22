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
import type { ISession } from './ISession';
import ISessionManager from './ISessionManager';

// export interface ISession{
//     isLogined:boolean
//     id:string
//     time:Date
    
//     userId?:string
//     username?:string
//     boardDataId?:string
//     roomname?:string
//     turn?:number
//     ip?:string
// }

export interface IUserStatus{
    sessionIds:Set<string>
    chatRooms:Set<string>
    sockets:Counter<string>
    username:string
    lastActive?:Date
}

const STATUS_PRIPROTY = [
    "rpggame","marblegame","matching","rpgspectate"
]

export class InMemorySession implements ISessionManager{
    private SessionStore = new Map<string,ISession>()
    private UserStatus = new Map<string,IUserStatus>()  // user id  => status
  
    private static instance: InMemorySession;

    private constructor() {}
   
  
    static getInstance() {
      if (this.instance) {
        return this.instance;
      }
      this.instance = new InMemorySession();
      return this.instance;
    }
    async setTurn(id: string, turn: number): Promise<void> {
        if(!this.SessionStore.has(id)) return
        this.SessionStore.get(id).turn=turn
    }
    async setRoomname(id: string, roomname: string): Promise<void> {
        if(!this.SessionStore.has(id)) return
        this.SessionStore.get(id).roomname=roomname
    }
    async removeGameSession(id: string): Promise<void> {
        if(!this.SessionStore.has(id)) return
        const session = this.SessionStore.get(id)
        delete session.turn 
		delete session.roomname
    }
    async getAll(){
        return [...this.SessionStore.values()]
    }
    async getAllUsers(){
        let users=[]
        for(const [id,status] of this.UserStatus.entries()){
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
    async hasSession(userId:string){
        return this.UserStatus.has(userId)
    }
    async getSessionsByUserId(userId:string){
        const status = this.UserStatus.get(userId)
        if(!status) return []
        return [...status.sessionIds].map(id=>this.SessionStore.get(id))
    }
    /**
     * create a new session and return a jwt containing session id
     * @returns 
     */
    async createSession(){
        
        const id = uuidv4()
        this.SessionStore.set(id,{id:id,isLogined:false,time:new Date()})
        return getNewJwt(id)
    }
    async getSessionById(id:string){
        return this.SessionStore.get(id)
    }
    async getSession(req:Request){
        
        let id= getSessionId(req)
        return this.SessionStore.get(id)
    }
    async deleteSession(req:Request){
        let id= getSessionId(req)
        this.SessionStore.delete(id)
    }
    async isValid(req:Request){
        let id= getSessionId(req)
        return this.SessionStore.has(id)
    }
    private isLoginValid(session:ISession){
        if(!session || !session.isLogined || !session.userId || !this.UserStatus.has(session.userId)) return false
        return true
    }
    async onEnterChatRoom(session:ISession,roomId:MongoId){
        if(!this.isLoginValid(session)) return
        this.UserStatus.get(session.userId).chatRooms.add(String(roomId))

    }
    async onLeaveChatRoom(session:ISession,roomId:MongoId){
        if(!this.isLoginValid(session)) return
        this.UserStatus.get(session.userId).chatRooms.delete(String(roomId))
    }
    async isUserInChatRoom(userId:MongoId,roomId:MongoId){
        if(!this.UserStatus.has(String(userId))) return false
        return this.UserStatus.get(String(userId)).chatRooms.has(String(roomId))
    }
    async onSocketConnect(session:ISession,type:string){
        if(!this.isLoginValid(session) || !type) return
        this.UserStatus.get(session.userId).sockets.add(type)
        
    }
     async  onSocketAccess(session:ISession){
        if(!this.isLoginValid(session)) return
        this.UserStatus.get(session.userId).lastActive = new Date()
        
    }
    async onSocketDisconnect(session:ISession,type:string){
        if(!this.isLoginValid(session) || !type) return

        this.UserStatus.get(session.userId).sockets.delete(type)
        this.UserStatus.get(session.userId).lastActive = new Date()
        UserSchema.updateLastActive(session.userId).then()
    }
    async getGameByUserId(userId:string){
        const status = this.UserStatus.get(userId)
        if(!status || status.sessionIds.size <=0 || status.sockets.countItem("rpggame") <=0) return null
        
        for(const sid of status.sessionIds){
            if(this.SessionStore.get(sid).roomname && this.SessionStore.get(sid).turn!==undefined && this.SessionStore.get(sid).turn>=0)
            {
                let rname = this.SessionStore.get(sid).roomname
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
    async getStatus(userId:MongoId): Promise<[Date, string]> {
        userId=String(userId)

        if(this.UserStatus.has(userId)){
            const statusSet = this.UserStatus.get(userId).sockets
            const last=this.UserStatus.get(userId).lastActive

            if(statusSet.size===0) return [last,null]
            for(const type of STATUS_PRIPROTY){
                if(statusSet.countItem(type)>0)
                    return [last,type]
            }
            return [last,"online"]
        }
        else return [null,null]
    }
    async login(req:Request,userId:string,username:string){
        try{
            let id= getSessionId(req)
            this.SessionStore.get(id).isLogined=true
            this.SessionStore.get(id).userId=userId
         //   SessionIds.set(userId,id)
            if(this.UserStatus.has(userId)){
                this.UserStatus.get(userId).sessionIds.add(id)
            }
            else{
                this.UserStatus.set(userId,{
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
    async logout(req:Request){
        try{
            let id= getSessionId(req)
            const session = this.SessionStore.get(id)
            session.isLogined=false
           // SessionIds.delete(session.userId)
           if(this.UserStatus.has(session.userId)){
                this.UserStatus.get(session.userId).sessionIds.delete(id)
                if(this.UserStatus.get(session.userId).sessionIds.size===0)
                    this.UserStatus.get(session.userId).sockets.clear()
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

export namespace SessionManager{

}

