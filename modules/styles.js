/*jshint esversion: 11*/

/*
	styles module:
		* stores and updates styles
		* updates style input states to match settings
		* matches styles across browsing contexts
*/

import {
	getElement,
} from "./page.js?type=module,v=2025-03-29";

// initialise local styles object
const local = localStorageGet(`styles`, {});

// update a style when triggered
function setStyle(style, option) {
	local[style] = option;
	getElement(`${style}Select`).value = option;
	document.documentElement.dataset[style] = local[style];
	localStorageSet(`styles`, local);
}

// initialise style controls
function initialise() {
	// get pre-initialised values for styles
	local.theme = document.documentElement.dataset.theme;
	local.font = document.documentElement.dataset.font;

	for (const style of Object.keys(local)) {
		const select = getElement(`${style}Select`);
		if (!select) continue;

		// initialise select input (if stored theme doesn't exist, switch to default theme)
		if (select.querySelector(`[value="${local[style]}"]`)) select.value = local[style];
		else setStyle(style, select.querySelector(`[selected]`).value);
// Note: If the stored theme is invalid, then the page will be painted in the initial
// colour palette, *then* repainted in the default theme. This is unavoidable, since the
// DOM has to load (and be painted) before we can check the theme's validity.

		select.classList.remove(`pre-initialised-control`);

		// add event listener to update site style when selected style changes
		select.addEventListener(`change`, () => setStyle(style, select.value));
	}
}

// update styles if styles change in another browsing context
window.addEventListener(`storage`, () => {
	if (event.key !== `styles`) return;

	const newStyles = JSON.parse(event.newValue);

	setStyle(`theme`, newStyles.theme);
	setStyle(`font`, newStyles.font);

	console.info(`automatically matched style change in another browsing context`);
});

export {
	initialise,
	setStyle,
};