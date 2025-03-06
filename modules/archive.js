/*jshint esversion: 11*/

/*
	archive module:
		* builds archive
		* builds list of all show IDs
		* includes getShowInArchive() (theoretically it could be used without the audio player)
*/

import {
	getElement,
} from "./page.js?v=2025-03-07";
import {
	cloneTemplate,
} from "./templates.js?v=2025-03-07";
import {
	getSetting,
} from "./settings.js?v=2025-03-07";
import {
	archive
} from "./archive-data.js?v=2025-03-07";

// set of all show IDs
// ONLY use this for validating whether an ID is valid (as opposed to checking the archive's DOM)
const allShowIDs = new Set();
archive.forEach(series => series.shows.forEach(show => allShowIDs.add(`${series.code}-${show.code}`)));

// build an archive nav-link
function buildSeriesLink(series) {
	const newSeriesLinkItem = document.createElement(`li`);
	const newSeriesLink = newSeriesLinkItem.appendChild(document.createElement(`a`));
	newSeriesLink.href = `#${series.elementId}`;
	newSeriesLink.setContent(series.heading);
	return newSeriesLinkItem;
}

// build HTML for archive show item
function buildShow(show) {
	// add show details to series' show list
	const templatedShow = cloneTemplate(`archiveShow`);
	const newShow = templatedShow.querySelector(`li`);
	newShow.setAttributes({
		"id": `archive-${show.ID}`,
		"data-show-id": show.ID,
		"data-banger": show.banger ? `true` : `false`,
	});
	newShow.querySelector(`.show-heading`).setContent(show.heading);
	newShow.querySelector(`.show-blurb`).setContent(show.blurb);

	// if show has content notes, add them to show-info, otherwise remove empty content notes element
	const contentNotes = newShow.querySelector(`.content-notes`);
	if (show.notes) contentNotes.querySelector(`div`).setContent(show.notes);
	else contentNotes.remove();

	return templatedShow;
}

// build HTML for archive series item and its list of shows
function buildSeries(series) {
	const templatedSeries = cloneTemplate(`archiveSeries`);
	const newSeries = templatedSeries.querySelector(`li`);

	newSeries.setAttributes({
		"id": series.elementId,
		"data-copyright-safe": series.copyrightSafe ? `true` : `false`,
	});

	if (series.copyrightSafe) newSeries.dataset.copyrightSafe = `true`;
	newSeries.querySelector(`.series-heading`).setContent(series.heading);
	newSeries.querySelector(`.series-blurb`).setContent(series.blurb);
	newSeries.querySelector(`.series-source`).setContent(`Source: ${series.source}`);
	newSeries.querySelector(`.show-list`).replaceChildren(...series.shows.map(buildShow));
	newSeries.querySelector(`.series-return-link`).href = `#${series.elementId}`;

	return templatedSeries;
}

// build archive onto page and runtime
function buildArchive() {
	getElement(`seriesLinks`).replaceChildren(...archive.map(buildSeriesLink));
	getElement(`seriesList`).replaceChildren(...archive.map(buildSeries));

	// build out stats list
	Object.entries({
		"series": archive.length,
		"shows": archive.reduce((a, series) => a + series.shows.length, 0),
	}).forEach(([name, value]) => document.getElementById(`stats-${name}`).textContent = value);
}

// get show element in archive
function getShowInArchive(ID) {
	return getElement(`seriesList`).querySelector(`.show-list > [data-show-id="${ID}"]`);
}

export {
	buildArchive,
	getShowInArchive,
	allShowIDs,
};
