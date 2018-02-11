var $ = Bliss, $$ = Bliss.$;

try {
	var isSpeaker = new URL(location).searchParams.get("speaker") !== null;
}
catch (e) {}

if (isSpeaker) {
	document.documentElement.classList.add("speaker");
}

function scopeRule(rule, slide, scope) {
	let selector = rule.selectorText;

	if (rule.cssRules) {
		// If this rule contains rules, scope those too
		// Mainly useful for @supports and @media
		for (let innerRule of rule.cssRules) {
			scopeRule(innerRule, slide, scope);
		}
	}

	if (selector && rule instanceof CSSStyleRule) {
		let shouldScope = !(
			selector.includes("#")  // don't do anything if the selector already contains an id
			|| selector == ":root"
		);

		if (selector == "article" || selector == ".slide") {
			rule.selectorText = `#${slide.id}`;
		}
		else if (shouldScope && selector.indexOf(scope) !== 0) {
			rule.selectorText = scope + " " + selector;
		}
	}
}

$$(".demo.slide").forEach(slide => {
	// This is before editors have been created
	slide.classList.add("dont-resize");
});

function createURL(html) {
	html = html.replace(/&#x200b;/g, "");
	var blob = new Blob([html], {type : "text/html"});

	return URL.createObjectURL(blob);
}

// Create blob URLs for each preview link
$$("[data-html]").forEach(function(a) {
	var slide = a.closest(".slide");

	a.addEventListener("click", evt => {
		var selector = a.getAttribute("data-html");
		var element = $(selector, slide) || $(selector, slide.parentNode) || $(selector);
		var html = Prism.plugins.NormalizeWhitespace.normalize(element? element.textContent : selector);

		a.href = createURL(html);
	});
});

$$("details.notes").forEach(details => {
	var div = document.createElement("div");

	$$(details.childNodes).forEach(e => div.append(e));
	details.append(div);

	var summary = $("summary", details);

	if (!summary) {
		var slide = details.closest(".slide");
		summary = $.create("summary", {textContent: slide.title || "Notes"});
	}

	details.prepend(summary);
});

// Specificity battle slide
{
	let slide = $("#specificity-battle");
	let output = {
		0: $("output[for=selector1]", slide),
		1: $("output[for=selector2]", slide),
		greater: $('output[for="selector1, selector2"]', slide)
	};
	let input = $$("input", slide);

	function update() {
		var specificity = [];
		var base = 9;

		for (let i=0; i<2; i++) {
			specificity[i] = calculateSpecificity(input[i].value);
			base = Math.max(base, ...specificity);
			output[i].innerHTML = `<div>${specificity[i].join("</div> <div>")}</div>`;
			output[i].className = "";
		}

		base++;

		var diff = parseInt(specificity[0].join(""), base) - parseInt(specificity[1].join(""), base);

		if (diff < 0) {
			// 2 wins
			output.greater.textContent = "<";
			output[1].className = "winner";
		}
		else if (diff > 0) {
			// 1 wins
			output.greater.textContent = ">";
			output[0].className = "winner";
		}
		else {
			output.greater.textContent = "=";
		}

	}

	$$("input", slide).forEach(input => input.addEventListener("input", update));
	update();
}

function calculateSpecificity(selector) {
	selector = selector.replace(/("|').+?\1/g, "");
	return [
		(selector.match(/#/g) || []).length,
		(selector.match(/\.|:(?!not|:)|\[/g) || []).length,
		(selector.match(/(^|\s)[\w-]+/g) || []).length
	];
}

$$("code.property").forEach(code => {
	$.create("a", {
		href: `https://developer.mozilla.org/en-US/docs/Web/CSS/${code.textContent}`,
		around: code,
		target: "_blank"
	});
});

document.addEventListener("DOMContentLoaded", function(evt) {
	$$(".demo.slide").forEach(slide => slide.demo = new Demo(slide));
});

Prism.languages.insertBefore("css", "property", {
	"variable": /\-\-(\b|\B)[\w-]+(?=\s*[:,)]|\s*$)/i
});

$$(".takeaway.slide").forEach((slide, i) => {
	$.create("span", {
		className: "label",
		innerHTML: `Takeaway <span>#</span>${i + 1}`,
		start: $("h1", slide)
	});
});

// CSS Variables specific
document.addEventListener("slidechange", evt => {
	var slideId = evt.target.id;

	var mousemove = evt => {
		document.documentElement.style.setProperty("--mouse-x", evt.clientX / innerWidth);
		document.documentElement.style.setProperty("--mouse-y", evt.clientY / innerHeight);
	};

	if (slideId == "mouse") {
		document.addEventListener("mousemove", mousemove);
	}
	else {
		document.removeEventListener("mousemove", mousemove);
	}
});

for (input of document.querySelectorAll("input")) {
	input.style.setProperty("--value", input.value);
}

document.addEventListener("input", evt => {
	if (evt.target.matches(":target input")) {
		evt.target.style.setProperty("--value", input.value);
	}
});

var setLength = element => {
	element.style.setProperty("--length", element.textContent.length);
};

for (let el of document.querySelectorAll(".scrolling")) {
	el.addEventListener("scroll", evt => {
		let maxScroll = el.scrollHeight - el.offsetHeight;
		let scroll = el.scrollTop / maxScroll;
		el.style.setProperty("--scroll", scroll);
	});
}

// Remove spaces in syntax breakdown and add classes to the ones that are towards the end
$$(".syntax-breakdown code").forEach(function(code) {
	var slide = code.closest(".slide");

	if (!slide.classList.contains("vertical")) {
		code.innerHTML = code.innerHTML.replace(/[\t\r\n]/g, "");
	}
	else {
		code.innerHTML = Prism.plugins.NormalizeWhitespace.normalize(code.innerHTML);
	}

	var text = code.textContent;

	$$("span", code).forEach(function(span) {
		span.classList.add("delayed");

		if (text.indexOf(span.textContent) > text.length/2) {
			// FIXME will break when there are duplicates
			span.classList.add("after-middle");
		}
	});
});
