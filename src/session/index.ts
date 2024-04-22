import ISessionManager from "./ISessionManager";
import { InMemorySession } from "./inMemorySession";

export const SessionManager:ISessionManager = InMemorySession.getInstance()