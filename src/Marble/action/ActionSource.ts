export enum ACTION_SOURCE_TYPE{
    MOVE,//0
    DICE,
    GAMELOOP,
    ARRIVE_TILE,//3
    PAY_MONEY,
    BUYOUT,
    THREE_DOUBLES,//6
    BUILD_DIRECT,
    BUYOUT_DIRECT
}
export class ActionSource {
	eventType: ACTION_SOURCE_TYPE //이벤트 종류(이동/통행료/인수 등 행동 분류)
	abilityType: number //능력 종류(힐링류 잘가북류 등 능력 분류)
	sourceItem: number //발동하는데 사용된 능력/행템 고유 id
    name:string
    flags:Set<string>
    constructor(type:ACTION_SOURCE_TYPE){
        this.eventType=type
        this.sourceItem=-1
        this.name=""
        this.abilityType=-1
        this.flags=new Set<string>()
    }
    setName(name:string){
        this.name=name
        return this
    }
    setSourceItem(item:number){
        this.sourceItem=item
        return this
    }
    setAbilityType(abilityType:number){
        this.abilityType=abilityType
        return this
    }
    addFlag(flag:string){
        this.flags.add(flag)
        return this
    }
    hasFlag(flag:string){
        return this.flags.has(flag)
    }
}
