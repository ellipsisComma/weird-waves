/*jshint esversion: 11*/

/*
	styles module:
		* stores and updates styles
		* updates style input states to match settings
		* matches styles across browsing contexts
*/

// initialise local styles object
const local = localStorageGet(`styles`, {});

// update a style when triggered
function setStyle(style, option) {
	local[style] = option;
	document.getElementById(`${style}-select`).value = option;
	document.documentElement.dataset[style] = local[style];
	localStorageSet(`styles`, local);
}

// initialise style controls
function initialise() {
	// get pre-initialised values for styles
	local.theme = document.documentElement.dataset.theme;
	local.font = document.documentElement.dataset.font;

	for (const style of Object.keys(local)) {
		const select = document.getElementById(`${style}-select`);
		if (!select) continue;

		// initialise select input (if stored theme doesn't exist, switch to default theme, and if no theme's set as default, switch to first theme)
		const defaultOption = select.querySelector(`[selected]`) ?? select.querySelector(`option`);
		if (select.querySelector(`[value="${local[style]}"]`)) select.value = local[style];
		else setStyle(style, defaultOption.value);
// Note: If the stored theme is invalid, then the page will be painted in the initial
// colour palette, *then* repainted in the default theme. This is unavoidable, since the
// DOM has to load (and be painted) before we can check the theme's validity.

		select.closest(`.pre-initialised-control`).classList.remove(`pre-initialised-control`);

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
