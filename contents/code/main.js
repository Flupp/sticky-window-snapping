/*****************************************************************************
 Sticky Window Snapping

 A Script for KWin - the KDE window manager

Copyright (C) 2013 Toni Dietze <sticky-window-snapping@derflupp.e4ward.com>

This program is free software; you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation; either version 2 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program.  If not, see <http://www.gnu.org/licenses/>.
*****************************************************************************/

(function () {
"use strict";

var config = {
	enabledUsually: true,
	ignoreMaximized: true,
	ignoreMinimized: false,
	ignoreShaded: true,
	ignoreBorderOfClientArea: true,
	liveUpdate: true,
	opacityOfSnapped: 0.8,
	opacityOfUnaffected: 0.2,
	threshold: 0
};
enabledCurrently = config.enabledUsually;

/****************************************************************************/

var snaps = [];
var ignoreds = [];
var firstClientStepUserMovedResized = false;
var resizedClientInfo = null;

function init() {
	loadConfig();
	enabledCurrently = config.enabledUsually;
	options.configChanged.connect(loadConfig);  // it is not documented, when this event is triggered; connecting nevertheless

	var clients = workspace.clientList();
	for (var i = 0; i < clients.length; i++) {
		connectClient(clients[i]);
	}
	workspace.clientAdded.connect(connectClient);
	workspace.clientRemoved.connect(clientRemoved);

	var shortcutPrefix = "KWin Script: Sticky Window Snapping: ";
	registerShortcut(
		shortcutPrefix + "enable/disable",
		shortcutPrefix + "enable/disable",
		"Meta+Shift+S",
		function () {
			config.enabledUsually = !config.enabledUsually;
			enabledCurrently = config.enabledUsually;
		}
	);
	registerShortcut(
		shortcutPrefix + "enable/disable temporarily",
		shortcutPrefix + "enable/disable temporarily",
		"Ctrl+Shift+S",
		function () { enabledCurrently = !enabledCurrently; }
	);
}

function loadConfig() {
	config.enabledUsually           = true == readConfig("enabledUsually"          ,       config.enabledUsually          );
	config.ignoreMaximized          = true == readConfig("ignoreMaximized"         ,       config.ignoreMaximized         );
	config.ignoreMinimized          = true == readConfig("ignoreMinimized"         ,       config.ignoreMinimized         );
	config.ignoreShaded             = true == readConfig("ignoreShaded"            ,       config.ignoreShaded            );
	config.ignoreBorderOfClientArea = true == readConfig("ignoreBorderOfClientArea",       config.ignoreBorderOfClientArea);
	config.liveUpdate               = true == readConfig("liveUpdate"              ,       config.liveUpdate              );
	config.opacityOfSnapped         = 0.01 *  readConfig("opacityOfSnapped"        , 100 * config.opacityOfSnapped        );
	config.opacityOfUnaffected      = 0.01 *  readConfig("opacityOfUnaffected"     , 100 * config.opacityOfUnaffected     );
	config.threshold                = 1    *  readConfig("threshold"               ,       config.threshold               );
}

function connectClient(client) {
	if (client.specialWindow) return;
	client.clientStartUserMovedResized.connect(clientStartUserMovedResized);
	if (config.liveUpdate)
		client.clientStepUserMovedResized.connect(clientStepUserMovedResized);
	client.clientFinishUserMovedResized.connect(clientFinishUserMovedResized);
}

function clientRemoved(client) {
	function checkArray(arr) {
		var i = 0;
		while (i < arr.length) {
			if (arr[i].client == client) {
				arr.splice(i, 1);
			} else {
				++i;
			}
		}
	}
	checkArray(snaps);
	checkArray(ignoreds);
}

function clientStartUserMovedResized(client) {
	if (!enabledCurrently) return;
	if (!client.resize) return;
	snaps.length = 0;
	ignoreds.length = 0;
	firstClientStepUserMovedResized = true
	var l1 = client.geometry.x;
	var r1 = client.geometry.width + l1;
	var t1 = client.geometry.y;
	var b1 = client.geometry.height + t1;
	var l1IsSticky = true, r1IsSticky = true, t1IsSticky = true, b1IsSticky = true;
	if (config.ignoreBorderOfClientArea) {
		var clientArea = workspace.clientArea(workspace.MaximizeArea, client);
		var l1IsSticky = Math.abs(clientArea.x                     - l1) > config.threshold;
		var r1IsSticky = Math.abs(clientArea.x + clientArea.width  - r1) > config.threshold;
		var t1IsSticky = Math.abs(clientArea.y                     - t1) > config.threshold;
		var b1IsSticky = Math.abs(clientArea.y + clientArea.height - b1) > config.threshold;
	}
	resizedClientInfo = { lOrig : l1   , rOrig : r1   , tOrig : t1   , bOrig : b1
	                    , lMoved: false, rMoved: false, tMoved: false, bMoved: false };
	var clients = workspace.clientList();
	for (var i = 0; i < clients.length; i++) {
		var c = clients[i];
		var g = c.geometry;
		var l2 = g.x;
		var r2 = g.width + l2;
		var t2 = g.y;
		var b2 = g.height + t2;

		// filter invisible unaffected windows
		if (c == client) continue;
		if (c.specialWindow) continue;
		if (c.desktop !== workspace.currentDesktop && !c.onAllDesktops) continue;
		if (c.screen !== client.screen) continue;
		if (config.ignoreMinimized && c.minimized) continue;
		if (c.activities.length !== 0 && c.activities.indexOf(workspace.currentActivity) === -1) continue;

		function addIgnored(client) {
			if (config.opacityOfUnaffected === 1) return;
			ignored = {
				client: client,
				opacity: 1,
				originalOpacity: client.opacity
			};
			if (!config.liveUpdate) {
				ignored.opacity = config.opacityOfUnaffected;
				client.opacity = config.opacityOfUnaffected * client.opacity;
			}
			ignoreds.push(ignored);
		};

		// filter potentially visible unaffected windows
		if (  c.fullScreen
		   || config.ignoreShaded && c.shade
		   || config.ignoreMaximized && shallowEquals(g, workspace.clientArea(workspace.MaximizeArea, c))
		) {
			addIgnored(c);
			continue;
		};

		lrDist = Math.abs(l1 - r2);
		llDist = Math.abs(l1 - l2);
		rlDist = Math.abs(r1 - l2);
		rrDist = Math.abs(r1 - r2);
		tbDist = Math.abs(t1 - b2);
		ttDist = Math.abs(t1 - t2);
		btDist = Math.abs(b1 - t2);
		bbDist = Math.abs(b1 - b2);
		var snap = {
			lr:  l1IsSticky  &&  lrDist <= config.threshold  &&  lrDist < llDist,
			ll:  l1IsSticky  &&  llDist <= config.threshold  &&  llDist < lrDist,
			rl:  r1IsSticky  &&  rlDist <= config.threshold  &&  rlDist < rrDist,
			rr:  r1IsSticky  &&  rrDist <= config.threshold  &&  rrDist < rlDist,
			tb:  t1IsSticky  &&  tbDist <= config.threshold  &&  tbDist < ttDist,
			tt:  t1IsSticky  &&  ttDist <= config.threshold  &&  ttDist < tbDist,
			bt:  b1IsSticky  &&  btDist <= config.threshold  &&  btDist < bbDist,
			bb:  b1IsSticky  &&  bbDist <= config.threshold  &&  bbDist < btDist,
			client: c,
			minimizeWhenFinished: false,
			opacity: 1,
			originalOpacity: c.opacity,
			originalGeometry: c.geometry
		};
		if (snap.lr || snap.ll || snap.rl || snap.rr || snap.tb || snap.tt || snap.bt || snap.bb) {
			if (!config.liveUpdate) {
				if (c.minimized) {
					snap.minimizeWhenFinished = true;
					c.minimized = false;
				}
				snap.opacity = config.opacityOfSnapped;
				c.opacity = config.opacityOfSnapped * c.opacity;
			}
			snaps.push(snap);
		} else {
			addIgnored(c);
		}
	}
}

function clientStepUserMovedResized(client, rect) {
	if (resizedClientInfo === null) return;
	if (!client.resize) return;
	clientResized(client, rect);
	firstClientStepUserMovedResized = false;
}

function clientFinishUserMovedResized(client) {
	enabledCurrently = config.enabledUsually;
	if (resizedClientInfo === null) return;
	firstClientStepUserMovedResized = false;
	clientResized(client, client.geometry);
	for (var i = 0; i < snaps.length; ++i) {
		if (snaps[i].minimizeWhenFinished) {
			snaps[i].client.minimized = true;
		}
		if (snaps[i].opacity !== 1) {
			snaps[i].client.opacity = snaps[i].originalOpacity;
		}
	}
	for (var i = 0; i < ignoreds.length; ++i) {
		if (ignoreds[i].opacity !== 1) {
			ignoreds[i].client.opacity = ignoreds[i].originalOpacity;
		}
	}
	snaps.length = 0;
	resizedClientInfo = null;
}

function clientResized(client, rect) {
	resizedClientInfo.lMoved |= resizedClientInfo.lOrig !== rect.x;
	resizedClientInfo.rMoved |= resizedClientInfo.rOrig !== rect.x + rect.width;
	resizedClientInfo.tMoved |= resizedClientInfo.tOrig !== rect.y;
	resizedClientInfo.bMoved |= resizedClientInfo.bOrig !== rect.y + rect.height;
	for (var i = 0; i < snaps.length; ++i) {
		var s = snaps[i];
		var og = s.originalGeometry;
		var g = {x: og.x, y: og.y, width: og.width, height: og.height};
		if (resizedClientInfo.lMoved && s.lr) moveRto(g, rect.x);
		if (resizedClientInfo.lMoved && s.ll) moveLto(g, rect.x);
		if (resizedClientInfo.rMoved && s.rl) moveLto(g, rect.x + rect.width);
		if (resizedClientInfo.rMoved && s.rr) moveRto(g, rect.x + rect.width);
		if (resizedClientInfo.tMoved && s.tb) moveBto(g, rect.y);
		if (resizedClientInfo.tMoved && s.tt) moveTto(g, rect.y);
		if (resizedClientInfo.bMoved && s.bt) moveTto(g, rect.y + rect.height);
		if (resizedClientInfo.bMoved && s.bb) moveBto(g, rect.y + rect.height);
		if (setGeometry(s.client, g, s.lr || s.rr, s.tb || s.bb)) {
			if (!s.minimizeWhenFinished && s.client.minimized) {
				s.minimizeWhenFinished = true;
				s.client.minimized = false;
			}
			if (s.opacity !== config.opacityOfSnapped) {
				s.opacity        = config.opacityOfSnapped;
				s.client.opacity = config.opacityOfSnapped * s.originalOpacity;
			}
		} else if (firstClientStepUserMovedResized) {
			if (snaps[i].opacity !== config.opacityOfUnaffected) {
				snaps[i].opacity        = config.opacityOfUnaffected;
				snaps[i].client.opacity = config.opacityOfUnaffected * snaps[i].originalOpacity;
			}
		}
	}
	if (firstClientStepUserMovedResized) {
		for (var i = 0; i < ignoreds.length; ++i) {
			if (ignoreds[i].opacity !== config.opacityOfUnaffected) {
				ignoreds[i].opacity        = config.opacityOfUnaffected;
				ignoreds[i].client.opacity = config.opacityOfUnaffected * ignoreds[i].originalOpacity;
			}
		}
	}
}

function moveLto(rect, x) {
	rect.width += rect.x - x;
	rect.x = x;
}

function moveRto(rect, x) {
	rect.width = x - rect.x;
}

function moveTto(rect, y) {
	rect.height += rect.y - y;
	rect.y = y;
}

function moveBto(rect, y) {
	rect.height = y - rect.y;
}

/* returns true if the client’s geometry is changed, otherwise returns false */
function setGeometry(client, geometry, pinRightInsteadLeft, pinBottomInsteadTop) {
	var minSize = {
		w: Math.max(client.minSize.w, Math.min(50, client.geometry.width)),
		h: Math.max(client.minSize.h, Math.min(50, client.geometry.height))
	};

	function applySizeConstraints() {
		var old = geometry.width;
		if (geometry.width  <        minSize.w) geometry.width  =        minSize.w;
		if (geometry.width  > client.maxSize.w) geometry.width  = client.maxSize.w;
		if (pinRightInsteadLeft) geometry.x = geometry.x + old - geometry.width;

		old = geometry.height;
		if (geometry.height <        minSize.h) geometry.height =        minSize.h;
		if (geometry.height > client.maxSize.h) geometry.height = client.maxSize.h;
		if (pinBottomInsteadTop) geometry.y = geometry.y + old - geometry.height;
	}

	applySizeConstraints();
	var ca = workspace.clientArea(workspace.MaximizeArea, client);
	ca.l = Math.min(ca.x, client.geometry.x);
	ca.t = Math.min(ca.y, client.geometry.y);
	ca.r = Math.max(ca.x + ca.width , client.geometry.x + client.geometry.width );
	ca.b = Math.max(ca.y + ca.height, client.geometry.y + client.geometry.height);
	if (geometry.x                   < ca.l) { moveLto(geometry, ca.l); pinRightInsteadLeft = false; }
	if (geometry.y                   < ca.t) { moveTto(geometry, ca.t); pinBottomInsteadTop = false; }
	if (geometry.x + geometry.width  > ca.r) { moveRto(geometry, ca.r); pinRightInsteadLeft = true;  }
	if (geometry.y + geometry.height > ca.b) { moveBto(geometry, ca.b); pinBottomInsteadTop = true;  }
	applySizeConstraints();

	if (shallowEquals(client.geometry, geometry)) {
		return false;
	} else {
		client.geometry = geometry;
		return true;
	}
}

function shallowEquals(x, y) {
	if (Object.keys(x).length !== Object.keys(y).length) {
		return false;
	}
	for (var p in x) {
		if (x[p] !== y[p]) {
			return false;
		}
	}
	return true;
}

init();

})();
