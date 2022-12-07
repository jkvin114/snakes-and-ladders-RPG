import { InferSchemaType } from "mongoose";
import { userBoardDataSchema,articleSchema, commentSchema,commentReplySchema } from "./BoardDBSchemas";

export namespace SchemaTypes{
	export type UserBoardData = InferSchemaType<typeof userBoardDataSchema>;
	export type Article = InferSchemaType<typeof articleSchema>;
    export type Comment = InferSchemaType<typeof commentSchema>;
    export type CommentReply = InferSchemaType<typeof commentReplySchema>;

}