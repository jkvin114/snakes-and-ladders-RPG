import mongoose, { Types,Schema} from "mongoose"

const friendSchema = new mongoose.Schema(
	{
		source: {
			required: true,
			type: mongoose.Types.ObjectId,ref:"User"
		},
        target: {
			required: true,
			type: mongoose.Types.ObjectId,ref:"User"
		}
    },{ timestamps: true })
const followSchema = new mongoose.Schema(
        {
            source: {
                required: true,
                type: mongoose.Types.ObjectId,ref:"User"
            },
            target: {
                required: true,
                type: mongoose.Types.ObjectId,ref:"User"
            }
        },{ timestamps: true })
const Friend = mongoose.model("Friend", friendSchema)
const Follow = mongoose.model("Follow", followSchema)
export {friendSchema,followSchema,Friend,Follow}
