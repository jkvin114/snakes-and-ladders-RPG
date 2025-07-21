import { ABILITY_NAME } from "../Ability/AbilityRegistry"
import type { MarbleGame } from "../Game"
import { MONOPOLY } from "../GameMap"
import { SAME_LINE_TILES } from "../mapconfig"
import { AbilityTag } from "../Tags"
import { LandTile } from "../tile/LandTile"
import { BUILDING, TILE_TYPE } from "../tile/Tile"
import { TileFilter } from "../tile/TileFilter"
import { backwardBy, forwardBy, getSameLineTiles, maxFor, pos2Line, shuffle } from "../util"

export default class GameReader {
	private readonly game: MarbleGame
	myturn: number

	constructor(game: MarbleGame) {
		this.game = game
		this.myturn = 0
	}
	getPlayer(turn: number) {
		return this.game.mediator.pOfTurn(turn)
	}
	get me() {
		return this.getPlayer(this.myturn)
	}
    get enemies(){
       return this.game.mediator.getNonRetiredPlayers().filter(p=>p.turn!==this.myturn)
    }
    get blackholepos(){
        return this.game.map.blackholeTile
    }
    get whiteholepos(){
        return this.game.map.whiteholeTile
    }
    get mapName(){
        return this.game.map.name
    }
    specialPos() {
        return {
            lifted : this.game.map.liftedTile,
            waterStreams : this.game.map.waterstreamTiles,
            waterStreamTarget:this.game.map.getWaterStreamTargetPos()
        }
	}
    playerPos() {
        return [...new Set(this.game.mediator.getNonRetiredPlayers().map(p=>p.pos))]
	}
	enemyPos() {
        return this.enemies.map(p=>p.pos)
	}
	tileAt(pos: number) {
		return this.game.map.tileAt(pos)
	}
    isEnemyLand(pos:number){
        return this.tileAt(pos).owner!==this.myturn && this.tileAt(pos).owner!==-1
    }
    isEmptyLand(pos:number){
       return  this.tileAt(pos).isBuildable && this.landAt(pos).isEmpty()
    }
    isLandmark(pos:number){
       return  this.tileAt(pos).isBuildable && this.landAt(pos).isLandMark()
    }
    landAt(pos:number){
        let land= this.game.map.buildableTileAt(pos)
        if(!land) throw new Error("position "+pos+" is not a buildable tile")
        return land
    }
    isMyLand(pos:number){
        return this.tileAt(pos).owner === this.myturn
    }
    is3Build(pos:number){
       return this.tileAt(pos).isBuildable && this.landAt(pos).getNextBuild() === BUILDING.LANDMARK
    }
    /**
     * 1000만: 2, 1억:3
     * @param pos 
     * @returns 
     */
    logToll(pos:number){
        if(!this.tileAt(pos).isBuildable) return 0.1
        return Math.log10(this.landAt(pos).getToll() / 100000)
    }
    toll(pos:number){
        if(!this.tileAt(pos).isBuildable) return 0
        return this.landAt(pos).getToll()
    }
	mostExpensiveEnemyLand() {
		return this.game.map.getMostExpensiveIn(this.me, TileFilter.ENEMY_LAND())
	}
	mostExpensiveMyLand() {
		return this.game.map.getMostExpensiveIn(this.me, TileFilter.MY_LAND())
	}
    myLands() {
		return this.game.map.getOwnedLandsOf(this.me.turn)
	}
    has3BuildLands() {
		return this.game.map.getTiles(this.me, TileFilter.MY_LAND()).some(p=>this.is3Build(p))
	}
	mostExpensiveEnemyLandmark() {
		return this.game.map.getMostExpensiveIn(this.me, TileFilter.ENEMY_LAND().setLandMarkOnly())
	}
	mostExpensiveMyLandmark() {
		return this.game.map.getMostExpensiveIn(this.me, TileFilter.MY_LANDMARK())
	}

	hasOneAbility(turn: number, abilities: AbilityTag) {
		return this.getPlayer(turn).hasOneAbilities(abilities)
	}

