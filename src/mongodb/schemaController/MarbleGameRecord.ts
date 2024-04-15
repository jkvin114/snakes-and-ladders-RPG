import { SchemaType, Types } from "mongoose"
import { MarbleGameRecord } from "../MarbleGameSchema"
import { SchemaTypes } from "../SchemaTypes"
import { MongoId } from "../types"

export namespace MarbleGameRecordSchema{
    
    export const create = async function (data:SchemaTypes.MarbleGameRecord) {
        return await new MarbleGameRecord(data).save()
    }
    export const findAll = async function () {
        return await MarbleGameRecord.find({}).limit(100)
    }
    export const findById = async function (id:MongoId) {
        return await MarbleGameRecord.findById(id)
    }
    export const findAllByIdList = function(ids: Types.ObjectId[]) {
        return MarbleGameRecord.find({ _id:{$in:ids}}).limit(100).sort({ createdAt: "desc" })
    };
}