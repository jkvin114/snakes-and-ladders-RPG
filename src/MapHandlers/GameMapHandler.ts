import { ObstacleHelper } from "../core/Obstacles";
import { chooseWeightedRandom, randomBoolean } from "../core/Util";
import { MAP_TYPE } from "../data/enum";
import { ClientInputEventFormat, ServerGameEventFormat } from "../data/EventFormat";
import type { Game } from "../Game";
import { Player } from "../player/player";
import { Projectile, ProjectileBuilder } from "../Projectile";
import { MAP } from "./MapStorage";



export class GameLevel{
    game:Game
    mapId:MAP_TYPE
	readonly obstaclePlacement: { obs: number; money: number }[]
    
	private dcitem_id: string
    private tempFinish:number

	private pendingObs: number
	private pendingAction: string|null
	private roullete_result: number

    protected constructor(game:Game,mapId:MAP_TYPE,shuffleObstacle:boolean){
        this.game=game
        this.mapId=mapId
        this.obstaclePlacement = shuffleObstacle
			? MAP.getShuffledObstacles(this.mapId)
			: MAP.getObstacleList(this.mapId)
		this.tempFinish=-1
		
		this.pendingObs = 0
		this.pendingAction = null
		this.roullete_result = -1
    }
	set setPendingObs(o:number){
		this.pendingObs=o
	}
	set setPendingAction(o:string|null){
		this.pendingAction=o
	}
	get getPendingAction(){
		return this.pendingAction
	}
    static create(game:Game,mapId:MAP_TYPE,shuffleObstacle:boolean):GameLevel{
        if(mapId===MAP_TYPE.OCEAN)
            return new OceanGameLevel(game,mapId,shuffleObstacle)
        return new GameLevel(game,mapId,shuffleObstacle)
    }
    onTurnStart(thisturn:number){
        this.summonDicecontrolItem()
    }
    setFinishPos(secondPlayerLevel:number):number
    {
     
		let respawns=MAP.getRespawn(this.mapId)
        if(secondPlayerLevel+1 >= respawns.length) {
            if(this.tempFinish!==-1){
				this.tempFinish=-1
                return MAP.getFinish(this.mapId)
			}
            return -1
        }
        let finishpos=Math.min(respawns[secondPlayerLevel+1],MAP.getFinish(this.mapId))
        if(this.tempFinish!==finishpos){

			this.tempFinish=finishpos
			console.log("finishpos"+finishpos)
            return finishpos
		}
		
        return -1
    }
    isFinishPos(pos:number){
        if(this.tempFinish!==-1 && pos >= this.tempFinish) return true
        
        return pos >= MAP.getFinish(this.mapId)
    }
    applyPassProj(name:string):string{
        
        
        if (name === "dicecontrol") {
            let upid = this.dcitem_id
            // pp.removeProj()
            this.dcitem_id = ""
            this.game.thisp().giveDiceControl()
            return upid
        }
        return ""
    }
    
    /**
	 * called on every player`s turn start
	 * @returns
	 */
	summonDicecontrolItem() {
		let freq = this.game.setting.diceControlItemFrequency
		if (freq === 0) return

		let playercount = this.game.totalnum

		//player number 4:44% ~ 50% / 3: 31~39% / 2: 16~28% don`t create new item
		if (this.dcitem_id === "" && chooseWeightedRandom([playercount ** 2 + (3 - freq) * 2, 20]) === 0) {
			return
		}
		//if there is dc item left on the map, don`t change position by 50%
		if (this.dcitem_id !== "" && randomBoolean()) return

		this.game.removePassProjectileById(this.dcitem_id)
		this.dcitem_id = ""

		//don`t re-place item by 40~22% based on player count and freq
		if (chooseWeightedRandom([playercount + freq, 2]) === 1) {
			return
		}

		//플레이어 1명 랜덤선택(뒤쳐져있을수록 확률증가)
		let r = this.game.getDiceControlPlayer()

		//플레이어가 일정레벨이상일시 등장안함
		if (this.game.pOfTurn(r).level >= MAP.get(this.mapId).dc_limit_level) return

		//플레이어 앞 1칸 ~ (4~8)칸 사이 배치
		let range = 4 + (3 - freq) * 2 //4~8
		let pos = this.game.pOfTurn(r).pos + Math.floor(Math.random() * range) + 1
		let bound = MAP.get(this.mapId).respawn[MAP.get(this.mapId).dc_limit_level - 1]

		//일정범위 벗어나면 등장안함
		if (pos <= 0 || pos >= bound) return

		this.placeDiceControlItem(pos)
	}
    placeDiceControlItem(pos: number) {
		let upid = this.game.placeProjectile(new ProjectileBuilder(this.game, "dicecontrol", Projectile.TYPE_PASS).build(), pos)
		this.dcitem_id = upid
	}
    /**
	 * 킬을 해서 추가주사위 던지면 80%로 앞1~ 8칸이내에 주컨아이템 소환
	 * @param turn
	 */
	summonDicecontrolItemOnkill(turn: number) {
		if (this.game.pOfTurn(turn).level >= MAP.get(this.mapId).dc_limit_level || this.game.setting.diceControlItemFrequency === 0)
			return

		// P = 0.8~1.0
		if (Math.random() < 0.7 + 0.1 * this.game.setting.diceControlItemFrequency) {
			this.game.removePassProjectileById(this.dcitem_id)
			let range = 6
			this.placeDiceControlItem(this.game.pOfTurn(turn).pos + Math.floor(Math.random() * range) + 1)
		}
	}


