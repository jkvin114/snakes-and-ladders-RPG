import mongoose from "mongoose"
require('dotenv').config({path:__dirname+'/../../config/variables.env'})
import CONFIG from "./../../config/config.json"


console.log("connecting to mongodb ")
try{
    if(CONFIG.localDB && process.env.MONGODB_URL_LOCAL){
        mongoose.connect(process.env.MONGODB_URL_LOCAL)
    }
    else
        mongoose.connect(process.env.MONGODB_URL)
}
catch(e){
    console.log('mongodb Connection Failed!');
}

const db=mongoose.connection

db.on('error', function(){
    console.log('Connection Failed!');
});
// 5. 연결 성공
db.once('open', function() {
    console.log('Connected to mongodb!');
});
//=============================================================================================
const itemRecordSchema=new mongoose.Schema({
    item_id:Number,
    count:Number,
    turn:Number
}, { _id : false })

// 6. Schema 생성. (혹시 스키마에 대한 개념이 없다면, 입력될 데이터의 타입이 정의된 DB 설계도 라고 생각하면 됩니다.)
const playerSchema = new mongoose.Schema({
    name : { type: String, required: true },
    champ : { type: String, required: true },
    champ_id : { type: Number, required: true },
    turn:{ type: Number, required: true },
    team:Boolean,
    stats:[Number],
    kda:[Number],
    items:[Number],
    bestMultiKill:Number,
    positionRecord:[Number],
    moneyRecord:[Number],
    itemRecord:[itemRecordSchema],
    kill:Number,
    death:Number,
    assist:Number

});
const killRecordSchema=new mongoose.Schema({
    killer:Number,
    dead:Number,
    pos:Number,
    turn:Number
}, { _id : false })

const gameSettingSchema=new mongoose.Schema({
    name:String,
    value:mongoose.Schema.Types.Mixed
}, { _id : false })

const simulationSettingSchema=new mongoose.Schema({
    name:String,
    value:mongoose.Schema.Types.Mixed
}, { _id : false })
const gameRecordSchema=new mongoose.Schema({
    players:{ type: [playerSchema], required: true },
    totalturn: Number,
    version:Number,
    isTeam: Boolean,
    map_data:{
        name:String,
        respawn:[Number],
        finish:Number
    },
    killRecord:[killRecordSchema],
    setting:[gameSettingSchema],
    replay:mongoose.Types.ObjectId
},{timestamps:true})

const simulationRecordSchema=new mongoose.Schema({
    stat:[gameRecordSchema],
    count:Number,
    multiple:Boolean,
    version:String,
    setting:[simulationSettingSchema]
},{timestamps:true})

//=============================================================================================
const simplePlayerSchema=new mongoose.Schema({
    rank:Number,
    turn:Number,
    champ_id:Number,
    kill:Number,
    death:Number,
    Assist:Number,
    team:Boolean
}, { _id : false })

const simpleGameRecordSchema=new mongoose.Schema({
    players:{ type: [simplePlayerSchema], required: true },
    totalturn: Number,
    isTeam: Boolean,
    map:String
}, { _id : false })

const simpleSimulationRecordSchema=new mongoose.Schema({
    stat:[simpleGameRecordSchema],
    count:Number,
    serverVersion:String,
    setting:[simulationSettingSchema],
    simulation:String,
    runner:String
},{timestamps:true})

//=============================================================================================
const userSchema=new mongoose.Schema({
    username:{ type: String, required: true },
    email:{ type: String, required: true },
    password:{ type: String, required: true },
    salt:{ type: String, required: true },
    simulations:[mongoose.Types.ObjectId],
    boardData:{
        type:mongoose.Types.ObjectId,ref:"UserBoardData"
    },
    friends:[{
        type:mongoose.Types.ObjectId,ref:"User"
    }],
    follows:[{
        type:mongoose.Types.ObjectId,ref:"User"
    }],
    
},{timestamps:true})


