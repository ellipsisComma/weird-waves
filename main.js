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
const showFilePath = `./audio/shows/`;
const showFileExtension = `.mp3`;
const faviconRaw = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 26 26" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round" vector-effect="non-scaling-stroke">
	<rect x="-1" y="-1" width="28" height="28" fill="--back-colour" />
	<path stroke="--hot-colour" d="M7 11a3 3 0 0 1 3 3a3 3 0 0 1 6 0a3 3 0 0 1 3-3" />
	<path stroke="--cold-colour" d="M7 8a6 6 0 0 1 12 0v4a6 6 0 0 1-12 0zm12 3h3v1a9 9 0 0 1-18 0v-1h3m6 10v3m-4 0h8" />
</svg>`;

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
	"favicon": `[rel="icon"][type="image/svg+xml"]`,

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

	// archive
	"seriesLinks": `#archive-series-links`,
	"seriesList": `#series-list`,

	// settings
	"themeButtons": `#theme-buttons`,
	"fontButtons": `#font-buttons`,

	// welcome
	"featuredShow": `#featured-show`,
};

// build out page refs
for (const [ref, query] of Object.entries(page)) page[ref] = document.querySelector(query);



/* ==============
	FUNCTIONS
============== */

/* ----
UTILITY
---- */

/* GENERAL */

// add an object of attributes to an Element
Element.prototype.setAttributes = function (attrs) {
	for (const [attr, value] of Object.entries(attrs)) this.setAttribute(attr, value);
};

// remove an array of attributes from an Element
Element.prototype.removeAttributes = function (attrs) {
	for (const attr of attrs) this.removeAttribute(attr);
};

// sum a numerical array
Array.prototype.sum = function () {
	return this.reduce((a, b) => a + b, 0);
};

// sum a numerical array that's an object property value
Array.prototype.sumByKey = function (key) {
	return this.reduce((a, b) => a + b[key], 0);
}

/* APP */

// convert time in seconds to minutes:seconds timestamp
function setTimestampFromSeconds(element, time) {
	const minutes = Math.floor((parseInt(time) % 3600) / 60).toString().padStart(2, `0`);
	const seconds = (parseInt(time) % 60).toString().padStart(2, `0`);

	element.textContent = `${minutes}:${seconds}`;
}

// get show ID from a pool, adjusted for copyright safety
function getRandomShowID(type = ``) {
	const pool = page.seriesList.querySelectorAll(`${settings.copyrightSafety ? `[data-copyright-safe="true"] >` : ``} .show-list > li${type === `banger` ? `[data-banger="true"]` : ``}:not(:has([data-action="add-show"][aria-pressed="true"]))`);
	return pool.length > 0 ? pool[Math.floor(Math.random() * pool.length)].id : ``;
}

