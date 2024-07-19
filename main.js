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

// show file relative path, show file extension, and favicon code
const showData = {
	"path": `./audio/shows/`,
	"extension": `.mp3`,
};
const faviconRaw = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 26 26" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round" vector-effect="non-scaling-stroke">
	<rect x="-1" y="-1" width="28" height="28" fill="--back-colour" />
	<path stroke="--hot-colour" d="M7 11a3 3 0 0 1 3 3a3 3 0 0 1 6 0a3 3 0 0 1 3-3" />
	<path stroke="--cold-colour" d="M7 8a6 6 0 0 1 12 0v4a6 6 0 0 1-12 0zm12 3h3v1a9 9 0 0 1-18 0v-1h3m6 10v3m-4 0h8" />
</svg>`;

// initialised settings from storage and set default values if not set
const settings = retrieve(`settings`, {});
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
	"SVGFavicon": `[rel="icon"][type="image/svg+xml"]`,

	// radio
	"loadedShow": `#loaded-show`,
	"radioControls": `#radio-controls`,
	"seekBar": `#seek-bar`,
	"showTimeElapsed": `#show-time-elapsed`,
	"showTimeTotal": `#show-time-total`,
	"playToggle": `#play-toggle`,
	"skipButton": `#skip-button`,
	"muteToggle": `#mute-toggle`,
	"volumeControl": `#volume-control`,
	"audio": `#show-audio`,

	// booth
	"playlist": `#playlist`,
	"playlistControls": `#playlist-controls`,
	"clearButton": `#clear-button`,
	"clearPlaylistControls": `#clear-playlist-controls`,
	"importExport": `#import-export-data`,
	"importErrorMessage": `#import-error-message`,
	"importErrorList": `#import-error-list`,

	// archive
	"seriesLinks": `#archive-series-links`,
	"seriesList": `#series-list`,

	// settings
	"themeButtons": `#theme-buttons`,
	"fontButtons": `#font-buttons`,

	// welcome
	"featuredShow": `#featured-show`,
};
const templateHTML = {
	"playlistItemControl": `playlist-item-control`,
	"playlistItem": `playlist-item`,
	"archiveSeries": `archive-series`,
	"archiveShow": `archive-show`,
};

// build out page refs and templates
for (const [ref, query] of Object.entries(page)) page[ref] = document.querySelector(query);
for (const [ref, id] of Object.entries(templateHTML)) templateHTML[ref] = document.getElementById(`${id}-template`).content;



/* ==============
	FUNCTIONS
============== */

/* ----
UTILITY
---- */

// convert time in seconds to minutes:seconds timestamp
function setTimestampFromSeconds(element, time) {
	element.textContent = [time / 60, time % 60].map(t => Math.floor(t).toString().padStart(2, `0`)).join(`:`);
}

// get show ID from a pool, adjusted for copyright safety
function getRandomShowID(type = ``) {
	const pool = page.seriesList.querySelectorAll(`${settings.copyrightSafety ? `[data-copyright-safe="true"] >` : ``} .show-list > li${type === `banger` ? `[data-banger="true"]` : ``}:not(:has([data-action="add-show"][aria-pressed="true"]))`);
	return pool.length > 0 ? pool[Math.floor(Math.random() * pool.length)].dataset.showId : ``;
}

// get show element in archive
function getShowInArchive(ID) {
	return page.seriesList.querySelector(`.show-list > [data-show-id="${ID.toUnicode(`\\`)}"]`);
}

// get show element on playlist
function getShowOnPlaylist(ID) {
	return page.playlist.querySelector(`:scope > [data-show-id="${ID.toUnicode(`\\`)}"]`);
}

