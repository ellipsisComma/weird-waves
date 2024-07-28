/*jshint esversion: 11*/

/*
SCRIPT CONTROLS: settings global variables to control app behaviour (e.g. default settings)
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
function showPath(ID) {
	return `./audio/shows/${ID}.mp3`;
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
		page.get(`loadedShow`).classList.toggle(`flat-radio`, settings.get(`flatRadio`));
	}

	function setToggle(setting) {
		const toggle = document.getElementById(`${setting.camelToKebab()}-toggle`);
		toggle?.setAttribute(`aria-pressed`, local[setting].toString());
	}

	function toggleSetting(setting) {
		local[setting] = !local[setting];
		setToggle(setting);
		store(`settings`, local);

		if (setting === `flatRadio`) page.get(`loadedShow`).classList.toggle(`flat-radio`, local.flatRadio);
		else if (setting === `notesOpen`) document.querySelectorAll(`.content-notes`).forEach(notes => notes.open = settings.get(`notesOpen`));
	}

	return {
		"initialise": () => initialise(),
		"get": (setting) => local[setting],
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
		const buttons = page.get(`${style}Buttons`);
		if (!buttons) return;

		buttons.querySelector(`[aria-pressed="true"]`)?.unpress();

		const newButton = buttons.querySelector(`[data-option="${local[style]}"]`);
		if (!newButton) {
			const defaultButton = buttons.querySelector(`button`);
			local[style] = defaultButton.dataset.option;
			defaultButton.press();
			if (style === `theme`) updateFavicon();
		} else newButton.press();
	}

	function updateFavicon() {
		let faviconNew = faviconRaw;
		[`fore`, `back`, `hot`, `cold`].forEach(type => faviconNew = faviconNew.replaceAll(`--${type}-colour`, getStyle(`:root`, `--${type}-colour`)));
		page.get(`SVGFavicon`).href = `data:image/svg+xml,${encodeURIComponent(faviconNew)}`;
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
		"get": (style) => local[style],
		"set": (style, option) => updateStyle(style, option),
	};
})();



/* ===============
	PARAMETERS
=============== */

// page module: handles a collection of stable on-page element references
const page = (() => {
	const elements = {};
	return {
		"set": (key, query) => elements[key] ??= document.querySelector(query),
		"get": (key) => elements[key],
	};
})();

// head
page.set(`title`, `title`);
page.set(`SVGFavicon`, `[rel="icon"][type="image/svg+xml"]`);

// radio
page.set(`loadedShow`, `#loaded-show`);
page.set(`radioControls`, `#radio-controls`);
page.set(`seekBar`, `#seek-bar`);
page.set(`showTimeElapsed`, `#show-time-elapsed`);
page.set(`showTimeTotal`, `#show-time-total`);
page.set(`playToggle`, `#play-toggle`);
page.set(`skipButton`, `#skip-button`);
page.set(`muteToggle`, `#mute-toggle`);
page.set(`volumeControl`, `#volume-control`);
page.set(`audio`, `#show-audio`);

// booth
page.set(`playlist`, `#playlist`);
page.set(`playlistControls`, `#playlist-controls`);
page.set(`clearButton`, `#clear-button`);
page.set(`clearPlaylistControls`, `#clear-playlist-controls`);
page.set(`importExport`, `#import-export-data`);
page.set(`importErrorMessage`, `#import-error-message`);
page.set(`importErrorList`, `#import-error-list`);

// archive
page.set(`seriesLinks`, `#archive-series-links`);
page.set(`seriesList`, `#series-list`);

// settings
page.set(`themeButtons`, `#theme-buttons`);
page.set(`fontButtons`, `#font-buttons`);

// template HTML module: handles a collection of permanent template content doc fragments
const templateHTML = (() => {
	const templates = {};
	return {
		"set": (key, id) => templates[key] ??= document.getElementById(`${id}-template`)?.content,
		"get": (key) => templates[key],
		"clone": (key) => templates[key]?.cloneNode(true),
	};
})();

