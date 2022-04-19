import { PlayerClientInterface } from "./app"
import { Player } from "./player"
import { EntityFilter } from "./EntityFilter"
import { SummonedEntity } from "./characters/SummonedEntity/SummonedEntity"
import { Entity } from "./Entity"
import { EFFECT, ENTITY_TYPE, MAP_TYPE, STAT } from "./enum"
import { Damage, HPChangeData, PriorityArray, SkillAttack,Normalize, sleep } from "./Util"
import { MAP } from "./MapHandlers/MapStorage"
import { ServerPayloadInterface } from "./PayloadInterface"
import {trajectorySpeedRatio} from "../res/globalsettings.json"



class AttackHandler{
	static basicAttacks(from:Player,targets:Entity[],damage:Damage):boolean{
		let died=false
		let data:ServerPayloadInterface.Attack={
			targets:[],source:from.turn,visualeffect:from.getBasicAttackName(),sourcePos:from.pos
		}
		for(let t of targets){
			let v=this.basicAttack(from,t,damage)
			data.targets.push(v)
			died=died||(v.flags.includes("died"))
		}
		from.transfer(PlayerClientInterface.attack,data)
		return died
	}

	static async skillAttacks(from:Player,targets:Entity[],skillattack:SkillAttack){
	//	console.log(skillattack)
		let delay=from.getSkillTrajectorySpeed(from.getSkillName(skillattack.skill))
		if(delay>0 && !from.game.instant){
			delay=MAP.getCoordinateDistance(from.mapId,from.pos,targets[0].pos) * delay / trajectorySpeedRatio
			let data:ServerPayloadInterface.skillTrajectory={
				from:from.pos,
				to:targets[0].pos,
				type:from.getSkillName(skillattack.skill),
				delay:delay
			}
			from.transfer(PlayerClientInterface.skillTrajectory,data)
			await sleep(delay)
		}

		let data:ServerPayloadInterface.Attack={
			targets:[],source:from.turn,visualeffect:skillattack.name,sourcePos:from.pos
		}

		for(let t of targets){
			let v=this.skillAttack(from,t,skillattack)
			data.targets.push(v)
		}

		from.transfer(PlayerClientInterface.attack,data)
	}

	static basicAttack(from:Player,target:Entity,damage:Damage):ServerPayloadInterface.Victim{
		

		if(target instanceof Player){
			damage = from.effects.onBasicAttackHit(damage, target)
			damage = target.effects.onBasicAttackDamage(damage, from.UEID)
		}
		let victimData:ServerPayloadInterface.Victim={
			pos:target.pos,flags:[],damage:damage.getTotalDmg()
		}
		
		let died= AttackHandler.doDamage(from,target,damage,from.getBasicAttackName(),true)
		
		if(died) victimData.flags.push("died")
		return victimData
	}


	static skillAttackAuto(from:Player,target:Entity,skillattack:SkillAttack):boolean{
		let v=this.skillAttack(from,target,skillattack)
		let data:ServerPayloadInterface.Attack={
			targets:[v],source:from.turn,visualeffect:skillattack.name,sourcePos:from.pos
		}
		from.transfer(PlayerClientInterface.attack,data)
		return (v.flags.includes("died"))
	}

