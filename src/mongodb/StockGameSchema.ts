import mongoose, { InferSchemaType, Schema } from "mongoose"

/**
 * in-game transaction history
 */
const tranHistorySchema = new mongoose.Schema(
	{
		time: Number, //tick pos number
		type: {
			required: true,
			type: String,
			enum: ["BUY", "SELL"],
			default: "BUY",
		},
		price:Number,  //share price
		amount: Number, //share count 
		profit:Number, 
		date: String, //displayed date
	},
	{ _id: false }
)

const stockGameResultSchema = new mongoose.Schema({
	score: {
		required: true,
		type: Number,
	},
	initialMoney:Number,
    finaltotal:Number,
	user: {
		type: Schema.Types.ObjectId,
		ref: "User",
		index:true
	},
    transactionHistory: { type: [tranHistorySchema], required: true },
    delistAt:Number,

	//metadata required to reproduce stock chart=============
	seed: {
		required: true,
		type: String,
	},
	chartgenVersion: {
		required: true,
		type: String,
	},
    variance:{
        required: true,
		type: Number,
    },
	scale:{
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
stockGameResultSchema.index({ score: -1 });

const userStockGameDataSchema = new mongoose.Schema({
	user: {
		type: Schema.Types.ObjectId,
		ref: "User",
		required:true
	},
	totalGames:{
		type:Number,
		required:true,
		default:0
	}
})


const StockGameUser = mongoose.model("StockGameUser", userStockGameDataSchema)

type IStockGameUser = InferSchemaType<typeof userStockGameDataSchema>

const StockGameResult = mongoose.model("StockGameResult", stockGameResultSchema)

type IStockGameResult = InferSchemaType<typeof stockGameResultSchema>

const StockGameBestScore = mongoose.model("StockGameBestScore", stockGameBestScoreSchema)

type IStockGameBestScore = InferSchemaType<typeof stockGameBestScoreSchema>

export {StockGameResult,IStockGameResult,StockGameBestScore,IStockGameBestScore,StockGameUser,IStockGameUser}