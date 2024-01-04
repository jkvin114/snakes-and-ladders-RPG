import {Request} from 'express';
import { getNewJwt, getSessionId } from "./jwt"
import { v4 as uuidv4 } from 'uuid';

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
const SessionStore = new Map<string,ISession>()


export namespace SessionManager{
    /**
     * create a new session and return a jwt containing session id
     * @returns 
     */
    export function createSession(login:boolean){
        
        const id = uuidv4()
        SessionStore.set(id,{id:id,isLogined:login,time:new Date()})
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
    
}