// get show element in archive
function getShowInArchive(id) {
	return page.seriesList.querySelector(`.show-list > [id="${id.replace(`"`, `'`)}"]`);
}

// get show element on playlist
function getShowOnPlaylist(id) {
	return page.playlist.querySelector(`:scope > [data-id="${id.replace(`"`, `'`)}"]`);
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
	pressButton(page.clearButton);
	page.clearPlaylistControls.hidden = false;
	page.clearPlaylistControls.focus();
}

// hide controls for clearing playlist
function hideClearPlaylistControls() {
	unpressButton(page.clearButton);
	page.clearPlaylistControls.hidden = true;
}

// clear playlist and hide clear controls again
function clearPlaylist() {
	if (page.playlist.children.length > 0) {
		page.playlist.replaceChildren();
		for (const button of page.seriesList.querySelectorAll(`[data-action="add-show"][aria-pressed="true"]`)) unpressButton(button);
	}
	if (!page.clearPlaylistControls.hidden) hideClearPlaylistControls();
	loadShow();
}

// list playlist of show IDs line-by-line in import-export box
function exportPlaylist() {
	const exportIDs = [];
	page.importErrorMessage.hidden = true;
	for (const show of page.playlist.children) exportIDs.push(show.dataset.id);
	page.importExport.value = exportIDs.join(`\n`);
}

function revealImportErrors(message) {
	page.importErrorMessage.innerHTML = message;
	page.importErrorMessage.hidden = false;
	page.importErrorMessage.scrollIntoView();
}

// import playlist from textbox
function importPlaylist() {
	page.importErrorMessage.hidden = true;

	// if attempting to import IDs, validate them and either present invalid IDs or update playlist; if import box is empty, clear playlist
	const importIDs = page.importExport.value.trim().length > 0
		? [...new Set(page.importExport.value.trim().replace(/\n\n+/g, `\n`).replace(/[ \t]/g, ``).split(`\n`))]
		: [];
	const invalidIDs = importIDs.filter(id => !getShowInArchive(id));

	page.importExport.value = ``;

	if (invalidIDs.length === 0) {
		if (importIDs.length > 0) {
			clearPlaylist();
			for (const id of importIDs) addShow(id);
		} else revealImportErrors(`<p>Invalid import: no show IDs.</p>`);
	} else {
		revealImportErrors(`
		<p>Invalid import: Invalid show ID${invalidIDs.length > 1 ? `s` : ``}:</p>
		<ul>
			${invalidIDs.map(id => `<li>${id}</li>`).join(``)}
		</ul>
		`);
		page.importExport.value = importIDs.join(`\n`);
	}
}

/* --
SHOWS
-- */

/* ADDING */

// add show to playlist; if playlist was previously empty, load top show
function addShow(id) {
	const showInArchive = getShowInArchive(id);
	if (!showInArchive) {
		console.error(`attempted to add show with non-existent id: ${id}`);
		return;
	}

	const showOnPlaylist = getShowOnPlaylist(id);
	if (showOnPlaylist) {
		page.playlist.append(showOnPlaylist);
		loadShow();
		console.log(`re-added show: ${id}`);
		return;
	}

	// build new playlist item
	const seriesInArchive = showInArchive.closest(`#series-list > li`);
	const newShow = page.playlist.appendChild(document.createElement(`li`));
	const playlistShowControls = [
		{	"code": `move-up`,		"label": `Move show up`		},
		{	"code": `remove`,		"label": `Remove show`		},
		{	"code": `move-down`,	"label": `Move show down`	},
	];

	newShow.outerHTML = `
	<li data-id="${id}" data-duration="${showInArchive.dataset.duration}">
		<ul class="show-position-controls icon-button-set">
			${playlistShowControls.map(button => `
			<li>
				<button class="push-button" type="button" data-action="${button.code}" data-target="${id}" aria-label="${button.label}">
					<svg class="svg-icon" viewBox="0 0 12 12"><use href="#svg-${button.code}" /></svg>
				</button>
			</li>
			`).join(``)}
		</ul>
		<div class="show-info">
			<h4 class="show-heading">${seriesInArchive.querySelector(`.series-heading`).innerHTML} ${showInArchive.querySelector(`.show-heading`).innerHTML}</h4>
			<div class="show-content">
				${showInArchive.querySelector(`.show-content`).innerHTML}
				${seriesInArchive.querySelector(`.series-source`).outerHTML}
			</div>
		</div>
	</li>
	`;

	// update page
	pressButton(showInArchive.querySelector(`[data-action="add-show"]`));
	console.log(`added show: ${id}`);
	loadShow();
}

// add entire archive to playlist
function addArchive() {
	for (const show of page.seriesList.querySelectorAll(`${settings.copyrightSafety ? `[data-copyright-safe="true"] >` : ``} .show-list > li`)) addShow(show.id);
}

// add entire series to playlist
function addSeries(seriesCode) {
	for (const show of page.seriesList.querySelectorAll(`#archive-${seriesCode} > .show-list > li`)) addShow(show.id);
}

// add a random show or banger to the playlist; if adding a show to an empty playlist, load it into radio
function addRandomShow(showType) {
	const id = getRandomShowID(showType);
	if (getShowInArchive(id)) addShow(id);
	window.scrollTo(0, page.playlist.lastElementChild.offsetTop - page.playlistControls.clientHeight);
}

/* MANIPULATING */

// move show up/down in playlist
function moveShow(id, move) {
	const target = getShowOnPlaylist(id);

	if (move > 0) target?.nextElementSibling?.after(target);
	else if (move < 0) target?.previousElementSibling?.before(target);

	loadShow();
}

// remove show from playlist
function removeShow(id) {
	getShowOnPlaylist(id)?.remove();
	unpressButton(getShowInArchive(id)?.querySelector(`[data-action="add-show"]`));
	console.log(`removed show: ${id}`);
	loadShow();
}

// write show parts onto page and load show audio file; if playlist is empty, reset radio
function loadShow() {
	if (page.playlist.children.length > 0 && page.playlist.firstElementChild.dataset.id === page.loadedShow.dataset.id) return;

	if (!page.audio.paused) togglePlay();

	if (page.playlist.children.length > 0) {
		const show = page.playlist.firstElementChild;
		page.loadedShow.dataset.id = show.dataset.id;

		// load audio file and show data
		page.audio.src = `${showFilePath}${show.dataset.id}${showFileExtension}`;
		page.audio.dataset.duration = show.dataset.duration;
		page.loadedShow.innerHTML = show.querySelector(`.show-info`).innerHTML;

		// reset and reveal radio controls
		updateSeekTime(0);
		page.seekBar.value = 0;
		setTimestampFromSeconds(page.showTimeTotal, page.audio.dataset.duration);
		page.radioControls.hidden = false;

		console.log(`loaded show: ${show.dataset.id}`);
	} else {
		// empty loaded show and playlist
		page.loadedShow.innerHTML = ``;
		page.playlist.innerHTML = ``;

		// reset radio
		page.audio.removeAttributes([`src`, `data-duration`]);
		for (const time of [`Elapsed`, `Total`]) setTimestampFromSeconds(page[`showTime${time}`], "0");
		page.radioControls.hidden = true;
		page.loadedShow.setAttribute(`data-id`, ``);

		console.info(`reached end of playlist`);
	}
}

// replace loaded show with next show on playlist (or reset radio if playlist ends)
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
	if (!page.audio.paused && page.seekBar.dataset.seeking !== `true`) {
		page.seekBar.value = page.audio.currentTime / page.audio.dataset.duration * 100;
		setTimestampFromSeconds(page.showTimeElapsed, page.audio.currentTime);
	}
}

