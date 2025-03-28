/*jshint esversion: 11*/

/*
	schedule module:
		* loads the week's schedule onto welcome area
*/

import {
	getElement,
} from "./page.js?type=module,v=2025-03-28";
import {
	addShow,
} from "./player.js?type=module,v=2025-03-28b";

// schedule file path builder (date is a Date object)
function schedulePath(date) {
	return `./schedules/schedule-${date.toISOString().slice(0, 10)}.json`;
}

// get date of the current week's Monday
function getWeekStartDate() {
	const date = new Date();
	date.setDate(date.getDate() - ((date.getDay() + 6) % 7));
	return date;
}

// fetch weekly schedule and, if available and valid, load schedule onto page
async function loadSchedule() {
	if (!getElement(`schedule`)) return;

	const weekStart = getWeekStartDate();
	const file = await fetch(
		schedulePath(weekStart),
		{"cache": `no-cache`}
	);
	if (!file.ok) {
		console.error(`failed to fetch schedule file: ${file.status}`);
		return;
	}
	const schedule = await file.json();

	getElement(`scheduleDate`).textContent = weekStart.toLocaleDateString();
	getElement(`scheduleDate`).dateTime = weekStart.toISOString().slice(0, 10);
	document.getElementById(`schedule-title`).setContent(schedule.title);
	document.getElementById(`schedule-blurb`).setContent(schedule.blurb);
	document.getElementById(`add-schedule-button`).addEventListener(`click`, () => {
		for (const ID of schedule.shows) addShow(ID);
		getElement(`schedule`).remove();
	});
	getElement(`schedule`).hidden = false;
}

export {
	loadSchedule,
};