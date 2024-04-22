import Redis from "ioredis"
import { Logger } from "../logger"

export namespace RedisClient {
	let redisClient: any = null

	export function connect(host: string, port: number, callback: Function) {
		Logger.log("redis host:" + host + ":" + port)
		redisClient = new Redis(port, host)
		//  console.log(redisClient)
		redisClient.on("error", (err: Error) => {
			Logger.error("Redis Client Error", err)
		})
		redisClient.on("connect", () => {
			Logger.log("connected to redis")
			callback()
		})
	}
	export function isAvailable() {
		return redisClient != null
	}
	export async function ping() {
		//console.log(await RedisClient.getSet("cache-notification"))
		return redisClient != null ? await redisClient.ping() : null
	}
	export async function setObj(key: string, obj: any) {
		if (!redisClient) return
		try {
			await redisClient.hset(key, obj)
		} catch (e) {
			Logger.error("Redis Client Error", e)
		}
	}
	export async function getObj(key: string) {
		if (!redisClient) return null
		try {
			return redisClient.hgetall(key)
		} catch (e) {
			Logger.error("Redis Client Error", e)
			return null
		}
	}
	export async function has(key: string): Promise<boolean> {
		if (!redisClient) return false
		try {
			return (await redisClient.exists(key)) === 1
		} catch (e) {
			Logger.error("Redis Client Error", e)
			return false
		}
	}
	export async function remove(key: string) {
		if (!redisClient) return
		try {
			await redisClient.del(key)
		} catch (e) {
			Logger.error("Redis Client Error", e)
			return
		}
	}
	export async function set(key: string, val: string) {
		if (!redisClient) return
		// await redisClient.hSet("user-cache:123",{
		//     id:1234,
		//     room:4567
		// // })
		// await redisClient.hset("user-cache:123","id","1234")
		// await redisClient.hset("user-cache:123","room","4567")
		//  await redisClient.set("user","123")
		//await redisClient.hset("","","")
		try {
			await redisClient.set(key, val)
		} catch (e) {
			Logger.error("Redis Client Error", e)
			return
		}
	}
	export async function get(key: string): Promise<string | null> {
		if (!redisClient) return null
		try {
			return await redisClient.get(key)
		} catch (e) {
			Logger.error("Redis Client Error", e)
			return null
		}

		// let userid = await redisClient.hget("user-cache:123","id")
		// let user = await redisClient.hgetall("user-cache:123")
		// console.log(userid)
		// console.log(user)
		// let val =
		// console.log(val)
		// return 1
	}
	export async function addToSet(key: string, ...val: string[]) {
		if (!redisClient) return
		try {
			await redisClient.sadd(key, val)
		} catch (e) {
			Logger.error("Redis Client Error", e)
		}
	}
	export async function removeFromSet(key: string, ...val: string[]): Promise<boolean> {
		if (!redisClient) return false
		try {
			return (await redisClient.srem(key, val)) === 1
		} catch (e) {
			Logger.error("Redis Client Error", e)
			return false
		}
	}
	export async function countSet(key: string): Promise<number> {
		if (!redisClient) return 0
		try {
			return await redisClient.scard(key)
		} catch (e) {
			Logger.error("Redis Client Error", e)
			return 0
		}
	}
	export async function isInSet(key: string, val: string): Promise<boolean> {
		if (!redisClient) return false
		try {
			return (await redisClient.sismember(key, val)) === 1
		} catch (e) {
			Logger.error("Redis Client Error", e)
			return false
		}
	}
	export async function getSet(key: string): Promise<string[]> {
		if (!redisClient) return []
		try {
			return await redisClient.smembers(key)
		} catch (e) {
			Logger.error("Redis Client Error", e)
			return []
		}
	}
}
