import type { Request } from "express"
import { MongoId } from "../mongodb/types"
import { ISession, IUserStatus, STATUS_PRIPROTY, SessionProps } from "./ISession"
import ISessionManager from "./ISessionManager"
import * as Auth from "./jwt"
import { v4 as uuidv4 } from "uuid"
import { R } from "../Room/RoomStorage"
import { UserSchema } from "../mongodb/schemaController/User"
import { User } from "../mongodb/UserDBSchema"
import { RedisClient } from "../redis/redis"
import { Counter } from "../util"

export class RedisSession implements ISessionManager {
	private static instance: RedisSession
	private readonly sessionPrefix = "session:" //+session id ,type:obj
	private readonly statusPrefix_sessionid = "status-sessionids:" //+user id, type:set
	private readonly statusPrefix_chatrooms = "status-chatrooms:" //+user id, type:set
	private readonly statusPrefix_sockets = "status-sockets:" //+user id, type:string(csv)
	private readonly statusPrefix_username = "status-username:" //+user id, type:string
	private readonly statusPrefix_lastactive = "status-lastactive:" //+user id, type:string(timestamp)

	private constructor() {

    }
    async onStart(): Promise<void> {
       await RedisClient.clearAll(this.statusPrefix_sockets+"*").then()
       await RedisClient.clearAll(this.statusPrefix_chatrooms+"*").then()
    }

	static getInstance() {
		if (this.instance) {
			return this.instance
		}
		this.instance = new RedisSession()
		return this.instance
	}
	private convert(obj: Record<string, string>): ISession {
		return {
			loggedin: obj.loggedin === "true",
			id: obj.id,
			time: new Date(obj.time),

			userId: obj.userId,
			username: obj.username,
			boardDataId: obj.boardDataId,
			roomname: obj.roomname,
			turn: obj.turn ? Number(obj.turn) : undefined,
		}
	}
	/**
	 * datetime is always stores as YYYY-MM-DDTHH:mm:ss.sssZ
	 * @param date
	 * @returns
	 */
	private timestamp(): string {
		return new Date().toISOString()
	}
	private appendToCsv(current: string | null, toadd: string): string {
		return current ? current + "," + toadd : toadd
	}
	private removeFromCsv(current: string | null, toremove: string): string {
		if (!current) return ""
		const counter = this.csvToCounter(current)
		counter.delete(toremove)
		return counter.toArray().join(",")
	}
	private csvToCounter(csv: string) {
		return new Counter<string>(csv.split(",").filter((s) => s !== ""))
	}
	async setTurn(id: string, turn: number): Promise<void> {
		await RedisClient.setObjProp<SessionProps>(this.sessionPrefix + id, "turn", String(turn))
	}
	async setRoomname(id: string, roomname: string): Promise<void> {
		await RedisClient.setObjProp<SessionProps>(this.sessionPrefix + id, "roomname", roomname)
	}
	async setUsername(id: string, username: string): Promise<void> {
		await RedisClient.setObjProp<SessionProps>(this.sessionPrefix + id, "username", username)
	}
	async setBoardDataId(id: string, boarddataid: string): Promise<void> {
		await RedisClient.setObjProp<SessionProps>(this.sessionPrefix + id, "boardDataId", boarddataid)
	}

