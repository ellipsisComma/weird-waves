/*jshint esversion: 11*/

/*
	schedule module:
		* loads the week's schedule onto welcome area
*/

import {
	getElement,
} from "./page.js?type=module,v=2025-04-04";
import {
	addShow,
} from "./player.js?type=module,v=2025-04-04";

// schedule file path builder (date is a Date object)
function schedulePath(date) {
	return `./schedules/schedule-${date.toISOString().slice(0, 10)}.json`;
}

// get date of the current week's Monday
function getWeekStartDate() {
	const date = new Date();
	date.setDate(date.getDate() - ((date.getDay() + 6) % 7));
	date.setMinutes(date.getMinutes()-date.getTimezoneOffset());
	return date;
}

// fetch weekly schedule and, if available and valid, load schedule onto page
async function loadSchedule() {
	if (!getElement(`schedule`)) return;

	const path = schedulePath(getWeekStartDate());
	const file = await fetch(
		path,
		{"cache": `no-cache`}
	);
	if (!file.ok) {
		console.error(`failed to fetch schedule file: ${file.status}`);
		return;
	}

	const schedule = await file.json();
	if (!schedule.validate({
		"title": [`string`, true],
		"blurb": [`string`, true],
		"shows": [`array`, true],
	})) {
		console.error(`schedule file with path "${path}" lacked required data`);
		return;
	}
	schedule.shows = schedule.shows.filter(ID => {
		const valid = typeof ID === `string`;
		if (!valid) console.warn(`removed show ID "${ID}" from schedule: this ID is not string data`);
		return valid;
	});

	document.getElementById(`schedule-title`)?.setContent(schedule.title);
	document.getElementById(`schedule-blurb`)?.setContent(schedule.blurb);
	document.getElementById(`add-schedule-button`)?.addEventListener(`click`, () => {
		for (const ID of schedule.shows) addShow(ID);
		getElement(`schedule`).remove();
	});
	getElement(`schedule`)?.removeAttribute(`hidden`);
}

export {
	loadSchedule,
};