templateHTML.set(`playlistItem`, `playlist-item`);
templateHTML.set(`archiveSeries`, `archive-series`);
templateHTML.set(`archiveShow`, `archive-show`);

// record whether playlist is currently undergoing large changes
let makingLargePlaylistChanges = false;



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
	const pool = page.get(`seriesList`).querySelectorAll(`${settings.get(`copyrightSafety`) ? `[data-copyright-safe="true"] >` : ``} .show-list > li${type === `banger` ? `[data-banger="true"]` : ``}:not(:has([data-action="add-show"][aria-pressed="true"]))`);
	return pool.length > 0 ? pool[Math.floor(Math.random() * pool.length)].dataset.showId : ``;
}

// get show element in archive
function getShowInArchive(ID) {
	return page.get(`seriesList`).querySelector(`.show-list > [data-show-id="${ID}"]`);
}

// get show element on playlist
function getShowOnPlaylist(ID) {
	return page.get(`playlist`).querySelector(`:scope > [data-show-id="${ID}"]`);
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



/* -----
PLAYLIST
----- */

// shuffle playlist if it has at least 2 entries
function shufflePlaylist() {
	let i = page.get(`playlist`).children.length;
	if (i < 2) return;

	makingLargePlaylistChanges = true;
	while (i > 0) page.get(`playlist`).append(page.get(`playlist`).children[Math.floor(Math.random() * i--)]);
	makingLargePlaylistChanges = false;
	store(`playlist`, getShowIDs(page.get(`playlist`).children));

	loadShow();
}

// reveal controls for clearing playlist
function revealClearPlaylistControls() {
	page.get(`clearButton`).press();
	page.get(`clearPlaylistControls`).hidden = false;
	page.get(`clearPlaylistControls`).focus();
}

// hide controls for clearing playlist
function hideClearPlaylistControls() {
	page.get(`clearButton`).unpress();
	page.get(`clearPlaylistControls`).hidden = true;
}

// clear playlist and hide clear controls again
function clearPlaylist() {
	if (page.get(`playlist`).children.length > 0) {
		page.get(`playlist`).replaceChildren();
		page.get(`seriesList`).querySelectorAll(`[data-action="add-show"][aria-pressed="true"]`)
			.forEach(button => button.unpress());
		loadShow();
	}
	if (!page.get(`clearPlaylistControls`).hidden) hideClearPlaylistControls();
}

// list playlist of show IDs line-by-line in import-export box
function exportPlaylist() {
	page.get(`importErrorMessage`).hidden = true;
	page.get(`importExport`).value = getShowIDs(page.get(`playlist`).children).join(`\n`);
}

// import playlist from textbox
function importPlaylist() {
	const importList = page.get(`importExport`).value.trim();
	if (importList.length === 0) return;

	page.get(`importErrorMessage`).hidden = true;
	page.get(`importErrorList`).replaceChildren();

	const validIDRegex = /^[A-Z][A-Za-z]{1,2}-\w+-\w+$/m;
	const importIDs = [...new Set(importList.replace(/[^\S\n\r]/g, ``).split(/\n+/))];
	const invalidIDs = importIDs.filter(ID => !validIDRegex.test(ID) || !getShowInArchive(ID));

	page.get(`importExport`).value = ``;

	if (invalidIDs.length === 0) {
		makingLargePlaylistChanges = true;
		clearPlaylist();
		importIDs.forEach(addShow);
		makingLargePlaylistChanges = false;
		store(`playlist`, getShowIDs(page.get(`playlist`).children));
	} else {
		invalidIDs.forEach(ID => page.get(`importErrorList`).appendChild(document.createElement(`li`)).textContent = ID);
		page.get(`importExport`).value = importIDs.join(`\n`);
		page.get(`importErrorMessage`).hidden = false;
		page.get(`importErrorMessage`).scrollIntoView();
	}
}

// load playlist from local storage
function loadPlaylist() {
	makingLargePlaylistChanges = true;
	page.get(`playlist`).replaceChildren();
	retrieve(`playlist`, []).filter(getShowInArchive).forEach(addShow);
	makingLargePlaylistChanges = false;
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
		page.get(`playlist`).append(showOnPlaylist);
		loadShow();
		console.log(`re-added show: ${ID}`);
		return;
	}

	const showInArchive = getShowInArchive(ID);

	// build new playlist item
	const templatedShow = templateHTML.clone(`playlistItem`);
	const newShow = templatedShow.querySelector(`li`);
	newShow.dataset.showId = ID;
	newShow.appendChild(showInArchive.querySelector(`.show-info`).cloneNode(true));
	expandShowInfo(newShow, showInArchive.closest(`#series-list > li`));

	// update page and stored data
	showInArchive.querySelector(`[data-action="add-show"]`).press();
	page.get(`playlist`).appendChild(templatedShow);
	loadShow();
}

