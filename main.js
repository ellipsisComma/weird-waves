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

// schedule file path builder (date is a Date object)
function schedulePath(date) {
	return `./schedules/schedule-${date.toISOString().slice(0, 10)}.json`;
}

// settings module: handles stored state of each boolean setting and its on-page toggle-switch
const settings = (() => {
	const local = retrieve(`settings`, {});
	local.copyrightSafety ??= false; // if true, exclude certain series from being added to the playlist during addArchive() or addRandomShow()
	local.flatRadio ??= false; // if true, hide all show info except show-heading in radio
	local.autoPlayNextShow ??= true; // if true, start playing next show when previous show runs to completion
	local.notesOpen ??= false; // if true, open all content notes

	function initialise() {
		Object.keys(local).forEach(setting => {
			const toggle = document.getElementById(`${setting.camelToKebab()}-toggle`);
			toggle?.setAttribute(`aria-pressed`, local[setting].toString());
			toggle?.closest(`.pre-initialised-control`).classList.remove(`pre-initialised-control`);
		});
		page.getEl(`loadedShow`).classList.toggle(`flat-radio`, settings.getSetting(`flatRadio`));
	}

	function toggleSetting(setting) {
		local[setting] = !local[setting];
		document.getElementById(`${setting.camelToKebab()}-toggle`)?.flip();
		store(`settings`, local);

		if (setting === `flatRadio`) page.getEl(`loadedShow`).classList.toggle(`flat-radio`, local.flatRadio);
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
		Object.keys(local).forEach(style => {
			setStyleButtons(style);
			page.getEl(`${style}Buttons`)?.classList.remove(`pre-initialised-control`);
		});
		updateFavicon();
	}

	function setStyleButtons(style) {
		const buttons = page.getEl(`${style}Buttons`);
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
		page.getEl(`SVGFavicon`).href = `data:image/svg+xml,${encodeURIComponent(faviconNew)}`;
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
		"setEl": (key, query) => elements[key] ??= document.querySelector(query),
		"getEl": (key) => elements[key],
	};
})();

// head
page.setEl(`title`, `title`);
page.setEl(`SVGFavicon`, `[rel="icon"][type="image/svg+xml"]`);

// radio
page.setEl(`loadedShow`, `#loaded-show`);
page.setEl(`radioControls`, `#radio-controls`);
page.setEl(`resetButton`, `#reset-button`);
page.setEl(`playToggle`, `#play-toggle`);
page.setEl(`skipButton`, `#skip-button`);
page.setEl(`seekBar`, `#seek-bar`);
page.setEl(`showTimeElapsed`, `#show-time-elapsed`);
page.setEl(`showTimeTotal`, `#show-time-total`);
page.setEl(`muteToggle`, `#mute-toggle`);
page.setEl(`volumeControl`, `#volume-control`);
page.setEl(`audio`, `#show-audio`);

// booth
page.setEl(`playlist`, `#playlist`);
page.setEl(`playlistControls`, `#playlist-controls`);
page.setEl(`clearButton`, `#clear-button`);
page.setEl(`clearPlaylistControls`, `#clear-playlist-controls`);
page.setEl(`importExport`, `#import-export-data`);
page.setEl(`importErrorMessage`, `#import-error-message`);
page.setEl(`importErrorList`, `#import-error-list`);

// archive
page.setEl(`seriesLinks`, `#archive-series-links`);
page.setEl(`seriesList`, `#series-list`);

// settings
page.setEl(`themeButtons`, `#theme-buttons`);
page.setEl(`fontButtons`, `#font-buttons`);

// schedule
page.setEl(`schedule`, `#schedule-container`);
page.setEl(`scheduleDate`, `#schedule-date`);

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

// mutation observer to store playlist changes and prefetch second show on playlist (if it has at least 2 shows)
const playlistObserver = new MutationObserver(() => {
	loadShow();
	storePlaylist();
	if (location.protocol !== `file:` && page.getEl(`playlist`).children.length > 1) fetch(
		showPath(page.getEl(`playlist`).children[1].dataset.showId),
		{"cache": `no-cache`}
	);
});



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
	const pool = page.getEl(`seriesList`).querySelectorAll(`${settings.getSetting(`copyrightSafety`) ? `[data-copyright-safe="true"] >` : ``} .show-list > li${type === `banger` ? `[data-banger="true"]` : ``}:not(:has([data-action="add-show"][aria-pressed="true"]))`);
	return pool.length > 0 ? pool[Math.floor(Math.random() * pool.length)].dataset.showId : ``;
}

// get show element in archive
function getShowInArchive(ID) {
	return page.getEl(`seriesList`).querySelector(`.show-list > [data-show-id="${ID}"]`);
}

