import type { BaseProtoPlayer } from "../../Room/BaseProtoPlayer";

export interface SimulationSetting{
    players:BaseProtoPlayer[]
    count:number
    map:number
    saveLabelCSV:boolean
}