// update displayed show time using seek bar
function updateSeekTime(value) {
	setTimestampFromSeconds(page.showTimeElapsed, page.audio.dataset.duration * value / 100);
}

// toggle audio play/pause
function togglePlay() {
	if (page.audio.paused) {
		page.audio.play();
		page.playToggle.ariaLabel = `Pause audio`;
		page.playToggle.querySelector("use").setAttribute(`href`, `#svg-pause`);
	} else {
		updateSeekBar(); // otherwise if the audio's paused after less than a second of play, seek bar doesn't update for each second
		page.audio.pause();
		page.playToggle.ariaLabel = `Play audio`;
		page.playToggle.querySelector("use").setAttribute(`href`, `#svg-play`);
	}
}

// toggle audio mute/unmute
function toggleMute() {
	if (page.audio.muted) {
		page.audio.muted = false;
		page.muteToggle.ariaLabel = `Mute audio`;
		page.muteToggle.querySelector("use").setAttribute(`href`, `#svg-mute`);
		page.volumeControl.value = page.audio.volume * 100;
	} else {
		page.audio.muted = true;
		page.muteToggle.ariaLabel = `Unmute audio`;
		page.muteToggle.querySelector("use").setAttribute(`href`, `#svg-unmute`);
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
	document.querySelector(`#${id}-toggle`).setAttribute(`aria-pressed`, toggled ? `true` : `false`);
	console.info(`initialised "${id}" toggle: ${toggled ? `on` : `off`}`);
}

// switch a toggle from off/unpressed to on/pressed
function switchToggle(id) {
	const button = document.querySelector(`#${id}-toggle`);
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

// update setting and its buttons according to chosen value
function updateSetting(name, option) {
	unpressButton(page[`${name}Buttons`].querySelector(`[aria-pressed="true"]`));
	pressButton(page[`${name}Buttons`].querySelector(`[data-option="${option}"]`));

	document.documentElement.dataset[name] = option;
	styles[name] = option;
}

// switch between different colour themes
function switchTheme(theme) {
	updateSetting(`theme`, theme);

	let faviconNew = faviconRaw;
	for (const type of [`fore`, `back`, `hot`, `cold`]) {
		faviconNew = faviconNew.replaceAll(`--${type}-colour`, getComputedStyle(document.documentElement).getPropertyValue(`--${type}-colour`));
	}
	page.favicon.href = `data:image/svg+xml,${faviconNew.replaceAll(`#`, `%23`)}`;
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
	page.seriesLinks.innerHTML = archive.map(series => `
	<li>
		<a href="#archive-${series.code}">${series.heading}</a>
	</li>
	`).join(``);

	page.seriesList.innerHTML = archive.map(series => `
	<li id="archive-${series.code}" data-copyright-safe="${series.copyrightSafe ? `true` : `false`}">
		<header>
			<h3 class="series-heading">${series.heading}</h3>
			<div class="series-content">
				<p>${series.blurb}</p>
				<p class="series-source">source: ${series.source}</p>
			</div>
			<button class="push-button" type="button" data-target="${series.code}" data-action="add-series">Add series to playlist</button>
		</header>
		<ol class="show-list">
			${series.shows.map(show =>
			`<li id="${series.code}-${show.code}" data-duration="${show.duration}" data-banger="${show.banger ? `true` : `false`}">
				<h4 class="show-heading">${show.heading}</h4>
				<div class="show-content">
					<p>${show.blurb}</p>
					${show.notes ? `<details class="content-notes" ${settings.notesOpen ? `open=""` : ``}>
						<summary>Content notes</summary>
						${show.notes}
					</details>` : ``}
				</div>
				<button class="push-button" type="button" data-target="${series.code}-${show.code}" data-action="add-show" aria-pressed="false">Add to playlist</button>
			</li>
			`).join(``)}
		</ol>
	</li>
	`).join(``);

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
	for (const [name, value] of Object.entries({
		"sources": archive.length,
		"shows": archive.reduce((a, series) => a + series.shows.length, 0),
		"duration": Math.round(archive.map(series => series.shows.sumByKey(`duration`)).sum() / 3600)
	})) document.querySelector(`#stats-${name}`).textContent = value;

	// clear archive object
	archive = null;
}

// add random banger to welcome page, with "add show" button as call to action
function buildFeaturedShow() {
	const id = getRandomShowID(`banger`);
	const showInArchive = getShowInArchive(id);

	if (!showInArchive) {
		page.featuredShow.hidden = true;
		return;
	}

	const seriesInArchive = showInArchive.closest(`#series-list > li`);

	page.featuredShow.innerHTML = `
	<svg class="svg-icon waveform-spacer" viewBox="0 0 96 24"><use href="#svg-waveform" /></svg>
	<h3>Why not try&hellip;</h3>
	<h4 class="show-heading">${seriesInArchive.querySelector(`.series-heading`).innerHTML} ${showInArchive.querySelector(`.show-heading`).innerHTML}</h4>
	<div class="show-content">
		${showInArchive.querySelector(`.show-content`).innerHTML}
		${seriesInArchive.querySelector(`.series-source`).outerHTML}
	</div>
	${showInArchive.querySelector(`[data-action="add-show"]`).outerHTML}
	`;

	// add click event for adding featured show to playlist and removing it from welcome area
	page.featuredShow.querySelector(`[data-action="add-show"]`).addEventListener(`click`, () => {
		addShow(id);
		page.featuredShow.hidden = true;
	});
}



/* ===========
	EVENTS
=========== */

// radio audio events
page.audio.addEventListener(`ended`, loadNextShow);

// radio interface events
page.seekBar.addEventListener(`change`, () => {
	page.seekBar.dataset.seeking = `false`;
	page.audio.currentTime = page.audio.dataset.duration * page.seekBar.value / 100;
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
document.querySelector(`#random-show-button`).addEventListener(`click`, () => addRandomShow());
document.querySelector(`#random-banger-button`).addEventListener(`click`, () => addRandomShow(`banger`));
document.querySelector(`#shuffle-button`).addEventListener(`click`, shufflePlaylist);
page.clearButton.addEventListener(`click`, () => {
	if (!page.clearButton.hasAttribute(`aria-disabled`)) revealClearPlaylistControls();
});
document.querySelector(`#clear-cancel-button`).addEventListener(`click`, hideClearPlaylistControls);
document.querySelector(`#clear-confirm-button`).addEventListener(`click`, clearPlaylist);
page.playlist.addEventListener(`click`, () => {
	switch (event.target.dataset.action) {
	case `move-up`: moveShow(event.target.dataset.target, -1); break;
	case `remove`: removeShow(event.target.dataset.target); break;
	case `move-down`: moveShow(event.target.dataset.target, 1); break;
	}
});
document.querySelector(`#export-button`).addEventListener(`click`, exportPlaylist);
document.querySelector(`#import-button`).addEventListener(`click`, importPlaylist);

// archive interface events (excluding those dependent on the archive HTML being generated beforehand)
document.querySelector(`#add-archive-button`).addEventListener(`click`, addArchive);

// settings interface events (general)
document.querySelector(`#copyright-safety-toggle`).addEventListener(`click`, toggleCopyrightSafety);
document.querySelector(`#flat-radio-toggle`).addEventListener(`click`, toggleFlatRadio);
document.querySelector(`#auto-play-toggle`).addEventListener(`click`, toggleAutoPlay);
document.querySelector(`#content-notes-toggle`).addEventListener(`click`, toggleContentNotes);
page.themeButtons.addEventListener(`click`, () => {
	if (event.target.tagName === `BUTTON` && !event.target.hasAttribute(`aria-disabled`)) switchTheme(event.target.dataset.option);
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
	switchTheme(styles.theme);
	switchFont(styles.font);

	// initialise radio
	page.loadedShow.classList.toggle(`flat-radio`, settings.flatRadio);
	page.audio.paused = true;
	page.seekBar.value = 0;
	setVolume(page.volumeControl.value / 100);
	setInterval(updateSeekBar, 1000);

	// build various page sections
	buildArchive();
	const storedIDs = window.localStorage.getItem(`playlist`) ? JSON.parse(window.localStorage.getItem(`playlist`)).filter(id => page.seriesList.querySelector(`.show-list > #${id}`)) : [];
	if (storedIDs.length > 0) {
		for (const id of storedIDs) addShow(id);
		console.info(`loaded playlist from storage`);
	}
	buildFeaturedShow();

	// update page head data
	page.title.dataset.original = document.title;
	if (window.location.hash) navigateToSection();
});

// on closing window/browser tab, record user settings and styles to localStorage
window.addEventListener(`beforeunload`, () => {
	if (page.audio.muted) page.volumeControl.value = page.audio.volume * 100; // if someone refreshes the page while audio is muted, the volume slider returns to the unmuted volume before page unloads, so it can load in at the same level when the page reloads
	const playlistIDs = [];
	for (const show of page.playlist.children) playlistIDs.push(show.dataset.id);
	window.localStorage.setItem(`playlist`, JSON.stringify(playlistIDs));
	window.localStorage.setItem(`settings`, JSON.stringify(settings));
	window.localStorage.setItem(`styles`, JSON.stringify(styles));
});
