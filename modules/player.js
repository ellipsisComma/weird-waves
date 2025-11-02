/*jshint esversion: 11*/

/*
	player module:
		* handles all audio queue processing (adding, removing, shuffling, clearing shows)
		* handles queue data
		* handles player interface and audio pre-fetching
		* matches queue across browsing contexts
*/

import {
	cloneTemplate,
} from "templates";
import {
	getSetting,
} from "settings";

// mutation observer to store queue changes
const queueObserver = new MutationObserver((mutations) => {
	loadShow();
	storeQueue();

	// list queue of show IDs line-by-line in queue data box
	setValidImport();
	document.getElementById(`queue-data`).value = getShowIDs(document.getElementById(`queue`)).join(`\n`);
});

// set of all show IDs
// ONLY use this for validating whether an ID is valid (as opposed to checking the archive's DOM)
const allShowIDs = new Set();

/* ------
UTILITIES
------ */

// show file path builder
function showPath(showId) {
	return `./audio/shows/${showId.replace(`-`, `/`)}.mp3`;
}

// convert time in seconds to minutes:seconds timestamp
function setTimestampFromSeconds(element, time) {
	const minutes = Math.floor(time / 60).toString().padStart(2, `0`);
	const seconds = Math.floor(time % 60).toString().padStart(2, `0`);
	element.textContent = `${minutes}:${seconds}`;
}

// get show element in archive
function getShowInArchive(ID) {
	return document.getElementById(`series-list`).querySelector(`.show-list > [data-show-id="${ID}"]`);
}

// get show element if it's in the queue
function getShowInQueue(ID) {
	return document.getElementById(`queue`).querySelector(`:scope > [data-show-id="${ID}"]`);
}

// get show ID from a pool, adjusted for copyright safety
function getRandomShowID(type = ``) {
	// get pool, adjusted for copyright safety, then filter out shows already in queue
	const pool = [...document.getElementById(`series-list`).querySelectorAll(`${
		getSetting(`copyrightSafety`) ? `[data-copyright-safe="true"]` : ``
	} .show-list > li${
		type === `banger` ? `[data-banger="true"]` : ``
	}`)].filter(show => {
		const showInQueue = getShowInQueue(show.dataset.showId);
		return showInQueue === null || showInQueue === undefined;
	});
	return pool.length > 0 ? pool[Math.floor(Math.random() * pool.length)].dataset.showId : ``;
}

// store queue as list of show IDs
function storeQueue() {
	localStorageSet(`shows`, getShowIDs(document.getElementById(`queue`)));
}

// get array of all show IDs on elements within a container
function getShowIDs(container) {
	return [...container.querySelectorAll(`[data-show-id]`)].map(show => show.dataset.showId);
}

/* --
QUEUE
-- */

// shuffle queue if it has at least 2 entries
function shuffleQueue() {
	let i = document.getElementById(`queue`).children.length;
	if (i < 2) return;

	while (i > 0) document.getElementById(`queue`).append(document.getElementById(`queue`).children[Math.floor(Math.random() * i--)]);
}

// clear queue
function clearQueue() {
	if (document.getElementById(`queue`).children.length > 0) document.getElementById(`queue`).replaceChildren();
}

// copy current queue data to clipboard
function copyQueue() {
	navigator.clipboard.writeText(document.getElementById(`queue-data`).value);
	document.getElementById(`copy-button`).success(`Copied`);
}

// reset import validity invalidity
function setValidImport() {
	document.getElementById(`import-error-list`).replaceChildren();
	document.getElementById(`import-error-message`).hidden = true;
	document.getElementById(`queue-data`).ariaInvalid = false;
}

// get closest string match to an invalid show ID during import attempt, as long as its similarity exceeds a minimum threshold
function matchInvalidShowID(invalidID) {
	const threshold = 0.85;
	const match = {
		"id": `N/A`,
		"similarity": 0,
	};

	// iteratively find most-similar valid ID by Jaro similarity (compare lowercase so the algorithm ignores case errors)
	for (const validID of allShowIDs) {
		const similarity = getJaroSimilarity(validID.toLowerCase(), invalidID.toLowerCase());
		if (similarity > threshold && similarity > match.similarity) {
			match.id = validID;
			match.similarity = similarity;
		}
	}

	return match.id;
}