// add entire archive to playlist
function addArchive() {
	makingLargePlaylistChanges = true;
	getShowIDs(page.get(`seriesList`).querySelectorAll(`${settings.get(`copyrightSafety`) ? `[data-copyright-safe="true"] >` : ``} .show-list > li`)).forEach(addShow);
	makingLargePlaylistChanges = false;
	store(`playlist`, getShowIDs(page.get(`playlist`).children));
}

// add entire series to playlist
function addSeries(seriesInArchive) {
	makingLargePlaylistChanges = true;
	[...seriesInArchive.querySelectorAll(`.show-list > li`)].forEach(addShow);
	makingLargePlaylistChanges = false;
	store(`playlist`, getShowIDs(page.get(`playlist`).children));
}

// add a random show or banger to the playlist
function addRandomShow(showType) {
	const ID = getRandomShowID(showType);
	if (ID !== ``) {
		addShow(ID);
		window.scrollTo(0, page.get(`playlist`).lastElementChild.offsetTop - page.get(`playlistControls`).clientHeight);
	} else console.warn(`can't add new show of type "${showType}": all shows of that type already on playlist`);
}

/* MANIPULATING */

function moveShowUp(target) {
	target.previousElementSibling?.before(target);
	store(`playlist`, getShowIDs(page.get(`playlist`).children));
	loadShow();
}

function moveShowDown(target) {
	target.nextElementSibling?.after(target);
	store(`playlist`, getShowIDs(page.get(`playlist`).children));
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
	if (page.get(`playlist`).children.length > 0 && page.get(`playlist`).firstElementChild.dataset.showId === page.get(`loadedShow`).dataset.showId) return;

	setAudioToggle(page.get(`playToggle`), `Play audio`, `play`);
	page.get(`loadedShow`).replaceChildren();

	if (page.get(`playlist`).children.length > 0) {
		const show = page.get(`playlist`).firstElementChild;
		page.get(`loadedShow`).dataset.showId = show.dataset.showId;

		// load audio file and show data
		page.get(`audio`).src = showPath(show.dataset.showId);
		page.get(`loadedShow`).replaceChildren(...show.querySelector(`.show-info`).cloneChildren());

		// reset and reveal radio controls
		page.get(`seekBar`).value = 0;
		page.get(`showTimeElapsed`).textContent = `00:00`;
		page.get(`audio`).addEventListener(`loadedmetadata`, () => setTimestampFromSeconds(page.get(`showTimeTotal`), page.get(`audio`).duration));
		page.get(`radioControls`).hidden = false;
	} else {
		// empty loaded show and playlist
		page.get(`playlist`).replaceChildren();

		// reset radio
		page.get(`audio`).pause(); // otherwise audio continues playing
		page.get(`audio`).removeAttribute(`src`);
		page.get(`showTimeElapsed`).textContent = `00:00`;
		page.get(`showTimeTotal`).textContent = `00:00`;
		page.get(`radioControls`).hidden = true;
		page.get(`loadedShow`).setAttribute(`data-show-id`, ``);
	}
}

// replace loaded show with next show on playlist (or reset radio if playlist ends)
function loadNextShow() {
	removeShow(page.get(`playlist`).firstElementChild);
	page.get(`seekBar`).value = 0;
	if (page.get(`audio`).hasAttribute(`src`) && settings.get(`autoPlayNextShow`) && page.get(`audio`).paused) togglePlay();
}

