/*jshint esversion: 6*/

/*
SCRIPT CONTROLS: an interface to change the app's behaviour (only really useful if running your own)
PARAMETERS: internal parameters (probably don't need to be changed)
FUNCTIONS
	TIMING: transforming and writing timestamps
	PLAYLIST: getting show IDs, building the playlist
	SHOWS: loading shows into the radio
	INTERFACE: radio (controlling current show), booth (editing the playlist), archive (adding shows/series/archive to playlist), settings (changing settings and style)
	PAGE CONSTRUCTION: building page sections and content (e.g. the Archive)
	DISPLAY: updating site display according to display (style and font) settings
EVENTS: event listeners
ARCHIVE: an object with every source and show in the Archive
*/



/* ====================
	SCRIPT CONTROLS
==================== */

// relative path of the show audio folder, favicon, and Weird Waves button folder
const paths = {
	show: "./audio/shows/",
	button: "./images/buttons/weird-waves-"
};

const settings = window.localStorage.getItem("settings") ? JSON.parse(window.localStorage.getItem("settings")) : {
	"autoPlayNextShow": true,
	"copyrightSafety": false,
	"notesOpen": false
};

// prepare empty playlist and read stored playlist show IDs from storage (if there are any)
const playlist = [];
let showIDs = window.localStorage.getItem("playlist") ? JSON.parse(window.localStorage.getItem("playlist")) : [];



/* ===============
	PARAMETERS
=============== */

// HTML elements
const page = {
	"radio": document.getElementById("radio-main"),
	"playlist": document.getElementById("playlist"),
	"playlistImportExport": document.getElementById("playlist-import-export"),
	"importErrorMessage": document.getElementById("import-error-message"),

	"radioLoadIcon": document.getElementById("loading-spinner-radio"),
	"loadedShow": document.getElementById("loaded-show"),
	"controls": document.getElementById("controls"),
	"seekBar": document.getElementById("seek-bar"),
	"showTimeElapsed": document.getElementById("show-time-elapsed"),
	"showTimeTotal": document.getElementById("show-time-total"),
	"playButton": document.getElementById("play-button"),
	"skipButton": document.getElementById("skip-button"),
	"muteButton": document.getElementById("mute-button"),
	"volumeControl": document.getElementById("volume-control"),
	"audio": document.getElementById("show-audio"),

	"addArchiveButton": document.getElementById("add-archive-button"),

	"clearButton": document.getElementById("clear-button"),
	"clearPlaylistOptions": document.getElementById("clear-playlist-options"),

	"themeButtons": document.querySelectorAll("#theme-buttons button"),
	"fontButtons": document.querySelectorAll("#font-buttons button"),
	"positionButtons": document.querySelectorAll("#position-buttons button")
};

// sets of show IDs to select from when adding random shows to playlist
const showIDSets = {
	"all": {
		"safe": [],
		"unsafe": []
	},
	"banger": {
		"safe": [],
		"unsafe": []
	}
};

let updateTimeInterval;



/* ==============
	FUNCTIONS
============== */

/* ---
TIMING
--- */

// pad single-digit second or minute numbers with a leading 0
function padTime(timeNum) {
	return (timeNum < 10) ? "0" + timeNum : String(timeNum);
}

// take in a time in seconds (can be a non-integer) and output a timestamp in minutes and seconds
function getTimestampFromSeconds(time) {
	return padTime(Math.floor(time / 60)) + ":" + padTime(Math.floor(time % 60));
}

/* -----
PLAYLIST
----- */

// get show IDs from a fleshed-out playlist object (when unloading page or modifying playlist)
function getShowIDsFromPlaylist() {
	showIDs = [];
	for (const show of playlist) showIDs.push(show.id);
}

// build out playlist object entry from show ID
function buildPlaylistEntryFromID(ID) {
	const show = {},
	showInArchive = document.getElementById(ID),
	seriesInArchive = showInArchive.parentElement.parentElement;

	show.id = ID;
	show.file = showInArchive.dataset.file;
	show.series = seriesInArchive.querySelector(".series-heading").innerHTML;
	show.title = showInArchive.querySelector(".show-heading").innerHTML;
	show.info = showInArchive.querySelector(".show-info").innerHTML;
	show.source = seriesInArchive.querySelector(".series-source").outerHTML;
	show.duration = showInArchive.dataset.duration;

	return show;
}

// build out playlist <li>, including controls for removing and moving items, from playlist object
function buildPlaylistShowHTML(show) {
	let HTML = "";

	HTML += '<ul class="playlist-controls">' +
'<li><button class="push-button up-button" type="button" data-id="' + show.id + '"><svg class="svg-icon" viewBox="0 0 12 12"><use href="#svg-move-up" /></svg></button></li>' +
'<li><button class="push-button remove-button" type="button" data-id="' + show.id + '"><svg class="svg-icon" viewBox="0 0 12 12"><use href="#svg-remove" /></svg></button></li>' +
'<li><button class="push-button down-button" type="button" data-id="' + show.id + '"><svg class="svg-icon" viewBox="0 0 12 12"><use href="#svg-move-down" /></svg></button></li></ul>';
	HTML += '<div class="playlist-item" data-file="' + show.id + '-' + show.file + '" data-duration="' + show.duration + '"><h4 class="show-heading">' + show.series + " " + show.title + '</h4>' +
'<div class="show-info">' + show.info + show.source + "</div>";
	HTML += "</div>";

	return "<li>" + HTML + "</li>";
}

// write entire playlist into Booth
function loadPlaylistFromShowIDs(source) {
	console.log("loading playlist: " + source);

	playlist.length = 0;

	let playlistHTML = "";

	showIDs = [...new Set(showIDs.reverse())];
	showIDs.reverse();

	document.querySelectorAll("#archive .add-show-button").forEach(button => button.setAttribute("aria-pressed", "false"));

	for (const ID of showIDs) {
		document.querySelector("#" + ID + " .add-show-button").setAttribute("aria-pressed", "true");
		playlist.push(buildPlaylistEntryFromID(ID));
	}
	for (const show of playlist) playlistHTML += buildPlaylistShowHTML(show);

	page.playlist.innerHTML = playlistHTML;
	page.playlistImportExport.value = showIDs.join("\n");

// add event listeners for playlist controls
	document.querySelectorAll(".remove-button").forEach(button => button.addEventListener("click", () => removeShow(button.dataset.id)));
	document.querySelectorAll(".up-button").forEach(button => button.addEventListener("click", () => moveShow(button.dataset.id, -1)));
	document.querySelectorAll(".down-button").forEach(button => button.addEventListener("click", () => moveShow(button.dataset.id, 1)));

// honour stored notes visibility setting (if set)
	const playlistNotes = document.querySelectorAll("#playlist .content-notes");
	for (const notes of playlistNotes) notes.open = settings.notesOpen;

// reveal show controls if there's a show to control
	page.controls.classList.toggle("hidden", playlist.length === 0);
}

// import playlist from textarea contents (after trimming start, interior, and ending newlines), or empty the array if textarea is empty; load the top show and pause it to update play/pause button state; if any invalid show IDs present in textarea lines, display error message instead
function importPlaylist() {
	showIDs = page.playlistImportExport.value !== "" ? page.playlistImportExport.value.replace(/\n+/g,"\n").replace(/ /g,"").trim().split("\n") : [];

	const invalidShowIDs = [];

	for (const ID of showIDs) {
		if (!document.getElementById(ID)) invalidShowIDs.push(ID);
	}

	if (invalidShowIDs.length > 0) page.importErrorMessage.innerHTML = "<p>Invalid show ID(s):</p><ul><li>" + invalidShowIDs.join("</li><li>") + "</li></ul>";
	else {
		page.importErrorMessage.innerHTML = "";
		loadPlaylistFromShowIDs("import");
	}

	loadShow();
	pauseAudio();
}

/* --
SHOWS
-- */

// write show parts onto page and load show audio file; if playlist is empty, remove audio and show content and hide controls
function loadShow() {
	pauseAudio();

	if (playlist.length > 0) {
		const show = page.playlist.querySelector(".playlist-item");

		page.audio.src = paths.show + show.dataset.file + ".mp3";

		page.audio.setAttribute("data-duration", show.dataset.duration);

		page.loadedShow.innerHTML = show.innerHTML.replace(/(<!<\/)h4/g,"\1h2");

		const radioNotesOpen = settings.notesOpen,
		loadedShowNotes = document.querySelector('#loaded-show .content-notes');
		if (loadedShowNotes) loadedShowNotes.open = radioNotesOpen;

		seekTime(0);
		page.seekBar.value = 0;
		page.showTimeTotal.textContent = getTimestampFromSeconds(page.audio.dataset.duration);

		console.log("loading show: " + show.dataset.file);
	} else {
		page.audio.removeAttribute("src");
		page.loadedShow.innerHTML = "";

		console.log("reached end of playlist");
	}
}

// replace loaded show with next show on playlist, or empty-playlist message if none
function loadNextShow() {
	removeShow(page.playlist.querySelector(".remove-button").dataset.id);
	page.seekBar.value = 0;

	if (page.audio.hasAttribute("src") && settings.autoPlayNextShow) playAudio();
}

/* ------
INTERFACE
------ */

/* RADIO */

// if audio is playing, update seek bar and time-elapsed
function updateSeekBar() {
	if (!page.audio.paused) {
		page.seekBar.value = page.audio.currentTime / page.audio.dataset.duration * 100;
		page.showTimeElapsed.textContent = getTimestampFromSeconds(page.audio.currentTime);
	}
}

// set audio position using seek bar
function goToAudioPosition(value) {
	page.audio.currentTime = page.audio.dataset.duration * value / 100;
}

// update displayed show time using seek bar
function seekTime(value) {
	page.showTimeElapsed.textContent = getTimestampFromSeconds(page.audio.dataset.duration * value / 100);
}

// play audio
function playAudio() {
	page.audio.play();
	page.playButton.textContent = "Pause";
	updateTimeInterval = setInterval(updateSeekBar, 1000);
}

// pause audio
function pauseAudio() {
	page.audio.pause();
	page.playButton.textContent = "Play";
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
		page.muteButton.textContent = "Mute";
	} else {
		page.audio.muted = true;
		page.muteButton.textContent = "Unmute";
	}
}

// set audio volume
function setVolume(newVolume) {
	page.audio.volume = newVolume;
}

/* BOOTH */

// remove show from playlist in object and HTML and update import-export text accordingly; if the first show on the playlist was removed, load the new top show
function removeShow(id) {
	const removedShowIndex = playlist.findIndex(show => show.id === id);

	playlist.splice(removedShowIndex,1);
	getShowIDsFromPlaylist();
	loadPlaylistFromShowIDs("remove");

	if (removedShowIndex === 0) loadShow();
}

// move show up/down in playlist and update import-export text accordingly; if the first show on the playlist was moved, load the new top show
function moveShow(id, move) {
	const showIndex = playlist.findIndex(show => show.id === id);

	if (showIndex + move >= 0 && showIndex + move < playlist.length) {
		[playlist[showIndex + move], playlist[showIndex]] = [playlist[showIndex], playlist[showIndex + move]];
		getShowIDsFromPlaylist();
		loadPlaylistFromShowIDs("move");

		if (showIndex === 0 || showIndex + move === 0) loadShow();
	}
}

// add a random show or banger to the playlist; if adding a show to an empty playlist, load it into radio
function addRandomShow(showType = "all") {
	const showIDPool = settings.copyrightSafety ? showIDSets[showType].safe : showIDSets[showType].safe.concat(showIDSets[showType].unsafe),
	id = showIDPool[Math.floor(Math.random() * showIDPool.length)];

	getShowIDsFromPlaylist();
	const showNotOnList = !showIDs.includes(id);
	showIDs.push(id);
	loadPlaylistFromShowIDs("random show");

	if (showNotOnList) {
		window.scrollBy({
			"top": document.querySelector("#playlist > :last-child").scrollHeight,
			"left": 0,
			"behavior": "instant"
		});
	}

	if (playlist.length === 1) loadShow();
}

// shuffle playlist, then load top show
function shufflePlaylist() {
	getShowIDsFromPlaylist();

	let i = showIDs.length;

	while (i > 0) {
		const randomID = Math.floor(Math.random() * --i);
		[showIDs[randomID], showIDs[i]] = [showIDs[i], showIDs[randomID]];
	}

	loadPlaylistFromShowIDs("shuffle");

	loadShow();
}

// reveal options for clearing playlist
function revealClearPlaylistOptions() {
	page.clearButton.setAttribute("aria-pressed", "true");
	page.clearPlaylistOptions.classList.remove("hidden");
	page.clearPlaylistOptions.focus();
}

// hide options for clearing playlist
function hideClearPlaylistOptions() {
	page.clearButton.setAttribute("aria-pressed", "false");
	page.clearPlaylistOptions.classList.add("hidden");
}

// clear playlist and hide clear options again, then load show (i.e. nothing)
function clearPlaylist() {
	showIDs = [];
	loadPlaylistFromShowIDs("clear");
	hideClearPlaylistOptions();
	loadShow();
}

/* ARCHIVE */

// scroll to a series when clicking its link in the archive series nav list
function scrollToSeries(series) {
	document.getElementById("archive-" + series).focus(); // when Firefox adds :has(), remove this function and the tabindex from archive series' <h3>s created in buildArchive()
	document.getElementById("archive-" + series).scrollIntoView(true);
}

// add entire archive to playlist; load top show
function addArchive() {
	showIDs = [];
	for (const series of archive) {
		if (!settings.copyrightSafety || series.copyrightSafe) {
			for (const show of series.shows) showIDs.push(series.code + "-" + show.code);
		}
	}
	loadPlaylistFromShowIDs("add archive");
	loadShow();
}

// add entire series to playlist; if playlist was previously empty, load top show
function addSeries(code) {
	const showsInSeries = document.getElementById("archive-" + code).querySelectorAll(".show-list > li"),
	loadedShowID = showIDs[0];
	
	getShowIDsFromPlaylist();
	for (const show of showsInSeries) showIDs.push(show.id);
	loadPlaylistFromShowIDs("add series");
	if (playlist.length === showsInSeries.length || loadedShowID === showsInSeries[0].id) loadShow();
}

// add show to playlist; if playlist was previously empty, load top show
function addShow(id) {
	getShowIDsFromPlaylist();
	showIDs.push(id);
	loadPlaylistFromShowIDs("add show");
	if (playlist.length === 1) loadShow();
}

/* SETTINGS */

// initialise a toggle switch with a stored or default value
function initialiseToggle(id, toggled) {
	document.getElementById(id).setAttribute("aria-pressed", toggled ? "true" : "false");
}

// switch a toggle from off/unpressed to on/pressed
function switchToggle(id, key, value) {
	const button = document.getElementById(id);

	if (button.getAttribute("aria-pressed") === "false") button.setAttribute("aria-pressed", "true");
	else button.setAttribute("aria-pressed", "false");

	settings[key] = value;
}

// toggle between auto-playing (true) and not (false) a newly-loaded show when the previous show ends
function toggleAutoPlay() {
	settings.autoPlayNextShow = !settings.autoPlayNextShow;
	switchToggle("auto-play-toggle", "autoPlayNextShow", settings.autoPlayNextShow);
}

// toggle between excluding (true) and including (false) copyright-unsafe material when adding random shows to playlist
function toggleCopyrightSafety() {
	settings.copyrightSafety = !settings.copyrightSafety;
	switchToggle("copyright-safety-toggle", "copyrightSafety", settings.copyrightSafety);
}

// toggle between open (true) and closed (false) show content notes
function toggleContentNotes() {
	settings.notesOpen = !settings.notesOpen;
	switchToggle("content-notes-toggle", "notesOpen", settings.notesOpen);

	const contentNotes = document.querySelectorAll(".content-notes");
	for (const notes of contentNotes) notes.open = settings.notesOpen;
}

/* --------------
PAGE CONSTRUCTION
-------------- */

