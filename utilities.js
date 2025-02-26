/*jshint esversion: 11*/

/* =============
	ELEMENTS
============= */

/*
build an element from:
	* a tag (string, required),
	* attributes (object, optional),
	* children (array (strings and/or element references), optional)
can be recursive
*/
function make(element) {
	const output = document.createElement(element.tag);
	if (element.attrs) output.setAttributes(element.attrs);
	if (element.children) output.append(...element.children);
	return output;
}

// add an object of attributes to an Element
Element.prototype.setAttributes = function (attrs) {
	Object.entries(attrs).forEach(([name, value]) => this.setAttribute(name, value));
};

// remove an array of attributes from an Element
Element.prototype.removeAttributes = function (attrs) {
	attrs.forEach(attr => this.removeAttribute(attr));
};

// create an array of nodes cloned from the target
Element.prototype.cloneChildren = function () {
	return [...this.childNodes].map(node => node.cloneNode(true));
};

// set a string to be an element's innerHTML if it includes HTML entities or unescaped angle brackets, otherwise set it as textContent
HTMLElement.prototype.setContent = function (text) {
	const HTMLRegex = /<|>|&#?\w+;/;
	if (HTMLRegex.test(text)) this.innerHTML = text;
	else this.textContent = text;
};

// add text content to an element
Element.prototype.addText = function (string, after = true) {
	if (after) this.appendChild(document.createTextNode(string));
	else this.prepend(document.createTextNode(string));
};



/* ===========
	ARRAYS
=========== */

// sum a numerical array
Array.prototype.sum = function () {
	return this.reduce((a, b) => a + b, 0);
};

// work down through a multi-level array of objects, where one value is an array of objects, etc., using keys
// example: arr.sumByKey(`author`, `book`, `wordcount`) would sum the wordcount across all of an author's books
Array.prototype.sumByKey = function (...args) {
	return this.reduce((a, b) => a + (
		args.length > 1
		? b[args[0]].sumByKey(...args.slice(1))
		: b[args[0]] instanceof Array
			? b[args[0]].sum()
			: b[args[0]]), 0);
};



/* ============
	OBJECTS
============ */

// check whether a variable is a standard associative-array/key-value-pair object (e.g. as created by an object literal)
function isObject(variable) {
	return variable instanceof Object && variable.constructor === Object;
}



/* ============
	STRINGS
============ */

String.prototype.camelToKebab = function () {
	return this.replaceAll(/([A-Z])/g, (match) => `-${match.toLowerCase()}`);
}

String.prototype.kebabToCamel = function () {
	return this.replaceAll(/-([a-z])/g, (match) => match.slice(1).toUpperCase());
}

// calculate the Jaro similarity of two strings (0 = totally unalike, 1 = identical)
function getJaroSimilarity(str1, str2) {
	const matched1 = Array(str1.length).fill(false);
	const matched2 = Array(str2.length).fill(false);
	const range = Math.floor(Math.max(str1.length, str2.length) / 2 - 1);

	for (let i = 0; i < str1.length; i++) {
		const lowerBound = Math.max(0, i - range);
		const upperBound = Math.min(str2.length, i + range);

		for (let j = lowerBound; j < upperBound; j++) {
			// if the two characters match and the second hasn't been matched yet, mark both as matched and break the loop (no need to continue checking for matches)
			if (str1[i] === str2[j] && matched2[j] !== true) {
				matched1[i] = true;
				matched2[j] = true;
				break;
			}
		}
	}

	// where "matched" is true get character from string and push to "shared"
	const shared1 = [];
	const shared2 = [];
	matched1.forEach((match, i) => {
		if (match) shared1.push(str1[i]);
	});
	matched2.forEach((match, i) => {
		if (match) shared2.push(str2[i]);
	});

	// get transposition count
	let transPos = 0;
	for (let i = 0; i < shared1.length; i++) {
		if (shared1[i] !== shared2[i]) transPos++;
	}

	const matches = shared1.length;
	const similarity = (
		matches / str1.length
		+ matches / str2.length 
		+ (matches - transPos / 2) / matches
		) / 3;

	return similarity;
}



/* =========
	SETS
========= */

// toggle an item in a set
Set.prototype.toggle = function (item) {
	if (this.has(item)) this.delete(item);
	else this.add(item);
};



/* ============
	STORAGE
============ */

// get something from localStorage or set a default value if no value stored
function retrieve(key, defaultValue) {
	return JSON.parse(localStorage.getItem(key)) ?? defaultValue;
}

// set something in localStorage
function store(key, value) {
	localStorage.setItem(key, JSON.stringify(value));
}



/* ================
	INTERACTION
================ */

// set a button's state to unpressed
HTMLButtonElement.prototype.unpress = function () {
	this.setAttributes({
		"aria-pressed": `false`,
		"aria-disabled": `false`,
	});
}

// set a button's state to pressed
HTMLButtonElement.prototype.press = function () {
	this.setAttributes({
		"aria-pressed": `true`,
		"aria-disabled": `true`
	});
}