/* --
RADIO
-- */

// if audio is playing, update seek bar and time-elapsed
function updateSeekBar() {
	if (!page.get(`audio`).paused && page.get(`seekBar`).dataset.seeking !== `true` && page.get(`audio`).currentTime && page.get(`audio`).duration) {
		page.get(`seekBar`).value = page.get(`audio`).currentTime / page.get(`audio`).duration * 100;
		setTimestampFromSeconds(page.get(`showTimeElapsed`), page.get(`audio`).currentTime);
	}
}

// update displayed show time using seek bar
function updateSeekTime(value) {
	setTimestampFromSeconds(page.get(`showTimeElapsed`), page.get(`audio`).duration * value / 100);
}

// set audio toggle icon and aria-label
function setAudioToggle(toggle, label, code) {
	toggle.ariaLabel = label;
	toggle.querySelector(`use`).setAttribute(`href`, `#svg-${code}`);
}

// toggle audio play/pause
function togglePlay() {
	if (page.get(`audio`).paused) {
		page.get(`audio`).play();
		setAudioToggle(page.get(`playToggle`), `Pause show`, `pause`);
	} else {
		updateSeekBar(); // otherwise if the audio's paused after less than a second of play, seek bar doesn't update for each second
		page.get(`audio`).pause();
		setAudioToggle(page.get(`playToggle`), `Play show`, `play`);
	}
}

// toggle audio mute/unmute
function toggleMute() {
	if (page.get(`audio`).muted) {
		page.get(`audio`).muted = false;
		setAudioToggle(page.get(`muteToggle`), `Mute audio`, `mute`);
		page.get(`volumeControl`).value = page.get(`audio`).volume * 100;
	} else {
		page.get(`audio`).muted = true;
		setAudioToggle(page.get(`muteToggle`), `Unmute audio`, `unmute`);
		page.get(`volumeControl`).value = 0;
	}
}

