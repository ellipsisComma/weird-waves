/*jshint esversion: 11*/

/*
	player module:
		* handles all audio queue processing (adding, removing, shuffling, clearing shows)
		* handles queue data
		* handles player interface and audio pre-fetching
		* matches queue across browsing contexts
*/

import {
	getElement,
} from "./page.js?type=module,v=2025-04-01";
import {
	cloneTemplate,
} from "./templates.js?type=module,v=2025-04-01";
import {
	getSetting,
} from "./settings.js?type=module,v=2025-04-01";

// mutation observer to store queue changes
const queueObserver = new MutationObserver((mutations) => {
	loadShow();
	storeQueue();

	// list queue of show IDs line-by-line in queue data box
	setValidImport();
	getElement(`queueData`).value = getShowIDs(getElement(`queue`)).join(`\n`);
});

// set of all show IDs
// ONLY use this for validating whether an ID is valid (as opposed to checking the archive's DOM)
const allShowIDs = new Set();

/* ------
UTILITIES
------ */

// show file path builder
function showPath(showId) {
	const showIdParts = showId.split(`-`);
	const seriesCode = showIdParts.shift();
	const showCode = showIdParts.join(`-`);
	return `./audio/shows/${seriesCode}/${showCode}.mp3`;
}

// convert time in seconds to minutes:seconds timestamp
function setTimestampFromSeconds(element, time) {
	const minutes = Math.floor(time / 60).toString().padStart(2, `0`);
	const seconds = Math.floor(time % 60).toString().padStart(2, `0`);
	element.textContent = `${minutes}:${seconds}`;
}

// get show element in archive
function getShowInArchive(ID) {
	return getElement(`seriesList`).querySelector(`.show-list > [data-show-id="${ID}"]`);
}

// get show element if it's in the queue
function getShowInQueue(ID) {
	return getElement(`queue`).querySelector(`:scope > [data-show-id="${ID}"]`);
}

