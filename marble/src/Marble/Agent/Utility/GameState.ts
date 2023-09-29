
import type { MarbleGame } from "../../Game";
import { BuildableTile } from "../../tile/BuildableTile";
import { PlayerState } from "./PlayerState";
import TileState from "./TileState";
import StateVectorizer from "./Vectorize/StateVectorizer";

export default class GameState{

    players:PlayerState[]
    tiles:TileState[]
    totalturn:number
    totalBet:number
    private readonly vectorizer:StateVectorizer
    constructor(vectorizer:StateVectorizer){
        this.vectorizer=vectorizer
        this.players=[]
        this.tiles=[]
        this.totalBet=0
        this.totalturn=0
    }
    CreatePlayer():PlayerState{
        let pl=new PlayerState()
        this.players.push(pl)
        return pl
    }
    CreateTile(){
        this.tiles.push({
            isLandmark:false,
            owner:-1,
            toll:0
        })
    }
    setTile(i:number,tile:BuildableTile){
        try{
            this.tiles[i].isLandmark=tile.isLandMark()
            this.tiles[i].owner=tile.owner
            this.tiles[i].toll=tile.owner==-1?0:tile.getToll()
        }
        catch(e){
            console.error("tile state index out of range")
        }
    }

    toVector():number[]{
        return this.vectorizer.vectorize(this)
    }
}