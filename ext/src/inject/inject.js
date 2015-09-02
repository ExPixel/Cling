var __Cling__ = (function() {
	var __DEBUG_MODE__ = true;
	var SCROLL_INTERVAL_MS = 60;
	var ANIMATE_IN = "flipInX";
	var ANIMATE_OUT = "flipOutX";

	/**
	 * Not curl as in client side URL transfers
	 * but curl as in chrome url.
	 */
	function curl(resource) {
		return chrome.extension.getURL(resource);
	}

	var PAUSE_ICON = "url('" + curl("icons/pause_48px.png") + "')";
	var PLAY_ICON = "url('" + curl("icons/play_48px.png") + "')";


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
		this.clingWindowControls = {
			"toggleState": null,
			"clear": function() {
				this.toggleState = null;
			}
		};
		this.isFlashVideo = false;
		this.oldVideoParent = null;
		this.videoElement = null;
		this.scrollChangeInterval = null;
		this.lastScrollPosition = -1;
		this.clinging = false;
		this.allowCling = false;
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
		this.allowCling = this.isVideoPage();
		this.uncling();
		// this.takeVideo();
	}

	/**
	 * returns true if this is probably a video page.
	 */
	Cling.prototype.isVideoPage = function() {
		var url = document.createElement("a");
		url.href = window.location.href.toLowerCase();
		if(url.pathname.startsWith("/watch") && url.search.indexOf("v=")  > -1) {
			return true;
		} else {
			return false;
		}
	}

	Cling.prototype.cling = function() {
		if(this.clinging) {
			return;
		}
		if(!this.allowCling) { return; }
		this.clinging = true;
		this.ensureClingWindow();
		this.clingWindow.classList.remove("ext-cling-window-hidden");
		var clinged = this.takeVideo(true);
		if(clinged) {
			this.clingWindow.classList.add("animated");
			this.clingWindow.classList.remove(ANIMATE_OUT);
			this.clingWindow.classList.add(ANIMATE_IN);
		} else {
			this.clinging = false;
		}

		if(this.videoElement) {
			var _self = this;
			this.videoElement.addEventListener("ended", function() {
				_self.uncling();
			});
		}
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
				this.clingWindowControls.clear();
			}
		}
	}

	Cling.prototype.takeVideo = function(assertVideoNotEnded) {
		if(this.isFlashVideo) {
			log("(take) Oh no! It's the Flash!");
			return false;
		} else {
			return this.takeHtml5Video(assertVideoNotEnded);
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

	Cling.prototype.takeHtml5Video = function(assertVideoNotEnded) {
		log("Attempting to take video...");
		this.ensureClingWindow();
		this.videoElement = this.findVideoElement();
		if(this.videoElement == null || this.videoElement.ended) {
			this.videoElement = null;
			return false;
		}
		this.oldVideoParent = this.videoElement.parentElement;
		this.commitVideoState();
		this.clingWindow.appendChild(this.videoElement);
		var _self = this;
		_self.restoreVideoState();
		return true;
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

		var clingWindowToggleState = document.createElement("div");
		clingWindowToggleState.classList.add("ext-cling-control");
		clingWindowToggleState.classList.add("ext-cling-toggle-state-control");
		clingWindowToggleState.style.backgroundImage = PAUSE_ICON;
		this.clingWindow.appendChild(clingWindowToggleState);

		var _self = this;
		this.clingWindowControls.toggleState = clingWindowToggleState;
		this.clingWindowControls.toggleState.addEventListener("click", function() {
			_self.onToggleVideoState();
		});

		var ytHeader = document.getElementById("yt-masthead-container");
		if(ytHeader) {
			this.clingWindow.style.marginTop = ytHeader.offsetHeight + "px";
		}

		log("Created cling window.");
	}

	Cling.prototype.onToggleVideoState = function() {
		if(this.videoElement) {
			if(this.videoElement.paused) {
				this.videoElement.play();
			} else {
				this.videoElement.pause();
			}
		}
		this.doControls();
		log("Toggled Video State.");
	}

	Cling.prototype.doControls = function() {
		if(this.clingWindowControls) {
			if(this.clingWindowControls.toggleState) {
				if(this.videoElement) {
					if(this.videoElement.paused) {
						this.clingWindowControls.toggleState.style.backgroundImage = PLAY_ICON;
					} else {
						this.clingWindowControls.toggleState.style.backgroundImage = PAUSE_ICON;
					}
				}
			}
		}
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
		if(!this.allowCling) {return;} // speed dat scroll up.
		var video = this.findVideoElement();
		var bottom = video.offsetHeight + video.offsetTop;
		if(window.scrollY > bottom) {
			if(!this.clinging) {this.cling();}
		} else {
			if(this.clinging) {this.uncling();}
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