// get show element on playlist
function getShowOnPlaylist(ID) {
	return page.getEl(`playlist`).querySelector(`:scope > [data-show-id="${ID}"]`);
}

// get array of all show IDs, from a set of HTML show elements
function getShowIDs(subset) {
	return [...subset].map(show => show.dataset.showId);
}

// store playlist as list of show IDs
function storePlaylist() {
	store(`playlist`, getShowIDs(page.getEl(`playlist`).children));
}

// get date of the current week's Monday
function getWeekStartDate() {
	const date = new Date();
	date.setDate(date.getDate() - ((date.getDay() + 6) % 7));
	return date;
}



/* -----
PLAYLIST
----- */

// shuffle playlist if it has at least 2 entries
function shufflePlaylist() {
	let i = page.getEl(`playlist`).children.length;
	if (i < 2) return;

	while (i > 0) page.getEl(`playlist`).append(page.getEl(`playlist`).children[Math.floor(Math.random() * i--)]);
}

// reveal controls for clearing playlist
function revealClearPlaylistControls() {
	page.getEl(`clearButton`).press();
	page.getEl(`clearPlaylistControls`).hidden = false;
	page.getEl(`clearPlaylistControls`).focus();
}

// hide controls for clearing playlist
function hideClearPlaylistControls() {
	page.getEl(`clearButton`).unpress();
	page.getEl(`clearPlaylistControls`).hidden = true;
}

// clear playlist and hide clear controls again
function clearPlaylist() {
	if (page.getEl(`playlist`).children.length > 0) {
		page.getEl(`playlist`).replaceChildren();
		page.getEl(`seriesList`).querySelectorAll(`[data-action="add-show"][aria-pressed="true"]`)
			.forEach(button => button.unpress());
	}
	if (!page.getEl(`clearPlaylistControls`).hidden) hideClearPlaylistControls();
}

// 
function setValidImport() {
	page.getEl(`importErrorMessage`).hidden = true;
	page.getEl(`importExport`).ariaInvalid = false;
}

// list playlist of show IDs line-by-line in import-export box
function exportPlaylist() {
	setValidImport();
	page.getEl(`importExport`).value = getShowIDs(page.getEl(`playlist`).children).join(`\n`);
}

// import playlist from textbox
function importPlaylist() {
	const importList = page.getEl(`importExport`).value.trim();
	if (importList.length === 0) return;

	const validIDRegex = /^[A-Z][A-Za-z]{1,2}-\w+-\w+$/m;
	const errorMarker = ` -- import error!`;
	const importIDs = [...new Set(importList.replaceAll(errorMarker, ``).replace(/[^\S\n\r]/g, ``).split(/\n+/))];
	const invalidIDs = importIDs.filter((ID, i) => {
		const valid = validIDRegex.test(ID) && getShowInArchive(ID);
		if (!valid) importIDs[i] += errorMarker;
		return !valid;
	});

	if (invalidIDs.length === 0) {
		setValidImport();
		clearPlaylist();
		page.getEl(`importExport`).value = ``;
		importIDs.forEach(addShow);
	} else {
		page.getEl(`importErrorList`).replaceChildren(...invalidIDs.map(ID => {
			const IDitem = document.createElement(`li`);
			IDitem.textContent = ID;
			return IDitem;
		}));
		page.getEl(`importExport`).value = importIDs.join(`\n`);
		page.getEl(`importExport`).ariaInvalid = true;
		page.getEl(`importErrorMessage`).hidden = false;
		page.getEl(`importErrorMessage`).scrollIntoView();
	}
}

// load playlist from local storage
function loadPlaylist() {
	page.getEl(`playlist`).replaceChildren();
	retrieve(`playlist`, []).filter(getShowInArchive).forEach(addShow);
}

/* --
SHOWS
-- */

/* ADDING */

// add show to playlist; if playlist was previously empty, load top show
function addShow(ID) {
	const showOnPlaylist = getShowOnPlaylist(ID);
	if (showOnPlaylist) {
		page.getEl(`playlist`).append(showOnPlaylist);
		console.log(`re-added show: ${ID}`);
		return;
	}

	// error out if show not in Archive
	const showInArchive = getShowInArchive(ID);
	if (!showInArchive) {
		console.error(`show "${ID}" does not exist in Archive`);
		return;
	}

	// build new playlist item
	const seriesInArchive = showInArchive.closest(`#series-list > li`);
	const templatedShow = templateHTML.cloneTemplate(`playlistItem`);
	const newShow = templatedShow.querySelector(`li`);
	newShow.dataset.showId = ID;
	newShow.appendChild(showInArchive.querySelector(`.show-info`).cloneNode(true));

	// expand show info with series title and license
	const newShowHeading = newShow.querySelector(`.show-heading`);
	newShowHeading.replaceChildren(
		...seriesInArchive.querySelector(`.series-heading`).cloneChildren(),
		document.createTextNode(` `),
		...newShowHeading.cloneChildren()
	);
	newShow.querySelector(`.show-content`).appendChild(seriesInArchive.querySelector(`.series-source`).cloneNode(true));

	// update page and stored data
	showInArchive.querySelector(`[data-action="add-show"]`).press();
	page.getEl(`playlist`).appendChild(templatedShow);
}

