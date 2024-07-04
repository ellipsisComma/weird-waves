/*jshint esversion: 11*/

/*
SCRIPT CONTROLS: settings global variables to control app behaviour (e.g. default settings)
PARAMETERS: initialising internal parameters
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

// relative paths of the show audio folder, favicon, and Weird Waves button folder, and the file extension for show files
const paths = {
	"show": `./audio/shows/`,
	"favicon": `./images/favicons/`
},
showFileExtension = `.mp3`;

// initialised settings from storage and set default values if not set
const settings = window.localStorage.getItem(`settings`) ? JSON.parse(window.localStorage.getItem(`settings`)) : {};
settings.copyrightSafety ??= false;
settings.flatRadio ??= false;
settings.autoPlayNextShow ??= true;
settings.notesOpen ??= false;



/* ===============
	PARAMETERS
=============== */

// HTML elements (or templated HTML elements) and their IDs
const page = {
	// head
	"title": `title`,
	"SVGFavicon": `[rel~="icon"][href$=".svg"]`,
	"icoFavicon": `[href$=".ico"]`,

	// radio
	"loadedShow": `#loaded-show`,
	"radioControls": `#radio-controls`,
	"seekBar": `#seek-bar`,
	"showTimeElapsed": `#show-time-elapsed`,
	"showTimeTotal": `#show-time-total`,
	"playButton": `#play-button`,
	"pauseButton": `#pause-button`,
	"skipButton": `#skip-button`,
	"muteButton": `#mute-button`,
	"unmuteButton": `#unmute-button`,
	"volumeControl": `#volume-control`,
	"audio": `#show-audio`,

	// booth
	"playlist": `#playlist`,
	"playlistControls": `#playlist-controls`,
	"clearButton": `#clear-button`,
	"clearPlaylistControls": `#clear-playlist-controls`,
	"importExport": `#import-export-data`,
	"importErrorMessage": `#import-error-message`,
	"invalidShowIDs": `#invalid-show-ids`,

	// archive
	"seriesLinks": `#archive-series-links`,
	"seriesList": `#series-list`,

	// settings
	"themeButtons": `#theme-buttons`,
	"fontButtons": `#font-buttons`,

	// welcome
	"featuredShow": `#featured-show`
},
templateHTML = {
	"playlistItem": `playlist-item`,
	"archiveSeries": `archive-series`,
	"archiveShow": `archive-show`,
};

// build out page and templateHTML objects
for (const [ref, query] of Object.entries(page)) page[ref] = document.querySelector(query);
for (const [ref, id] of Object.entries(templateHTML)) templateHTML[ref] = document.getElementById(`${id}-template`);

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

/* GENERAL */

// add an object of attributes to an Element (excluding class for practical reasons)
Element.prototype.setAttributes = function (attrs) {
	for (const [attr, value] of Object.entries(attrs)) this.setAttribute(attr, value);
};

// remove an array of attributes from an Element
Element.prototype.removeAttributes = function (attrs) {
	for (const attr of attrs) this.removeAttribute(attr);
};

// set a string to be an element's innerHTML or textContent depending on whether it includes HTML entities, tags, and/or comments
HTMLElement.prototype.setContent = function (text) {
	const HTMLRegex = /&#?\w+;|<[a-z]|\/>|<\/|<!--/;
	if (HTMLRegex.test(text)) this.innerHTML = text;
	else this.textContent = text;
};

// create an array of nodes cloned from the target
HTMLElement.prototype.cloneChildren = function () {
	const clones = [];
	for (const node of this.childNodes) clones.push(node.cloneNode(true));
	return clones;
};

/* APP */

// take in a time in seconds (can be a non-integer) and output a timestamp in minutes and seconds
function setTimestampFromSeconds(element, time) {
	const minutes = Math.floor((parseInt(time) % 3600) / 60).toString().padStart(2, `0`),
	seconds = (parseInt(time) % 60).toString().padStart(2, `0`);

	element.textContent = `${minutes}:${seconds}`;
}