	static skillAttack(from:Player,target:Entity,skillattack:SkillAttack):ServerPayloadInterface.Victim{
		let victimData:ServerPayloadInterface.Victim={
			pos:target.pos,flags:[],damage:0
		}
		if (target instanceof Player) {

			let damage=skillattack.damage
			let effectname=skillattack.name
			let flags=[]
			//방어막 효과
			if (target.effects.has(EFFECT.SHIELD)) {
				target.effects.reset(EFFECT.SHIELD)
				AttackHandler.doDamage(from,target,new Damage(0, 0, 0),  effectname, true, [HPChangeData.FLAG_SHIELD])
				victimData.flags.push("shield")
				return victimData
			}

			if (skillattack.onHit != null) {
				skillattack.onHit.call(target)
			}
			damage = target.effects.onSkillDamage(damage, from.UEID)
			damage = from.effects.onSkillHit(damage, target)

			if (damage.getTotalDmg() === 0) {
				flags.push(HPChangeData.FLAG_NODMG_HIT)
			}
		//	console.log('skill  '+effectname)
			victimData.damage=damage.getTotalDmg()

			let died=AttackHandler.doDamage(from, target,damage, effectname, true, flags)
			if(died){ 
				AttackHandler.onDeath(from,target,skillattack.onKill)
				victimData.flags.push("died")
			}
		}
		else if (target instanceof SummonedEntity) {
			victimData.damage=skillattack.damage.getTotalDmg()
			if(AttackHandler.doDamage(from, target,skillattack.damage, skillattack.name, false)){
				victimData.flags.push("died")
			}
		}


		return victimData
	}

	static plainAttack(from:Entity,target:Entity,damage:Damage,effectname:string):boolean{
		let data:ServerPayloadInterface.Attack={
			targets:[{
				pos:target.pos,flags:[],damage:damage.getTotalDmg()
			}],source:-1,visualeffect:effectname,sourcePos:0
		}

		from.game.sendToClient(PlayerClientInterface.attack,data)

		return AttackHandler.doDamage(from,target,damage,effectname,false,[HPChangeData.FLAG_PLAINDMG])
	}


	static doDamage(from:Entity,target:Entity,damage:Damage, effectname:string, needDelay:boolean, flags?:number[]){
		let changeData = new HPChangeData()
		let finaldmg=damage.getTotalDmg()

		if(from instanceof Player && target instanceof Player){
			let pureDamage=finaldmg

			finaldmg=from.ability.applyResistanceToDamage(damage, target.ability)
			from.statistics.add(STAT.DAMAGE_DEALT, finaldmg)
			target.statistics.add(STAT.DAMAGE_REDUCED, pureDamage - finaldmg)

			target.damagedby[from.turn] = 3
			from.ability.absorb_hp(finaldmg) //모든피해흡혈, 어시스트저장

		}

		if(from instanceof Player){
			changeData.setSource(from.turn)
			.setType(effectname)
			.setSkillTrajectorySpeed(from.getSkillTrajectorySpeed(effectname))
		}

		if (needDelay) changeData.setDelay()
		if (flags != null) {
			for (let f of flags) {
				changeData.addFlag(f)
			}
		}

		if (target instanceof Player) {
			return target.doDamage(finaldmg, changeData)
		} else if (target instanceof SummonedEntity) {
			return target.doDamage(from, damage)
		}
		return false
	}

	static onDeath(killer:Player,dead:Player,onKill?:(this:Player)=>void ){
		if(onKill!=null)
			onKill.call(killer)
	}
}



class EntityMediator {
	storage: EntityStorage
	readonly isTeam: boolean
	readonly instant: boolean
	readonly rname: string
	constructor(isTeam: boolean, instant: boolean, rname: string) {
		this.isTeam = isTeam
		this.instant = instant
		this.rname = rname
		this.storage = new EntityStorage()
	}
	sendToClient(sender: Function, ...args: any[]) {
		if (!this.instant) {
			sender(this.rname, ...args)
		}
	}

	register(e: Entity, id: string) {
		if (e instanceof Player) {
			// console.log(e.turn)
			this.storage.addPlayer(id,e)
		} else if (id != null) {
			this.storage.addEntity(id, e)
		}
	}
	withdraw(id: string) {
		this.storage.removeEntity(id)
	}
	withdrawDeadEntities() {
		this.storage.cleanUpDeadEntity()
	}
	// getPlayer(turn: number) {
	// 	return this.storage.getPlayer(turn)
	// }
	getPlayer(id:string){
		return this.storage.getPlayer(id)
	}
	getEntity(id: string) {
		return this.storage.getEntity(id)
	}

