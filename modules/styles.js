/*jshint esversion: 11*/

/*
	styles module:
		* stores and updates styles
		* updates style input states to match settings
		* matches styles across browsing contexts
*/

import {
	getElement,
} from "./page.js?type=module,v=2025-03-14";

// initialise local styles object
const local = retrieve(`styles`, {});

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

// update a style when triggered
function setStyle(style, option) {
	local[style] = option;
	setStyleButtons(style);
	document.documentElement.dataset[style] = local[style];
	store(`styles`, local);
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
		buttons.querySelectorAll(`button`).forEach(button => button.unpress());
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