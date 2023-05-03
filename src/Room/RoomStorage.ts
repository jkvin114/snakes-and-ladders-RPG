import type { MarbleRoom } from "../Marble/MarbleRoom"
import type { Room } from "./room"
import type { RPGRoom } from "../RPGGame/RPGRoom"

class RoomMap<R extends Room> extends Map<string, R>
{}


const ROOMS = new RoomMap<RPGRoom>()
const MARBLE_ROOMS = new RoomMap<MarbleRoom>()

export namespace R{
	export function getRoom(name:string|undefined):Room|undefined{
		if(!name) return
		if(ROOMS.has(name)) return ROOMS.get(name)
		if(MARBLE_ROOMS.has(name)) return MARBLE_ROOMS.get(name)
		return undefined
	}
	export function getRPGRoom(name:string|undefined):RPGRoom|undefined{
		if(!name) return
		 return ROOMS.get(name)
	}
	export function getMarbleRoom(name:string|undefined):MarbleRoom|undefined{
		if(!name) return
		return MARBLE_ROOMS.get(name)
	}
	export function setRPGRoom(name:string,room:RPGRoom){
		ROOMS.set(name,room)
	}
	export function setMarbleRoom(name:string,room:MarbleRoom){
		MARBLE_ROOMS.set(name,room)
	}
	export function hasRPGRoom(name:string|undefined){
		if(!name) return false
		return ROOMS.has(name)
	}
	export function hasMarbleRoom(name:string|undefined){
		if(!name) return false
		return MARBLE_ROOMS.has(name)
	}
	export function hasRoom(name:string|undefined){
		if(!name) return false
		return (ROOMS.has(name) || MARBLE_ROOMS.has(name))
	}
	export function allRPG():IterableIterator<RPGRoom>{
		return ROOMS.values()
	}
	export function allMarble():IterableIterator<MarbleRoom>{
		return MARBLE_ROOMS.values()
	}
	export function remove(name:string){
		if(ROOMS.has(name)) ROOMS.delete(name)
		if(MARBLE_ROOMS.has(name)) MARBLE_ROOMS.delete(name)
	}

}