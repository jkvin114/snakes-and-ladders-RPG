import { shuffle } from "../Util";
import oceanmap = require("../../res/ocean_map.json")
import casinomap = require("../../res/casino_map.json")
import defaultmap = require("../../res/map.json")

export type singleMap = {
	mapname: string
	coordinates: { x: number; y: number; obs: number; money: number }[]
	finish: number
	muststop: number[]
	respawn: number[]
	store: number[]
	dc_limit_level: number
	goldperturn: number[]
	shuffle:{start:number,end:number}[]
	//ocean map only
	submarine_range?: {
		start: number
		end: number
	}
	//ocean map only
	way2_range?: {
		start: number
		end: number
		way_start: number
		way_end: number
	}
	//casino map only
	subway?:{
		start:number,
		end:number,
		default:number[],
		rapid:number[],
		express:number[],
		prices:number[],
	}
}

class MapStorage {
	map: singleMap[]
	static instance=false
	constructor(m: singleMap[]) {
		if(MapStorage.instance) return
		MapStorage.instance=true


		this.map = m
	}
	get(id: number): singleMap {
		return this.map[id]
	}
	getMuststop(id: number): number[] {
		return this.map[id].muststop
	}
	getRespawn(id: number): number[] {
		return this.map[id].respawn
	}
	getStore(id: number): number[] {
		return this.map[id].store
	}
	getFinish(id: number): number {
		return this.map[id].finish
	}
	getLimit(id: number): number {
		if(this.map[id].way2_range!=null){
			return this.map[id].way2_range.way_end
		}
		return this.map[id].finish
	}
	getShuffledObstacles(id:number):{obs:number,money:number}[]{
		let thismap=this.map[id]
		let obslist=this.getObstacleList(id)

		for(let sfdata of thismap.shuffle){
			let toshuffle=[]
			for(let i=sfdata.start;i<=sfdata.end;++i){
				toshuffle.push(thismap.coordinates[i])
			}
			toshuffle=shuffle(toshuffle)
			let j=0
			for(let i=sfdata.start;i<=sfdata.end;++i){
				
				if(obslist[i].obs>0){
					obslist[i].obs=toshuffle[j].obs
					obslist[i].money=toshuffle[j].money
				}
				
				++j
			}
		}

		return obslist
	}
	getTurnGold(id:number,lvl:number){
		if(lvl-1 >= this.map[id].goldperturn.length){
			lvl=this.map[id].goldperturn.length
		}
		return this.map[id].goldperturn[lvl-1] 
	}
	getObstacleList(id:number){
		return this.map[id]
		.coordinates.map((c)=>{return {obs:c.obs,money:c.money}})
	}

	getCoordinateDistance(id:number,pos1:number,pos2:number){
		let c1=this.map[id].coordinates[pos1]
		let c2=this.map[id].coordinates[pos2]
		return Math.sqrt((c1.x-c2.x)**2+(c1.y-c2.y)**2)
	}
}

export const MAP: MapStorage = new MapStorage([defaultmap, oceanmap, casinomap])
