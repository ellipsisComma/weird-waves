/*jshint esversion: 11*/

import {
	getElement,
} from "./page.js";
import {
	getTemplate,
} from "./templates.js";

const local = retrieve(`settings`, {});

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

function getSetting(setting) {
	return local[setting];
}

function initialise() {
	local.copyrightSafety ??= false; // if true, exclude certain series from being added to the playlist during addArchive() or addRandomShow()
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

// update settings, styles, and playlist if styles change in another browsing context
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