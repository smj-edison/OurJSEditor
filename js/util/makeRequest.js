export default function makeRequest(method, url, listener, options) {
    //This function is not ready to be used everywhere, yet
    //Method is a string, GET/POST, etc
    //url is a string, url
    //listener is a function to be called after the request has returned without errors. The one parameter will be the parsed object returned from the server
    //options is an object with additional settings
        //options.data is an object to be JSON-stringified and sent
        //options.action is the action that was attempting to be preformed. In the case of an error, the user will see `${options.action} failed with the error ${/*The error message from the server*/}.`
        //options.onfail will be called if the request fails
    if (typeof options === "undefined") {
        options = {};
    }
    var req = new XMLHttpRequest();
    req.addEventListener("load", function (evt) {
        //Something went wrong:
        if (this.status >= 400) {
            var contentType = this.getResponseHeader("content-type").toLowerCase();

            console.log(this.responseText);
            if (typeof options.onfail === "function") {
                options.onfail();
            }

            if (typeof options.action === "undefined") {
                options.action = "Something";
            }

            if (contentType.indexOf("json") > -1) {
                try {
                    var response = JSON.parse(this.responseText);
                    if (typeof response.success === "boolean" && !response.success) {
                        alert(options.action + " failed with the error \"" + response.error + "\"");
                    }else {
                        throw new TypeError("Incorrect `response.success`.");
                    }
                }catch (e) {
                    //This means something returned JSON, but it wasn't us. As far as I know, we never return a status >= 400 without a success: false
                    alert(options.action + " failed. And then the error handling code failed. Please report this, thanks.\n\n" + this.responseText);
                }
            }else if (contentType.indexOf("html") > -1) { //This is a server internal error
                alert(options.action + " failed with an internal server error. Please report this. If popups are enabled, an error page will be opened.");
                var errorWindow = window.open();
                errorWindow.document.open();
                errorWindow.document.write(this.responseText);
                errorWindow.document.close();
            }else {
                alert(options.action + " failed without an error message. Please report this.");
            }
        }else {
            var data = JSON.parse(this.responseText);
            console.assert(data.success, "Data returned successfully without success: true.\n" + this.responseText);
            listener(data);
        }
    });
    req.open(method, url);
    req.setRequestHeader("X-CSRFToken", csrf_token);
    req.setRequestHeader("Accept", "application/json");

    if (typeof options.data === "object") {
        req.setRequestHeader("Content-Type", "application/json");
        req.send(JSON.stringify(options.data))
    } else {
        req.send();
    }
}