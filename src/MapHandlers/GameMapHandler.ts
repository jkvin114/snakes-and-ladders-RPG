import { chooseWeightedRandom, randomBoolean } from "../core/Util";
import { MAP_TYPE } from "../data/enum";
import type { Game } from "../Game";
import { Projectile, ProjectileBuilder } from "../Projectile";
import { MAP } from "./MapStorage";



export class GameMapHandler{
    game:Game
    mapId:MAP_TYPE
	readonly obstaclePlacement: { obs: number; money: number }[]
    
	private dcitem_id: string
    tempFinish:number

    protected constructor(game:Game,mapId:MAP_TYPE,shuffleObstacle:boolean){
        this.game=game
        this.mapId=mapId
        this.obstaclePlacement = shuffleObstacle
			? MAP.getShuffledObstacles(this.mapId)
			: MAP.getObstacleList(this.mapId)
    }
    static create(game:Game,mapId:MAP_TYPE,shuffleObstacle:boolean):GameMapHandler{
        if(mapId===MAP_TYPE.OCEAN)
            return new GameOceanMapHandler(game,mapId,shuffleObstacle)
        return new GameMapHandler(game,mapId,shuffleObstacle)
    }
    onTurnStart(thisturn:number){
        this.summonDicecontrolItem()
    }
    setFinishPos(secondPlayerLevel:number):number
    {
        
        let respawns=MAP.getRespawn(this.mapId)
        if(secondPlayerLevel+1 >= respawns.length) {
            if(this.tempFinish!==-1)
                return MAP.getFinish(this.mapId)

            this.tempFinish=-1
            return -1
        }
        let finishpos=respawns[secondPlayerLevel+1]
        if(this.tempFinish!==finishpos)
            return finishpos
        this.tempFinish=finishpos
		
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
}
class GameTwoWayMapHandler extends GameMapHandler{
    constructor(game:Game,mapId:MAP_TYPE,shuffleObstacle:boolean){
        super(game,mapId,shuffleObstacle)
    }
}
class GameOceanMapHandler extends GameTwoWayMapHandler{
    static SUBMARINE_COOLTIME=2
    private submarine_cool: number
	private submarine_id: string
    constructor(game:Game,mapId:MAP_TYPE,shuffleObstacle:boolean){
        super(game,mapId,shuffleObstacle)
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
			this.submarine_cool = GameOceanMapHandler.SUBMARINE_COOLTIME
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
            this.game.setPendingAction("submarine")
            this.submarine_id = ""
            return upid
        }
        return super.applyPassProj(name)
    }
}