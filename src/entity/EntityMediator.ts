// import { PlayerClientInterface } from "../app"
import { Player } from "../player/player"
import { EntityFilter } from "./EntityFilter"
import { SummonedEntity } from "../characters/SummonedEntity/SummonedEntity"
import { Entity } from "./Entity"
import { EFFECT, ENTITY_TYPE,  FORCEMOVE_TYPE,  STAT } from "../data/enum"
import {  PriorityArray, Normalize, sleep, CALC_TYPE } from "../core/Util"
import { MAP } from "../MapHandlers/MapStorage"
import { ServerGameEventInterface } from "../data/PayloadInterface"
import {trajectorySpeedRatio} from "../../res/globalsettings.json"
import { GameEventObserver } from "../GameEventObserver"
import { EntityStorage } from "./EntityStorage"
import { Damage } from "../core/Damage"
import { SkillAttack } from "../core/skill"
import { HPChange } from "../core/health"



class AttackHandler{
	static basicAttacks(from:Player,targets:(Entity|undefined)[],damage:Damage):boolean{
		let died=false
		let data:ServerGameEventInterface.Attack={
			targets:[],source:from.turn,visualeffect:from.getBasicAttackName(),sourcePos:from.pos
		}
		for(let t of targets){
			if(!t) continue
			let v=this.basicAttack(from,t,damage)
			data.targets.push(v)
			died=died||(v.flags.includes("died"))
		}
		
		from.game.eventEmitter.attack(data)
		return died
	}

	static async skillAttacks(from:Player,targets:Entity[],skillattack:SkillAttack){
	//	console.log(skillattack)
		let delay=from.getSkillTrajectorySpeed(from.getSkillName(skillattack.skill))
		if(delay>0){
			delay=MAP.getCoordinateDistance(from.mapId,from.pos,targets[0].pos) * delay / trajectorySpeedRatio
			let data:ServerGameEventInterface.skillTrajectory={
				from:from.pos,
				to:targets[0].pos,
				type:from.getSkillName(skillattack.skill),
				delay:delay
			}
			from.game.eventEmitter.skillTrajectory(data)

			if(!from.game.instant){
				await sleep(delay)
			}
		}

		let data:ServerGameEventInterface.Attack={
			targets:[],source:from.turn,visualeffect:skillattack.name,sourcePos:from.pos
		}

		for(let t of targets){
			let v=this.skillAttack(from,t,skillattack)
			data.targets.push(v)
		}

		from.game.eventEmitter.attack(data)
	}

	static basicAttack(from:Player,target:Entity,dmg:Damage):ServerGameEventInterface.Victim{
		
		let damage=dmg.clone()

		if(target instanceof Player){
			damage = from.effects.onBasicAttackHit(damage, target)
			.updateAllDamage(CALC_TYPE.multiply,from.ability.basicAttackMultiplier())

			damage = target.effects.onBasicAttackDamage(damage, from.UEID)
		}
		let victimData:ServerGameEventInterface.Victim={
			pos:target.pos,flags:[],damage:damage.getTotalDmg()
		}
	//("-----------basicattack"+damage.getTotalDmg())
		let died= AttackHandler.doDamage(from,target,damage,from.getBasicAttackName(),true)
		
		if(died) victimData.flags.push("died")
		return victimData
	}


	static skillAttackAuto(from:Player,target:Entity|undefined,skillattack:SkillAttack):boolean{
		if(!target) return false
		let v=this.skillAttack(from,target,skillattack)
		let data:ServerGameEventInterface.Attack={
			targets:[v],source:from.turn,visualeffect:skillattack.name,sourcePos:from.pos
		}
		from.game.eventEmitter.attack(data)
		return (v.flags.includes("died"))
	}