// get show ID from a pool, adjusted for copyright safety
function getRandomShowID(type) {
	const pool = showIDSets[type][settings.copyrightSafety ? `safe` : `any`];
	return pool[Math.floor(Math.random() * pool.length)];
}

// get show element on playlist
function getShowOnPlaylist(id) {
	return page.playlist.querySelector(`:scope > [data-id="${id}"]`);
}

// add series name to show heading element and add series source to element info (for playlist and featured show)
function expandShowInfo(show, seriesInArchive) {
	const showHeading = show.querySelector(`.show-heading`);
	showHeading.replaceChildren(
		...seriesInArchive.querySelector(`.series-heading`).cloneChildren(),
		document.createTextNode(` `),
		...showHeading.cloneChildren()
	);
	show.querySelector(`.show-content`).appendChild(seriesInArchive.querySelector(`.series-source`).cloneNode(true));
}

/* -----
PLAYLIST
----- */

// shuffle playlist if it has at least 2 entries, then load top show (if it's different after shuffling)
function shufflePlaylist() {
	let i = page.playlist.children.length;
	if (i < 2) return;

	while (i > 0) page.playlist.appendChild(page.playlist.children[Math.floor(Math.random() * i--)]);
	loadShow();
}

// reveal controls for clearing playlist
function revealClearPlaylistControls() {
	pressButton(page.clearButton);
	page.clearPlaylistControls.hidden = false;
	page.clearPlaylistControls.focus();
}

// hide controls for clearing playlist
function hideClearPlaylistControls() {
	unpressButton(page.clearButton);
	page.clearPlaylistControls.hidden = true;
}

// clear playlist and hide clear controls again, then load show (i.e. nothing)
function clearPlaylist() {
	if (page.playlist.children.length > 0) {
		page.playlist.replaceChildren();
		for (const button of page.seriesList.querySelectorAll(`[data-action="add-show"][aria-pressed="true"]`)) unpressButton(button);
	}
	if (!page.clearPlaylistControls.hidden) hideClearPlaylistControls();
	loadShow();
}

// clear import errors
function clearImportErrors() {
	page.importErrorMessage.hidden = true;
	page.invalidShowIDs.replaceChildren();
}

// list playlist of show IDs line-by-line in import-export box
function exportPlaylist() {
	const exportIDs = [];
	clearImportErrors();
	for (const show of page.playlist.children) exportIDs.push(show.dataset.id);
	page.importExport.value = exportIDs.join(`\n`);
}

// import playlist from textbox
function importPlaylist() {
	clearImportErrors();

	// if attempting to import IDs, validate them and either present invalid IDs or update playlist; if import box is empty, clear playlist
	const importIDs = page.importExport.value.trim().replace(/\n\n+/g, `\n`).replace(/ /g, ``).split(`\n`),
	invalidIDs = importIDs.filter(id => !document.getElementById(id));

	if (invalidIDs.length === 0) {
		clearImportErrors();
		clearPlaylist();
		for (const id of importIDs) addShow(id);
		page.importExport.value = ``;
	} else {
		for (const id of invalidIDs) page.invalidShowIDs.appendChild(document.createElement(`li`)).textContent = id;
		page.importErrorMessage.hidden = false;
		page.importErrorMessage.scrollIntoView();
	}
}

/* --
SHOWS
-- */

/* ADDING */

// add show to playlist; if playlist was previously empty, load top show
function addShow(id) {
	const showOnPlaylist = getShowOnPlaylist(id);

	if (showOnPlaylist) {
		page.playlist.appendChild(showOnPlaylist);
		loadShow();
		console.log(`re-added show: ${id}`);
		return;
	}

	// build new show element and clone in show position controls and show content from Archive
	const showInArchive = document.getElementById(id);
	page.playlist.appendChild(templateHTML.playlistItem.content.cloneNode(true)),
	newShow = page.playlist.lastElementChild;

	for (const button of newShow.querySelectorAll(`button`)) button.dataset.target = id;
	newShow.lastElementChild.appendChild(showInArchive.querySelector(`.show-heading`).cloneNode(true));
	newShow.lastElementChild.appendChild(showInArchive.querySelector(`.show-content`).cloneNode(true));

	// transfer remaining show info
	expandShowInfo(newShow, document.getElementById(`archive-${id.split(`-`)[0]}`));
	newShow.setAttributes({
		"data-id": id,
		"data-duration": showInArchive.dataset.duration
	});

	// add show to playlist in booth and mark as added in archive
	page.playlist.appendChild(newShow);
	pressButton(showInArchive.querySelector(`[data-action="add-show"]`));

	// update show info and elements for playlist
	console.log(`added show: ${id}`);

	loadShow();
}

