import {Request} from 'express';
import {  getNewJwt, getSessionId, getSessionIdFromSocket } from "./jwt"
import { v4 as uuidv4 } from 'uuid';
import type { Socket } from 'socket.io';

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
    status?:string
    currentChatRoom?:string
}
const SessionStore = new Map<string,ISession>()
const SessionIds = new Map<string,string>() //session id => user id

export namespace SessionManager{

    export function getSessionByUserId(userId:string):ISession|undefined{
        const id = SessionIds.get(userId)
        if(!id) return undefined
        return SessionStore.get(id)
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
    export function login(req:Request,userId:string){
        try{
            let id= getSessionId(req)
            SessionStore.get(id).isLogined=true
            SessionStore.get(id).userId=userId
            SessionIds.set(userId,id)
            return true
        }
        catch(e)
        {
            return false
        }
    }
    export function logout(req:Request){
        try{
            let id= getSessionId(req)
            const session = SessionStore.get(id)
            session.isLogined=false
            SessionIds.delete(session.userId)
            delete session.userId
            delete session.username
            delete session.boardDataId
            return true
        }
        catch(e)
        {
            return false
        }
    }
}