	onTurnStart(thisturn: number) {
		for (let e of this.storage.all()) {
			e.onTurnStart(thisturn)
		}
	}

	onTurnEnd(thisturn: number) {
		this.withdrawDeadEntities()

		for (let e of this.storage.all()) {
			e.onTurnEnd(thisturn)
			e.effects.tick(thisturn)
		}
	}
	moveSummonedEntityTo(entityId: string, pos: number): Entity {
		let entity = this.getEntity(entityId)
		if (!entity) return null

		entity.forceMove(pos)
		if (entity instanceof SummonedEntity) {
			this.sendToClient(PlayerClientInterface.update, "move_entity", entity.summoner.turn, {
				UEID: entity.UEID,
				pos: entity.pos
			})
		}
		return entity
	}
	forceMovePlayerIgnoreObstacle(id:string, pos: number, movetype: string) {
		let player = this.getPlayer(id)
		if (!(player instanceof Player)) return

		this.sendToClient(PlayerClientInterface.playerForceMove, player.turn, pos, movetype)

		player.forceMove(pos)

		if (!this.instant){
			player.game.requestForceMove(player,movetype,true)
		}
	}

	forceMovePlayer(id:string, pos: number, movetype: string) {

		let player = this.getPlayer(id)
		if (!(player instanceof Player)) return

		this.sendToClient(PlayerClientInterface.playerForceMove, player.turn, pos, movetype)

		player.forceMove(pos)

		if (this.instant) {
			player.arriveAtSquare(true)
		} else {
			player.game.requestForceMove(player,movetype,false)
		}
	}


	getPlayerRankOf(target:Player,rankingFunction:(p:Player)=>number):number{
		return this.allPlayer().sort((a,b)=>{
			return rankingFunction(b)-rankingFunction(a)
		}).indexOf(target)

	}
	isFellBehind(target:Player){
		if(this.getPlayerRankOf(target,(p)=>p.pos) === target.game.totalnum-1)
			return true

		return false
	}
	basicAttack(from:Player,filter:EntityFilter){
		return (damage:Damage) => {
			let targets=this.selectAllFrom(filter)
			if(targets.length===0) return false
			AttackHandler.basicAttacks(from,targets,damage)
			return true
		}
	}

	basicAttackSingle(from:Player,to:string){
		return (damage:Damage) => {
			return AttackHandler.basicAttacks(from,[this.getPlayer(to)],damage)
		}
	}


	/**
	 * skill attack by clicking skill button
	 * @param from 
	 * @param filter 
	 * @returns 
	 */
	skillAttack(from:Player,filter:EntityFilter){
		return (skillAttack:SkillAttack) => {
			let targets=this.selectAllFrom(filter)
			if(targets.length===0) return false
			AttackHandler.skillAttacks(from,targets,skillAttack)
			return true
		}
	}
	/**
	 * skill attack by clicking skill button
	 * @param from 
	 * @param filter 
	 * @returns 
	 */
	skillAttackSingle(from:Player,to:string){
		return (skillAttack:SkillAttack) => {
			AttackHandler.skillAttacks(from,[this.getPlayer(to)],skillAttack)
		}
	}
	/**
	 * skill attack without clicking button(projectile,tickdamage...)
	 * @param from 
	 * @param filter 
	 * @returns 
	 */
	skillAttackAuto(from:Player,to:string){

		return (skillAttack:SkillAttack) => {
			return AttackHandler.skillAttackAuto(from,this.getPlayer(to),skillAttack)
		}
	}

	attackSingle(from:Entity,target:Entity){
		return (damage:Damage,effectname:string) => {
			return AttackHandler.plainAttack(from,target,damage,effectname)
		}
	}

