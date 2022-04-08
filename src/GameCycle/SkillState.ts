import { GameCycleState } from "./GameCycleState"
import * as GAME_CYCLE from "./StateEnum"
import { INIT_SKILL_RESULT } from "../enum"
import { Game } from "../Game"
import { RoomClientInterface } from "../app"
import { ServerPayloadInterface } from "../PayloadInterface"
import SETTINGS = require("../../res/globalsettings.json")

export class WaitingSkill extends GameCycleState {
	static id = GAME_CYCLE.SKILL.WAITING_SKILL
    idleTimeout:NodeJS.Timeout
	constructor(game: Game) {
		super(game,WaitingSkill.id)
        this.idleTimeout=null
	}
	onCreate(): void {
		let status = this.game.getSkillStatus()
		// console.log(status)
		RoomClientInterface.setSkillReady(this.rname, status)
	}
    timeOut(f:Function){
        if(this.idleTimeout!=null){
            this.idleTimeout=setTimeout(()=>f,SETTINGS.idleTimeout)
        }
    }
	onUserClickSkill(skill: number,crypt_turn:string): GameCycleState {
        if(this.crypt_turn!==crypt_turn) return this
        clearTimeout(this.idleTimeout)
		let result = this.game.onSelectSkill(skill - 1)

		if (result.type === INIT_SKILL_RESULT.NON_TARGET || result.type === INIT_SKILL_RESULT.ACTIVATION) {
			return new WaitingSkill(this.game)
		}
		if (
			result.type === INIT_SKILL_RESULT.NO_COOL ||
			result.type === INIT_SKILL_RESULT.NOT_LEARNED ||
			result.type === INIT_SKILL_RESULT.NO_TARGETS_IN_RANGE
		) {
			return this
		}
		if (result.type === INIT_SKILL_RESULT.TARGTING) {
			return new WaitingTarget(this.game,result)
		}
		if (result.type === INIT_SKILL_RESULT.PROJECTILE) {
			return new WaitingLocation(this.game,result)
		}
		if (result.type === INIT_SKILL_RESULT.AREA_TARGET) {
			return new WaitingAreaTarget(this.game,result)
		}
	}
}
abstract class WaitingSkillResult extends GameCycleState {
    initSkillResult:ServerPayloadInterface.SkillInit
    idleTimeout:NodeJS.Timeout
	constructor(game: Game,id:number,result:ServerPayloadInterface.SkillInit) {
		super(game,id)
        this.initSkillResult=result
	}
	onUserBasicAttack(crypt_turn:string): GameCycleState {
        if(this.crypt_turn!==crypt_turn) return this

		this.game.thisp().basicAttack()
		return new WaitingSkill(this.game)
	}
    timeOut(f:Function){
        if(this.idleTimeout!=null){
            this.idleTimeout=setTimeout(()=>f,SETTINGS.idleTimeout)
        }
    }
    timeOutClear(){
        clearTimeout(this.idleTimeout)
    }
}

class WaitingTarget extends WaitingSkillResult {
	static id = GAME_CYCLE.SKILL.WAITING_TARGET

	constructor(game: Game,result:ServerPayloadInterface.SkillInit) {
		super(game,WaitingTarget.id, result)
	}
	onCreate(): void {}
	onUserChooseSkillTarget(target: number,crypt_turn:string): GameCycleState {
        if(this.crypt_turn!==crypt_turn) return this
        this.timeOutClear()
		if (target > 0) {
			this.game.useSkillToTarget(target)
		}
		return new WaitingSkill(this.game)
	}
}
class WaitingLocation extends WaitingSkillResult {
	static id = GAME_CYCLE.SKILL.WAITING_LOCATION

	constructor(game: Game,result:ServerPayloadInterface.SkillInit) {
		super(game,WaitingLocation.id,result)
	}
	onCreate(): void {}
	onUserChooseSkillLocation(location: number,crypt_turn:string): GameCycleState {
        if(this.crypt_turn!==crypt_turn) return this
        this.timeOutClear()
		if (location > 0) {
			this.game.placeSkillProjectile(location)
		}
		return new WaitingSkill(this.game)
	}
}
class WaitingAreaTarget extends WaitingSkillResult {
	static id = GAME_CYCLE.SKILL.WAITING_AREA_TARGET

	constructor(game: Game,result:ServerPayloadInterface.SkillInit) {
		super(game,WaitingAreaTarget.id,result)
	}
	onCreate(): void {}
	onUserchoseAreaSkillLocation(location: number,crypt_turn:string): GameCycleState {
        if(this.crypt_turn!==crypt_turn) return this
        this.timeOutClear()
        if (location > 0) {
			this.game.useAreaSkill(location)
		}
		return new WaitingSkill(this.game)
	}
}
