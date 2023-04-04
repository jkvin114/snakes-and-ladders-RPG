import { GameRecord } from "../data/GameRecord"
import { SimulationEval } from "./SimulationEval"
import { GameType, MapName } from "./types"

export class SimulationEvalGenerator{

    private reports:Map<GameType,Map<MapName,SimulationEval>>

    constructor(){
        this.reports= new Map<GameType,Map<MapName,SimulationEval>>()
    }
    save(){
        let total=0
        for(const types of this.reports.keys()){
            for(const g of this.reports.get(types).values()){
                try{
                    g.save()
                    total+=1
                }
                catch(e)
                {
                    console.error(`Error while saving SimulationEval for gametype: ${types}, map: ${g.mapName}`)
                    console.error(e)
                    continue
                }
            }
        }
        console.log(total+" types of SimulationEval saved.")
    }
    private hasReportFor(gameType:GameType,mapname:MapName){
        if(!this.reports.has(gameType)) return false
        return this.reports.get(gameType)!.has(mapname)
    }
    private getGameType(game:GameRecord):GameType|undefined{
        if(game.players.length===2) return GameType.P2
        if(game.players.length===3) return GameType.P3
        if(game.players.length===4) return game.isTeam?GameType.TEAM: GameType.P4
    }
    private isValidGame(game:GameRecord){
        let characters=game.players.map(p=>p.character)

        //two same characters in one game
        if(characters.length !== new Set(characters).size) return false 

        //invalid team game
        if(game.isTeam && (game.players.length!==4 || 
             game.players.reduce((val,curr) => val + (curr.team ? 1 : 0), 0) !== 2))
            return false
        return true
    }
    addGame(game:GameRecord){
        if(!this.isValidGame(game)) return
        let gameType=this.getGameType(game)
        if(!gameType) return
        let mapname:MapName
        try{
            mapname = (game.map as MapName) 
        }
        catch(e){
            return
        }
        if(this.hasReportFor(gameType,mapname)){
            this.reports.get(gameType)!.get(mapname)!.addGame(game)
        }
        else{
            let simEval=new SimulationEval(gameType,mapname)
            simEval.addGame(game)
            if(this.reports.has(gameType)) this.reports.get(gameType)!.set(mapname,simEval)
            else this.reports.set(gameType,new Map<MapName,SimulationEval>().set(mapname,simEval))
        }
    }
}