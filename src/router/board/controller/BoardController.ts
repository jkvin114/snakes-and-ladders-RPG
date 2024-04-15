import mongoose from "mongoose"
import { ISession } from "../../../session/inMemorySession"
import { SchemaTypes } from "../../../mongodb/SchemaTypes"
import { PostSchema } from "../../../mongodb/schemaController/Post"
import { UserSchema } from "../../../mongodb/schemaController/User"
import { UserBoardDataSchema } from "../../../mongodb/schemaController/UserData"
import { COUNT_PER_PAGE, renderEjs } from "../helpers"
import type { Request, Response } from "express"

export namespace BoardController {
	export async function allPost(req: Request, res: Response, session: ISession) {
		let start = 0
		let count = COUNT_PER_PAGE
		if (req.query.start) {
			start = Math.max(0, Number(req.query.start))
		}
		let total =await PostSchema.countDocuments({$or:[{visibility:{ $exists: false}},{visibility:"PUBLIC"}]})
		let data: SchemaTypes.Article[] = await PostSchema.findPublicSummaryByRange(start, count)
		//data=await filterPostSummary(req.session,data,false)

		renderEjs(res, "postlist", {
			displayType: "all",
			posts: data,
			logined: session.isLogined,
			user: null,
			count: count,
			start: start,
			isEnd: start + count >= total,
		})
	}

    export async function addBookmark(req: Request, res: Response, session: ISession) {
		const boardDataId = await UserSchema.getBoardData(session.userId)
		if(!boardDataId) return
		const bookmarks = await UserBoardDataSchema.getBookmarks(boardDataId)
		if(!bookmarks) {
			return
		}
		if(bookmarks.bookmarks.some((id:any)=>String(id)===req.body.id)){
			await UserBoardDataSchema.removeBookmark(boardDataId,req.body.id)
			res.status(200).json({ change: -1 })
		}
		else{
			await UserBoardDataSchema.addBookmark(boardDataId,req.body.id)
			res.status(200).json({ change: 1 })
		}
    }


}
