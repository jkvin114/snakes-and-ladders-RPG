import mongoose, { Schema,InferSchemaType } from "mongoose"



const characterIndexSchema=new mongoose.Schema({
    for:{ type: mongoose.Schema.Types.Mixed, required: true },
    count:{ type: Number, required: true },
    wins:{ type: Number, required: true },
}, { _id : false })

const characterScoreSchema=new mongoose.Schema({
    name:{ type: String, required: true },
    average:{ type: Number, required: true },
    winAverage:{ type: Number, required: true }
}, { _id : false })


const characterEvalSchema=new mongoose.Schema({
    gameType: {
        type: String,
        enum : ['2P','3P','4P','TEAM'],
        default: '2P',
        required:true
    },
    mapName:{ type: String, required: true },
    version:Number,
    serverVersion:{ type: String, required: true },
    patchVersion:String,
    charId:{ type: Number, required: true },
    opponents:[characterIndexSchema],
    duos:[characterIndexSchema],
    items:[characterIndexSchema],
    itembuilds:[characterIndexSchema],
    count:{ type: Number, required: true },
    wins:{ type: Number, required: true },
    scores:[characterScoreSchema],
})

const simulationEvalSchema=new mongoose.Schema({
    gameType: {
        type: String,
        enum : ['2P','3P','4P','TEAM'],
        default: '2P',
        required:true
    },
    mapName:{ type: String, required: true },
    version:Number,
    serverVersion:{ type: String, required: true },
    patchVersion:String,
    count:{ type: Number, required: true },
    averageTotalTurn:{ type: Number, required: true },
    characters:{ type: [{
        type: Schema.Types.ObjectId,
        ref: "CharacterSimulationEval"
    }], required: true },

},{timestamps:true})

const characterCommentSchema = new mongoose.Schema(
	{
		content: {
			required: true,
			type: String
		},
		charId: {
            required: true,
			type: Number
		},
		author: {
			required: true,
			type: Schema.Types.ObjectId,
			ref: "User"
		},parent: {
			type: Schema.Types.ObjectId,
			ref: "CharacterComment"
		},
		authorName: String,
		upvote: Number,
		downvote: Number,
		deleted: Boolean,
        patchVersion:String,
	},
	{ timestamps: true }
)


simulationEvalSchema.statics.create=function(data:ISimulationEval){
    return (new SimulationEval(data)).save()
}
characterEvalSchema.statics.create=function(data:ICharacterSimulationEval){
    return (new CharacterSimulationEval(data)).save()
}
characterCommentSchema.statics.create=function(data:ICharacterComment){
    return (new CharacterComment(data)).save()
}
export type ICharacterSimulationEval = InferSchemaType<typeof characterEvalSchema>;
export type ISimulationEval = InferSchemaType<typeof simulationEvalSchema>;
export type ICharacterComment = InferSchemaType<typeof characterCommentSchema>;

export const CharacterComment=mongoose.model('CharacterComment',characterCommentSchema)
export const CharacterSimulationEval=mongoose.model('CharacterSimulationEval',characterEvalSchema)
export const SimulationEval=mongoose.model('SimulationEval',simulationEvalSchema)

