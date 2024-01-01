const server_url = "http://localhost:5000"

var everythingLoaded = setInterval(function () {
	if (/loaded|complete/.test(document.readyState)) {
		clearInterval(everythingLoaded)
		try {
			if (main) main(server_url) // this is the function that gets called when everything is loaded
		} catch (e) {
			console.error("function main() is not defined!")
			throw Error("function main() is not defined!")
		}
	}
}, 10)
