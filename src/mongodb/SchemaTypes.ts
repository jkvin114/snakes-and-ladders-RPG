import { InferSchemaType } from "mongoose";
import { userBoardDataSchema,articleSchema, commentSchema,commentReplySchema } from "./BoardDBSchemas";
import { followSchema, friendSchema } from "./UserRelationDBSchema";
import { marbleGameRecordSchema } from "./MarbleGameSchema";

export namespace SchemaTypes{
	export type UserBoardData = InferSchemaType<typeof userBoardDataSchema>;
	export type Article = InferSchemaType<typeof articleSchema>;
    export type Comment = InferSchemaType<typeof commentSchema>;
    export type CommentReply = InferSchemaType<typeof commentReplySchema>;
    export type Friend = InferSchemaType<typeof friendSchema>;
    export type Follow = InferSchemaType<typeof followSchema>;
    export type MarbleGameRecord = InferSchemaType<typeof marbleGameRecordSchema>;
}