// set audio volume
function setVolume(newVolume) {
	page.get(`audio`).volume = newVolume;
	if (page.get(`audio`).muted) toggleMute();
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
	const templatedShow = templateHTML.clone(`archiveShow`);
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
	const templatedSeries = templateHTML.clone(`archiveSeries`);
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
	templateHTML.get(`archiveShow`).querySelector(`.content-notes`).open = settings.get(`notesOpen`);

	page.get(`seriesLinks`).replaceChildren(...archive.map(buildSeriesLink));
	page.get(`seriesList`).replaceChildren(...archive.map(buildSeries));
	page.get(`seriesList`).addEventListener(`click`, () => {
		if (!event.target.hasAttribute(`aria-disabled`)) {
			switch (event.target.dataset.action) {
			case `add-series`: addSeries(event.target.closest(`#series-list > li`)); break;
			case `add-show`: addShow(event.target.dataset.target); break;
			}
		}
	});

	// build out stats list
	for (const [name, value] of Object.entries({
		"series": archive.length,
		"shows": archive.reduce((a, series) => a + series.shows.length, 0),
	})) document.getElementById(`stats-${name}`).textContent = value;

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
page.get(`audio`).addEventListener(`ended`, loadNextShow);

// radio interface events
page.get(`seekBar`).addEventListener(`change`, () => {
	page.get(`seekBar`).dataset.seeking = `false`;
	page.get(`audio`).currentTime = page.get(`audio`).duration * page.get(`seekBar`).value / 100;
});
page.get(`seekBar`).addEventListener(`input`, () => {
	page.get(`seekBar`).dataset.seeking = `true`;
	updateSeekTime(page.get(`seekBar`).value); // must set input.value as argument here
});
page.get(`playToggle`).addEventListener(`click`, togglePlay);
page.get(`skipButton`).addEventListener(`click`, loadNextShow);
page.get(`muteToggle`).addEventListener(`click`, toggleMute);
page.get(`volumeControl`).addEventListener(`input`, () => setVolume(page.get(`volumeControl`).value / 100));

// booth interface events
document.getElementById(`random-show-button`).addEventListener(`click`, () => addRandomShow(`all`));
document.getElementById(`random-banger-button`).addEventListener(`click`, () => addRandomShow(`banger`));
document.getElementById(`shuffle-button`).addEventListener(`click`, shufflePlaylist);
page.get(`clearButton`).addEventListener(`click`, () => {
	if (!page.get(`clearButton`).hasAttribute(`aria-disabled`)) revealClearPlaylistControls();
});

document.getElementById(`clear-cancel-button`).addEventListener(`click`, hideClearPlaylistControls);
document.getElementById(`clear-confirm-button`).addEventListener(`click`, clearPlaylist);
page.get(`playlist`).addEventListener(`click`, () => {
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
page.get(`themeButtons`).addEventListener(`click`, () => {
	if (event.target.tagName === `BUTTON` && !event.target.closest(`button`).hasAttribute(`aria-disabled`)) styles.set(`theme`, event.target.dataset.option);
});
page.get(`fontButtons`).addEventListener(`click`, () => {
	if (event.target.tagName === `BUTTON` && !event.target.hasAttribute(`aria-disabled`)) styles.set(`font`, event.target.dataset.option);
});

// on pageload, execute various tasks
document.addEventListener(`DOMContentLoaded`, () => {
	// initialise settings and styles
	settings.initialise();
	styles.initialise();

	// initialise radio
	page.get(`audio`).paused = true;
	page.get(`seekBar`).value = 0;
	setVolume(page.get(`volumeControl`).value / 100);
	setInterval(updateSeekBar, 1000);

	// build various page sections
	buildArchive();
	loadPlaylist();
	buildFeaturedShow();
	const playlistObserver = new MutationObserver(() => {
		if (!makingLargePlaylistChanges) store(`playlist`, getShowIDs(page.get(`playlist`).children));
	});
	playlistObserver.observe(page.get(`playlist`), {"childList": true});

	// update page head data
	page.get(`title`).dataset.original = document.title;
	if (location.hash) navigateToSection();
});

// on closing window/browser tab, preserve audio level
window.addEventListener(`beforeunload`, () => {
	// if someone refreshes the page while audio is muted, the volume slider returns to the unmuted volume before page unloads, so it can load in at the same level when the page reloads
	if (page.get(`audio`).muted) page.get(`volumeControl`).value = page.get(`audio`).volume * 100;
});

// update settings, styles, and playlist if styles change in another browsing context
window.addEventListener(`storage`, () => {
	const newValue = JSON.parse(event.newValue);
	switch (event.key) {
	case `settings`:
		if (settings.get(`copyrightSafety`) !== newValue.copyrightSafety) settings.toggle(`copyrightSafety`);
		if (settings.get(`flatRadio`) !== newValue.flatRadio) settings.toggle(`flatRadio`);
		if (settings.get(`autoPlayNextShow`) !== newValue.autoPlayNextShow) settings.toggle(`autoPlayNextShow`);
		if (settings.get(`notesOpen`) !== newValue.notesOpen) settings.toggle(`notesOpen`);
		console.info(`automatically matched settings change in another browsing context`);
		break;
	case `styles`:
		if (styles.get(`theme`) !== newValue.theme) styles.set(`theme`, newValue.theme);
		if (styles.get(`font`) !== newValue.font) styles.set(`font`, newValue.font);
		console.info(`automatically matched style change in another browsing context`);
		break;
	case `playlist`:
		// could do this with a broadcast channel instead of mutation observer + storage event
		// however, that adds an extra tech and it'd be less robust than rebuilding the playlist from scratch
		loadPlaylist();
		page.get(`seriesList`).querySelectorAll(`[data-action="add-show"]`).forEach(button => {
			if (event.newValue.includes(button.dataset.target)) button.press();
			else button.unpress();
		})
		console.info(`automatically matched playlist change in another browsing context`);
		break;
	}
});
