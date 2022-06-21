import { ServerPayloadInterface } from "./data/PayloadInterface"
import { SpecialEffect } from "./data/SpecialEffectRegistry"
export interface ClientInterfaceCallback {
	(roomname: string, type: string, ...args: unknown[]): void
}

export class ClientInterface {
	callback: ClientInterfaceCallback
    callback_simulation:ClientInterfaceCallback
	rname: string
	constructor(rname: string) {
		this.rname = rname
		this.callback = (roomname: string, type: string, ...args: unknown[]) => {}
        this.callback_simulation = (roomname: string, type: string, ...args: unknown[]) => {}
	}
    block(){
        this.callback = (roomname: string, type: string, ...args: unknown[]) => {}
    }
	registerCallback(callback: ClientInterfaceCallback) {
        console.log("registerCallback")
		this.callback = callback
	}
    registerSimulationCallback(callback: ClientInterfaceCallback) {
        console.log("registerCallback")
		this.callback_simulation = callback
	}
	updateNextTurn(turnUpdateData: ServerPayloadInterface.TurnStart) {
		this.callback(this.rname, "server:nextturn", turnUpdateData)
		// / (, turnUpdateData)
	}
	syncVisibility(data: ServerPayloadInterface.PlayerPosSync[]) {
		this.callback(this.rname, "server:sync_player_visibility", data)
	}
	rollDice(data: ServerPayloadInterface.DiceRoll) {
		this.callback(this.rname, "server:rolldice", data)
	}
	startTimeout(crypt_turn: string, time: number) {
		this.callback(this.rname, "server:start_timeout_countdown", crypt_turn, time)
	}
	stopTimeout(crypt_turn: string) {
		this.callback(this.rname, "server:stop_timeout_countdown", crypt_turn)
	}
	forceNextturn(crypt_turn: string) {
		this.callback(this.rname, "server:force_nextturn", crypt_turn)
	}
	sendPendingObs(data: ServerPayloadInterface.PendingObstacle) {
		this.callback(this.rname, data.name, data.argument)
	}
	setSkillReady(skildata: ServerPayloadInterface.SkillStatus) {
		this.callback(this.rname, "server:skills", skildata)
	}
	sendPendingAction(name: string, data: number) {
		this.callback(this.rname, name, data)
	}
	simulationProgress(progress: number) {
		this.callback_simulation(this.rname, "server:simulation_progress", progress)
	}
	simulationOver(msg: string) {
		this.callback_simulation(this.rname, "server:simulationover", msg)
	}
	gameOver(winner: number) {
		//	console.log(rname)
		this.callback(this.rname, "server:gameover", winner)
	}
	gameStatReady(id: string) {
		this.callback(this.rname, "server:game_stat_ready", id)
	}
	simulationStatReady(id: string,message:string) {
		this.callback_simulation(this.rname, "server:simulation_stat_ready", id,message)
	}

	changeMoney(turn: number, indicate_amt: number, result: number) {
		this.callback(this.rname, "server:money", { turn: turn, amt: indicate_amt, result: result })
	}

	changeHP_damage(hpChangeData: ServerPayloadInterface.Damage) {
		this.callback(this.rname, "server:damage", hpChangeData)
	}

	changeHP_heal(hpChangeData: ServerPayloadInterface.Heal) {
		this.callback(this.rname, "server:heal", hpChangeData)
	}

	changeShield(shieldData: ServerPayloadInterface.Shield) {
		this.callback(this.rname, "server:shield", shieldData)
	}

	giveEffect(data: ServerPayloadInterface.NormalEffect) {
		this.callback(this.rname, "server:status_effect", data)
	}
	giveSpecialEffect(
		turn: number,
		name: string,
		data: SpecialEffect.DescriptionData,
		sourcePlayer: string
	) {
		this.callback(this.rname, "server:special_effect", {
			turn: turn,
			name: name,
			data: data,
			sourcePlayer: sourcePlayer
		})
	}

	playerForceMove(turn: number, pos: number, movetype: string) {
		this.callback(this.rname, "server:teleport_pos", { turn: turn, pos: pos, movetype: movetype })
	}
	smoothTeleport(turn: number, pos: number, distance: number) {
		this.callback(this.rname, "server:smooth_teleport", { turn: turn, pos: pos, distance: distance })
	}

	removeProj(UPID: string) {
		this.callback(this.rname, "server:delete_projectile", UPID)
	}

	die(killData: ServerPayloadInterface.Death) {
		this.callback(this.rname, "server:death", killData)
	}

	respawn(turn: number, respawnPos: number, isRevived: boolean) {
		this.callback(this.rname, "server:respawn", { turn: turn, respawnPos: respawnPos, isRevived: isRevived })
	}

	message(message: string) {
		this.callback(this.rname, "server:receive_message", "[@]", message)
	}

	playsound(sound: string) {
		this.callback(this.rname, "server:sound", sound)
	}

	placePassProj(data: ServerPayloadInterface.PassProjectile) {
		this.callback(this.rname, "server:create_passprojectile", data)
	}

	placeProj(proj: ServerPayloadInterface.RangeProjectile) {
		this.callback(this.rname, "server:create_projectile", proj)
	}

	summonEntity(entity: ServerPayloadInterface.SummonedEntity) {
		this.callback(this.rname, "server:create_entity", entity)
	}

	deleteEntity(UEID: string, iskilled: boolean) {
		this.callback(this.rname, "server:delete_entity", UEID, iskilled)
	}

	update(type: string, turn: number, amt: any) {
		this.callback(this.rname, "server:update_other_data", { type: type, turn: turn, amt: amt })
	}

	updateSkillInfo(turn: number, info_kor: string[], info_eng: string[]) {
		this.callback(this.rname, "server:update_skill_info", { turn: turn, info_kor: info_kor, info_eng: info_eng })
	}

	visualEffect(pos: number, type: string, source: number) {
		this.callback(this.rname, "server:visual_effect", { pos: pos, type: type, source: source })
	}

	attack(data: ServerPayloadInterface.Attack) {
		this.callback(this.rname, "server:attack", data)
	}
	skillTrajectory(data: ServerPayloadInterface.skillTrajectory) {
		this.callback(this.rname, "server:skill_trajectory", data)
	}
	indicateObstacle(data: ServerPayloadInterface.Obstacle) {
		this.callback(this.rname, "server:indicate_obstacle", data)
	}

	obstacleEffect(data: ServerPayloadInterface.ObstacleEffect) {
		this.callback(this.rname, "server:obstacle_effect", data)
	}

	indicateItem(turn: number, item: number) {
		this.callback(this.rname, "server:indicate_item", { turn: turn, item: item })
	}

	goStore(turn: number, storeData: ServerPayloadInterface.EnterStore) {
		this.callback(this.rname, "server:store", {
			turn: turn,
			storeData: storeData
		})
	}
}
