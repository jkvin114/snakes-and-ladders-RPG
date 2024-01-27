import { registerItems } from "./Marble/ItemRegistry";
import StartGRPCServer from "./grpc";
import { Logger } from "./logger";

Logger.log("start")
registerItems()
StartGRPCServer()