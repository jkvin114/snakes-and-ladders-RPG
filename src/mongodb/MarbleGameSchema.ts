import mongoose, { Schema } from "mongoose"

const marblePlayerSchema=new mongoose.Schema({
    items:{ type: [Number], required: true },
    stats:{ type: [Number], required: true },
    score:{ type: Number, required: true },
    name:String,
    char:Number,
    userId:String,
    agentType:String,
    turn:Number,
    index:Number
},{ _id : false })

export const marbleGameRecordSchema=new mongoose.Schema({
    players:{ type: [marblePlayerSchema], required: true },
    totalturn: { type: Number, required: true },
    version:{ type: Number, required: true },
    isTeam: { type: Boolean, required: true },
    map:{ type: String, required: true },
    winType:{ type: String, required: true },
    winner:{ type: Number, required: true },
    seed:{ type: Number, required: false },
    itemseed:{ type: Number, required: false },
},{timestamps:true})
export const MarbleGameRecord = mongoose.model("MarbleGameRecord", marbleGameRecordSchema)