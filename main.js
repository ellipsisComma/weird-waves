/*jshint esversion: 6*/

/*
SCRIPT CONTROLS: an interface to change the app's behaviour (only really useful if running your own)
PARAMETERS: internal parameters (probably don't need to be changed)
FUNCTIONS
	UTILITY: general and misc. applications	
	PLAYLIST: building and altering the playlist
	SHOWS: adding, moving, removing, and loading shows
	RADIO: audio interface
	SETTINGS: changing settings and displaying the results
	PAGE CONSTRUCTION: building page sections and content (e.g. the archive)
EVENTS: event listeners
ARCHIVE: an object with every source and show in the Archive
*/

/*
Known issues (not major):
 > if a playlist with one item is loaded from localStorage, the show is loaded into the radio twice (once by addShow() for being added to an empty playlist and once at the end of updatePlaylist(), which is called on pageload and loads the show if (among other conditions) the original playlist had no items on it
*/




/* ====================
	SCRIPT CONTROLS
==================== */

// relative path of the show audio folder, favicon, and Weird Waves button folder
const paths = {
	"show": "./audio/shows/",
	"button": "./images/buttons/",
	"favicon": "./images/favicons/"
};

// initialised settings from storage and set default values if not set
const settings = window.localStorage.getItem("settings") ? JSON.parse(window.localStorage.getItem("settings")) : {};
settings.copyrightSafety ??= false;
settings.flatRadio ??= false;
settings.autoPlayNextShow ??= true;
settings.notesOpen ??= false;

// options for theme, font etc., with displayed names and underlying codes
const styleOptions = {
	"themes": [
		{	"name": "Dark",		"code": "dark"		},
		{	"name": "Goop",		"code": "goop"		},
		{	"name": "Flame",	"code": "flame"		},
		{	"name": "Plasm",	"code": "plasm"		},
		{	"name": "Moss",		"code": "moss"		},
		{	"name": "Darker",	"code": "darker"	},
		{	"name": "Light",	"code": "light"		},
		{	"name": "Wine",		"code": "wine"		},
		{	"name": "Ash",		"code": "ash"		},
		{	"name": "Dust",		"code": "dust"		},
		{	"name": "Mist",		"code": "mist"		},
		{	"name": "Silver",	"code": "silver"	}
	],
	"fonts": [
		{	"name": "Serif",	"code": "serif"	},
		{	"name": "Sans",		"code": "sans"	}
	]
};

// nav link names, codes, and optionally href (if not the code) and HTML attributes
const navLinks = {
	"activity": [
		{	"name": "Booth", 			"code": "booth"		},
		{	"name": "Archive", 			"code": "archive"	},
		{	"name": '<abbr title="Really Simple Syndication">RSS</abbr>', "code": "rss", "href": "./feed.rss", "attrs": {"type": "application/rss+xml"}	}
	],
	"info": [
		{	"name": "About", 			"code": "about"		},
		{	"name": "Streaming", 		"code": "streaming"	},
		{	"name": "Settings", 		"code": "settings"	}
	],
	"external": [
		{	"name": "Call In", 			"code": "call-in"	},
		{	"name": "Links", 			"code": "links"		},
		{	"name": "Credits", 			"code": "credits"	}
	]
};



/* ===============
	PARAMETERS
=============== */

// HTML elements (or templated HTML elements) and their IDs
const page = {
	// head
	"title": document.querySelector("title"),
	"SVGFavicon": document.querySelector('[rel~="icon"][href$=".svg"]'),
	"icoFavicon": document.querySelector('[href$=".ico"]'),

	// radio
	"loadedShow": "loaded-show",
	"controls": "controls",
	"seekBar": "seek-bar",
	"showTimeElapsed": "show-time-elapsed",
	"showTimeTotal": "show-time-total",
	"playButton": "play-button",
	"skipButton": "skip-button",
	"muteButton": "mute-button",
	"volumeControl": "volume-control",
	"audio": "show-audio",

	// nav
	"nav": document.querySelector("nav"),

	// booth
	"playlist": "playlist",
	"playlistControls": "playlist-controls",
	"clearButton": "clear-button",
	"clearPlaylistControls": "clear-playlist-controls",
	"importExport": "import-export-data",
	"importErrorMessage": "import-error-message",

	// archive
	"seriesList": "series-list",

	// settings
	"themeButtons": "theme-buttons",
	"fontButtons": "font-buttons",

	// links
	"weirdWavesButtonPNG": "weird-waves-button-png",
	"weirdWavesButtonSVG": "weird-waves-button-svg"
},
templateHTML = {
	"navLink": "nav-link",
	"showPositionControls": "show-position-controls",
	"invalidIDsImportErrorMessage": "invalid-ids-import-error-message",
	"toggle": "toggle",
	"themeButton": "theme-button",
	"fontButton": "font-button"
};

for (const [ref, element] of Object.entries(page)) if (typeof element === "string") page[ref] = document.getElementById(element);
for (const [ref, element] of Object.entries(templateHTML)) templateHTML[ref] = document.getElementById(element + "-template");

// prepare playlist show IDs from storage (if there are any)
let playlistIDs = window.localStorage.getItem("playlist") ? JSON.parse(window.localStorage.getItem("playlist")) : [];

// sets of show IDs to select from when adding random shows to playlist
const showIDSets = {
	"all": {"safe": [], "any": []},
	"bangers": {"safe": [], "any": []},
	"series": {}
};

let updateTimeInterval;



/* ==============
	FUNCTIONS
============== */

/* ----
UTILITY
---- */

// add an object of attributes to an Element (excluding class for practical reasons)
Element.prototype.setAttributes = function (attrs) {
	for (const [attr, value] of Object.entries(attrs)) this.setAttribute(attr, value);
}

// remove an array of attributes from an Element
Element.prototype.removeAttributes = function (attrs) {
	for (const attr of attrs) this.removeAttribute(attr);
}

