// Google analytics
(function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){
(i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o),
m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)
})(window,document,'script','//www.google-analytics.com/analytics.js','ga');

ga('create', 'UA-55744005-1', "{" +
"  'storage': 'none'" + // no cookies
"}");
// use ip address
ga('set', 'anonymizeIp', true);
function gaPageview() {
  if (window.location.pathname !== "/") {
		ga('send', 'pageview');
	} else {
		ga('send', 'pageview', {
			'page': '/accueil',
			'title': 'Schola Vesperis'
		});
	}
}
gaPageview();

// Articles list
(function(){
	var perPage = 10;
	var menu = document.getElementById("menu");
	
	// initialise article list
	var articles = new List("content", {
		valueNames: ["title_link", "title_text", "date", "href", "content", "readmore", "readmore-link", "category"],
		listClass: "list",
		searchClass: "",
		sortFunction: function(a, b, options) {
			m = (options.order == "desc") ? 1 : -1;
			if (a._values.date == "") return -m;
			if (b._values.date == "") return m;
			return m * b._values.date.localeCompare(a._values.date);
		}
	});
	// limit display to 11 articles and hope the pagination will work
	articles.show(1, 11);

	// fill up the article list
	var getjson = new XMLHttpRequest();
	getjson.onreadystatechange = function() {
		if (getjson.readyState == 4 && getjson.status == 200) {
			var articles = JSON.parse(getjson.responseText.replace(/\t/g, " "));
			addArticles(articles);
		}
	}
	getjson.open("GET", '/articles.json', true);
	getjson.send();

	function addArticles(data) {
		// Add the articles to listjs and redo pagination
		articles.show(1, articles.size());
		for(i=0, len=data.length; i<len; i++) {
			if (articles.get('href', data[i].href).length == 0) {
				articles.add(data[i]);
			}
		}
		articles.sort("date", {order: "desc"});
		navigate(true);
	}

	function showArticle(href) {
		matches = articles.get("href", href);
		if (matches.length == 0) return false;
		var article = matches[0].values();
		document.getElementById("list").style.display = "none";
		document.getElementById("pagination").style.display = "none";
		var full_article = document.getElementById("full-article");
		full_article.innerHTML = "<h1>" + article.title_text + "</h1><div>" + article.content + article.readmore + "</div>";
		full_article.style.display = "block";
	}

	function showCategory(category, page) {
		if (page === undefined) page = 1;
		//articles.sort("date", {order: "desc"});
		articles.search();
		articles.filter(function(item) {
			if (category == "accueil" || item.values().category == category) {
				return true;
			}
			return false;
		});
		articles.show(10 * (page - 1) + 1 + (page==1?0:1), (page==1?perPage+1:perPage));
		document.getElementById("list").style.display = "block";
		document.getElementById("pagination").style.display = "block";
		document.getElementById("full-article").style.display = "none";
		makePagination(category, page);
	}
	
	function doSearch(query) {
		//articles.sort("date", {order: "desc"});
		articles.filter();
		articles.search(query);
		articles.show(1, 10000);
		document.getElementById("list").style.display = "block";
		document.getElementById("pagination").style.display = "none";
		document.getElementById("full-article").style.display = "none";
		document.getElementById("search-input").value = query;
	}

	function makePagination(category, page) {
		var pagination = document.getElementById("pagination");
		if (pagination !== null) {
			pagination.innerHTML = "";
		} else {
			document.getElementById("content").innerHTML += '<div id="pagination" class="pagination"></div>';
			pagination = document.getElementById("pagination");
		}
		
		if (category == "accueil") {
			var total = articles.size();
		} else {
			var total = articles.get("category", category).length;
		}
		//console.log(total);
		
		href = location.href;
		pos = href.indexOf("/page/");
		if (pos >= 0) {
			href = href.substr(0, pos);
		} else if (category != "accueil") {
			href += "#";
			total = total - 1; // the extra article on the front page
		}
		if (href.substr(-1) != "/") href += "/";
		href += "page/";
		//console.log(href);
		//console.log(total);
		
		var links = "";
		if (page > 1) {
			// make prev link
			links += '<a href="' + href + (page - 1) + '" class="nav-prev">&lt; Articles précédents</a>';
		}
		if (page < total/perPage) {
			// make next link
			links += '&nbsp;<a href="' + href + (parseInt(page) + 1) + '" class="nav-next">Articles suivants &gt;</a>';
		}
		
		pagination.innerHTML = links;
	}

	navigate = function(noscroll) {
		var path = location.pathname + location.hash.substr(1);
		path = path.replace("//", "/");
		
		var query = location.search;
		if (path.indexOf("?") > 0) {
			query = path.split("?")[1];
			path = path.split("?")[0];
		}
		
		// deactivate category
		var links = menu.getElementsByTagName("a");
		for(i = 0, len = links.length; i < len; i++) {
			links[i].className = ""; // remove "active";
		}
		
		if (query) {
			var bits = query.substr(1).split("&");
			for(i = 0, len = bits.length; i < len; i++) {
				q = bits[i].split("=");
				if (q[0] == 'q') {
					query = decodeURIComponent(q[1]);
					break;
				}
			}
			//console.log("search for "+query);
			doSearch(query);
			return true;
		}
		//console.log("navigate to "+path);
		
		var bits = path.split("/");
		var article = false;
		var page = 1;
		//console.log(bits);
		
		var categ = bits[1];
		//console.log(categ);
		if (categ.match(/^[0-9]{4}$/)) {
			categ = "";
			article = true;
		}
		else if (categ == "membres") {
			article = true;
		}
		else if (categ == "page") { // accueil
			categ = "";
			page = bits.length > 2 ? bits[2] : 1;
		}
		else if (bits.length > 3) {
			if (bits[2] != "page") {//bits[2].match(/^[0-9]{4}$/)) { //category/YYYY/MM/DD/article-title/
				article = true;
			}
			else { //category/page/x
				page = bits.length > 3 ? bits[3] : 1;
			}
		}
		
		if (categ == "") categ = "accueil";
		//console.log("category="+categ);
		
		if (article) {
			//console.log("article");
			showArticle(path);
		}
		else {
			//console.log("show page "+page);
			showCategory(categ, page);
		}
		
		//console.log(categ);
		var menuLink = document.getElementById(categ);
		if (menuLink) menuLink.className = "active";
		
		if (noscroll !== true) {
			menu.scrollIntoView(true);
			// register page change with google analytics
			gaPageview();
		}
		
		return true;
	};
	window.addEventListener('popstate', navigate, false);

	// site navigation
	document.addEventListener("click", linkClick, true);
	function linkClick(e){
		var link = e.target;
		if(link.nodeType != 1 || link.tagName.toLowerCase() != "a") return true;
		var href = link.href;
		
		var local = false;
		// don't try treating these links
		if (href.substr(0, 7) == "mailto:") return true;
		if (href.substr(0, 4) == "tel:") return true;
		
		if (href.substr(0, 7) == "http://" || href.substr(0, 8) == "https://" || href.substr(0, 2) == "//") {
			var server = location.href.split('/')[2];
			if (href.indexOf(server) >= 0) local = true;
		}
		if (local) {
			if (href.split("?")[0].substr(-4).toLowerCase() == ".pdf") {
				if (!link.hasAttribute("target")) {
					link.setAttribute("target", "_blank");
					
					// Cancel action and regenerate a click - otherwise the target attribute isn't used
					if (document.createEvent) { // Firefox
						var event = document.createEvent("MouseEvents");
						event.initEvent("click", true, true);
						link.dispatchEvent(event);
					}	else if (link.click) { // IE
						link.click();
					} else {
						//console.log("no click method");
						return true;
					}
					e.preventDefault();
					return false;
				}
			} else {
				e.preventDefault();
				//$.scrollTo('#content', 800);
				history.pushState(null, null, href);
				navigate();
				return false;
			}
		} else {
			if (!link.hasAttribute("target")) {
				link.setAttribute("target", "_blank");
				
				// Cancel action and regenerate a click - otherwise the target attribute isn't used
				if (document.createEvent) { // Firefox
					var event = document.createEvent("MouseEvents");
					event.initEvent("click", true, true);
					link.dispatchEvent(event);
				}	else if (link.click) { // IE
					link.click();
				} else {
					//console.log("no click method");
					return true;
				}
				e.preventDefault();
				return false;
			}
		}
	};

	// give searches the full list
	document.getElementById("do-search").addEventListener("click", searchFullList, false);
	document.getElementById("search-input").addEventListener("keyup", searchFullList, false);
	
	function searchFullList(e) {
		if (e.type !== 'keyup' || e.which === 13) {
			var input = document.getElementById("search-input");
			input.className = ((input.value == "") ? "" : "active");
			// run search
			history.pushState(null, null, "/?q=" + encodeURIComponent(input.value));
			navigate();
		};
	};

})();

