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
	for (const [attr, value] of Object.entries(attrs)) this.setAttribute(attr, value);
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

// get computed value of a style property of an element
function getStyle(query, property) {
	return getComputedStyle(document.querySelector(query)).getPropertyValue(property);
}



/* ===========
	ARRAYS
=========== */

// sum a numerical array
Array.prototype.sum = function () {
	return this.reduce((a, b) => a + b, 0);
};

// work down through a multi-level array of objects, where one value is an array of objects, etc., using keys
// example: arr.sumByKey(`author`, `book`, `wordcount`) would sum the wordcount across all of an author's books
Array.prototype.sumByKey = function () {
	const args = [...arguments];
	return this.reduce((a, b) => a + (
		args.length > 1
		? b[args[0]].sumByKey(...args.slice(1))
		: Array.isArray(b[args[0]])
			? b[args[0]].sum()
			: b[args[0]]), 0);
};




/* =========
	SETS
========= */

// toggle an item in a set
Set.prototype.toggle = function (item) {
	if (this.has(item)) this.delete(item);
	else this.add(item);
};



/* ============
	STRINGS
============ */

// convert a string to a string representation of its unicode, with a customisable prefix (\\u for general, \\ for CSS)
String.prototype.toUnicode = function (prefix = `\\u`) {
	return Array.from(this).map(ch => `${prefix}${ch.codePointAt(0).toString(16).padStart(4, `0`)}`).join(``);
}

// convert a string representation of standard unicode (i.e. prefixed "\u") to its actual string
String.prototype.fromUnicode = function () {
	return Array.from(this).map(ch => ch.charAt(0)).join(``);
}



/* ===========
	WINDOW
=========== */

// get something from localStorage or set a default value if no value stored
function retrieve(key, defaultValue) {
	return JSON.parse(window.localStorage.getItem(key)) ?? defaultValue;
}

// set something in localStorage
function store(key, value) {
	window.localStorage.setItem(key, JSON.stringify(value));
}



/* ================
	INTERACTION
================ */

// set a button's state to unpressed
HTMLButtonElement.prototype.unpress = function () {
	this.setAttribute(`aria-pressed`, `false`);
	this.removeAttribute(`aria-disabled`);
}

// set a button's state to pressed
HTMLButtonElement.prototype.press = function () {
	this.setAttributes({
		"aria-pressed": `true`,
		"aria-disabled": `true`
	});
}
