import axios from "axios"
import { backend_url } from "../variables"
axios.defaults.withCredentials = true
export const AxiosApi = axios.create({ baseURL: backend_url })
