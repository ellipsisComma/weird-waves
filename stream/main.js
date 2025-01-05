/*jshint esversion: 11*/

/*
	WARNING: This is an outdated version of Weird Waves that exists ONLY to be used as a 
	browser source in the broadcast app OBS (and similar apps). OBS renders these sources 
	using an old, stripped-down version of Chrome, which lacks various features of modern 
	CSS and JavaScript. I don't know which features exactly (outside of a few, like the 
	:has() selector), because OBS makes it hard to access the browser console for browser 
	sources, so when I realised that Weird Waves was broken in OBS I reverted to the last 
	version I knew worked (from the end of October, 2023) and cut it down into this 
	stream-widget version while making minimal changes to the CSS and JavaScript.

	Because it's slightly outdated, it may have minor bugs or usability problems I later 
	fixed in the web version of Weird Waves. However, the app itself works fine.
*/

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
*/




/* ====================
	SCRIPT CONTROLS
==================== */

// relative path of the show audio folder
const paths = {
	"show": "../audio/shows/"
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
		{	"name": "Silver",	"code": "silver"	},
		{	"name": `Pico`,		"code": `pico`		},
		{	"name": `Sepia`,	"code": `sepia`		},
		{	"name": `Abyss`,	"code": `abyss`		},
		{	"name": `Retro`,	"code": `retro`		},
		{	"name": `Marrow`,	"code": `marrow`	},
		{	"name": `Org`,		"code": `org`		},
		{	"name": `Coalgas`,	"code": `coalgas`	},
		{	"name": `Root`,		"code": `root`		},
		{	"name": `Natron`,	"code": `natron`	},
		{	"name": `Gauze`,	"code": `gauze`		},
		{	"name": `Mycelia`,	"code": `mycelia`	},
		{	"name": `Cellar`,	"code": `cellar`	},
	],
	"fonts": [
		{	"name": "Serif",	"code": "serif"	},
		{	"name": "Sans",		"code": "sans"	}
	]
};



/* ===============
	PARAMETERS
=============== */

// HTML elements (or templated HTML elements) and their IDs
const page = {
// head
	"title": document.querySelector("title"),

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

// booth
	"playlist": "playlist",
	"playlistControls": "playlist-controls",
	"clearButton": "clear-button",
	"clearPlaylistControls": "clear-playlist-controls",

// archive
	"seriesList": "series-list",

// settings
	"themeButtons": "theme-buttons",
	"fontButtons": "font-buttons"
},
templateHTML = {
	"navLink": "nav-link",
	"showPositionControls": "show-position-controls",
	"toggle": "toggle",
	"themeButton": "theme-button",
	"fontButton": "font-button"
};

for (const [ref, element] of Object.entries(page)) if (typeof element === "string") page[ref] = document.getElementById(element);
for (const [ref, element] of Object.entries(templateHTML)) templateHTML[ref] = document.getElementById(element + "-template");

// prepare playlist show IDs from storage (if there are any)
let playlistIDs = window.localStorage.getItem("widgetPlaylist") ? JSON.parse(window.localStorage.getItem("widgetPlaylist")) : [];

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
	removedIDs = oldIDs.filter(id => !newIDs.includes(id));

	for (const id of addedIDs) addShow(id);
	for (const id of removedIDs) removeShow(id);

	playlistIDs = newIDs;
	reorderPlaylist();

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
	page.clearButton.setAttribute("aria-pressed", "true");
	page.clearPlaylistControls.removeAttribute("hidden");
	page.clearPlaylistControls.focus();
}

// hide controls for clearing playlist
function hideClearPlaylistControls() {
	page.clearButton.setAttribute("aria-pressed", "false");
	page.clearPlaylistControls.setAttribute("hidden", "");
}