// build archive onto page
function buildArchive() {
	let archiveHTML = "",
	archiveLinksHTML = "";

	for (const series of archive) {
		archiveLinksHTML += '<li><a href="#archive" data-series="' + series.code + '">' + series.heading + '</a></li>';

		archiveHTML += '<li id="archive-' + series.code + '" tabindex="0"><header>' +
'<h3 class="series-heading">' + series.heading + '</h3><div class="series-info">' +
series.blurb +
'<p class="series-source">source: ' + series.source + '</p></div>' +
'<button class="push-button add-series-button" type="button" data-code="' + series.code + '">Add series to playlist</button>' +
'</header><ol class="show-list">';

		for (const show of series.shows) {
			const showID = series.code + "-" + show.code,
			copyrightCategory = series.copyrightSafe ? "safe" : "unsafe";

			showIDSets.all[copyrightCategory].push(showID);
			if (show.banger) showIDSets.banger[copyrightCategory].push(showID);

			archiveHTML += '<li id="' + showID + '" data-file="' + show.file + '" data-duration="' + show.duration + '">' +
'<h4 class="show-heading">' + show.heading + '</h4>' +
'<div class="show-info">' + show.blurb;
			if (show.notes) archiveHTML += '<details class="content-notes"><summary>Content notes </summary>' + show.notes + '</details>';
			archiveHTML += "</div>";
			archiveHTML += '<button class="push-button add-show-button" type="button" data-id="' + showID + '" aria-pressed="false">Add to playlist</button>';
			archiveHTML += "</li>";
		}

		archiveHTML += '</ol></li>';
	}

	document.getElementById("loading-spinner-archive")?.remove();
	document.getElementById("series-list").innerHTML = archiveHTML;
	page.addArchiveButton.classList.remove("hidden");

	document.querySelectorAll("#archive .add-series-button").forEach(button => button.addEventListener("click", () => addSeries(button.dataset.code)));
	document.querySelectorAll("#archive .add-show-button").forEach(button => button.addEventListener("click", () => addShow(button.dataset.id)));

	document.getElementById("loading-spinner-archive-links")?.remove();
	document.getElementById("archive-series-links").innerHTML = archiveLinksHTML;
	document.querySelectorAll("#archive-series-links a").forEach(link => link.addEventListener("click", () => setTimeout(scrollToSeries, 1, link.dataset.series)));
}

// count shows per series
function countShows() {
	let totalCount = 0,
	showCountList = "";

	for (const series of archive) {
		const showCount = series.shows.length;

		totalCount += showCount;
		showCountList += "<dt>" + series.heading + "</dt><dd>" + showCount + "</dd>";
	}

	document.getElementById("loading-spinner-stats")?.remove();
	document.getElementById("stats-list").innerHTML = "<div><dt>sources in the Archive</dt><dd>" + archive.length + "</dd></div>" +
"<div><dt>shows in the Archive</dt><dd>" + totalCount + "</dd></div>";

	document.getElementById("loading-spinner-show-counts")?.remove();
	document.getElementById("series-show-counts").innerHTML = showCountList;
}

/* ----
DISPLAY
---- */

// take reference to button element and string "true" or "false"
function setButtonState(button, state) {
	button.setAttribute("aria-pressed", state);
	if (state === "true") button.setAttribute("tabindex", "-1");
	else button.removeAttribute("tabindex");
}

// swap user-setting class on root element
function swapClass(settingName, newSetting) {
	for (const button of page[settingName+"Buttons"]) {
		setButtonState(button, button.dataset.setting === newSetting ? "true" : "false");
	}

	document.body.classList.remove(settingName+"-"+styles[settingName]);
	document.body.classList.add(settingName+"-"+newSetting);
}

// switch between different colour themes
function switchTheme(themeName) {
	swapClass("theme", themeName);
	styles.theme = themeName;

	switchFavicon(themeName);

	document.getElementById("weird-waves-button-png").src = paths.button + themeName + ".png";
	document.getElementById("weird-waves-button-svg").src = paths.button + themeName + ".svg";
}

// switch between different font families (and stacks)
function switchFont(fontName) {
	swapClass("font", fontName);
	styles.font = fontName;
}

// switch radio area from left to right side of main content in widescreen view (1240px+)
function switchRadioPosition(position) {
	swapClass("position", position);
	styles.position = position;
}



/* ===========
	EVENTS
=========== */

// radio audio events
page.audio.addEventListener("ended", () => loadNextShow());

// radio interface events
page.seekBar.addEventListener("change", () => {
	goToAudioPosition(page.seekBar.value);
	updateTimeInterval = setInterval(updateSeekBar, 1000);
});
page.seekBar.addEventListener("input", () => {
	seekTime(page.seekBar.value);
	clearInterval(updateTimeInterval);
});
page.playButton.addEventListener("click", () => playPauseAudio());
page.skipButton.addEventListener("click", () => loadNextShow());
page.muteButton.addEventListener("click", () => muteUnmuteAudio());
page.volumeControl.addEventListener("input", () => setVolume(page.volumeControl.value / 100));

// playlist interface events
document.getElementById("random-show-button").addEventListener("click", () => addRandomShow());
document.getElementById("random-banger-button").addEventListener("click", () => addRandomShow("banger"));
document.getElementById("shuffle-button").addEventListener("click", () => shufflePlaylist());
page.clearButton.addEventListener("click", () => revealClearPlaylistOptions());
document.getElementById("clear-cancel-button").addEventListener("click", () => hideClearPlaylistOptions());
document.getElementById("clear-confirm-button").addEventListener("click", () => clearPlaylist());
document.getElementById("import-button").addEventListener("click", () => importPlaylist());

// archive interface events (excluding those dependent on the archive HTML being generated beforehand)
page.addArchiveButton.addEventListener("click", () => addArchive());

// settings interface events (general)
document.getElementById("auto-play-toggle").addEventListener("click", () => toggleAutoPlay());
document.getElementById("copyright-safety-toggle").addEventListener("click", () => toggleCopyrightSafety());
document.getElementById("content-notes-toggle").addEventListener("click", () => toggleContentNotes());

// settings interface events (styling)
page.themeButtons.forEach(button => button.addEventListener("click", () => switchTheme(button.dataset.setting)));
page.fontButtons.forEach(button => button.addEventListener("click", () => switchFont(button.dataset.setting)));
page.positionButtons.forEach(button => button.addEventListener("click", () => switchRadioPosition(button.dataset.setting)));

// on pageload, execute various tasks
document.addEventListener("DOMContentLoaded", () => {

/* BUILD ARCHIVE */
	buildArchive();

/* FETCH PLAYLIST */
	loadPlaylistFromShowIDs("storage");
	document.getElementById("loading-spinner-booth")?.remove();
	document.getElementById("booth-contents").classList.remove("hidden");

/* LOAD FIRST SHOW IN, IF PLAYLIST HAS ENTRIES */
	document.getElementById("loading-spinner-radio")?.remove();
	loadShow();

/* MANIPULATE PAGE CONTENT */
// set seek bar value to 0
	page.seekBar.value = 0;

// set archive content notes status according to user preference/default setting
	const archiveNotes = document.querySelectorAll("#archive .content-notes");
	for (const notes of archiveNotes) notes.open = settings.notesOpen;

// write show count data list
	countShows();

// switch theme and font (during pageload this is mainly just pressing the matching buttons and marking the rest unpressed)
	switchTheme(styles.theme);
	switchFont(styles.font);
	switchRadioPosition(styles.position);

/* BUTTON CONSTRUCTION */
// build out theme buttons
	for (const button of page.themeButtons) button.innerHTML = '<span class="palette"><span style="background-color:#' + button.dataset.colours.split(" ").join('"></span><span style="background-color:#') + '"></span></span>' + button.innerText + '';
// build out toggle buttons
	const toggleButtons = document.querySelectorAll(".toggle");

	for (const toggle of toggleButtons) toggle.innerHTML = '<svg class="svg-icon" viewBox="0 0 48 24"><use href="#svg-toggle-track" /><g class="svg-toggle-thumb"><use href="#svg-toggle-thumb-side" /><use href="#svg-toggle-thumb-top" /><use href="#svg-toggle-tick" /></g></svg><span>' + toggle.innerText + '</span>';

	initialiseToggle("auto-play-toggle", settings.autoPlayNextShow);
	initialiseToggle("copyright-safety-toggle", settings.copyrightSafety);
	initialiseToggle("content-notes-toggle", settings.notesOpen);
});