// import queue from textbox
function importQueue() {
	const importList = document.getElementById(`queue-data`).value.trim();

	// reset import 
	setValidImport();

	// if import is empty, just clear queue instead
	if (importList.length === 0) {
		clearQueue();
		return;
	}

	// remove import error markers from text, remove horizontal whitespace, and validate IDs
	const importIDs = [...new Set(importList.replaceAll(/\/\/.+$/gm, ``).replace(/[^\S\n\r]/g, ``).split(/\n+/))];
	const invalidIDs = importIDs.filter((ID, i) => {
		const invalid = !allShowIDs.has(ID);
		if (invalid) importIDs[i] += ` // import error!`; // side-effect
		return invalid;
	});

	if (invalidIDs.length === 0) {
		clearQueue();
		for (const ID of importIDs) addShow(ID);
		document.getElementById(`import-button`).success(`Imported`);
	} else {
		document.getElementById(`import-error-list`).replaceChildren(...invalidIDs.map(ID => {
			const IDitem = cloneTemplate(`importErrorItem`);
			IDitem.querySelector(`.invalid-show-id`).textContent = ID;
			IDitem.querySelector(`.matched-show-id`).textContent = matchInvalidShowID(ID);
			return IDitem;
		}));
		document.getElementById(`queue-data`).value = importIDs.join(`\n`);
		document.getElementById(`queue-data`).ariaInvalid = true;
		document.getElementById(`import-error-message`).hidden = false;
		document.getElementById(`import-error-message`).scrollIntoView();
	}
}

// load queue from local storage
function loadQueue() {
	document.getElementById(`queue`).replaceChildren();
	for (const ID of localStorageGet(`shows`, []).filter(ID => allShowIDs.has(ID))) addShow(ID);
}

/* --
SHOWS
-- */

/* ADDING */

// add show to queue
function addShow(ID) {
	const showInQueue = getShowInQueue(ID);
	if (showInQueue) {
		document.getElementById(`queue`).append(showInQueue);
		console.info(`re-added show:`, ID);
		return;
	}

	// error out if show not in Archive
	const showInArchive = getShowInArchive(ID);
	if (!showInArchive) {
		console.error(`Show does not exist in Archive:`, ID);
		return;
	}

	// build new queue item
	const seriesInArchive = showInArchive.closest(`#series-list > li`);
	const templatedShow = cloneTemplate(`queueItem`);
	const newShow = templatedShow.querySelector(`li`);
	newShow.dataset.showId = ID;
	newShow.appendChild(showInArchive.querySelector(`.show-info`).cloneNode(true));

	// expand show info with series title and source
	const newShowHeading = newShow.querySelector(`.show-heading`);
	newShowHeading.replaceChildren(
		...seriesInArchive.querySelector(`.series-heading`).cloneChildren(),
		document.createTextNode(` `),
		...newShowHeading.cloneChildren(),
	);
	newShow.querySelector(`.show-content`).appendChild(seriesInArchive.querySelector(`.series-source`).cloneNode(true));

	// update page
	document.getElementById(`queue`).appendChild(templatedShow);
}

// add entire series to queue
function addSeries(seriesInArchive) {
	for (const ID of getShowIDs(seriesInArchive)) addShow(ID);
}

// add a random show or banger to the queue
function addRandomShow(showType) {
	const ID = getRandomShowID(showType);
	if (ID !== ``) {
		addShow(ID);
		window.scrollTo(0, document.getElementById(`queue`).lastElementChild.offsetTop - document.getElementById(`queue-controls`).clientHeight);
	} else console.warn(`Can't add new show of type "${showType}": all shows of that type already in queue.`);
}

/* MANIPULATING */

// swap show with previous show in queue
function moveShowUp(target) {
	target.previousElementSibling?.before(target);
}

// swap show with next show in queue
function moveShowDown(target) {
	target.nextElementSibling?.after(target);
}

// remove show from queue
function removeShow(target) {
	target.remove();
}