// add entire archive to playlist
function addArchive() {
	for (const id of settings.copyrightSafety ? showIDSets.all.safe : showIDSets.all.any) addShow(id);
}

// add entire series to playlist
function addSeries(seriesCode) {
	for (const id of showIDSets.series[seriesCode]) addShow(id);
}

// add a random show or banger to the playlist; if adding a show to an empty playlist, load it into radio
function addRandomShow(showType) {
	addShow(getRandomShowID(showType));
	window.scrollTo(0, page.playlist.lastElementChild.offsetTop - page.playlistControls.clientHeight);
}

/* MANIPULATING */

// move show up/down in playlist; if the first show on the playlist was moved, load the new top show
function moveShow(id, move) {
	const target = getShowOnPlaylist(id);

	if (move > 0) target.nextElementSibling.after(target);
	else target.previousElementSibling.before(target);

	loadShow();
}

// remove show from playlist; if the first show on the playlist was removed, load the new top show
function removeShow(id) {
	getShowOnPlaylist(id)?.remove();
	unpressButton(document.querySelector(`#${id} [data-action="add-show"]`));
	console.log(`removed show: ${id}`);
	loadShow();
}

// write show parts onto page and load show audio file; if playlist is empty, remove audio and show content and hide controls
function loadShow() {
	if (page.playlist.children.length > 0 && page.playlist.firstElementChild.dataset.id === page.loadedShow.dataset.id) return;

	pauseAudio();
	page.loadedShow.replaceChildren();

	if (page.playlist.children.length > 0) {
		const show = page.playlist.firstElementChild;
		page.loadedShow.dataset.id = show.dataset.id;

		// load audio file and show data
		page.audio.src = `${paths.show}${show.dataset.id}${showFileExtension}`;
		page.audio.dataset.duration = show.dataset.duration;
		page.loadedShow.appendChild(show.querySelector(`.show-heading`).cloneNode(true));
		page.loadedShow.appendChild(show.querySelector(`.show-content`).cloneNode(true));

		// reset and reveal radio controls
		seekTime(0);
		page.seekBar.value = 0;
		setTimestampFromSeconds(page.showTimeTotal, page.audio.dataset.duration);
		page.radioControls.hidden = false;

		console.log(`loaded show: ${show.dataset.id}`);
	} else {
		page.audio.removeAttributes([`src`, `data-duration`]);
		for (const time of [`Elapsed`, `Total`]) setTimestampFromSeconds(page[`showTime${time}`], "0");
		page.radioControls.hidden = true;
		page.loadedShow.setAttribute(`data-id`, ``);
	}
}

