import type { ServerGameEventInterface } from "./data/PayloadInterface"
export interface replayInitialSetting {
    playerSettings: {
        turn: number
        team: boolean
        HP: number
        MaxHP: number
        name: string
        champ: number
        champ_name: string
    }[]
    isTeam: boolean
    map:number,
    shuffledObstacles: number[]
}

export class ReplayEventRecords{
    private events:EventRecord[]
    private setting:replayInitialSetting
    private enabled:boolean
    constructor(enabled:boolean){
        this.enabled=enabled
        this.events=[]
        this.setting
    }
    addEvent(eventRecord:EventRecord){
        if(this.enabled)
            this.events.push(eventRecord)
    }
    setInitialSetting(setting:ServerGameEventInterface.initialSetting){
        if(!this.enabled) return

        this.setting={
            playerSettings:[],
            isTeam:setting.isTeam,
            map:setting.map,
            shuffledObstacles:setting.shuffledObstacles
        }
        for(const player of setting.playerSettings){
            this.setting.playerSettings.push({
                turn:player.turn ,
                team:player.team ,
                HP:player.HP ,
                MaxHP:player.MaxHP ,
                name:player.name ,
                champ:player.champ ,
                champ_name:player.champ_name
            })
        }
    }
}
export class EventRecord{
    private invoker:number
    private action:string
    private stringObject:string
    private numberObject:Number
    private stringArgs:string[]|undefined
    private numberArgs:number[]|undefined
    private delay:number
    constructor(action:string){
        this.invoker=-1
        this.delay=-1
        this.stringObject=""
        this.numberObject=0
        this.action=action
    }
    setInvoker(invoker:number){
        this.invoker=invoker
        return this
    }
    setDelay(delay:number){
        this.delay=delay
        return this
    }
    setStringArgs(...stringArgs:string[]){
        this.stringArgs=stringArgs
        return this
    }
    setNumberArgs(...numberArgs:number[]){
        this.numberArgs=numberArgs
        return this
    }
    setStringObject(stringObject:string){
        this.stringObject=stringObject
        return this
    }
    setNumberObject(numberObject:number){
        this.numberObject=numberObject
        return this
    }
}