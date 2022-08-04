import type { MarbleRoom } from "./Marble/MarbleRoom"
import type { Room } from "./room"
import type { RPGRoom } from "./RPGRoom"

const ROOMS = new Map<string, RPGRoom>()
const MARBLE_ROOMS = new Map<string, MarbleRoom>()

export namespace R{
	export function getRoom(name:string):Room{
		if(ROOMS.has(name)) return ROOMS.get(name)
		if(MARBLE_ROOMS.has(name)) return MARBLE_ROOMS.get(name)
		return null
	}
	export function getRPGRoom(name:string):RPGRoom{
		if(ROOMS.has(name)) return ROOMS.get(name)
		return null
	}
	export function getMarbleRoom(name:string):MarbleRoom{
		if(MARBLE_ROOMS.has(name)) return MARBLE_ROOMS.get(name)
		return null
	}
	export function setRPGRoom(name:string,room:RPGRoom){
		ROOMS.set(name,room)
	}
	export function setMarbleRoom(name:string,room:MarbleRoom){
		MARBLE_ROOMS.set(name,room)
	}
	export function hasRPGRoom(name:string){
		return ROOMS.has(name)
	}
	export function hasMarbleRoom(name:string){
		return MARBLE_ROOMS.has(name)
	}
	export function hasRoom(name:string){
		return (ROOMS.has(name) || MARBLE_ROOMS.has(name))
	}
	export function allRPG():IterableIterator<Room>{
		return ROOMS.values()
	}
	export function allMarble():IterableIterator<Room>{
		return MARBLE_ROOMS.values()
	}
	export function remove(name:string){
		if(ROOMS.has(name)) ROOMS.delete(name)
		if(MARBLE_ROOMS.has(name)) MARBLE_ROOMS.delete(name)
	}

}