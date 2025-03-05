/*jshint esversion: 11*/

/*
	styles module:
		* stores and updates styles
		* updates style input states to match settings
		* matches styles across browsing contexts
*/

import {
	getElement,
} from "./page.js?v=2025-03-05b";

// initialise local styles object
const local = retrieve(`styles`, {});

// raw favicon code before variables are swapped for real colour values
const faviconRaw = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 26 26" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round" vector-effect="non-scaling-stroke">
	<rect x="-1" y="-1" width="28" height="28" fill="--back-colour" />
	<path stroke="--hot-colour" d="M7 11a3 3 0 0 1 3 3a3 3 0 0 1 6 0a3 3 0 0 1 3-3" />
	<path stroke="--cold-colour" d="M7 8a6 6 0 0 1 12 0v4a6 6 0 0 1-12 0zm12 3h3v1a9 9 0 0 1-18 0v-1h3m6 10v3m-4 0h8" />
</svg>`;

// get computed value of a style property of an element
function getElementStyle(query, property) {
	return getComputedStyle(document.querySelector(query)).getPropertyValue(property);
}

// update style buttons so aria-pressed state reflects current style value in local
function setStyleButtons(style) {
	const buttons = getElement(`${style}Buttons`);
	if (!buttons) return;

	buttons.querySelector(`[aria-pressed="true"]`)?.unpress();
	const newButton = buttons.querySelector(`[data-option="${local[style]}"]`);

	if (!newButton) {
		const defaultButton = buttons.querySelector(`button`);
		local[style] = defaultButton.dataset.option;
		defaultButton.press();
	} else newButton.press();
}

// update favicon code, replacing colour variables in raw favicon with their CSS-provided real values
function updateFavicon() {
	let faviconNew = faviconRaw;
	[`fore`, `back`, `hot`, `cold`].forEach(type => faviconNew = faviconNew.replaceAll(`--${type}-colour`, getElementStyle(`:root`, `--${type}-colour`)));
	getElement(`SVGFavicon`).href = `data:image/svg+xml,${encodeURIComponent(faviconNew)}`;
}

// update a style when triggered
function setStyle(style, option) {
	local[style] = option;
	setStyleButtons(style);
	document.documentElement.dataset[style] = local[style];
	store(`styles`, local);
	if (style === `theme`) updateFavicon();
}

// get current value of style
function getStyle(style) {
	return local[style];
}

// initialise styles
function initialise() {
	local.theme ??= document.documentElement.dataset.theme;
	local.font ??= document.documentElement.dataset.font;

	Object.keys(local).forEach(style => {
		const buttons = getElement(`${style}Buttons`);
		if (!buttons) return;

		// initialise buttons
		setStyleButtons(style);
		buttons.classList.remove(`pre-initialised-control`);

		// add event listener to buttons for updating styles
		buttons.addEventListener(`click`, () => {
			if (
				event.target.tagName === `BUTTON`
				&& event.target.getAttribute(`aria-disabled`) === `false`
			) setStyle(style, event.target.dataset.option);
		});
	});
	updateFavicon();
}

// update styles if styles change in another browsing context
window.addEventListener(`storage`, () => {
	if (event.key !== `styles`) return;

	const newStyles = JSON.parse(event.newValue);

	if (getStyle(`theme`) !== newStyles.theme) setStyle(`theme`, newStyles.theme);
	if (getStyle(`font`) !== newStyles.font) setStyle(`font`, newStyles.font);
	console.info(`automatically matched style change in another browsing context`);
});

export {
	initialise,
	getStyle,
	setStyle,
};