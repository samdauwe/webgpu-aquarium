
/**
 * A Module with various io functions.
 */
export class IO {

    /**
     * Loads text from an external file. This function is synchronous.
     * @param {string} url The url of the external file.
     * @return {string} the loaded text if the request is synchronous.
     */
    public static LoadTextFileSynchronous(url: string): string {
        const error: string = 'LoadTextFileSynchronous failed to load url "' + url + '"';
        let xhr: XMLHttpRequest = null;
        if (window.XMLHttpRequest) {
            xhr = new XMLHttpRequest();
            if (xhr.overrideMimeType) {
                xhr.overrideMimeType('text/plain');
            }
        } else {
            throw 'XMLHttpRequest is disabled';
        }
        xhr.open('GET', url, false);
        xhr.send(null);
        if (xhr.readyState != 4) {
            throw error;
        }
        return xhr.responseText;
    }

    /**
     * Loads text from an external file. This function is asynchronous.
     * @param {string} url The url of the external file.
     * @param {function(string, *): void} callback A callback passed the loaded
     *     string and an exception which will be null on success.
     */
    public static LoadTextFile(url: string, callback: (result: string, errorMsg: string) => void): void {
        const error: string = 'LoadTextFile failed to load url "' + url + '"';
        let xhr: XMLHttpRequest = null;
        if (window.XMLHttpRequest) {
            xhr = new XMLHttpRequest();
            if (xhr.overrideMimeType) {
                xhr.overrideMimeType('text/plain; charset=utf-8');
            } 
        } else {
            throw 'XMLHttpRequest is disabled';
        }
        xhr.open('GET', url, true);
        xhr.onreadystatechange = function() {
            if (xhr.readyState == 4) {
                let text = '';
                // HTTP reports success with a 200 status. The file protocol reports
                // success with zero. HTTP does not use zero as a status code (they
                // start at 100).
                // https://developer.mozilla.org/En/Using_XMLHttpRequest
                let success = xhr.status == 200 || xhr.status == 0;
                if (success) {
                    text = xhr.responseText;
                }
                callback(text, success ? null : 'could not load: ' + url);
            }
        };
        xhr.send(null);
    }

    /**
     * Loads a file from an external file. This function is asynchronous.
     * @param {string} url The url of the external file.
     * @param {function(string, *): void} callback A callback passed the loaded
     *     ArrayBuffer and an exception which will be null on success.
     */
    public static LoadArrayBuffer(url: string, callback: (result: ArrayBuffer, errorMsg: string) => void): void {
        const error: string = 'LoadArrayBuffer failed to load url "' + url + '"';
        let xhr: XMLHttpRequest = null;
        if (window.XMLHttpRequest) {
            xhr = new XMLHttpRequest();
        } else {
            throw 'XMLHttpRequest is disabled';
        }
        xhr.open('GET', url, true);
        xhr.onreadystatechange = function() {
            if (xhr.readyState == 4) {
                let arrayBuffer: ArrayBuffer = undefined;
                let success = xhr.status == 200 || xhr.status == 0;
                if (success) {
                    arrayBuffer = xhr.response;
                }
                callback(arrayBuffer, success ? null : 'could not load: ' + url);
            }
        };
        if (xhr.responseType === undefined) {
            throw 'no support for binary files';
        }
        xhr.responseType = "arraybuffer";
        xhr.send(null);
    }

    /**
     * Loads JSON from an external file. This function is asynchronous.
     * @param {string} url The url of the external file.
     * @param {function(jsonObject, *): void} callback A callback passed the loaded
     *     json and an exception which will be null on success.
     */
    public static LoadJSON(url: string, callback: (result: any, errorMsg: string) => void): void {
        const error: string = 'LoadJSON failed to load url "' + url + '"';
        let xhr: XMLHttpRequest = null;
        if (window.XMLHttpRequest) {
            xhr = new XMLHttpRequest();
            if (xhr.overrideMimeType) {
                xhr.overrideMimeType('text/plain; charset=utf-8');
            } 
        } else {
            throw 'XMLHttpRequest is disabled';
        }
        xhr.open('GET', url, true);
        xhr.onreadystatechange = function() {
            if (xhr.readyState == 4) {
                let json: JSON = undefined;
                let success = xhr.status == 200 || xhr.status == 0;
                if (success) {
                    try {
                        json = JSON.parse(xhr.responseText);
                    } catch (e) {
                        success = false;
                    }
                }
                callback(json, success ? null : 'could not load: ' + url);
            }
        };
        xhr.send(null);
    }

}
