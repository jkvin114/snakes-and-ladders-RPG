import { CHARACTER, ITEM } from "../data/enum";
import SETTINGS = require("../../res/globalsettings.json")

import { SimulationEval as SimulationEvalModel ,CharacterSimulationEval, ISimulationEval, ICharacterSimulationEval } from "../mongodb/SimulationEvalDBSchema";
import { SimulationEvalSchema } from "../mongodb/schemaController/SimulationEval";
import { CharacterSimulationEvalSchema } from "../mongodb/schemaController/CharacterSimulationEval";
import type {Types} from "mongoose";
import { GameRecord, Indicator, PlayerRecord } from "./TrainHelper";
const EVAL_VERSION=1

enum GameType{
    P2="2P",P3="3P",P4="4P",TEAM="TEAM"
}
enum MapName{
    DEFAULT="default",OCEAN="ocean",CASINO="casino",RAPID="rapid",TRAIN="train",
}
interface characterIndex<T>{
    for:T,count:number,wins:number
}
interface ICharacterEval{
    gameType:GameType,
    mapName:MapName,
    version:number,
    serverVersion:string,
    charId:CHARACTER,
    opponents:characterIndex<CHARACTER>[],
    duos:characterIndex<CHARACTER>[],
    items:characterIndex<ITEM>[],
    itembuilds:characterIndex<string>[],
    count:number,
    wins:number,
    scores:{name:string,average:number,winAverage:number}[]
}
class CharacterEval{
    charId:CHARACTER
    opponents:Map<CHARACTER,[number,number]>
    duos:Map<CHARACTER,[number,number]>
    items:Map<ITEM,[number,number]>
    itembuilds:Map<string,[number,number]>
    count:number
    wins:number
    totalIndicator:Indicator
    winIndicator:Indicator
    constructor(charId:CHARACTER){
        this.charId=charId
        this.count=0
        this.wins=0
        this.totalIndicator=new Indicator(-1)
        this.winIndicator=new Indicator(-1)
        this.opponents=new Map<CHARACTER,[number,number]>()
        this.duos=new Map<CHARACTER,[number,number]>()
        this.items=new Map<ITEM,[number,number]>()
        this.itembuilds=new Map<string,[number,number]>()
    }
    selializeMap<T>(map:Map<T,[number,number]>)
    {
        let arr=[]
        for(const [key,val] of map.entries()){
            arr.push({
                for:key,count:val[0],wins:val[1]
            })
        }
        map.clear()
        return arr
    }

    serialize(gameType:GameType,mapname:MapName):ICharacterSimulationEval{
        if(this.count>0)
            Indicator.divide(this.totalIndicator,this.count)
        if(this.wins>0)
            Indicator.divide(this.winIndicator,this.wins)

        return {
            charId:this.charId,
            gameType:gameType,
            mapName:mapname,
            version:EVAL_VERSION,
            serverVersion:SETTINGS.version,
            count:this.count,
            wins:this.wins,
            opponents:this.selializeMap<CHARACTER>(this.opponents),
            duos:this.selializeMap<CHARACTER>(this.duos),
            items:this.selializeMap<ITEM>(this.items),
            itembuilds:this.selializeMap<string>(this.itembuilds),
            scores:Indicator.getEvalScores(this.totalIndicator,this.winIndicator)
        } as ICharacterSimulationEval
    }
}

class SimulationEval{
     gameType:GameType
     mapName:MapName
    characterEvals:(CharacterEval|null)[]
    count:number
    totalturn:number
    constructor(gameType:GameType,mapname:MapName){
        this.gameType=gameType
        this.mapName=mapname
        this.characterEvals=[]
        this.count=0
        this.totalturn=0
        this.characterEvals=new Array(SETTINGS.characters.length).fill(null)
    }
    async save(){
        let ids=[]
        for(const char of this.characterEvals){
            if(char===null) continue
            const data=await CharacterSimulationEvalSchema.create(char.serialize(this.gameType,this.mapName))
            ids.push(data._id)
        }
        await SimulationEvalSchema.create(this.serialize(ids))
    }

    serialize(chars:Types.ObjectId[]):ISimulationEval{
        let avgturn=this.count===0?0:this.totalturn/this.count

        return {
            gameType:this.gameType,
            mapName:this.mapName,
            version:EVAL_VERSION,
            serverVersion:SETTINGS.version,
            count:this.count,
            averageTotalTurn:avgturn,
            characters:chars
        } as ISimulationEval
    }
    addPlayer(p:PlayerRecord,won:boolean,game:GameRecord){
        

        if(this.characterEvals[p.character]===null){
            this.characterEvals[p.character]=new CharacterEval(p.character)
        }

        const charEval=this.characterEvals[p.character]
        charEval.count+=1
        Indicator.add(charEval.totalIndicator,p.indicator)

        if(won){
            charEval.wins+=1
            Indicator.add(charEval.winIndicator,p.indicator)
        } 

        for(const other of game.players){
            if(other===p) continue
            
            if(other.team!==p.team || !game.isTeam){//opponent
                if(charEval.opponents.has(other.character)){
                    charEval.opponents.get(other.character)[0]+=1
                    if(won) charEval.opponents.get(other.character)[1]+=1
                }
                else{
                    charEval.opponents.set(other.character,[1,won?1:0])
                }
            }
            else{ //ally
                if(charEval.duos.has(other.character)){
                    charEval.duos.get(other.character)[0]+=1
                    if(won) charEval.duos.get(other.character)[1]+=1
                }
                else{
                    charEval.duos.set(other.character,[1,won?1:0])
                }
            }
        }
        for(const item of p.coreItemBuild){
            if(charEval.items.has(item)){
                charEval.items.get(item)[0]+=1
                if(won) charEval.items.get(item)[1]+=1
            }
            else{
                charEval.items.set(item,[1,won?1:0])
            }
        }

        if(p.coreItemBuild.length >=3){
            const buildStr=p.coreItemBuild.slice(0,3).join(",")
            if(charEval.itembuilds.has(buildStr)){
                charEval.itembuilds.get(buildStr)[0]+=1
                if(won) charEval.itembuilds.get(buildStr)[1]+=1
            }
            else{
                charEval.itembuilds.set(buildStr,[1,won?1:0])
            }
        }

    }
    addGame(game:GameRecord){
        this.count+=1
        this.totalturn+=game.totalturn
        let winner=game.players.find(p=>p.isWinner)
        for(const p of game.players){
            this.addPlayer(p,p.isWinner || (game.isTeam && p.team === winner.team),game)
        }
    }


}
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