// add entire archive to playlist
function addArchive() {
	getShowIDs(page.getEl(`seriesList`).querySelectorAll(`${settings.getSetting(`copyrightSafety`) ? `[data-copyright-safe="true"] >` : ``} .show-list > li`)).forEach(addShow);
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
		window.scrollTo(0, page.getEl(`playlist`).lastElementChild.offsetTop - page.getEl(`playlistControls`).clientHeight);
	} else console.warn(`can't add new show of type "${showType}": all shows of that type already on playlist`);
}

/* MANIPULATING */

// swap show with previous show on playlist
function moveShowUp(target) {
	target.previousElementSibling?.before(target);
}

// swap show with next show on playlist
function moveShowDown(target) {
	target.nextElementSibling?.after(target);
}

// remove show from playlist
function removeShow(target) {
	getShowInArchive(target.dataset.showId).querySelector(`[data-action="add-show"]`).unpress();
	target.remove();
}

// write show parts onto page and load show audio file; if playlist is empty, reset radio
function loadShow() {
	if (page.getEl(`playlist`).children.length > 0 && page.getEl(`playlist`).firstElementChild.dataset.showId === page.getEl(`loadedShow`).dataset.showId) return;

	setAudioToggle(page.getEl(`playToggle`), `play`);
	page.getEl(`loadedShow`).replaceChildren();

	if (page.getEl(`playlist`).children.length > 0) {
		const show = page.getEl(`playlist`).firstElementChild;
		page.getEl(`loadedShow`).dataset.showId = show.dataset.showId;

		// load audio file and show data
		page.getEl(`audio`).src = showPath(show.dataset.showId);
		page.getEl(`loadedShow`).replaceChildren(...show.querySelector(`.show-info`).cloneChildren());

		// reset and reveal radio controls
		if (page.getEl(`audio`).dataset.playNextShow === `true`) {
			page.getEl(`audio`).play();
			page.getEl(`audio`).dataset.playNextShow = `false`;
		}
		page.getEl(`seekBar`).value = 0;
		page.getEl(`showTimeElapsed`).textContent = `00:00`;
		page.getEl(`radioControls`).hidden = false;
	} else {
		// empty loaded show and playlist
		page.getEl(`playlist`).replaceChildren();

		// reset radio
		page.getEl(`audio`).pause(); // otherwise audio continues playing
		page.getEl(`audio`).removeAttribute(`src`); // check why this is necessary instead of just emptying [src]
		page.getEl(`showTimeElapsed`).textContent = `00:00`;
		page.getEl(`showTimeTotal`).textContent = `00:00`;
		page.getEl(`radioControls`).hidden = true;
		page.getEl(`loadedShow`).dataset.showId = ``;
	}
}

// replace loaded show with next show on playlist (or reset radio if playlist ends)
function loadNextShow() {
	removeShow(page.getEl(`playlist`).firstElementChild);
}

/* --
RADIO
-- */

// change seek bar to match audio unless currently manually seeking or audio metadata unavailable
function updateSeekBar() {
	if (
		page.getEl(`seekBar`).dataset.seeking === `true`
		|| !page.getEl(`audio`).duration
	) return;
	page.getEl(`seekBar`).value = page.getEl(`audio`).currentTime / page.getEl(`audio`).duration * 100;
	setTimestampFromSeconds(page.getEl(`showTimeElapsed`), page.getEl(`audio`).currentTime);
}

// update displayed show time while manually seeking using seek bar
function updateSeekTime(value) {
	setTimestampFromSeconds(page.getEl(`showTimeElapsed`), page.getEl(`audio`).duration * value / 100);
}

// set audio toggle icon and aria-label
function setAudioToggle(toggle, code) {
	toggle.querySelector(`use`).setAttribute(`href`, `#svg-${code}`);
}

// toggle audio play/pause
function togglePlay() {
	if (page.getEl(`audio`).paused) page.getEl(`audio`).play();
	else page.getEl(`audio`).pause();
}

