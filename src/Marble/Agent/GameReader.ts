import type { MarbleGame } from "../Game";

export default class GameReader{
    private readonly game:MarbleGame

    constructor(game:MarbleGame){
        this.game=game
    }
    getPlayer(turn:number){
        return this.game.mediator.pOfTurn(turn)
    }
    tileAt(pos:number){
        return this.game.map.tileAt(pos)
    }
}