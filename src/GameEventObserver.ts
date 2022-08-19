import type { ServerGameEventInterface } from "./data/PayloadInterface"
import type { SpecialEffect } from "./data/SpecialEffectRegistry"
export interface GameEventEmitter {
	(roomname: string, type: string, ...args: unknown[]): void
}

export class GameEventObserver {
	private eventEmitter: GameEventEmitter
    private simulationEventEmitter:GameEventEmitter
	private rname: string
	constructor(rname: string) {
		this.rname = rname
		this.eventEmitter = (roomname: string, type: string, ...args: unknown[]) => {}
        this.simulationEventEmitter = (roomname: string, type: string, ...args: unknown[]) => {}
	}
    block(){
        this.eventEmitter = (roomname: string, type: string, ...args: unknown[]) => {}
    }
	subscribeEventEmitter(callback: GameEventEmitter) {
    //    console.log("registerCallback")
		this.eventEmitter = callback
	}
    subscribeSimulationEventEmitter(callback: GameEventEmitter) {
    //    console.log("registerCallback")
		this.simulationEventEmitter = callback
	}
	updateNextTurn(turnUpdateData: ServerGameEventInterface.TurnStart) {
		this.eventEmitter(this.rname, "server:nextturn", turnUpdateData)
		// / (, turnUpdateData)
	}
	syncVisibility(data: ServerGameEventInterface.PlayerPosSync[]) {
		this.eventEmitter(this.rname, "server:sync_player_visibility", data)
	}
	rollDice(data: ServerGameEventInterface.DiceRoll) {
		this.eventEmitter(this.rname, "server:rolldice", data)
	}
	startTimeout(crypt_turn: string, time: number) {
		this.eventEmitter(this.rname, "server:start_timeout_countdown", crypt_turn, time)
	}
	stopTimeout(crypt_turn: string) {
		this.eventEmitter(this.rname, "server:stop_timeout_countdown", crypt_turn)
	}
	forceNextturn(crypt_turn: string) {
		this.eventEmitter(this.rname, "server:force_nextturn", crypt_turn)
	}
	sendPendingObs(data: ServerGameEventInterface.PendingObstacle) {
		this.eventEmitter(this.rname, data.name, data.argument)
	}
	setSkillReady(skildata: ServerGameEventInterface.SkillStatus) {
		this.eventEmitter(this.rname, "server:skills", skildata)
	}
	sendPendingAction(name: string, data: number) {
		this.eventEmitter(this.rname, name, data)
	}
	simulationProgress(progress: number) {
		this.simulationEventEmitter(this.rname, "server:simulation_progress", progress)
	}
	simulationOver(msg: string) {
		this.simulationEventEmitter(this.rname, "server:simulationover", msg)
	}
	gameOver(winner: number) {
		//	console.log(rname)
		this.eventEmitter(this.rname, "server:gameover", winner)
	}
	gameStatReady(id: string) {
		this.eventEmitter(this.rname, "server:game_stat_ready", id)
	}
	simulationStatReady(id: string,message:string) {
		this.simulationEventEmitter(this.rname, "server:simulation_stat_ready", id,message)
	}

	changeMoney(turn: number, indicate_amt: number, result: number) {
		this.eventEmitter(this.rname, "server:money", { turn: turn, amt: indicate_amt, result: result })
	}

	changeHP_damage(hpChangeData: ServerGameEventInterface.Damage) {
		this.eventEmitter(this.rname, "server:damage", hpChangeData)
	}

	changeHP_heal(hpChangeData: ServerGameEventInterface.Heal) {
		this.eventEmitter(this.rname, "server:heal", hpChangeData)
	}

	changeShield(shieldData: ServerGameEventInterface.Shield) {
		this.eventEmitter(this.rname, "server:shield", shieldData)
	}

	giveEffect(data: ServerGameEventInterface.NormalEffect) {
		this.eventEmitter(this.rname, "server:status_effect", data)
	}
	giveSpecialEffect(
		turn: number,
		name: string,
		data: SpecialEffect.DescriptionData,
		sourcePlayer: string
	) {
		this.eventEmitter(this.rname, "server:special_effect", {
			turn: turn,
			name: name,
			data: data,
			sourcePlayer: sourcePlayer
		})
	}

	playerForceMove(turn: number, pos: number, movetype: string) {
		this.eventEmitter(this.rname, "server:teleport_pos", { turn: turn, pos: pos, movetype: movetype })
	}
	smoothTeleport(turn: number, pos: number, distance: number) {
		this.eventEmitter(this.rname, "server:smooth_teleport", { turn: turn, pos: pos, distance: distance })
	}

	removeProj(UPID: string) {
		this.eventEmitter(this.rname, "server:delete_projectile", UPID)
	}

	die(killData: ServerGameEventInterface.Death) {
		this.eventEmitter(this.rname, "server:death", killData)
	}

	respawn(turn: number, respawnPos: number, isRevived: boolean) {
		this.eventEmitter(this.rname, "server:respawn", { turn: turn, respawnPos: respawnPos, isRevived: isRevived })
	}

	message(message: string) {
		this.eventEmitter(this.rname, "server:receive_message", "[@]", message)
	}

	playsound(sound: string) {
		this.eventEmitter(this.rname, "server:sound", sound)
	}

	placePassProj(data: ServerGameEventInterface.PassProjectile) {
		this.eventEmitter(this.rname, "server:create_passprojectile", data)
	}

	placeProj(proj: ServerGameEventInterface.RangeProjectile) {
		this.eventEmitter(this.rname, "server:create_projectile", proj)
	}

	summonEntity(entity: ServerGameEventInterface.SummonedEntity) {
		this.eventEmitter(this.rname, "server:create_entity", entity)
	}

	deleteEntity(UEID: string, iskilled: boolean) {
		this.eventEmitter(this.rname, "server:delete_entity", UEID, iskilled)
	}

	update(type: string, turn: number, amt: any) {
		this.eventEmitter(this.rname, "server:update_other_data", { type: type, turn: turn, amt: amt })
	}

	updateSkillInfo(turn: number, info_kor: string[], info_eng: string[]) {
		this.eventEmitter(this.rname, "server:update_skill_info", { turn: turn, info_kor: info_kor, info_eng: info_eng })
	}

	visualEffect(pos: number, type: string, source: number) {
		this.eventEmitter(this.rname, "server:visual_effect", { pos: pos, type: type, source: source })
	}

	attack(data: ServerGameEventInterface.Attack) {
		this.eventEmitter(this.rname, "server:attack", data)
	}
	skillTrajectory(data: ServerGameEventInterface.skillTrajectory) {
		this.eventEmitter(this.rname, "server:skill_trajectory", data)
	}
	indicateObstacle(data: ServerGameEventInterface.Obstacle) {
		this.eventEmitter(this.rname, "server:indicate_obstacle", data)
	}
	obstacleEffect(data: ServerGameEventInterface.ObstacleEffect) {
		this.eventEmitter(this.rname, "server:obstacle_effect", data)
	}

	indicateItem(turn: number, item: number) {
		this.eventEmitter(this.rname, "server:indicate_item", { turn: turn, item: item })
	}

	goStore(turn: number, storeData: ServerGameEventInterface.EnterStore) {
		this.eventEmitter(this.rname, "server:store", {
			turn: turn,
			storeData: storeData
		})
	}
}