	resetPendingObs(){
		this.pendingObs=0
	}
	/**
	 * 선택 장애물 대기중일 경우 바로 스킬로 안넘어가고 선택지 전송
	 * @returns null if no pending obs,  or return {name,arg}
	 */
	checkPendingObs(player:Player): ServerGameEventFormat.PendingObstacle|null {
		
		if (this.pendingObs === 0 ||player.dead) return null

		let name = ""
		let argument: number | number[] = -1
		if (this.pendingObs === 21) {
			//신의손 대기중일 경우 바로 스킬로 안넘어가고 신의손 타겟 전송
			let targets = this.game.getGodHandTarget()
			if (targets.length > 0) {
				name = "pending_obs:godhand"
				argument = targets
			} else {
				this.resetPendingObs()
				return null
			}
		}
		//납치범
		else if (this.pendingObs === 33) {
			name = "pending_obs:kidnap"
		}
		//사형재판
		else if (this.pendingObs === 37) {
			let num = Math.floor(Math.random() * 6) //0~5
			//let num=5
			this.roullete_result = num
			name = "pending_obs:trial"
			argument = num
		}
		//카지노
		else if (this.pendingObs === 38) {
			let num = Math.floor(Math.random() * 6) //0~5
			this.roullete_result = num
			name = "pending_obs:casino"
			argument = num
		}
		else{
			let result=player.mapHandler.getPendingObs(this.pendingObs)
			if(!result) return null

			name=result.name
			argument=result.argument
		}
	
		return { name: name, argument: argument }
	}

	//========================================================================================================
	processPendingObs(player:Player,info: ClientInputEventFormat.PendingObstacle|null,delay?:number) {
		
		if (!info) {
			player.mapHandler.onPendingObsTimeout(this.pendingObs)
			this.roulleteComplete(player)
			this.resetPendingObs()
			return
		}
		//타임아웃될 경우
		if(!info || !info.complete) return
		if (this.pendingObs === 0) {
			return
		}
		if (info.type === "roullete") {
			this.roulleteComplete(player)
		}
		else if (info.type === "godhand" && info.objectResult) {
			info.objectResult.kind='godhand'
			if (info.complete && info.objectResult.kind==='godhand') {
				this.game.processGodhand(info.objectResult.target,info.objectResult.location)
			}
		}
		else{
			
			player.mapHandler.onPendingObsComplete(info)
		}

		this.resetPendingObs()
	}
	processPendingAction(player:Player,info: ClientInputEventFormat.PendingAction|null,delay?:number) {
		
		if (!info||!this.pendingAction || !info.complete) {
			this.pendingAction = null
			return
		}
		player.mapHandler.onPendingActionComplete(info)

		this.pendingAction = null
		
	}
	private roulleteComplete(p:Player) {
		if(this.roullete_result===-1) return
		//	console.log("roullete" + this.pendingObs)

		//사형재판
		if (this.pendingObs === 37) {
			ObstacleHelper.trial(p, this.roullete_result)
		}
		//카지노
		else if (this.pendingObs === 38) {
			ObstacleHelper.casino(p, this.roullete_result)
		}

		this.resetPendingObs()
		this.roullete_result = -1
	}
}
class GameTwoWayLevel extends GameLevel{
    constructor(game:Game,mapId:MAP_TYPE,shuffleObstacle:boolean){
        super(game,mapId,shuffleObstacle)
    }
}
class OceanGameLevel extends GameTwoWayLevel{
    static SUBMARINE_COOLTIME=2
    private submarine_cool: number
	private submarine_id: string
    constructor(game:Game,mapId:MAP_TYPE,shuffleObstacle:boolean){
        super(game,mapId,shuffleObstacle)
		this.submarine_cool=0
		this.submarine_id=""
    }
    onTurnStart(thisturn:number){
        if(thisturn===0) this.summonSubmarine()
        super.onTurnStart(thisturn)
    }
    
	summonSubmarine() {
		if (this.submarine_cool === 0) {
			//console.log("submarine" + this.submarine_id)
			this.game.removePassProjectileById(this.submarine_id)
			this.submarine_id = ""
			let pos = 0
			let submarine_range = MAP.get(this.mapId).submarine_range

			if (submarine_range != null) {
				let diff = submarine_range.end - submarine_range.start
				pos = submarine_range.start + Math.floor(Math.random() * diff)
			}
			// pos=60
			this.placeSubmarine(pos)
			// this.placeSubmarine(60)
			this.submarine_cool = OceanGameLevel.SUBMARINE_COOLTIME
		} else {
			this.submarine_cool = Math.max(0, this.submarine_cool - 1)
		}
	}
    placeSubmarine(pos: number) {
		let upid = this.game.placeProjectile(new ProjectileBuilder(this.game, "submarine", Projectile.TYPE_PASS).build(), pos)
		this.submarine_id = upid
	}
    applyPassProj(name: string): string {
        if(name === "submarine") {
            let upid = this.submarine_id
            this.setPendingAction="submarine"
            this.submarine_id = ""
            return upid
        }
        return super.applyPassProj(name)
    }
}