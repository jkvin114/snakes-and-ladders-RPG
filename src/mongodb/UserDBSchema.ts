
import mongoose from "mongoose";
//=============================================================================================
export const userSchema=new mongoose.Schema({
    username:{ type: String, required: true,index:true },
    email:{ type: String, required: true },
    password:{ type: String, required: true },
    salt:{ type: String, required: true },
    simulations:[mongoose.Types.ObjectId],
    role:String,
    boardData:{
        type:mongoose.Types.ObjectId,ref:"UserBoardData"
    },
    friends:[{
        //depricated
        type:mongoose.Types.ObjectId,ref:"User"
    }],
    follows:[{
         //depricated
        type:mongoose.Types.ObjectId,ref:"User"
    }],
    profileImgDir:String,
    lastActive:Number //last active timestamp in ms
},{timestamps:true})


//====================================================================================================

userSchema.statics.create=function(data){
    return (new User(data)).save()
}
userSchema.statics.findAllSummary = function() {
    return this.find({}).select('profileImgDir username email')
};
userSchema.statics.findAllSummaryByIdList = function(id: mongoose.Types.ObjectId[]) {
    return this.find({ _id:{$in:id}}).select('profileImgDir username email')
};
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
userSchema.statics.updateProfileImage = function(id,imgdir) {
    return this.findByIdAndUpdate(id,{profileImgDir:imgdir})
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

userSchema.statics.addFriend = function(id,userId) {
    return this.findByIdAndUpdate(id, { $addToSet: { friends: userId } })
};
userSchema.statics.deleteFriend = function(id,userId) {
    return this.findByIdAndUpdate(id, { $pull: { friends: userId } })
};
userSchema.statics.addFollow = function(id,userId) {
    return this.findByIdAndUpdate(id, { $addToSet: { follows: userId } })
};
userSchema.statics.deleteFollow = function(id,userId) {
    return this.findByIdAndUpdate(id, { $pull: { follows: userId } })
};
export const User=mongoose.model('User',userSchema)