// toggle audio mute/unmute
function toggleMute() {
	page.getEl(`muteToggle`).flip();
	page.getEl(`audio`).muted = !page.getEl(`audio`).muted;
}

// set audio volume
function setVolume(newVolume) {
	page.getEl(`audio`).volume = newVolume;
	if (page.getEl(`audio`).muted) toggleMute();
}

/* --------------
PAGE CONSTRUCTION
-------------- */

// build an archive nav-link
function buildSeriesLink(series) {
	const newSeriesLinkItem = document.createElement(`li`);
	const newSeriesLink = newSeriesLinkItem.appendChild(document.createElement(`a`));
	newSeriesLink.href = `#archive-${series.code}`;
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

	return templatedShow;
}

// build HTML for archive series item and its list of shows
function buildSeries(series) {
	const templatedSeries = templateHTML.cloneTemplate(`archiveSeries`);
	const newSeries = templatedSeries.querySelector(`li`);
	newSeries.setAttributes({
		"id": `archive-${series.code}`,
		"data-copyright-safe": series.copyrightSafe ? `true` : `false`,
	});

	if (series.copyrightSafe) newSeries.dataset.copyrightSafe = `true`;
	newSeries.querySelector(`.series-heading`).setContent(series.heading);
	newSeries.querySelector(`.series-blurb`).setContent(series.blurb);
	newSeries.querySelector(`.series-source`).setContent(`source: ${series.source}`);

	series.shows.forEach(show => show.ID = `${series.code}-${show.code}`);
	newSeries.querySelector(`.show-list`).replaceChildren(...series.shows.map(buildShow));

	return templatedSeries;
}

// build archive onto page
function buildArchive() {
	templateHTML.getTemplate(`archiveShow`).querySelector(`.content-notes`).open = settings.getSetting(`notesOpen`);

	page.getEl(`seriesLinks`).replaceChildren(...archive.map(buildSeriesLink));
	page.getEl(`seriesList`).replaceChildren(...archive.map(buildSeries));
	page.getEl(`seriesList`).addEventListener(`click`, () => {
		if (
			event.target.tagName === `BUTTON`
			&& event.target.dataset.action === `add-show`
			&& event.target.getAttribute(`aria-disabled`) === `false`
		) addShow(event.target.closest(`.show-list > li`).dataset.showId);
	});
	page.getEl(`seriesList`).addEventListener(`click`, () => {
		if (
			event.target.tagName === `BUTTON`
			&& event.target.dataset.action === `add-series`
		) addSeries(event.target.closest(`#series-list > li`));
	});

	// build out stats list
	Object.entries({
		"series": archive.length,
		"shows": archive.reduce((a, series) => a + series.shows.length, 0),
	}).forEach(([name, value]) => document.getElementById(`stats-${name}`).textContent = value);

	// clear archive object
	archive = null;
}

// fetch weekly schedule and, if available and valid, load schedule onto page
async function loadSchedule() {
	const weekStart = getWeekStartDate();
	const file = await fetch(
		schedulePath(weekStart),
		{"cache": `no-cache`}
	);
	if (!file.ok) {
		console.error(`failed to fetch schedule file: ${file.status}`);
		return;
	}
	const schedule = await file.json();

	page.getEl(`scheduleDate`).textContent = weekStart.toLocaleDateString();
	page.getEl(`scheduleDate`).dateTime = weekStart.toISOString().slice(0, 10);
	document.getElementById(`schedule-title`).setContent(schedule.title);
	document.getElementById(`schedule-blurb`).setContent(schedule.blurb);
	document.getElementById(`add-schedule-button`).addEventListener(`click`, () => {
		schedule.shows.forEach(addShow);
		page.getEl(`schedule`).remove();
	});
	page.getEl(`schedule`).hidden = false;
}



/* ===========
	EVENTS
=========== */

