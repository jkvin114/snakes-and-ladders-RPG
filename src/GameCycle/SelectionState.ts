import { GameCycleState } from "./GameCycleState"
import * as GAME_CYCLE from "./StateEnum"
import { Game } from "../Game"
import { ClientPayloadInterface, ServerPayloadInterface } from "../PayloadInterface"
import { RoomClientInterface } from "../app"
import { WaitingSkill } from "./SkillState"
import SETTINGS = require("../../res/globalsettings.json")


class PendingObstacle extends GameCycleState {
	static id = GAME_CYCLE.BEFORE_SKILL.PENDING_OBSTACLE
    obs:ServerPayloadInterface.PendingObstacle
    idleTimeout:NodeJS.Timeout
	constructor(game: Game,obs:ServerPayloadInterface.PendingObstacle) {
		super(game,PendingObstacle.id)
        this.obs=obs
	}
	onCreate(): void {
        RoomClientInterface.sendPendingObs(this.rname, this.obs)
    }
    timeOut(f:Function){
        if(this.idleTimeout!=null){
            this.idleTimeout=setTimeout(()=>{
                this.game.processPendingObs(null)
                f()
            },SETTINGS.idleTimeout)
        }
    }

    onUserCompletePendingObs(info: ClientPayloadInterface.PendingObstacle,crypt_turn:string): GameCycleState {
        if(crypt_turn!==this.crypt_turn) return this
        clearTimeout(this.idleTimeout)
        this.game.processPendingObs(info)

        let action=this.game.getPendingAction()
        if (!action || this.game.thisp().dead) {
            return new WaitingSkill(this.game)
        }
        else{
            return new PendingAction(this.game,action)
        }
        
    }
}

class PendingAction extends GameCycleState {
	static id = GAME_CYCLE.BEFORE_SKILL.PENDING_ACTION
    action:string
    idleTimeout:NodeJS.Timeout

	constructor(game: Game,action:string) {
		super(game,PendingAction.id)
        this.action=action
	}
    timeOut(foo:Function){
        if(this.idleTimeout!=null){
            this.idleTimeout=setTimeout(()=>{
                this.game.processPendingObs(null)
                foo()
            },SETTINGS.idleTimeout)
        }
    }
	onCreate(): void {
        if (this.action === "submarine") {
            RoomClientInterface.sendPendingAction(this.rname, "server:pending_action:submarine", this.game.thisp().pos)
        }
        if (this.action === "ask_way2") {
            RoomClientInterface.sendPendingAction(this.rname, "server:pending_action:ask_way2", 0)
        }
    }
    onUserCompletePendingAction(info: ClientPayloadInterface.PendingAction,crypt_turn:string): GameCycleState {
        if(crypt_turn!==this.crypt_turn) return this
        clearTimeout(this.idleTimeout)
        this.game.processPendingAction(info)
        return new WaitingSkill(this.game)
    }
}