    willBeMyColorMonopoly(pos:number){
        return this.game.map.willBeColorMonopoly(this.myturn,pos)
    }
    canMakeMonopolyAfterSwap(oldpos:number,newpos:number,currentLands:number[]){
        return this.game.map.checkMonopolyExistsFor([...currentLands.filter(p=>p!==oldpos),newpos]) !== MONOPOLY.NONE
    }
    isColorMonopolyOf(pos:number,turn:number){
        const tile = this.tileAt(pos)
        if(tile.isBuildable && tile instanceof LandTile){
            let color = (tile as LandTile).color
            return this.game.map.colorMonopolys.get(color) === turn
        }
        return false
        
    }
    getEnemyMonopolyAlerts():{type:MONOPOLY,turn:number,pos:number}[]{
        let players= this.game.mediator.getEnemiesOf(this.myturn).map(t=>this.getPlayer(t))
        let alerts:{type:MONOPOLY,turn:number,pos:number}[] = []
        for(const p of players){
            let monopolies = [...p.monopolyChancePos.entries()]
            alerts.push(...monopolies.map(m=>{return {turn:p.turn,type:m[1],pos:m[0]}}))
        }
        return alerts
    }

    getWorstEnemyMonopolyAlertPosition(excludeSafeLands:boolean = true):number{
        let players= this.game.mediator.getEnemiesOf(this.myturn).map(t=>this.getPlayer(t))
        let alerts:[number, MONOPOLY][]= []
        for(const p of players){
            alerts.push(...p.monopolyChancePos.entries())
        }

        if(excludeSafeLands){

            //건설된 관광지와 랜마 제외
            alerts = alerts.filter(p=>
                !(this.tileAt(p[0]).type === TILE_TYPE.SIGHT && !this.isEmptyLand(p[0])) &&
                !this.isLandmark(p[0])
            )
        }
        
        if(alerts.length===0) return -1

        alerts = shuffle(alerts)

        return maxFor(alerts,a=>a[1])[0]
    }

    playerAtHasOneAbility(pos:number,abilities: AbilityTag){
       return this.game.mediator.getPlayersAt([pos]).some(p=>p.hasOneAbilities(abilities))
    }
    getPlayersBetween(start:number,end:number){
        return this.game.mediator.getPlayersBetween(start,end)
    }
    getOtherPlayersBetween(start:number,end:number){
        return this.game.mediator.getPlayersBetween(start,end).filter(p=>p.turn!==this.myturn)
    }
    /**
     * forward and backward are inclusive
     * @param forward 
     * @param backward 
     * @returns 
     */
    countPlayersNearby(pos:number,forward:number,backward:number){
        return this.getOtherPlayersBetween(backwardBy(pos,backward+1),forwardBy(pos,forward+1)).length
    }
    getEnemiesAt(pos:number){
        return this.game.mediator.getPlayersAt([pos]).filter(p=>p.turn!==this.myturn)
    }
    getPlayersAt(pos:number){
        return this.game.mediator.getPlayersAt([pos])
    }
    getPossibleBuildPosInLine(){
        return this.game.map.getTiles(
			this.game.mediator.pOfTurn(this.myturn),
			TileFilter.EMPTY_LANDTILE().setSameLineOnly(),
			TileFilter.MY_LANDTILE().setOnlyMoreBuildable().setSameLineOnly()
		)
    }
    getVaildWaterPumpTargets(pos:number){
        return getSameLineTiles(pos).filter(t=>t!==pos && t!==backwardBy(pos,1))
    }
    /**
     * if percent is not set, return true if one or more enemy has it
     * 
     * @param abilities set of abilies to check
     * @param percent minimum percent of enemy to have the ability.
     * @returns 
     */
    enemyHasOneAbility(abilities: Set<ABILITY_NAME>,percent?:number){
        let enemies=this.enemies
        let count=0
        for(const e of enemies){
            if(this.hasOneAbility(e.turn,abilities))
                count++
        }
        if(percent===undefined) return count>0

        return count/enemies.length >= percent
    }


}