// clear playlist and hide clear controls again, then load show (i.e. nothing)
function clearPlaylist() {
	for (const id of playlistIDs) document.querySelector('#' + id + ' [data-action="add-show"][aria-pressed="true"]')?.setAttribute("aria-pressed", "false");
	playlistIDs = [];
	page.playlist.replaceChildren();
	hideClearPlaylistControls();
	loadShow();
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
	newShow.setAttributes({
		"data-id": id,
		"data-file": showInArchive.dataset.file,
		"data-duration": showInArchive.dataset.duration
	});

// add show to playlist in booth and mark as added in archive
	page.playlist.appendChild(newShow);
	showInArchive.querySelector('[data-action="add-show"]').setAttribute("aria-pressed", "true");

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

// remove show from playlist in object and HTML; if the first show on the playlist was removed, load the new top show
function removeShow(id) {
	const index = playlistIDs.indexOf(id);

	page.playlist.children[index]?.remove();
	playlistIDs.splice(index, 1);
	document.querySelector("#" + id + ' [data-action="add-show"]').setAttribute("aria-pressed", "false");

	if (index === 0) loadShow();

	console.log("removed show: " + id);
}

// write show parts onto page and load show audio file; if playlist is empty, remove audio and show content and hide controls
function loadShow() {
	pauseAudio();
	page.loadedShow.replaceChildren();

	if (playlistIDs.length > 0) {
		const show = page.playlist.firstElementChild;

		page.audio.src = paths.show + show.dataset.id.split(`-`)[0] + "/" + show.dataset.id.split(`-`)[1] + "-" + show.dataset.file + ".mp3";
		page.audio.setAttribute("data-duration", show.dataset.duration);

		const loadedShowHeading = page.loadedShow.appendChild(document.createElement("h2"));
		loadedShowHeading.classList.add("show-heading");
		loadedShowHeading.innerHTML = show.querySelector(".show-heading").innerHTML;
		page.loadedShow.appendChild(show.querySelector(".show-content").cloneNode(true));
		page.controls.removeAttribute("hidden");

		seekTime(0);
		page.seekBar.value = 0;
		setTimestampFromSeconds(page.showTimeTotal, page.audio.dataset.duration);

		console.log("loaded show: " + show.dataset.id + "-" + show.dataset.file);
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
	const button = document.getElementById(id);

	button.setAttribute("aria-pressed", button.getAttribute("aria-pressed") === "false" ? "true" : "false");

	settings[key] = value;
}

// toggle between excluding (true) and including (false) copyright-unsafe material when adding random shows to playlist
function toggleCopyrightSafety() {
	settings.copyrightSafety = !settings.copyrightSafety;
	switchToggle("copyright-safety-toggle", "copyrightSafety", settings.copyrightSafety);
}

// toggle between hiding and showing show-content in Radio
function toggleFlatRadio() {
	settings.flatRadio = !settings.flatRadio;
	switchToggle("flat-radio-toggle", "flatRadio", settings.flatRadio);

	page.loadedShow.classList.toggle("flat-radio", settings.flatRadio);
}

// toggle between auto-playing (true) and not (false) a newly-loaded show when the previous show ends
function toggleAutoPlay() {
	settings.autoPlayNextShow = !settings.autoPlayNextShow;
	switchToggle("auto-play-toggle", "autoPlayNextShow", settings.autoPlayNextShow);
}

// toggle between open (true) and closed (false) show content notes
function toggleContentNotes() {
	settings.notesOpen = !settings.notesOpen;
	switchToggle("content-notes-toggle", "notesOpen", settings.notesOpen);

	document.querySelectorAll(".content-notes").forEach(notes => notes.toggleAttribute("open", settings.notesOpen));
}

// set button state
function setButtonState(setting, value, state) {
	page[setting + "Buttons"].querySelector("[data-" + setting + '="' + value + '"]').setAttribute("aria-pressed", state);
}

// update setting and setting buttons according to chosen value
function updateSetting(setting, value) {
	setButtonState(setting, styles[setting], "false");
	setButtonState(setting, value, "true");

	document.body.classList.replace(setting + "-" + styles[setting], setting + "-" + value);
	styles[setting] = value;
}

// switch between different colour themes
function switchTheme(theme) {
	updateSetting("theme", theme);
}

// switch between different fonts
function switchFont(font) {
	updateSetting("font", font);
}

/* --------------
PAGE CONSTRUCTION
-------------- */

// build nav menu
function buildNavLinks() {
	const navLinks = {
		"widget": [
			{	"name": "Booth", 			"code": "booth" 	},
			{	"name": "Archive", 			"code": "archive"	},
			{	"name": "Settings", 		"code": "settings"	}
		]
	};

	for (const [section, links] of Object.entries(navLinks)) {
		const list = document.getElementById(section + "-sections");
		for (const link of links) {
			list.appendChild(templateHTML.navLink.content.cloneNode(true));
			newLink = list.lastElementChild.firstElementChild;

			newLink.href = link.href ?? "#" + link.code;
			newLink.setAttributes(link.attrs ?? {});
			newLink.querySelector("use").setAttribute("href", "#svg-" + link.code);
			newLink.querySelector("span").setContent(link.name);
		}
	}
}

// build archive onto page
function buildArchive() {
	let archiveHTML = "",
	archiveLinksHTML = "";

	for (const series of archive) {
		showIDSets.series[series.code] = [];

		archiveLinksHTML += '<li><a href="#archive-' + series.code + '">' + series.heading + '</a></li>';

		archiveHTML += '<li id="archive-' + series.code + '"><header>' +
'<h3 class="series-heading">' + series.heading + '</h3><div class="series-content">' +
series.blurb +
'</div>' +
'<button class="push-button" type="button" data-target="' + series.code + '" data-action="add-series">Add series to playlist</button>' +
'<a href="#archive" rel="return">back to top</a>' +
'</header><ol class="show-list">';

		for (const show of series.shows) {
			const showCode = show.code.split("-")[0],
			showFile = show.code.split("-")[1],
			id = series.code + "-" + showCode,
			copyrightCategory = series.copyrightSafe ? "safe" : "unsafe";

			showIDSets.all.any.push(id);
			if (series.copyrightSafe) showIDSets.all.safe.push(id);
			if (show.banger) showIDSets.bangers.any.push(id);
			if (series.copyrightSafe && show.banger) showIDSets.bangers.safe.push(id);
			showIDSets.series[series.code].push(showCode);

			archiveHTML += '<li id="' + id + '" data-file="' + showFile + '" data-duration="' + show.duration + '"><div class="show-info">' +
'<h4 class="show-heading">' + show.heading + '</h4>' +
'<div class="show-content">' + show.blurb;
			if (show.notes) archiveHTML += '<details class="content-notes"' + (settings.notesOpen ? ' open' : "") + "><summary>Content notes</summary> " + show.notes + '</details>';
			archiveHTML += "</div></div>" +
'<button class="push-button" type="button" data-target="' + id + '" data-action="add-show" aria-pressed="false">Add to playlist</button></li>';
		}

		archiveHTML += '</ol></li>';
	}

// remove archive object (once used by this function, it has no further purpose)
	archive.length = 0;

// render archive links and archive, then add delegated click-events for add-series and open all content notes if user setting applies
	document.getElementById("archive-series-links").innerHTML = archiveLinksHTML;
	page.seriesList.innerHTML = archiveHTML;
	page.seriesList.addEventListener("click", (event) => {
		switch (event.target.dataset.action) {
		case "add-series": addSeries(event.target.dataset.target); break;
		case "add-show": if (event.target.getAttribute("aria-pressed") === "false") addShow(event.target.dataset.target); break;
		}
	});
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
	case "remove": removeShow(event.target.dataset.target); break;
	case "move-up": moveShow(event.target.dataset.target, -1); break;
	case "move-down": moveShow(event.target.dataset.target, 1); break;
	}
});

