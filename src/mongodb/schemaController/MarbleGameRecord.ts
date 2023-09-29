import { SchemaType } from "mongoose"
import { MarbleGameRecord } from "../MarbleGameSchema"
import { SchemaTypes } from "../SchemaTypes"

export namespace MarbleGameRecordSchema{
    
    export const create = async function (data:SchemaTypes.MarbleGameRecord) {
        return await new MarbleGameRecord(data).save()
    }
    export const findAll = async function () {
        return await MarbleGameRecord.find({})
    }
}