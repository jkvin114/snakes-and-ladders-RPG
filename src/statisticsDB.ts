import mongoose from "mongoose"
require('dotenv').config({path:__dirname+'/variables.env'})


console.log("connecting to mongodb ")
try{
    mongoose.connect(process.env.MONGODB_URL)
}
catch(e){
    console.log('mongodb Connection Failed!');
}

var db=mongoose.connection



db.on('error', function(){
    console.log('Connection Failed!');
});
// 5. 연결 성공
db.once('open', function() {
    console.log('Connected to mongodb!');
});

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
    stats:[Number],
    kda:[Number],
    items:[Number],
    bestMultiKill:Number,
    positionRecord:[Number],
    moneyRecord:[Number],
    itemRecord:[itemRecordSchema],

});
const killRecordSchema=new mongoose.Schema({
    killer:Number,
    dead:Number,
    pos:Number,
    turn:Number
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
    killRecord:[killRecordSchema]

},{timestamps:true})

const simulationRecordSchema=new mongoose.Schema({
    stat:[gameRecordSchema],
    count:Number,
    multiple:Boolean,
    map:Number

},{timestamps:true})

const testSubSchema=new mongoose.Schema({
    name:String
})
const testschema=new mongoose.Schema({
    name:String,
    turn:Number,
    sub:testSubSchema
})
const Test=mongoose.model('Test',testschema)
const GameRecord=mongoose.model('GameRecord',gameRecordSchema)
const SimulationRecord=mongoose.model('SimulationRecord',simulationRecordSchema)
gameRecordSchema.statics.create = function (payload) {
    // this === Model
    return (new GameRecord(payload)).save();// return Promise
  };
testschema.statics.create=function(data){
    return (new Test(data)).save()
}
simulationRecordSchema.statics.create=function(data){
    return (new SimulationRecord(data)).save()
}
export {GameRecord,Test,SimulationRecord}

