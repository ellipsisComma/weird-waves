/*jshint esversion: 11*/

/*
	archive module:
		* builds archive
		* calculates archive stats
*/

import {
	cloneTemplate,
} from "templates";
import {
	getSetting,
} from "settings";
import {
	archiveData
} from "archive-data";

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
	if (show.notes.length > 0) contentNotes.querySelector(`div`).setContent(show.notes);
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

	return templatedSeries;
}

// build archive onto page and runtime
function buildArchive() {
	// return if archive is improperly defined
	if (!Array.isArray(archiveData)) return;

	document.getElementById(`series-list`).replaceChildren(...archiveData.map(buildSeries));
	document.getElementById(`archive-series-links`).replaceChildren(...archiveData.map(buildSeriesLink));

	// build out and reveal stats
	document.getElementById(`stats-series`)?.setContent(String(archiveData.length));
	document.getElementById(`stats-shows`)?.setContent(String(archiveData.reduce((a, series) => a + series.shows.length, 0)));
	document.getElementById(`stats`)?.removeAttribute(`hidden`);
}

export {
	buildArchive,
};