	static skillAttack(from:Player,target:Entity,skillattack:SkillAttack):ServerGameEventInterface.Victim{
		let victimData:ServerGameEventInterface.Victim={
			pos:target.pos,flags:[],damage:0
		}
		let damage=skillattack.damage.clone()


		if (target instanceof Player) {

			
			let effectname=skillattack.name
			let flags=[]
			//방어막 효과
			if (target.effects.has(EFFECT.SHIELD)) {
				target.effects.reset(EFFECT.SHIELD)
				AttackHandler.doDamage(from,target,Damage.zero(),  effectname, true, [HPChange.FLAG_BLOCKED_BY_SHIELD])
				victimData.flags.push("shield")
				return victimData
			}

			if (skillattack.onHit != null) {
				skillattack.onHit.call(target)
			}
			damage = target.effects.onSkillDamage(damage, from.UEID)
			damage = from.effects.onSkillHit(damage, target)

			if (damage.getTotalDmg() === 0) {
				flags.push(HPChange.FLAG_NODMG_HIT)
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
			victimData.damage=damage.getTotalDmg()
			if(AttackHandler.doDamage(from, target,damage, skillattack.name, false)){
				victimData.flags.push("died")
			}
		}


		return victimData
	}

	static plainAttack(from:Entity,target:Entity,dmg:Damage,effectname:string):boolean{
		let damage=dmg.clone()

		let data:ServerGameEventInterface.Attack={
			targets:[{
				pos:target.pos,flags:[],damage:damage.getTotalDmg()
			}],source:-1,visualeffect:effectname,sourcePos:0
		}

		from.game.eventEmitter.attack(data)

		return AttackHandler.doDamage(from,target,damage,effectname,false,[HPChange.FLAG_PLAINDMG])
	}


	static doDamage(from:Entity,target:Entity,damage:Damage, effectname:string, needDelay:boolean, flags?:number[]){
		let changeData = new HPChange(0)
		let finaldmg=damage.getTotalDmg()

		if(from instanceof Player && target instanceof Player){
			let pureDamage=finaldmg

			finaldmg=from.ability.applyResistanceToDamage(damage, target.ability)
			from.statistics.add(STAT.DAMAGE_DEALT, finaldmg)
			target.statistics.add(STAT.DAMAGE_REDUCED, pureDamage - finaldmg)
			target.markDamageFrom(from.turn)
			
			from.ability.absorb_hp(finaldmg) //모든피해흡혈, 어시스트저장

		}

		if(from instanceof Player){
			changeData.setSourcePlayer(from)
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
	private  storage: EntityStorage
	private readonly isTeam: boolean
	private readonly instant: boolean
	private readonly rname: string
	private eventEmitter:GameEventObserver
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
	setClientInterface(ci:GameEventObserver){
		this.eventEmitter=ci
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
	moveSummonedEntityTo(entityId: string, pos: number) {
		let entity = this.getEntity(entityId)
		if (!entity) return 

		entity.forceMove(pos)
		if (entity instanceof SummonedEntity) {
			this.eventEmitter.update( "move_entity", entity.summoner.turn, {
				UEID: entity.UEID,
				pos: entity.pos
			})
		}
		return entity
	}
	forceMovePlayerIgnoreObstacle(id:string, pos: number, movetype: string) {
		let player = this.getPlayer(id)
		if (!(player instanceof Player)) return

		this.eventEmitter.playerForceMove(player.turn, pos, movetype)

		player.forceMove(pos)

		if (!this.instant){
			player.game.requestForceMove(player,movetype,true)
		}
	}

	forceMovePlayer(id:string, pos: number, movetype: string) {

		let player = this.getPlayer(id)
		if (!(player instanceof Player)) return

		this.eventEmitter.playerForceMove(player.turn, pos, movetype)

		player.forceMove(pos)

		if (this.instant) {
			player.arriveAtSquare(true)
		} else {
			player.game.requestForceMove(player,movetype,false)
		}
	}
	swapPlayerPosition(target1:Entity,target2:Entity):boolean{
		if (target1 != null && target2 != null) {
			let pos2=target1.pos
			this.forceMovePlayer(target1.UEID, target2.pos,FORCEMOVE_TYPE.SIMPLE)
			this.forceMovePlayerIgnoreObstacle(target2.UEID, pos2,  FORCEMOVE_TYPE.SIMPLE)
			
			return true
		}
		return false
	}
	getSecondPlayerLevel():number{
		let sortedByPos=this.allPlayer().sort((a,b)=>b.pos-a.pos)
		let first=sortedByPos[0]
		if(!this.isTeam)
			return sortedByPos[1].level
		else if(sortedByPos.length>2 && sortedByPos[1].team===first.team)
			return sortedByPos[2].level


		return sortedByPos[1].level
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
	basicAttack(from:Player,filter:EntityFilter,damage:Damage){
		let targets=this.selectAllFrom(filter)
		if(targets.length===0) return false
		AttackHandler.basicAttacks(from,targets,damage)
	}

	basicAttackSingle(from:Player,to:string,damage:Damage){
		return AttackHandler.basicAttacks(from,[this.getPlayer(to)],damage)
	}


	/**
	 * skill attack by clicking skill button
	 * @param from 
	 * @param filter 
	 * @returns 
	 */
	skillAttack(from:Player,filter:EntityFilter,skillAttack:SkillAttack){
		let targets=this.selectAllFrom(filter)
		if(targets.length===0) return false
		AttackHandler.skillAttacks(from,targets,skillAttack)		
		return true
	}
	/**
	 * skill attack by clicking skill button
	 * @param from 
	 * @param filter 
	 * @returns 
	 */
	skillAttackSingle(from:Player,to:string,skillAttack:SkillAttack){
		AttackHandler.skillAttacks(from,[this.getPlayer(to)],skillAttack)
	}
	/**
	 * skill attack without clicking button(projectile,tickdamage...)
	 * @param from 
	 * @param filter 
	 * @returns 
	 */
	skillAttackAuto(from:Player,to:string,skillAttack:SkillAttack){
		return AttackHandler.skillAttackAuto(from,this.getPlayer(to),skillAttack)
		
	}

	attackSingle(from:Entity,target:Entity,damage:Damage,effectname:string){
		return AttackHandler.plainAttack(from,target,damage,effectname)
	}

	attack(from:Entity,filter:EntityFilter,damage:Damage,effectname:string){
		let attacked=false
		for (let e of this.selectAllFrom(filter)) {
			attacked=true
			AttackHandler.plainAttack(from,e,damage,effectname)
		}
		return attacked
	
	}
	forEach(filter: EntityFilter,action: EntityActionFunction<Entity>):number {
			let count=0
			for (let e of this.selectAllFrom(filter)) {
				count++
				action.call(e, filter.source)
			}
			return count
		
	}

	forEachPlayer(filter: EntityFilter,action: EntityActionFunction<Player>):string[] {
		let affected=[]
		for (let e of this.selectAllFrom(filter)) {
			affected.push(e.UEID)
			action.call(e, filter.source)
		}
		return affected
		
	}
	forAllPlayer(action: SimplePlayerActionFunction):string[]{
			let affected=[]
			for (let e of this.allPlayer()) {
				affected.push(e.UEID)
				action.call(e)
			}
			return affected
		
	}


	forPlayer(id: string, source: Player,action: EntityActionFunction<Player>):void {
		action.call(this.storage.getPlayer(id), source)
		
	}

	forEntity(id: string, source: Player,action: EntityActionFunction<Entity>):void {
		action.call(this.storage.getEntity(id), source)
		
	}

	selectAllFrom(filter: EntityFilter): PriorityArray<Entity> {
		return filter.getFrom(this.storage)
	}

	private filterPlayers(list:PriorityArray<Entity>){
		let players=new PriorityArray<Player>()
		for(const e of list)
		{
			if(e instanceof Player) players.push(e)
		}
		return players
	}

	selectAllPlayerFrom(filter: EntityFilter): PriorityArray<Player> {
		return this.filterPlayers(this.selectAllFrom(filter))
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
	count(filter: EntityFilter):number{
		return this.selectAllFrom(filter).length
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

export { EntityMediator }
