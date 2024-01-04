const server_url = "http://localhost:5000"
let AxiosApi = {
	get: () => {},
	post: () => {},
}

var everythingLoaded = setInterval(function () {
	if (/loaded|complete/.test(document.readyState)) {
		clearInterval(everythingLoaded)
		try {
			axios.defaults.withCredentials = true
			AxiosApi = axios.create({ baseURL: server_url })

			if (main) main(server_url) // this is the function that gets called when everything is loaded
		} catch (e) {
			console.error(e)
			console.error("function main() is not defined!")
			throw Error("function main() is not defined!   " + e)
		}
	}
}, 10)
