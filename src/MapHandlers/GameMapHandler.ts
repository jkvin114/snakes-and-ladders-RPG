import { MAP_TYPE } from "../data/enum";
import { Game } from "../Game";



class GameMapHandler{
    game:Game
    mapId:MAP_TYPE

    constructor(game:Game,mapId:MAP_TYPE){
        this.game=game
        this.mapId=mapId
    }

    
}