// on closing window/browser tab, record user settings and styles to localStorage
window.addEventListener("unload", () => {
	getShowIDsFromPlaylist();
	window.localStorage.setItem("playlist", JSON.stringify(showIDs));
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
"shows":[
	{
	"code": "13",
	"heading": "#13: <cite>Lanceford House</cite><!--episode name on Radio Echoes is incorrect-->",
	"blurb": "<p>A writer seeking solitude moves to a country house and discovers a malign force obsessed with an ugly green vase. Adapted from a story by Dennis Roidt.</p>",
	"file": "Lanceford",
	"duration": 1671
	},
	{
	"code": "20",
	"heading": "#20: <cite>The Dream</cite>",
	"blurb": "<p>A physicist suffers recurring nightmares of being hunted by sinister warriors outside an ancient city. Adapted from a story by Basil Copper.</p>",
	"notes": "institutionalisation, racism",
	"file": "Dream",
	"duration": 1729,
	"banger": true
	},
	{
	"code": "41",
	"heading": "#41: <cite>The Happy Return</cite>",
	"blurb": "<p>A man's fiancée is lost at sea; months later he finds the wreck, its calendar set to that very day. Adapted from a story by William Hope Hodgson.</p>",
	"file": "Return",
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
"shows":[
	{
	"code": "X",
	"heading": "#X: <cite>The Mahogany Coffin</cite>",
	"blurb": "<p>A gravedigger makes lavish preparations for his own burial&hellip; and an unlikely graveyard friend of his takes ghoulish revenge when a rival thwarts his plans.</p>",
	"notes": "entombment",
	"file": "Coffin",
	"duration": 819,
	"banger": true
	}
]
},
{
"code": "BkM",
"heading": "<cite>The Black Mass</cite>",
"blurb": "<p>A 1963&ndash;37 anthology of mostly gothic and cosmic horror stories adapted for radio, largely performed by Erik Bauersfeld.</p>",
"source": "<a href=\"https://www.kpfahistory.info/black_mass_home.html\" rel=\"external\"><abbr title=\"Pacifica Radio\">KPFA</abbr> History</a><!--the site of John Whiting, technical producer-->",
"copyrightSafe": true,
"shows":[
	{
	"code": "01",
	"heading": "#1: <cite>All Hallows</cite>",
	"blurb": "<p>A traveller meets a verger in a derelict cathedral that the Christian believes is being invaded by evil. Adapted from a story by Walter de la Mare.</p>",
	"file": "Hallows",
	"duration": 2355
	},
	{
	"code": "02",
	"heading": "#2: <cite>The Ash Tree</cite>",
	"blurb": "<p>A monstrous ash tree bears a terrible secret&mdash;when the &ldquo;witch&rdquo; who tends it is hanged, its &ldquo;curse&rdquo; falls on her accusers. Adapted from a story by M.&thinsp;R.&thinsp;James.</p>",
	"notes": "execution, spiders",
	"file": "Ash",
	"duration": 1821
	},
	{
	"code": "04",
	"heading": "#4: <cite>Nightmare</cite>",
	"blurb": "<p>A paranoid man recounts how the helpful Dr. Fraser cured his illness, only to replace it with something much worse. Adapted from a story by Alan Wykes.</p>",
	"notes": "institutionalisation, public mockery",
	"file": "Nightmare",
	"duration": 1646,
	"banger": true
	},
	{
	"code": "07",
	"heading": "#7: <cite>Oil of Dog</cite>",
	"blurb": "<p>A young man helps his father make <i>dog oil</i> and his mother dispose of <i>unwanted babies</i>&mdash;and combines his duties to disastrous effect. Adapted from a story by Ambrose Bierce.</p>",
	"notes": "animal abuse, infanticide, kidnapping, murder-suicide",
	"file": "Oil",
	"duration": 793,
	"banger": true
	},
	{
	"code": "08",
	"heading": "#8: <cite>The Death of Halpin Frayser</cite>",
	"blurb": "<p>Halpin Frayser wakes from dream and dies with the name Catherine LaRue on his lips. He was murdered. But how? Adapted from a story by Ambrose Bierce.</p>",
	"notes": "becoming lost, gore, domestic abuse, incest, strangulation, torture",
	"file": "Halpin",
	"duration": 1868
	},
	{
	"code": "09",
	"heading": "#9: <cite>A Haunted House</cite>",
	"blurb": "<p>A house is haunted by the memory of the lovers who lived there. Adapted from a story by Virginia Woolf.</p>",
	"file": "House",
	"duration": 597
	},
	{
	"code": "11",
	"heading": "#11: <cite>A Predicament</cite> and <cite>The Tell-Tale Heart</cite>",
	"blurb": "<p>A murderer hears his victim's still-beating heart. A wealthy woman finds herself in a&hellip; predicament. Adapted from stories by Edgar Allen Poe.</p>",
	"notes": "animal death, gore, obsession",
	"file": "Predicament-Heart",
	"duration": 1763
	},
	{
	"code": "12",
	"heading": "#12: <cite>Disillusionment</cite> and <cite>The Feeder</cite>",
	"blurb": "<p>A man lays out his philosophy of disenchantment. A patient's trapped in the void of his mind. Adapted from stories by Thomas Mann and Carl Linder.</p>",
	"notes": "coma, homophobia, life support, sexual harassment",
	"file": "Disillusionment-Feeder",
	"duration": 1585
	},
	{
	"code": "14",
	"heading": "#14: <cite>The Imp of the Perverse</cite> and <cite><abbr class=\"unmodified-abbr\" title=\"Manuscript\">MS.</abbr> Found in a Bottle</cite>",
	"blurb": "<p>A prisoner explains his philosophy of temptation. A sea-traveller describes his strange and deadly final journey. Adapted from stories by Edgar Allen Poe.</p>",
	"notes": "being stranded at sea, darkness, drowning",
	"file": "Imp-MS",
	"duration": 1741
	},
	{
	"code": "15",
	"heading": "#15: <cite>A Country Doctor</cite>",
	"blurb": "<p>A doctor makes a surreal journey through winter weather for a patient on his deathbed. Adapted from a story by Franz Kafka.</p>",
	"notes": "abduction, bite injury, description of open wound, insects, rape",
	"file": "Doctor",
	"duration": 1449
	},
	{
	"code": "16",
	"heading": "#16: <cite>The Witch of the Willows</cite>",
	"blurb": "<p>A traveller seeking wonder and danger finds it in an eerie willow-marsh and its resident witch. Adapted from a story by Lord Dunsany.</p>",
	"file": "Willows",
	"duration": 1240
	},
	{
	"code": "17",
	"heading": "#17: <cite>Atrophy</cite>",
	"blurb": "<p>A man's bodily strength withers from his toes to his head. Adapted from a story by John Anthony West.</p>",
	"notes": "food, gunshots (2:04)",
	"file": "Atrophy",
	"duration": 1596
	},
	{
	"code": "20",
	"heading": "#20: <cite>Diary of a Madman</cite>",
	"blurb": "<p>The diary of a civil servant who slips into a world of delusion when his romantic desires are frustrated. Adapted from a story by Nikolai Gogol.</p>",
	"notes": "institutionalisation, obsession, sanism, social humiliation",
	"file": "Diary",
	"duration": 2375
	},
	{
	"code": "21",
	"heading": "#21: <cite>The Outsider</cite>",
	"blurb": "<p>A lonely man in a deep, dark forest ponders what lies beyond&mdash;and one day makes his desperate escape. Adapted from a story by H.&thinsp;P.&thinsp;Lovecraft.</p>",
	"file": "Outsider",
	"duration": 1348
	},
	{
	"code": "22",
	"heading": "#22: <cite>The Moonlit Road</cite>",
	"blurb": "<p>A man's mother is murdered; his father disappears. An outcast dreams of vile acts; a ghost returns to its beloved. Adapted from a story by Ambrose Bierce.</p>",
	"notes": "mental breakdown, strangulation, suspicion of cheating",
	"file": "Moonlit",
	"duration": 1949
	},
	{
	"code": "X1",
	"heading": "X#1: <cite>The Haunter of the Dark</cite>, part 1",
	"blurb": "<p>A young writer seeks inspiration from an old cult's derelict church&mdash;he finds more than he bargained for. Adapted from a story by H.&thinsp;P.&thinsp;Lovecraft.</p>",
	"file": "Haunter-pt1",
	"duration": 1681
	},
	{
	"code": "X2",
	"heading": "X#2: <cite>The Haunter of the Dark</cite>, part 2",
	"blurb": "<p>A young writer seeks inspiration from an old cult's derelict church&mdash;he finds more than he bargained for. Adapted from a story by H.&thinsp;P.&thinsp;Lovecraft.</p>",
	"file": "Haunter-pt2",
	"duration": 1482
	},
	{
	"code": "X5",
	"heading": "X#5: <cite>Proof Positive</cite> and <cite>The Man in the Crowd</cite>",
	"blurb": "<p>An esoteric researcher shows <q>proof positive</q> of life after death. A people-watcher stalks an unreadable man. Adapted from stories by Graham Greene and Edgar Allen Poe.</p>",
	"file": "Proof-Crowd",
	"duration": 1138
	}
]
},
{
"code": "CAS",
"heading": "<abbr class=\"unmodified-abbr\" title=\"Clark Ashton Smith\">CAS</abbr>iana",
"blurb": "<p>Collected readings of the weird fiction of Clark Ashton Smith.</p>",
"source": "<a href=\"http://www.eldritchdark.com/writings/spoken-word/\" rel=\"external\">The Eldritch Dark</a>",
"shows":[
	{
	"code": "1",
	"heading": "#1: <cite>The City of the Singing Flame</cite>, part 1",
	"blurb": "<p>A writer walks between worlds to a city where people sacrifice themselves to a vast, singing flame. Read by Mike Cothran.</p>",
	"notes": "self-destructive urges",
	"file": "Flame-pt1",
	"duration": 2907
	},
	{
	"code": "2",
	"heading": "#2: <cite>The City of the Singing Flame</cite>, part 2",
	"blurb": "<p>A writer walks between worlds to a city where people sacrifice themselves to a vast, singing flame. Read by Mike Cothran.</p>",
	"notes": "self-destructive urges",
	"file": "Flame-pt2",
	"duration": 1779
	},
	{
	"code": "3",
	"heading": "#3: <cite>The City of the Singing Flame</cite>, part 3",
	"blurb": "<p>A writer walks between worlds to a city where people sacrifice themselves to a vast, singing flame. Read by Mike Cothran.</p>",
	"notes": "self-destructive urges",
	"file": "Flame-pt3",
	"duration": 1943
	},
	{
	"code": "4",
	"heading": "#4: <cite>The Door to Saturn</cite>, part 1",
	"blurb": "<p>An inquisitor and his occult quarry must unite to survive on an alien world. Read by Zilbethicus.</p>",
	"file": "Saturn-pt1",
	"duration": 1426,
	"banger": true
	},
	{
	"code": "5",
	"heading": "#5: <cite>The Door to Saturn</cite>, part 2",
	"blurb": "<p>An inquisitor and his occult quarry must unite to survive on an alien world. Read by Zilbethicus.</p>",
	"notes": "alcohol",
	"file": "Saturn-pt2",
	"duration": 1978,
	"banger": true
	},
	{
	"code": "6",
	"heading": "#6: <cite>The Maze of Maâl Dweb</cite>",
	"blurb": "<p>A hunter intrudes in the palace-maze of the sorcerer Maâl Dweb to rescue his beloved from the cruel lord. Read by Mike Cothran.</p>",
	"file": "Maze",
	"duration": 2266
	},
	{
	"code": "7",
	"heading": "#7: <cite>The Dark Eidolon</cite>, part 1",
	"blurb": "<p>A necromancer takes exquisite revenge upon the ruler who wronged him. Read by Mike Cothran.</p>",
	"file": "Eidolon-pt1",
	"duration": 2390
	},
	{
	"code": "8",
	"heading": "#8: <cite>The Dark Eidolon</cite>, part 2",
	"blurb": "<p>A necromancer takes exquisite revenge upon the ruler who wronged him. Read by Mike Cothran.</p>",
	"notes": "crush death, descriptions of gore, horse trampling, poisoning, possession",
	"file": "Eidolon-pt2",
	"duration": 2576
	},
	{
	"code": "9",
	"heading": "poems",
	"blurb": "<p>Seven of Smith's poems, read by the author himself: <cite>High Surf</cite>, <cite>Malediction</cite>, <cite>Desert Dweller</cite>, <cite>Seeker</cite>, <cite>Moly</cite>, <cite>Nada</cite>, and <cite>Don Quixote on Market Street</cite>.</p>",
	"file": "Poems",
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
"shows":[
	{
	"code": "66",
	"heading": "#66: <cite>Nightmare</cite>",
	"blurb": "<p>A tired, sick man has a surreal nightmare that shifts from memory to memory around him.</p>",
	"notes": "gaslighting, mob violence, parental death, seizure",
	"file": "Nightmare",
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
"shows":[
	{
	"code": "A031",
	"heading": "A#31: <cite>Danse Macabre</cite>",
	"blurb": "<p>Death stalks the land figuratively, as plague brings a kingdom to its knees, and literally, as a lonely fiddler seeking someone to dance to his tune.</p>",
	"file": "Macabre",
	"duration": 1771
	},
	{
	"code": "A034",
	"heading": "A#34: <cite>The Fall of the City</cite>",
	"blurb": "<p>Prophets, hierophants, and generals give grandiose speeches while the master of war descends on their &ldquo;free&rdquo; city. Featuring a young Orson Welles.</p>",
	"notes": "human sacrifice, mass panic",
	"file": "Fall",
	"duration": 1610,
	"banger": true
	},
	{
	"code": "D27",
	"heading": "D#27: <cite>The City Wears a Slouch Hat</cite>",
	"blurb": "<p>An omniscient man slips from surreal scene to scene in a city under cacophonous downpour. Scored by John Cage, for household objects.</p>",
	"notes": "car crash, kidnapping, mugging",
	"file": "Slouch",
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
"shows":[
	{
	"code": "04",
	"heading": "#4: <cite>The Demon Tree</cite>",
	"blurb": "<p>Bored travellers at a holiday resort seek an infamous, murderous tree.</p>",
	"notes": "fall death, quicksand, strangulation",
	"file": "Tree",
	"duration": 1418
	},
	{
	"code": "18",
	"heading": "#18: <cite>Pennsylvania Turnpike</cite>",
	"blurb": "<p>An ancient man waits at a turnpike gas station to help a fated traveller find the lost town of Pine Knob.</p>",
	"notes": "car crash, gunshot (22:41)",
	"file": "Turnpike",
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
"shows":[
	{
	"code": "11",
	"heading": "#11: <cite>There Will Come Soft Rains</cite> and <cite>Zero Hour</cite>",
	"blurb": "<p>An automated house goes through the motions after nuclear holocaust. Children play &ldquo;invasion&rdquo;, a game with deadly consequences. Adapted from stories by Ray Bradbury.</p>",
	"notes": "animal death, mentions of corporal punishment, fire, high-pitched sounds",
	"file": "Rains-Zero",
	"duration": 1797
	},
	{
	"code": "15",
	"heading": "#15: <cite>The Man in the Moon</cite>",
	"blurb": "<p>The <abbr class=\"unmodified-abbr\">US</abbr> Missing Persons Bureau receives calls for help&mdash;beamed straight from the moon.</p>",
	"notes": "abduction, betrayal, food adverts, gunshots (20:00), sanism",
	"file": "Moon",
	"duration": 1813
	},
	{
	"code": "17",
	"heading": "#17: <cite>The Potters of Firsk</cite>",
	"blurb": "<p>A space colonist learns the secret of planet Firsk's exquisite pottery, made with the aid of its ancestors. Adapted from a story by Jack Vance.</p>",
	"notes": "food adverts, gunshot (12:58), kidnapping, racism",
	"file": "Potters",
	"duration": 1669
	},
	{
	"code": "21",
	"heading": "#21: <cite>The Parade</cite>",
	"blurb": "<p>A wealthy client hires an ad firm to announce an alien invasion&mdash;ending in a Martian military parade.</p>",
	"notes": "food adverts, gunshot? (26:54), panic",
	"file": "Parade",
	"duration": 1820
	},
	{
	"code": "25",
	"heading": "#25: <cite>Dr. Grimshaw's Sanitorium</cite>",
	"blurb": "<p>A patient vanishes from a sanitarium&mdash;the doctors say he's dead, but a <abbr class=\"unmodified-abbr\" title=\"private investigator\">PI</abbr>'s not so sure. Adapted from a story by Fletcher Pratt.</p>",
	"notes": "ableism, alcoholism, betrayal, animal attack, car crash, human experiments, injection, mention of suicide, Naziism, non-consensual surgery, sanism",
	"file": "Sanitorium",
	"duration": 1823
	},
	{
	"code": "26",
	"heading": "#26: <cite>And the Moon be Still as Bright</cite>",
	"blurb": "<p>The final human expedition to Mars discovers why the red planet is dead; one man abandons humanity in turn. Adapted from a story by Ray Bradbury.</p>",
	"notes": "alcohol, genocide, gunshots (17:20, 17:54, 19:46, 20:06, 25:47, 26:50)",
	"file": "Bright",
	"duration": 1780,
	"banger": true
	},
	{
	"code": "28",
	"heading": "#28: <cite>The Professor Was a Thief</cite>",
	"blurb": "<p>An eccentric professor causes chaos in New York by stealing landmarks, city blocks, skyscrapers. Adapted from a story by L.&thinsp;Ron Hubbard.</p>",
	"notes": "alcohol",
	"file": "Professor",
	"duration": 1821
	},
	{
	"code": "31",
	"heading": "#31: <cite>Universe</cite>",
	"blurb": "<p>The warring peoples of a universe 25 kilometers wide and 100 levels deep must unite to avert disaster. Adapted from a story by Robert A.&thinsp;Heinlein.</p>",
	"notes": "ableism, cult behaviour, gunshots (8:41&ndash;8:42, 26:01, 26:07&ndash;26:10, 27:19, lynching)",
	"file": "Universe",
	"duration": 1814
	},
	{
	"code": "36",
	"heading": "#36: <cite>Nightmare</cite>",
	"blurb": "<p>All technology, from computers to door handles, conspires against its human masters. Adapted from a poem by Stephen Vincent Benét.</p>",
	"notes": "industrial deaths, institutionalisation, paranoia, traffic deaths",
	"file": "Nightmare",
	"duration": 1494
	},
	{
	"code": "48",
	"heading": "#48: <cite>Kaleidoscope</cite>",
	"blurb": "<p>A spaceship is destroyed, leaving the survivors to drift apart with nothing to do but talk, think, and die. Adapted from a story by Ray Bradbury.</p>",
	"notes": "isolation, parental negligence, suicide",
	"file": "Kaleidoscope",
	"duration": 1772
	},
	{
	"code": "50",
	"heading": "#50: <cite>Nightfall</cite>",
	"blurb": "<p>Astronomers on a world ringed by six suns declare a doomsday prophecy: night will fall and cities will burn. Adapted from a story by Isaac Asimov.</p>",
	"notes": "alcohol, cult belief, mental breakdown",
	"file": "Nightfall",
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
"shows":[
	{
	"code": "006",
	"heading": "#6: <cite>The Ring of Thoth</cite>",
	"blurb": "<p>An Egyptologist has a chance encounter with the subjects of an ancient tragedy. Adapted from a story by Arthur Conan Doyle, starring Jack Webb.</p>",
	"notes": "plague",
	"file": "Thoth",
	"duration": 1771
	},
	{
	"code": "015",
	"heading": "#15: <cite>Casting the Runes</cite>",
	"blurb": "<p>A scholar pens a scathing review of a crackpot's work, inciting arcane revenge. Adapted from a story by M.&thinsp;R.&thinsp;James.</p>",
	"notes": "food poisoning, stalking",
	"file": "Runes",
	"duration": 1770,
	"banger": true
	},
	{
	"code": "052",
	"heading": "#52: <cite>A Dream of Armageddon</cite>",
	"blurb": "<p>A man dreams of a world rolling inevitably towards annihilation. Adapted from a story by H.&thinsp;G.&thinsp;Wells.</p>",
	"notes": "being eaten while conscious, explosions (13:56&ndash;14:08), gunshots (14:43, 19:48&ndash;50, 22:47&ndash;50), poison gas, stab death, starvation",
	"file": "Armageddon",
	"duration": 1770,
	"banger": true
	},
	{
	"code": "053",
	"heading": "#53: <cite>Evening Primrose</cite>",
	"blurb": "<p>A poet rejects society to live unseen in a department store&mdash;but he's not the first. Adapted from a story by John Collier, starring William Conrad.</p>",
	"file": "Primrose",
	"duration": 1771
	},
	{
	"code": "117",
	"heading": "#117: <cite>Blood Bath</cite>",
	"blurb": "<p>Five men find a trillion-dollar deposit of Amazonian uranium, but greed gets the better of them. Starring Vincent Price.</p>",
	"notes": "betrayal, malaria, eaten by piranhas",
	"file": "Bath",
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
"shows":[
	{
	"code": "1",
	"heading": "part 1",
	"blurb": "<p>From <cite>The Assignation</cite> to <cite>The Unpasturable Fields</cite>.</p>",
	"notes": "fall death, poisoning, suicide",
	"file": "starts-Assignation",
	"duration": 2139,
	"banger": true
	},
	{
	"code": "2",
	"heading": "part 2",
	"blurb": "<p>From <cite>The Worm and the Angel</cite> to <cite>Spring in Town</cite>.</p>",
	"file": "starts-Angel",
	"duration": 1854,
	"banger": true
	},
	{
	"code": "3",
	"heading": "part 3",
	"blurb": "<p>From <cite>How the Enemy Came to Thlunrana</cite> to <cite>The Reward</cite>.</p>",
	"file": "starts-Enemy",
	"duration": 1834,
	"banger": true
	},
	{
	"code": "4",
	"heading": "part 4",
	"blurb": "<p>From <cite>The Trouble in Leafy Green Street</cite> to <cite>The Tomb of Pan</cite>.</p>",
	"notes": "animal sacrifice, lynching",
	"file": "starts-Trouble",
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
"shows":[
	{
	"code": "1",
	"heading": "part 1",
	"blurb": "<p>Chapters 1 and 2: <cite>The Experiment</cite> and <cite>Mr. Clarke's Memoirs</cite>.</p>",
	"notes": "ableism, brain surgery, child death?, child endangerment",
	"file": "Experiment-Memoirs",
	"duration": 1968
	},
	{
	"code": "2",
	"heading": "part 2",
	"blurb": "<p>Chapters 3 and 4: <cite>The City of Resurrections</cite> and <cite>The Discovery in Paul Street</cite>.</p>",
	"file": "City-Street",
	"duration": 1745
	},
	{
	"code": "3",
	"heading": "part 3",
	"blurb": "<p>Chapters 5 and 6: <cite>The Letter of Advice</cite> and <cite>The Suicides</cite>.</p>",
	"file": "Letter-Suicides",
	"duration": 1760
	},
	{
	"code": "4",
	"heading": "part 4",
	"blurb": "<p>Chapters 7 and 8: <cite>The Encounter in Soho</cite> and <cite>The Fragments</cite>.</p>",
	"notes": "body horror",
	"file": "Soho-Fragments",
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
"shows":[
	{
	"code": "A21",
	"heading": "A#21: <cite>The Judge's House</cite>",
	"blurb": "<p>An exam student rents a malignant old house and comes face to face with the hanging judge who once lived there. Adapted from a story by Bram Stoker.</p>",
	"notes": "animal swarm",
	"file": "Judge",
	"duration": 1613,
	"banger": true
	},
	{
	"code": "B3",
	"heading": "B#3: <cite>The Shadow People</cite>",
	"blurb": "<p>A young woman is targeted by murderous living shadows that extinguish her family one by one.</p>",
	"file": "Shadow",
	"duration": 1461,
	"banger": true
	},
	{
	"code": "C10",
	"heading": "C#10: <cite>The Masks of Ashor</cite>",
	"blurb": "<p>A couple receive a curio from their world-travelling uncle&mdash;two golden masks belonging to an ancient devil of death.</p>",
	"notes": "animal attack",
	"file": "Masks",
	"duration": 1407
	},
	{
	"code": "C12",
	"heading": "C#12: <cite>The Night the Fog Came</cite>",
	"blurb": "<p>Scientists discover microbes that spread by fog and drown anyone they touch&mdash;and the fog is spreading in a wave of death.</p>",
	"file": "Fog",
	"duration": 1401
	},
	{
	"code": "C27",
	"heading": "C#27: <cite>The Man in Black</cite>",
	"blurb": "<p>Two friends catch the eye of the nocturnal evil, the &ldquo;man in black&rdquo;.</p>",
	"file": "Black",
	"duration": 1435,
	"banger": true
	},
	{
	"code": "C43",
	"heading": "C#43: <cite>He Who Follows Me</cite>",
	"blurb": "<p>A couple disturb a sleeping evil in the grounds of an abandoned mansion&mdash;the &ldquo;Death That Walks&rdquo;.</p>",
	"notes": "stalking",
	"file": "Follows",
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
"shows":[
	{
	"code": "0",
	"heading": "poems",
	"blurb": "<p>Two poems from the collection: the dedication (a fragment of the play) and <cite>The Prophet's Paradise</cite>.</p>",
	"file": "Poems",
	"duration": 525
	},
	{
	"code": "1",
	"heading": "1: <cite>The Repairer of Reputations</cite>, part 1",
	"blurb": "<p>A man losing touch with reality plots to overthrow the aristocratic-fascist government and declare himself supreme leader.</p>",
	"notes": "hallucination?, institutionalisation, mention of suicide",
	"file": "Repairer-pt1",
	"duration": 1416
	},
	{
	"code": "2",
	"heading": "1: <cite>The Repairer of Reputations</cite>, part 2",
	"blurb": "<p>A man losing touch with reality plots to overthrow the aristocratic-fascist government and declare himself supreme leader.</p>",
	"notes": "ableism, hallucination, suicide",
	"file": "Repairer-pt2",
	"duration": 1774
	},
	{
	"code": "3",
	"heading": "1: <cite>The Repairer of Reputations</cite>, part 3",
	"blurb": "<p>A man losing touch with reality plots to overthrow the aristocratic-fascist government and declare himself supreme leader.</p>",
	"notes": "animal attack, hallucination?, institutionalisation",
	"file": "Repairer-pt3",
	"duration": 1938
	},
	{
	"code": "4",
	"heading": "2: <cite>The Mask</cite>",
	"blurb": "<p>Bohemians experiment with drugs, art, and a concoction that turns anything into solid marble.</p>",
	"notes": "suicide",
	"file": "Mask",
	"duration": 2444
	},
	{
	"code": "5",
	"heading": "3: <cite>The Court of the Dragon</cite>",
	"blurb": "<p>After reading the banned play <cite>The King in Yellow</cite>, a man is haunted by a sinister organist and visions of the living god.</p>",
	"file": "Court",
	"duration": 1341,
	"banger": true
	},
	{
	"code": "6",
	"heading": "4: <cite>The Yellow Sign</cite>",
	"blurb": "<p>A painter and his model encounter an abomination after reading the banned play <cite>The King in Yellow</cite>.</p>",
	"file": "Sign",
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
"shows":[
	{
	"code": "01",
	"heading": "#1: <cite>The Nameless City</cite>",
	"blurb": "<p>An archaeologist journeys to, and within, an ancient, nameless city not built to human proportions. Written by H.&thinsp;P.&thinsp;Lovecraft, read by Dean Delp.</p>",
	"notes": "claustrophobia, darkness",
	"file": "Nameless",
	"duration": 1735
	},
	{
	"code": "02",
	"heading": "#2: <cite>An Occurrence at Owl Creek Bridge</cite>",
	"blurb": "<p>A Confederate slave owner and attempted saboteur has a miraculous, harrowing escape from execution. Written by Ambrose Bierce, read by Elise Sauer.</p>",
	"notes": "entrapment, facial wounds, hallucination?, hanging, near-drowning",
	"file": "Occurrence",
	"duration": 1536,
	"banger": true
	},
	{
	"code": "03",
	"heading": "#3: <cite>The White Ship</cite>",
	"blurb": "<p>A lighthouse keeper fantasises of visiting wondrous islands on a white ship&mdash;but his daydream may be more real than he thinks. Written by H.&thinsp;P.&thinsp;Lovecraft, read by D.&thinsp;E.&thinsp;Wittkower.</p>",
	"notes": "animal death, disease, near-drowning, shipwreck",
	"file": "Ship",
	"duration": 1194,
	"banger": true
	},
	{
	"code": "04",
	"heading": "#4: <cite>The Horror of the Heights</cite>",
	"blurb": "<p>An aviator investigates the unsolved deaths of pilots who broke the altitude record&mdash;and discovers an ecosystem in the sky. Written by Arthur Conan Doyle, read by Mike Harris.</p>",
	"notes": "being hunted, decapitation, isolation, jellyfish",
	"file": "Heights",
	"duration": 2206
	},
	{
	"code": "05",
	"heading": "#5: Gods and Abominations (short works by Lovecraft)",
	"blurb": "<p>Three short pieces by H.&thinsp;P.&thinsp;Lovecraft: <cite>What the Moon Brings</cite> (read by Dan Gurzynski), <cite>Dagon</cite> (read by Selim Jamil), and <cite>Nyarlathotep</cite> (read by Tom Hackett).</p><!--\"Nyarlathotep\" reader's name on LibriVox site (Tom Hackett) is different to the one given in the file (Peter Bianzo(?))-->",
	"notes": "being stranded at sea, drowning, drugs, isolation, near-drowning, nightmares, racism, suicide planning, worms",
	"file": "Moon-Dagon-Nyarlathotep",
	"duration": 1719
	},
	{
	"code": "07",
	"heading": "#7: <cite>The Night Wire</cite>",
	"blurb": "<p>Graveyard shift telegram operators receive reports from an unknown town beset by mist and monsters. Written by H.&thinsp;F.&thinsp;Arnold, read by Dan Gurzynski.</p>",
	"file": "Wire",
	"duration": 1014,
	"banger": true
	},
	{
	"code": "08",
	"heading": "#8: <cite><abbr class=\"unmodified-abbr\" title=\"To Be Or Not To Be\">2 B R 0 2 B</abbr></cite>",
	"blurb": "<p>In a future of immortality and severe population control, a father must find three people willing to die so his newborn triplets can be permitted to live. Written by Kurt Vonnegut, read by Alex Clarke.</p>",
	"notes": "gun death, suicide, suicide ideation",
	"file": "Naught",
	"duration": 1080
	},
	{
	"code": "09",
	"heading": "#9: <cite>The Lord of Cities</cite>",
	"blurb": "<p>A human traveller, the road and the river, and the earth itself ruminate on life, beauty, and purpose. Written by Lord Dunsany, read by Ed Humpal.</p>",
	"file": "Cities",
	"duration": 1037
	},
	{
	"code": "10",
	"heading": "#10: Gothic Origins (short works by Poe)",
	"blurb": "<p>Two short pieces by Edgar Allen Poe: <cite>The Masque of the Red Death</cite> (read by Elise Dee) and <cite>The Cask of Amontillado</cite> (read by &ldquo;Caveat&rdquo;).</p>",
	"notes": "betrayal, darkness, entombment",
	"file": "Masque-Amontillado",
	"duration": 1764
	},
	{
	"code": "12",
	"heading": "#12: Things That Talk (short works by Dunsany)",
	"blurb": "<p>Three short pieces by Lord Dunsany: <cite>Blagdaross</cite> (read by Michele Fry), <cite>The Unhappy Body</cite> (read by Andrew Gaunce), and <cite>The Madness of Andlesprutz</cite> (read by Michele Fry).</p>",
	"notes": "abandonment, overwork",
	"file": "Blagdaross-Unhappy-Madness",
	"duration": 1822
	},
	{
	"code": "13",
	"heading": "#13: <cite>The Monkey's Paw</cite>",
	"blurb": "<p>A mummified monkey's paw grants three wishes&mdash;with dread consequences. Written by W.&thinsp;W.&thinsp;Jacobs, read by Travis Baldree.</p>",
	"file": "Paw",
	"duration": 1606
	},
	{
	"code": "15",
	"heading": "#15: <cite>Mysterious Disappearances</cite>",
	"blurb": "<p>Three accounts of unexplained disappearances. Written by Ambrose Bierce, read by Piotr Nater.</p>",
	"file": "Disappearances",
	"duration": 872
	},
	{
	"code": "17",
	"heading": "#17: <cite>What Was It?</cite>",
	"blurb": "<p>Lodgers at a supposedly-haunted house discover an invisible supernumerary resident. Written by Fitz-James O'Brien, read by Rafe Ball.</p>",
	"notes": "being trapped, starvation, strangulation",
	"file": "What",
	"duration": 2204
	},
	{
	"code": "18",
	"heading": "#18: Dreams and Nightmares (poems)",
	"blurb": "<p>Collected poems on dreams and nightmares. Written by Seigfried Sassoon, Samuel Taylor Coleridge, Helen Hunt Jackson, Clark Ashton Smith, William Danby, and John James Piatt; read by Nemo, Algy Pug, Newgatenovelist, and Colleen McMahon.</p>",
	"file": "Dreams-and-Nightmares",
	"duration": 874
	},
	{
	"code": "19",
	"heading": "#19: <cite>Carcassonne</cite>",
	"blurb": "<p>A young king and his warriors attempt to conquer the unconquerable. Written by Lord Dunsany, read by Daniel Davison.</p>",
	"file": "Carcassonne",
	"duration": 2190,
	"banger": true
	},
	{
	"code": "20",
	"heading": "#20: <cite>The Facts in the Case of <abbr class=\"unmodified-abbr\" title=\"Monsieur\">M.</abbr> Valdemar</cite>",
	"blurb": "<p>A mesmerist preserves a man beyond death. Written by Edgar Allen Poe, read by Tony Scheinman.</p>",
	"notes": "extensive descriptions of gore, suicide",
	"file": "Facts",
	"duration": 1560
	},
	{
	"code": "21",
	"heading": "#21: <cite>Imprisoned with the Pharoahs</cite>, part 1",
	"blurb": "<p>A &ldquo;true&rdquo; story of escape artist Harry Houdini's dark encounter under the Sphinx of Giza. Written by H.&thinsp;P.&thinsp;Lovecraft with Houdini, read by Ben Tucker.</p>",
	"notes": "betrayal, darkness, kidnapping, racism",
	"file": "Pharoahs-pt1",
	"duration": 1911
	},
	{
	"code": "22",
	"heading": "#22: <cite>Imprisoned with the Pharoahs</cite>, part 2",
	"blurb": "<p>A &ldquo;true&rdquo; story of escape artist Harry Houdini's dark encounter under the Sphinx of Giza. Written by H.&thinsp;P.&thinsp;Lovecraft with Houdini, read by Ben Tucker.</p>",
	"notes": "betrayal, darkness, kidnapping, racism",
	"file": "Pharoahs-pt2",
	"duration": 2162
	},
	{
	"code": "23",
	"heading": "#23: <cite>A Hunger Artist</cite>",
	"blurb": "<p>The life of a performer who starves themself for the crowd. Written by Franz Kafka, read by Cori Samuel.</p>",
	"file": "Hunger",
	"duration": 1754
	},
	{
	"code": "25",
	"heading": "#25: <cite>The Stroller</cite>",
	"blurb": "<p>A bickering couple have a near-deadly doppelganger encounter. Written by Margaret St. Clair, read by quartertone.</p>",
	"notes": "betrayal",
	"file": "Stroller",
	"duration": 1100
	},
	{
	"code": "27",
	"heading": "#27: Tales of Cities",
	"blurb": "<p><cite>The Idle City</cite> (written by Lord Dunsany, read by Daniel Davison) and <cite>The City of My Dreams</cite> (written by Theodore Dreiser, read by Phil Schempf).</p>",
	"file": "Idle-Dreams",
	"duration": 1370
	},
	{
	"code": "30",
	"heading": "#30: <cite>The Doom That Came to Sarnath</cite>",
	"blurb": "<p>A young city rises by exterminating its neighbours, until doom descends upon it in turn. Written by H.&thinsp;P.&thinsp;Lovecraft, read by Glen Hallstrom.</p>",
	"file": "Sarnath",
	"duration": 1043
	},
	{
	"code": "31",
	"heading": "#31: <cite>The Valley of Spiders</cite>",
	"blurb": "<p>A lord and his servants pursue a girl into a most deadly valley. Written by H.&thinsp;G.&thinsp;Wells, read by Robert Dixon.</p>",
	"notes": "being trapped, betrayal, foot injury",
	"file": "Valley",
	"duration": 1427
	},
	{
	"code": "32",
	"heading": "#32: <cite>The Crawling Chaos</cite>",
	"blurb": "<p>A man in an opium abyss has a beautiful vision of apocalypse. Written by H.&thinsp;P.&thinsp;Lovecraft, read by D.&thinsp;E&thinsp;Wittkower.</p>",
	"file": "Chaos",
	"duration": 1529
	},
	{
	"code": "33",
	"heading": "#33: <cite>Caterpillars</cite>",
	"blurb": "<p>Monstrous caterpillars haunt the visitor to an isolated villa&mdash;in dream, then reality. Written by E.&thinsp;F.&thinsp;Benson, read by Andy Minter.</p>",
	"notes": "cancer",
	"file": "Caterpillars",
	"duration": 1278
	},
	{
	"code": "34",
	"heading": "#34: <cite>Fog</cite>",
	"blurb": "<p>A sickly boy and ethereal girl long for each other over the gulf of fog, sea, and time. Written by Dana Burnet, read by Colleen McMahon.</p>",
	"file": "Fog",
	"duration": 1783
	},
	{
	"code": "35",
	"heading": "#35: <cite>Ancient Lights</cite>",
	"blurb": "<p>A surveyor hired to help clear a fey wood gets lost in illusion after walking between the trees. Written by Algernon Blackwood, read by Samanem.</p>",
	"file": "Ancient",
	"duration": 940
	},
	{
	"code": "36",
	"heading": "#36: <cite>The Kingdom of the Worm</cite>",
	"blurb": "<p>A travelling knight offends the king of worms and is imprisoned in its kingdom. Written by Clark Ashton Smith, read by Ben Tucker.</p>",
	"notes": "claustrophobia, darkness",
	"file": "Kingdom",
	"duration": 1202
	},
	{
	"code": "38",
	"heading": "#38: <cite>The Primal City</cite>",
	"blurb": "<p>An expedition to an ancient mountain city finds its denizens gone, but its sentinels on alert. Written by Clark Ashton Smith, read by Ben Tucker.</p>",
	"file": "Primal",
	"duration": 991
	},
	{
	"code": "39",
	"heading": "#39: Forgotten Gods (short works by Dunsany)",
	"blurb": "<p>Three short pieces by Lord Dunsany, read by Sandra Cullum: <cite>The Gift of the Gods</cite>, <cite>An Archive of the Older Mysteries</cite>, and <cite>How the Office of Postman Fell Vacant in Otford-under-the-Wold</cite>.</p>",
	"file": "Gift-Archive-Postman",
	"duration": 1171
	},
	{
	"code": "40",
	"heading": "#40: Hauntings and Vanishings (short works by Bierce)",
	"blurb": "<p>Three short pieces by Ambrose Bierce: <cite>The Spook House</cite> (read by Paul Sigel), <cite>A Cold Greeting</cite> (read by Steve Karafit), and <cite>An Inhabitant of Carcosa</cite> (read by G.&thinsp;C.&thinsp;Fournier).</p>",
	"notes": "entombment",
	"file": "Spook-Greeting-Carcosa",
	"duration": 1484
	},
	{
	"code": "41",
	"heading": "#41: <cite>The Music of Erich Zann</cite>",
	"blurb": "<p>A musician plays nightly eldritch harmonies for the void beyond his window. Written by H.&thinsp;P.&thinsp;Lovecraft, read by Cameron Halket.</p>",
	"notes": "ableism",
	"file": "Zann",
	"duration": 1130
	},
	{
	"code": "42",
	"heading": "#42: Ancient Humanities (short works by Lovecraft)",
	"blurb": "<p>Two short pieces by H.&thinsp;P.&thinsp;Lovecraft: <cite>Polaris</cite> (read by jpontoli) and <cite>The Outer Gods</cite> (read by Peter Yearsley).</p>",
	"notes": "racism",
	"file": "Polaris-Outer",
	"duration": 1514,
	"banger": true
	},
	{
	"code": "43",
	"heading": "#43: <cite>Novel of the White Powder</cite>",
	"blurb": "<p>An excerpt from the occult horror novel <cite>The Three Impostors; or, The Transmutations</cite>: a mourner relates how a medicine transfigured her brother. Written by Arthur Machen, read by Tony Oliva.</p>",
	"notes": "body horror",
	"file": "Powder",
	"duration": 2514
	},
	{
	"code": "44",
	"heading": "#44: <cite>The Fall of Babbulkund</cite>",
	"blurb": "<p>Babbulkund, City of Marvel, city of wonders, city on travellers' lips&mdash;Babbulkund has fallen, decayed, died. Written by Lord Dunsany, read by Alex Clarke.</p>",
	"file": "Babbulkund",
	"duration": 2211,
	"banger": true
	},
	{
	"code": "45",
	"heading": "#45: Power and Spectacle (short works by Kafka)",
	"blurb": "<p>Three short pieces by Franz Kafka: <cite>Before the Law</cite> (read by Availle), <cite>Up in the Gallery</cite> (read by Adam Whybray), and <cite>An Imperial Message</cite> (read by SBE Iyyerwal).</p>",
	"file": "Law-Gallery-Message",
	"duration": 702
	},
	{
	"code": "46",
	"heading": "#46: <cite>The Sword of Welleran</cite>",
	"blurb": "<p>The city of Merimna mourns its heroes, heedless of the foes approaching now its guardians are dead. Written by Lord Dunsany, read by Ed Humpal.</p>",
	"file": "Welleran",
	"duration": 2039,
	"banger": true
	},
	{
	"code": "47",
	"heading": "#47: Great and Little Ones (short works by Dunsany)",
	"blurb": "<p>Three short pieces by Lord Dunsany: <cite>The Whirlpool</cite> (read by James Koss), <cite>The Hurricane</cite> (read by Rosslyn Carlyle), and <cite>On the Dry Land</cite> (read by Rosslyn Carlyle).</p>",
	"file": "Whirlpool-Hurricane-Dry",
	"duration": 1017
	},
	{
	"code": "48",
	"heading": "#48: <cite>Gaffer Death</cite>",
	"blurb": "<p>The German folktale telling of a doctor whose godfather is Death himself. Compiled by Charles John Tibbitts, read by Craig Campbell.</p>",
	"file": "Gaffer",
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
"shows":[
	{
	"code": "A009",
	"heading": "A#9: <cite>Money, Money, Money</cite>",
	"blurb": "<p>A sailor murders his colleague for a winning lottery ticket and takes an offshore salvage-diving job to escape the law&mdash;but he can't escape revenge.</p>",
	"notes": "narcosis",
	"file": "Money",
	"duration": 1785
	},
	{
	"code": "A040-A072-C09",
	"heading": "A#40, A#72, and C#9: <cite>Lights Out</cite> fragments",
	"blurb": "<p>A trio of short <cite>Lights Out</cite> episodes: <cite>Chicken Heart</cite>, <cite>The Dark</cite>, and <cite>The Day the Sun Exploded</cite>.</p>",
	"notes": "body horror, plane crash, racism",
	"file": "Chicken-Dark-Exploded",
	"duration": 1713,
	"banger": true
	},
	{
	"code": "A071",
	"heading": "A#71: <cite>Christmas Story</cite>",
	"blurb": "<p>Three soldiers meet in a train on Christmas Eve, 1918, but they feel like they've met before&hellip;</p>",
	"file": "Christmas",
	"duration": 1800
	},
	{
	"code": "A076",
	"heading": "A#76: <cite>Oxychloride X</cite>",
	"blurb": "<p>A put-upon and rejected chemistry student makes a miracle to spite his tormentors.</p>",
	"notes": "falling death",
	"file": "Oxychloride",
	"duration": 1422
	},
	{
	"code": "B02",
	"heading": "B#2: <cite>Revolt of the Worms</cite>",
	"blurb": "<p>A chemist carelessly disposes of a growth formula, with disastrous consequences.</p>",
	"notes": "crushing death",
	"file": "Worms",
	"duration": 1320,
	"banger": true
	},
	{
	"code": "B07",
	"heading": "B#7: <cite>Come to the Bank</cite>",
	"blurb": "<p>A man walks through a bank wall using mental power&mdash;but gets trapped halfway, to his colleague's mounting terror.</p>",
	"notes": "institutionalisation, mental breakdown",
	"file": "Bank",
	"duration": 1339
	},
	{
	"code": "B23",
	"heading": "B#23: <cite>Paris Macabre</cite>",
	"blurb": "<p>Two tourists in Paris pay to attend an increasingly strange masque ball.</p>",
	"notes": "beheading, traffic death",
	"file": "Paris",
	"duration": 1626
	},
	{
	"code": "B25",
	"heading": "B#25: <cite>The Flame</cite>",
	"blurb": "<p>A man with an affinity for flames summons a pyromaniac demon to his fireplace.</p>",
	"notes": "arson, fire deaths, obsession",
	"file": "Flame",
	"duration": 1400
	},
	{
	"code": "C06",
	"heading": "C#6: <cite>The Ghost on the Newsreel Negative</cite>",
	"blurb": "<p>Two reporters interview a ghost.</p>",
	"notes": "darkness",
	"file": "Newsreel",
	"duration": 1763
	}
]
},
{
"code": "McT",
"heading": "<cite>The Mercury Theatre</cite>",
"blurb": "<p>A 1938 extension of Orson Welles' Mercury Theatre to adapt classic fiction to the airwaves, with each show starring Welles himself in a major role.</p>",
"source": "<a href=\"https://archive.org/details/OrsonWelles_MercuryTheatre\" rel=\"external\">Internet Archive</a>",
"copyrightSafe": true,
"shows":[
	{
	"code": "01a",
	"heading": "#1: <cite>Dracula</cite>, part 1",
	"blurb": "<p>A solicitor, his wife, and her suitors band together with a vampire hunter to slay Count Dracula. Adapted from a story by Bram Stoker.</p>",
	"notes": "confinement",
	"file": "Dracula-pt1",
	"duration": 1290
	},
	{
	"code": "01b",
	"heading": "#1: <cite>Dracula</cite>, part 2",
	"blurb": "<p>A solicitor, his wife, and her suitors band together with a vampire hunter to slay Count Dracula. Adapted from a story by Bram Stoker.</p>",
	"notes": "mind control",
	"file": "Dracula-pt2",
	"duration": 2262
	},
	{
	"code": "17a",
	"heading": "#17: <cite>The War of the Worlds</cite>, part 1",
	"blurb": "<p>An adaptation of H.&thinsp;G.&thinsp;Wells' story of Martians invading Earth; some listeners infamously believed it was a description of real current events.</p>",
	"notes": "asphyxiation, cannon-fire (30:39, 30:55, 31:15, 31:49) poison-gassing",
	"file": "Worlds-pt1",
	"duration": 2451,
	"banger": true
	},
	{
	"code": "17b",
	"heading": "#17: <cite>The War of the Worlds</cite>, part 2",
	"blurb": "<p>An adaptation of H.&thinsp;G.&thinsp;Wells' story of Martians invading Earth; some listeners infamously believed it was a description of real current events.</p>",
	"notes": "asphyxiation, plane crash, poison-gassing",
	"file": "Worlds-pt2",
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
"shows":[
	{
	"code": "001",
	"heading": "#1: <cite>Carcinoma Angels</cite>",
	"blurb": "<p>A genius billionaire with unnatural luck desperately uses a cocktail of hallucinogens to cure his cancer. Written by Norman Spinrad.</p>",
	"notes": "injection, institutionalisation, racism, sterilisation",
	"file": "Carcinoma",
	"duration": 1786,
	"banger": true
	},
	{
	"code": "003",
	"heading": "#3: <cite>Descending</cite>",
	"blurb": "<p>A bullshit artist on a department store spending spree winds up in a never-ending escalator ride&hellip; Written by Thomas M.&thinsp;Disch.</p>",
	"notes": "head injury, mental breakdown, starvation",
	"file": "Descending",
	"duration": 1808,
	"banger": true
	},
	{
	"code": "007",
	"heading": "#7: <cite>Roller Ball Murder</cite>",
	"blurb": "<p>The bloodsport of the future grows more deadly by the year, and its most lauded champions are shells of human beings. Written by William Harrison.</p>",
	"file": "Ball",
	"duration": 1862,
	"banger": true
	},
	{
	"code": "012",
	"heading": "#12: <cite>The Swimmer</cite>",
	"blurb": "<p>A man lounging in a friend's garden pool decides on a whim to swim home through his neighbours' pools. Written by John Cheever.</p>",
	"notes": "alcohol, dementia?, foot injury, humiliation",
	"file": "Swimmer",
	"duration": 1872,
	"banger": true
	},
	{
	"code": "025",
	"heading": "#25: <cite>The Garden of Time</cite>",
	"blurb": "<p>A nobleman and his wife cut the flowers of time to set back the vast waves of humanity that press down on their villa. Written by J.&thinsp;G.&thinsp;Ballard.</p>",
	"file": "Garden",
	"duration": 1809
	},
	{
	"code": "026",
	"heading": "#26: <cite>Test</cite> and <cite>The Nine Billion Names of God</cite>",
	"blurb": "<p>A man passes, then fails, a driving test. Technology helps Tibetan monks write the many names of god. Written by Theodore Thomas and Arthur C.&thinsp;Clarke.</p>",
	"notes": "car crash, institutionalisation",
	"file": "Test-Names",
	"duration": 1862,
	"banger": true
	},
	{
	"code": "031",
	"heading": "#31: <cite>In the Abyss</cite>",
	"blurb": "<p>Wondrous and deadly secrets await the first human explorer to the ocean floor. Written by H.&thinsp;G.&thinsp;Wells.</p>",
	"notes": "claustrophobia, darkness, drowning",
	"file": "Abyss",
	"duration": 1853
	},
	{
	"code": "032",
	"heading": "#32: <cite>A Night in Elf Hill</cite>",
	"blurb": "<p>An ancient alien pleasure dome is hungry to serve anyone it can since its makers abandoned it aeons ago. Written by Norman Spinrad.</p>",
	"notes": "abandonment, cannibalism?",
	"file": "Elf",
	"duration": 1847
	},
	{
	"code": "033",
	"heading": "#33: <cite>The Top</cite>",
	"blurb": "<p>An advertiser for a colossal corporation discovers the secret at the summit of its pyramidal headquarters. Written by George Sumner Albee.</p>",
	"notes": "overwork death",
	"file": "Top",
	"duration": 1846,
	"banger": true
	},
	{
	"code": "051",
	"heading": "#51: <cite>The Evergreen Library</cite>",
	"blurb": "<p>A lawyer visiting a dead client's estate loses himself in the old man's library. Written by Bill Pronzini and Jeffrey Wallmann.</p>",
	"notes": "derealisation",
	"file": "Evergreen",
	"duration": 1854,
	"banger": true
	},
	{
	"code": "057",
	"heading": "#57: <cite>The End</cite>",
	"blurb": "<p>One man keeps building, at the end of all things. Written by Ursula K.&thinsp;Le Guin.</p>",
	"file": "End",
	"duration": 1834,
	"banger": true
	},
	{
	"code": "066",
	"heading": "#66: <cite>Desertion</cite>",
	"blurb": "<p>Human minds are transposed into Jupiter's fauna to explore and colonise the planet&mdash;but they all desert the mission. Written by Clifford Simak.</p>",
	"file": "Desertion",
	"duration": 1860,
	"banger": true
	},
	{
	"code": "071",
	"heading": "#71: <cite>Gas Mask</cite>",
	"blurb": "<p>A massive city descends into total merciless gridlock. Written by James Houston.</p>",
	"file": "Mask",
	"duration": 1845,
	"banger": true
	},
	{
	"code": "075",
	"heading": "#75: <cite>A Walk in the Dark</cite>",
	"blurb": "<p>A lost astronaut takes a six mile walk back to base on a dark dead planet. How dangerous could it be? Written by Arthur C.&thinsp;Clarke.</p>",
	"file": "Walk",
	"duration": 1867
	},
	{
	"code": "076",
	"heading": "#76: <cite>When We Went To See The End Of The World</cite>",
	"blurb": "<p>Time-travelling tourists boast about seeing the end of the world&mdash;until they realise they didn't all see the <em>same</em> end&hellip; Written by Robert Silverberg.</p>",
	"file": "End",
	"duration": 1868
	},
	{
	"code": "082",
	"heading": "#82: <cite>The Plot is the Thing</cite> and <cite>Midnight Express</cite>",
	"blurb": "<p>Doctors lobotomise a <abbr class=\"unmodified-abbr\" title=\"television\">TV</abbr>-obsessed woman, with bizarre results. A young man meets his childhood terror. Written by Robert Block and Alfred Noyes.</p>",
	"notes": "derealisation, injection, institutionalisation, lobotomy, nightmares, racism",
	"file": "Plot-Express",
	"duration": 1804,
	"banger": true
	},
	{
	"code": "088",
	"heading": "#88: <cite>Nackles</cite>",
	"blurb": "<p>An abusive father invents an evil opposite to Santa Claus to terrify his kids, with severe consequences. Written by Curt Clark.</p>",
	"file": "Nackles",
	"duration": 1849,
	"banger": true
	},
	{
	"code": "094",
	"heading": "#94: <cite>But As a Soldier, for His Country</cite>",
	"blurb": "<p>The state refuses to let its best soldier die, no matter how many wars he wins. Written by Stephen Goldin.</p>",
	"file": "Soldier",
	"duration": 1819,
	"banger": true
	},
	{
	"code": "095",
	"heading": "#95: <cite>Winter Housekeeping</cite> and <cite>The Public Hating</cite>",
	"blurb": "<p>A woman takes heavy measures against the poison of ageing. Mass telekinesis is used in horrific new executions. Written by Molly Daniel and Steve Allen.</p>",
	"notes": "asphyxiation, obsession",
	"file": "Winter-Hating",
	"duration": 1850
	},
	{
	"code": "099",
	"heading": "#99: <cite>Ghosts</cite> and <cite>The Diggers</cite>",
	"blurb": "<p>Robots struggle with reproduction. A woman seeks the mysterious Diggers for love of mystery itself. Written by Robert F.&thinsp;Young and Don Stern.</p>",
	"notes": "suicide",
	"file": "Ghosts-Diggers",
	"duration": 1819
	},
	{
	"code": "105",
	"heading": "#105: <cite>Silenzia</cite>",
	"blurb": "<p>A man discovers an air-spray that eats sound; he slowly gives in to the temptation of silence. Written by Alan Nelson.</p>",
	"file": "Silenzia",
	"duration": 1849
	},
	{
	"code": "106",
	"heading": "#106: <cite>Deaf Listener</cite> and <cite>Shall the Dust Praise Thee?</cite>",
	"blurb": "<p>A telepath employed to detect alien life makes a critical error. The Day of Reckoning suffers a hitch. Written by Rachel Payes and Damon Knight.</p>",
	"file": "Listener-Dust",
	"duration": 1846
	},
	{
	"code": "110",
	"heading": "#110: <cite>Appointment at Noon</cite> and <cite>Man in a Quandary</cite>",
	"blurb": "<p>A suspicious man has a suspicious visitor. Someone writes to an advice column for help with a unique problem. Written by Eric Russell and L.&thinsp;J.&thinsp;Stecher.</p>",
	"notes": "ableism",
	"file": "Noon-Quandary",
	"duration": 1852
	},
	{
	"code": "115",
	"heading": "#115: <cite>The Fog Horn</cite>",
	"blurb": "<p>An old fog horn's deafening cry calls forth an ancient titan. Written by Ray Bradbury.</p>",
	"file": "Horn",
	"duration": 1812
	},
	{
	"code": "117",
	"heading": "#117: <cite>The Petrified World</cite>",
	"blurb": "<p>A nervous man shifts between surreal dream and real nightmare. Written by Robert Sheckley.</p>",
	"notes": "near-drowning, nightmares",
	"file": "Petrified",
	"duration": 1826
	},
	{
	"code": "118",
	"heading": "#118: <cite>Island of Fear</cite>",
	"blurb": "<p>An art collector obsesses over the perfect statuary beyond the monolithic wall on a tiny Greek island. Written by William Sambrot.</p>",
	"notes": "near-drowning",
	"file": "Island",
	"duration": 1811,
	"banger": true
	},
	{
	"code": "124",
	"heading": "#124: <cite>After the Myths Went Home</cite>",
	"blurb": "<p>Humanity calls forth old heroes and gods, only to decide they're more trouble than they're worth. Written by Robert Silverberg.</p>",
	"file": "Myths",
	"duration": 1842
	},
	{
	"code": "125",
	"heading": "#125: <cite>The Rules of the Road</cite>",
	"blurb": "<p>An alien ship lands in the desert. None who enter survive&mdash;until one man finds within it the awful secrets of the universe. Written by Norman Spinrad.</p>",
	"notes": "imprisonment, psychological torture",
	"file": "Rules",
	"duration": 1821,
	"banger": true
	},
	{
	"code": "133",
	"heading": "#133: <cite>None Before Me</cite>",
	"blurb": "<p>A collector of the very best of everything obsesses over an exquisitely life-like dollhouse. Written by Sidney Carroll.</p>",
	"notes": "fatphobia",
	"file": "None",
	"duration": 1855,
	"banger": true
	},
	{
	"code": "139",
	"heading": "#139: <cite>The Eternal Machines</cite>",
	"blurb": "<p>The lonely warden of a scrap planet builds a museum of machines he intends to outlast humanity. Written by William Spencer.</p>",
	"file": "Eternal",
	"duration": 1854
	},
	{
	"code": "147",
	"heading": "#147: <cite>The Maze</cite>",
	"blurb": "<p>A stranded scientist experimenting on mice finds herself slipping into the centre of the maze. Written by Stuart Dybek.</p>",
	"notes": "animal cannibalism, bestiality, imprisonment, rape, rotting animals, torture",
	"file": "Maze",
	"duration": 1842,
	"banger": true
	},
	{
	"code": "149",
	"heading": "#149: <cite>The Worm</cite>",
	"blurb": "<p>An old man refuses to leave his home even as it's crushed by a giant worm. Written by David Keller.</p>",
	"file": "Worm",
	"duration": 1776,
	"banger": true
	},
	{
	"code": "160",
	"heading": "#160: <cite>Letter to a Phoenix</cite>",
	"blurb": "<p>An immortal writes a letter of advice from over a hundred millennia of solitude and thought. Written by Fredric Brown.</p>",
	"file": "Phoenix",
	"duration": 1859,
	"banger": true
	},
	{
	"code": "162",
	"heading": "#162: <cite>The Vertical Ladder</cite>",
	"blurb": "<p>A young boy, dared by his peers, climbs the ladder of a towering gasometer. Written by William Sansom.</p>",
	"notes": "abandonment, ableism, child endangered",
	"file": "Ladder",
	"duration": 1838,
	"banger": true
	},
	{
	"code": "165",
	"heading": "#165: <cite>Restricted Area</cite>",
	"blurb": "<p>A spaceship crew scientifically investigate an eerily perfect planet. Written by Robert Sheckley.</p>",
	"file": "Restricted",
	"duration": 1838
	},
	{
	"code": "169",
	"heading": "#169: <cite>The Available Data on the Worp Reaction</cite>",
	"blurb": "<p>An intellectually disabled boy gathers scrap from the city junkyard and builds a machine that confounds all observers. Written by Lion Miller.</p>",
	"file": "Worp",
	"duration": 1850
	},
	{
	"code": "176",
	"heading": "#176: <cite>Transformer</cite>",
	"blurb": "<p>The quaint railway town of Elm Point is switched off, boxed away, and sold on. Written by Chad Oliver.</p>",
	"file": "Transformer",
	"duration": 1800
	},
	{
	"code": "237",
	"heading": "#237: <cite>The Star</cite> and <cite>The Gift</cite>",
	"blurb": "<p>An apocalyptic blaze&mdash;a guiding star. A boy receives a wondrous Christmas gift. Written by Arthur C.&thinsp;Clarke and Ray Bradbury.</p>",
	"file": "Star-Gift",
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
"shows":[
	{
	"code": "111",
	"heading": "#111: <cite>The Locomotive Ghost</cite>",
	"blurb": "<p>Two men derail and rob a payday train, only to suffer the wrath of the Judgement Special&mdash;a ghostly train that hunts those who defile the railways.</p>",
	"notes": "asphyxiation, gunshots (6:44, 7:28), rail crash, paranoia",
	"file": "Locomotive",
	"duration": 1747,
	"banger": true
	},
	{
	"code": "256",
	"heading": "#256: <cite>The Lady in Red</cite>",
	"blurb": "<p>A reporter follows a trail of mob murders attended by a mysterious woman in a striking red dress.</p>",
	"notes": "alcohol, fall death, gunshots (4:38&ndash;40, 4:50&ndash;53, 24:06)",
	"file": "Red",
	"duration": 1735
	}
]
},
{
"code": "Nf",
"heading": "<cite>Nightfall</cite>",
"blurb": "<p>A 1980&ndash;83 Canadian series of original and adapted horror stories created by Bill Howell.</p>",
"source": "<a href=\"https://archive.org/details/CBC_NightfallOTR\" rel=\"external\">Internet Archive</a>",
"shows":[
	{
	"code": "003",
	"heading": "#3: <cite>Welcome to Homerville</cite>",
	"blurb": "<p>A trucker follows a sinister radio siren's call.</p>",
	"notes": "truck crash",
	"file": "Homerville",
	"duration": 1707
	},
	{
	"code": "014",
	"heading": "#14: <cite>The Stone Ship</cite>",
	"blurb": "<p>A ship finds a massive vessel of stone out on the open sea, full of treasures and monsters. Adapted from a story by William Hope Hodgson.</p>",
	"notes": "drowning, gunshots (19:24&ndash;29)",
	"file": "Ship",
	"duration": 1519
	},
	{
	"code": "018",
	"heading": "#18: <cite>Ringing the Changes</cite>",
	"blurb": "<p>Honeymooners in tiny coastal town find the ocean missing, the people unwelcoming, and the bells all ringing louder every hour.</p>",
	"notes": "break-in, forced stripping, mob attack, sexual assault (themes?)",
	"file": "Ringing",
	"duration": 1683,
	"banger": true
	},
	{
	"code": "034",
	"heading": "#34: <cite>The Book of Hell</cite>",
	"blurb": "<p>Three publishers read the &ldquo;Book of Hell&rdquo;, an account of infernal torment written by a man who's been dead for years.</p>",
	"notes": "explosion (24:56), injections, involuntary medical experiments",
	"file": "Hell",
	"duration": 1729,
	"banger": true
	},
	{
	"code": "042",
	"heading": "#42: <cite>In the Name of the Father</cite>",
	"blurb": "<p>A grieving writer recovers in an old fishing town with a deep link to the sharks that swim its waters.</p>",
	"notes": "implied bestiality, parental death, pregnancy",
	"file": "Father",
	"duration": 1757,
	"banger": true
	},
	{
	"code": "062",
	"heading": "#62: <cite>The Road Ends at the Sea</cite><!--title listed in the Internet Archive collection appears to be incorrect-->",
	"blurb": "<p>A couple of lighthouse keepers' solitude is broken by the arrival of an old &ldquo;friend&rdquo;&mdash;and romantic rival&mdash;and a massive black freighter just offshore.</p>",
	"file": "Sea",
	"duration": 1734
	},
	{
	"code": "075",
	"heading": "#75: <cite>Lazarus Rising</cite>",
	"blurb": "<p>A reporter investigates a small-town resurrection and slowly uncovers the festering truth.</p>",
	"notes": "arson, phone eavesdropping",
	"file": "Lazarus",
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
"shows":[
	{
	"code": "01",
	"heading": "book 1: <cite>The Gods of Pegāna</cite>, part 1",
	"blurb": "<p>From the preface to <cite>Revolt of the Home Gods</cite>. Read by Jason Mills.</p>",
	"file": "GoP-1",
	"duration": 2261
	},
	{
	"code": "02",
	"heading": "book 1: <cite>The Gods of Pegāna</cite>, part 2",
	"blurb": "<p>From <cite>Of Dorozhand</cite> to <cite>Of How the Gods Whelmed Sidith</cite>. Read by Jason Mills.</p>",
	"file": "GoP-2",
	"duration": 1708
	},
	{
	"code": "03",
	"heading": "book 1: <cite>The Gods of Pegāna</cite>, part 3",
	"blurb": "<p>From <cite>Of How Imbaun Became High Prophet in Aradec of All the Gods Save One</cite> to <cite>The Bird of Doom and the End</cite>. Read by Jason Mills.</p>",
	"file": "GoP-3",
	"duration": 1731
	},
	{
	"code": "04",
	"heading": "book 2: <cite>Time and the Gods</cite>, part 1",
	"blurb": "<p>From the preface to <cite>A Legend of the Dawn</cite>. Read by KentF.</p>",
	"file": "TG-1",
	"duration": 1889
	},
	{
	"code": "05",
	"heading": "book 2: <cite>Time and the Gods</cite>, part 2",
	"blurb": "<p>From <cite>The Vengeance of Men</cite> to <cite>The Caves of Kai</cite>. Read by KentF, RedToby, and hefyd.</p>",
	"file": "TG-2",
	"duration": 2233
	},
	{
	"code": "06",
	"heading": "book 2: <cite>Time and the Gods</cite>, part 3",
	"blurb": "<p>From <cite>The Sorrow of Search</cite> to <cite>For the Honour of the Gods</cite>. Read by Le Scal and hefyd.</p>",
	"file": "TG-3",
	"duration": 2238
	},
	{
	"code": "07",
	"heading": "book 2: <cite>Time and the Gods</cite>, part 4",
	"blurb": "<p>From <cite>Night and Morning</cite> to <cite>The South Wind</cite>. Read by Måns Broo.</p>",
	"file": "TG-4",
	"duration": 1445
	},
	{
	"code": "08",
	"heading": "book 2: <cite>Time and the Gods</cite>, part 5",
	"blurb": "<p>From <cite>In the Land of Time</cite> to <cite>The Dreams of the Prophet</cite>. Read by RedToby and hefyd.</p>",
	"file": "TG-5",
	"duration": 2274
	},
	{
	"code": "09",
	"heading": "book 2: <cite>Time and the Gods</cite>, part 6",
	"blurb": "<p><cite>The Journey of the King</cite>, parts &#x2160;&ndash;&#x2166;. Read by Kevin McAsh, Måns Broo, and Robin Cotter.</p>",
	"notes": "alcohol",
	"file": "TG-6",
	"duration": 2485
	},
	{
	"code": "10",
	"heading": "book 2: <cite>Time and the Gods</cite>, part 7",
	"blurb": "<p><cite>The Journey of the King</cite>, parts &#x2167;&ndash;&#x216a;. Readings by Robin Cotter and Elmensdorp.</p>",
	"notes": "alcohol",
	"file": "TG-7",
	"duration": 2346
	},
	{
	"code": "11",
	"heading": "dreams: <cite>Idle Days on the Yann</cite>",
	"blurb": "<p>A dreamer travels the river Yann aboard the ship <i>Bird of the River</i>, stopping in bizarre cities of wonders and monsters along the way. Read by Alex Clarke.</p>",
	"notes": "alcohol",
	"file": "Yann",
	"duration": 2531,
	"banger": true
	},
	{
	"code": "12",
	"heading": "dreams: <cite>A Shop in Go-By Street</cite>",
	"blurb": "<p>The dreamer returns to the Yann via a strange shop of myths and rareties, seeking his friends on the <i>Bird of the River</i>. Read by Ed Humpal.</p>",
	"notes": "alcohol",
	"file": "Shop",
	"duration": 1216,
	"banger": true
	},
	{
	"code": "13",
	"heading": "dreams: <cite>The Avenger of Perdóndaris</cite>",
	"blurb": "<p>The dreamer returns once more and visits the palace of Singanee, avenger of ruined Perdóndaris, and grows weary of dreams. Read by Ed Humpal.</p>",
	"file": "Avenger",
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
"shows":[
	{
	"code": "001",
	"heading": "#1: <cite>Nothing Behind the Door</cite>",
	"blurb": "<p>Bank robbers try to hide the money in a mountain shed that contains nothing. Literally <em>nothing</em>.</p>",
	"file": "Nothing",
	"duration": 1770,
	"banger": true
	},
	{
	"code": "006",
	"heading": "#6: <cite>I Remember Tomorrow</cite>",
	"blurb": "<p>A time-traveller explains why three criminals <em>must</em> be stopped&mdash;and why <em>you</em> will stop them.</p>",
	"notes": "alcohol, betrayal, gunshots (26:16)",
	"file": "Tomorrow",
	"duration": 1688
	},
	{
	"code": "007",
	"heading": "#7: <cite>Inquest</cite>",
	"blurb": "<p>A heartless man faces a murder inquest like no other&mdash;a jury in costume, an audience of millions, and the mysterious Coroner&hellip;</p>",
	"notes": "ableism, broken arm (poorly healed), domestic abuse, financial abuse",
	"file": "Inquest",
	"duration": 1730
	},
	{
	"code": "009",
	"heading": "#9: <cite>A Mile High and a Mile Deep</cite> (script read)",
	"blurb": "<p>The Earth takes its due in the mines far below Butte, Montana&mdash;the city <q>a mile high and a mile deep</q>. An amateur reading of this lost episode's script.</p>",
	"notes": "claustrophobia, darkness",
	"file": "Mile",
	"duration": 1615,
	"banger": true
	},
	{
	"code": "019",
	"heading": "#19: <cite>Camera Obscura</cite>",
	"blurb": "<p>A remorseless killer's victim haunts him through the miniature world of the camera obscura.</p>",
	"notes": "abandonment, drowning",
	"file": "Obscura",
	"duration": 1431
	},
	{
	"code": "022",
	"heading": "#22: <cite>Take Me Out to the Graveyard</cite>",
	"blurb": "<p>A taxi driver tells how all his passengers want to go to the graveyard&mdash;and how they die along the way.</p>",
	"file": "Graveyard",
	"duration": 1474,
	"banger": true
	},
	{
	"code": "024",
	"heading": "#24: <cite>Kill Me Again</cite>",
	"blurb": "<p>A decent man finds himself being murdered over and over again after making a deal with the devil.</p>",
	"notes": "gunshots (2:16)",
	"file": "Kill",
	"duration": 1433
	},
	{
	"code": "027",
	"heading": "#27: <cite>Some People Don't Die</cite>",
	"blurb": "<p>Archaeologists seek the ruins of an ancient society in a desert mesa, only to find the people aren't entirely dead.</p>",
	"notes": "desiccation, imprisonment, racism, snake bite",
	"file": "Die",
	"duration": 1473,
	"banger": true
	},
	{
	"code": "030",
	"heading": "#30: <cite>Rain on New Year's Eve</cite>",
	"blurb": "<p>An overworked horror screenwriter makes monsters for his micro-managing, incompetent director.</p>",
	"file": "Rain",
	"duration": 1472
	},
	{
	"code": "034",
	"heading": "#34: <cite>Green Light</cite>",
	"blurb": "<p>A railwayman tells the tale of how he lost his leg in an impossible train crash.</p>",
	"file": "Light",
	"duration": 1431
	},
	{
	"code": "037",
	"heading": "#37: <cite>Whence Came You?</cite>",
	"blurb": "<p>An archaeologist meets the past in Cairo and entombed below the desert.</p>",
	"notes": "bite injury, claustrophobia, darkness",
	"file": "Whence",
	"duration": 1767,
	"banger": true
	},
	{
	"code": "038",
	"heading": "#38: <cite>Wear the Dead Man's Coat</cite>",
	"blurb": "<p>A homeless beggar kills a man for his coat, then remembers a saying: <q>Wear the dead man's coat, none will take note</q>.</p>",
	"notes": "alcohol, betrayal",
	"file": "Coat",
	"duration": 1752,
	"banger": true
	},
	{
	"code": "040",
	"heading": "#40: <cite>Never Send to Know</cite>",
	"blurb": "<p>A ghost hires a skeptical <abbr class=\"unmodified-abbr\">PI</abbr> to solve his own murder.</p>",
	"notes": "blood, gunshot (2:20), implied suicide",
	"file": "Send",
	"duration": 1715
	},
	{
	"code": "042",
	"heading": "#42: <cite>A Night to Forget</cite>",
	"blurb": "<p>A radio actor has nightmares of his impending death that slowly seep into reality.</p>",
	"notes": "funeral arrangements, gunshots (26:10&ndash;26:16), murder",
	"file": "Forget",
	"duration": 1746
	},
	{
	"code": "045",
	"heading": "#45: <cite>12 to 5</cite>",
	"blurb": "<p>A graveyard shift radio <abbr class=\"unmodified-abbr\" title=\"disc jockey\">DJ</abbr> has an unusual visitor&mdash;a news-reader who reads the future.</p>",
	"file": "Twelve",
	"duration": 1791
	},
	{
	"code": "047",
	"heading": "#47: <cite>Thirteen and Eight</cite>",
	"blurb": "<p>An opportunistic news photographer is plagued by a photobomber only he can see.</p>",
	"notes": "fall injury, gunshots (7:47), traffic death",
	"file": "Thirteen",
	"duration": 1671,
	"banger": true
	},
	{
	"code": "048",
	"heading": "#48: <cite>How Beautiful Upon the Mountain</cite>",
	"blurb": "<p>Two men seek to summit Everest&mdash;giant mountain&mdash;home of the gods&mdash;beautiful, deadly bride.</p>",
	"file": "Mountain",
	"duration": 1763
	},
	{
	"code": "050",
	"heading": "#50: <cite>Gem of Purest Ray</cite>",
	"blurb": "<p>A murderer explains his motive: his victims were agents of an apocalyptic Atlantean conspiracy.</p>",
	"notes": "betrayal, conspiracism, paranoia",
	"file": "Ray",
	"duration": 1759
	},
	{
	"code": "055",
	"heading": "#55: <cite>Let the Lilies Consider</cite>",
	"blurb": "<p>A suspected murderer recounts the triangle of love and hate between he, his wife, and his beloved lilies.</p>",
	"notes": "gunshot (19:01), neglect, suicide",
	"file": "Lilies",
	"duration": 1408
	},
	{
	"code": "058",
	"heading": "#58: <cite>The Man Who Stole a Planet</cite>",
	"blurb": "<p>Archaeologists find the planet Earth in an ancient Mayan temple.</p>",
	"notes": "domestic abuse, natural disaster",
	"file": "Planet",
	"duration": 1454
	},
	{
	"code": "060",
	"heading": "#60: <cite>The Thing on the Fourble Board</cite>",
	"blurb": "<p>An oil derrick pulls an invisible creature from the depths of the earth.</p>",
	"notes": "betrayal, spiders?",
	"file": "Fourble",
	"duration": 1403,
	"banger": true
	},
	{
	"code": "065",
	"heading": "#65: <cite>Symphony in D Minor</cite>",
	"blurb": "<p>A vengeful hypnotist uses Cesar Franck's <cite>Symphony in D Minor</cite>, the series' theme music, to wreak revenge on his adulterous wife and her lover.</p>",
	"notes": "fall death, stab death",
	"file": "Symphony",
	"duration": 1466,
	"banger": true
	},
	{
	"code": "067",
	"heading": "#67: <cite>Light the Lamp for Me</cite>",
	"blurb": "<p>An old man's oil lamp lets him travel to the past as often as he likes&mdash;but only once to the future.</p>",
	"notes": "disease, loneliness",
	"file": "Lamp",
	"duration": 1758
	},
	{
	"code": "068",
	"heading": "#68: <cite>Meet John Smith, John</cite>",
	"blurb": "<p>A man gives to a beggar who just so happens to share his name&mdash;a lot more than his name, in fact.</p>",
	"notes": "adultery, alcohol, murder",
	"file": "Meet",
	"duration": 1710
	},
	{
	"code": "069",
	"heading": "#69: <cite>Beezer's Cellar</cite>",
	"blurb": "<p>Bank robbers hide the loot in an allegedly haunted cellar, betting the legend will keep prying eyes away.</p>",
	"file": "Cellar",
	"duration": 1755
	},
	{
	"code": "072",
	"heading": "#72: <cite>Calling All Souls</cite>",
	"blurb": "<p>Halloween: the dead rise to give a death row inmate one last chance to prove his innocence.</p>",
	"notes": "betrayal",
	"file": "Souls",
	"duration": 1715
	},
	{
	"code": "076",
	"heading": "#76: <cite>My Son, John</cite>",
	"blurb": "<p>A bereaved father begs a wise woman for any way to bring his son back&mdash;no matter the danger, the cost.</p>",
	"notes": "animal attacks, bite injury",
	"file": "John",
	"duration": 1680,
	"banger": true
	},
	{
	"code": "081",
	"heading": "#81: <cite>The Time of the Big Snow</cite>",
	"blurb": "<p>Two young children lose their way in a blizzard and discover the truth behind the old saying about snow: <q>The old woman's picking her geese</q>.</p>",
	"file": "Snow",
	"duration": 1694
	},
	{
	"code": "083",
	"heading": "#83: <cite>Is This Murder?</cite>",
	"blurb": "<p>An expert on prosthetic limbs struggles to reason with his assistant, who's obsessed with making an artificial man.</p>",
	"notes": "alcohol, betrayal, murder?",
	"file": "Murder",
	"duration": 1721
	},
	{
	"code": "084",
	"heading": "#84: <cite>Summer Goodbye</cite>",
	"blurb": "<p>Robbers escape from the police&mdash;but can't seem to escape the hitch-hiker they see over and over again.</p>",
	"notes": "brushfire, gunshots (22:20, 23:48, 24:17), unhealthy romantic relationship",
	"file": "Summer",
	"duration": 1739
	},
	{
	"code": "085",
	"heading": "#85: <cite>Northern Lights</cite>",
	"blurb": "<p>Inventors of a time machine discover the monstrous song of the aurora borealis.</p>",
	"notes": "caterpillars, mind control",
	"file": "Northern",
	"duration": 1729,
	"banger": true
	},
	{
	"code": "088",
	"heading": "#88: <cite>Where Do You Get Your Ideas?</cite>",
	"blurb": "<p>Wyllis Cooper, the series' writer, meets a barfly who wonders where he gets his ideas&mdash;and <em>insists</em> Cooper listens to his own strange story.</p>",
	"notes": "gunshot (12:25)",
	"file": "Ideas",
	"duration": 1499
	},
	{
	"code": "092",
	"heading": "#92: <cite>The Smell of High Wines</cite>",
	"blurb": "<p>A distillery worker recalls the dark moments of his life where the smell of high wines presaged death.</p>",
	"notes": "blood, stab death, strangulation, suicide?",
	"file": "Wines",
	"duration": 1620,
	"banger": true
	},
	{
	"code": "099",
	"heading": "#99: <cite>The Other Side of the Stars</cite>",
	"blurb": "<p>A treasure hunter and his companion investigate an ancient well and find music from beyond the stars.</p>",
	"notes": "animal deaths, gunshots (13:07), possession?",
	"file": "Stars",
	"duration": 1763
	},
	{
	"code": "103",
	"heading": "#103: <cite>Tanglefoot</cite>",
	"blurb": "<p>A man breeds giant flies whose hunger grows in proportion&hellip; and out of control.</p>",
	"notes": "animal death, betrayal",
	"file": "Tanglefoot",
	"duration": 1718
	},
	{
	"code": "106",
	"heading": "#106: <cite>Quiet, Please</cite>",
	"blurb": "<p>The last man alive tells a story of love, hate, bigotry, supremacism, and war&mdash;all-consuming war.</p>",
	"file": "Quiet",
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
"shows":[
	{
	"code": "58",
	"heading": "#58: <cite>The Wind</cite>",
	"blurb": "<p>A former pilot is deathly afraid of the wind, which he believes is out to kill him, but his friends can't&mdash;or won't&mdash;help. Adapted from a story by Ray Bradbury.</p>",
	"notes": "sanism",
	"file": "Wind",
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
"shows":[
	{
	"code": "12",
	"heading": "#12: <cite>An Elevator and a Pole</cite>, part 1",
	"blurb": "<p>One group gathers round a weird pole in the middle of nowhere; another's stuck in an elevator. They all struggle to understand and control their fates.</p>",
	"notes": "broken neck, mental breakdown, falling elevator",
	"file": "Pole-pt1",
	"duration": 1729,
	"banger": true
	},
	{
	"code": "13",
	"heading": "#13: <cite>An Elevator and a Pole</cite>, part 2",
	"blurb": "<p>One group gathers round a weird pole in the middle of nowhere; another's stuck in an elevator. They all struggle to understand and control their fates.</p>",
	"notes": "descriptions of gore, fall death, vomiting, suicide",
	"file": "Pole-pt2",
	"duration": 1666,
	"banger": true
	},
	{
	"code": "18",
	"heading": "#18: <cite>Titanic Dreams</cite>",
	"blurb": "<p>A survivor of the Titanic drifts into the future, where she contemplates her regrets of that disastrous night. Adapted from a story by Robert Olen Butler.</p>",
	"notes": "suicide?",
	"file": "Titanic",
	"duration": 2611
	},
	{
	"code": "29",
	"heading": "#29: <cite>Facade</cite>",
	"blurb": "<p>Young hotshot advertisers snort their dead friend's ashes to receive creative inspiration, to bring her back, to help their pitches, to take over their lives.</p>",
	"notes": "ableism, addiction, car accident, human sacrifice, possession",
	"file": "Facade",
	"duration": 1940,
	"banger": true
	},
	{
	"code": "36",
	"heading": "#36: <cite>In the Shade of the Slowboat Man</cite>",
	"blurb": "<p>A vampire returns to her mortal love on his nursing-home deathbed to reminisce and say goodbye. Adapted from a story by Dean Wesley Smith.</p>",
	"notes": "abandonment, infertility",
	"file": "Shade",
	"duration": 2079,
	"banger": true
	},
	{
	"code": "37",
	"heading": "#37: <cite>Greedy Choke Puppy</cite>",
	"blurb": "<p>A fiery student of Trinidadian folklore investigates the tale of the soucouyant, a skin-stealing vampire her grandma warns about. Adapted from a story by Nalo Hopkinson.</p>",
	"notes": "infanticide",
	"file": "Choke",
	"duration": 2201
	},
	{
	"code": "43-44",
	"heading": "#43 and #44: <cite>Emily 501</cite>",
	"blurb": "<p>An exo-archaeologist discovers that the ancient language she's found isn't as dead as it seems.</p>",
	"notes": "body horror, language loss, mental breakdown",
	"file": "Emily",
	"duration": 2438,
	"banger": true
	},
	{
	"code": "53-54",
	"heading": "#53 and #54: <cite>Propagation of Light in a Vacuum</cite>",
	"blurb": "<p>A space traveller struggles to stay sane in the world beyond the speed of light&mdash;with the help of his imaginary wife.</p>",
	"notes": "drug overdose, murder-suicide, stabbing, starvation",
	"file": "Propagation",
	"duration": 2817
	},
	{
	"code": "85",
	"heading": "#85: <cite>The Oblivion Syndrome</cite>",
	"blurb": "<p>A void-cartographer gives up on survival when his ship is damaged, leaving it to the ship's <abbr class=\"unmodified-abbr\">AI</abbr> and an interstellar freakshow to restore his will to live.</p>",
	"notes": "ableism, voice removal",
	"file": "Syndrome",
	"duration": 1673,
	"banger": true
	},
	{
	"code": "88",
	"heading": "#88: <cite>Into The Sun</cite>",
	"blurb": "<p>A starship doctor finds himself alone as his vessel races into the closest star. Starring Mark Hamill.</p>",
	"notes": "helplessness, live burial",
	"file": "Sun",
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
"shows":[
	{
	"code": "05",
	"heading": "#5: <cite>Over the Hill</cite> and <cite>The Man in the Black Hat</cite>",
	"blurb": "<p>A delusional man &ldquo;escapes&rdquo; his nagging wife. A gambler meets a stranger who gives him unnatural luck. Written by Michael Fessier.</p>",
	"notes": "guillotine death, implied domestic violence",
	"file": "Hill-Hat",
	"duration": 1458
	},
	{
	"code": "15",
	"heading": "#15: <cite>Thus I Refute Beelzy</cite><!--Note: show title in source uses the wrong name (\"Bealsley\" instead of \"Beelzy\")--> and <cite>The Bookshop</cite>",
	"blurb": "<p>A boy's imaginary friend takes offense at his cruel father. A struggling writer finds a shop of impossible books. Written by John Collier and Nelson S.&thinsp;Bond.</p>",
	"notes": "child abuse, dismemberment, traffic accident",
	"file": "Beelzy-Book",
	"duration": 1713,
	"banger": true
	},
	{
	"code": "17",
	"heading": "#17: <cite>The Woman in Gray</cite> and <cite>A Suspicious Gift</cite>",
	"blurb": "<p>A man invents a spectre of hatred. A stranger gives a too-perfect gift. Written by Walker G.&thinsp;Everett and Algernon Blackwood.</p>",
	"notes": "apparent suicide, fall death, traffic accidents",
	"file": "Gray-Gift",
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
"shows":[
	{
	"code": "011",
	"heading": "#11: <cite>The Hitch-Hiker</cite>",
	"blurb": "<p>A man driving across the <abbr class=\"unmodified-abbr\">US</abbr> sees the same hitch-hiker calling for him again and again&hellip; and again&hellip; Written by Lucille Fletcher, introduction by and starring Orson Welles.</p>",
	"notes": "car crash, obsession, traffic death",
	"file": "Hitch-hiker",
	"duration": 1752,
	"banger": true
	},
	{
	"code": "059",
	"heading": "#59: <cite>The Most Dangerous Game</cite>",
	"blurb": "<p>A big-game hunter has the tables turned when he washes up on an island owned by a man-hunter. Starring Orson Welles.</p>",
	"notes": "ableism, animal death, man devoured by dogs, stab death",
	"file": "Game",
	"duration": 1797,
	"banger": true
	},
	{
	"code": "087",
	"heading": "#87: <cite>The Marvellous Barastro</cite>",
	"blurb": "<p>The world's second-greatest magician announces his plan to take revenge on the first&mdash;his mirror image. Starring Orson Welles.</p>",
	"notes": "alcohol adverts, betrayal, stalking, strangulation",
	"file": "Barastro",
	"duration": 1781,
	"banger": true
	},
	{
	"code": "092",
	"heading": "#92: <cite>Donovan's Brain</cite>, part 1",
	"blurb": "<p>A scientist rescues a wealthy businessman's life by preserving his brain&mdash;only to fall under its malign sway. Starring Orson Welles.</p>",
	"notes": "alcohol adverts, animal bite, animal death, animal experimentation, betrayal, human experimentation, institutionalisation, mind control, paranoia",
	"file": "Donovan-pt1",
	"duration": 1767
	},
	{
	"code": "093",
	"heading": "#93: <cite>Donovan's Brain</cite>, part 2",
	"blurb": "<p>A scientist rescues a wealthy businessman's life by preserving his brain&mdash;only to fall under its malign sway. Starring Orson Welles.</p>",
	"notes": "alcohol adverts, betrayal, human experimentation, institutionalisation, mind control, injection, non-consensual surgery, strangulation, suicide?",
	"file": "Donovan-pt2",
	"duration": 1758
	},
	{
	"code": "094",
	"heading": "#94: <cite>Fugue in C Minor</cite>",
	"blurb": "<p>A music-loving widower remarries a woman who shares his passion&hellip; his children have other ideas. Written by Lucille Fletcher, starring Vincent Price and Ida Lupino.</p>",
	"notes": "alcohol adverts, asphyxiation, claustrophobia, heart attack",
	"file": "Fugue",
	"duration": 1774,
	"banger": true
	},
	{
	"code": "143",
	"heading": "#143: <cite>August Heat</cite>",
	"blurb": "<p>Two strangers share premonitions of their fates on a brutally hot August day. Starring Ronald Colman.</p>",
	"notes": "alcohol adverts",
	"file": "August",
	"duration": 1776,
	"banger": true
	},
	{
	"code": "165",
	"heading": "#165: <cite>The Dunwich Horror</cite>",
	"blurb": "<p>A union of human woman and alien god produces terrible, eldritch offspring. Adapted from a story by H.&thinsp;P.&thinsp;Lovecraft, starring Robert Colman.</p>",
	"notes": "ableism, alcohol adverts, animal attack, body horror, cattle mutilation",
	"file": "Dunwich",
	"duration": 1618
	},
	{
	"code": "222",
	"heading": "#222: <cite>The House in Cypress Canyon</cite>",
	"blurb": "<p>A couple takes possession of a renovated house, only to find a dark presence taking possession of <em>them</em>.</p>",
	"notes": "alcohol adverts, bite injury, blood, murder-suicide",
	"file": "Cypress",
	"duration": 1815,
	"banger": true
	},
	{
	"code": "224",
	"heading": "#224: <cite>The Thing in the Window</cite>",
	"blurb": "<p>An actor claims he sees a dead body in the flat across the road; everyone else thinks he's mad. Written by Lucille Fletcher, starring Joseph Cotton.</p>",
	"notes": "alcohol adverts, betrayal, gaslighting, harassment, suicide",
	"file": "Window",
	"duration": 1785
	},
	{
	"code": "259",
	"heading": "#259: <cite>Murder Aboard the Alphabet</cite>",
	"blurb": "<p>A ship's crew find their captain's obsession with orderliness harmless until they start disappearing&mdash;in alphabetical order.</p>",
	"notes": "alcohol adverts, disappearance at sea, implied execution, imprisonment, sanism",
	"file": "Alphabet",
	"duration": 1819
	},
	{
	"code": "300",
	"heading": "#300: <cite>The Yellow Wallpaper</cite>",
	"blurb": "<p>A woman confined by her husband after a nervous breakdown starts to see things behind the wallpaper. Adapted from a story by Charlotte Perkins Gilman.</p>",
	"notes": "domestic abuse, mental breakdown",
	"file": "Wallpaper",
	"duration": 1778
	},
	{
	"code": "346",
	"heading": "#346: <cite>Ghost Hunt</cite>",
	"blurb": "<p>A skeptical radio <abbr class=\"unmodified-abbr\">DJ</abbr> and a psychic investigator spend a night in a house nicknamed the &ldquo;Death Trap&rdquo;.</p>",
	"notes": "blood, hallucination?, suicide?",
	"file": "Ghost",
	"duration": 1780,
	"banger": true
	},
	{
	"code": "379",
	"heading": "#379: <cite>Salvage</cite>",
	"blurb": "<p>A pilot, his ex, and her husband get tangled in a fraught expedition to recover sunken gold from the Caribbean. Starring Van Johnson.</p>",
	"notes": "betrayal, gunshots (15:23, 20:05, 20:34&ndash;20:40), plane crash",
	"file": "Salvage",
	"duration": 1800
	},
	{
	"code": "625",
	"heading": "#625: <cite>Classified Secret</cite>",
	"blurb": "<p>Spies match money, wits, and steel on an interstate bus, with deadly military secrets in the balance.</p>",
	"notes": "gunshots (21:36&ndash;37, 21:48)",
	"file": "Classified",
	"duration": 1778,
	"banger": true
	},
	{
	"code": "648",
	"heading": "#648: <cite>The Waxwork</cite>",
	"blurb": "<p>A nervy, desperate freelance journalist resolves to write about spending the night in a museum of wax serial killers. Starring William Conrad.</p>",
	"notes": "anxiety, claustrophobia, hallucinations?, hypnosis, panic attack, paranoia",
	"file": "Waxwork",
	"duration": 1725,
	"banger": true
	},
	{
	"code": "673",
	"heading": "#673: <cite>Three Skeleton Key</cite>",
	"blurb": "<p>Three lighthouse keepers fall under siege from a terrifying swarm of rats. Starring Vincent Price.</p>",
	"notes": "ableism, animal deaths, bite injury, claustrophobia, isolation, mental breakdown",
	"file": "Key",
	"duration": 1788
	},
	{
	"code": "674",
	"heading": "#674: <cite>The Long Night</cite>",
	"blurb": "<p>A night shift air traffic controller must help a lost, scared, untested pilot who's running out of fuel and trapped above the clouds. Starring Frank Lovejoy.</p>",
	"notes": "implied child death, parental recklessness, smoking",
	"file": "Night",
	"duration": 1852,
	"banger": true
	},
	{
	"code": "688",
	"heading": "#688: <cite>Present Tense</cite>",
	"blurb": "<p>A death row inmate escapes execution via clock-stopping delusion. Starring Vincent Price.</p>",
	"notes": "axe murder, gas chamber, hijacking, home invasion, train derailment",
	"file": "Present",
	"duration": 1768
	},
	{
	"code": "689",
	"heading": "#689: <cite>The Peralta Map</cite>",
	"blurb": "<p>Treasure hunters contract a local guide to help them find an ancient, legendary, <em>haunted</em> gold mine.</p>",
	"notes": "abandonment, betrayal, fall injury, gunshots (25:25&ndash;25:27, 27:29&ndash;27:32)",
	"file": "Peralta",
	"duration": 1745
	},
	{
	"code": "799",
	"heading": "#799: <cite>Deep, Deep is My Love</cite>",
	"blurb": "<p>A diver seeks solitude from his wife in the embrace of a golden lady under the sea.</p>",
	"notes": "animal death, asphyxiation, hallucination?, narcosis",
	"file": "Deep",
	"duration": 1046
	},
	{
	"code": "878",
	"heading": "#878: <cite>The Green Lorelei</cite>",
	"blurb": "<p>A writer becomes obsessed with a woman singing in the apartment upstairs, though the old man living there swears his wife is dead.</p>",
	"notes": "deceptively gaining entry to another person's home, eviction, institutionalisation, ransacking",
	"file": "Lorelei",
	"duration": 1460
	},
	{
	"code": "901",
	"heading": "#901: <cite>The Black Door</cite>",
	"blurb": "<p>An archaeologist and his local guide seek an ancient Central American city and carelessly disturb what lies beyond the black door at its heart.</p>",
	"notes": "gunshots (16:41, 16:59, 17:43), racism",
	"file": "Door",
	"duration": 1400
	},
	{
	"code": "916",
	"heading": "#916: <cite>Heads You Lose</cite>",
	"blurb": "<p>Detectives take a lucrative case to find a terminally-ill embezzler years after he should've died, and find themselves in over their heads.</p>",
	"notes": "cigarette ads, gunshots (19:08&ndash;19:29), entombment, suicide",
	"file": "Heads",
	"duration": 1409
	},
	{
	"code": "927",
	"heading": "#927: <cite>That Real Crazy Infinity</cite>",
	"blurb": "<p>Two beatniks out of money take on a simple delivery job that ends up involving esoteric electronics and the voices of the past.</p>",
	"notes": "explosion (20:02&ndash;20:09)",
	"file": "Infinity",
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
"shows":[
	{
	"code": "106",
	"heading": "#106: <cite>Five Strangers</cite>",
	"blurb": "<p>Five stranded strangers use a cargo plane to beat flight delays when dense fog grounds all other craft, unaware of the fate awaiting them.</p>",
	"notes": "plane crash",
	"file": "Strangers",
	"duration": 1311
	},
	{
	"code": "154",
	"heading": "#154: <cite>The Land of Milk and Honey</cite>",
	"blurb": "<p>A sinner ends up in heaven, where he gets all he ever wanted and never has to lift a finger&mdash;an exasperating paradise.</p>",
	"notes": "alcohol, betrayal, gunshots (5:32, 17:08)",
	"file": "Honey",
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
"shows":[
	{
	"code": "43",
	"heading": "#43: <cite>The Bell Tower</cite>",
	"blurb": "<p>An arrogant architect brings doom upon himself in the creation of an &ldquo;impossible&rdquo; bell tower. Adapted from a story by Herman Melville.</p>",
	"notes": "bludgeon death, crush death",
	"file": "Bell",
	"duration": 1518,
	"banger": true
	},
	{
	"code": "63",
	"heading": "#63: <cite>The Ancient Mariner</cite>",
	"blurb": "<p>An old mariner recounts how slaying an albatross brought a fatal curse upon his crew. Adapted from a poem by Samuel Taylor Coleridge.</p>",
	"notes": "animal death, starvation",
	"file": "Mariner",
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
"shows":[
	{
	"code": "1",
	"heading": "part 1",
	"blurb": "<p>The narrator and his companion arrive at the island and shrug off warnings to leave.</p>",
	"file": "pt1",
	"duration": 2480
	},
	{
	"code": "2",
	"heading": "part 2",
	"blurb": "<p>Night falls and premonitions of eerie doom begin.</p>",
	"file": "pt2",
	"duration": 2066
	},
	{
	"code": "3",
	"heading": "part 3",
	"blurb": "<p>Disaster as the travellers' supplies go missing and their boat is damaged by unknown forces.</p>",
	"file": "pt3",
	"duration": 2128
	},
	{
	"code": "4",
	"heading": "part 4",
	"blurb": "<p>The horror strikes directly and the travellers confront a world beyond their own.</p>",
	"file": "pt4",
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
"shows":[
	{
	"code": "041",
	"heading": "#41: <cite>The Wonderful Bottle</cite>",
	"blurb": "<p>A tramp buys a bottle that grants any wish&mdash;but his soul's forfeit if he can't sell it for <em>less</em> than he paid for it. Adapted from a story by Robert Louis Stevenson.</p>",
	"notes": "leprosy, parental death",
	"file": "Bottle",
	"duration": 1775
	},
	{
	"code": "116",
	"heading": "#116: <cite>Le Mannequinne</cite>",
	"blurb": "<p>A woman becomes paranoid that her husband's new artistic mannequin wants to replace her.</p>",
	"notes": "head wound, obsession, stab death",
	"file": "Mannequinne",
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
"shows":[
	{
	"code": "X",
	"heading": "#X: <cite>The Graveyard Rats</cite>",
	"blurb": "<p>A grave robber's work takes him into the burrows of a swarm of unnaturally large and intelligent rats. Adapted from a story by Henry Kuttner.</p>",
	"notes": "animal bite, asphyxiation, claustrophobia, entombment",
	"file": "Rats",
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
"shows":[
	{
	"code": "037",
	"heading": "#37: <cite>The Cave of Night</cite>",
	"blurb": "<p>The world unites to rescue an astronaut adrift in <q>the cave of night</q>&mdash;but he may not want to return. Adapted from a story by James E.&thinsp;Gunn.</p>",
	"notes": "suicide",
	"file": "Cave",
	"duration": 1700,
	"banger": true
	},
	{
	"code": "039",
	"heading": "#39: <cite>Skulking Permit</cite>",
	"blurb": "<p>A utopian space colony cut off from Earth proves they're a model of Earth culture, including an official criminal. Adapted from a story by Robert Sheckley.</p>",
	"notes": "gunshots (12:31, 22:07)",
	"file": "Skulking",
	"duration": 1738,
	"banger": true
	},
	{
	"code": "042",
	"heading": "#42: <cite>A Gun for Dinosaur</cite>",
	"blurb": "<p>A time-travelling hunting guide explains why he's so selective about who he helps hunt dinosaur. Adapted from a story by L.&thinsp;Sprague de Camp.</p>",
	"notes": "adultery, brawl, gunshots (7:17, 11:02, 13:18&ndash;13:20, 15:29, 18:17, 19:36&ndash;38, 20:05)",
	"file": "Dinosaur",
	"duration": 1776,
	"banger": true
	},
	{
	"code": "043",
	"heading": "#43: <cite>Tunnel Under the World</cite>",
	"blurb": "<p>A man wakes up on the 15th of June over and over&mdash;in a silent town utterly dominated by advertising. Adapted from a story by Frederik Pohl.</p>",
	"notes": "bludgeoning death, paranoia, surveillance",
	"file": "Tunnel",
	"duration": 1679
	},
	{
	"code": "063",
	"heading": "#63: <cite>Student Body</cite>",
	"blurb": "<p>An all-consuming, rapidly-evolving species of alien mice poses an existential challenge to humanity. Adapted from a story by F.&thinsp;L.&thinsp;Wallace.</p>",
	"notes": "gunshots (21:55&ndash;57)",
	"file": "Student",
	"duration": 1720
	},
	{
	"code": "065",
	"heading": "#65: <cite>Surface Tension</cite>",
	"blurb": "<p>Scientists invent a microscopic solution so humanity can live out its days before the apocalypse. Adapted from a story by James Blish.</p>",
	"file": "Surface",
	"duration": 1716
	},
	{
	"code": "068",
	"heading": "#68: <cite>The Lifeboat Mutiny</cite>",
	"blurb": "<p>Two planetary surveyors buy an <abbr class=\"unmodified-abbr\" class=\"unmodified-abbr\">AI</abbr> lifeboat that once belonged to an alien navy&mdash;and doesn't know the war's over. Adapted from a story by Robert Sheckley.</p>",
	"notes": "confinement",
	"file": "Lifeboat",
	"duration": 1731,
	"banger": true
	},
	{
	"code": "071",
	"heading": "#71: <cite>Colony</cite>",
	"blurb": "<p>Everyday objects turn deadly against colonists on an alien planet. Adapted from a story by Philip K.&thinsp;Dick.</p>",
	"notes": "being digested alive, gunshots (10:28, 15:24&ndash;34, 19:16), strangulation",
	"file": "Colony",
	"duration": 1782,
	"banger": true
	},
	{
	"code": "101",
	"heading": "#101: <cite>The Category Inventor</cite>",
	"blurb": "<p>A musician replaced by a robot scrambles to invent a unique new job&mdash;just like everyone else. Adapted from a story by Arthur Sellings.</p>",
	"file": "Category",
	"duration": 1282
	},
	{
	"code": "118",
	"heading": "#118: <cite>The Light</cite>",
	"blurb": "<p>The first astronauts on the moon find old footprints in the dust. Adapted from a story by Poul Anderson.</p>",
	"file": "Light",
	"duration": 1202
	}
]
}
];
