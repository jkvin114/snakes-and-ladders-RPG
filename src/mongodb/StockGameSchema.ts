import mongoose, { InferSchemaType, Schema } from "mongoose"

/**
 * in-game transaction history
 */
const tranHistorySchema = new mongoose.Schema(
	{
		time: Number,
		type: {
			required: true,
			type: String,
			enum: ["BUY", "SELL"],
			default: "BUY",
		},
		amount: Number,
		profit:Number,
		date: String,
	},
	{ _id: false }
)

const stockGameResultSchema = new mongoose.Schema({
	score: {
		required: true,
		type: Number,
	},
	user: {
		type: Schema.Types.ObjectId,
		ref: "User",
		index:true
	},
    transactionHistory: { type: [tranHistorySchema], required: true },
    
	//metadata required to reproduce stock chart=============
	seed: {
		required: true,
		type: Number,
	},
	chartgenVersion: {
		required: true,
		type: String,
	},
    variance:{
        required: true,
		type: Number,
    }
	//==================================================
},{timestamps:true})


const stockGameBestScoreSchema = new mongoose.Schema({
    score: {
		required: true,
		type: Number
	},
    game: {
		required: true,
		type: Schema.Types.ObjectId,
		ref: "StockGameResult",
	},
	user: {
		type: Schema.Types.ObjectId,
		ref: "User",
		index:true
	},
	username:{
		type:String,
		required:true
	},
    loggedIn:{
		type:Boolean,
		required:true
	},
	isRecent:{
		type:Boolean,
		default:true,
		required:true
	}
},{timestamps:true})

stockGameBestScoreSchema.index({ score: -1 });

const StockGameResult = mongoose.model("StockGameResult", stockGameResultSchema)

type IStockGameResult = InferSchemaType<typeof stockGameResultSchema>

const StockGameBestScore = mongoose.model("StockGameBestScore", stockGameBestScoreSchema)

type IStockGameBestScore = InferSchemaType<typeof stockGameBestScoreSchema>

export {StockGameResult,IStockGameResult,StockGameBestScore,IStockGameBestScore}