// archive interface events (excluding those dependent on the archive HTML being generated beforehand)
document.getElementById("add-archive-button").addEventListener("click", addArchive);

// settings interface events (general)
document.getElementById("flat-radio-toggle").addEventListener("click", toggleFlatRadio);
document.getElementById("auto-play-toggle").addEventListener("click", toggleAutoPlay);
document.getElementById("content-notes-toggle").addEventListener("click", toggleContentNotes);
document.getElementById("copyright-safety-toggle").addEventListener("click", toggleCopyrightSafety);

// settings interface events (styling)
page.themeButtons.addEventListener("click", (event) => {
	if (event.target.tagName === "BUTTON" && event.target.getAttribute("aria-pressed") !== "true") switchTheme(event.target.dataset.theme);
});
page.fontButtons.addEventListener("click", (event) => {
	if (event.target.tagName === "BUTTON" && event.target.getAttribute("aria-pressed") !== "true") switchFont(event.target.dataset.font);
});

// on pageload, execute various tasks
document.addEventListener("DOMContentLoaded", () => {
/* BUILD NAV LINKS */
	buildNavLinks();

/* BUILD ARCHIVE */
	buildArchive();

/* LOAD PLAYLIST */
	if (playlistIDs.length > 0) {
		console.log("loaded playlist from storage");
		updatePlaylist([], playlistIDs);
	}

/* MANIPULATE PAGE CONTENT */
// set seek bar value to 0
	page.seekBar.value = 0;

/* BUTTON CONSTRUCTION */
// build out theme and font buttons and build and initialise toggles
	buildToggles();
	buildThemeButtons();
	buildFontButtons();

	initialiseToggle("copyright-safety-toggle", settings.copyrightSafety);
	initialiseToggle("flat-radio-toggle", settings.flatRadio);
	initialiseToggle("auto-play-toggle", settings.autoPlayNextShow);
	initialiseToggle("content-notes-toggle", settings.notesOpen);

// set radio display and switch theme and font (utilities.js handles the actual theme/font classes during pageload, so this is just to make sure the corresponding buttons start pressed)
	page.loadedShow.classList.toggle("flat-radio", settings.flatRadio);
	switchTheme(styles.theme);
	switchFont(styles.font);

/* UPDATE PAGE HEAD DATA */
	page.title.setAttribute("data-original", document.title);
	if (window.location.hash) navigateToSection();

/* -----------------------------------
FOR BROWSERS THAT DON'T SUPPORT :HAS()
----------------------------------- */

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
	window.localStorage.setItem("widgetPlaylist", JSON.stringify(playlistIDs));
	window.localStorage.setItem("settings", JSON.stringify(settings));
	window.localStorage.setItem("styles", JSON.stringify(styles));
});