// get array of all playlist show IDs
function getShowIDs(subset) {
	return [...subset].map(show => show.dataset.showId);
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

// shuffle playlist if it has at least 2 entries
function shufflePlaylist() {
	let i = page.playlist.children.length;
	if (i < 2) return;

	while (i > 0) page.playlist.append(page.playlist.children[Math.floor(Math.random() * i--)]);
	loadShow();
}

// reveal controls for clearing playlist
function revealClearPlaylistControls() {
	page.clearButton.press();
	page.clearPlaylistControls.hidden = false;
	page.clearPlaylistControls.focus();
}

// hide controls for clearing playlist
function hideClearPlaylistControls() {
	page.clearButton.unpress();
	page.clearPlaylistControls.hidden = true;
}

// clear playlist and hide clear controls again
function clearPlaylist() {
	if (page.playlist.children.length > 0) {
		page.playlist.replaceChildren();
		page.seriesList.querySelectorAll(`[data-action="add-show"]`).forEach(button => button.unpress());
		loadShow();
	}
	if (!page.clearPlaylistControls.hidden) hideClearPlaylistControls();
}

// list playlist of show IDs line-by-line in import-export box
function exportPlaylist() {
	page.importErrorMessage.hidden = true;
	page.importExport.value = getShowIDs(page.playlist.children).join(`\n`);
}

// import playlist from textbox
function importPlaylist() {
	page.importErrorMessage.hidden = true;
	page.importErrorList.replaceChildren();

	// if attempting to import IDs, validate them and either present invalid IDs or update playlist; if import box is empty, clear playlist
	const importIDs = page.importExport.value.trim().length > 0
		? [...new Set(page.importExport.value.trim().replace(/[^\S\n\r]/g, ``).split(/\n+/))]
		: [];
	const invalidIDs = importIDs.filter(ID => !getShowInArchive(ID));

	page.importExport.value = ``;

	if (invalidIDs.length === 0) {
		if (importIDs.length > 0) {
			clearPlaylist();
			importIDs.forEach(addShow);
		}
	} else {
		for (const ID of invalidIDs) page.importErrorList.appendChild(document.createElement(`li`)).textContent = ID;
		page.importExport.value = importIDs.join(`\n`);
		page.importErrorMessage.hidden = false;
		page.importErrorMessage.scrollIntoView();
	}
}

/* --
SHOWS
-- */

/* ADDING */

// add show to playlist; if playlist was previously empty, load top show
function addShow(ID) {
	const showInArchive = getShowInArchive(ID);
	if (!showInArchive) {
		console.warn(`attempted to add show with non-existent ID: ${ID}`);
		return;
	}

	const showOnPlaylist = getShowOnPlaylist(ID);
	if (showOnPlaylist) {
		page.playlist.append(showOnPlaylist);
		loadShow();
		console.log(`re-added show: ${ID}`);
		return;
	}

	// build new playlist item
	const playlistItemControls = {
		"move-up": "Move show up",
		"remove": "Remove show",
		"move-down": "Move show down",
	};
	const templatedShow = templateHTML.playlistItem.cloneNode(true);
	const newShow = templatedShow.querySelector(`li`);
	newShow.dataset.showId = ID;

	for (const [code, label] of Object.entries(playlistItemControls)) {
		const newControl = templateHTML.playlistItemControl.cloneNode(true);
		const newButton = newControl.querySelector(`button`);
		newButton.setAttributes({
			"data-action": code,
			"data-target": ID,
			"aria-label": label,
		});
		newControl.querySelector(`use`).setAttribute(`href`, `#svg-${code}`);
		newShow.querySelector(`.show-position-controls`).appendChild(newControl);
	}
	newShow.appendChild(showInArchive.querySelector(`.show-info`).cloneNode(true));
	expandShowInfo(newShow, showInArchive.closest(`#series-list > li`));

	// update page
	page.playlist.appendChild(templatedShow);
	showInArchive.querySelector(`[data-action="add-show"]`).press();
	console.log(`added show: ${ID}`);
	loadShow();
}

// add entire archive to playlist
function addArchive() {
	getShowIDs(page.seriesList.querySelectorAll(`${settings.copyrightSafety ? `[data-copyright-safe="true"] >` : ``} .show-list > li`)).forEach(addShow);
}

// add entire series to playlist
function addSeries(code) {
	getShowIDs(page.seriesList.querySelectorAll(`:scope > [data-series-id="${code}"] > .show-list > li`)).forEach(addShow);
}

// add a random show or banger to the playlist
function addRandomShow(showType) {
	const ID = getRandomShowID(showType);
	if (ID !== ``) {
		addShow(ID);
		window.scrollTo(0, page.playlist.lastElementChild.offsetTop - page.playlistControls.clientHeight);
	} else console.warn(`can't add new show of type "${showType}": all shows of that type already on playlist`);
}

/* MANIPULATING */

// move show up/down in playlist
function moveShow(ID, move) {
	const target = getShowOnPlaylist(ID);

	if (move > 0) target?.nextElementSibling?.after(target);
	else if (move < 0) target?.previousElementSibling?.before(target);

	loadShow();
}

// remove show from playlist
function removeShow(ID) {
	getShowOnPlaylist(ID)?.remove();
	getShowInArchive(ID)?.querySelector(`[data-action="add-show"]`).unpress();
	console.log(`removed show: ${ID}`);
	loadShow();
}

// write show parts onto page and load show audio file; if playlist is empty, reset radio
function loadShow() {
	if (page.playlist.children.length > 0 && page.playlist.firstElementChild.dataset.showId === page.loadedShow.dataset.showId) return;

	setAudioToggle(page.playToggle, `Play audio`, `play`);
	page.loadedShow.replaceChildren();

	if (page.playlist.children.length > 0) {
		const show = page.playlist.firstElementChild;
		page.loadedShow.dataset.showId = show.dataset.showId;

		// load audio file and show data
		page.audio.src = `${showData.path}${show.dataset.showId}${showData.extension}`;
		page.loadedShow.replaceChildren(...show.querySelector(`.show-info`).cloneChildren());

		// reset and reveal radio controls
		page.seekBar.value = 0;
		page.showTimeElapsed.textContent = `00:00`;
		page.audio.addEventListener(`loadedmetadata`, () => setTimestampFromSeconds(page.showTimeTotal, page.audio.duration));
		page.radioControls.hidden = false;

		console.log(`loaded show: ${show.dataset.showId}`);
	} else {
		// empty loaded show and playlist
		page.playlist.replaceChildren();

		// reset radio
		page.audio.pause(); // otherwise audio continues playing
		page.audio.removeAttribute(`src`);
		page.showTimeElapsed.textContent = `00:00`;
		page.showTimeTotal.textContent = `00:00`;
		page.radioControls.hidden = true;
		page.loadedShow.setAttribute(`data-show-id`, ``);
	}
}

// replace loaded show with next show on playlist (or reset radio if playlist ends)
function loadNextShow() {
	removeShow(page.playlist.firstElementChild.dataset.showId);
	page.seekBar.value = 0;
	if (page.audio.hasAttribute(`src`) && settings.autoPlayNextShow && page.audio.paused) togglePlay();
}

/* --
RADIO
-- */

// if audio is playing, update seek bar and time-elapsed
function updateSeekBar() {
	if (!page.audio.paused && page.seekBar.dataset.seeking !== `true` && page.audio.currentTime && page.audio.duration) {
		page.seekBar.value = page.audio.currentTime / page.audio.duration * 100;
		setTimestampFromSeconds(page.showTimeElapsed, page.audio.currentTime);
	}
}

// update displayed show time using seek bar
function updateSeekTime(value) {
	setTimestampFromSeconds(page.showTimeElapsed, page.audio.duration * value / 100);
}

// set audio toggle icon and aria-label
function setAudioToggle(toggle, label, code) {
	toggle.ariaLabel = label;
	toggle.querySelector(`use`).setAttribute(`href`, `#svg-${code}`);
}

// toggle audio play/pause
function togglePlay() {
	if (page.audio.paused) {
		page.audio.play();
		setAudioToggle(page.playToggle, `Pause show`, `pause`);
	} else {
		updateSeekBar(); // otherwise if the audio's paused after less than a second of play, seek bar doesn't update for each second
		page.audio.pause();
		setAudioToggle(page.playToggle, `Play show`, `play`);
	}
}

// toggle audio mute/unmute
function toggleMute() {
	if (page.audio.muted) {
		page.audio.muted = false;
		setAudioToggle(page.muteToggle, `Mute audio`, `mute`);
		page.volumeControl.value = page.audio.volume * 100;
	} else {
		page.audio.muted = true;
		setAudioToggle(page.muteToggle, `Unmute audio`, `unmute`);
		page.volumeControl.value = 0;
	}
}

// set audio volume
function setVolume(newVolume) {
	page.audio.volume = newVolume;
	if (page.audio.muted) toggleMute();
}

/* -----
SETTINGS
----- */

// initialise a toggle switch with a stored or default value
function initialiseToggle(id, toggled) {
	document.getElementById(`${id}-toggle`).setAttribute(`aria-pressed`, toggled ? `true` : `false`);
	console.info(`initialised "${id}" toggle: ${toggled ? `on` : `off`}`);
}

// switch a toggle from off/unpressed to on/pressed
function switchToggle(id) {
	const button = document.getElementById(`${id}-toggle`);
	button.setAttribute(`aria-pressed`, button.getAttribute(`aria-pressed`) === `false` ? `true` : `false`);
}

// toggle between excluding (true) and including (false) copyright-unsafe material when adding random shows or entire archive to playlist
function toggleCopyrightSafety() {
	settings.copyrightSafety = !settings.copyrightSafety;
	switchToggle(`copyright-safety`);
}

// toggle between hiding (true) and showing (false) show-content in Radio
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
	document.querySelectorAll(`.content-notes`).forEach(notes => notes.open = settings.notesOpen);
}

