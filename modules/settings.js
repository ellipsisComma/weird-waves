/*jshint esversion: 11*/

/*
	settings module:
		* stores and updates settings
		* updates toggle switch states to match settings
		* matches settings across browsing contexts
*/

import {
	getElement,
} from "./page.js?type=module,v=2025-03-14";
import {
	getTemplate,
} from "./templates.js?type=module,v=2025-03-14";

// initialise local settings object
const local = localStorageGet(`settings`, {});

// toggle a setting and its toggle switch and apply any immediate effects
function toggleSetting(setting) {
	const toggle = document.getElementById(`${setting.camelToKebab()}-toggle`);
	if (!toggle) return;
	local[setting] = !local[setting];
	toggle.ariaPressed = local[setting] ? `true` : `false`;
	localStorageSet(`settings`, local);

	switch (setting) {
	case `flatRadio`:
		getElement(`loadedShow`).classList.toggle(`flat-radio`, local.flatRadio);
		break;
	case `notesOpen`:
		for (const notes of document.querySelectorAll(`.content-notes`)) notes.open = getSetting(`notesOpen`);
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

	for (const setting of Object.keys(local)) {
		const toggle = document.getElementById(`${setting.camelToKebab()}-toggle`);
		if (!toggle) continue;

		toggle.setAttribute(`aria-pressed`, local[setting].toString());
		toggle.addEventListener(`click`, () => toggleSetting(setting));
		toggle.closest(`.pre-initialised-control`).classList.remove(`pre-initialised-control`);
	}
	getElement(`loadedShow`).classList.toggle(`flat-radio`, getSetting(`flatRadio`));
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