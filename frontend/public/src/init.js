// const server_url = "http://192.168.0.3:5000"
let AxiosApi = {
	get: () => {
		throw Error("Axios api is not initialized")
	},
	post: () => {
		throw Error("Axios api is not initialized")
	},
}
/**
 * axios throws error when status code is >= 300
 */

var everythingLoaded = setInterval(function () {
	if (/loaded|complete/.test(document.readyState)) {
		try {
			if (!axios || !server_url) return
			axios.defaults.withCredentials = true
			AxiosApi = axios.create({ baseURL: server_url })

			if (main) {
				console.log("run main script")
				main(server_url) // this is the function that gets called when everything is loaded
				clearInterval(everythingLoaded)
			}
		} catch (e) {
			console.error(e)
			console.error("function main() is not defined!")
			throw Error("function main() is not defined!   " + e)
		}
	}
}, 100)
