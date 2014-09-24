var DEBUG_MODE = false;
var PAUSE_DELAY = 0;

debug = {
	// todo think about making one function to actually pass stuff to console.log...maybe
	log: function() {
		if(!DEBUG_MODE) return;
		var __args = [];
		__args.push(arguments[0]);
		__args.push("background: #073642; color: #FFD300");
		for(var i = 1; i < arguments.length; i++) __args.push(arguments[i]);
		__args[0] = "%c[Cling] " + __args[0];
		console.log.apply(console, __args);
	},

	warn: function() {
		if(!DEBUG_MODE) return;
		var __args = [];
		__args.push(arguments[0]);
		__args.push("background: #FFD300; color: #556B2F");
		for(var i = 1; i < arguments.length; i++) __args.push(arguments[i]);
		__args[0] = "%c[Cling] " + __args[0];
		console.log.apply(console, __args);
	},

	error: function() {
		if(!DEBUG_MODE) return;
		var __args = [];
		__args.push(arguments[0]);
		__args.push("background: #D70A53; color: #FFD300");
		for(var i = 1; i < arguments.length; i++) __args.push(arguments[i]);
		__args[0] = "%c[Cling] " + __args[0];
		console.log.apply(console, __args);
	}
};

ext = new (function() {

	/**
	Regular expression used to check if the current url is a url of a video.
	*/
	this.videoLocationRegex = new RegExp("https?://(www.)?youtube.com/watch\?(.+)", "i");

	/**
	true if the user is currently on a page where they could be watching a video.
	*/
	this.watchingVideo = false;

	this.showingCling = false;

	this.initialized = false;

	/**
	Contains objects that relate to the player.
	*/
	this.player = {
		container: null,
		videoContainer: null,
		video: null,
		cling: null,

		controls: {
			playButton: null,

		},

		savedVideoInfo: {
			parent: null,
			next: null,
			oldWidth: "",
			oldHeight: ""
		},

		play_overlay: null,
		player_overlay_image: null,

		paused: false
	};

	/**
	Initializes the extension.
	*/
	this.init = function() {
		if(this.initialized) return;
		this.initialized = true;
		if(window.location.href.indexOf("/watch") != -1) {
			debug.log("This is probably a video.");
			this.watchingVideo = true;
			this.createCling();
			var self = this;
			setTimeout(function() {
				self.doBindings();
			}, 30);
			//this.doBindings();
		} else {
			debug.log("Not a video url.");
			this.watchingVideo = false;
		}

		debug.log("Extension initialized.");
	};

	/**
	Bidns the events for listening to the position of the video player.
	*/
	this.doBindings = function() {
		this.player.container = document.getElementById("player");
		this.player.videoContainer = document.getElementById("player-mole-container");

		__videoArr = this.player.container.getElementsByTagName("video");
		if(__videoArr && __videoArr.length > 0) this.player.video = __videoArr[0];

		if(this.player.container && 
			this.player.videoContainer &&
			this.player.video ) {
			debug.log("Player container and video found.")
		} else {
			debug.error("Player container and video not found!");
			return;
		}

		//this.scrollLocationCheck();

		var self = this;
		window.addEventListener('scroll', function() {
			self.scrollLocationCheck();
		});
	};

	this.scrollLocationCheck = function() {
		if(window.scrollY > this.player.container.offsetTop + this.player.container.offsetHeight) {
			this.cling();
		} else {
			this.uncling();
		}
	}

	this.createCling = function() {
		this.player.cling = document.createElement("div");
		this.player.cling.classList.add("cling-container");
		var headerBar = document.getElementById("yt-masthead-container");
		if(headerBar != null) {
			this.player.cling.style.top = (headerBar.offsetHeight + 16) + "px";
		}
		document.body.appendChild(this.player.cling);
		this.player.play_overlay = document.createElement("span");
		this.player.play_overlay.classList.add("cling-play-layer");

		this.player.player_overlay_image = document.createElement("img");
		this.player.player_overlay_image.classList.add("cling-play-image");
		this.player.player_overlay_image.src=chrome.extension.getURL("icons/arrow.svg");
		this.player.play_overlay.appendChild(this.player.player_overlay_image);

		this.player.cling.appendChild(this.player.play_overlay);
		this.player.cling.style.left = "-" + (this.player.cling.offsetWidth+16) + "px";
		debug.log("Cling container created and added to DOM.");
		
		var self = this;
		this.player.play_overlay.addEventListener("click", function() {
			self.togglePause();
		}, true);
	}

	this.updateVideoState = function() {
		if(this.player.paused) {
			debug.log("~Paused");
			this.player.video.pause();
		} else {
			debug.log("~Playing");
			this.player.video.play();
		}
	}

	this.updatePauseImageState = function() {
		if(this.player.paused) {
			this.player.player_overlay_image.style.visibility = "visible";
		} else {
			this.player.player_overlay_image.style.visibility = "hidden";
		}
	}

	this.togglePause = function() {
		this.player.paused = !this.player.paused;
		this.updateVideoState();
		this.updatePauseImageState();
	}

	this.cling = function() {
		if(this.showingCling) return;
		this.showingCling = true;
		if(this.player.cling == null) {
			this.createCling();
		}
		this.player.savedVideoInfo.parent = this.player.video.parentNode;
		this.player.savedVideoInfo.next = this.player.video.nextSibling;
		this.player.savedVideoInfo.oldWidth = this.player.video.style.width;
		this.player.savedVideoInfo.oldHeight = this.player.video.style.height;

		this.player.video.style.width = this.player.cling.style.width;
		this.player.video.style.height = this.player.cling.style.height;


		this.player.paused = this.player.video.paused;

		this.player.cling.appendChild( this.player.video );
		this.player.cling.style.left = "24px";



		var self = this;
		setTimeout(function() {
			self.updateVideoState();
		}, PAUSE_DELAY);

		this.updatePauseImageState();
	}

	this.uncling = function() {
		if(!this.showingCling) return;
		this.showingCling = false;
		if(this.player.cling) {
			this.player.cling.style.left = "-" + (this.player.cling.offsetWidth + 16) + "px";
			this.player.savedVideoInfo.parent.insertBefore(this.player.video, this.player.savedVideoInfo.next);
			var self = this;

			setTimeout(function() {
				self.updateVideoState();
			}, PAUSE_DELAY);

			// this.player.cling.style.visibility = "hidden";
		}
	}

})();

//https://www.youtube.com/watch?v=2RmSNXui2RY

function waitForDocument(fn) {
	var interval = setInterval(function() {
		if(document.readyState == "complete") {
			clearInterval(interval);
			fn();
		}
	}, 30);
}

waitForDocument(function() {
	ext.init();
});