import type { Request } from "express";
import { MongoId } from "../mongodb/types";
import { ISession } from "./ISession";
import ISessionManager from "./ISessionManager";

export class RedisSession implements ISessionManager{
    private static instance: RedisSession;

    private constructor() {}
   
  
    static getInstance() {
      if (this.instance) {
        return this.instance;
      }
      this.instance = new RedisSession();
      return this.instance;
    }
    setTurn(id: string, turn: number): Promise<void> {
        throw new Error("Method not implemented.");
    }
    setRoomname(id: string, roomname: string): Promise<void> {
        throw new Error("Method not implemented.");
    }
    removeGameSession(id: string): Promise<void> {
        throw new Error("Method not implemented.");
    }
    getAll(): Promise<ISession[]> {
        throw new Error("Method not implemented.");
    }
    getAllUsers(): Promise<{ id: string; username: string; chatRooms: string[]; sessionIds: string[]; lastActive: Date; sockets: string[]; }[] >{
        throw new Error("Method not implemented.");
    }
    hasSession(userId: string): Promise<boolean >{
        throw new Error("Method not implemented.");
    }
    getSessionsByUserId(userId: string): Promise<ISession[] >{
        throw new Error("Method not implemented.");
    }
    createSession(): Promise<string >{
        throw new Error("Method not implemented.");
    }
    getSessionById(id: string): Promise<ISession >{
        throw new Error("Method not implemented.");
    }
    getSession(req: Request): Promise<ISession> {
        throw new Error("Method not implemented.");
    }
    deleteSession(req: Request):Promise< void> {
        throw new Error("Method not implemented.");
    }
    isValid(req: Request): Promise<boolean> {
        throw new Error("Method not implemented.");
    }
    isLoginValid(session: ISession): Promise<boolean >{
        throw new Error("Method not implemented.");
    }
    onEnterChatRoom(session: ISession, roomId: MongoId): Promise<void> {
        throw new Error("Method not implemented.");
    }
    onLeaveChatRoom(session: ISession, roomId: MongoId): Promise<void >{
        throw new Error("Method not implemented.");
    }
    isUserInChatRoom(userId: MongoId, roomId: MongoId): Promise<boolean >{
        throw new Error("Method not implemented.");
    }
    onSocketConnect(session: ISession, type: string): Promise<void >{
        throw new Error("Method not implemented.");
    }
    onSocketAccess(session: ISession): Promise<void> {
        throw new Error("Method not implemented.");
    }
    onSocketDisconnect(session: ISession, type: string): Promise<void >{
        throw new Error("Method not implemented.");
    }
    getGameByUserId(userId: string): Promise<string >{
        throw new Error("Method not implemented.");
    }
    getStatus(userId: MongoId): Promise<[Date, string]> {
        throw new Error("Method not implemented.");
    }
    login(req: Request, userId: string, username: string): Promise<boolean >{
        throw new Error("Method not implemented.");
    }
    logout(req: Request): Promise<boolean> {
        throw new Error("Method not implemented.");
    }

}