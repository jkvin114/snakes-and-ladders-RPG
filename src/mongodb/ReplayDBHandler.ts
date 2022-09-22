import mongoose from "mongoose"



const gameEventSchema=new mongoose.Schema({
    invoker:{ type: Number, required: true },
    action:{ type: String, required: true },
    stringObject:String,
    numberObject:Number,
    stringArgs:[String],
    numberArgs:[Number],
    delay:{ type: Number, required: true }
}, { _id : false })

const playerSettingSchema=new mongoose.Schema({
    turn: Number,
    team: Boolean,
    HP: Number,
    MaxHP: Number,
    name: String,
    champ: Number,
    champ_name: String
}, { _id : false })

const initialSettingSchema=new mongoose.Schema({
    playerSettings:[playerSettingSchema],
    isTeam: Boolean,
    map:Number,
    shuffledObstacles: [Number]
}, { _id : false })


const replaySchema = new mongoose.Schema(
	{
		events:{ type: [gameEventSchema], required: true },
        setting:{ type: initialSettingSchema, required: true },
	},
	{ timestamps: true }
)

