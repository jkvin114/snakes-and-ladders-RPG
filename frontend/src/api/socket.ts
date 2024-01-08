import { io } from 'socket.io-client';
import { backend_url } from "../variables"

export const socket = io(backend_url,
    {
        autoConnect: true,
        withCredentials: true
        
      });

