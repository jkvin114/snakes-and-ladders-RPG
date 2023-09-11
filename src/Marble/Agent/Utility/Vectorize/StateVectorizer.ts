import type GameState from "../GameState";
import { PlayerState } from "../PlayerState";

export default abstract class StateVectorizer{
    abstract vectorizeGame(state:GameState):number[]
    abstract vectorizePlayer(state:PlayerState):number[]

    verify(vec:number[]){
        if(vec.some(v=>v===undefined||v===null||typeof(v)!=="number"))
            throw Error("Vector verification failed! all element in vector should be a number!")
    }

    vectorize(state:GameState){
        let vec= this.vectorizeGame(state).concat(...state.players.map(p=>this.vectorizePlayer(p)))
        
        this.verify(vec)
        return vec
    }
}