const testSubSchema=new mongoose.Schema({
    name:String
})
const testschema=new mongoose.Schema({
    name:String,
    turn:Number,
    sub:testSubSchema
})
const marbleItemPresetSchema=new mongoose.Schema({
    name:{ type: String, required: true },
    items:[{ type: Number, required: true }],
    randomCount:{ type: Number, required: true }
},{timestamps:true})


//=============================================================================================
testschema.statics.create=function(data){
    return (new Test(data)).save()
}
//=============================================================================================
marbleItemPresetSchema.statics.create=function(data){
    return (new MarbleItemPreset(data)).save()
}
marbleItemPresetSchema.statics.findAll = function() {
    return this.find({}).sort({createdAt:"desc"})
};
//====================================================================================================
simulationRecordSchema.statics.create=function(data){
    return (new SimulationRecord(data)).save()
}

simulationRecordSchema.statics.findOneById = function(id) {
    return this.findById(id)
};
simulationRecordSchema.statics.findSummaryByRange = function(start:number,count:number) {
 //   console.log(count)    //asc, desc  or 1, -1
    return this.find({}).sort({createdAt:"desc"}).skip(start).limit(count).select("createdAt count setting")
};

//====================================================================================================
simpleSimulationRecordSchema.statics.create=function(data){
    return (new SimpleSimulationRecord(data)).save()
}

simpleSimulationRecordSchema.statics.findOneById = function(id) {
    return this.findById(id)
};
simpleSimulationRecordSchema.statics.findByRange = function(start:number,count:number) {

    return this.find({}).sort({createdAt:"desc"}).skip(start).limit(count)
};
simpleSimulationRecordSchema.statics.findByRangeAndVersion = function(start:number,count:number,version:string) {

    return this.find({serverVersion:version}).sort({createdAt:"desc"}).skip(start).limit(count)
};
//====================================================================================================


gameRecordSchema.statics.create = function (payload) {
    // this === Model
    return (new GameRecord(payload)).save();// return Promise
  };
gameRecordSchema.statics.findByRange = function(start:number,count:number) {
    console.log(count)    //asc, desc  or 1, -1
    return this.find({}).sort({createdAt:"desc"}).skip(start).limit(count)
};
gameRecordSchema.statics.findOneById = function(id) {

    return this.findById(id)
};
//====================================================================================================

userSchema.statics.create=function(data){
    return (new User(data)).save()
}
userSchema.statics.findOneByUsername = function(username) {
    return this.findOne({username:username})
};
userSchema.statics.findIdByUsername = function(username) {
    return this.findOne({username:username}).select('_id')
};
userSchema.statics.findUsernameById = function(id) {
    return this.findById(id).select('username')
};
userSchema.statics.getBoardData = function(id) {
    return this.findById(id).select('boardData')
};
userSchema.statics.getBoardDataPopulated = function(id) {
    return this.findById(id).select('boardData').populate("boardData")
};

userSchema.statics.deleteOneById = function(id) {
    return this.findByIdAndDelete(id)
};
//change password
userSchema.statics.updatePassword = function(id,password,salt) {
    return this.findByIdAndUpdate(id,{password:password,salt:salt})
};
//change email
userSchema.statics.updateEmail = function(id,email) {
    return this.findByIdAndUpdate(id,{email:email})
};
//add link to the simulation record
userSchema.statics.addSimulationId = function(id,sim_id) {
    return this.findByIdAndUpdate(id,{ $push: { simulations: sim_id}})
};
userSchema.statics.setBoardData = function(id,boardData) {
    return this.findByIdAndUpdate(id,{ boardData:boardData})
};

//=============================================================================================
const Test=mongoose.model('Test',testschema)
const MarbleItemPreset=mongoose.model('MarbleItemPreset',marbleItemPresetSchema)

const GameRecord=mongoose.model('GameRecord',gameRecordSchema)
const SimulationRecord=mongoose.model('SimulationRecord',simulationRecordSchema)
const SimpleSimulationRecord=mongoose.model('SimpleSimulationRecord',simpleSimulationRecordSchema)
const User=mongoose.model('User',userSchema)

export {GameRecord,Test,SimulationRecord,User,SimpleSimulationRecord,MarbleItemPreset}

