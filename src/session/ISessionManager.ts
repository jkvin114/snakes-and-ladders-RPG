import type { ISession } from "./ISession";
import type {Request} from 'express';
import type { MongoId } from '../mongodb/types';

export default interface ISessionManager{

    getAll(): Promise<ISession[]> 
    getAllUsers(): Promise<{ id: string; username: string; chatRooms: string[]; sessionIds: string[]; lastActive: Date; sockets: string[]; }[] >
    hasSession(userId: string): Promise<boolean >
    getSessionsByUserId(userId: string): Promise<ISession[] >
    createSession(): Promise<string >
    getSessionById(id: string): Promise<ISession >
    getSession(req: Request): Promise<ISession>
    deleteSession(req: Request):Promise< void> 
    isValid(req: Request): Promise<boolean> 
    //isLoginValid(session: ISession): Promise<boolean >
    onEnterChatRoom(session: ISession, roomId: MongoId): Promise<void> 
    onLeaveChatRoom(session: ISession, roomId: MongoId): Promise<void >
    isUserInChatRoom(userId: MongoId, roomId: MongoId): Promise<boolean >
    onSocketConnect(session: ISession, type: string): Promise<void >
    onSocketAccess(session: ISession): Promise<void>
    onSocketDisconnect(session: ISession, type: string): Promise<void >
    getGameByUserId(userId: string): Promise<string >
    getStatus(userId: MongoId): Promise<[Date, string]> 
    login(req: Request, userId: string, username: string): Promise<boolean >
    logout(req: Request): Promise<boolean>


    setTurn(id:string,turn:number):Promise<void>
    setRoomname(id:string,roomname:string):Promise<void>
    removeGameSession(id:string):Promise<void>
}