// write show parts onto page and load show audio file; if queue is empty, reset player
function loadShow() {
	// don't load show if first show in queue is already loaded
	const firstShowID = document.getElementById(`queue`).firstElementChild?.dataset.showId;
	const loadedShowID = document.getElementById(`loaded-show`).dataset.showId;
	if (document.getElementById(`queue`).children.length > 0 && firstShowID === loadedShowID) return;

	document.getElementById(`play-toggle`).ariaPressed = `false`;
	document.getElementById(`loaded-show`).replaceChildren();

	if (document.getElementById(`queue`).children.length > 0) {
		const show = document.getElementById(`queue`).firstElementChild;
		document.getElementById(`loaded-show`).dataset.showId = show.dataset.showId;

		// load audio file and show data
		document.getElementById(`show-audio`).src = showPath(show.dataset.showId);
		document.getElementById(`loaded-show`).replaceChildren(...show.querySelector(`.show-info`).cloneChildren());

		// reset and reveal player controls
		if (document.getElementById(`show-audio`).dataset.playNextShow === `true`) {
			if (document.getElementById(`show-audio`).paused) document.getElementById(`show-audio`).play();
			document.getElementById(`show-audio`).dataset.playNextShow = `false`;
		} else document.getElementById(`show-audio`).pause();
		document.getElementById(`seek-bar`).value = 0;
		document.getElementById(`show-time-elapsed`).textContent = `00:00`;
		document.getElementById(`player-controls`).hidden = false;
	} else {
		// remove all queue children (including text nodes) so CSS :empty pseudo-class will apply
		document.getElementById(`queue`).replaceChildren();

		// reset player
		if (!document.getElementById(`show-audio`).paused) document.getElementById(`show-audio`).pause(); // otherwise audio continues playing
		document.getElementById(`show-audio`).removeAttribute(`src`); // check why this is necessary instead of just emptying [src]
		document.getElementById(`show-time-elapsed`).textContent = `00:00`;
		document.getElementById(`show-time-total`).textContent = `00:00`;
		document.getElementById(`player-controls`).hidden = true;
		document.getElementById(`loaded-show`).dataset.showId = ``;
	}
}

// remove loaded show and autoplay next one if setting is on
function endShow() {
	if (getSetting(`autoPlayNextShow`)) document.getElementById(`show-audio`).dataset.playNextShow = `true`;
	removeShow(document.getElementById(`queue`).firstElementChild);
}

/* ---
PLAYER
--- */

// reset show time to 0
function resetShow() {
	document.getElementById(`show-audio`).currentTime = 0;
}

// toggle audio play/pause
function togglePlay() {
	if (document.getElementById(`show-audio`).paused) document.getElementById(`show-audio`).play();
	else document.getElementById(`show-audio`).pause();
}

// end current show and autoplay next show if current show was playing
function skipShow() {
	if (document.getElementById(`queue`).children.length === 0) return;
	if (!document.getElementById(`show-audio`).paused) document.getElementById(`show-audio`).dataset.playNextShow = `true`;
	document.getElementById(`show-audio`).dispatchEvent(new CustomEvent(`ended`));
}

// change seek bar to match audio unless audio metadata unavailable
function updateSeekBar() {
	if (!document.getElementById(`show-audio`).duration) return;
	document.getElementById(`seek-bar`).value = document.getElementById(`show-audio`).currentTime / document.getElementById(`show-audio`).duration * 100;
	setTimestampFromSeconds(document.getElementById(`show-time-elapsed`), document.getElementById(`show-audio`).currentTime);
}

// manually seek a time in the show
function startManualSeek() {
	// ignore seek attempt if audio metadata hasn't loaded or if attempting to seek to end of show
	if (
		!document.getElementById(`show-audio`).duration
		||
		document.getElementById(`seek-bar`).value === document.getElementById(`seek-bar`).max
	) return;
	if (!document.getElementById(`show-audio`).paused) document.getElementById(`show-audio`).pause();
	document.getElementById(`show-audio`).currentTime = document.getElementById(`show-audio`).duration * document.getElementById(`seek-bar`).value / 100;
}

// end manual seek by playing audio
function endManualSeek() {
	document.getElementById(`show-audio`).play();
}

// toggle audio mute/unmute
function toggleMute() {
	document.getElementById(`show-audio`).muted = !document.getElementById(`show-audio`).muted;
}

// set audio volume
function setVolume() {
	document.getElementById(`show-audio`).volume = document.getElementById(`volume-slider`).value / 100;
	if (document.getElementById(`show-audio`).muted) toggleMute();
}

// update state of mute button and volume slider to match show audio state
function updateVolumeControls() {
	if (document.getElementById(`show-audio`).muted || document.getElementById(`show-audio`).volume === 0) {
		document.getElementById(`volume-slider`).value = 0;
		document.getElementById(`mute-toggle`).ariaPressed = `true`;
	} else {
		document.getElementById(`volume-slider`).value = document.getElementById(`show-audio`).volume * 100;
		document.getElementById(`mute-toggle`).ariaPressed = `false`;
	}
}

