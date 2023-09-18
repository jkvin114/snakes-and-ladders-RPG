import type { BaseProtoPlayer } from "../../Room/BaseProtoPlayer";
import { ServerEventModel } from "../Model/ServerEventModel";

export interface SimulationSetting{
    players:BaseProtoPlayer[]
    count:number
    map:number
    saveLabelCSV:boolean
    items:ServerEventModel.ItemSetting
}