// get show ID from a pool, adjusted for copyright safety
function getRandomShowID(type = ``) {
	// get pool, adjusted for copyright safety, then filter out shows already in queue
	const pool = [...getElement(`seriesList`).querySelectorAll(`${
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
	localStorageSet(`shows`, getShowIDs(getElement(`queue`)));
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
	let i = getElement(`queue`).children.length;
	if (i < 2) return;

	while (i > 0) getElement(`queue`).append(getElement(`queue`).children[Math.floor(Math.random() * i--)]);
}

// clear queue
function clearQueue() {
	if (getElement(`queue`).children.length > 0) getElement(`queue`).replaceChildren();
}

// copy current queue data to clipboard
function copyQueue() {
	navigator.clipboard.writeText(getElement(`queueData`).value);
	getElement(`copyButton`).success(`Copied`);
}

// reset import validity invalidity
function setValidImport() {
	getElement(`importErrorMessage`).hidden = true;
	getElement(`queueData`).ariaInvalid = false;
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
	const importList = getElement(`queueData`).value.trim();

	// hide error message (done before guard, so error message disappears on import attempt even if textbox is empty)
	getElement(`importErrorMessage`).hidden = true;

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
		setValidImport();
		clearQueue();
		for (const ID of importIDs) addShow(ID);
	} else {
		getElement(`importErrorList`).replaceChildren(...invalidIDs.map(ID => {
			const IDitem = cloneTemplate(`importErrorItem`);
			IDitem.querySelector(`.invalid-show-id`).textContent = ID;
			IDitem.querySelector(`.matched-show-id`).textContent = matchInvalidShowID(ID);
			return IDitem;
		}));
		getElement(`queueData`).value = importIDs.join(`\n`);
		getElement(`queueData`).ariaInvalid = true;
		getElement(`importErrorMessage`).hidden = false;
		getElement(`importErrorMessage`).scrollIntoView();
	}
}

// load queue from local storage
function loadQueue() {
	getElement(`queue`).replaceChildren();
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
		getElement(`queue`).append(showInQueue);
		console.info(`re-added show: ${ID}`);
		return;
	}

	// error out if show not in Archive
	const showInArchive = getShowInArchive(ID);
	if (!showInArchive) {
		console.error(`show ID does not exist in Archive: ${ID}`);
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
	getElement(`queue`).appendChild(templatedShow);
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
		window.scrollTo(0, getElement(`queue`).lastElementChild.offsetTop - getElement(`queueControls`).clientHeight);
	} else console.warn(`can't add new show of type "${showType}": all shows of that type already in queue`);
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
	if (getElement(`queue`).children.length > 0 && getElement(`queue`).firstElementChild.dataset.showId === getElement(`loadedShow`).dataset.showId) return;

	getElement(`playToggle`).ariaPressed = `false`;
	getElement(`loadedShow`).replaceChildren();

	if (getElement(`queue`).children.length > 0) {
		const show = getElement(`queue`).firstElementChild;
		getElement(`loadedShow`).dataset.showId = show.dataset.showId;

		// load audio file and show data
		getElement(`audio`).src = showPath(show.dataset.showId);
		getElement(`loadedShow`).replaceChildren(...show.querySelector(`.show-info`).cloneChildren());

		// reset and reveal player controls
		if (getElement(`audio`).dataset.playNextShow === `true`) {
			if (getElement(`audio`).paused) getElement(`audio`).play();
			getElement(`audio`).dataset.playNextShow = `false`;
		} else getElement(`audio`).pause();
		getElement(`seekBar`).value = 0;
		getElement(`showTimeElapsed`).textContent = `00:00`;
		getElement(`playerControls`).hidden = false;
	} else {
		// empty loaded show and queue
		getElement(`queue`).replaceChildren();

		// reset player
		if (!getElement(`audio`).paused) getElement(`audio`).pause(); // otherwise audio continues playing
		getElement(`audio`).removeAttribute(`src`); // check why this is necessary instead of just emptying [src]
		getElement(`showTimeElapsed`).textContent = `00:00`;
		getElement(`showTimeTotal`).textContent = `00:00`;
		getElement(`playerControls`).hidden = true;
		getElement(`loadedShow`).dataset.showId = ``;
	}
}

// remove loaded show and autoplay next one if setting is on
function endShow() {
	if (getSetting(`autoPlayNextShow`)) getElement(`audio`).dataset.playNextShow = `true`;
	removeShow(getElement(`queue`).firstElementChild);
}

/* ---
PLAYER
--- */

// reset show time to 0
function resetShow() {
	getElement(`audio`).currentTime = 0;
}

// toggle audio play/pause
function togglePlay() {
	if (getElement(`audio`).paused) getElement(`audio`).play();
	else getElement(`audio`).pause();
}

// end current show and autoplay next show if current show was playing
function skipShow() {
	if (getElement(`queue`).children.length === 0) return;
	if (!getElement(`audio`).paused) getElement(`audio`).dataset.playNextShow = `true`;
	removeShow(getElement(`queue`).firstElementChild);
}

// change seek bar to match audio unless audio metadata unavailable
function updateSeekBar() {
	if (!getElement(`audio`).duration) return;
	getElement(`seekBar`).value = getElement(`audio`).currentTime / getElement(`audio`).duration * 100;
	setTimestampFromSeconds(getElement(`showTimeElapsed`), getElement(`audio`).currentTime);
}

// manually seek a time in the show
function startManualSeek() {
	// ignore seek attempt if audio metadata hasn't loaded or if attempting to seek to end of show
	if (
		!getElement(`audio`).duration
		|| getElement(`seekBar`).value === getElement(`seekBar`).max
	) return;
	if (!getElement(`audio`).paused) getElement(`audio`).pause();
	getElement(`audio`).currentTime = getElement(`audio`).duration * getElement(`seekBar`).value / 100;
}

// end manual seek by playing audio
function endManualSeek() {
	getElement(`audio`).play();
}

// toggle audio mute/unmute
function toggleMute() {
	getElement(`audio`).muted = !getElement(`audio`).muted;
}

// set audio volume
function setVolume() {
	getElement(`audio`).volume = getElement(`volumeControl`).value / 100;
	if (getElement(`audio`).muted) toggleMute();
}

// update state of mute button and volume slider to match show audio state
function updateVolumeControls() {
	if (getElement(`audio`).muted || getElement(`audio`).volume === 0) {
		getElement(`volumeControl`).value = 0;
		getElement(`muteToggle`).ariaPressed = `true`;
	} else {
		getElement(`volumeControl`).value = getElement(`audio`).volume * 100;
		getElement(`muteToggle`).ariaPressed = `false`;
	}
}

/* -------
INITIALISE
------- */

// initialise all player events and interactions, and prepare queue
function initialise() {
	// player audio events
	getElement(`audio`).addEventListener(`loadstart`, () => {
		getElement(`playToggle`).disabled = true;
	});
	getElement(`audio`).addEventListener(`loadedmetadata`, () => {
		getElement(`playToggle`).disabled = false;
		setTimestampFromSeconds(getElement(`showTimeTotal`), getElement(`audio`).duration);
	});
	getElement(`audio`).addEventListener(`timeupdate`, updateSeekBar);
	getElement(`audio`).addEventListener(`play`, () => getElement(`playToggle`).ariaPressed = `true`);
	getElement(`audio`).addEventListener(`pause`, () => getElement(`playToggle`).ariaPressed = `false`);
	getElement(`audio`).addEventListener(`ended`, endShow);
	getElement(`audio`).addEventListener(`volumechange`, updateVolumeControls);

	// player interface events
	getElement(`resetButton`).addEventListener(`click`, resetShow);
	getElement(`playToggle`).addEventListener(`click`, togglePlay);
	getElement(`skipButton`).addEventListener(`click`, skipShow);
	getElement(`seekBar`).addEventListener(`input`, startManualSeek);
	getElement(`seekBar`).addEventListener(`change`, endManualSeek);
	getElement(`muteToggle`).addEventListener(`click`, toggleMute);
	getElement(`volumeControl`).addEventListener(`input`, setVolume);

	// booth interface events
	document.getElementById(`random-show-button`).addEventListener(`click`, () => addRandomShow(`all`));
	document.getElementById(`random-banger-button`).addEventListener(`click`, () => addRandomShow(`banger`));
	document.getElementById(`shuffle-button`).addEventListener(`click`, shuffleQueue);
	getElement(`clearButton`).addEventListener(`click`, clearQueue);
	getElement(`queue`).addEventListener(`click`, () => {
		const target = event.target.closest(`#queue > li`);
		switch (event.target.dataset.action) {
		case `move-up`: moveShowUp(target); break;
		case `remove`: removeShow(target); break;
		case `move-down`: moveShowDown(target); break;
		}
	});
	getElement(`copyButton`).addEventListener(`click`, copyQueue);
	document.getElementById(`import-button`).addEventListener(`click`, importQueue);

	// archive interface events
	getElement(`seriesList`).addEventListener(`click`, () => {
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
	queueObserver.observe(getElement(`queue`), {"childList": true});

	// build up all show IDs from archive
	const allShowsInArchive = getElement(`seriesList`).querySelectorAll(`.show-list > [data-show-id]`);
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
	if (getElement(`audio`).muted) getElement(`volumeControl`).value = getElement(`audio`).volume * 100;
});

export {
	initialise,
	addShow,
};