/* -------
INITIALISE
------- */

// initialise all player events and interactions, and prepare queue
function initialise() {
	// player audio events
	document.getElementById(`show-audio`).addEventListener(`loadstart`, () => {
		document.getElementById(`play-toggle`).disabled = true;
		document.getElementById(`skip-button`).disabled = true;
	});
	document.getElementById(`show-audio`).addEventListener(`loadedmetadata`, () => {
		document.getElementById(`play-toggle`).disabled = false;
		document.getElementById(`skip-button`).disabled = false;
		setTimestampFromSeconds(document.getElementById(`show-time-total`), document.getElementById(`show-audio`).duration);
	});
	document.getElementById(`show-audio`).addEventListener(`timeupdate`, updateSeekBar);
	document.getElementById(`show-audio`).addEventListener(`play`, () => document.getElementById(`play-toggle`).ariaPressed = `true`);
	document.getElementById(`show-audio`).addEventListener(`pause`, () => document.getElementById(`play-toggle`).ariaPressed = `false`);
	document.getElementById(`show-audio`).addEventListener(`ended`, endShow);
	document.getElementById(`show-audio`).addEventListener(`volumechange`, updateVolumeControls);

	// player interface events
	document.getElementById(`reset-button`).addEventListener(`click`, resetShow);
	document.getElementById(`play-toggle`).addEventListener(`click`, togglePlay);
	document.getElementById(`skip-button`).addEventListener(`click`, skipShow);
	document.getElementById(`seek-bar`).addEventListener(`input`, startManualSeek);
	document.getElementById(`seek-bar`).addEventListener(`change`, endManualSeek);
	document.getElementById(`mute-toggle`).addEventListener(`click`, toggleMute);
	document.getElementById(`volume-slider`).addEventListener(`input`, setVolume);

	// booth interface events
	document.getElementById(`random-show-button`).addEventListener(`click`, () => addRandomShow(`all`));
	document.getElementById(`random-banger-button`).addEventListener(`click`, () => addRandomShow(`banger`));
	document.getElementById(`shuffle-button`).addEventListener(`click`, shuffleQueue);
	document.getElementById(`clear-button`).addEventListener(`click`, clearQueue);
	document.getElementById(`queue`).addEventListener(`click`, () => {
		const target = event.target.closest(`#queue > li`);
		switch (event.target.dataset.action) {
		case `move-up`: moveShowUp(target); break;
		case `remove`: removeShow(target); break;
		case `move-down`: moveShowDown(target); break;
		}
	});
	document.getElementById(`copy-button`).addEventListener(`click`, copyQueue);
	document.getElementById(`import-button`).addEventListener(`click`, importQueue);

	// archive interface events
	document.getElementById(`series-list`).addEventListener(`click`, () => {
		if (event.target.tagName === `BUTTON` && `action` in event.target.dataset) {
			const button = event.target;
			const action = button.dataset.action;

			switch (action) {
			case `add-show`: addShow(button.closest(`.show-list > li`).dataset.showId); break;
			case `add-series`: addSeries(button.closest(`#series-list > li`)); break;
			}

			button.success(`Added`);
		}
	});

	// start watching for queue changes
	queueObserver.observe(document.getElementById(`queue`), {"childList": true});

	// build up all show IDs from archive
	const allShowsInArchive = document.getElementById(`series-list`).querySelectorAll(`.show-list > [data-show-id]`);
	for (const show of allShowsInArchive) allShowIDs.add(show.dataset.showId);

	// load queue from storage
	loadQueue();
}


// update queue if queue changes in another browsing context
window.addEventListener(`storage`, () => {
	if (event.key !== `shows`) return;

	const newQueue = JSON.parse(event.newValue);

	// could do this with a broadcast channel instead of mutation observer + storage event
	// however, that adds an extra tech and it'd be less robust than rebuilding the queue from scratch
	loadQueue();
	console.info(`automatically matched queue change in another browsing context`);
});

// on closing window/browser tab, preserve audio level
window.addEventListener(`beforeunload`, () => {
	// if someone refreshes the page while audio is muted, the volume slider returns to the unmuted volume before page unloads, so it can load in at the same level when the page reloads
	if (document.getElementById(`show-audio`).muted) document.getElementById(`volume-slider`).value = document.getElementById(`show-audio`).volume * 100;
});

export {
	initialise,
	addShow,
};
