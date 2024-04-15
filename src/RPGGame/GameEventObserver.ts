
import { EventRecord, ReplayEventRecords } from "./ReplayEventRecord"
import { GameEventEmitter } from "../sockets/GameEventEmitter"
import { ServerGameEventFormat } from "./data/EventFormat"
import { SpecialEffect } from "./data/SpecialEffectRegistry"

export class GameEventObserver {
	private eventEmitter: GameEventEmitter
    private simulationEventEmitter:GameEventEmitter
	private rname: string
	private static readonly PREFIX="server:"
	private eventRecorder?:ReplayEventRecords
	constructor(rname: string) {
		this.rname = rname
		this.eventEmitter = (roomname: string, type: string, ...args: unknown[]) => {}
        this.simulationEventEmitter = (roomname: string, type: string, ...args: unknown[]) => {}
		
	}

	recordEvent(record:EventRecord){
		if(!this.eventRecorder) return
		this.eventRecorder.addEvent(record)
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
	bindEventRecorder(eventRecorder:ReplayEventRecords){
		this.eventRecorder=eventRecorder
	}
	emit(type:string,...args:unknown[]){
		this.eventEmitter(this.rname, GameEventObserver.PREFIX+type, ...args)
	}

	updateNextTurn(turnUpdateData: ServerGameEventFormat.TurnStart) {
		this.emit("nextturn",turnUpdateData)
		// this.eventEmitter(this.rname, "server:nextturn", turnUpdateData)
		// / (, turnUpdateData)
	}
	syncVisibility(data: ServerGameEventFormat.PlayerPosSync[]) {
		this.emit("sync_player_visibility",data)
		// this.eventEmitter(this.rname, "server:sync_player_visibility", data)
	}
	rollDice(data: ServerGameEventFormat.DiceRoll) {
		
		this.recordEvent(new EventRecord("rolldice").setInvoker(data.turn).setNumberObject(data.dice)
		.setNumberArgs(Number(data.dcused)))
		this.recordEvent(new EventRecord("moveByDice").setInvoker(data.turn).setNumberObject(data.actualdice)
		.setNumberArgs(data.currpos,Number(data.died)))

		//console.log("rolldice")
		this.emit("rolldice",data)
		// this.eventEmitter(this.rname, "server:rolldice", data)
	}
	startTimeout(crypt_turn: string, time: number) {
		this.emit("start_timeout_countdown",crypt_turn, time)
		// this.eventEmitter(this.rname, "server:start_timeout_countdown", crypt_turn, time)
	}
	stopTimeout(crypt_turn: string) {
		this.emit("stop_timeout_countdown",crypt_turn)
		// this.eventEmitter(this.rname, "server:stop_timeout_countdown", crypt_turn)
	}
	forceNextturn(crypt_turn: string) {
		this.emit("force_nextturn",crypt_turn)
		// this.eventEmitter(this.rname, "server:force_nextturn", crypt_turn)
	}
	sendPrediction(data:ServerGameEventFormat.Prediction){
		this.emit("prediction",data)
	}
	sendPendingObs(data: ServerGameEventFormat.PendingObstacle) {
		this.emit(data.name,data.argument)
		// this.eventEmitter(this.rname, data.name, data.argument)
	}
	setSkillReady(skildata: ServerGameEventFormat.SkillStatus) {
		this.emit("skills",skildata)
		// this.eventEmitter(this.rname, "server:skills", skildata)
	}
	sendPendingAction(name: string, data: number) {
		this.emit(name,data)
		// this.eventEmitter(this.rname, name, data)
	}
	simulationProgress(progress: number) {
	//	this.emit("simulation_progress",progress)
		this.simulationEventEmitter(this.rname, "server:simulation_progress", progress)
	}
	simulationOver(msg: string) {
	//	this.emit("simulationover",msg)
		this.simulationEventEmitter(this.rname, "server:simulationover", msg)
	}
	gameOver(winner: number) {
		this.emit("gameover",winner)
		//	console.log(rname)
		// this.eventEmitter(this.rname, "server:gameover", winner)
	}
	gameStatReady(id: string) {
		this.emit("game_stat_ready",id)
		// this.eventEmitter(this.rname, "server:game_stat_ready", id)
	}
	simulationStatReady(id: string,message:string) {
	//	this.emit("simulation_stat_ready",id,message)
		 this.simulationEventEmitter(this.rname, "server:simulation_stat_ready", id,message)
	}

	changeMoney(turn: number, indicate_amt: number, result: number) {
		this.emit("money", { turn: turn, amt: indicate_amt, result: result })
		this.recordEvent(new EventRecord("money").setInvoker(turn).setNumberObject(indicate_amt))

		// this.eventEmitter(this.rname, "server:money", { turn: turn, amt: indicate_amt, result: result })
	}

	changeHP_damage(hpChangeData: ServerGameEventFormat.Damage) {
		this.emit("damage",hpChangeData)
		this.recordEvent(new EventRecord("damage")
		.setInvoker(hpChangeData.turn)
		.setNumberObject(hpChangeData.change)
		.setNumberArgs(hpChangeData.currhp,hpChangeData.currmaxhp,hpChangeData.currshield,hpChangeData.source))
		// this.eventEmitter(this.rname, "server:damage", hpChangeData)
	}

	changeHP_heal(hpChangeData: ServerGameEventFormat.Heal) {
		this.emit("heal",hpChangeData)
		this.recordEvent(new EventRecord("heal")
		.setInvoker(hpChangeData.turn)
		.setNumberObject(hpChangeData.change)
		.setStringArgs(hpChangeData.type)
		.setNumberArgs(hpChangeData.currhp,hpChangeData.currmaxhp,hpChangeData.currshield))
		
		// this.eventEmitter(this.rname, "server:heal", hpChangeData)
	}

	changeShield(shieldData: ServerGameEventFormat.Shield) {
		this.emit("shield",shieldData)
		this.recordEvent(new EventRecord("shield")
		.setInvoker(shieldData.turn)
		.setNumberObject(shieldData.change)
		.setNumberArgs(shieldData.shield,Number(shieldData.indicate)))
		
		// this.eventEmitter(this.rname, "server:shield", shieldData)
	}

	giveEffect(data: ServerGameEventFormat.NormalEffect) {
		this.emit("status_effect",data)
		this.recordEvent(new EventRecord("status_effect")
		.setInvoker(data.turn)
		.setNumberObject(data.effect)
		.setNumberArgs(data.num))
		// this.eventEmitter(this.rname, "server:status_effect", data)
	}
	giveSpecialEffect(
		turn: number,
		name: string,
		data: SpecialEffect.DescriptionData,
		sourcePlayer: string
	) {
		this.emit("special_effect",{
			turn: turn,
			name: name,
			data: data,
			sourcePlayer: sourcePlayer
		})
		// this.eventEmitter(this.rname, "server:special_effect", {
		// 	turn: turn,
		// 	name: name,
		// 	data: data,
		// 	sourcePlayer: sourcePlayer
		// })
	}

	playerForceMove(turn: number, pos: number, movetype: string) {
		this.emit("teleport_pos",{ turn: turn, pos: pos, movetype: movetype })
		this.recordEvent(new EventRecord("teleport_pos").setInvoker(turn)
		.setNumberObject(pos)
		.setStringObject(movetype))
		// this.eventEmitter(this.rname, "server:teleport_pos", { turn: turn, pos: pos, movetype: movetype })
	}
	smoothTeleport(turn: number, pos: number, distance: number) {
	//	console.log("smoothTeleport"+distance)
		this.emit("smooth_teleport",{ turn: turn, pos: pos, distance: distance })
		this.recordEvent(new EventRecord("smooth_teleport").setInvoker(turn)
		.setNumberObject(pos)
		.setNumberArgs(distance))
		// this.eventEmitter(this.rname, "server:smooth_teleport", { turn: turn, pos: pos, distance: distance })
	}

	removeProj(UPID: string) {
		this.emit("delete_projectile",UPID)
		this.recordEvent(new EventRecord("delete_projectile")
		.setStringObject(UPID))
		// this.eventEmitter(this.rname, "server:delete_projectile", UPID)
	}

	die(killData: ServerGameEventFormat.Death) {
		this.emit("death",killData)
		this.recordEvent(new EventRecord("death")
		.setInvoker(killData.turn)
		.setNumberObject(killData.killer)
		.setNumberArgs(killData.location,Number(killData.isShutDown),killData.killerMultiKillCount))
		// this.eventEmitter(this.rname, "server:death", killData)
	}

	respawn(turn: number, respawnPos: number, isRevived: boolean) {
		this.emit("respawn",{ turn: turn, respawnPos: respawnPos, isRevived: isRevived })
		this.recordEvent(new EventRecord("respawn").setInvoker(turn).setNumberObject(respawnPos)
		.setNumberArgs(Number(isRevived)))

		// this.eventEmitter(this.rname, "server:respawn", { turn: turn, respawnPos: respawnPos, isRevived: isRevived })
	}

	message(header:string,message: string) {
		this.emit("receive_message",header, message)
		// this.eventEmitter(this.rname, "server:receive_message", header, message)
	}

	playsound(sound: string) {
		this.emit("sound",sound)
		// this.eventEmitter(this.rname, "server:sound", sound)
	}

	placePassProj(data: ServerGameEventFormat.PassProjectile) {
		this.emit("create_passprojectile",data)
		this.recordEvent(new EventRecord("create_passprojectile")
		.setStringObject(data.UPID)
		.setStringArgs(data.name)
		.setNumberObject(data.owner)
		.setNumberArgs(data.trajectorySpeed,Number(data.stopPlayer),...data.scope))
		// this.eventEmitter(this.rname, "server:create_passprojectile", data)
	}

	placeProj(data: ServerGameEventFormat.RangeProjectile) {
		// console.log(proj)
		this.emit("create_projectile",data)
		this.recordEvent(new EventRecord("create_projectile")
		.setStringObject(data.UPID)
		.setStringArgs(data.name)
		.setNumberObject(data.owner)
		.setNumberArgs(data.trajectorySpeed,...data.scope))
		// this.eventEmitter(this.rname, "server:create_projectile", proj)
	}

	summonEntity(entity: ServerGameEventFormat.SummonedEntity) {
		this.emit("create_entity",entity)
		this.recordEvent(new EventRecord("create_entity")
		.setStringObject(entity.UEID)
		.setStringArgs(entity.name)
		.setNumberObject(entity.sourceTurn)
		.setNumberArgs(entity.pos))
		// this.eventEmitter(this.rname, "server:create_entity", entity)
	}

	deleteEntity(UEID: string, iskilled: boolean) {
		this.emit("delete_entity",UEID, iskilled)
		this.recordEvent(new EventRecord("delete_entity")
		.setStringObject(UEID)
		.setNumberArgs(Number(iskilled)))
		// this.eventEmitter(this.rname, "server:delete_entity", UEID, iskilled)
	}

	update(type: string, turn: number, amt: any) {
		this.emit("update_other_data",{ type: type, turn: turn, amt: amt })
		this.recordUpdates(type,turn,amt)
		// this.eventEmitter(this.rname, "server:update_other_data", { type: type, turn: turn, amt: amt })
	}
	private recordUpdates(type: string, turn: number, amt: any){
		switch(type)
		{
			case "finish_pos":
				this.recordEvent(new EventRecord("finish_pos")
				.setNumberObject(amt))
			break
			case "move_entity":
				this.recordEvent(new EventRecord("move_entity")
				.setInvoker(turn)
				.setNumberObject(amt.pos)
				.setStringObject(amt.UEID))
			break
			case "removeEffect":
				this.recordEvent(new EventRecord("removeEffect")
				.setInvoker(turn)
				.setNumberObject(amt))
			break
			case "kda":
				this.recordEvent(new EventRecord("kda")
				.setInvoker(turn)
				.setStringObject(amt))
			break
			case "appearance":
				this.recordEvent(new EventRecord("appearance")
				.setInvoker(turn)
				.setStringObject(amt))
			break
			case "waiting_revival":
				this.recordEvent(new EventRecord("waiting_revival")
				.setInvoker(turn))
			break
		}
		
	}

	updateSkillInfoSingle(turn: number,char:number,skill:number,toChange:number) {
		this.emit("update_skill_info_single",{ turn: turn, charId:char,skillId:skill,toChange:toChange })
	}
	updateSkillValues(turn:number,values:Object){
		
		this.emit("update_skill_values",{ turn: turn, values:values })
	}
	visualEffect(pos: number, type: string, source: number) {
		this.emit("visual_effect",{ pos: pos, type: type, source: source })
	}

	attack(data: ServerGameEventFormat.Attack) {
		this.emit("attack",data)
		for(const victim of data.targets){
			this.recordEvent(new EventRecord("attack")
			.setInvoker(data.source)
			.setNumberObject(victim.pos)
			.setNumberArgs(data.sourcePos,victim.damage)
			.setStringObject(data.visualeffect)
			.setStringArgs(...victim.flags))
		}
		// this.eventEmitter(this.rname, "server:attack", data)
	}
	skillTrajectory(data: ServerGameEventFormat.skillTrajectory) {
		this.emit("skill_trajectory",data)
		this.recordEvent(new EventRecord("skill_trajectory")
			.setNumberArgs(data.from,data.to)
			.setStringObject(data.type)
			.setDelay(data.delay))
		// this.eventEmitter(this.rname, "server:skill_trajectory", data)
	}
	areaEffect(data:ServerGameEventFormat.AreaEffect){
		this.emit("area_effect",data)
	}
	rangeWarnHits(data:ServerGameEventFormat.RangeWarnHits){
		this.emit("range_warn_hit",data)
	}
	indicateObstacle(data: ServerGameEventFormat.Obstacle) {
		this.emit("indicate_obstacle",data)
		// this.eventEmitter(this.rname, "server:indicate_obstacle", data)
	}
	obstacleEffect(data: ServerGameEventFormat.ObstacleEffect) {
		this.emit("obstacle_effect",data)
		// this.eventEmitter(this.rname, "server:obstacle_effect", data)
	}

	indicateItem(turn: number, item: number) {
		this.emit("indicate_item",{ turn: turn, item: item })
		// this.eventEmitter(this.rname, "server:indicate_item", { turn: turn, item: item })
	}

	goStore(turn: number, storeData: ServerGameEventFormat.EnterStore) {
		this.emit("store",{
			turn: turn,
			storeData: storeData
		})
		// this.eventEmitter(this.rname, "server:store", {
		// 	turn: turn,
		// 	storeData: storeData
		// })
	}
}