// Audio widget
(function(){
	var player = document.getElementById("audio-player");
	var progress = document.getElementById("audio-progress");
	var button = document.getElementById("playpause");
	var duration = 0;

	// control button
	button.addEventListener("click", playpause, false);
	function playpause() {
		if (player.paused) {
			player.play();
			button.style.backgroundPosition = "0% 100%";
		} else {
			player.pause();
			button.style.backgroundPosition = "0% 0%";
		}
	}

	// audio progress display
	player.addEventListener("canplaythrough", function () {
		duration = player.duration;
	}, false);

	player.addEventListener("timeupdate", updateProgress, false);
	function updateProgress() {
		if (duration == 0) duration = player.duration;
		var playPercent = 100 * (player.currentTime / duration);
		progress.style.backgroundPosition = (100 - playPercent) + "% 0%";
	};

	// navigation
	function play(which) {
		var list = document.getElementById("audio-list").children;
		var len = list.length;
		var current = undefined;
		for (i = 0; i < len; i++) {
			if (list[i].className == "playing") current = i;
		}
		if (current == undefined) return;
		if (which == "prev") {
			next = current - 1;
			if (next < 0) next = len - 1;
		} else {
			next = current + 1;
			if (next > len - 1) next = 0;
		}
		playpause();
		list[current].className = ""; // remove "playing"
		list[next].className = "playing";
		player.src = list[next].getElementsByClassName("audio-link")[0].href;
		playpause();
	}

	player.addEventListener("ended", function() {
		play("next");
	}, false);

	document.getElementById("audio-next").addEventListener("click", function(e) {
		play("next");
		return false;
	}, false);

	document.getElementById("audio-prev").addEventListener("click", function(e) {
		play("prev");
		return false;
	}, false);

	// seeking
	progress.addEventListener("click", function (e) {
		if(e.offsetX == undefined) { // this works for Firefox
			var xpos = e.pageX-progress.offsetLeft;
			if (obj = progress.offsetParent) {
				do {
					xpos -= obj.offsetLeft;
				} while (obj = obj.offsetParent);
			}
		} else {										 // works in Google Chrome
			var xpos = e.offsetX;
		}
		var percent = xpos / e.target.clientWidth;
		player.pause();
		player.currentTime = player.duration * percent;
		player.play();
		updateProgress();
	}, false);
	
	// visibility detection
	function getHiddenProp(){
    if ('hidden' in document) return 'hidden';
    
    var prefixes = ['webkit','moz','ms','o'];
    for (var i = 0; i < prefixes.length; i++){
			if ((prefixes[i] + 'Hidden') in document) 
				return prefixes[i] + 'Hidden';
    }

    return null;
	}
	function isHidden() {
    var prop = getHiddenProp();
    if (!prop) return false;
    
    return document[prop];
	}
	var visProp = getHiddenProp();
	if (visProp) var visEvent = visProp.replace(/[H|h]idden/,'') + 'visibilitychange';
	function visChange() {
		if (!isHidden()) {
			// play and remove visEvent
			playpause();
			document.removeEventListener(visEvent, visChange);
		}
	}

	if (!isHidden()) {
		playpause();
	} else { // use the property name to generate the prefixed event name
		document.addEventListener(visEvent, visChange);
	}
})();
