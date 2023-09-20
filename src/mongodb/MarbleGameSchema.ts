import mongoose, { Schema } from "mongoose"

const marblePlayerSchema=new mongoose.Schema({
    items:{ type: [Number], required: true },
    stats:{ type: [Number], required: true },
    score:{ type: Number, required: true },
},{ _id : false })

const marbleGameRecordSchema=new mongoose.Schema({
    players:{ type: [marblePlayerSchema], required: true },
    totalturn: { type: Number, required: true },
    version:{ type: Number, required: true },
    isTeam: { type: Boolean, required: true },
    map:{ type: String, required: true },
    winType:{ type: String, required: true },
    winner:{ type: Number, required: true },
},{timestamps:true})