	attack(from:Entity,filter:EntityFilter){
		return (damage:Damage,effectname:string) => {
			let attacked=false
			for (let e of this.selectAllFrom(filter)) {
				attacked=true
				AttackHandler.plainAttack(from,e,damage,effectname)
			}
			return attacked
		}
	}
	forEach(filter: EntityFilter):(action: EntityActionFunction<Entity>)=>number {
		return (action: EntityActionFunction<Entity>) => {
			let count=0
			for (let e of this.selectAllFrom(filter)) {
				count++
				action.call(e, filter.source)
			}
			return count
		}
	}

	forEachPlayer(filter: EntityFilter):(action: EntityActionFunction<Player>)=>string[] {
		return (action: EntityActionFunction<Player>) => {
			let affected=[]
			for (let e of this.selectAllFrom(filter)) {
				affected.push(e.UEID)
				action.call(e, filter.source)
			}
			return affected
		}
	}
	forAllPlayer():(action: SimplePlayerActionFunction)=>string[]{
		return (action: SimplePlayerActionFunction) => {
			let affected=[]
			for (let e of this.allPlayer()) {
				affected.push(e.UEID)
				action.call(e)
			}
			return affected
		}
	}


	forPlayer(id: string, source: Player):(action: EntityActionFunction<Player>)=>void {
		return (action: EntityActionFunction<Player>) => {
			action.call(this.storage.getPlayer(id), source)
		}
	}

	forEntity(id: string, source: Player):(action: EntityActionFunction<Entity>)=>void {
		return (action: EntityActionFunction<Entity>) => {
			action.call(this.storage.getEntity(id), source)
		}
	}

	selectAllFrom(filter: EntityFilter): PriorityArray<Entity> {
		return filter.getFrom(this.storage)
	}
	allPlayer():Player[]{
		return this.storage.allPlayer()
	}

	selectBestOneFrom(filter: EntityFilter,reverse:boolean=false,normalize:boolean=false):(pr:EntityPriorityFunction)=>Entity {
		return (priority: EntityPriorityFunction) => {
			if(reverse)
				return this.selectAllFrom(filter).getMin(priority)
			else
				return this.selectAllFrom(filter).getMax(priority)
		}
	}

}


export interface EntityPriorityFunction {
	(this: Entity): number
}
export interface FilterConditionFunction {
	(p: Entity): boolean
}
export interface EntityActionFunction<T extends Entity> {
	(this: T, source: Entity): void
}
export interface SimplePlayerActionFunction {
	(this: Player): void
}

class EntityStorage {
	private entities: Map<string, Entity>
	private playerIds: string[]
	private static readonly PLAYER_ID_SUFFIX = "P"
	constructor() {
		this.playerIds = []
		this.entities = new Map<string, Entity>()
	}
	private playerId(turn: number) {
		return String(turn + 1) + EntityStorage.PLAYER_ID_SUFFIX
	}
	addPlayer(id: string, player: Player) {
		// let pid = this.playerId(this.playerIds.length)
		this.playerIds.push(id)
		this.entities.set(id, player)
	}
	addEntity(id: string, entity: Entity) {
		this.entities.set(id, entity)
	}
	/**
	 * get player
	 * @param id
	 * @returns Player
	 */
	getPlayer(id:string): Player {
		// if (turn >= this.playerIds.length) return null
		if (!this.entities.has(id)) return null

		return this.entities.get(id) as Player
	}
	allPlayer():Player[]{
		let list=new Array<Player>()
		for(let id of this.playerIds){
			list.push(this.entities.get(id) as Player)
		}
		return list
	}
	getEntity(id: string): Entity {
		if (!this.entities.has(id)) return null
		return this.entities.get(id)
	}
	removeEntity(id: string): Entity {
		if (!this.entities.has(id)) return
		this.entities.delete(id)
	}

	cleanUpDeadEntity() {
		for (let [id, entity] of this.entities.entries()) {
			if (entity.type!==ENTITY_TYPE.PLAYER && entity.dead) {
				console.log("deleted entity " + id)
				this.entities.delete(id)
			}
		}
	}

	all() {
		return this.entities.values()
	}
}

export { EntityMediator, EntityStorage }
