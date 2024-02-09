export interface INotification{
    createdAt?:string
    message?:string
    url?:string
    type:string
    read:boolean
    payload1:any
    payload2:any
    payload3:any
    payload4:any
    payload5:any
    _id:string
}
export enum NOTI_TYPE{
    Empty='EMPTY',
    Other="OTHER",
    Chat='CHAT',
    Comment="COMMENT",
    Reply="REPLY",
    Post='POST',
    FriendRequest='FRIEND_REQUEST',
    StockGameSurpass="STOCKGAME_SURPASS",
    GameInvite="GAME_INVITE",
    NewFollower = "NEW_FOLLOWER"
}