	async removeGameSession(id: string): Promise<void> {
		await RedisClient.removeObjProp<SessionProps>(this.sessionPrefix + id, "turn")
		await RedisClient.removeObjProp<SessionProps>(this.sessionPrefix + id, "roomname")
	}
	private async getUserStatus(userId: string): Promise<IUserStatus | null> {
		if (!(await this.hasSession(userId))) return null
        let sockets=await RedisClient.get(this.statusPrefix_sockets + userId)
		return {
			userId: userId,
			username: await RedisClient.get(this.statusPrefix_username + userId),
			lastActive: new Date(await RedisClient.get(this.statusPrefix_lastactive + userId)),
			sockets: sockets?sockets.split(","):[],
			chatRooms: await RedisClient.getSet(this.statusPrefix_chatrooms + userId),
			sessionIds: await RedisClient.getSet(this.statusPrefix_sessionid + userId),
		}
	}
	async getAll(): Promise<ISession[]> {
		let keys = await RedisClient.allKeys(this.sessionPrefix+"*")
		let all = []
		for(const key of keys){
			all.push(await this.getSessionById(key.split(":")[1]))
		}
		return all
	}
	async getAllUsers(): Promise<IUserStatus[]> {
		let keys = await RedisClient.allKeys(this.statusPrefix_username+"*")
		let all = []
		for(const key of keys){
			let status= await this.getUserStatus(key.split(":")[1])
			if(status)
				all.push(status)
		}
		return all
	}
	async hasSession(userId: string | undefined): Promise<boolean> {
		if (!userId) return false
		return await RedisClient.has(this.statusPrefix_username + userId)
	}
	async getSessionsByUserId(userId: string): Promise<ISession[]> {
		const sessionids = await RedisClient.getSet(this.statusPrefix_sessionid + userId)
		let sessions = []
		for (const id of sessionids) {
			sessions.push(this.convert(await RedisClient.getObj(this.sessionPrefix + id)))
		}
		return sessions
	}
	async createSession(): Promise<string> {
		const id = uuidv4()
		await RedisClient.setObj(this.sessionPrefix + id, {
			id: id,
			loggedin: false,
			time: this.timestamp(),
		})
		return Auth.getNewJwt(id)
	}
	async getSessionById(id: string): Promise<ISession> {
		return this.convert(await RedisClient.getObj(this.sessionPrefix + id))
	}
	async getSession(req: Request): Promise<ISession> {
		const id = Auth.getSessionId(req)
		return this.convert(await RedisClient.getObj(this.sessionPrefix + id))
	}
	async deleteSession(req: Request): Promise<void> {
		const id = Auth.getSessionId(req)
		await RedisClient.remove(this.sessionPrefix +id)
	}
	async isValid(req: Request): Promise<boolean> {
		const id = Auth.getSessionId(req)
		return await RedisClient.has(this.sessionPrefix +id)
	}
	async isLoginValid(session: ISession): Promise<boolean> {
		if (!session || !session.loggedin || !session.userId || !(await this.hasSession(session.userId))) return false
		return true
	}
	async onEnterChatRoom(session: ISession, roomId: MongoId): Promise<void> {
		if (!(await this.isLoginValid(session))) return
		await RedisClient.addToSet(this.statusPrefix_chatrooms + session.userId, String(roomId))
	}
	async onLeaveChatRoom(session: ISession, roomId: MongoId): Promise<void> {
		if (!(await this.isLoginValid(session))) return
		await RedisClient.removeFromSet(this.statusPrefix_chatrooms + session.userId, String(roomId))
	}
	async isUserInChatRoom(userId: MongoId, roomId: MongoId): Promise<boolean> {
		if (!(await this.hasSession(String(userId)))) return false
		return await RedisClient.isInSet(this.statusPrefix_chatrooms + String(userId), String(roomId))
	}
	async onSocketConnect(session: ISession, type: string): Promise<void> {
		if (!(await this.isLoginValid(session)) || !type) return
		const key = this.statusPrefix_sockets + session.userId
		let current = await RedisClient.get(key)
		await RedisClient.set(key, this.appendToCsv(current, type))
	}
	async onSocketAccess(session: ISession): Promise<void> {
		if (!(await this.isLoginValid(session))) return
		await RedisClient.set(this.statusPrefix_lastactive + session.userId, this.timestamp())
	}
	async onSocketDisconnect(session: ISession, type: string): Promise<void> {
		if (!(await this.isLoginValid(session)) || !type) return
		const key = this.statusPrefix_sockets + session.userId
		let current = await RedisClient.get(key)
		let removed = this.removeFromCsv(current, type)
		await RedisClient.set(key, removed)
		this.onSocketAccess(session).then()
	}
	async getGameByUserId(userId: string): Promise<string> {
		const status = await this.getUserStatus(userId)

		if (!status || status.sessionIds.length <= 0 || !status.sockets.includes("rpggame")) return null

		for (const sid of status.sessionIds) {
			const session = await this.getSessionById(sid)
			if (session && session.roomname && session.turn !== undefined && session.turn >= 0) {
				let rname = session.roomname
				if (R.getRPGRoom(rname).isGameStarted) return rname
			}
		}
		return null
	}
	async getStatus(userId: MongoId): Promise<[Date, string]> {
		userId = String(userId)
		const status = await this.getUserStatus(userId)
		//console.log(status)
		if (status != null) {
			const statusSet = status.sockets
			const last = status.lastActive

			if (statusSet.length === 0) return [last, null]
			for (const type of STATUS_PRIPROTY) {
				if (statusSet.includes(type)) return [last, type]
			}
			return [last, "online"]
		} else return [null, null]
	}
	async login(req: Request, userId: string, username: string): Promise<boolean> {
		try {
			let id = Auth.getSessionId(req)
			await RedisClient.setObjProp(this.sessionPrefix + id, "loggedin", "true")
			await RedisClient.setObjProp(this.sessionPrefix + id, "userId", userId)

			//   SessionIds.set(userId,id)
			if (await this.hasSession(userId)) {
				await RedisClient.addToSet(this.statusPrefix_sessionid + userId, id)
			} else {
				await RedisClient.addToSet(this.statusPrefix_sessionid + userId, id)
				await RedisClient.set(this.statusPrefix_sockets + userId, "")
				await RedisClient.set(this.statusPrefix_username + userId, username)
			}
			return true
		} catch (e) {
			console.error(e)
			return false
		}
	}
	async logout(req: Request): Promise<boolean> {
		try {
			let id = Auth.getSessionId(req)
			const session = await this.getSessionById(id)
			const sessionkey = this.sessionPrefix + id
			await RedisClient.removeObjProp(sessionkey, "loggedin")

			// SessionIds.delete(session.userId)
			if (session.userId && (await this.hasSession(session.userId))) {
				await RedisClient.removeFromSet(this.statusPrefix_sessionid + session.userId, id)
				let sessioncount = await RedisClient.countSet(this.statusPrefix_sessionid + session.userId)
				if (sessioncount === 0) {
					await RedisClient.remove(this.statusPrefix_chatrooms + session.userId)
					await RedisClient.remove(this.statusPrefix_sockets + session.userId)
				}
			}
			await RedisClient.removeObjProp(sessionkey, "userId")
			await RedisClient.removeObjProp(sessionkey, "username")
			await RedisClient.removeObjProp(sessionkey, "boardDataId")
			return true
		} catch (e) {
			console.error(e)
			return false
		}
	}
}