// radio audio events
page.getEl(`audio`).addEventListener(`loadstart`, () => page.getEl(`playToggle`).disabled = true);
page.getEl(`audio`).addEventListener(`loadedmetadata`, () => {
	page.getEl(`playToggle`).disabled = false;
	setTimestampFromSeconds(page.getEl(`showTimeTotal`), page.getEl(`audio`).duration);
});
page.getEl(`audio`).addEventListener(`timeupdate`, updateSeekBar);
page.getEl(`audio`).addEventListener(`play`, () => {
	page.getEl(`playToggle`).flip();
	setAudioToggle(page.getEl(`playToggle`), `pause`);
});
page.getEl(`audio`).addEventListener(`pause`, () => {
	page.getEl(`playToggle`).flip();
	setAudioToggle(page.getEl(`playToggle`), `play`);
});
page.getEl(`audio`).addEventListener(`ended`, () => {
	// autoplay next show if autoplay setting is on
	if (settings.getSetting(`autoPlayNextShow`)) page.getEl(`audio`).dataset.playNextShow = `true`;
	loadNextShow();
});
page.getEl(`audio`).addEventListener(`volumechange`, () => {
	if (page.getEl(`audio`).muted || page.getEl(`audio`).volume === 0) {
		setAudioToggle(page.getEl(`muteToggle`), `muted`);
		page.getEl(`volumeControl`).value = 0;
	} else {
		setAudioToggle(page.getEl(`muteToggle`), `unmuted`);
		page.getEl(`volumeControl`).value = page.getEl(`audio`).volume * 100;
	}
});

// radio interface events
page.getEl(`resetButton`).addEventListener(`click`, () => {
	page.getEl(`audio`).currentTime = 0;
});
page.getEl(`playToggle`).addEventListener(`click`, togglePlay);
page.getEl(`skipButton`).addEventListener(`click`, () => {
	// autoplay next show if current show is playing
	if (!page.getEl(`audio`).paused) page.getEl(`audio`).dataset.playNextShow = `true`;
	loadNextShow();
});
page.getEl(`seekBar`).addEventListener(`change`, () => {
	page.getEl(`seekBar`).dataset.seeking = `false`;
	page.getEl(`audio`).currentTime = page.getEl(`audio`).duration * page.getEl(`seekBar`).value / 100;
});
page.getEl(`seekBar`).addEventListener(`input`, () => {
	page.getEl(`seekBar`).dataset.seeking = `true`;
	updateSeekTime(page.getEl(`seekBar`).value); // must set input.value as argument here
});
page.getEl(`muteToggle`).addEventListener(`click`, toggleMute);
page.getEl(`volumeControl`).addEventListener(`input`, () => setVolume(page.getEl(`volumeControl`).value / 100));

// booth interface events
document.getElementById(`random-show-button`).addEventListener(`click`, () => addRandomShow(`all`));
document.getElementById(`random-banger-button`).addEventListener(`click`, () => addRandomShow(`banger`));
document.getElementById(`shuffle-button`).addEventListener(`click`, shufflePlaylist);
page.getEl(`clearButton`).addEventListener(`click`, () => {
	if (page.getEl(`clearButton`).getAttribute(`aria-disabled`) === `false`) revealClearPlaylistControls();
});

document.getElementById(`clear-cancel-button`).addEventListener(`click`, hideClearPlaylistControls);
document.getElementById(`clear-confirm-button`).addEventListener(`click`, clearPlaylist);
[`playlist-controls`, `data-controls`].forEach(id => {
	document.getElementById(id).addEventListener(`click`, () => {
		if (event.target.tagName === `BUTTON` && event.target.getAttribute(`aria-disabled`) === `false`) hideClearPlaylistControls();
	});
});
page.getEl(`playlist`).addEventListener(`click`, () => {
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
	page.getEl(`${style}Buttons`).addEventListener(`click`, () => {
		if (event.target.tagName === `BUTTON` && event.target.getAttribute(`aria-disabled`) === `false`) styles.setStyle(style, event.target.dataset.option);
	});
});

// on pageload, execute various tasks
document.addEventListener(`DOMContentLoaded`, () => {
	// initialise settings and styles
	settings.initialise();
	styles.initialise();

	// initialise radio
	page.getEl(`audio`).paused = true;
	page.getEl(`seekBar`).value = 0;
	setVolume(page.getEl(`volumeControl`).value / 100);

	// start watching for playlist changes
	playlistObserver.observe(page.getEl(`playlist`), {"childList": true});

	// build various page sections
	buildArchive();
	loadPlaylist();
	loadSchedule();

	// update page head data
	page.getEl(`title`).dataset.original = document.title;
	if (location.hash) navigateToSection();
});

// on closing window/browser tab, preserve audio level
window.addEventListener(`beforeunload`, () => {
	// if someone refreshes the page while audio is muted, the volume slider returns to the unmuted volume before page unloads, so it can load in at the same level when the page reloads
	if (page.getEl(`audio`).muted) page.getEl(`volumeControl`).value = page.getEl(`audio`).volume * 100;
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
		loadPlaylist();
		page.getEl(`seriesList`).querySelectorAll(`[data-action="add-show"]`).forEach(button => {
			if (event.newValue.includes(button.dataset.target)) button.press();
			else button.unpress();
		})
		console.info(`automatically matched playlist change in another browsing context`);
		break;
	}
});