// sanitise a stored style, check validity vs DOM (else fall back to a default), and switch to using a given function
function initialiseStyle(name, switchStyleFunc) {
	if (!page[`${name}Buttons`].querySelector(`button[data-option="${styles[name]}"]`)) styles[name] = page[`${name}Buttons`].querySelector(`button`).dataset.option;
	switchStyleFunc(styles[name]);
}

// update setting and its buttons according to chosen value
function updateStyle(name, option) {
	page[`${name}Buttons`].querySelector(`[aria-pressed="true"]`)?.unpress();
	page[`${name}Buttons`].querySelector(`[data-option="${option}"]`)?.press();

	document.documentElement.dataset[name] = option;
	styles[name] = option;
}

// switch between different colour themes
function switchTheme(theme) {
	updateStyle(`theme`, theme);

	let faviconNew = faviconRaw;
	[`fore`, `back`, `hot`, `cold`].forEach(type => faviconNew = faviconNew.replaceAll(`--${type}-colour`, getStyle(`:root`, `--${type}-colour`)));
	page.SVGFavicon.href = `data:image/svg+xml,${encodeURIComponent(faviconNew)}`;
}

// switch between different fonts
function switchFont(font) {
	updateStyle(`font`, font);
}

/* --------------
PAGE CONSTRUCTION
-------------- */

