import { Game,MAP } from "./Game"
import { Player } from "./player"
import * as Util from "./Util"
import * as server from "./app"


class PassProjectile {
	game: any
	type: string
	action: Function
	stopPlayer: boolean
	pos: number
	dur: number
	UPID: string

	constructor(game: any, name: string, action: Function, stopPlayer: boolean) {
		this.game = game
		this.type = name
		this.action = action
		this.pos = -1
		this.dur = 0
		this.stopPlayer = stopPlayer
		this.UPID = "" //unique projectile id:  PP1 PP2 ..
	}

	place(pos: number, upid: string) {
		if(pos<=0 || pos>=MAP.get(this.game.mapId).finish){
			return
		}
		this.UPID = upid
		this.pos = pos
		if (!this.game.isAttackableCoordinate(pos) && pos < MAP.get(this.game.mapId).coordinates.length) {
			this.pos += 1
		}
		console.log("placePassProj"+this.type)
		server.placePassProj(this.game.rname, this.type, this.pos, this.UPID)
	}

	removeProj() {
		server.removeProj(this.game.rname, this.UPID)
	}
}

export {PassProjectile}
