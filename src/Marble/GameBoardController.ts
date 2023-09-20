import type { MarbleGameMap } from "./GameMap";
import { MarbleGameEventObserver } from "./MarbleGameEventObserver";

export default class GameBoardController{
    private readonly board:MarbleGameMap
	eventEmitter: MarbleGameEventObserver

    constructor(board:MarbleGameMap){
        this.board=board
    }
    
}