// build HTML for archive show item
function buildShow(show) {
	// add show details to series' show list
	const templatedShow = templateHTML.archiveShow.cloneNode(true);
	const newShow = templatedShow.querySelector(`li`);
	newShow.setAttributes({
		"id": `archive-${show.ID}`,
		"data-show-id": show.ID,
		"data-banger": show.banger ? `true` : `false`,
	});
	newShow.querySelector(`.show-heading`).setContent(show.heading);
	newShow.querySelector(`.show-blurb`).setContent(show.blurb);

	// if show has content notes, add them to show-info, otherwise remove empty content notes element
	const contentNotes = newShow.querySelector(`.content-notes`);
	if (show.notes) {
		contentNotes.open = settings.notesOpen;
		contentNotes.querySelector(`span`).setContent(show.notes);
	} else contentNotes.remove();

	newShow.querySelector(`[data-action="add-show"]`).dataset.target = show.ID;

	return templatedShow;
}

// build HTML for archive series item and its list of shows
function buildSeries(series) {
	const newSeriesLink = page.seriesLinks.appendChild(document.createElement(`li`)).appendChild(document.createElement(`a`));
	newSeriesLink.setAttribute(`href`, `#archive-${series.code}`);
	newSeriesLink.setContent(series.heading);

	const templatedSeries = templateHTML.archiveSeries.cloneNode(true);
	const newSeries = templatedSeries.querySelector(`li`);
	const newSeriesShows = newSeries.querySelector(`.show-list`);
	newSeries.setAttributes({
		"id": `archive-${series.code}`,
		"data-series-id": series.code,
	});

	if (series.copyrightSafe) newSeries.dataset.copyrightSafe = `true`;
	newSeries.querySelector(`.series-heading`).setContent(series.heading);
	newSeries.querySelector(`.series-blurb`).setContent(series.blurb);
	newSeries.querySelector(`.series-source`).setContent(`source: ${series.source}`);
	newSeries.querySelector(`[data-action="add-series"]`).dataset.target = series.code;

	series.shows.forEach(show => show.ID = `${series.code}-${show.code}`);
	newSeriesShows.replaceChildren(...series.shows.map(buildShow));

	return templatedSeries;	
}

