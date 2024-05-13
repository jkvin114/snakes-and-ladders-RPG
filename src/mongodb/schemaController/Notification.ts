import type { Types } from "mongoose"
import { INotification, Notification } from "../NotificationSchema"
import { MongoId } from "../types"

export namespace NotificationSchema {
	export enum TYPE {
		Empty = "EMPTY",
		Other = "OTHER",
		Chat = "CHAT",
		Comment = "COMMENT",
		Reply = "REPLY",
		Post = "POST",
		FriendRequest = "FRIEND_REQUEST",
		StockGameSurpass = "STOCKGAME_SURPASS",
		GameInvite = "GAME_INVITE",
		NewFollower = "NEW_FOLLOWER",
	}
	//locale id for toast messages
	const TOAST_MESSAGE_LOCALE_ID = {
		StockGameSurpass: "StockGameSurpass",
		GameInvite: "GameInvite",
		FriendRequest: "FriendRequest",
        NewFollower:"NewFollower"
	}

	export const create = function (data: INotification) {
		return new Notification(data).save()
	}
	export const findById = function (id: Types.ObjectId | string) {
		return Notification.findById(id)
	}
	export const findAll = function (receiver: Types.ObjectId | string) {
		return Notification.find({ receiver: receiver }).sort({ createdAt: "desc" })
	}
	export const findUnaccessed = function (receiver: Types.ObjectId | string) {
		return Notification.find({ receiver: receiver, accessed: false }).sort({ createdAt: "desc" })
	}
	/**
	 * set all non-accessed notification to accessed
	 * @param receiver
	 */
	export const setAccessed = function (receiver: Types.ObjectId | string) {
		Notification.updateMany({ receiver: receiver, accessed: false }, { accessed: true }).then()
	}
	export const deleteById = function (id: Types.ObjectId | string) {
		return Notification.findByIdAndDelete(id)
	}
	export const createTest = function (message: string, receiver: Types.ObjectId | string) {
		return new Notification({
			receiver: receiver,
			type: TYPE.Empty,
			message: message,
		}).save()
	}
	export async function stockGameSurpass(receiver: MongoId, playerName: string, score: number) {
		return new Notification({
			receiver: receiver,
			type: TYPE.StockGameSurpass,
			message: TOAST_MESSAGE_LOCALE_ID.StockGameSurpass,
			payload1: playerName,
			payload2: score,
		}).save()
	}
	export async function gameInvite(receiver: MongoId, senderName: string, roomId: string, type: string) {
		return new Notification({
			receiver: receiver,
			type: TYPE.GameInvite,
			message: TOAST_MESSAGE_LOCALE_ID.GameInvite,
			payload1: senderName,
			payload2: roomId,
			payload3: type,
		}).save()
	}
	/**
	 * delete previous notifications
	 * @param receiver
	 * @param roomId
	 * @returns
	 */
	export async function deleteGameInvite(receiver: MongoId, roomId: string) {
		return Notification.deleteMany({
			receiver: receiver,
			type: TYPE.GameInvite,
			payload2: String(roomId),
		})
	}
	export const newChat = async function (
		receiver: Types.ObjectId | string,
		roomId: Types.ObjectId | string,
		message: string,
		serial: number,
		sendername: string,
		senderProfile: string
	) {
		return new Notification({
			receiver: receiver,
			type: TYPE.Chat,
			message: message,
			payload1: String(roomId),
			payload2: serial,
			payload3: sendername,
			payload4: senderProfile,
		}).save()
	}
	/**
	 * delete previous notifications
	 */
	export const deleteChat = function (receiver: Types.ObjectId | string, roomId: Types.ObjectId | string) {
		//delete previous notifications
		return Notification.deleteMany({
			receiver: receiver,
			type: TYPE.Chat,
			payload1: String(roomId),
		})
	}

	export const newPost = function (receiver: MongoId, authorName: string, postUrl: string, content: string) {
		return new Notification({
			receiver: receiver,
			type: TYPE.Post,
			message: content,
			payload1: postUrl,
			payload2: authorName,
		}).save()
	}

	export const newComment = function (
		receiver: MongoId,
		authorName: string,
		postUrl: string,
		commentId: string,
		postTitle: string,
		content: string
	) {
		return new Notification({
			receiver: receiver,
			type: TYPE.Comment,
			message: content,
			payload1: postUrl,
			payload2: commentId,
			payload3: authorName,
			payload4: postTitle,
		}).save()
	}

	export const newReply = function (
		receiver: MongoId,
		authorName: string,
		commentId: string,
		replyId: string,
		commentContent: string,
		content: string
	) {
		return new Notification({
			receiver: receiver,
			type: TYPE.Reply,
			message: content,
			payload1: commentId,
			payload2: replyId,
			payload3: authorName,
			payload4: commentContent,
		}).save()
	}

	export const friendRequest = function (receiver: MongoId,senderId:string, senderName: string) {
		return new Notification({
			receiver: receiver,
			type: TYPE.FriendRequest,
			message: TOAST_MESSAGE_LOCALE_ID.FriendRequest,
            payload1:senderId,
			payload2: senderName,
		}).save()
	}
    
	/**
	 * delete previous notifications
	 */
    export const deleteFriendRequest = function (receiver: MongoId,senderId:string) {
		return Notification.deleteMany({
			receiver: receiver,
			type: TYPE.FriendRequest,
            payload1:senderId,
		})
	}


    export const newFollower = function (receiver: MongoId, followerName: string) {
		return new Notification({
			receiver: receiver,
			type: TYPE.NewFollower,
			message: TOAST_MESSAGE_LOCALE_ID.NewFollower,
			payload1: followerName,
		}).save()
	}
}
