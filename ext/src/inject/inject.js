var __Cling__ = (function() {
	var __DEBUG_MODE__ = true;
	var SCROLL_INTERVAL_MS = 60;
	var ANIMATE_IN = "flipInX";
	var ANIMATE_OUT = "flipOutX";

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
		this.scrollChangeInterval = null;
		this.lastScrollPosition = -1;
		this.clinging = false;
		this.videoState = {
			"paused": false
		};
	}

	/**
	 * Initializes cling.
	 */
	Cling.prototype.init = function() {
		log("Initializing cling...");
		this.bindScrollListener(); // #todo NEXT
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
		this.uncling();
		// this.takeVideo();
	}

	Cling.prototype.cling = function() {
		if(this.clinging) {
			return;
		}
		this.clinging = true;
		this.ensureClingWindow();
		this.clingWindow.classList.remove("ext-cling-window-hidden");
		this.clingWindow.classList.add("animated");
		this.clingWindow.classList.remove(ANIMATE_OUT);
		this.clingWindow.classList.add(ANIMATE_IN);
		this.takeVideo();
	}

	Cling.prototype.uncling = function() {
		if(this.clinging && this.clingWindow) {
			this.clingWindow.classList.add("animated");
			this.clingWindow.classList.remove(ANIMATE_IN);
			this.clingWindow.classList.add(ANIMATE_OUT);
			this.releaseVideo();
		}
		this.clinging = false;
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

	Cling.prototype.findVideoElement = function() {
		return document.querySelector("video.video-stream.html5-main-video");
	}

	// #todo create HTML5 and flash version?
	Cling.prototype.commitVideoState = function() {
		if(this.videoElement) {
			this.videoState.paused = this.videoElement.paused;
		}
	}

	// #todo create HTML5 and flash version?
	Cling.prototype.restoreVideoState = function() {
		if(this.videoElement) {
			if(this.videoState.paused) {
				this.videoElement.pause();
			} else {
				this.videoElement.play();
			}
		}
	}

	Cling.prototype.takeHtml5Video = function() {
		log("Attempting to take video...");
		this.commitVideoState();
		this.ensureClingWindow();
		this.videoElement = this.findVideoElement();
		this.oldVideoParent = this.videoElement.parentElement;
		this.clingWindow.appendChild(this.videoElement);
		var _self = this;
		_self.restoreVideoState();
	}

	Cling.prototype.releaseHtml5Video = function() {
		if(this.videoElement) {
			this.commitVideoState();
			this.oldVideoParent.appendChild(this.videoElement);
			this.oldVideoParent = null;
			var _self = this;
			_self.restoreVideoState();
			this.videoElement = null;
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
		this.clingWindow.classList.add("ext-cling-window-hidden");
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

	Cling.prototype.bindScrollListener = function() {
		if(this.scrollChangeInterval) {
			clearInterval(this.scrollChangeInterval);
			this.scrollChangeInterval = null;
		}
		var _self = this;
		this.scrollChangeInterval = setInterval(function() {
			if(this.lastScrollPosition != window.scrollY) {
				this.lastScrollPosition = window.scrollY;
				_self.onScroll();
			}
		}, SCROLL_INTERVAL_MS);
	}

	Cling.prototype.unbindScrollListener = function() {
		if(this.scrollChangeInterval) {
			clearInterval(this.scrollChangeInterval);
			this.scrollChangeInterval = null;
		}
	}

	Cling.prototype.onScroll = function() {
		var video = this.findVideoElement();
		var bottom = video.offsetHeight + video.offsetTop;
		if(window.scrollY > bottom) {
			log("CLING");
			this.cling();
		} else {
			log("UNCLING");
			this.uncling();
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