// set a string to be an HTML element's innerHTML or textContent depending on whether it includes HTML entities or possible HTML tags
HTMLElement.prototype.setContent = function (text) {
	if (text.match(/&#?\w+;/) || text.match(/<[a-z]|<\w+>|\/>|<\//)) this.innerHTML = text;
	else this.textContent = text;
}

// pad single-digit second or minute numbers with a leading 0
function padTime(timeNum) {
	return (timeNum < 10) ? "0" + timeNum : String(timeNum);
}

// take in a time in seconds (can be a non-integer) and output a timestamp in minutes and seconds
function setTimestampFromSeconds(element, time) {
	const minutes = padTime(Math.floor((time % 3600) / 60)),
	seconds = padTime(Math.floor(time % 60));

	element.innerText = minutes + ":" + seconds;
	element.setAttribute("datetime", "00:" + minutes + ":" + seconds);
}

/* -------
NAVIGATION
------- */

// update title and currently-marked nav-link depending on hash
function navigateToSection() {
	// find section that hash target is or is inside (use querySelector, not getElementById, because it can directly take window.location.hash instead of having to remove #)
	const section = document.querySelector(window.location.hash)?.closest("#page-sections > *");

	// if the targeted section exists, switch aria-current to target's nav-link and update title accordingly, else return to default page title
	if (section) {
		const navLink = document.querySelector('nav [href="#' + section.id + '"]');
		document.querySelector('[aria-current="page"]')?.removeAttribute("aria-current");
		document.title = navLink.innerText + " / " + page.title.dataset.original;
		navLink.setAttribute("aria-current", "page");
	} else document.title = page.title.dataset.original;
}

/* -----
PLAYLIST
----- */

// reorder HTML playlist following playlist object (show IDs)
function reorderPlaylist() {
	for (const id of playlistIDs) page.playlist.appendChild(page.playlist.querySelector('[data-id="' + id + '"]'));
}

// import playlist from textarea contents (after trimming start, interior, and ending newlines), or empty the array if textarea is empty; load the top show and pause it to update play/pause button state; if any invalid show IDs present in textarea lines, display error message instead
function updatePlaylist(oldIDs, newIDs) {
	const addedIDs = newIDs.filter(id => !oldIDs.includes(id)),
	removedIDs = oldIDs.filter(id => !newIDs.includes(id)),
	invalidIDs = newIDs.filter(id => !document.getElementById(id));

	// if attempting to import 1+ invalid IDs, list invalid IDs in error message and abort
	if (invalidIDs.length > 0) {
		clearImportErrors();
		page.importExport.value = newIDs.join("\n");
		page.importErrorMessage.appendChild(templateHTML.invalidIDsImportErrorMessage.content.cloneNode(true));
		const invalidIDsList = page.importErrorMessage.querySelector("ul");
		for (const ID of invalidIDs) invalidIDsList.appendChild(document.createElement("li")).textContent = ID;
		page.importErrorMessage.scrollIntoView();
		return;
	}

	for (const id of addedIDs) addShow(id);
	for (const id of removedIDs) removeShow(id);

	playlistIDs = newIDs;
	reorderPlaylist();
	page.importExport.value = "";
	clearImportErrors();

	if ((playlistIDs.length > 0 && oldIDs[0] !== playlistIDs[0]) || oldIDs.length === 0) loadShow();
}

// shuffle playlist if it has at least 2 entries, then load top show (if it's different after shuffling)
function shufflePlaylist() {
	if (playlistIDs.length <= 1) return;

	const originalLoadedID = page.playlist.firstElementChild.dataset.id;
	let i = playlistIDs.length;

	while (i > 0) {
		const r = Math.floor(Math.random() * i--);
		if (r < i) [playlistIDs[r], playlistIDs[i]] = [playlistIDs[i], playlistIDs[r]];
	}
	reorderPlaylist();

	if (playlistIDs[0] !== originalLoadedID) loadShow();
}

// reveal controls for clearing playlist
function revealClearPlaylistControls() {
	pressButton(page.clearButton);
	page.clearPlaylistControls.removeAttribute("hidden");
	page.clearPlaylistControls.focus();
}

// hide controls for clearing playlist
function hideClearPlaylistControls() {
	unpressButton(page.clearButton);
	page.clearPlaylistControls.setAttribute("hidden", "");
}

// clear playlist and hide clear controls again, then load show (i.e. nothing)
function clearPlaylist() {
	for (const id of playlistIDs) unpressButton(document.querySelector('#' + id + ' [data-action="add-show"]'));
	playlistIDs = [];
	page.playlist.replaceChildren();
	hideClearPlaylistControls();
	loadShow();
}

// list playlist of show IDs line-by-line in import-export box
function exportPlaylist() {
	page.importExport.value = playlistIDs.join("\n");
}

// remove content of import error message
function clearImportErrors() {
	page.importErrorMessage.textContent = "";
	page.importErrorMessage.replaceChildren();
}

// import playlist from textbox
function importPlaylist() {
	if (page.importExport.value.trim() !== "") updatePlaylist(playlistIDs, page.importExport.value.replace(/\n\n+/g,"\n").replace(/ /g,"").trim().split("\n"));
	else page.importErrorMessage.textContent = "Invalid import: no show IDs.";
}

/* --
SHOWS
-- */

/* ADDING */

// add show to playlist; if playlist was previously empty, load top show
function addShow(id) {
	if (playlistIDs.includes(id)) {
		const originalIndex = playlistIDs.indexOf(id);
		playlistIDs.splice(originalIndex, 1);

		if (page.playlist.querySelector('[data-id="' + id + '"]')) {
			page.playlist.appendChild(page.playlist.children[originalIndex]);
			playlistIDs.push(id);
			console.log("re-added show: " + id);
			if (originalIndex === 0) loadShow();
			return;
		}
	}
	playlistIDs.push(id);

	// find show and series in archive
	const showInArchive = document.getElementById(id),
	seriesInArchive = document.getElementById("archive-" + id.split("-")[0]);

	// build new show element and clone in show position controls and show content
	const newShow = page.playlist.appendChild(document.createElement("li"));
	newShow.appendChild(templateHTML.showPositionControls.content.cloneNode(true));
	for (const button of newShow.querySelectorAll("button")) button.dataset.target = id;
	newShow.appendChild(showInArchive.querySelector(".show-info").cloneNode(true));

	// transfer remaining show info
	const newShowHeading = newShow.querySelector(".show-heading");
	newShowHeading.innerHTML = seriesInArchive.querySelector(".series-heading").innerHTML + " " + newShowHeading.innerHTML;
	newShow.querySelector(".show-content").appendChild(seriesInArchive.querySelector(".series-source").cloneNode(true));
	newShow.setAttributes({
		"data-id": id,
		"data-duration": showInArchive.dataset.duration
	});

	// add show to playlist in booth and mark as added in archive
	page.playlist.appendChild(newShow);
	pressButton(showInArchive.querySelector('[data-action="add-show"]'));

	// update show info and elements for playlist
	console.log("added show: " + id);

	if (page.playlist.children.length === 1) loadShow();
}

// add entire archive to playlist
function addArchive() {
	updatePlaylist(playlistIDs, settings.copyrightSafety ? showIDSets.all.safe : showIDSets.all.any);
}

// add entire series to playlist
function addSeries(seriesCode) {
	const seriesIDs = [];
	for (const showCode of showIDSets.series[seriesCode]) seriesIDs.push(seriesCode + "-" + showCode);
	updatePlaylist(playlistIDs, [...playlistIDs.filter(id => !seriesIDs.includes(id)), ...seriesIDs]);
}

// add a random show or banger to the playlist; if adding a show to an empty playlist, load it into radio
function addRandomShow(showType = "all") {
	const pool = showIDSets[showType][settings.copyrightSafety ? "safe" : "any"],
	id = pool[Math.floor(Math.random() * pool.length)];

	addShow(id);

	window.scrollTo(0, page.playlist.lastElementChild.offsetTop - page.playlistControls.clientHeight);
}

/* MANIPULATING */

// move show up/down in playlist; if the first show on the playlist was moved, load the new top show
function moveShow(id, move) {
	const index = playlistIDs.indexOf(id),
	target = page.playlist.children[index],
	swap = page.playlist.children[index + move];

	[playlistIDs[index], playlistIDs[index + move]] = [playlistIDs[index + move], playlistIDs[index]];
	if (move > 0) target.before(swap);
	else swap.before(target);

	if (index === 0 || index + move === 0) loadShow();
}

// remove show from playlist in object and HTML and update import-export text accordingly; if the first show on the playlist was removed, load the new top show
function removeShow(id) {
	const index = playlistIDs.indexOf(id);

	page.playlist.children[index]?.remove();
	playlistIDs.splice(index, 1);
	unpressButton(document.querySelector("#" + id + ' [data-action="add-show"]'));

	console.log("removed show: " + id);

	if (index === 0) loadShow();
}

// write show parts onto page and load show audio file; if playlist is empty, remove audio and show content and hide controls
function loadShow() {
	pauseAudio();
	page.loadedShow.replaceChildren();

	if (playlistIDs.length > 0) {
		const show = page.playlist.firstElementChild;

		page.audio.src = paths.show + show.dataset.id + ".mp3";
		page.audio.setAttribute("data-duration", show.dataset.duration);

		const loadedShowHeading = page.loadedShow.appendChild(document.createElement("h2"));
		loadedShowHeading.classList.add("show-heading");
		loadedShowHeading.innerHTML = show.querySelector(".show-heading").innerHTML;
		page.loadedShow.appendChild(show.querySelector(".show-content").cloneNode(true));
		page.controls.removeAttribute("hidden");

		seekTime(0);
		page.seekBar.value = 0;
		setTimestampFromSeconds(page.showTimeTotal, page.audio.dataset.duration);

		console.log("loaded show: " + show.dataset.id);
	} else {
		page.audio.removeAttribute("src");
		page.controls.setAttribute("hidden", "");

		console.log("reached end of playlist");
	}
}

// replace loaded show with next show on playlist, or empty-playlist message if none
function loadNextShow() {
	removeShow(page.playlist.children[0].dataset.id);
	page.seekBar.value = 0;

	if (page.audio.hasAttribute("src") && settings.autoPlayNextShow) playAudio();
}

/* --
RADIO
-- */

// if audio is playing, update seek bar and time-elapsed
function updateSeekBar() {
	if (!page.audio.paused) {
		page.seekBar.value = page.audio.currentTime / page.audio.dataset.duration * 100;
		setTimestampFromSeconds(page.showTimeElapsed, page.audio.currentTime);
	}
}

// set audio position using seek bar
function goToAudioPosition(value) {
	page.audio.currentTime = page.audio.dataset.duration * value / 100;
}

// update displayed show time using seek bar
function seekTime(value) {
	setTimestampFromSeconds(page.showTimeElapsed, page.audio.dataset.duration * value / 100);
}

// play audio
function playAudio() {
	page.audio.play();
	page.playButton.querySelector("use").setAttribute("href", "#svg-pause");
	updateTimeInterval = setInterval(updateSeekBar, 1000);
}

// pause audio
function pauseAudio() {
	updateSeekBar(); // otherwise if the audio's paused after less than a second of play, seek bar doesn't update
	page.audio.pause();
	page.playButton.querySelector("use").setAttribute("href", "#svg-play");
	clearInterval(updateTimeInterval);
}

// play/pause audio when play/pause button is pushed
function playPauseAudio() {
	if (page.audio.paused) playAudio();
	else pauseAudio();
}

// mute/unmute audio
function muteUnmuteAudio() {
	if (page.audio.muted) {
		page.audio.muted = false;
		page.muteButton.querySelector("use").setAttribute("href", "#svg-mute");
		page.volumeControl.value = page.audio.volume * 100;
	} else {
		page.audio.muted = true;
		page.muteButton.querySelector("use").setAttribute("href", "#svg-unmute");
		page.volumeControl.value = 0;
	}
}

// set audio volume
function setVolume(newVolume) {
	page.audio.volume = newVolume;
	if (page.audio.muted) muteUnmuteAudio();
}

/* -----
SETTINGS
----- */

// initialise a toggle switch with a stored or default value
function initialiseToggle(id, toggled) {
	document.getElementById(id).setAttribute("aria-pressed", toggled ? "true" : "false");
}

// switch a toggle from off/unpressed to on/pressed
function switchToggle(id, key, value) {
	const button = document.getElementById(id + "-toggle");

	button.setAttribute("aria-pressed", button.getAttribute("aria-pressed") === "false" ? "true" : "false");

	settings[key] = value;
}

// toggle between excluding (true) and including (false) copyright-unsafe material when adding random shows to playlist
function toggleCopyrightSafety() {
	settings.copyrightSafety = !settings.copyrightSafety;
	switchToggle("copyright-safety", "copyrightSafety", settings.copyrightSafety);
}

// toggle between hiding and showing show-content in Radio
function toggleFlatRadio() {
	settings.flatRadio = !settings.flatRadio;
	switchToggle("flat-radio", "flatRadio", settings.flatRadio);

	page.loadedShow.classList.toggle("flat-radio", settings.flatRadio);
}

// toggle between auto-playing (true) and not (false) a newly-loaded show when the previous show ends
function toggleAutoPlay() {
	settings.autoPlayNextShow = !settings.autoPlayNextShow;
	switchToggle("auto-play", "autoPlayNextShow", settings.autoPlayNextShow);
}

// toggle between open (true) and closed (false) show content notes
function toggleContentNotes() {
	settings.notesOpen = !settings.notesOpen;
	switchToggle("content-notes", "notesOpen", settings.notesOpen);

	document.querySelectorAll(".content-notes").forEach(notes => notes.toggleAttribute("open", settings.notesOpen));
}

// set a button's state to unpressed
function unpressButton(button) {
	button?.setAttribute("aria-pressed", "false");
	button?.removeAttribute("disabled");
}

// set a button's state to pressed
function pressButton(button) {
	button?.setAttributes({
		"aria-pressed": "true",
		"disabled": ""
	});
}

// update setting and setting buttons according to chosen value
function updateSetting(setting, value) {
	unpressButton(page[setting + "Buttons"].querySelector("[data-" + setting + '="' + styles[setting] + '"]'));
	pressButton(page[setting + "Buttons"].querySelector("[data-" + setting + '="' + value + '"]'));

	document.body.classList.replace(setting + "-" + styles[setting], setting + "-" + value);
	styles[setting] = value;
}

// switch between different colour themes
function switchTheme(theme) {
	updateSetting("theme", theme);

	page.SVGFavicon.href = paths.favicon + theme + "/favicon.svg";
	page.icoFavicon.href = paths.favicon + theme + "/favicon.ico";

	updateSiteButtons();
}

// switch between different fonts
function switchFont(font) {
	updateSetting("font", font);

	updateSiteButtons();
}

// function update weird waves site buttons
function updateSiteButtons() {
	page.weirdWavesButtonPNG.src = paths.button + styles.font + "/" + styles.theme + "/weird-waves-button.png";
	page.weirdWavesButtonSVG.src = paths.button + styles.font + "/" + styles.theme + "/weird-waves-button.svg";
}

/* --------------
PAGE CONSTRUCTION
-------------- */

// build nav menu
function buildNavLinks() {
	for (const [section, links] of Object.entries(navLinks)) {
		const list = document.createElement("ul");
		list.id = section + "-sections";

		for (const link of links) {
			list.appendChild(templateHTML.navLink.content.cloneNode(true));
			newLink = list.lastElementChild.firstElementChild;

			newLink.href = link.href ?? "#" + link.code;
			newLink.setAttributes(link.attrs ?? {});
			newLink.querySelector("use").setAttribute("href", "#svg-" + link.code);
			newLink.querySelector("span").setContent(link.name);
		}

		page.nav.appendChild(list);
	}

	document.getElementById("loading-spinner-nav")?.remove();
	page.nav.removeAttribute("hidden");
}

// build archive onto page
function buildArchive() {
	const stats = {
		"series": archive.length,
		"shows": 0,
		"duration": 0
	};
	let archiveHTML = "",
	archiveLinksHTML = "";

	for (const series of archive) {
		stats.shows += series.shows.length;
		showIDSets.series[series.code] = [];

		archiveLinksHTML += '<li><a href="#archive-' + series.code + '">' + series.heading + '</a></li>';

		archiveHTML += '<li id="archive-' + series.code + '"><header>' +
'<h3 class="series-heading">' + series.heading + '</h3><div class="series-content">' +
series.blurb +
'<p class="series-source">source: ' + series.source + '</p></div>' +
'<button class="push-button" type="button" data-target="' + series.code + '" data-action="add-series">Add series to playlist</button>' +
'</header><ol class="show-list">';

		for (const show of series.shows) {
			stats.duration += show.duration;

			const id = series.code + "-" + show.code,
			copyrightCategory = series.copyrightSafe ? "safe" : "unsafe";

			showIDSets.all.any.push(id);
			if (series.copyrightSafe) showIDSets.all.safe.push(id);
			if (show.banger) showIDSets.bangers.any.push(id);
			if (series.copyrightSafe && show.banger) showIDSets.bangers.safe.push(id);
			showIDSets.series[series.code].push(show.code);

			archiveHTML += '<li id="' + id + '" data-duration="' + show.duration + '"><div class="show-info">' +
'<h4 class="show-heading">' + show.heading + '</h4>' +
'<div class="show-content">' + show.blurb;
			if (show.notes) archiveHTML += '<details class="content-notes"' + (settings.notesOpen ? ' open' : "") + "><summary>Content notes </summary>" + show.notes + '</details>';
			archiveHTML += "</div></div>" +
'<button class="push-button" type="button" data-target="' + id + '" data-action="add-show" aria-pressed="false">Add to playlist</button></li>';
		}

		archiveHTML += '</ol></li>';
	}

	// render archive links and archive, then add delegated click-events for add-series and open all content notes if user setting applies
	document.getElementById("archive-series-links").innerHTML = archiveLinksHTML;
	page.seriesList.innerHTML = archiveHTML;
	page.seriesList.addEventListener("click", (event) => {
		if (!event.target.getAttribute("disabled")) {
			switch (event.target.dataset.action) {
			case "add-series": addSeries(event.target.dataset.target); break;
			case "add-show": addShow(event.target.dataset.target); break;
			}
		}
	});

	document.getElementById("loading-spinner-archive")?.remove();
	document.getElementById("archive-contents").removeAttribute("hidden");

// add series stats to stats-list
	document.getElementById("loading-spinner-stats")?.remove();
	document.getElementById("stats-sources").textContent = stats.series;
	document.getElementById("stats-shows").textContent = stats.shows;
	document.getElementById("stats-duration").textContent = Math.round(stats.duration / 3600);
}

// build toggle switches
function buildToggles() {
	for (const toggle of document.querySelectorAll(".toggle")) {
		const label = toggle.innerHTML;
		toggle.replaceChildren(templateHTML.toggle.content.cloneNode(true));
		toggle.lastElementChild.setContent(label);
	}
}

// build out theme buttons with names, codes, and demo palettes
function buildThemeButtons() {
	const colours = ["fore", "back", "hot", "cold"];
	for (const theme of styleOptions.themes) {
		page.themeButtons.appendChild(templateHTML.themeButton.content.cloneNode(true));

		const button = page.themeButtons.lastElementChild.querySelector("button");
		button.setAttribute("data-theme", theme.code);
		button.lastElementChild.setContent(theme.name);

		button.querySelector(".palette").classList.add("theme-" + theme.code);
	}
	document.getElementById("loading-spinner-theme-buttons")?.remove();
	page.themeButtons.removeAttribute("hidden");
}

// build out font buttons with names, codes, and font displays
function buildFontButtons() {
	for (const font of styleOptions.fonts) {
		page.fontButtons.appendChild(templateHTML.fontButton.content.cloneNode(true));
		const button = page.fontButtons.lastElementChild.querySelector("button");
		button.classList.add("font-" + font.code);
		button.setAttribute("data-font", font.code);
		button.setContent(font.name);
	}
	document.getElementById("loading-spinner-font-buttons")?.remove();
	page.fontButtons.removeAttribute("hidden");
}



/* ===========
	EVENTS
=========== */

// nav events
window.addEventListener("hashchange", navigateToSection);

// radio audio events
page.audio.addEventListener("ended", loadNextShow);

// radio interface events
page.seekBar.addEventListener("change", () => {
	goToAudioPosition(page.seekBar.value);
	updateTimeInterval = setInterval(updateSeekBar, 1000);
});
page.seekBar.addEventListener("input", () => {
	seekTime(page.seekBar.value);
	clearInterval(updateTimeInterval);
});
page.playButton.addEventListener("click", playPauseAudio);
page.skipButton.addEventListener("click", loadNextShow);
page.muteButton.addEventListener("click", muteUnmuteAudio);
page.volumeControl.addEventListener("input", () => setVolume(page.volumeControl.value / 100));

// playlist interface events
document.getElementById("random-show-button").addEventListener("click", () => addRandomShow());
document.getElementById("random-banger-button").addEventListener("click", () => addRandomShow("bangers"));
document.getElementById("shuffle-button").addEventListener("click", shufflePlaylist);
page.clearButton.addEventListener("click", revealClearPlaylistControls);
document.getElementById("clear-cancel-button").addEventListener("click", hideClearPlaylistControls);
document.getElementById("clear-confirm-button").addEventListener("click", clearPlaylist);
page.playlist.addEventListener("click", (event) => {
	switch (event.target.dataset.action) {
	case "move-up": moveShow(event.target.dataset.target, -1); break;
	case "remove": removeShow(event.target.dataset.target); break;
	case "move-down": moveShow(event.target.dataset.target, 1); break;
	}
});
document.getElementById("export-button").addEventListener("click", exportPlaylist);
document.getElementById("import-button").addEventListener("click", importPlaylist);

// archive interface events (excluding those dependent on the archive HTML being generated beforehand)
document.getElementById("add-archive-button").addEventListener("click", addArchive);

// settings interface events (general)
document.getElementById("copyright-safety-toggle").addEventListener("click", toggleCopyrightSafety);
document.getElementById("flat-radio-toggle").addEventListener("click", toggleFlatRadio);
document.getElementById("auto-play-toggle").addEventListener("click", toggleAutoPlay);
document.getElementById("content-notes-toggle").addEventListener("click", toggleContentNotes);

// settings interface events (styling)
page.themeButtons.addEventListener("click", (event) => {
	if (event.target.tagName === "BUTTON" && !event.target.getAttribute("disabled")) switchTheme(event.target.dataset.theme);
});
page.fontButtons.addEventListener("click", (event) => {
	if (event.target.tagName === "BUTTON" && !event.target.getAttribute("disabled")) switchFont(event.target.dataset.font);
});

// on pageload, execute various tasks
document.addEventListener("DOMContentLoaded", () => {
	// build various semi-static page sections
	buildNavLinks();
	buildArchive();
	buildToggles();
	buildThemeButtons();
	buildFontButtons();

	// import playlist
	if (playlistIDs.length > 0) {
		if (playlistIDs[0].split("-").length === 2) playlistIDs.length = 0; // deletes playlist if stored playlist has any old-style show IDs
		else updatePlaylist([], playlistIDs);
		console.log("loaded playlist from storage");
	}
	document.getElementById("loading-spinner-booth")?.remove();
	document.getElementById("booth-contents").removeAttribute("hidden");

	// initialise radio, settings, and styles
	page.seekBar.value = 0;
	initialiseToggle("copyright-safety-toggle", settings.copyrightSafety);
	initialiseToggle("flat-radio-toggle", settings.flatRadio);
	initialiseToggle("auto-play-toggle", settings.autoPlayNextShow);
	initialiseToggle("content-notes-toggle", settings.notesOpen);
	switchTheme(styles.theme);
	switchFont(styles.font);
	page.loadedShow.classList.toggle("flat-radio", settings.flatRadio);

	// update page head data
	page.title.setAttribute("data-original", document.title);
	if (window.location.hash) navigateToSection();

	// clear out setup variables
	archive.length = 0;
	for (const key of Object.keys(styleOptions)) delete styleOptions[key];
	for (const key of Object.keys(navLinks)) delete navLinks[key];

/* ----------------
POLYFILL FOR :HAS()
---------------- */

	// build alternate set of links
	function buildAltArchiveSeriesLinks() {
		const links = document.querySelectorAll("#archive-series-links a");

		for (let i = 0; i < links.length; i++) {
			links[i].setAttribute("data-series", links[i].href.split("-")[1]);
			links[i].href = "#archive";
			links[i].addEventListener("click", () => setTimeout(scrollToSeries, 1, links[i].dataset.series));

			page.seriesList.children[i].setAttribute("tabindex", "0");
		}
	}

	// scroll to a series when clicking its link in the archive series nav list
	function scrollToSeries(series) {
		document.getElementById("archive-" + series).focus();
		document.getElementById("archive-" + series).scrollIntoView(true);
	}

	// if browser doesn't support :has(:target) selector, replace series links with old hack
	if (!CSS.supports("selector(:has(:target))")) buildAltArchiveSeriesLinks();
});

// on closing window/browser tab, record user settings and styles to localStorage
window.addEventListener("unload", () => {
	window.localStorage.setItem("playlist", JSON.stringify(playlistIDs));
	window.localStorage.setItem("settings", JSON.stringify(settings));
	window.localStorage.setItem("styles", JSON.stringify(styles));
});



/* ============
	ARCHIVE
============ */

const archive = [
{
"code": "ByM",
"heading": "<cite>Beyond Midnight</cite>",
"blurb": "<p>A 1968&ndash;70 anthology of supernatural dramas and horror stories adapted by the writer Michael McCabe and broadcast by the first commercial radio station in South Africa: Springbok Radio.</p>",
"source": "<a href=\"https://radioechoes.com/?page=series&genre=OTR-Thriller&series=Beyond%20Midnight\" rel=\"external\">Radio Echoes</a>",
"copyrightSafe": true,
"shows": [
	{
	"code": "13-Lanceford",
	"heading": "#13: <cite>Lanceford House</cite><!--episode name on Radio Echoes is incorrect-->",
	"blurb": "<p>A writer seeking solitude moves to a country house and discovers a malign force obsessed with an ugly green vase. Adapted from a story by Dennis Roidt.</p>",
	"duration": 1671
	},
	{
	"code": "20-Dream",
	"heading": "#20: <cite>The Dream</cite>",
	"blurb": "<p>A physicist suffers recurring nightmares of being hunted by sinister warriors outside an ancient city. Adapted from a story by Basil Copper.</p>",
	"notes": "institutionalisation, racism",
	"duration": 1729
	},
	{
	"code": "41-Return",
	"heading": "#41: <cite>The Happy Return</cite>",
	"blurb": "<p>A man's fiancée is lost at sea; months later he finds the wreck, its calendar set to that very day. Adapted from a story by William Hope Hodgson.</p>",
	"duration": 1677
	}
]
},
{
"code": "BC",
"heading": "<cite>The Black Chapel</cite>",
"blurb": "<p>A 1937&ndash;39 horror anthology hosted and narrated by the insane organist of a derelict church (played by Ted Osbourne); only two episodes survive.</p>",
"source": "<a href=\"https://www.radioechoes.com/?page=series&genre=OTR-Thriller&series=The%20Black%20Chapel\" rel=\"external\">Radio Echoes</a>",
"copyrightSafe": true,
"shows": [
	{
	"code": "X-Coffin",
	"heading": "#X: <cite>The Mahogany Coffin</cite>",
	"blurb": "<p>A gravedigger makes lavish preparations for his own burial&hellip; and an unlikely graveyard friend of his takes ghoulish revenge when a rival thwarts his plans.</p>",
	"notes": "entombment",
	"duration": 819,
	"banger": true
	}
]
},
{
"code": "BkM",
"heading": "<cite>The Black Mass</cite>",
"blurb": "<p>A 1963&ndash;67 anthology of mostly gothic and cosmic horror stories adapted for radio, largely performed by Erik Bauersfeld.</p>",
"source": "<a href=\"https://www.kpfahistory.info/black_mass_home.html\" rel=\"external\"><abbr title=\"Pacifica Radio\">KPFA</abbr> History</a><!--the site of John Whiting, technical producer-->",
"copyrightSafe": true,
"shows": [
	{
	"code": "01-Hallows",
	"heading": "#1: <cite>All Hallows</cite>",
	"blurb": "<p>A traveller meets a verger in a derelict cathedral that the Christian believes is being invaded by evil. Adapted from a story by Walter de la Mare.</p>",
	"duration": 2355
	},
	{
	"code": "02-Ash",
	"heading": "#2: <cite>The Ash Tree</cite>",
	"blurb": "<p>A monstrous ash tree bears a terrible secret&mdash;when the &ldquo;witch&rdquo; who tends it is hanged, its &ldquo;curse&rdquo; falls on her accusers. Adapted from a story by M.&thinsp;R.&thinsp;James.</p>",
	"notes": "execution, spiders",
	"duration": 1821
	},
	{
	"code": "04-Nightmare",
	"heading": "#4: <cite>Nightmare</cite>",
	"blurb": "<p>A paranoid man recounts how the helpful Dr. Fraser cured his illness, only to replace it with something much worse. Adapted from a story by Alan Wykes.</p>",
	"notes": "institutionalisation, public mockery",
	"duration": 1646
	},
	{
	"code": "07-Oil",
	"heading": "#7: <cite>Oil of Dog</cite>",
	"blurb": "<p>A young man helps his father make <i>dog oil</i> and his mother dispose of <i>unwanted babies</i>&mdash;and combines his duties to disastrous effect. Adapted from a story by Ambrose Bierce.</p>",
	"notes": "animal abuse, infanticide, kidnapping, murder-suicide",
	"duration": 793,
	"banger": true
	},
	{
	"code": "08-Halpin",
	"heading": "#8: <cite>The Death of Halpin Frayser</cite>",
	"blurb": "<p>Halpin Frayser wakes from dream and dies with the name Catherine LaRue on his lips. He was murdered. But how? Adapted from a story by Ambrose Bierce.</p>",
	"notes": "becoming lost, gore, domestic abuse, incest, strangulation, torture",
	"duration": 1868
	},
	{
	"code": "09-House",
	"heading": "#9: <cite>A Haunted House</cite>",
	"blurb": "<p>A house is haunted by the memory of the lovers who lived there. Adapted from a story by Virginia Woolf.</p>",
	"duration": 597
	},
	{
	"code": "11-Predicament_Heart",
	"heading": "#11: <cite>A Predicament</cite> and <cite>The Tell-Tale Heart</cite>",
	"blurb": "<p>A murderer hears his victim's still-beating heart. A wealthy woman finds herself in a&hellip; predicament. Adapted from stories by Edgar Allen Poe.</p>",
	"notes": "animal death, gore, obsession",
	"duration": 1763
	},
	{
	"code": "12-Disillusionment_Feeder",
	"heading": "#12: <cite>Disillusionment</cite> and <cite>The Feeder</cite>",
	"blurb": "<p>A man lays out his philosophy of disenchantment. A patient's trapped in the void of his mind. Adapted from stories by Thomas Mann and Carl Linder.</p>",
	"notes": "coma, homophobia, life support, sexual harassment",
	"duration": 1585
	},
	{
	"code": "14-Imp_MS",
	"heading": "#14: <cite>The Imp of the Perverse</cite> and <cite><abbr title=\"Manuscript\">MS.</abbr> Found in a Bottle</cite>",
	"blurb": "<p>A prisoner explains his philosophy of temptation. A sea-traveller describes his strange and deadly final journey. Adapted from stories by Edgar Allen Poe.</p>",
	"notes": "being stranded at sea, darkness, drowning",
	"duration": 1741
	},
	{
	"code": "15-Doctor",
	"heading": "#15: <cite>A Country Doctor</cite>",
	"blurb": "<p>A doctor makes a surreal journey through winter weather for a patient on his deathbed. Adapted from a story by Franz Kafka.</p>",
	"notes": "abduction, bite injury, description of open wound, insects, rape",
	"duration": 1449
	},
	{
	"code": "16-Willows",
	"heading": "#16: <cite>The Witch of the Willows</cite>",
	"blurb": "<p>A traveller seeking wonder and danger finds it in an eerie willow-marsh and its resident witch. Adapted from a story by Lord Dunsany.</p>",
	"duration": 1240
	},
	{
	"code": "17-Atrophy",
	"heading": "#17: <cite>Atrophy</cite>",
	"blurb": "<p>A man's bodily strength withers from his toes to his head. Adapted from a story by John Anthony West.</p>",
	"notes": "food, gunshots (2:04)",
	"duration": 1596
	},
	{
	"code": "20-Diary",
	"heading": "#20: <cite>Diary of a Madman</cite>",
	"blurb": "<p>The diary of a civil servant who slips into a world of delusion when his romantic desires are frustrated. Adapted from a story by Nikolai Gogol.</p>",
	"notes": "institutionalisation, obsession, sanism, social humiliation",
	"duration": 2375
	},
	{
	"code": "21-Outsider",
	"heading": "#21: <cite>The Outsider</cite>",
	"blurb": "<p>A lonely man in a deep, dark forest ponders what lies beyond&mdash;and one day makes his desperate escape. Adapted from a story by H.&thinsp;P.&thinsp;Lovecraft.</p>",
	"duration": 1348
	},
	{
	"code": "22-Moonlit",
	"heading": "#22: <cite>The Moonlit Road</cite>",
	"blurb": "<p>A man's mother is murdered; his father disappears. An outcast dreams of vile acts; a ghost returns to its beloved. Adapted from a story by Ambrose Bierce.</p>",
	"notes": "mental breakdown, strangulation, suspicion of cheating",
	"duration": 1949
	},
	{
	"code": "X1-Haunter_pt1",
	"heading": "X#1: <cite>The Haunter of the Dark</cite>, part 1",
	"blurb": "<p>A young writer seeks inspiration from an old cult's derelict church&mdash;he finds more than he bargained for. Adapted from a story by H.&thinsp;P.&thinsp;Lovecraft.</p>",
	"duration": 1681
	},
	{
	"code": "X2-Haunter_pt2",
	"heading": "X#2: <cite>The Haunter of the Dark</cite>, part 2",
	"blurb": "<p>A young writer seeks inspiration from an old cult's derelict church&mdash;he finds more than he bargained for. Adapted from a story by H.&thinsp;P.&thinsp;Lovecraft.</p>",
	"duration": 1482
	},
	{
	"code": "X5-Proof_Crowd",
	"heading": "X#5: <cite>Proof Positive</cite> and <cite>The Man in the Crowd</cite>",
	"blurb": "<p>An esoteric researcher shows <q>proof positive</q> of life after death. A people-watcher stalks an unreadable man. Adapted from stories by Graham Greene and Edgar Allen Poe.</p>",
	"duration": 1138
	}
]
},
{
"code": "CAS",
"heading": "<abbr title=\"Clark Ashton Smith\">CAS</abbr>iana",
"blurb": "<p>Collected readings of the weird fiction of Clark Ashton Smith.</p>",
"source": "<a href=\"http://www.eldritchdark.com/writings/spoken-word/\" rel=\"external\">The Eldritch Dark</a>",
"shows": [
	{
	"code": "1-Flame_pt1",
	"heading": "#1: <cite>The City of the Singing Flame</cite>, part 1",
	"blurb": "<p>A writer walks between worlds to a city where people sacrifice themselves to a vast, singing flame. Read by Mike Cothran.</p>",
	"notes": "self-destructive urges",
	"duration": 2907
	},
	{
	"code": "2-Flame_pt2",
	"heading": "#2: <cite>The City of the Singing Flame</cite>, part 2",
	"blurb": "<p>A writer walks between worlds to a city where people sacrifice themselves to a vast, singing flame. Read by Mike Cothran.</p>",
	"notes": "self-destructive urges",
	"duration": 1779
	},
	{
	"code": "3-Flame_pt3",
	"heading": "#3: <cite>The City of the Singing Flame</cite>, part 3",
	"blurb": "<p>A writer walks between worlds to a city where people sacrifice themselves to a vast, singing flame. Read by Mike Cothran.</p>",
	"notes": "self-destructive urges",
	"duration": 1943
	},
	{
	"code": "4-Saturn_pt1",
	"heading": "#4: <cite>The Door to Saturn</cite>, part 1",
	"blurb": "<p>An inquisitor and his occult quarry must unite to survive on an alien world. Read by Zilbethicus.</p>",
	"duration": 1426
	},
	{
	"code": "5-Saturn_pt2",
	"heading": "#5: <cite>The Door to Saturn</cite>, part 2",
	"blurb": "<p>An inquisitor and his occult quarry must unite to survive on an alien world. Read by Zilbethicus.</p>",
	"notes": "alcohol",
	"duration": 1978
	},
	{
	"code": "6-Maze",
	"heading": "#6: <cite>The Maze of Maâl Dweb</cite>",
	"blurb": "<p>A hunter intrudes in the palace-maze of the sorcerer Maâl Dweb to rescue his beloved from the cruel lord. Read by Mike Cothran.</p>",
	"duration": 2266
	},
	{
	"code": "7-Eidolon_pt1",
	"heading": "#7: <cite>The Dark Eidolon</cite>, part 1",
	"blurb": "<p>A necromancer takes exquisite revenge upon the ruler who wronged him. Read by Mike Cothran.</p>",
	"duration": 2390
	},
	{
	"code": "8-Eidolon_pt2",
	"heading": "#8: <cite>The Dark Eidolon</cite>, part 2",
	"blurb": "<p>A necromancer takes exquisite revenge upon the ruler who wronged him. Read by Mike Cothran.</p>",
	"notes": "crush death, descriptions of gore, horse trampling, poisoning, possession",
	"duration": 2576
	},
	{
	"code": "9-Poems",
	"heading": "poems",
	"blurb": "<p>Seven of Smith's poems, read by the author himself: <cite>High Surf</cite>, <cite>Malediction</cite>, <cite>Desert Dweller</cite>, <cite>Seeker</cite>, <cite>Moly</cite>, <cite>Nada</cite>, and <cite>Don Quixote on Market Street</cite>.</p>",
	"duration": 666
	}
]
},
{
"code": "CRW",
"heading": "<cite><abbr title=\"Columbia Broadcasting System\">CBS</abbr> Radio Workshop</cite>",
"blurb": "<p>A brief 1956&ndash;57 revival of the <cite>Columbia Workshop</cite> series' experimental radio tradition.</p>",
"source": "<a href=\"https://archive.org/details/OTRR_CBS_Radio_Workshop_Singles\" rel=\"external\">Internet Archive</a>",
"copyrightSafe": true,
"shows": [
	{
	"code": "66-Nightmare",
	"heading": "#66: <cite>Nightmare</cite>",
	"blurb": "<p>A tired, sick man has a surreal nightmare that shifts from memory to memory around him.</p>",
	"notes": "gaslighting, mob violence, parental death, seizure",
	"duration": 1483,
	"banger": true
	}
]
},
{
"code": "CW",
"heading": "<cite>Columbia Workshop</cite>",
"blurb": "<p>A 1936&ndash;47 anthology of experimental radio plays organised by Irving Reis to push the narrative and technical boundaries of contemporary radio; succeeded by the <cite><abbr>CBS</abbr> Radio Workshop</cite>.</p>",
"source": "<a href=\"https://www.radioechoes.com/?page=series&genre=OTR-Drama&series=Columbia%20Workshop\" rel=\"external\">Radio Echoes</a>",
"copyrightSafe": true,
"shows": [
	{
	"code": "A031-Macabre",
	"heading": "A#31: <cite>Danse Macabre</cite>",
	"blurb": "<p>Death stalks the land figuratively, as plague brings a kingdom to its knees, and literally, as a lonely fiddler seeking someone to dance to his tune.</p>",
	"duration": 1771
	},
	{
	"code": "A034-Fall",
	"heading": "A#34: <cite>The Fall of the City</cite>",
	"blurb": "<p>Prophets, hierophants, and generals give grandiose speeches while the master of war descends on their &ldquo;free&rdquo; city. Featuring a young Orson Welles.</p>",
	"notes": "human sacrifice, mass panic",
	"duration": 1610,
	"banger": true
	},
	{
	"code": "D27-Slouch",
	"heading": "D#27: <cite>The City Wears a Slouch Hat</cite>",
	"blurb": "<p>An omniscient man slips from surreal scene to scene in a city under cacophonous downpour. Scored by John Cage, for household objects.</p>",
	"notes": "car crash, kidnapping, mugging",
	"duration": 1691,
	"banger": true
	}
]
},
{
"code": "DF",
"heading": "<cite>Dark Fantasy</cite>",
"blurb": "<p>A 1941&ndash;42 anthology of original horror stories and thrillers written by Scott Bishop, who also wrote for <cite>The Mysterious Traveler</cite>.</p>",
"source": "<a href=\"https://archive.org/details/OTRR_Dark_Fantasy_Singles\" rel=\"external\">Internet Archive</a>",
"copyrightSafe": true,
"shows": [
	{
	"code": "04-Tree",
	"heading": "#4: <cite>The Demon Tree</cite>",
	"blurb": "<p>Bored travellers at a holiday resort seek an infamous, murderous tree.</p>",
	"notes": "fall death, quicksand, strangulation",
	"duration": 1418
	},
	{
	"code": "18-Turnpike",
	"heading": "#18: <cite>Pennsylvania Turnpike</cite>",
	"blurb": "<p>An ancient man waits at a turnpike gas station to help a fated traveller find the lost town of Pine Knob.</p>",
	"notes": "car crash, gunshot (22:41)",
	"duration": 1620
	}
]
},
{
"code": "DX",
"heading": "<cite>Dimension X</cite>",
"blurb": "<p>(X X x x x&hellip;) A 1950&ndash;51 sci-fi anthology of originals and adaptations, mostly scripted by Ernest Kinoy and George Lefferts; the fore-runner to their later series <cite>X Minus One</cite>.</p>",
"source": "<a href=\"https://archive.org/details/OTRR_Dimension_X_Singles\" rel=\"external\">Internet Archive</a>",
"copyrightSafe": true,
"shows": [
	{
	"code": "11-Rains_Zero",
	"heading": "#11: <cite>There Will Come Soft Rains</cite> and <cite>Zero Hour</cite>",
	"blurb": "<p>An automated house goes through the motions after nuclear holocaust. Children play &ldquo;invasion&rdquo;, a game with deadly consequences. Adapted from stories by Ray Bradbury.</p>",
	"notes": "animal death, mentions of corporal punishment, fire, high-pitched sounds",
	"duration": 1797
	},
	{
	"code": "14-Heaven",
	"heading": "#14: <cite>Mars Is Heaven!</cite>",
	"blurb": "<p>The first humans on Mars find the alien world is a lot more familiar&mdash;a lot more like home&mdash;than anyone expected. Adapted from a story by Ray Bradbury.</p>",
	"notes": "alcohol, betrayal, food adverts, gunshots (8:50&ndash;8:53), Holocaust mention, uncanny valley",
	"duration": 1758
	},
	{
	"code": "15-Moon",
	"heading": "#15: <cite>The Man in the Moon</cite>",
	"blurb": "<p>The <abbr>US</abbr> Missing Persons Bureau receives calls for help&mdash;beamed straight from the moon.</p>",
	"notes": "abduction, betrayal, food adverts, gunshots (20:00), sanism",
	"duration": 1813
	},
	{
	"code": "17-Potters",
	"heading": "#17: <cite>The Potters of Firsk</cite>",
	"blurb": "<p>A space colonist learns the secret of planet Firsk's exquisite pottery, made with the aid of its ancestors. Adapted from a story by Jack Vance.</p>",
	"notes": "food adverts, gunshot (12:58), kidnapping, racism",
	"duration": 1669
	},
	{
	"code": "21-Parade",
	"heading": "#21: <cite>The Parade</cite>",
	"blurb": "<p>A wealthy client hires an ad firm to announce an alien invasion&mdash;ending in a Martian military parade.</p>",
	"notes": "food adverts, gunshot? (26:54), panic",
	"duration": 1820
	},
	{
	"code": "25-Sanitorium",
	"heading": "#25: <cite>Dr. Grimshaw's Sanitorium</cite>",
	"blurb": "<p>A patient vanishes from a sanitarium&mdash;the doctors say he's dead, but a <abbr title=\"private investigator\">PI</abbr>'s not so sure. Adapted from a story by Fletcher Pratt.</p>",
	"notes": "ableism, alcoholism, betrayal, animal attack, car crash, human experiments, injection, mention of suicide, Naziism, non-consensual surgery, sanism",
	"duration": 1823
	},
	{
	"code": "26-Bright",
	"heading": "#26: <cite>And the Moon be Still as Bright</cite>",
	"blurb": "<p>The final human expedition to Mars discovers why the red planet is dead; one man abandons humanity in turn. Adapted from a story by Ray Bradbury.</p>",
	"notes": "alcohol, genocide, gunshots (17:20, 17:54, 19:46, 20:06, 25:47, 26:50)",
	"duration": 1780,
	"banger": true
	},
	{
	"code": "28-Professor",
	"heading": "#28: <cite>The Professor Was a Thief</cite>",
	"blurb": "<p>An eccentric professor causes chaos in New York by stealing landmarks, city blocks, skyscrapers. Adapted from a story by L.&thinsp;Ron Hubbard.</p>",
	"notes": "alcohol",
	"duration": 1821
	},
	{
	"code": "31-Universe",
	"heading": "#31: <cite>Universe</cite>",
	"blurb": "<p>The warring peoples of a universe 25 kilometers wide and 100 levels deep must unite to avert disaster. Adapted from a story by Robert A.&thinsp;Heinlein.</p>",
	"notes": "ableism, cult behaviour, gunshots (8:41&ndash;8:42, 26:01, 26:07&ndash;26:10, 27:19, lynching)",
	"duration": 1814
	},
	{
	"code": "36-Nightmare",
	"heading": "#36: <cite>Nightmare</cite>",
	"blurb": "<p>All technology, from computers to door handles, conspires against its human masters. Adapted from a poem by Stephen Vincent Benét.</p>",
	"notes": "industrial deaths, institutionalisation, paranoia, traffic deaths",
	"duration": 1494
	},
	{
	"code": "48-Kaleidoscope",
	"heading": "#48: <cite>Kaleidoscope</cite>",
	"blurb": "<p>A spaceship is destroyed, leaving the survivors to drift apart with nothing to do but talk, think, and die. Adapted from a story by Ray Bradbury.</p>",
	"notes": "isolation, parental negligence, suicide",
	"duration": 1772
	},
	{
	"code": "50-Nightfall",
	"heading": "#50: <cite>Nightfall</cite>",
	"blurb": "<p>Astronomers on a world ringed by six suns declare a doomsday prophecy: night will fall and cities will burn. Adapted from a story by Isaac Asimov.</p>",
	"notes": "alcohol, cult belief, mental breakdown",
	"duration": 1827,
	"banger": true
	}
]
},
{
"code": "Esc",
"heading": "<cite>Escape</cite>",
"blurb": "<p>A 1947&ndash;54 anthology of escapist radio plays that shared its talent with the longer-running <cite>Suspense</cite>, and more often delved into the supernatural or science-fiction.</p>",
"source": "<a href=\"https://archive.org/details/OTRR_Escape_Singles\" rel=\"external\">Internet Archive</a>",
"copyrightSafe": true,
"shows": [
	{
	"code": "006-Thoth",
	"heading": "#6: <cite>The Ring of Thoth</cite>",
	"blurb": "<p>An Egyptologist has a chance encounter with the subjects of an ancient tragedy. Adapted from a story by Arthur Conan Doyle, starring Jack Webb.</p>",
	"notes": "plague",
	"duration": 1771
	},
	{
	"code": "015-Runes",
	"heading": "#15: <cite>Casting the Runes</cite>",
	"blurb": "<p>A scholar pens a scathing review of a crackpot's work, inciting arcane revenge. Adapted from a story by M.&thinsp;R.&thinsp;James.</p>",
	"notes": "food poisoning, stalking",
	"duration": 1770,
	"banger": true
	},
	{
	"code": "052-Armageddon",
	"heading": "#52: <cite>A Dream of Armageddon</cite>",
	"blurb": "<p>A man dreams of a world rolling inevitably towards annihilation. Adapted from a story by H.&thinsp;G.&thinsp;Wells.</p>",
	"notes": "being eaten while conscious, explosions (13:56&ndash;14:08), gunshots (14:43, 19:48&ndash;50, 22:47&ndash;50), poison gas, stab death, starvation",
	"duration": 1770,
	"banger": true
	},
	{
	"code": "053-Primrose",
	"heading": "#53: <cite>Evening Primrose</cite>",
	"blurb": "<p>A poet rejects society to live unseen in a department store&mdash;but he's not the first. Adapted from a story by John Collier, starring William Conrad.</p>",
	"duration": 1771
	},
	{
	"code": "117-Bath",
	"heading": "#117: <cite>Blood Bath</cite>",
	"blurb": "<p>Five men find a trillion-dollar deposit of Amazonian uranium, but greed gets the better of them. Starring Vincent Price.</p>",
	"notes": "betrayal, malaria, eaten by piranhas",
	"duration": 1770
	}
]
},
{
"code": "FOT",
"heading": "<cite>Fifty-One Tales</cite>",
"blurb": "<p>A collection of fifty-one short tales of myth and fantasy by Lord Dunsany, first published in 1915 and read by Rosslyn Carlyle for LibriVox.</p>",
"source": "<a href=\"https://librivox.org/fifty-one-tales-by-lord-dunsany\" rel=\"external\">LibriVox</a>",
"copyrightSafe": true,
"shows": [
	{
	"code": "1-starts_Assignation",
	"heading": "part 1",
	"blurb": "<p>From <cite>The Assignation</cite> to <cite>The Unpasturable Fields</cite>.</p>",
	"notes": "fall death, poisoning, suicide",
	"duration": 2139,
	"banger": true
	},
	{
	"code": "2-starts_Angel",
	"heading": "part 2",
	"blurb": "<p>From <cite>The Worm and the Angel</cite> to <cite>Spring in Town</cite>.</p>",
	"duration": 1854,
	"banger": true
	},
	{
	"code": "3-starts_Enemy",
	"heading": "part 3",
	"blurb": "<p>From <cite>How the Enemy Came to Thlunrana</cite> to <cite>The Reward</cite>.</p>",
	"duration": 1834,
	"banger": true
	},
	{
	"code": "4-starts_Trouble",
	"heading": "part 4",
	"blurb": "<p>From <cite>The Trouble in Leafy Green Street</cite> to <cite>The Tomb of Pan</cite>.</p>",
	"notes": "animal sacrifice, lynching",
	"duration": 2067,
	"banger": true
	}
]
},
{
"code": "GGP",
"heading": "<cite>The Great God Pan</cite>",
"blurb": "<p>A doctor lets the universe into a woman's brain. A village girl lures children into chaos. A seductress drives high society men to suicide. Written by Arthur Machen, first published in 1894, and read by Ethan Rampton for LibriVox.</p>",
"source": "<a href=\"https://librivox.org/the-great-god-pan-by-arthur-machen\" rel=\"external\">LibriVox</a>",
"copyrightSafe": true,
"shows": [
	{
	"code": "1-Experiment_Memoirs",
	"heading": "part 1",
	"blurb": "<p>Chapters 1 and 2: <cite>The Experiment</cite> and <cite>Mr. Clarke's Memoirs</cite>.</p>",
	"notes": "ableism, brain surgery, child death?, child endangerment",
	"duration": 1968
	},
	{
	"code": "2-City_Street",
	"heading": "part 2",
	"blurb": "<p>Chapters 3 and 4: <cite>The City of Resurrections</cite> and <cite>The Discovery in Paul Street</cite>.</p>",
	"duration": 1745
	},
	{
	"code": "3-Letter_Suicides",
	"heading": "part 3",
	"blurb": "<p>Chapters 5 and 6: <cite>The Letter of Advice</cite> and <cite>The Suicides</cite>.</p>",
	"duration": 1760
	},
	{
	"code": "4-Soho_Fragments",
	"heading": "part 4",
	"blurb": "<p>Chapters 7 and 8: <cite>The Encounter in Soho</cite> and <cite>The Fragments</cite>.</p>",
	"notes": "body horror",
	"duration": 1659
	}
]
},
{
"code": "HF",
"heading": "<cite>The Hall of Fantasy</cite>",
"blurb": "<p>A series of supernatural horror stories originally broadcast in Utah, later nationally syndicated in 1952&ndash;53. The series was written and directed by Richard Thorne.</p>",
"source": "<a href=\"https://archive.org/details/470213ThePerfectScript\" rel=\"external\">Internet Archive</a>",
"copyrightSafe": true,
"shows": [
	{
	"code": "A21-Judge",
	"heading": "A#21: <cite>The Judge's House</cite>",
	"blurb": "<p>An exam student rents a malignant old house and comes face to face with the hanging judge who once lived there. Adapted from a story by Bram Stoker.</p>",
	"notes": "animal swarm",
	"duration": 1613,
	"banger": true
	},
	{
	"code": "B3-Shadow",
	"heading": "B#3: <cite>The Shadow People</cite>",
	"blurb": "<p>A young woman is targeted by murderous living shadows that extinguish her family one by one.</p>",
	"duration": 1461,
	"banger": true
	},
	{
	"code": "C10-Masks",
	"heading": "C#10: <cite>The Masks of Ashor</cite>",
	"blurb": "<p>A couple receive a curio from their world-travelling uncle&mdash;two golden masks belonging to an ancient devil of death.</p>",
	"notes": "animal attack",
	"duration": 1407
	},
	{
	"code": "C12-Fog",
	"heading": "C#12: <cite>The Night the Fog Came</cite>",
	"blurb": "<p>Scientists discover microbes that spread by fog and drown anyone they touch&mdash;and the fog is spreading in a wave of death.</p>",
	"duration": 1401
	},
	{
	"code": "C27-Black",
	"heading": "C#27: <cite>The Man in Black</cite>",
	"blurb": "<p>Two friends catch the eye of the nocturnal evil, the &ldquo;man in black&rdquo;.</p>",
	"duration": 1435,
	"banger": true
	},
	{
	"code": "C43-Follows",
	"heading": "C#43: <cite>He Who Follows Me</cite>",
	"blurb": "<p>A couple disturb a sleeping evil in the grounds of an abandoned mansion&mdash;the &ldquo;Death That Walks&rdquo;.</p>",
	"notes": "stalking",
	"duration": 1468
	}
]
},
{
"code": "KY",
"heading": "<cite>The King in Yellow</cite>",
"blurb": "<p>A collection of eldritch horror stories from this classic collection, all revolving around an eerie symbol, a bizarre play, a mysterious abomination, and lost Carcosa. Written by Robert W.&thinsp;Chambers, first published in 1895, and read by Eva Staes for LibriVox.</p>",
"source": "<a href=\"https://librivox.org/king-in-yellow-version-2-by-robert-w-chambers\" rel=\"external\">LibriVox</a>",
"copyrightSafe": true,
"shows": [
	{
	"code": "0-Poems",
	"heading": "poems",
	"blurb": "<p>Two poems from the collection: the dedication (a fragment of the play) and <cite>The Prophet's Paradise</cite>.</p>",
	"duration": 525
	},
	{
	"code": "1-Repairer_pt1",
	"heading": "1: <cite>The Repairer of Reputations</cite>, part 1",
	"blurb": "<p>A man losing touch with reality plots to overthrow the aristocratic-fascist government and declare himself supreme leader.</p>",
	"notes": "hallucination?, institutionalisation, mention of suicide",
	"duration": 1416
	},
	{
	"code": "2-Repairer_pt2",
	"heading": "1: <cite>The Repairer of Reputations</cite>, part 2",
	"blurb": "<p>A man losing touch with reality plots to overthrow the aristocratic-fascist government and declare himself supreme leader.</p>",
	"notes": "ableism, hallucination, suicide",
	"duration": 1774
	},
	{
	"code": "3-Repairer_pt3",
	"heading": "1: <cite>The Repairer of Reputations</cite>, part 3",
	"blurb": "<p>A man losing touch with reality plots to overthrow the aristocratic-fascist government and declare himself supreme leader.</p>",
	"notes": "animal attack, hallucination?, institutionalisation",
	"duration": 1938
	},
	{
	"code": "4-Mask",
	"heading": "2: <cite>The Mask</cite>",
	"blurb": "<p>Bohemians experiment with drugs, art, and a concoction that turns anything into solid marble.</p>",
	"notes": "suicide",
	"duration": 2444
	},
	{
	"code": "5-Court",
	"heading": "3: <cite>The Court of the Dragon</cite>",
	"blurb": "<p>After reading the banned play <cite>The King in Yellow</cite>, a man is haunted by a sinister organist and visions of the living god.</p>",
	"duration": 1341,
	"banger": true
	},
	{
	"code": "6-Sign",
	"heading": "4: <cite>The Yellow Sign</cite>",
	"blurb": "<p>A painter and his model encounter an abomination after reading the banned play <cite>The King in Yellow</cite>.</p>",
	"duration": 2671
	}
]
},
{
"code": "LV",
"heading": "LibriVox selection",
"blurb": "<p>LibriVox is a catalogue of public domain audiobook readings, including a selection of weird fiction and horror classics from decades and centuries ago.</p>",
"source": "<a href=\"https://librivox.org\" rel=\"external\">LibriVox</a>",
"copyrightSafe": true,
"shows": [
	{
	"code": "01-Nameless",
	"heading": "#1: <cite>The Nameless City</cite>",
	"blurb": "<p>An archaeologist journeys to, and within, an ancient, nameless city not built to human proportions. Written by H.&thinsp;P.&thinsp;Lovecraft, read by Dean Delp.</p>",
	"notes": "claustrophobia, darkness",
	"duration": 1735
	},
	{
	"code": "02-Occurrence",
	"heading": "#2: <cite>An Occurrence at Owl Creek Bridge</cite>",
	"blurb": "<p>A Confederate slave owner and attempted saboteur has a miraculous, harrowing escape from execution. Written by Ambrose Bierce, read by Elise Sauer.</p>",
	"notes": "entrapment, facial wounds, hallucination?, hanging, near-drowning",
	"duration": 1536,
	"banger": true
	},
	{
	"code": "03-Ship",
	"heading": "#3: <cite>The White Ship</cite>",
	"blurb": "<p>A lighthouse keeper fantasises of visiting wondrous islands on a white ship&mdash;but his daydream may be more real than he thinks. Written by H.&thinsp;P.&thinsp;Lovecraft, read by D.&thinsp;E.&thinsp;Wittkower.</p>",
	"notes": "animal death, disease, near-drowning, shipwreck",
	"duration": 1194,
	"banger": true
	},
	{
	"code": "04-Heights",
	"heading": "#4: <cite>The Horror of the Heights</cite>",
	"blurb": "<p>An aviator investigates the unsolved deaths of pilots who broke the altitude record&mdash;and discovers an ecosystem in the sky. Written by Arthur Conan Doyle, read by Mike Harris.</p>",
	"notes": "being hunted, decapitation, isolation, jellyfish",
	"duration": 2206
	},
	{
	"code": "05-Moon_Dagon_Nyarlathotep",
	"heading": "#5: Gods and Abominations (short works by Lovecraft)",
	"blurb": "<p>Three short pieces by H.&thinsp;P.&thinsp;Lovecraft: <cite>What the Moon Brings</cite> (read by Dan Gurzynski), <cite>Dagon</cite> (read by Selim Jamil), and <cite>Nyarlathotep</cite> (read by Tom Hackett).</p><!--\"Nyarlathotep\" reader's name on LibriVox site (Tom Hackett) is different to the one given in the file (Peter Bianzo(?))-->",
	"notes": "being stranded at sea, drowning, drugs, isolation, near-drowning, nightmares, racism, suicide planning, worms",
	"duration": 1719
	},
	{
	"code": "07-Wire",
	"heading": "#7: <cite>The Night Wire</cite>",
	"blurb": "<p>Graveyard shift telegram operators receive reports from an unknown town beset by mist and monsters. Written by H.&thinsp;F.&thinsp;Arnold, read by Dan Gurzynski.</p>",
	"duration": 1014,
	"banger": true
	},
	{
	"code": "08-Naught",
	"heading": "#8: <cite><abbr title=\"To Be Or Not To Be\">2 B R 0 2 B</abbr></cite>",
	"blurb": "<p>In a future of immortality and severe population control, a father must find three people willing to die so his newborn triplets can be permitted to live. Written by Kurt Vonnegut, read by Alex Clarke.</p>",
	"notes": "gun death, suicide, suicide ideation",
	"duration": 1080
	},
	{
	"code": "09-Cities",
	"heading": "#9: <cite>The Lord of Cities</cite>",
	"blurb": "<p>A human traveller, the road and the river, and the earth itself ruminate on life, beauty, and purpose. Written by Lord Dunsany, read by Ed Humpal.</p>",
	"duration": 1037
	},
	{
	"code": "10-Masque_Amontillado",
	"heading": "#10: Gothic Origins (short works by Poe)",
	"blurb": "<p>Two short pieces by Edgar Allen Poe: <cite>The Masque of the Red Death</cite> (read by Elise Dee) and <cite>The Cask of Amontillado</cite> (read by &ldquo;Caveat&rdquo;).</p>",
	"notes": "betrayal, darkness, entombment",
	"duration": 1764
	},
	{
	"code": "12-Blagdaross_Unhappy_Madness",
	"heading": "#12: Things That Talk (short works by Dunsany)",
	"blurb": "<p>Three short pieces by Lord Dunsany: <cite>Blagdaross</cite> (read by Michele Fry), <cite>The Unhappy Body</cite> (read by Andrew Gaunce), and <cite>The Madness of Andlesprutz</cite> (read by Michele Fry).</p>",
	"notes": "abandonment, overwork",
	"duration": 1822
	},
	{
	"code": "13-Paw",
	"heading": "#13: <cite>The Monkey's Paw</cite>",
	"blurb": "<p>A mummified monkey's paw grants three wishes&mdash;with dread consequences. Written by W.&thinsp;W.&thinsp;Jacobs, read by Travis Baldree.</p>",
	"duration": 1606
	},
	{
	"code": "15-Disappearances",
	"heading": "#15: <cite>Mysterious Disappearances</cite>",
	"blurb": "<p>Three accounts of unexplained disappearances. Written by Ambrose Bierce, read by Piotr Nater.</p>",
	"duration": 872
	},
	{
	"code": "17-What",
	"heading": "#17: <cite>What Was It?</cite>",
	"blurb": "<p>Lodgers at a supposedly-haunted house discover an invisible supernumerary resident. Written by Fitz-James O'Brien, read by Rafe Ball.</p>",
	"notes": "being trapped, starvation, strangulation",
	"duration": 2204
	},
	{
	"code": "18-Dreams_Nightmares",
	"heading": "#18: Dreams and Nightmares (poems)",
	"blurb": "<p>Collected poems on dreams and nightmares. Written by Seigfried Sassoon, Samuel Taylor Coleridge, Helen Hunt Jackson, Clark Ashton Smith, William Danby, and John James Piatt; read by Nemo, Algy Pug, Newgatenovelist, and Colleen McMahon.</p>",
	"duration": 874
	},
	{
	"code": "19-Carcassonne",
	"heading": "#19: <cite>Carcassonne</cite>",
	"blurb": "<p>A young king and his warriors attempt to conquer the unconquerable. Written by Lord Dunsany, read by Daniel Davison.</p>",
	"duration": 2190,
	"banger": true
	},
	{
	"code": "20-Facts",
	"heading": "#20: <cite>The Facts in the Case of <abbr title=\"Monsieur\">M.</abbr> Valdemar</cite>",
	"blurb": "<p>A mesmerist preserves a man beyond death. Written by Edgar Allen Poe, read by Tony Scheinman.</p>",
	"notes": "extensive descriptions of gore, suicide",
	"duration": 1560
	},
	{
	"code": "21-Pharoahs_pt1",
	"heading": "#21: <cite>Imprisoned with the Pharoahs</cite>, part 1",
	"blurb": "<p>A &ldquo;true&rdquo; story of escape artist Harry Houdini's dark encounter under the Sphinx of Giza. Written by H.&thinsp;P.&thinsp;Lovecraft with Houdini, read by Ben Tucker.</p>",
	"notes": "betrayal, darkness, kidnapping, racism",
	"duration": 1911
	},
	{
	"code": "22-Pharoahs_pt2",
	"heading": "#22: <cite>Imprisoned with the Pharoahs</cite>, part 2",
	"blurb": "<p>A &ldquo;true&rdquo; story of escape artist Harry Houdini's dark encounter under the Sphinx of Giza. Written by H.&thinsp;P.&thinsp;Lovecraft with Houdini, read by Ben Tucker.</p>",
	"notes": "betrayal, darkness, kidnapping, racism",
	"duration": 2162
	},
	{
	"code": "23-Hunger",
	"heading": "#23: <cite>A Hunger Artist</cite>",
	"blurb": "<p>The life of a performer who starves themself for the crowd. Written by Franz Kafka, read by Cori Samuel.</p>",
	"duration": 1754
	},
	{
	"code": "25-Stroller",
	"heading": "#25: <cite>The Stroller</cite>",
	"blurb": "<p>A bickering couple have a near-deadly doppelganger encounter. Written by Margaret St. Clair, read by quartertone.</p>",
	"notes": "betrayal",
	"duration": 1100
	},
	{
	"code": "27-Idle_Dreams",
	"heading": "#27: Tales of Cities",
	"blurb": "<p><cite>The Idle City</cite> (written by Lord Dunsany, read by Daniel Davison) and <cite>The City of My Dreams</cite> (written by Theodore Dreiser, read by Phil Schempf).</p>",
	"duration": 1370
	},
	{
	"code": "30-Sarnath",
	"heading": "#30: <cite>The Doom That Came to Sarnath</cite>",
	"blurb": "<p>A young city rises by exterminating its neighbours, until doom descends upon it in turn. Written by H.&thinsp;P.&thinsp;Lovecraft, read by Glen Hallstrom.</p>",
	"duration": 1043
	},
	{
	"code": "31-Valley",
	"heading": "#31: <cite>The Valley of Spiders</cite>",
	"blurb": "<p>A lord and his servants pursue a girl into a most deadly valley. Written by H.&thinsp;G.&thinsp;Wells, read by Robert Dixon.</p>",
	"notes": "being trapped, betrayal, foot injury",
	"duration": 1427
	},
	{
	"code": "32-Chaos",
	"heading": "#32: <cite>The Crawling Chaos</cite>",
	"blurb": "<p>A man in an opium abyss has a beautiful vision of apocalypse. Written by H.&thinsp;P.&thinsp;Lovecraft, read by D.&thinsp;E&thinsp;Wittkower.</p>",
	"duration": 1529
	},
	{
	"code": "33-Caterpillars",
	"heading": "#33: <cite>Caterpillars</cite>",
	"blurb": "<p>Monstrous caterpillars haunt the visitor to an isolated villa&mdash;in dream, then reality. Written by E.&thinsp;F.&thinsp;Benson, read by Andy Minter.</p>",
	"notes": "cancer",
	"duration": 1278
	},
	{
	"code": "34-Fog",
	"heading": "#34: <cite>Fog</cite>",
	"blurb": "<p>A sickly boy and ethereal girl long for each other over the gulf of fog, sea, and time. Written by Dana Burnet, read by Colleen McMahon.</p>",
	"duration": 1783
	},
	{
	"code": "35-Ancient",
	"heading": "#35: <cite>Ancient Lights</cite>",
	"blurb": "<p>A surveyor hired to help clear a fey wood gets lost in illusion after walking between the trees. Written by Algernon Blackwood, read by Samanem.</p>",
	"duration": 940
	},
	{
	"code": "36-Kingdom",
	"heading": "#36: <cite>The Kingdom of the Worm</cite>",
	"blurb": "<p>A travelling knight offends the king of worms and is imprisoned in its kingdom. Written by Clark Ashton Smith, read by Ben Tucker.</p>",
	"notes": "claustrophobia, darkness",
	"duration": 1202
	},
	{
	"code": "38-Primal",
	"heading": "#38: <cite>The Primal City</cite>",
	"blurb": "<p>An expedition to an ancient mountain city finds its denizens gone, but its sentinels on alert. Written by Clark Ashton Smith, read by Ben Tucker.</p>",
	"duration": 991
	},
	{
	"code": "39-Gift_Archive_Postman",
	"heading": "#39: Forgotten Gods (short works by Dunsany)",
	"blurb": "<p>Three short pieces by Lord Dunsany, read by Sandra Cullum: <cite>The Gift of the Gods</cite>, <cite>An Archive of the Older Mysteries</cite>, and <cite>How the Office of Postman Fell Vacant in Otford-under-the-Wold</cite>.</p>",
	"duration": 1171
	},
	{
	"code": "40-Spook_Greeting_Carcosa",
	"heading": "#40: Hauntings and Vanishings (short works by Bierce)",
	"blurb": "<p>Three short pieces by Ambrose Bierce: <cite>The Spook House</cite> (read by Paul Sigel), <cite>A Cold Greeting</cite> (read by Steve Karafit), and <cite>An Inhabitant of Carcosa</cite> (read by G.&thinsp;C.&thinsp;Fournier).</p>",
	"notes": "entombment",
	"duration": 1484
	},
	{
	"code": "41-Zann",
	"heading": "#41: <cite>The Music of Erich Zann</cite>",
	"blurb": "<p>A musician plays nightly eldritch harmonies for the void beyond his window. Written by H.&thinsp;P.&thinsp;Lovecraft, read by Cameron Halket.</p>",
	"notes": "ableism",
	"duration": 1130
	},
	{
	"code": "42-Polaris_Outer",
	"heading": "#42: Ancient Humanities (short works by Lovecraft)",
	"blurb": "<p>Two short pieces by H.&thinsp;P.&thinsp;Lovecraft: <cite>Polaris</cite> (read by jpontoli) and <cite>The Outer Gods</cite> (read by Peter Yearsley).</p>",
	"notes": "racism",
	"duration": 1514,
	"banger": true
	},
	{
	"code": "43-Powder",
	"heading": "#43: <cite>Novel of the White Powder</cite>",
	"blurb": "<p>An excerpt from the occult horror novel <cite>The Three Impostors; or, The Transmutations</cite>: a mourner relates how a medicine transfigured her brother. Written by Arthur Machen, read by Tony Oliva.</p>",
	"notes": "body horror",
	"duration": 2514
	},
	{
	"code": "44-Babbulkund",
	"heading": "#44: <cite>The Fall of Babbulkund</cite>",
	"blurb": "<p>Babbulkund, City of Marvel, city of wonders, city on travellers' lips&mdash;Babbulkund has fallen, decayed, died. Written by Lord Dunsany, read by Alex Clarke.</p>",
	"duration": 2211,
	"banger": true
	},
	{
	"code": "45-Law_Gallery_Message",
	"heading": "#45: Power and Spectacle (short works by Kafka)",
	"blurb": "<p>Three short pieces by Franz Kafka: <cite>Before the Law</cite> (read by Availle), <cite>Up in the Gallery</cite> (read by Adam Whybray), and <cite>An Imperial Message</cite> (read by SBE Iyyerwal).</p>",
	"duration": 702
	},
	{
	"code": "46-Welleran",
	"heading": "#46: <cite>The Sword of Welleran</cite>",
	"blurb": "<p>The city of Merimna mourns its heroes, heedless of the foes approaching now its guardians are dead. Written by Lord Dunsany, read by Ed Humpal.</p>",
	"duration": 2039,
	"banger": true
	},
	{
	"code": "47-Whirlpool_Hurricane_Dry",
	"heading": "#47: Great and Little Ones (short works by Dunsany)",
	"blurb": "<p>Three short pieces by Lord Dunsany: <cite>The Whirlpool</cite> (read by James Koss), <cite>The Hurricane</cite> (read by Rosslyn Carlyle), and <cite>On the Dry Land</cite> (read by Rosslyn Carlyle).</p>",
	"duration": 1017
	},
	{
	"code": "48-Gaffer",
	"heading": "#48: <cite>Gaffer Death</cite>",
	"blurb": "<p>The German folktale telling of a doctor whose godfather is Death himself. Compiled by Charles John Tibbitts, read by Craig Campbell.</p>",
	"duration": 426
	}
]
},
{
"code": "LO",
"heading": "<cite>Lights Out</cite>",
"blurb": "<p>One of the earliest radio horror shows, started by Wyllis Cooper in 1934, later headed by Arch Oboler until 1947. Often more camp than scary, by modern standards.</p>",
"source": "<a href=\"https://archive.org/details/LightsOutoldTimeRadio\" rel=\"external\">Internet Archive</a>",
"copyrightSafe": true,
"shows": [
	{
	"code": "A009-Money",
	"heading": "A#9: <cite>Money, Money, Money</cite>",
	"blurb": "<p>A sailor murders his colleague for a winning lottery ticket and takes an offshore salvage-diving job to escape the law&mdash;but he can't escape revenge.</p>",
	"notes": "narcosis",
	"duration": 1785
	},
	{
	"code": "A040_A072_C09-Chicken_Dark_Exploded",
	"heading": "A#40, A#72, and C#9: <cite>Lights Out</cite> fragments",
	"blurb": "<p>A trio of short <cite>Lights Out</cite> episodes: <cite>Chicken Heart</cite>, <cite>The Dark</cite>, and <cite>The Day the Sun Exploded</cite>.</p>",
	"notes": "body horror, plane crash, racism",
	"duration": 1713,
	"banger": true
	},
	{
	"code": "A071-Christmas",
	"heading": "A#71: <cite>Christmas Story</cite>",
	"blurb": "<p>Three soldiers meet in a train on Christmas Eve, 1918, but they feel like they've met before&hellip;</p>",
	"duration": 1800
	},
	{
	"code": "A076-Oxychloride",
	"heading": "A#76: <cite>Oxychloride X</cite>",
	"blurb": "<p>A put-upon and rejected chemistry student makes a miracle to spite his tormentors.</p>",
	"notes": "falling death",
	"duration": 1422
	},
	{
	"code": "B02-Worms",
	"heading": "B#2: <cite>Revolt of the Worms</cite>",
	"blurb": "<p>A chemist carelessly disposes of a growth formula, with disastrous consequences.</p>",
	"notes": "crushing death",
	"duration": 1320
	},
	{
	"code": "B07-Bank",
	"heading": "B#7: <cite>Come to the Bank</cite>",
	"blurb": "<p>A man walks through a bank wall using mental power&mdash;but gets trapped halfway, to his colleague's mounting terror.</p>",
	"notes": "institutionalisation, mental breakdown",
	"duration": 1339
	},
	{
	"code": "B23-Paris",
	"heading": "B#23: <cite>Paris Macabre</cite>",
	"blurb": "<p>Two tourists in Paris pay to attend an increasingly strange masque ball.</p>",
	"notes": "beheading, traffic death",
	"duration": 1626
	},
	{
	"code": "B25-Flame",
	"heading": "B#25: <cite>The Flame</cite>",
	"blurb": "<p>A man with an affinity for flames summons a pyromaniac demon to his fireplace.</p>",
	"notes": "arson, fire deaths, obsession",
	"duration": 1400
	},
	{
	"code": "C06-Newsreel",
	"heading": "C#6: <cite>The Ghost on the Newsreel Negative</cite>",
	"blurb": "<p>Two reporters interview a ghost.</p>",
	"notes": "darkness",
	"duration": 1763
	}
]
},
{
"code": "McT",
"heading": "<cite>The Mercury Theatre</cite>",
"blurb": "<p>A 1938 extension of Orson Welles' Mercury Theatre to adapt classic fiction to the airwaves, with each show starring Welles himself in a major role.</p>",
"source": "<a href=\"https://archive.org/details/OrsonWelles_MercuryTheatre\" rel=\"external\">Internet Archive</a>",
"shows": [
	{
	"code": "01a-Dracula_pt1",
	"heading": "#1: <cite>Dracula</cite>, part 1",
	"blurb": "<p>A solicitor, his wife, and her suitors band together with a vampire hunter to slay Count Dracula. Adapted from a story by Bram Stoker.</p>",
	"notes": "confinement",
	"duration": 1290
	},
	{
	"code": "01b-Dracula_pt2",
	"heading": "#1: <cite>Dracula</cite>, part 2",
	"blurb": "<p>A solicitor, his wife, and her suitors band together with a vampire hunter to slay Count Dracula. Adapted from a story by Bram Stoker.</p>",
	"notes": "mind control",
	"duration": 2262
	},
	{
	"code": "17a-Worlds_pt1",
	"heading": "#17: <cite>The War of the Worlds</cite>, part 1",
	"blurb": "<p>An adaptation of H.&thinsp;G.&thinsp;Wells' story of Martians invading Earth; some listeners infamously believed it was a description of real current events.</p>",
	"notes": "asphyxiation, cannon-fire (30:39, 30:55, 31:15, 31:49), poison-gassing",
	"duration": 2451,
	"banger": true
	},
	{
	"code": "17b-Worlds_pt2",
	"heading": "#17: <cite>The War of the Worlds</cite>, part 2",
	"blurb": "<p>An adaptation of H.&thinsp;G.&thinsp;Wells' story of Martians invading Earth; some listeners infamously believed it was a description of real current events.</p>",
	"notes": "asphyxiation, plane crash, poison-gassing",
	"duration": 1146,
	"banger": true
	}
]
},
{
"code": "Mw",
"heading": "<cite>Mindwebs</cite>",
"blurb": "<p>A 1975&ndash;84 series of sci-fi, fantasy, and horror short story readings by Michael Hanson, who also chose the often-jazzy musical accompaniment for each episode.</p>",
"source": "<a href=\"https://archive.org/details/MindWebs_201410\" rel=\"external\">Internet Archive</a>",
"shows": [
	{
	"code": "001-Carcinoma",
	"heading": "#1: <cite>Carcinoma Angels</cite>",
	"blurb": "<p>A genius billionaire with unnatural luck desperately uses a cocktail of hallucinogens to cure his cancer. Written by Norman Spinrad.</p>",
	"notes": "injection, institutionalisation, racism, sterilisation",
	"duration": 1786,
	"banger": true
	},
	{
	"code": "003-Descending",
	"heading": "#3: <cite>Descending</cite>",
	"blurb": "<p>A bullshit artist on a department store spending spree winds up in a never-ending escalator ride&hellip; Written by Thomas M.&thinsp;Disch.</p>",
	"notes": "head injury, mental breakdown, starvation",
	"duration": 1808,
	"banger": true
	},
	{
	"code": "007-Ball",
	"heading": "#7: <cite>Roller Ball Murder</cite>",
	"blurb": "<p>The bloodsport of the future grows more deadly by the year, and its most lauded champions are shells of human beings. Written by William Harrison.</p>",
	"duration": 1862,
	"banger": true
	},
	{
	"code": "012-Swimmer",
	"heading": "#12: <cite>The Swimmer</cite>",
	"blurb": "<p>A man lounging in a friend's garden pool decides on a whim to swim home through his neighbours' pools. Written by John Cheever.</p>",
	"notes": "alcohol, dementia?, foot injury, humiliation",
	"duration": 1872,
	"banger": true
	},
	{
	"code": "025-Garden",
	"heading": "#25: <cite>The Garden of Time</cite>",
	"blurb": "<p>A nobleman and his wife cut the flowers of time to set back the vast waves of humanity that press down on their villa. Written by J.&thinsp;G.&thinsp;Ballard.</p>",
	"duration": 1809
	},
	{
	"code": "026-Test_Names",
	"heading": "#26: <cite>Test</cite> and <cite>The Nine Billion Names of God</cite>",
	"blurb": "<p>A man passes, then fails, a driving test. Technology helps Tibetan monks write the many names of god. Written by Theodore Thomas and Arthur C.&thinsp;Clarke.</p>",
	"notes": "car crash, institutionalisation",
	"duration": 1862,
	"banger": true
	},
	{
	"code": "031-Abyss",
	"heading": "#31: <cite>In the Abyss</cite>",
	"blurb": "<p>Wondrous and deadly secrets await the first human explorer to the ocean floor. Written by H.&thinsp;G.&thinsp;Wells.</p>",
	"notes": "claustrophobia, darkness, drowning",
	"duration": 1853
	},
	{
	"code": "032-Elf",
	"heading": "#32: <cite>A Night in Elf Hill</cite>",
	"blurb": "<p>An ancient alien pleasure dome is hungry to serve anyone it can since its makers abandoned it aeons ago. Written by Norman Spinrad.</p>",
	"notes": "abandonment, cannibalism?",
	"duration": 1847
	},
	{
	"code": "033-Top",
	"heading": "#33: <cite>The Top</cite>",
	"blurb": "<p>An advertiser for a colossal corporation discovers the secret at the summit of its pyramidal headquarters. Written by George Sumner Albee.</p>",
	"notes": "overwork death",
	"duration": 1846,
	"banger": true
	},
	{
	"code": "051-Evergreen",
	"heading": "#51: <cite>The Evergreen Library</cite>",
	"blurb": "<p>A lawyer visiting a dead client's estate loses himself in the old man's library. Written by Bill Pronzini and Jeffrey Wallmann.</p>",
	"notes": "derealisation",
	"duration": 1854,
	"banger": true
	},
	{
	"code": "057-End",
	"heading": "#57: <cite>The End</cite>",
	"blurb": "<p>One man keeps building, at the end of all things. Written by Ursula K.&thinsp;Le Guin.</p>",
	"duration": 1834,
	"banger": true
	},
	{
	"code": "066-Desertion",
	"heading": "#66: <cite>Desertion</cite>",
	"blurb": "<p>Human minds are transposed into Jupiter's fauna to explore and colonise the planet&mdash;but they all desert the mission. Written by Clifford Simak.</p>",
	"duration": 1860,
	"banger": true
	},
	{
	"code": "071-Mask",
	"heading": "#71: <cite>Gas Mask</cite>",
	"blurb": "<p>A massive city descends into total merciless gridlock. Written by James Houston.</p>",
	"duration": 1845,
	"banger": true
	},
	{
	"code": "075-Walk",
	"heading": "#75: <cite>A Walk in the Dark</cite>",
	"blurb": "<p>A lost astronaut takes a six mile walk back to base on a dark dead planet. How dangerous could it be? Written by Arthur C.&thinsp;Clarke.</p>",
	"duration": 1867
	},
	{
	"code": "076-See",
	"heading": "#76: <cite>When We Went To See The End Of The World</cite>",
	"blurb": "<p>Time-travelling tourists boast about seeing the end of the world&mdash;until they realise they didn't all see the <em>same</em> end&hellip; Written by Robert Silverberg.</p>",
	"duration": 1868
	},
	{
	"code": "082-Plot_Express",
	"heading": "#82: <cite>The Plot is the Thing</cite> and <cite>Midnight Express</cite>",
	"blurb": "<p>Doctors lobotomise a <abbr title=\"television\">TV</abbr>-obsessed woman, with bizarre results. A young man meets his childhood terror. Written by Robert Block and Alfred Noyes.</p>",
	"notes": "derealisation, injection, institutionalisation, lobotomy, nightmares, racism",
	"duration": 1804,
	"banger": true
	},
	{
	"code": "088-Nackles",
	"heading": "#88: <cite>Nackles</cite>",
	"blurb": "<p>An abusive father invents an evil opposite to Santa Claus to terrify his kids, with severe consequences. Written by Curt Clark.</p>",
	"duration": 1849,
	"banger": true
	},
	{
	"code": "094-Soldier",
	"heading": "#94: <cite>But As a Soldier, for His Country</cite>",
	"blurb": "<p>The state refuses to let its best soldier die, no matter how many wars he wins. Written by Stephen Goldin.</p>",
	"duration": 1819,
	"banger": true
	},
	{
	"code": "095-Winter_Hating",
	"heading": "#95: <cite>Winter Housekeeping</cite> and <cite>The Public Hating</cite>",
	"blurb": "<p>A woman takes heavy measures against the poison of ageing. Mass telekinesis is used in horrific new executions. Written by Molly Daniel and Steve Allen.</p>",
	"notes": "asphyxiation, obsession",
	"duration": 1850
	},
	{
	"code": "099-Ghosts_Diggers",
	"heading": "#99: <cite>Ghosts</cite> and <cite>The Diggers</cite>",
	"blurb": "<p>Robots struggle with reproduction. A woman seeks the mysterious Diggers for love of mystery itself. Written by Robert F.&thinsp;Young and Don Stern.</p>",
	"notes": "suicide",
	"duration": 1819
	},
	{
	"code": "105-Silenzia",
	"heading": "#105: <cite>Silenzia</cite>",
	"blurb": "<p>A man discovers an air-spray that eats sound; he slowly gives in to the temptation of silence. Written by Alan Nelson.</p>",
	"duration": 1849
	},
	{
	"code": "106-Listener_Dust",
	"heading": "#106: <cite>Deaf Listener</cite> and <cite>Shall the Dust Praise Thee?</cite>",
	"blurb": "<p>A telepath employed to detect alien life makes a critical error. The Day of Reckoning suffers a hitch. Written by Rachel Payes and Damon Knight.</p>",
	"duration": 1846
	},
	{
	"code": "110-Noon_Quandary",
	"heading": "#110: <cite>Appointment at Noon</cite> and <cite>Man in a Quandary</cite>",
	"blurb": "<p>A suspicious man has a suspicious visitor. Someone writes to an advice column for help with a unique problem. Written by Eric Russell and L.&thinsp;J.&thinsp;Stecher.</p>",
	"notes": "ableism",
	"duration": 1852
	},
	{
	"code": "115-Horn",
	"heading": "#115: <cite>The Fog Horn</cite>",
	"blurb": "<p>An old fog horn's deafening cry calls forth an ancient titan. Written by Ray Bradbury.</p>",
	"duration": 1812
	},
	{
	"code": "117-Petrified",
	"heading": "#117: <cite>The Petrified World</cite>",
	"blurb": "<p>A nervous man shifts between surreal dream and real nightmare. Written by Robert Sheckley.</p>",
	"notes": "near-drowning, nightmares",
	"duration": 1826
	},
	{
	"code": "118-Island",
	"heading": "#118: <cite>Island of Fear</cite>",
	"blurb": "<p>An art collector obsesses over the perfect statuary beyond the monolithic wall on a tiny Greek island. Written by William Sambrot.</p>",
	"notes": "near-drowning",
	"duration": 1811,
	"banger": true
	},
	{
	"code": "124-Myths",
	"heading": "#124: <cite>After the Myths Went Home</cite>",
	"blurb": "<p>Humanity calls forth old heroes and gods, only to decide they're more trouble than they're worth. Written by Robert Silverberg.</p>",
	"duration": 1842
	},
	{
	"code": "125-Rules",
	"heading": "#125: <cite>The Rules of the Road</cite>",
	"blurb": "<p>An alien ship lands in the desert. None who enter survive&mdash;until one man finds within it the awful secrets of the universe. Written by Norman Spinrad.</p>",
	"notes": "imprisonment, psychological torture",
	"duration": 1821,
	"banger": true
	},
	{
	"code": "131-Racer",
	"heading": "#131: <cite>The Racer</cite>",
	"blurb": "<p>One of the greatest drivers of a near-future death race comes to grips with how people really feel about his murderous deeds. Written by Ib Melchior.</p>",
	"notes": "animal deaths, car crash",
	"duration": 1781
	},
	{
	"code": "133-None",
	"heading": "#133: <cite>None Before Me</cite>",
	"blurb": "<p>A collector of the very best of everything obsesses over an exquisitely life-like dollhouse. Written by Sidney Carroll.</p>",
	"notes": "fatphobia",
	"duration": 1855,
	"banger": true
	},
	{
	"code": "139-Eternal",
	"heading": "#139: <cite>The Eternal Machines</cite>",
	"blurb": "<p>The lonely warden of a scrap planet builds a museum of machines he intends to outlast humanity. Written by William Spencer.</p>",
	"duration": 1854
	},
	{
	"code": "147-Maze",
	"heading": "#147: <cite>The Maze</cite>",
	"blurb": "<p>A stranded scientist experimenting on mice finds herself slipping into the centre of the maze. Written by Stuart Dybek.</p>",
	"notes": "animal cannibalism, bestiality, imprisonment, rape, rotting animals, torture",
	"duration": 1842,
	"banger": true
	},
	{
	"code": "149-Worm",
	"heading": "#149: <cite>The Worm</cite>",
	"blurb": "<p>An old man refuses to leave his home even as it's crushed by a giant worm. Written by David Keller.</p>",
	"duration": 1776,
	"banger": true
	},
	{
	"code": "160-Phoenix",
	"heading": "#160: <cite>Letter to a Phoenix</cite>",
	"blurb": "<p>An immortal writes a letter of advice from over a hundred millennia of solitude and thought. Written by Fredric Brown.</p>",
	"duration": 1859,
	"banger": true
	},
	{
	"code": "162-Ladder",
	"heading": "#162: <cite>The Vertical Ladder</cite>",
	"blurb": "<p>A young boy, dared by his peers, climbs the ladder of a towering gasometer. Written by William Sansom.</p>",
	"notes": "abandonment, ableism, child endangered",
	"duration": 1838,
	"banger": true
	},
	{
	"code": "165-Restricted",
	"heading": "#165: <cite>Restricted Area</cite>",
	"blurb": "<p>A spaceship crew scientifically investigate an eerily perfect planet. Written by Robert Sheckley.</p>",
	"duration": 1838
	},
	{
	"code": "169-Worp",
	"heading": "#169: <cite>The Available Data on the Worp Reaction</cite>",
	"blurb": "<p>An intellectually disabled boy gathers scrap from the city junkyard and builds a machine that confounds all observers. Written by Lion Miller.</p>",
	"duration": 1850
	},
	{
	"code": "176-Transformer",
	"heading": "#176: <cite>Transformer</cite>",
	"blurb": "<p>The quaint railway town of Elm Point is switched off, boxed away, and sold on. Written by Chad Oliver.</p>",
	"duration": 1800
	},
	{
	"code": "237-Star_Gift",
	"heading": "#237: <cite>The Star</cite> and <cite>The Gift</cite>",
	"blurb": "<p>An apocalyptic blaze&mdash;a guiding star. A boy receives a wondrous Christmas gift. Written by Arthur C.&thinsp;Clarke and Ray Bradbury.</p>",
	"duration": 1773
	}
]
},
{
"code": "MsT",
"heading": "<cite>The Mysterious Traveler</cite>",
"blurb": "<p>A 1943&ndash;52 anthology of horror stories hosted and narrated by the titular Mysterious Traveler riding a train racing through the night.</p>",
"source": "<a href=\"https://archive.org/details/OTRR_Mysterious_Traveler_Singles\" rel=\"external\">Internet Archive</a>",
"copyrightSafe": true,
"shows": [
	{
	"code": "111-Locomotive",
	"heading": "#111: <cite>The Locomotive Ghost</cite>",
	"blurb": "<p>Two men derail and rob a payday train, only to suffer the wrath of the Judgement Special&mdash;a ghostly train that hunts those who defile the railways.</p>",
	"notes": "asphyxiation, gunshots (6:44, 7:28), rail crash, paranoia",
	"duration": 1747,
	"banger": true
	},
	{
	"code": "256-Red",
	"heading": "#256: <cite>The Lady in Red</cite>",
	"blurb": "<p>A reporter follows a trail of mob murders attended by a mysterious woman in a striking red dress.</p>",
	"notes": "alcohol, fall death, gunshots (4:38&ndash;40, 4:50&ndash;53, 24:06)",
	"duration": 1735
	}
]
},
{
"code": "Nf",
"heading": "<cite>Nightfall</cite>",
"blurb": "<p>A 1980&ndash;83 Canadian series of original and adapted horror stories created by Bill Howell.</p>",
"source": "<a href=\"https://archive.org/details/CBC_NightfallOTR\" rel=\"external\">Internet Archive</a>",
"shows": [
	{
	"code": "003-Homerville",
	"heading": "#3: <cite>Welcome to Homerville</cite>",
	"blurb": "<p>A trucker follows a sinister radio siren's call.</p>",
	"notes": "truck crash",
	"duration": 1707
	},
	{
	"code": "014-Ship",
	"heading": "#14: <cite>The Stone Ship</cite>",
	"blurb": "<p>A ship finds a massive vessel of stone out on the open sea, full of treasures and monsters. Adapted from a story by William Hope Hodgson.</p>",
	"notes": "drowning, gunshots (19:24&ndash;29)",
	"duration": 1519
	},
	{
	"code": "018-Ringing",
	"heading": "#18: <cite>Ringing the Changes</cite>",
	"blurb": "<p>Honeymooners in tiny coastal town find the ocean missing, the people unwelcoming, and the bells all ringing louder every hour.</p>",
	"notes": "break-in, forced stripping, mob attack, sexual assault (themes?)",
	"duration": 1683,
	"banger": true
	},
	{
	"code": "034-Hell",
	"heading": "#34: <cite>The Book of Hell</cite>",
	"blurb": "<p>Three publishers read the &ldquo;Book of Hell&rdquo;, an account of infernal torment written by a man who's been dead for years.</p>",
	"notes": "explosion (24:56), injections, involuntary medical experiments",
	"duration": 1729,
	"banger": true
	},
	{
	"code": "042-Father",
	"heading": "#42: <cite>In the Name of the Father</cite>",
	"blurb": "<p>A grieving writer recovers in an old fishing town with a deep link to the sharks that swim its waters.</p>",
	"notes": "implied bestiality, parental death, pregnancy",
	"duration": 1757
	},
	{
	"code": "062-Sea",
	"heading": "#62: <cite>The Road Ends at the Sea</cite><!--title listed in the Internet Archive collection appears to be incorrect-->",
	"blurb": "<p>A couple of lighthouse keepers' solitude is broken by the arrival of an old &ldquo;friend&rdquo;&mdash;and romantic rival&mdash;and a massive black freighter just offshore.</p>",
	"duration": 1734
	},
	{
	"code": "075-Lazarus",
	"heading": "#75: <cite>Lazarus Rising</cite>",
	"blurb": "<p>A reporter investigates a small-town resurrection and slowly uncovers the festering truth.</p>",
	"notes": "arson, phone eavesdropping",
	"duration": 1680
	}
]
},
{
"code": "PC",
"heading": "the Pegāna Cycle",
"blurb": "<p>Lord Dunsany's mythology cycle of weird and terrible gods and their deeds and misdeeds: <cite>The Gods of Pegāna</cite> (1905), <cite>Time and the Gods</cite> (1906), and the dream-stories collected in <cite>Tales of Three Hemispheres</cite> (1919).</p>",
"source": "<a href=\"https://librivox.org\" rel=\"external\">LibriVox</a>",
"copyrightSafe": true,
"shows": [
	{
	"code": "01-GoP_1",
	"heading": "book 1: <cite>The Gods of Pegāna</cite>, part 1",
	"blurb": "<p>From the preface to <cite>Revolt of the Home Gods</cite>. Read by Jason Mills.</p>",
	"duration": 2261
	},
	{
	"code": "02-GoP_2",
	"heading": "book 1: <cite>The Gods of Pegāna</cite>, part 2",
	"blurb": "<p>From <cite>Of Dorozhand</cite> to <cite>Of How the Gods Whelmed Sidith</cite>. Read by Jason Mills.</p>",
	"duration": 1708
	},
	{
	"code": "03-GoP_3",
	"heading": "book 1: <cite>The Gods of Pegāna</cite>, part 3",
	"blurb": "<p>From <cite>Of How Imbaun Became High Prophet in Aradec of All the Gods Save One</cite> to <cite>The Bird of Doom and the End</cite>. Read by Jason Mills.</p>",
	"duration": 1731
	},
	{
	"code": "04-TG_1",
	"heading": "book 2: <cite>Time and the Gods</cite>, part 1",
	"blurb": "<p>From the preface to <cite>A Legend of the Dawn</cite>. Read by KentF.</p>",
	"duration": 1889
	},
	{
	"code": "05-TG_2",
	"heading": "book 2: <cite>Time and the Gods</cite>, part 2",
	"blurb": "<p>From <cite>The Vengeance of Men</cite> to <cite>The Caves of Kai</cite>. Read by KentF, RedToby, and hefyd.</p>",
	"duration": 2233
	},
	{
	"code": "06-TG_3",
	"heading": "book 2: <cite>Time and the Gods</cite>, part 3",
	"blurb": "<p>From <cite>The Sorrow of Search</cite> to <cite>For the Honour of the Gods</cite>. Read by Le Scal and hefyd.</p>",
	"duration": 2238
	},
	{
	"code": "07-TG_4",
	"heading": "book 2: <cite>Time and the Gods</cite>, part 4",
	"blurb": "<p>From <cite>Night and Morning</cite> to <cite>The South Wind</cite>. Read by Måns Broo.</p>",
	"duration": 1445
	},
	{
	"code": "08-TG_5",
	"heading": "book 2: <cite>Time and the Gods</cite>, part 5",
	"blurb": "<p>From <cite>In the Land of Time</cite> to <cite>The Dreams of the Prophet</cite>. Read by RedToby and hefyd.</p>",
	"duration": 2274
	},
	{
	"code": "09-TG_6",
	"heading": "book 2: <cite>Time and the Gods</cite>, part 6",
	"blurb": "<p><cite>The Journey of the King</cite>, parts &#x2160;&ndash;&#x2166;. Read by Kevin McAsh, Måns Broo, and Robin Cotter.</p>",
	"notes": "alcohol",
	"duration": 2485
	},
	{
	"code": "10-TG_7",
	"heading": "book 2: <cite>Time and the Gods</cite>, part 7",
	"blurb": "<p><cite>The Journey of the King</cite>, parts &#x2167;&ndash;&#x216a;. Readings by Robin Cotter and Elmensdorp.</p>",
	"notes": "alcohol",
	"duration": 2346
	},
	{
	"code": "11-Yann",
	"heading": "dreams: <cite>Idle Days on the Yann</cite>",
	"blurb": "<p>A dreamer travels the river Yann aboard the ship <i>Bird of the River</i>, stopping in bizarre cities of wonders and monsters along the way. Read by Alex Clarke.</p>",
	"notes": "alcohol",
	"duration": 2531,
	"banger": true
	},
	{
	"code": "12-Shop",
	"heading": "dreams: <cite>A Shop in Go-By Street</cite>",
	"blurb": "<p>The dreamer returns to the Yann via a strange shop of myths and rareties, seeking his friends on the <i>Bird of the River</i>. Read by Ed Humpal.</p>",
	"notes": "alcohol",
	"duration": 1216,
	"banger": true
	},
	{
	"code": "13-Avenger",
	"heading": "dreams: <cite>The Avenger of Perdóndaris</cite>",
	"blurb": "<p>The dreamer returns once more and visits the palace of Singanee, avenger of ruined Perdóndaris, and grows weary of dreams. Read by Ed Humpal.</p>",
	"duration": 2068,
	"banger": true
	}
]
},
{
"code": "QP",
"heading": "<cite>Quiet, Please</cite>",
"blurb": "<p>A 1947&ndash;49 radio horror anthology written by Wyllis Cooper. It starred radio announcer Ernest Chappell (his only acting role), who often spoke informally and directly to the audience.</p>",
"source": "<a href=\"https://www.quietplease.org\" rel=\"external\">quietplease.org</a>",
"copyrightSafe": true,
"shows": [
	{
	"code": "001-Nothing",
	"heading": "#1: <cite>Nothing Behind the Door</cite>",
	"blurb": "<p>Bank robbers try to hide the money in a mountain shed that contains nothing. Literally <em>nothing</em>.</p>",
	"duration": 1770,
	"banger": true
	},
	{
	"code": "006-Tomorrow",
	"heading": "#6: <cite>I Remember Tomorrow</cite>",
	"blurb": "<p>A time-traveller explains why three criminals <em>must</em> be stopped&mdash;and why <em>you</em> will stop them.</p>",
	"notes": "alcohol, betrayal, gunshots (26:16)",
	"duration": 1688
	},
	{
	"code": "007-Inquest",
	"heading": "#7: <cite>Inquest</cite>",
	"blurb": "<p>A heartless man faces a murder inquest like no other&mdash;a jury in costume, an audience of millions, and the mysterious Coroner&hellip;</p>",
	"notes": "ableism, broken arm (poorly healed), domestic abuse, financial abuse",
	"duration": 1730
	},
	{
	"code": "009-Mile",
	"heading": "#9: <cite>A Mile High and a Mile Deep</cite> (script read)",
	"blurb": "<p>The Earth takes its due in the mines far below Butte, Montana&mdash;the city <q>a mile high and a mile deep</q>. An amateur reading of this lost episode's script.</p>",
	"notes": "claustrophobia, darkness",
	"duration": 1615,
	"banger": true
	},
	{
	"code": "019-Obscura",
	"heading": "#19: <cite>Camera Obscura</cite>",
	"blurb": "<p>A remorseless killer's victim haunts him through the miniature world of the camera obscura.</p>",
	"notes": "abandonment, drowning",
	"duration": 1431
	},
	{
	"code": "022-Graveyard",
	"heading": "#22: <cite>Take Me Out to the Graveyard</cite>",
	"blurb": "<p>A taxi driver tells how all his passengers want to go to the graveyard&mdash;and how they die along the way.</p>",
	"duration": 1474,
	"banger": true
	},
	{
	"code": "024-Kill",
	"heading": "#24: <cite>Kill Me Again</cite>",
	"blurb": "<p>A decent man finds himself being murdered over and over again after making a deal with the devil.</p>",
	"notes": "gunshots (2:16)",
	"duration": 1433
	},
	{
	"code": "027-Die",
	"heading": "#27: <cite>Some People Don't Die</cite>",
	"blurb": "<p>Archaeologists seek the ruins of an ancient society in a desert mesa, only to find the people aren't entirely dead.</p>",
	"notes": "desiccation, imprisonment, racism, snake bite",
	"duration": 1473,
	"banger": true
	},
	{
	"code": "030-Rain",
	"heading": "#30: <cite>Rain on New Year's Eve</cite>",
	"blurb": "<p>An overworked horror screenwriter makes monsters for his micro-managing, incompetent director.</p>",
	"duration": 1472
	},
	{
	"code": "034-Light",
	"heading": "#34: <cite>Green Light</cite>",
	"blurb": "<p>A railwayman tells the tale of how he lost his leg in an impossible train crash.</p>",
	"duration": 1431
	},
	{
	"code": "037-Whence",
	"heading": "#37: <cite>Whence Came You?</cite>",
	"blurb": "<p>An archaeologist meets the past in Cairo and entombed below the desert.</p>",
	"notes": "bite injury, claustrophobia, darkness",
	"duration": 1767,
	"banger": true
	},
	{
	"code": "038-Coat",
	"heading": "#38: <cite>Wear the Dead Man's Coat</cite>",
	"blurb": "<p>A homeless beggar kills a man for his coat, then remembers a saying: <q>Wear the dead man's coat, none will take note</q>.</p>",
	"notes": "alcohol, betrayal",
	"duration": 1752,
	"banger": true
	},
	{
	"code": "040-Send",
	"heading": "#40: <cite>Never Send to Know</cite>",
	"blurb": "<p>A ghost hires a skeptical <abbr>PI</abbr> to solve his own murder.</p>",
	"notes": "blood, gunshot (2:20), implied suicide",
	"duration": 1715
	},
	{
	"code": "042-Forget",
	"heading": "#42: <cite>A Night to Forget</cite>",
	"blurb": "<p>A radio actor has nightmares of his impending death that slowly seep into reality.</p>",
	"notes": "funeral arrangements, gunshots (26:10&ndash;26:16), murder",
	"duration": 1746
	},
	{
	"code": "045-Twelve",
	"heading": "#45: <cite>12 to 5</cite>",
	"blurb": "<p>A graveyard shift radio <abbr title=\"disc jockey\">DJ</abbr> has an unusual visitor&mdash;a news-reader who reads the future.</p>",
	"duration": 1791
	},
	{
	"code": "046-Clarissa",
	"heading": "#46: <cite>Clarissa</cite>",
	"blurb": "<p>A man seeks lodging at a decrepit house inhabited by an ancient father and his unseen daughter.</p>",
	"duration": 1751
	},
	{
	"code": "047-Thirteen",
	"heading": "#47: <cite>Thirteen and Eight</cite>",
	"blurb": "<p>An opportunistic news photographer is plagued by a photobomber only he can see.</p>",
	"notes": "fall injury, gunshots (7:47), traffic death",
	"duration": 1671
	},
	{
	"code": "048-Mountain",
	"heading": "#48: <cite>How Beautiful Upon the Mountain</cite>",
	"blurb": "<p>Two men seek to summit Everest&mdash;giant mountain&mdash;home of the gods&mdash;beautiful, deadly bride.</p>",
	"duration": 1763
	},
	{
	"code": "050-Ray",
	"heading": "#50: <cite>Gem of Purest Ray</cite>",
	"blurb": "<p>A murderer explains his motive: his victims were agents of an apocalyptic Atlantean conspiracy.</p>",
	"notes": "betrayal, conspiracism, paranoia",
	"duration": 1759
	},
	{
	"code": "055-Lilies",
	"heading": "#55: <cite>Let the Lilies Consider</cite>",
	"blurb": "<p>A suspected murderer recounts the triangle of love and hate between he, his wife, and his beloved lilies.</p>",
	"notes": "gunshot (19:01), neglect, suicide",
	"duration": 1408
	},
	{
	"code": "058-Planet",
	"heading": "#58: <cite>The Man Who Stole a Planet</cite>",
	"blurb": "<p>Archaeologists find the planet Earth in an ancient Mayan temple.</p>",
	"notes": "domestic abuse, natural disaster",
	"duration": 1454
	},
	{
	"code": "060-Fourble",
	"heading": "#60: <cite>The Thing on the Fourble Board</cite>",
	"blurb": "<p>An oil derrick pulls an invisible creature from the depths of the earth.</p>",
	"notes": "betrayal, gunshots (18:58&ndash;18:59), spiders?",
	"duration": 1403,
	"banger": true
	},
	{
	"code": "065-Symphony",
	"heading": "#65: <cite>Symphony in D Minor</cite>",
	"blurb": "<p>A vengeful hypnotist uses Cesar Franck's <cite>Symphony in D Minor</cite>, the series' theme music, to wreak revenge on his adulterous wife and her lover.</p>",
	"notes": "fall death, stab death",
	"duration": 1466,
	"banger": true
	},
	{
	"code": "067-Lamp",
	"heading": "#67: <cite>Light the Lamp for Me</cite>",
	"blurb": "<p>An old man's oil lamp lets him travel to the past as often as he likes&mdash;but only once to the future.</p>",
	"notes": "disease, loneliness",
	"duration": 1758
	},
	{
	"code": "068-Meet",
	"heading": "#68: <cite>Meet John Smith, John</cite>",
	"blurb": "<p>A man gives to a beggar who just so happens to share his name&mdash;a lot more than his name, in fact.</p>",
	"notes": "adultery, alcohol, murder",
	"duration": 1710
	},
	{
	"code": "069-Cellar",
	"heading": "#69: <cite>Beezer's Cellar</cite>",
	"blurb": "<p>Bank robbers hide the loot in an allegedly haunted cellar, betting the legend will keep prying eyes away.</p>",
	"duration": 1755
	},
	{
	"code": "072-Souls",
	"heading": "#72: <cite>Calling All Souls</cite>",
	"blurb": "<p>Halloween: the dead rise to give a death row inmate one last chance to prove his innocence.</p>",
	"notes": "betrayal",
	"duration": 1715
	},
	{
	"code": "076-John",
	"heading": "#76: <cite>My Son, John</cite>",
	"blurb": "<p>A bereaved father begs a wise woman for any way to bring his son back&mdash;no matter the danger, the cost.</p>",
	"notes": "animal attacks, bite injury",
	"duration": 1680,
	"banger": true
	},
	{
	"code": "081-Snow",
	"heading": "#81: <cite>The Time of the Big Snow</cite>",
	"blurb": "<p>Two young children lose their way in a blizzard and discover the truth behind the old saying about snow: <q>The old woman's picking her geese</q>.</p>",
	"duration": 1694
	},
	{
	"code": "083-Murder",
	"heading": "#83: <cite>Is This Murder?</cite>",
	"blurb": "<p>An expert on prosthetic limbs struggles to reason with his assistant, who's obsessed with making an artificial man.</p>",
	"notes": "alcohol, betrayal, murder?",
	"duration": 1721
	},
	{
	"code": "084-Summer",
	"heading": "#84: <cite>Summer Goodbye</cite>",
	"blurb": "<p>Robbers escape from the police&mdash;but can't seem to escape the hitch-hiker they see over and over again.</p>",
	"notes": "brushfire, gunshots (22:20, 23:48, 24:17), unhealthy romantic relationship",
	"duration": 1739
	},
	{
	"code": "085-Northern",
	"heading": "#85: <cite>Northern Lights</cite>",
	"blurb": "<p>Inventors of a time machine discover the monstrous song of the aurora borealis.</p>",
	"notes": "caterpillars, mind control",
	"duration": 1729,
	"banger": true
	},
	{
	"code": "088-Ideas",
	"heading": "#88: <cite>Where Do You Get Your Ideas?</cite>",
	"blurb": "<p>Wyllis Cooper, the series' writer, meets a barfly who wonders where he gets his ideas&mdash;and <em>insists</em> Cooper listens to his own strange story.</p>",
	"notes": "gunshot (12:25)",
	"duration": 1499
	},
	{
	"code": "092-Wines",
	"heading": "#92: <cite>The Smell of High Wines</cite>",
	"blurb": "<p>A distillery worker recalls the dark moments of his life where the smell of high wines presaged death.</p>",
	"notes": "blood, stab death, strangulation, suicide?",
	"duration": 1620,
	"banger": true
	},
	{
	"code": "099-Stars",
	"heading": "#99: <cite>The Other Side of the Stars</cite>",
	"blurb": "<p>A treasure hunter and his companion investigate an ancient well and find music from beyond the stars.</p>",
	"notes": "animal deaths, gunshots (13:07), possession?",
	"duration": 1763
	},
	{
	"code": "100-Morning",
	"heading": "#100: <cite>The Little Morning</cite>",
	"blurb": "<p>A hitch-hiker returns to his old home taht burnt down with his beloved inside to sing the song they promised to duet on every birthday.</p>",
	"notes": "drowning, suicide",
	"duration": 1706
	},
	{
	"code": "103-Tanglefoot",
	"heading": "#103: <cite>Tanglefoot</cite>",
	"blurb": "<p>A man breeds giant flies whose hunger grows in proportion&hellip; and out of control.</p>",
	"notes": "animal death, betrayal",
	"duration": 1718
	},
	{
	"code": "106-Quiet",
	"heading": "#106: <cite>Quiet, Please</cite>",
	"blurb": "<p>The last man alive tells a story of love, hate, bigotry, supremacism, and war&mdash;all-consuming war.</p>",
	"duration": 1783
	}
]
},
{
"code": "RCP",
"heading": "<cite>Radio City Playhouse</cite>",
"blurb": "<p>A 1948&ndash;50 anthology of original radio dramas and adaptations, including a few with a touch of the supernatural.</p>",
"source": "<a href=\"https://archive.org/details/radio_city_playhouse_202008\" rel=\"external\">Internet Archive</a>",
"copyrightSafe": true,
"shows": [
	{
	"code": "58-Wind",
	"heading": "#58: <cite>The Wind</cite>",
	"blurb": "<p>A former pilot is deathly afraid of the wind, which he believes is out to kill him, but his friends can't&mdash;or won't&mdash;help. Adapted from a story by Ray Bradbury.</p>",
	"notes": "sanism",
	"duration": 1747,
	"banger": true
	}
]
},
{
"code": "SET",
"heading": "<cite>Seeing Ear Theater</cite>",
"blurb": "<p>A turn-of-the-millennium online sci-fi and horror radio play revival that produced both originals and adaptations.</p><!--episode numbers are taken from the internet archive (from actual file names, not the numbers in the audio player's file list), but may be incorrect-->",
"source": "<a href=\"https://archive.org/details/SETheater\" rel=\"external\">Internet Archive</a>",
"shows": [
	{
	"code": "12-Pole_pt1",
	"heading": "#12: <cite>An Elevator and a Pole</cite>, part 1",
	"blurb": "<p>One group gathers round a weird pole in the middle of nowhere; another's stuck in an elevator. They all struggle to understand and control their fates.</p>",
	"notes": "broken neck, mental breakdown, falling elevator",
	"duration": 1729,
	"banger": true
	},
	{
	"code": "13-Pole_pt2",
	"heading": "#13: <cite>An Elevator and a Pole</cite>, part 2",
	"blurb": "<p>One group gathers round a weird pole in the middle of nowhere; another's stuck in an elevator. They all struggle to understand and control their fates.</p>",
	"notes": "descriptions of gore, fall death, vomiting, suicide",
	"duration": 1666,
	"banger": true
	},
	{
	"code": "18-Titanic",
	"heading": "#18: <cite>Titanic Dreams</cite>",
	"blurb": "<p>A survivor of the Titanic drifts into the future, where she contemplates her regrets of that disastrous night. Adapted from a story by Robert Olen Butler.</p>",
	"notes": "suicide?",
	"duration": 2611
	},
	{
	"code": "29-Facade",
	"heading": "#29: <cite>Facade</cite>",
	"blurb": "<p>Young hotshot advertisers snort their dead friend's ashes to receive creative inspiration, to bring her back, to help their pitches, to take over their lives.</p>",
	"notes": "ableism, addiction, car accident, human sacrifice, possession, sexual exploitation",
	"duration": 1940,
	"banger": true
	},
	{
	"code": "36-Shade",
	"heading": "#36: <cite>In the Shade of the Slowboat Man</cite>",
	"blurb": "<p>A vampire returns to her mortal love on his nursing-home deathbed to reminisce and say goodbye. Adapted from a story by Dean Wesley Smith.</p>",
	"notes": "abandonment, infertility",
	"duration": 2079,
	"banger": true
	},
	{
	"code": "37-Choke",
	"heading": "#37: <cite>Greedy Choke Puppy</cite>",
	"blurb": "<p>A fiery student of Trinidadian folklore investigates the tale of the soucouyant, a skin-stealing vampire her grandma warns about. Adapted from a story by Nalo Hopkinson.</p>",
	"notes": "infanticide",
	"duration": 2201
	},
	{
	"code": "43_44-Emily",
	"heading": "#43 and #44: <cite>Emily 501</cite>",
	"blurb": "<p>An exo-archaeologist discovers that the ancient language she's found isn't as dead as it seems.</p>",
	"notes": "body horror, language loss, mental breakdown",
	"duration": 2438,
	"banger": true
	},
	{
	"code": "53_54-Propagation",
	"heading": "#53 and #54: <cite>Propagation of Light in a Vacuum</cite>",
	"blurb": "<p>A space traveller struggles to stay sane in the world beyond the speed of light&mdash;with the help of his imaginary wife.</p>",
	"notes": "drug overdose, murder-suicide, stabbing, starvation",
	"duration": 2817
	},
	{
	"code": "85-Syndrome",
	"heading": "#85: <cite>The Oblivion Syndrome</cite>",
	"blurb": "<p>A void-cartographer gives up on survival when his ship is damaged, leaving it to the ship's <abbr>AI</abbr> and an interstellar freakshow to restore his will to live.</p>",
	"notes": "ableism, voice removal",
	"duration": 1673
	},
	{
	"code": "88-Sun",
	"heading": "#88: <cite>Into The Sun</cite>",
	"blurb": "<p>A starship doctor finds himself alone as his vessel races into the closest star. Starring Mark Hamill.</p>",
	"notes": "helplessness, live burial",
	"duration": 1205
	}
]
},
{
"code": "SNM",
"heading": "<cite>Sleep No More</cite>",
"blurb": "<p>A 1956&ndash;57 anthology of short horror stories read by actor Nelson Olmsted after tightening budgets started to make full radio dramas infeasible.</p>",
"source": "<a href=\"https://archive.org/details/sleep_no_more_radio\" rel=\"external\">Internet Archive</a>",
"copyrightSafe": true,
"shows": [
	{
	"code": "05-Hill_Hat",
	"heading": "#5: <cite>Over the Hill</cite> and <cite>The Man in the Black Hat</cite>",
	"blurb": "<p>A delusional man &ldquo;escapes&rdquo; his nagging wife. A gambler meets a stranger who gives him unnatural luck. Written by Michael Fessier.</p>",
	"notes": "guillotine death, implied domestic violence",
	"duration": 1458
	},
	{
	"code": "15-Beelzy_Book",
	"heading": "#15: <cite>Thus I Refute Beelzy</cite><!--Note: show title in source uses the wrong name (\"Bealsley\" instead of \"Beelzy\")--> and <cite>The Bookshop</cite>",
	"blurb": "<p>A boy's imaginary friend takes offense at his cruel father. A struggling writer finds a shop of impossible books. Written by John Collier and Nelson S.&thinsp;Bond.</p>",
	"notes": "child abuse, dismemberment, traffic accident",
	"duration": 1713,
	"banger": true
	},
	{
	"code": "17-Gray_Gift",
	"heading": "#17: <cite>The Woman in Gray</cite> and <cite>A Suspicious Gift</cite>",
	"blurb": "<p>A man invents a spectre of hatred. A stranger gives a too-perfect gift. Written by Walker G.&thinsp;Everett and Algernon Blackwood.</p>",
	"notes": "apparent suicide, fall death, traffic accidents",
	"duration": 1713
	}
]
},
{
"code": "Sus",
"heading": "<cite>Suspense</cite>",
"blurb": "<p>A 1940&ndash;62 anthology made by a bevy of talent. Most shows featured ordinary people thrust into suspenseful&mdash;even supernatural&mdash;situations.</p>",
"source": "<a href=\"https://archive.org/details/OTRR_Suspense_Singles\" rel=\"external\">Internet Archive</a>",
"copyrightSafe": true,
"shows": [
	{
	"code": "011-Hitch",
	"heading": "#11: <cite>The Hitch-Hiker</cite>",
	"blurb": "<p>A man driving across the <abbr>US</abbr> sees the same hitch-hiker calling for him again and again&hellip; and again&hellip; Written by Lucille Fletcher, introduction by and starring Orson Welles.</p>",
	"notes": "car crash, obsession, traffic death",
	"duration": 1752,
	"banger": true
	},
	{
	"code": "059-Game",
	"heading": "#59: <cite>The Most Dangerous Game</cite>",
	"blurb": "<p>A big-game hunter has the tables turned when he washes up on an island owned by a man-hunter. Starring Orson Welles.</p>",
	"notes": "ableism, animal death, man devoured by dogs, racism, stab death",
	"duration": 1797,
	"banger": true
	},
	{
	"code": "087-Barastro",
	"heading": "#87: <cite>The Marvellous Barastro</cite>",
	"blurb": "<p>The world's second-greatest magician announces his plan to take revenge on the first&mdash;his mirror image. Starring Orson Welles.</p>",
	"notes": "alcohol adverts, betrayal, stalking, strangulation",
	"duration": 1781
	},
	{
	"code": "092-Donovan_pt1",
	"heading": "#92: <cite>Donovan's Brain</cite>, part 1",
	"blurb": "<p>A scientist rescues a wealthy businessman's life by preserving his brain&mdash;only to fall under its malign sway. Starring Orson Welles.</p>",
	"notes": "alcohol adverts, animal bite, animal death, animal experimentation, betrayal, human experimentation, institutionalisation, mind control, paranoia",
	"duration": 1767
	},
	{
	"code": "093-Donovan_pt2",
	"heading": "#93: <cite>Donovan's Brain</cite>, part 2",
	"blurb": "<p>A scientist rescues a wealthy businessman's life by preserving his brain&mdash;only to fall under its malign sway. Starring Orson Welles.</p>",
	"notes": "alcohol adverts, betrayal, human experimentation, institutionalisation, mind control, injection, non-consensual surgery, strangulation, suicide?",
	"duration": 1758
	},
	{
	"code": "094-Fugue",
	"heading": "#94: <cite>Fugue in C Minor</cite>",
	"blurb": "<p>A music-loving widower remarries a woman who shares his passion&hellip; his children have other ideas. Written by Lucille Fletcher, starring Vincent Price and Ida Lupino.</p>",
	"notes": "alcohol adverts, asphyxiation, claustrophobia, heart attack",
	"duration": 1774,
	"banger": true
	},
	{
	"code": "143-August",
	"heading": "#143: <cite>August Heat</cite>",
	"blurb": "<p>Two strangers share premonitions of their fates on a brutally hot August day. Starring Ronald Colman.</p>",
	"notes": "alcohol adverts",
	"duration": 1776
	},
	{
	"code": "165-Dunwich",
	"heading": "#165: <cite>The Dunwich Horror</cite>",
	"blurb": "<p>A union of human woman and alien god produces terrible, eldritch offspring. Adapted from a story by H.&thinsp;P.&thinsp;Lovecraft, starring Robert Colman.</p>",
	"notes": "ableism, alcohol adverts, animal attack, body horror, cattle mutilation",
	"duration": 1618
	},
	{
	"code": "222-Cypress",
	"heading": "#222: <cite>The House in Cypress Canyon</cite>",
	"blurb": "<p>A couple takes possession of a renovated house, only to find a dark presence taking possession of <em>them</em>.</p>",
	"notes": "alcohol adverts, bite injury, blood, murder-suicide",
	"duration": 1815,
	"banger": true
	},
	{
	"code": "224-Window",
	"heading": "#224: <cite>The Thing in the Window</cite>",
	"blurb": "<p>An actor claims he sees a dead body in the flat across the road; everyone else thinks he's mad. Written by Lucille Fletcher, starring Joseph Cotton.</p>",
	"notes": "alcohol adverts, betrayal, gaslighting, harassment, suicide",
	"duration": 1785
	},
	{
	"code": "259-Alphabet",
	"heading": "#259: <cite>Murder Aboard the Alphabet</cite>",
	"blurb": "<p>A ship's crew find their captain's obsession with orderliness harmless until they start disappearing&mdash;in alphabetical order.</p>",
	"notes": "alcohol adverts, disappearance at sea, implied execution, imprisonment, sanism",
	"duration": 1819
	},
	{
	"code": "300-Wallpaper",
	"heading": "#300: <cite>The Yellow Wallpaper</cite>",
	"blurb": "<p>A woman confined by her husband after a nervous breakdown starts to see things behind the wallpaper. Adapted from a story by Charlotte Perkins Gilman.</p>",
	"notes": "domestic abuse, mental breakdown",
	"duration": 1778
	},
	{
	"code": "346-Ghost",
	"heading": "#346: <cite>Ghost Hunt</cite>",
	"blurb": "<p>A skeptical radio <abbr>DJ</abbr> and a psychic investigator spend a night in a house nicknamed the &ldquo;Death Trap&rdquo;.</p>",
	"notes": "blood, hallucination?, suicide?",
	"duration": 1780,
	"banger": true
	},
	{
	"code": "379-Salvage",
	"heading": "#379: <cite>Salvage</cite>",
	"blurb": "<p>A pilot, his ex, and her husband get tangled in a fraught expedition to recover sunken gold from the Caribbean. Starring Van Johnson.</p>",
	"notes": "betrayal, gunshots (15:23, 20:05, 20:34&ndash;20:40), plane crash",
	"duration": 1800
	},
	{
	"code": "625-Classified",
	"heading": "#625: <cite>Classified Secret</cite>",
	"blurb": "<p>Spies match money, wits, and steel on an interstate bus, with deadly military secrets in the balance.</p>",
	"notes": "gunshots (21:36&ndash;37, 21:48)",
	"duration": 1778,
	"banger": true
	},
	{
	"code": "648-Waxwork",
	"heading": "#648: <cite>The Waxwork</cite>",
	"blurb": "<p>A nervy, desperate freelance journalist resolves to write about spending the night in a museum of wax serial killers. Starring William Conrad.</p>",
	"notes": "anxiety, claustrophobia, hallucinations?, hypnosis, panic attack, paranoia",
	"duration": 1725,
	"banger": true
	},
	{
	"code": "673-Key",
	"heading": "#673: <cite>Three Skeleton Key</cite>",
	"blurb": "<p>Three lighthouse keepers fall under siege from a terrifying swarm of rats. Starring Vincent Price.</p>",
	"notes": "ableism, animal deaths, bite injury, claustrophobia, isolation, mental breakdown",
	"duration": 1788
	},
	{
	"code": "674-Night",
	"heading": "#674: <cite>The Long Night</cite>",
	"blurb": "<p>A night shift air traffic controller must help a lost, scared, untested pilot who's running out of fuel and trapped above the clouds. Starring Frank Lovejoy.</p>",
	"notes": "implied child death, parental recklessness, smoking",
	"duration": 1852,
	"banger": true
	},
	{
	"code": "688-Present",
	"heading": "#688: <cite>Present Tense</cite>",
	"blurb": "<p>A death row inmate escapes execution via clock-stopping delusion. Starring Vincent Price.</p>",
	"notes": "axe murder, gas chamber, hijacking, home invasion, train derailment",
	"duration": 1768
	},
	{
	"code": "689-Peralta",
	"heading": "#689: <cite>The Peralta Map</cite>",
	"blurb": "<p>Treasure hunters contract a local guide to help them find an ancient, legendary, <em>haunted</em> gold mine.</p>",
	"notes": "abandonment, betrayal, fall injury, gunshots (25:25&ndash;25:27, 27:29&ndash;27:32)",
	"duration": 1745
	},
	{
	"code": "799-Deep",
	"heading": "#799: <cite>Deep, Deep is My Love</cite>",
	"blurb": "<p>A diver seeks solitude from his wife in the embrace of a golden lady under the sea.</p>",
	"notes": "animal death, asphyxiation, hallucination?, narcosis",
	"duration": 1046
	},
	{
	"code": "878-Lorelei",
	"heading": "#878: <cite>The Green Lorelei</cite>",
	"blurb": "<p>A writer becomes obsessed with a woman singing in the apartment upstairs, though the old man living there swears his wife is dead.</p>",
	"notes": "deceptively gaining entry to another person's home, eviction, institutionalisation, ransacking",
	"duration": 1460
	},
	{
	"code": "901-Door",
	"heading": "#901: <cite>The Black Door</cite>",
	"blurb": "<p>An archaeologist and his local guide seek an ancient Central American city and carelessly disturb what lies beyond the black door at its heart.</p>",
	"notes": "gunshots (16:41, 16:59, 17:43), racism",
	"duration": 1400
	},
	{
	"code": "916-Heads",
	"heading": "#916: <cite>Heads You Lose</cite>",
	"blurb": "<p>Detectives take a lucrative case to find a terminally-ill embezzler years after he should've died, and find themselves in over their heads.</p>",
	"notes": "cigarette ads, gunshots (19:08&ndash;19:29), entombment, suicide",
	"duration": 1409
	},
	{
	"code": "927-Infinity",
	"heading": "#927: <cite>That Real Crazy Infinity</cite>",
	"blurb": "<p>Two beatniks out of money take on a simple delivery job that ends up involving esoteric electronics and the voices of the past.</p>",
	"notes": "explosion (20:02&ndash;20:09)",
	"duration": 1383
	}
]
},
{
"code": "TF",
"heading": "<cite>Theater 5</cite>",
"blurb": "<p>A 1964&ndash;65 anthology of radio dramas broadcast by the <abbr title=\"American Broadcasting Company\">ABC</abbr> in an attempted revival of the radio play tradition after the rise of television.</p>",
"source": "<a href=\"https://archive.org/details/OTRR_Theater_Five_Singles\" rel=\"external\">Internet Archive</a>",
"copyrightSafe": true,
"shows": [
	{
	"code": "106-Strangers",
	"heading": "#106: <cite>Five Strangers</cite>",
	"blurb": "<p>Five stranded strangers use a cargo plane to beat flight delays when dense fog grounds all other craft, unaware of the fate awaiting them.</p>",
	"notes": "plane crash",
	"duration": 1311
	},
	{
	"code": "154-Honey",
	"heading": "#154: <cite>The Land of Milk and Honey</cite>",
	"blurb": "<p>A sinner ends up in heaven, where he gets all he ever wanted and never has to lift a finger&mdash;an exasperating paradise.</p>",
	"notes": "alcohol, betrayal, gunshots (5:32, 17:08)",
	"duration": 1249,
	"banger": true
	}
]
},
{
"code": "WC",
"heading": "<cite>The Weird Circle</cite>",
"blurb": "<p>A 1943&ndash;45 anthology that adapted classic horror and supernatural tales to the airwaves, with low budgets limiting the use of music and sound effects.</p>",
"source": "<a href=\"https://archive.org/details/OTRR_Weird_Circle_Singles\" rel=\"external\">Internet Archive</a>",
"copyrightSafe": true,
"shows": [
	{
	"code": "43-Bell",
	"heading": "#43: <cite>The Bell Tower</cite>",
	"blurb": "<p>An arrogant architect brings doom upon himself in the creation of an &ldquo;impossible&rdquo; bell tower. Adapted from a story by Herman Melville.</p>",
	"notes": "bludgeon death, crush death",
	"duration": 1518,
	"banger": true
	},
	{
	"code": "63-Mariner",
	"heading": "#63: <cite>The Ancient Mariner</cite>",
	"blurb": "<p>An old mariner recounts how slaying an albatross brought a fatal curse upon his crew. Adapted from a poem by Samuel Taylor Coleridge.</p>",
	"notes": "animal death, starvation",
	"duration": 1579
	}
]
},
{
"code": "Wil",
"heading": "<cite>The Willows</cite>",
"blurb": "<p>Two travellers become trapped on a river island in an eerie sea of willows where the walls of reality are fragile and vast things peer through. Written by Algernon Blackwood, first published in 1907, and read by Phil Chenevart for LibriVox.</p>",
"source": "<a href=\"https://librivox.org/the-willows-by-algernon-blackwood-2\" rel=\"external\">LibriVox</a>",
"copyrightSafe": true,
"shows": [
	{
	"code": "1-pt1",
	"heading": "part 1",
	"blurb": "<p>The narrator and his companion arrive at the island and shrug off warnings to leave.</p>",
	"duration": 2480
	},
	{
	"code": "2-pt2",
	"heading": "part 2",
	"blurb": "<p>Night falls and premonitions of eerie doom begin.</p>",
	"duration": 2066
	},
	{
	"code": "3-pt3",
	"heading": "part 3",
	"blurb": "<p>Disaster as the travellers' supplies go missing and their boat is damaged by unknown forces.</p>",
	"duration": 2128
	},
	{
	"code": "4-pt4",
	"heading": "part 4",
	"blurb": "<p>The horror strikes directly and the travellers confront a world beyond their own.</p>",
	"duration": 1739
	}
]
},
{
"code": "WT",
"heading": "<cite>The Witch's Tale</cite>",
"blurb": "<p>The first broadcast horror anthology (from 1931&ndash;38), written by Alonzo Deen Cole and hosted by the witch &ldquo;Old Nancy&rdquo; and her black cat, Satan.</p>",
"source": "<a href=\"https://radioechoes.com/?page=series&genre=OTR-Thriller&series=The%20Witchs%20Tale\" rel=\"external\">Radio Echoes</a>",
"copyrightSafe": true,
"shows": [
	{
	"code": "041-Bottle",
	"heading": "#41: <cite>The Wonderful Bottle</cite>",
	"blurb": "<p>A tramp buys a bottle that grants any wish&mdash;but his soul's forfeit if he can't sell it for <em>less</em> than he paid for it. Adapted from a story by Robert Louis Stevenson.</p>",
	"notes": "leprosy, parental death",
	"duration": 1775
	},
	{
	"code": "116-Mannequinne",
	"heading": "#116: <cite>Le Mannequinne</cite>",
	"blurb": "<p>A woman becomes paranoid that her husband's new artistic mannequin wants to replace her.</p>",
	"notes": "head wound, obsession, stab death",
	"duration": 1523
	}
]
},
{
"code": "WBP",
"heading": "<cite>With Book and Pipe</cite>",
"blurb": "<p>A mostly-lost anthology of radio stories probably broadcast in the 1940s, narrated by &ldquo;the Man with Book and Pipe&rdquo;; only one episode survives.</p>",
"source": "<a href=\"https://archive.org/details/UniqueOldTimeRadioEpisodes/With+Book+and+Pipe+1943.mp3\" rel=\"external\">Internet Archive</a>",
"copyrightSafe": true,
"shows": [
	{
	"code": "X-Rats",
	"heading": "#X: <cite>The Graveyard Rats</cite>",
	"blurb": "<p>A grave robber's work takes him into the burrows of a swarm of unnaturally large and intelligent rats. Adapted from a story by Henry Kuttner.</p>",
	"notes": "animal bite, asphyxiation, claustrophobia, entombment",
	"duration": 860,
	"banger": true
	}
]
},
{
"code": "XMO",
"heading": "<cite>X Minus One</cite>",
"blurb": "<p>5, 4, 3, 2&hellip; X minus 1. A 1955&ndash;58 anthology of original and adapted sci-fi stories, mostly scripted by Ernest Kinoy and George Lefferts; the successor to their earlier series <cite>Dimension X</cite>.</p>",
"source": "<a href=\"https://archive.org/details/OTRR_X_Minus_One_Singles\" rel=\"external\">Internet Archive</a>",
"copyrightSafe": true,
"shows": [
	{
	"code": "037-Cave",
	"heading": "#37: <cite>The Cave of Night</cite>",
	"blurb": "<p>The world unites to rescue an astronaut adrift in <q>the cave of night</q>&mdash;but he may not want to return. Adapted from a story by James E.&thinsp;Gunn.</p>",
	"notes": "suicide",
	"duration": 1700,
	"banger": true
	},
	{
	"code": "039-Skulking",
	"heading": "#39: <cite>Skulking Permit</cite>",
	"blurb": "<p>A utopian space colony cut off from Earth proves they're a model of Earth culture, including an official criminal. Adapted from a story by Robert Sheckley.</p>",
	"notes": "gunshots (12:31, 22:07)",
	"duration": 1738,
	"banger": true
	},
	{
	"code": "042-Dinosaur",
	"heading": "#42: <cite>A Gun for Dinosaur</cite>",
	"blurb": "<p>A time-travelling hunting guide explains why he's so selective about who he helps hunt dinosaur. Adapted from a story by L.&thinsp;Sprague de Camp.</p>",
	"notes": "adultery, brawl, gunshots (7:17, 11:02, 13:18&ndash;13:20, 15:29, 18:17, 19:36&ndash;38, 20:05)",
	"duration": 1776
	},
	{
	"code": "043-Tunnel",
	"heading": "#43: <cite>Tunnel Under the World</cite>",
	"blurb": "<p>A man wakes up on the 15th of June over and over&mdash;in a silent town utterly dominated by advertising. Adapted from a story by Frederik Pohl.</p>",
	"notes": "bludgeoning death, paranoia, surveillance",
	"duration": 1679
	},
	{
	"code": "063-Student",
	"heading": "#63: <cite>Student Body</cite>",
	"blurb": "<p>An all-consuming, rapidly-evolving species of alien mice poses an existential challenge to humanity. Adapted from a story by F.&thinsp;L.&thinsp;Wallace.</p>",
	"notes": "gunshots (21:55&ndash;57)",
	"duration": 1720
	},
	{
	"code": "065-Surface",
	"heading": "#65: <cite>Surface Tension</cite>",
	"blurb": "<p>Scientists invent a microscopic solution so humanity can live out its days before the apocalypse. Adapted from a story by James Blish.</p>",
	"duration": 1716
	},
	{
	"code": "068-Lifeboat",
	"heading": "#68: <cite>The Lifeboat Mutiny</cite>",
	"blurb": "<p>Two planetary surveyors buy an <abbr>AI</abbr> lifeboat that once belonged to an alien navy&mdash;and doesn't know the war's over. Adapted from a story by Robert Sheckley.</p>",
	"notes": "confinement, suicide threat",
	"duration": 1731,
	"banger": true
	},
	{
	"code": "071-Colony",
	"heading": "#71: <cite>Colony</cite>",
	"blurb": "<p>Everyday objects turn deadly against colonists on an alien planet. Adapted from a story by Philip K.&thinsp;Dick.</p>",
	"notes": "being digested alive, gunshots (10:28, 15:24&ndash;34, 19:16), strangulation",
	"duration": 1782,
	"banger": true
	},
	{
	"code": "092-Victim",
	"heading": "#92: <cite>The Seventh Victim</cite>",
	"blurb": "<p>After the last World War, peace is kept via man-hunt bloodsport, but not every contender is up to the task. Adapted from a story by Robert Sheckley.</p>",
	"notes": "betrayal, gunshots (2:32&ndash;52, 04:25&ndash;26, 11:46&ndash;48, 20:56)",
	"duration": 1333
	},
	{
	"code": "101-Category",
	"heading": "#101: <cite>The Category Inventor</cite>",
	"blurb": "<p>A musician replaced by a robot scrambles to invent a unique new job&mdash;just like everyone else. Adapted from a story by Arthur Sellings.</p>",
	"duration": 1282
	},
	{
	"code": "118-Light",
	"heading": "#118: <cite>The Light</cite>",
	"blurb": "<p>The first astronauts on the moon find old footprints in the dust. Adapted from a story by Poul Anderson.</p>",
	"duration": 1202
	}
]
}
];
