/*jshint esversion: 11*/

// add an object of attributes to an Element
Element.prototype.setAttributes = function (attrs) {
	for (const [attr, value] of Object.entries(attrs)) this.setAttribute(attr, value);
};

// remove an array of attributes from an Element
Element.prototype.removeAttributes = function (attrs) {
	attrs.forEach(attr => this.removeAttribute(attr));
};

// get something from localStorage or set a default value if no value stored
function retrieve(key, defaultValue) {
	return JSON.parse(window.localStorage.getItem(key)) ?? defaultValue;
}

// set something in localStorage
function store(key, value) {
	window.localStorage.setItem(key, JSON.stringify(value));
}

// get computed value of a style property of an element
function getStyle(query, property) {
	return getComputedStyle(document.querySelector(query)).getPropertyValue(property);
}

// set a button's state to unpressed
function unpressButton(button) {
	button?.setAttribute(`aria-pressed`, `false`);
	button?.removeAttribute(`aria-disabled`);
}

// set a button's state to pressed
function pressButton(button) {
	button?.setAttributes({
		"aria-pressed": `true`,
		"aria-disabled": `true`
	});
}

// toggle an item in a set
Set.prototype.toggle = function (item) {
	if (this.has(item)) this.delete(item);
	else this.add(item);
};