// replace loaded show with next show on playlist, or empty-playlist message if none
function loadNextShow() {
	removeShow(page.playlist.firstElementChild.dataset.id);
	page.seekBar.value = 0;
	if (page.audio.hasAttribute(`src`) && settings.autoPlayNextShow) playAudio();
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

// update displayed show time using seek bar
function seekTime(value) {
	setTimestampFromSeconds(page.showTimeElapsed, page.audio.dataset.duration * value / 100);
}

// hide a pressed button and reveal another
function swapButtons(button1, button2) {
	button1.hidden = true;
	button2.hidden = false;
}

// play audio
function playAudio() {
	page.audio.play();
	swapButtons(page.playButton, page.pauseButton);
	updateTimeInterval = setInterval(updateSeekBar, 1000);
}

// pause audio
function pauseAudio() {
	updateSeekBar(); // otherwise if the audio's paused after less than a second of play, seek bar doesn't update
	page.audio.pause();
	swapButtons(page.pauseButton, page.playButton);
	clearInterval(updateTimeInterval);
}

// mute audio
function muteAudio() {
	page.audio.muted = true;
	swapButtons(page.muteButton, page.unmuteButton);
	page.volumeControl.value = 0;
}

// unmute audio
function unmuteAudio() {
	page.audio.muted = false;
	swapButtons(page.unmuteButton, page.muteButton);
	page.volumeControl.value = page.audio.volume * 100;
}

// set audio volume
function setVolume(newVolume) {
	page.audio.volume = newVolume;
	if (page.audio.muted) unmuteAudio();
}

/* -----
SETTINGS
----- */

// initialise a toggle switch with a stored or default value
function initialiseToggle(id, toggled) {
	document.getElementById(id).setAttribute(`aria-pressed`, toggled ? `true` : `false`);
}

// switch a toggle from off/unpressed to on/pressed
function switchToggle(id) {
	const button = document.getElementById(`${id}-toggle`);
	button.setAttribute(`aria-pressed`, button.getAttribute(`aria-pressed`) === `false` ? `true` : `false`);
}

// toggle between excluding (true) and including (false) copyright-unsafe material when adding random shows to playlist
function toggleCopyrightSafety() {
	settings.copyrightSafety = !settings.copyrightSafety;
	switchToggle(`copyright-safety`);
}

// toggle between hiding and showing show-content in Radio
function toggleFlatRadio() {
	settings.flatRadio = !settings.flatRadio;
	switchToggle(`flat-radio`);
	page.loadedShow.classList.toggle(`flat-radio`, settings.flatRadio);
}

// toggle between auto-playing (true) and not (false) a newly-loaded show when the previous show ends
function toggleAutoPlay() {
	settings.autoPlayNextShow = !settings.autoPlayNextShow;
	switchToggle(`auto-play`);
}

// toggle between open (true) and closed (false) show content notes
function toggleContentNotes() {
	settings.notesOpen = !settings.notesOpen;
	switchToggle(`content-notes`);
	for (const notes of document.querySelectorAll(`.content-notes`)) notes.toggleAttribute(`open`, settings.notesOpen);
}

// set a button's state to unpressed
function unpressButton(button) {
	button?.setAttribute(`aria-pressed`, `false`);
	button?.removeAttribute(`aria-disabled`);
}

// set a button's state to pressed
function pressButton(button) {
	button?.setAttributes({
		"aria-pressed": `true`,
		"aria-disabled": `true`
	});
}

// update setting and setting buttons according to chosen value
function updateSetting(name, option) {
	unpressButton(page[`${name}Buttons`].querySelector(`[aria-pressed="true"]`));
	pressButton(page[`${name}Buttons`].querySelector(`[data-option="${option}"]`));

	document.documentElement.dataset[name] = option;
	styles[name] = option;
}

// switch between different colour themes
function switchTheme(theme) {
	updateSetting(`theme`, theme);
	page.SVGFavicon.href = `${paths.favicon}${theme}.svg`;
	page.icoFavicon.href = `${paths.favicon}${theme}.ico`;
}

// switch between different fonts
function switchFont(font) {
	updateSetting(`font`, font);
}

/* --------------
PAGE CONSTRUCTION
-------------- */

// build archive onto page
function buildArchive() {
	page.seriesLinks.replaceChildren();
	page.seriesList.replaceChildren();

	const stats = {
		"series": archive.length,
		"shows": 0,
		"duration": 0
	};

	for (const series of archive) {
		stats.shows += series.shows.length;
		showIDSets.series[series.code] = [];

		// add link pointing to series at top of archive
		const newSeriesLink = page.seriesLinks.appendChild(document.createElement(`li`)).appendChild(document.createElement(`a`));
		newSeriesLink.href = `#archive-${series.code}`;
		newSeriesLink.setContent(series.heading);

		// add series details to series list
		page.seriesList.appendChild(templateHTML.archiveSeries.content.cloneNode(true));
		const newSeries = page.seriesList.lastElementChild,
		newSeriesShows = newSeries.querySelector(`.show-list`);
		newSeries.id = `archive-${series.code}`;
		newSeries.querySelector(`.series-heading`).setContent(series.heading);
		newSeries.querySelector(`.series-blurb`).setContent(series.blurb);
		newSeries.querySelector(`.series-source`).setContent(series.source);
		newSeries.querySelector(`[data-action="add-series"]`).dataset.target = series.code;

		for (const show of series.shows) {
			stats.duration += show.duration;

			const id = `${series.code}-${show.code}`;

			showIDSets.all.any.push(id);
			if (series.copyrightSafe) showIDSets.all.safe.push(id);
			if (show.banger) showIDSets.bangers.any.push(id);
			if (series.copyrightSafe && show.banger) showIDSets.bangers.safe.push(id);
			showIDSets.series[series.code].push(id);

			// add show details to series' show list
			newSeriesShows.appendChild(templateHTML.archiveShow.content.cloneNode(true));
			const newShow = newSeriesShows.lastElementChild;
			newShow.id = id;
			newShow.dataset.duration = show.duration;
			newShow.querySelector(`.show-heading`).setContent(show.heading);
			newShow.querySelector(`.show-blurb`).setContent(show.blurb);

			// if show has content notes, add them to show-info, otherwise remove empty content notes element
			const contentNotes = newShow.querySelector(`.content-notes`);
			if (show.notes) {
				contentNotes.open = settings.notesOpen;
				contentNotes.querySelector(`span`).setContent(show.notes);
			} else contentNotes.remove();

			newShow.querySelector(`[data-action="add-show"]`).dataset.target = id;
		}
	}

	// add delegated click-events for add-series
	page.seriesList.addEventListener(`click`, () => {
		if (!event.target.hasAttribute(`aria-disabled`)) {
			switch (event.target.dataset.action) {
			case `add-series`: addSeries(event.target.dataset.target); break;
			case `add-show`: addShow(event.target.dataset.target); break;
			}
		}
	});

	// add series stats to stats-list
	document.getElementById(`stats-sources`).textContent = stats.series;
	document.getElementById(`stats-shows`).textContent = stats.shows;
	document.getElementById(`stats-duration`).textContent = Math.round(stats.duration / 3600);
}

// add random banger to welcome page, including "add show" button as a call to action
function buildFeaturedShow() {
	const id = getRandomShowID(`bangers`),
	showInArchive = document.getElementById(id);

	// build out featured show HTML from show and series in Archive
	page.featuredShow.replaceChildren(...showInArchive.cloneChildren());
	expandShowInfo(page.featuredShow, document.getElementById(`archive-${id.split(`-`)[0]}`));

	// add click event for adding featured show to playlist and removing it from welcome area
	page.featuredShow.querySelector(`[data-action="add-show"]`).addEventListener(`click`, () => {
		addShow(id);
		document.getElementById(`featured-show-container`).remove();
	});

	// build new show element and clone in show content and add-button
	page.featuredShow.hidden = false;
}



/* ===========
	EVENTS
=========== */

// radio audio events
page.audio.addEventListener(`ended`, loadNextShow);

// radio interface events
page.seekBar.addEventListener(`change`, () => {
	page.audio.currentTime = page.audio.dataset.duration * page.seekBar.value / 100;
	if (!page.audio.paused) updateTimeInterval = setInterval(updateSeekBar, 1000);
});
page.seekBar.addEventListener(`input`, () => {
	seekTime(page.seekBar.value);
	clearInterval(updateTimeInterval);
});
page.playButton.addEventListener(`click`, playAudio);
page.pauseButton.addEventListener(`click`, pauseAudio);
page.skipButton.addEventListener(`click`, loadNextShow);
page.muteButton.addEventListener(`click`, muteAudio);
page.unmuteButton.addEventListener(`click`, unmuteAudio);
page.volumeControl.addEventListener(`input`, () => setVolume(page.volumeControl.value / 100));

// booth interface events
document.getElementById(`random-show-button`).addEventListener(`click`, () => addRandomShow(`all`));
document.getElementById(`random-banger-button`).addEventListener(`click`, () => addRandomShow(`bangers`));
document.getElementById(`shuffle-button`).addEventListener(`click`, shufflePlaylist);
page.clearButton.addEventListener(`click`, () => {
	if (!page.clearButton.hasAttribute(`aria-disabled`)) revealClearPlaylistControls();
});
document.getElementById(`clear-cancel-button`).addEventListener(`click`, hideClearPlaylistControls);
document.getElementById(`clear-confirm-button`).addEventListener(`click`, clearPlaylist);
page.playlist.addEventListener(`click`, () => {
	switch (event.target.dataset.action) {
	case `move-up`: moveShow(event.target.dataset.target, -1); break;
	case `remove`: removeShow(event.target.dataset.target); break;
	case `move-down`: moveShow(event.target.dataset.target, 1); break;
	}
});
document.getElementById(`export-button`).addEventListener(`click`, exportPlaylist);
document.getElementById(`import-button`).addEventListener(`click`, importPlaylist);

// archive interface events (excluding those dependent on the archive HTML being generated beforehand)
document.getElementById(`add-archive-button`).addEventListener(`click`, addArchive);

// settings interface events (general)
document.getElementById(`copyright-safety-toggle`).addEventListener(`click`, toggleCopyrightSafety);
document.getElementById(`flat-radio-toggle`).addEventListener(`click`, toggleFlatRadio);
document.getElementById(`auto-play-toggle`).addEventListener(`click`, toggleAutoPlay);
document.getElementById(`content-notes-toggle`).addEventListener(`click`, toggleContentNotes);
page.themeButtons.addEventListener(`click`, () => {
	if (event.target.tagName === `BUTTON` && !event.target.hasAttribute(`aria-disabled`)) switchTheme(event.target.dataset.option);
});
page.fontButtons.addEventListener(`click`, () => {
	if (event.target.tagName === `BUTTON` && !event.target.hasAttribute(`aria-disabled`)) switchFont(event.target.dataset.option);
});

// on pageload, execute various tasks
document.addEventListener(`DOMContentLoaded`, () => {
	// build various semi-static page sections
	buildArchive();
	buildFeaturedShow();

	// import playlist and prepare playlist show IDs from storage (if there are any), simultaneously removing invalid IDs by checking against all IDs
	const storedIDs = window.localStorage.getItem(`playlist`) ? JSON.parse(window.localStorage.getItem(`playlist`)).filter(id => showIDSets.all.any.includes(id)) : [];
	if (storedIDs.length > 0) {
		for (const id of storedIDs) addShow(id);
		console.log(`loaded playlist from storage`);
	}

	// initialise radio, settings, and styles
	page.seekBar.value = 0;
	initialiseToggle(`copyright-safety-toggle`, settings.copyrightSafety);
	initialiseToggle(`flat-radio-toggle`, settings.flatRadio);
	initialiseToggle(`auto-play-toggle`, settings.autoPlayNextShow);
	initialiseToggle(`content-notes-toggle`, settings.notesOpen);
	switchTheme(styles.theme);
	switchFont(styles.font);
	page.loadedShow.classList.toggle(`flat-radio`, settings.flatRadio);

	// update page head data
	page.title.dataset.original = document.title;
	if (window.location.hash) navigateToSection();

	// clear out archive object
	archive = null;
});

// on closing window/browser tab, record user settings and styles to localStorage
window.addEventListener(`beforeunload`, () => {
	const playlistIDs = [];
	for (const show of page.playlist.children) playlistIDs.push(show.dataset.id);
	window.localStorage.setItem(`playlist`, JSON.stringify(playlistIDs));
	window.localStorage.setItem(`settings`, JSON.stringify(settings));
	window.localStorage.setItem(`styles`, JSON.stringify(styles));
});
