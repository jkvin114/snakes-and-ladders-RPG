
import { ProtoPlayer } from "../../Model/models";
import { ServerEventModel } from "../../Model/ServerEventModel";

export interface SimulationSetting{
    players:ProtoPlayer[]
    count:number
    map:number
    saveLabelCSV:boolean
    items:ServerEventModel.ItemSetting
}