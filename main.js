/*jshint esversion: 11*/

/*
SCRIPT CONTROLS: settings to control app behaviour (e.g. default user settings)
PARAMETERS: initialising internal parameters
FUNCTIONS
	UTILITY: general and misc. applications
	PLAYLIST: building and altering the playlist
	SHOWS: adding, moving, removing, and loading shows
	RADIO: audio interface
	PAGE CONSTRUCTION: building page sections and content (e.g. the archive)
EVENTS: event listeners
*/



/* ====================
	SCRIPT CONTROLS
==================== */

// show file path builder
function showPath(showId) {
	const showIdParts = showId.split(`-`);
	const seriesCode = showIdParts.shift();
	const showCode = showIdParts.join(`-`);
	return `./audio/shows/${seriesCode}/${showCode}.mp3`;
}

// settings module: handles stored state of each boolean setting and its on-page toggle-switch
const settings = (() => {
	const local = retrieve(`settings`, {});
	local.copyrightSafety ??= false; // if true, exclude certain series from being added to the playlist during addArchive() or addRandomShow()
	local.flatRadio ??= false; // if true, hide all show info except show-heading in radio
	local.autoPlayNextShow ??= true; // if true, start playing next show when previous show runs to completion
	local.notesOpen ??= false; // if true, open all content notes

	function initialise() {
		Object.keys(local).forEach(setToggle);
		page.getElement(`loadedShow`).classList.toggle(`flat-radio`, settings.getSetting(`flatRadio`));
	}

	function setToggle(setting) {
		const toggle = document.getElementById(`${setting.camelToKebab()}-toggle`);
		toggle?.setAttribute(`aria-pressed`, local[setting].toString());
	}

	function toggleSetting(setting) {
		local[setting] = !local[setting];
		setToggle(setting);
		store(`settings`, local);

		if (setting === `flatRadio`) page.getElement(`loadedShow`).classList.toggle(`flat-radio`, local.flatRadio);
		else if (setting === `notesOpen`) document.querySelectorAll(`.content-notes`).forEach(notes => notes.open = settings.getSetting(`notesOpen`));
	}

	return {
		"initialise": () => initialise(),
		"getSetting": (setting) => local[setting],
		"toggle": (setting) => toggleSetting(setting),
	};
})();

