var __Cling__ = (function() {
	var __DEBUG_MODE__ = true;

	function log() {
		if(__DEBUG_MODE__ && arguments.length > 0) {
			var data = ["%c[CLING] " + arguments[0], "background: #073642; color: #b58900; padding: 4px;"];
			if(arguments.length > 1) {
				var idx = 1, len = arguments.length;
				for(idx; idx < len; idx++) {
					data.push(arguments[idx]);
				}
			}
			console.log.apply(console, data);
		}
	}

	function Cling() {
		this.urlChangeInterval = null;
		this.currentURL = null;
		this.clingWindow = null;
		this.isFlashVideo = false;
		this.oldVideoParent = null;
		this.videoElement = null;
	}

	/**
	 * Initializes cling.
	 */
	Cling.prototype.init = function() {
		log("Initializing cling...");
		this.bindURLChange();
	}

	/**
	 * Binds event listener for URL change.
	 */
	Cling.prototype.bindURLChange = function() {
		if(this.urlChangeInterval !== null) clearInterval(this.urlChangeInterval);
		var _self = this;
		this.urlChangeInterval = setInterval(function() {
			if(_self.currentURL != window.location.href) {
				_self.currentURL = window.location.href;
				_self.onURLChange();
			}
		}, 200);
		log("Cling events bound.");
	}

	/**
	 * Called when the URL has changed and cling should clean up.
	 */
	Cling.prototype.onURLChange = function() {
		log("URL changed: %s", this.currentURL);
		this.takeVideo();
	}

	/**
	 * Destroys the cling window.
	 */
	Cling.prototype.destroyWindow = function() {
		if(this.clingWindow) {
			if(this.clingWindow.parentElement) {
				this.clingWindow.parentElement.removeChild(this.clingWindow);
				this.clingWindow = null;
			}
		}
	}

	Cling.prototype.takeVideo = function() {
		if(this.isFlashVideo) {
			log("(take) Oh no! It's the Flash!");
		} else {
			this.takeHtml5Video();
		}
	}

	Cling.prototype.releaseVideo = function() {
		if(this.isFlashVideo) {
			log("(release) Oh no! It's the Flash!");
		} else {
			this.releaseHtml5Video();
		}
	}

	Cling.prototype.takeHtml5Video = function() {
		log("Attempting to take video...");
		this.ensureClingWindow();
		this.videoElement = document.querySelector("video.video-stream.html5-main-video");
		this.oldVideoParent = this.videoElement.parentElement;
		this.clingWindow.appendChild(this.videoElement);
	}

	Cling.prototype.releaseHtml5Video = function() {
		if(this.videoElement) {
			this.oldVideoParent.appendChild(this.videoElement);
			this.videoElement = null;
			this.oldVideoParent = null;
		}
	}

	/**
	 * Creates the cling window.
	 */
	Cling.prototype.createClingWindow = function() {
		if(this.clingWindow) {
			tihs.destroyWindow();
		}
		this.clingWindow = document.createElement("div");
		this.clingWindow.classList.add("ext-cling-window");
		document.body.appendChild(this.clingWindow);

		var ytHeader = document.getElementById("yt-masthead-container");
		if(ytHeader) {
			this.clingWindow.style.marginTop = ytHeader.offsetHeight + "px";
		}

		log("Created cling window.");
	}

	/**
	 * This method will create a cling window if one does no exist.
	 */
	Cling.prototype.ensureClingWindow = function() {
		if(!this.clingWindow) {
			this.createClingWindow();
		}
	}

	return Cling;
})();

(function() {
	var cling = new __Cling__();
	var readyStateCheckInterval = setInterval(function() {
		if(document.readyState === "complete") {
			clearInterval(readyStateCheckInterval);
			cling.init();
		}
	}, 10);
})();