// build archive onto page
function buildArchive() {
	page.seriesList.replaceChildren(...archive.map(buildSeries));
	page.seriesList.addEventListener(`click`, () => {
		if (!event.target.hasAttribute(`aria-disabled`)) {
			switch (event.target.dataset.action) {
			case `add-series`: addSeries(event.target.dataset.target); break;
			case `add-show`: addShow(event.target.dataset.target); break;
			}
		}
	});

	// build out stats list
	const stats = {
		"series": archive.length,
		"shows": archive.reduce((a, series) => a + series.shows.length, 0),
	};
	for (const [name, value] of Object.entries(stats)) document.getElementById(`stats-${name}`).textContent = value;

	// clear archive object
	archive = null;
}

// add random banger to welcome page, with "add show" button as call to action
function buildFeaturedShow() {
	const showInArchive = getShowInArchive(getRandomShowID(`banger`));
	if (!showInArchive) {
		page.featuredShow.remove();
		return;
	}

	page.featuredShow.append(...showInArchive.cloneChildren());
	expandShowInfo(page.featuredShow, showInArchive.closest(`#series-list > li`));

	// add click event for adding featured show to playlist and removing it from welcome area
	page.featuredShow.querySelector(`[data-action="add-show"]`).addEventListener(`click`, () => {
		addShow(event.target.dataset.target);
		page.featuredShow.remove();
	});

	page.featuredShow.hidden = false;
}



/* ===========
	EVENTS
=========== */

// radio audio events
page.audio.addEventListener(`ended`, loadNextShow);

// radio interface events
page.seekBar.addEventListener(`change`, () => {
	page.seekBar.dataset.seeking = `false`;
	page.audio.currentTime = page.audio.duration * page.seekBar.value / 100;
});
page.seekBar.addEventListener(`input`, () => {
	page.seekBar.dataset.seeking = `true`;
	updateSeekTime(page.seekBar.value); // must set input.value as argument here
});
page.playToggle.addEventListener(`click`, togglePlay);
page.skipButton.addEventListener(`click`, loadNextShow);
page.muteToggle.addEventListener(`click`, toggleMute);
page.volumeControl.addEventListener(`input`, () => setVolume(page.volumeControl.value / 100));

// booth interface events
document.getElementById(`random-show-button`).addEventListener(`click`, () => addRandomShow(`all`));
document.getElementById(`random-banger-button`).addEventListener(`click`, () => addRandomShow(`banger`));
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
for (const [toggle, func] of Object.entries({
	"copyright-safety": toggleCopyrightSafety,
	"flat-radio": toggleFlatRadio,
	"auto-play": toggleAutoPlay,
	"content-notes": toggleContentNotes,
})) document.getElementById(`${toggle}-toggle`).addEventListener(`click`, func);
page.themeButtons.addEventListener(`click`, () => {
	if (!event.target.closest(`button`).hasAttribute(`aria-disabled`)) switchTheme(event.target.dataset.option);
});
page.fontButtons.addEventListener(`click`, () => {
	if (event.target.tagName === `BUTTON` && !event.target.hasAttribute(`aria-disabled`)) switchFont(event.target.dataset.option);
});

// on pageload, execute various tasks
document.addEventListener(`DOMContentLoaded`, () => {
	// initialise settings and styles
	initialiseToggle(`copyright-safety`, settings.copyrightSafety);
	initialiseToggle(`flat-radio`, settings.flatRadio);
	initialiseToggle(`auto-play`, settings.autoPlayNextShow);
	initialiseToggle(`content-notes`, settings.notesOpen);
	initialiseStyle(`theme`, switchTheme);
	initialiseStyle(`font`, switchFont);

	// initialise radio
	page.loadedShow.classList.toggle(`flat-radio`, settings.flatRadio);
	page.audio.paused = true;
	page.seekBar.value = 0;
	setVolume(page.volumeControl.value / 100);
	setInterval(updateSeekBar, 1000);

	// build various page sections
	buildArchive();
	retrieve(`playlist`, []).filter(getShowInArchive).forEach(addShow);
	if (page.playlist.children.length > 0) console.info(`loaded playlist from storage`);
	buildFeaturedShow();

	// update page head data
	page.title.dataset.original = document.title;
	if (window.location.hash) navigateToSection();
});

// on closing window/browser tab, record user settings and styles to localStorage
window.addEventListener(`beforeunload`, () => {
	if (page.audio.muted) page.volumeControl.value = page.audio.volume * 100; // if someone refreshes the page while audio is muted, the volume slider returns to the unmuted volume before page unloads, so it can load in at the same level when the page reloads
	store(`playlist`, getShowIDs(page.playlist.children));
	store(`settings`, settings);
	store(`styles`, styles);
});
