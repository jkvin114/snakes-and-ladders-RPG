import { INotification } from "../mongodb/NotificationSchema"
import { NotificationSchema } from "../mongodb/schemaController/Notification"
import { sleep } from "../RPGGame/core/Util"
import { NotificationCache } from "../cache"
import { MongoId } from "../mongodb/types"
import { NotificationMuteSchema } from "../mongodb/schemaController/NotificationMute"

export namespace NotificationController {
	const POLL_PERIOD = 5 * 1000
	const MAX_TIMEOUT = 60

	export function addToCache(userId: MongoId) {
		NotificationCache.post(userId).then()
	}

	function isMuted(receiver: MongoId, type: NotificationSchema.TYPE) {
		return NotificationMuteSchema.isMuted(receiver, type)
	}

	export async function notifyChat(
		receiver: string,
		room: string,
		message: string,
		serial: number,
		sendername: string,
		senderProfile: string
	) {
		if (await isMuted(receiver, NotificationSchema.TYPE.Chat)) return
		await NotificationSchema.deleteChat(receiver, room)
		await NotificationSchema.newChat(receiver, room, message, serial, sendername, senderProfile)
		addToCache(receiver)
	}
	export async function gameInvite(receiver: MongoId, senderName: string, roomId: string, type: string) {
		await NotificationSchema.deleteGameInvite(receiver, roomId)
		await NotificationSchema.gameInvite(receiver, senderName, roomId, type)
		addToCache(receiver)
	}
	export async function stockGameSurpass(receiver: MongoId, playerName: string, score: number) {
		if (await isMuted(receiver, NotificationSchema.TYPE.StockGameSurpass)) return
		await NotificationSchema.stockGameSurpass(receiver, playerName, score)
		addToCache(receiver)
	}

	export async function sendFriendRequest(receiver: MongoId, senderId: MongoId, senderName: string) {
		let sender = String(senderId)
		if (String(receiver) === sender) return
        

		await NotificationSchema.deleteFriendRequest(receiver, sender)
		await NotificationSchema.friendRequest(receiver, sender, senderName)
		addToCache(receiver)
	}
	export function deleteFriendRequest(receiver: MongoId, senderId: MongoId) {
		return NotificationSchema.deleteFriendRequest(receiver, String(senderId))
	}
	export async function notifyFollow(receiver: MongoId, followerName: string) {
		if (await isMuted(receiver, NotificationSchema.TYPE.NewFollower)) return

		addToCache(receiver)
		return NotificationSchema.newFollower(receiver, followerName)
	}
	export async function notifyNewPost(receiver: MongoId, authorName: string, postUrl: string, content: string) {
		if (await isMuted(receiver, NotificationSchema.TYPE.Post)) return

		addToCache(receiver)
		return NotificationSchema.newPost(receiver, authorName, postUrl, content)
	}
	export async function notifyNewComment(
		receiver: MongoId,
		authorName: string,
		postUrl: string,
		commentId: string,
		postTitle: string,
		content: string
	) {
		if (await isMuted(receiver, NotificationSchema.TYPE.Comment)) return

		addToCache(receiver)
		return NotificationSchema.newComment(receiver, authorName, postUrl, commentId, postTitle, content)
	}

	export async function notifyNewReply(
		receiver: MongoId,
		authorName: string,
		commentId: string,
		replyId: string,
		commentContent: string,
		content: string
	) {
		if (await isMuted(receiver, NotificationSchema.TYPE.Reply)) return

		addToCache(receiver)
		return NotificationSchema.newComment(receiver, authorName, commentId, replyId, commentContent, content)
	}

	export const poll = async function (receiver: MongoId) {
		let notis: INotification[] = []

		for (let i = 0; i < MAX_TIMEOUT; i++) {
			if (await NotificationCache.consume(receiver)) {
				notis = await NotificationSchema.findUnaccessed(receiver)
				break
			}
			await sleep(POLL_PERIOD)
		}

		if (notis.length > 0) NotificationSchema.setAccessed(receiver)
		return notis
	}
}
