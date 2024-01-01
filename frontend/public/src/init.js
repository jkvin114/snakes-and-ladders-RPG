const server_url = "http://localhost:5000"

var everythingLoaded = setInterval(function () {
	if (/loaded|complete/.test(document.readyState)) {
		clearInterval(everythingLoaded)
		if (main) main(server_url) // this is the function that gets called when everything is loaded
		else {
			console.error("function main() is not defined!")
		}
	}
}, 10)
