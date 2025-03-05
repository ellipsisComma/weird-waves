/*jshint esversion: 11*/

/*
	settings module:
		* stores and updates settings
		* updates toggle switch states to match settings
		* matches settings across browsing contexts
*/

import {
	getElement,
} from "./page.js?v=2025-03-05b";
import {
	getTemplate,
} from "./templates.js?v=2025-03-05";

// initialise local settings object
const local = retrieve(`settings`, {});

// toggle a setting and its toggle switch and apply any immediate effects
function toggleSetting(setting) {
	const toggle = document.getElementById(`${setting.camelToKebab()}-toggle`);
	if (!toggle) return;
	local[setting] = !local[setting];
	toggle.ariaPressed = local[setting] ? `true` : `false`;
	store(`settings`, local);

	switch (setting) {
	case `flatRadio`:
		getElement(`loadedShow`).classList.toggle(`flat-radio`, local.flatRadio);
		break;
	case `notesOpen`:
		document.querySelectorAll(`.content-notes`).forEach(notes => notes.open = getSetting(`notesOpen`));
		break;
	}
}

// get value of setting (TRUE or FALSE)
function getSetting(setting) {
	return local[setting];
}

// initialise settings
function initialise() {
	local.copyrightSafety ??= false; // if true, exclude certain series from being added to the queue during addArchive() or addRandomShow()
	local.flatRadio ??= false; // if true, hide all show info except show-heading in radio
	local.autoPlayNextShow ??= true; // if true, start playing next show when previous show runs to completion
	local.notesOpen ??= false; // if true, open all content notes

	getTemplate(`archiveShow`).querySelector(`.content-notes`).open = local.notesOpen;

	Object.keys(local).forEach(setting => {
		const toggle = document.getElementById(`${setting.camelToKebab()}-toggle`);
		toggle?.setAttribute(`aria-pressed`, local[setting].toString());
		toggle?.closest(`.pre-initialised-control`).classList.remove(`pre-initialised-control`);
	});
	getElement(`loadedShow`).classList.toggle(`flat-radio`, getSetting(`flatRadio`));

	// settings interface events (general)
	[`copyrightSafety`, `flatRadio`, `autoPlayNextShow`, `notesOpen`].forEach(setting => {
		document.getElementById(`${setting.camelToKebab()}-toggle`).addEventListener(`click`, () => toggleSetting(setting));
	});
}

// update settings if settings change in another browsing context
window.addEventListener(`storage`, () => {
	if (event.key !== `settings`) return;

	const newSettings = JSON.parse(event.newValue);

	if (getSetting(`copyrightSafety`) !== newSettings.copyrightSafety) toggleSetting(`copyrightSafety`);
	if (getSetting(`flatRadio`) !== newSettings.flatRadio) toggleSetting(`flatRadio`);
	if (getSetting(`autoPlayNextShow`) !== newSettings.autoPlayNextShow) toggleSetting(`autoPlayNextShow`);
	if (getSetting(`notesOpen`) !== newSettings.notesOpen) toggleSetting(`notesOpen`);
	console.info(`automatically matched settings change in another browsing context`);
});

export {
	initialise,
	getSetting,
};