// styles module: handles each stored style and its on-page button-set
const styles = (() => {
	const local = retrieve(`styles`, {});
	local.theme ??= document.documentElement.dataset.theme;
	local.font ??= document.documentElement.dataset.font;

	const faviconRaw = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 26 26" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round" vector-effect="non-scaling-stroke">
		<rect x="-1" y="-1" width="28" height="28" fill="--back-colour" />
		<path stroke="--hot-colour" d="M7 11a3 3 0 0 1 3 3a3 3 0 0 1 6 0a3 3 0 0 1 3-3" />
		<path stroke="--cold-colour" d="M7 8a6 6 0 0 1 12 0v4a6 6 0 0 1-12 0zm12 3h3v1a9 9 0 0 1-18 0v-1h3m6 10v3m-4 0h8" />
	</svg>`;

	function initialise() {
		Object.keys(local).forEach(setStyleButtons)
		updateFavicon();
	}

	function setStyleButtons(style) {
		const buttons = page.getElement(`${style}Buttons`);
		if (!buttons) return;

		buttons.querySelector(`[aria-pressed="true"]`)?.unpress();

		const newButton = buttons.querySelector(`[data-option="${local[style]}"]`);
		if (!newButton) {
			const defaultButton = buttons.querySelector(`button`);
			local[style] = defaultButton.dataset.option;
			defaultButton.press();
		} else newButton.press();
	}

	function updateFavicon() {
		let faviconNew = faviconRaw;
		[`fore`, `back`, `hot`, `cold`].forEach(type => faviconNew = faviconNew.replaceAll(`--${type}-colour`, getStyle(`:root`, `--${type}-colour`)));
		page.getElement(`SVGFavicon`).href = `data:image/svg+xml,${encodeURIComponent(faviconNew)}`;
	}

	function updateStyle(style, option) {
		local[style] = option;
		setStyleButtons(style);
		document.documentElement.dataset[style] = local[style];
		store(`styles`, local);
		if (style === `theme`) updateFavicon();
	}

	return {
		"initialise": () => initialise(),
		"getStyle": (style) => local[style],
		"setStyle": (style, option) => updateStyle(style, option),
	};
})();



/* ===============
	PARAMETERS
=============== */

// page module: handles a collection of stable on-page element references
const page = (() => {
	const elements = {};
	return {
		"setElement": (key, query) => elements[key] ??= document.querySelector(query),
		"getElement": (key) => elements[key],
	};
})();

// head
page.setElement(`title`, `title`);
page.setElement(`SVGFavicon`, `[rel="icon"][type="image/svg+xml"]`);

// radio
page.setElement(`loadedShow`, `#loaded-show`);
page.setElement(`radioControls`, `#radio-controls`);
page.setElement(`seekBar`, `#seek-bar`);
page.setElement(`showTimeElapsed`, `#show-time-elapsed`);
page.setElement(`showTimeTotal`, `#show-time-total`);
page.setElement(`playToggle`, `#play-toggle`);
page.setElement(`skipButton`, `#skip-button`);
page.setElement(`muteToggle`, `#mute-toggle`);
page.setElement(`volumeControl`, `#volume-control`);
page.setElement(`audio`, `#show-audio`);

// booth
page.setElement(`playlist`, `#playlist`);
page.setElement(`playlistControls`, `#playlist-controls`);
page.setElement(`clearButton`, `#clear-button`);
page.setElement(`clearPlaylistControls`, `#clear-playlist-controls`);
page.setElement(`importExport`, `#import-export-data`);
page.setElement(`importErrorMessage`, `#import-error-message`);
page.setElement(`importErrorList`, `#import-error-list`);

// archive
page.setElement(`seriesLinks`, `#archive-series-links`);
page.setElement(`seriesList`, `#series-list`);

// settings
page.setElement(`themeButtons`, `#theme-buttons`);
page.setElement(`fontButtons`, `#font-buttons`);

// template HTML module: handles a collection of permanent template content doc fragments
const templateHTML = (() => {
	const templates = {};
	return {
		"setTemplate": (key, id) => templates[key] ??= document.getElementById(`${id}-template`)?.content,
		"getTemplate": (key) => templates[key],
		"cloneTemplate": (key) => templates[key]?.cloneNode(true),
	};
})();

templateHTML.setTemplate(`playlistItem`, `playlist-item`);
templateHTML.setTemplate(`archiveSeries`, `archive-series`);
templateHTML.setTemplate(`archiveShow`, `archive-show`);

// mutation observer to store playlist changes
const playlistObserver = new MutationObserver(storePlaylist);

function connectPlaylistObserver() {
	playlistObserver.observe(page.getElement(`playlist`), {"childList": true});
}



/* ==============
	FUNCTIONS
============== */

/* ----
UTILITY
---- */

// convert time in seconds to minutes:seconds timestamp
function setTimestampFromSeconds(element, time) {
	const minutes = Math.floor(time / 60).toString().padStart(2, `0`);
	const seconds = Math.floor(time % 60).toString().padStart(2, `0`);
	element.textContent = `${minutes}:${seconds}`;
}

// get show ID from a pool, adjusted for copyright safety
function getRandomShowID(type = ``) {
	const pool = page.getElement(`seriesList`).querySelectorAll(`${settings.getSetting(`copyrightSafety`) ? `[data-copyright-safe="true"] >` : ``} .show-list > li${type === `banger` ? `[data-banger="true"]` : ``}:not(:has([data-action="add-show"][aria-pressed="true"]))`);
	return pool.length > 0 ? pool[Math.floor(Math.random() * pool.length)].dataset.showId : ``;
}

// get show element in archive
function getShowInArchive(ID) {
	return page.getElement(`seriesList`).querySelector(`.show-list > [data-show-id="${ID}"]`);
}

// get show element on playlist
function getShowOnPlaylist(ID) {
	return page.getElement(`playlist`).querySelector(`:scope > [data-show-id="${ID}"]`);
}

// get array of all show IDs, from a set of HTML show elements
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

// store playlist as list of show IDs
function storePlaylist() {
	store(`playlist`, getShowIDs(page.getElement(`playlist`).children));
}



/* -----
PLAYLIST
----- */

// shuffle playlist if it has at least 2 entries
function shufflePlaylist() {
	let i = page.getElement(`playlist`).children.length;
	if (i < 2) return;

	while (i > 0) page.getElement(`playlist`).append(page.getElement(`playlist`).children[Math.floor(Math.random() * i--)]);

	loadShow();
}

// reveal controls for clearing playlist
function revealClearPlaylistControls() {
	page.getElement(`clearButton`).press();
	page.getElement(`clearPlaylistControls`).hidden = false;
	page.getElement(`clearPlaylistControls`).focus();
}

// hide controls for clearing playlist
function hideClearPlaylistControls() {
	page.getElement(`clearButton`).unpress();
	page.getElement(`clearPlaylistControls`).hidden = true;
}

// clear playlist and hide clear controls again
function clearPlaylist() {
	if (page.getElement(`playlist`).children.length > 0) {
		page.getElement(`playlist`).replaceChildren();
		page.getElement(`seriesList`).querySelectorAll(`[data-action="add-show"][aria-pressed="true"]`)
			.forEach(button => button.unpress());
		loadShow();
	}
	if (!page.getElement(`clearPlaylistControls`).hidden) hideClearPlaylistControls();
}

// list playlist of show IDs line-by-line in import-export box
function exportPlaylist() {
	page.getElement(`importErrorMessage`).hidden = true;
	page.getElement(`importExport`).value = getShowIDs(page.getElement(`playlist`).children).join(`\n`);
}

// import playlist from textbox
function importPlaylist() {
	const importList = page.getElement(`importExport`).value.trim();
	if (importList.length === 0) return;

	page.getElement(`importErrorMessage`).hidden = true;
	page.getElement(`importErrorList`).replaceChildren();

	const validIDRegex = /^[A-Z][A-Za-z]{1,2}-\w+-\w+$/m;
	const importIDs = [...new Set(importList.replace(/[^\S\n\r]/g, ``).split(/\n+/))];
	const invalidIDs = importIDs.filter(ID => !validIDRegex.test(ID) || !getShowInArchive(ID));

	page.getElement(`importExport`).value = ``;

	if (invalidIDs.length === 0) {
		clearPlaylist();
		importIDs.forEach(addShow);
	} else {
		invalidIDs.forEach(ID => page.getElement(`importErrorList`).appendChild(document.createElement(`li`)).textContent = ID);
		page.getElement(`importExport`).value = importIDs.join(`\n`);
		page.getElement(`importErrorMessage`).hidden = false;
		page.getElement(`importErrorMessage`).scrollIntoView();
	}
}

// load playlist from local storage
function loadPlaylist() {
	page.getElement(`playlist`).replaceChildren();
	retrieve(`playlist`, []).filter(getShowInArchive).forEach(addShow);
	loadShow();
}

/* --
SHOWS
-- */

/* ADDING */

// add show to playlist; if playlist was previously empty, load top show
function addShow(ID) {
	const showOnPlaylist = getShowOnPlaylist(ID);
	if (showOnPlaylist) {
		page.getElement(`playlist`).append(showOnPlaylist);
		loadShow();
		console.log(`re-added show: ${ID}`);
		return;
	}

	const showInArchive = getShowInArchive(ID);

	// build new playlist item
	const templatedShow = templateHTML.cloneTemplate(`playlistItem`);
	const newShow = templatedShow.querySelector(`li`);
	newShow.dataset.showId = ID;
	newShow.appendChild(showInArchive.querySelector(`.show-info`).cloneNode(true));
	expandShowInfo(newShow, showInArchive.closest(`#series-list > li`));

	// update page and stored data
	showInArchive.querySelector(`[data-action="add-show"]`).press();
	page.getElement(`playlist`).appendChild(templatedShow);
	loadShow();
}

// add entire archive to playlist
function addArchive() {
	getShowIDs(page.getElement(`seriesList`).querySelectorAll(`${settings.getSetting(`copyrightSafety`) ? `[data-copyright-safe="true"] >` : ``} .show-list > li`)).forEach(addShow);
	storePlaylist();
}

// add entire series to playlist
function addSeries(seriesInArchive) {
	getShowIDs(seriesInArchive.querySelectorAll(`.show-list > li`)).forEach(addShow);
}

// add a random show or banger to the playlist
function addRandomShow(showType) {
	const ID = getRandomShowID(showType);
	if (ID !== ``) {
		addShow(ID);
		window.scrollTo(0, page.getElement(`playlist`).lastElementChild.offsetTop - page.getElement(`playlistControls`).clientHeight);
	} else console.warn(`can't add new show of type "${showType}": all shows of that type already on playlist`);
}

/* MANIPULATING */

function moveShowUp(target) {
	target.previousElementSibling?.before(target);
	loadShow();
}

function moveShowDown(target) {
	target.nextElementSibling?.after(target);
	loadShow();
}

// remove show from playlist
function removeShow(target) {
	getShowInArchive(target.dataset.showId).querySelector(`[data-action="add-show"]`).unpress();
	target.remove();
	loadShow();
}

// write show parts onto page and load show audio file; if playlist is empty, reset radio
function loadShow() {
	if (page.getElement(`playlist`).children.length > 0 && page.getElement(`playlist`).firstElementChild.dataset.showId === page.getElement(`loadedShow`).dataset.showId) return;

	setAudioToggle(page.getElement(`playToggle`), `Play audio`, `play`);
	page.getElement(`loadedShow`).replaceChildren();

	if (page.getElement(`playlist`).children.length > 0) {
		const show = page.getElement(`playlist`).firstElementChild;
		page.getElement(`loadedShow`).dataset.showId = show.dataset.showId;

		// load audio file and show data
		page.getElement(`audio`).src = showPath(show.dataset.showId);
		page.getElement(`loadedShow`).replaceChildren(...show.querySelector(`.show-info`).cloneChildren());

		// reset and reveal radio controls
		page.getElement(`seekBar`).value = 0;
		page.getElement(`showTimeElapsed`).textContent = `00:00`;
		page.getElement(`audio`).addEventListener(`loadedmetadata`, () => setTimestampFromSeconds(page.getElement(`showTimeTotal`), page.getElement(`audio`).duration));
		page.getElement(`radioControls`).hidden = false;
	} else {
		// empty loaded show and playlist
		page.getElement(`playlist`).replaceChildren();

		// reset radio
		page.getElement(`audio`).pause(); // otherwise audio continues playing
		page.getElement(`audio`).removeAttribute(`src`);
		page.getElement(`showTimeElapsed`).textContent = `00:00`;
		page.getElement(`showTimeTotal`).textContent = `00:00`;
		page.getElement(`radioControls`).hidden = true;
		page.getElement(`loadedShow`).setAttribute(`data-show-id`, ``);
	}
}

// replace loaded show with next show on playlist (or reset radio if playlist ends)
function loadNextShow() {
	removeShow(page.getElement(`playlist`).firstElementChild);
	page.getElement(`seekBar`).value = 0;
	if (page.getElement(`audio`).hasAttribute(`src`) && settings.getSetting(`autoPlayNextShow`) && page.getElement(`audio`).paused) togglePlay();
}

/* --
RADIO
-- */

// if audio is playing, update seek bar and time-elapsed
function updateSeekBar() {
	if (!page.getElement(`audio`).paused && page.getElement(`seekBar`).dataset.seeking !== `true` && page.getElement(`audio`).currentTime && page.getElement(`audio`).duration) {
		page.getElement(`seekBar`).value = page.getElement(`audio`).currentTime / page.getElement(`audio`).duration * 100;
		setTimestampFromSeconds(page.getElement(`showTimeElapsed`), page.getElement(`audio`).currentTime);
	}
}

// update displayed show time using seek bar
function updateSeekTime(value) {
	setTimestampFromSeconds(page.getElement(`showTimeElapsed`), page.getElement(`audio`).duration * value / 100);
}

// set audio toggle icon and aria-label
function setAudioToggle(toggle, label, code) {
	toggle.ariaLabel = label;
	toggle.querySelector(`use`).setAttribute(`href`, `#svg-${code}`);
}

// toggle audio play/pause
function togglePlay() {
	if (page.getElement(`audio`).paused) {
		page.getElement(`audio`).play();
		setAudioToggle(page.getElement(`playToggle`), `Pause show`, `pause`);
	} else {
		updateSeekBar(); // otherwise if the audio's paused after less than a second of play, seek bar doesn't update for each second
		page.getElement(`audio`).pause();
		setAudioToggle(page.getElement(`playToggle`), `Play show`, `play`);
	}
}

// toggle audio mute/unmute
function toggleMute() {
	if (page.getElement(`audio`).muted) {
		page.getElement(`audio`).muted = false;
		setAudioToggle(page.getElement(`muteToggle`), `Mute audio`, `mute`);
		page.getElement(`volumeControl`).value = page.getElement(`audio`).volume * 100;
	} else {
		page.getElement(`audio`).muted = true;
		setAudioToggle(page.getElement(`muteToggle`), `Unmute audio`, `unmute`);
		page.getElement(`volumeControl`).value = 0;
	}
}

// set audio volume
function setVolume(newVolume) {
	page.getElement(`audio`).volume = newVolume;
	if (page.getElement(`audio`).muted) toggleMute();
}

/* --------------
PAGE CONSTRUCTION
-------------- */

// build an archive nav-link
function buildSeriesLink(series) {
	const newSeriesLinkItem = document.createElement(`li`);
	const newSeriesLink = newSeriesLinkItem.appendChild(document.createElement(`a`));
	newSeriesLink.setAttribute(`href`, `#archive-${series.code}`);
	newSeriesLink.setContent(series.heading);
	return newSeriesLinkItem;
}

// build HTML for archive show item
function buildShow(show) {
	// add show details to series' show list
	const templatedShow = templateHTML.cloneTemplate(`archiveShow`);
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
	if (show.notes) contentNotes.querySelector(`span`).setContent(show.notes);
	else contentNotes.remove();

	newShow.querySelector(`[data-action="add-show"]`).dataset.target = show.ID;

	return templatedShow;
}

// build HTML for archive series item and its list of shows
function buildSeries(series) {
	const templatedSeries = templateHTML.cloneTemplate(`archiveSeries`);
	const newSeries = templatedSeries.querySelector(`li`);
	newSeries.setAttributes({
		"id": `archive-${series.code}`,
		"data-series-id": series.code,
		"data-copyright-safe": series.copyrightSafe ? `true` : `false`,
	});

	if (series.copyrightSafe) newSeries.dataset.copyrightSafe = `true`;
	newSeries.querySelector(`.series-heading`).setContent(series.heading);
	newSeries.querySelector(`.series-blurb`).setContent(series.blurb);
	newSeries.querySelector(`.series-source`).setContent(`source: ${series.source}`);
	newSeries.querySelector(`[data-action="add-series"]`).dataset.target = series.code;

	series.shows.forEach(show => show.ID = `${series.code}-${show.code}`);
	newSeries.querySelector(`.show-list`).replaceChildren(...series.shows.map(buildShow));

	return templatedSeries;
}

// build archive onto page
function buildArchive() {
	templateHTML.getTemplate(`archiveShow`).querySelector(`.content-notes`).open = settings.getSetting(`notesOpen`);

	page.getElement(`seriesLinks`).replaceChildren(...archive.map(buildSeriesLink));
	page.getElement(`seriesList`).replaceChildren(...archive.map(buildSeries));
	page.getElement(`seriesList`).addEventListener(`click`, () => {
		if (!event.target.hasAttribute(`aria-disabled`)) {
			switch (event.target.dataset.action) {
			case `add-series`: addSeries(event.target.closest(`#series-list > li`)); break;
			case `add-show`: addShow(event.target.dataset.target); break;
			}
		}
	});

	// build out stats list
	Object.entries({
		"series": archive.length,
		"shows": archive.reduce((a, series) => a + series.shows.length, 0),
	}).forEach(([name, value]) => document.getElementById(`stats-${name}`).textContent = value);

	// clear archive object
	archive = null;
}

// add random banger to welcome page, with "add show" button as call to action
function buildFeaturedShow() {
	const ID = getRandomShowID(`banger`);
	if (ID === ``) {
		console.warn(`can't feature show on welcome: all bangers already on playlist`);
		return;
	}

	const container = document.getElementById(`featured-show-container`);
	const featuredShow = document.getElementById(`featured-show`);
	const showInArchive = getShowInArchive(ID);
	featuredShow.dataset.showId = ID;
	featuredShow.replaceChildren(...showInArchive.cloneChildren());
	expandShowInfo(featuredShow, showInArchive.closest(`#series-list > li`));

	// add click event for adding featured show to playlist and removing it from welcome area
	featuredShow.querySelector(`[data-action="add-show"]`).addEventListener(`click`, () => {
		addShow(event.target.dataset.target);
		container.hidden = true;
	});

	container.hidden = false;
}



/* ===========
	EVENTS
=========== */

// radio audio events
page.getElement(`audio`).addEventListener(`ended`, loadNextShow);

// radio interface events
page.getElement(`seekBar`).addEventListener(`change`, () => {
	page.getElement(`seekBar`).dataset.seeking = `false`;
	page.getElement(`audio`).currentTime = page.getElement(`audio`).duration * page.getElement(`seekBar`).value / 100;
});
page.getElement(`seekBar`).addEventListener(`input`, () => {
	page.getElement(`seekBar`).dataset.seeking = `true`;
	updateSeekTime(page.getElement(`seekBar`).value); // must set input.value as argument here
});
page.getElement(`playToggle`).addEventListener(`click`, togglePlay);
page.getElement(`skipButton`).addEventListener(`click`, loadNextShow);
page.getElement(`muteToggle`).addEventListener(`click`, toggleMute);
page.getElement(`volumeControl`).addEventListener(`input`, () => setVolume(page.getElement(`volumeControl`).value / 100));

// booth interface events
document.getElementById(`random-show-button`).addEventListener(`click`, () => addRandomShow(`all`));
document.getElementById(`random-banger-button`).addEventListener(`click`, () => addRandomShow(`banger`));
document.getElementById(`shuffle-button`).addEventListener(`click`, shufflePlaylist);
page.getElement(`clearButton`).addEventListener(`click`, () => {
	if (!page.getElement(`clearButton`).hasAttribute(`aria-disabled`)) revealClearPlaylistControls();
});

document.getElementById(`clear-cancel-button`).addEventListener(`click`, hideClearPlaylistControls);
document.getElementById(`clear-confirm-button`).addEventListener(`click`, clearPlaylist);
[`playlist-controls`, `data-controls`].forEach(id => {
	document.getElementById(id).addEventListener(`click`, () => {
		if (event.target.tagName === `BUTTON` && !event.target.hasAttribute(`aria-disabled`)) hideClearPlaylistControls();
	});
});
page.getElement(`playlist`).addEventListener(`click`, () => {
	const target = event.target.closest(`#playlist > li`);
	switch (event.target.dataset.action) {
	case `move-up`: moveShowUp(target); break;
	case `remove`: removeShow(target); break;
	case `move-down`: moveShowDown(target); break;
	}
});
document.getElementById(`export-button`).addEventListener(`click`, exportPlaylist);
document.getElementById(`import-button`).addEventListener(`click`, importPlaylist);

// archive interface events (excluding those dependent on the archive HTML being generated beforehand)
document.getElementById(`add-archive-button`).addEventListener(`click`, addArchive);

// settings interface events (general)
for (const setting of [`copyrightSafety`, `flatRadio`, `autoPlayNextShow`, `notesOpen`]) {
	document.getElementById(`${setting.camelToKebab()}-toggle`).addEventListener(`click`, () => settings.toggle(setting));
}
[`theme`, `font`].forEach(style => {
	page.getElement(`${style}Buttons`).addEventListener(`click`, () => {
		if (event.target.tagName === `BUTTON` && !event.target.hasAttribute(`aria-disabled`)) styles.setStyle(style, event.target.dataset.option);
	});
});

// on pageload, execute various tasks
document.addEventListener(`DOMContentLoaded`, () => {
	// initialise settings and styles
	settings.initialise();
	styles.initialise();

	// initialise radio
	page.getElement(`audio`).paused = true;
	page.getElement(`seekBar`).value = 0;
	setVolume(page.getElement(`volumeControl`).value / 100);
	setInterval(updateSeekBar, 1000);

	// build various page sections
	buildArchive();
	loadPlaylist();
	buildFeaturedShow();

	// start watching for playlist changes
	connectPlaylistObserver();

	// update page head data
	page.getElement(`title`).dataset.original = document.title;
	if (location.hash) navigateToSection();
});

// on closing window/browser tab, preserve audio level
window.addEventListener(`beforeunload`, () => {
	// if someone refreshes the page while audio is muted, the volume slider returns to the unmuted volume before page unloads, so it can load in at the same level when the page reloads
	if (page.getElement(`audio`).muted) page.getElement(`volumeControl`).value = page.getElement(`audio`).volume * 100;
});

// update settings, styles, and playlist if styles change in another browsing context
window.addEventListener(`storage`, () => {
	const newValue = JSON.parse(event.newValue);
	switch (event.key) {
	case `settings`:
		if (settings.getSetting(`copyrightSafety`) !== newValue.copyrightSafety) settings.toggle(`copyrightSafety`);
		if (settings.getSetting(`flatRadio`) !== newValue.flatRadio) settings.toggle(`flatRadio`);
		if (settings.getSetting(`autoPlayNextShow`) !== newValue.autoPlayNextShow) settings.toggle(`autoPlayNextShow`);
		if (settings.getSetting(`notesOpen`) !== newValue.notesOpen) settings.toggle(`notesOpen`);
		console.info(`automatically matched settings change in another browsing context`);
		break;
	case `styles`:
		if (styles.getStyle(`theme`) !== newValue.theme) styles.setStyle(`theme`, newValue.theme);
		if (styles.getStyle(`font`) !== newValue.font) styles.setStyle(`font`, newValue.font);
		console.info(`automatically matched style change in another browsing context`);
		break;
	case `playlist`:
		// could do this with a broadcast channel instead of mutation observer + storage event
		// however, that adds an extra tech and it'd be less robust than rebuilding the playlist from scratch
		playlistObserver.disconnect();
		loadPlaylist();
		connectPlaylistObserver();
		page.getElement(`seriesList`).querySelectorAll(`[data-action="add-show"]`).forEach(button => {
			if (event.newValue.includes(button.dataset.target)) button.press();
			else button.unpress();
		})
		console.info(`automatically matched playlist change in another browsing context`);
		break;
	}
});
