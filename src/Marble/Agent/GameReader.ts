import { ABILITY_NAME } from "../Ability/AbilityRegistry"
import type { MarbleGame } from "../Game"
import { TILE_TYPE } from "../tile/Tile"
import { TileFilter } from "../tile/TileFilter"

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
	enemyPos() {
        return this.enemies.map(p=>p.pos)
	}
	tileAt(pos: number) {
		return this.game.map.tileAt(pos)
	}
    isEnemyLand(pos:number){
        return this.tileAt(pos).owner!==this.myturn && this.tileAt(pos).owner!==-1
    }

    landAt(pos:number){
        let land= this.game.map.buildableTileAt(pos)
        if(!land) throw new Error("position "+pos+" is not a buildable tile")
        return land
    }
	mostExpensiveEnemyLand() {
		return this.game.map.getMostExpensiveIn(this.me, TileFilter.ENEMY_LAND())
	}
	mostExpensiveMyLand() {
		return this.game.map.getMostExpensiveIn(this.me, TileFilter.MY_LAND())
	}
	mostExpensiveEnemyLandmark() {
		return this.game.map.getMostExpensiveIn(this.me, TileFilter.ENEMY_LAND().setLandMarkOnly())
	}
	mostExpensiveMyLandmark() {
		return this.game.map.getMostExpensiveIn(this.me, TileFilter.MY_LANDMARK())
	}

	hasOneAbility(turn: number, abilities: Set<ABILITY_NAME>) {
		return this.getPlayer(turn).hasOneAbilities(abilities)
	}

    willBeMyColorMonopoly(pos:number){
        return this.game.map.willBeColorMonopoly(this.myturn,pos)
    }

    playerAtHasOneAbility(pos:number,abilities: Set<ABILITY_NAME>){
       return this.game.mediator.getPlayersAt([pos]).some(p=>p.hasOneAbilities(abilities))
    }
    getPlayersBetween(start:number,end:number){
        return this.game.mediator.getPlayersBetween(start,end)
    }
    getPlayersAt(pos:number){
        return this.game.mediator.getPlayersAt([pos])
    }
    getGodHandPossibleBuildPos(){
        return this.game.map.getTiles(
			this.game.mediator.pOfTurn(this.myturn),
			TileFilter.EMPTY_LANDTILE().setSameLineOnly(),
			TileFilter.MY_LANDTILE().setOnlyMoreBuildable().setSameLineOnly()
		)
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
