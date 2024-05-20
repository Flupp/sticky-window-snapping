/*****************************************************************************
 Sticky Window Snapping

 A Script for KWin - the KDE window manager

Copyright (C) 2024 Toni Dietze <sticky-window-snapping@derflupp.e4ward.com>

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
	ignoreNoncurrentDesktops: true,
	ignoreBorderOfClientArea: true,
	liveUpdate: true,
	offsetX: 0,
	offsetY: 0,
	opacityOfSnapped: 0.8,
	opacityOfUnaffected: 0.2,
	shakeEnabled: true,
	shakeThreshold: 200,
	shakeTurns: 4,
	threshold: 0
};
var enabledCurrently = config.enabledUsually;

/****************************************************************************/
// backwards compatibility layer

var compat
	= (workspace.windowList !== undefined) ? {  // Plasma 6
		workspace_windowList                 : function(    ) { return workspace.windowList(); },
		workspace_windowAdded_connect        : function(   f) { return workspace.windowAdded          .connect(f); },
		workspace_windowRemoved_connect      : function(   f) { return workspace.windowRemoved        .connect(f); },
		interactiveMoveResizeStarted_connect : function(w, f) { return w.interactiveMoveResizeStarted .connect(function( ) { return f(w   ); }); },
		interactiveMoveResizeStepped_connect : function(w, f) { return w.interactiveMoveResizeStepped .connect(function(r) { return f(w, r); }); },
		interactiveMoveResizeFinished_connect: function(w, f) { return w.interactiveMoveResizeFinished.connect(function( ) { return f(w   ); }); },
		Window_frameGeometry                 : function(w   ) { return w.frameGeometry; },
		Window_frameGeometry_set             : function(w, g) { return w.frameGeometry = g; },
		Window_onCurrentDesktop              : function(w   ) {
			if (w.onAllDesktops)
				return true;
			for (var i = 0; i < w.desktops.length; i++)
				if (w.desktops[i].id === workspace.currentDesktop.id)
					return true;
			return false;
		}
	}
	: (workspace.clientList !== undefined) ? {  // Plasma 5
		workspace_windowList                 : function(    ) { return workspace.clientList(); },
		workspace_windowAdded_connect        : function(   f) { return workspace.clientAdded         .connect(f); },
		workspace_windowRemoved_connect      : function(   f) { return workspace.clientRemoved       .connect(f); },
		interactiveMoveResizeStarted_connect : function(w, f) { return w.clientStartUserMovedResized .connect(f); },
		interactiveMoveResizeStepped_connect : function(w, f) { return w.clientStepUserMovedResized  .connect(f); },
		interactiveMoveResizeFinished_connect: function(w, f) { return w.clientFinishUserMovedResized.connect(f); },
		Window_frameGeometry                 : function(w   ) { return w.geometry; },
		Window_frameGeometry_set             : function(w, g) { return w.geometry = g; },
		Window_onCurrentDesktop              : function(w   ) { return w.onAllDesktops || w.desktop === workspace.currentDesktop; }
	}
	: null;

if (compat === null) {
	print("Sticky Window Snapping is incompatible with this version of KWin.");
	return;
}

// compatibility with very old KWin (presumably KWin < 5.22)
compat.Math_sign
	= Math.sign !== undefined
	? Math.sign
	: function(x) { return x > 0 ? 1 : x < 0 ? -1 : x; };

/****************************************************************************/

var snaps = [];
var ignoreds = [];
var firstClientStepUserMovedResized = false;
var resizedClientInfo = null;

function init() {
	loadConfig();
	enabledCurrently = config.enabledUsually;
	options.configChanged.connect(loadConfig);  // it is not documented, when this event is triggered; connecting nevertheless

	var clients = compat.workspace_windowList();
	for (var i = 0; i < clients.length; i++) {
		windowAdded(clients[i]);
	}
	compat.workspace_windowAdded_connect(windowAdded);
	compat.workspace_windowRemoved_connect(windowRemoved);

	var shortcutPrefix = "KWin Script: Sticky Window Snapping: ";
	registerShortcut(
		shortcutPrefix + "enable/disable",
		shortcutPrefix + "enable/disable",
		"",
		function () {
			config.enabledUsually = !config.enabledUsually;
			enabledCurrently = config.enabledUsually;
		}
	);
	registerShortcut(
		shortcutPrefix + "enable/disable temporarily",
		shortcutPrefix + "enable/disable temporarily",
		"",
		function () { enabledCurrently = !enabledCurrently; }
	);
}

function loadConfig() {
	config.enabledUsually           = true == readConfig("enabledUsually"          ,       config.enabledUsually          );
	config.ignoreMaximized          = true == readConfig("ignoreMaximized"         ,       config.ignoreMaximized         );
	config.ignoreMinimized          = true == readConfig("ignoreMinimized"         ,       config.ignoreMinimized         );
	config.ignoreShaded             = true == readConfig("ignoreShaded"            ,       config.ignoreShaded            );
	config.ignoreNoncurrentDesktops = true == readConfig("ignoreNoncurrentDesktops",       config.ignoreNoncurrentDesktops);
	config.ignoreBorderOfClientArea = true == readConfig("ignoreBorderOfClientArea",       config.ignoreBorderOfClientArea);
	config.liveUpdate               = true == readConfig("liveUpdate"              ,       config.liveUpdate              );
	config.opacityOfSnapped         = 0.01 *  readConfig("opacityOfSnapped"        , 100 * config.opacityOfSnapped        );
	config.opacityOfUnaffected      = 0.01 *  readConfig("opacityOfUnaffected"     , 100 * config.opacityOfUnaffected     );
	config.shakeEnabled             = true == readConfig("shakeEnabled"            ,       config.shakeEnabled            );
	config.shakeThreshold           = 1    *  readConfig("shakeThreshold"          ,       config.shakeThreshold          );
	config.shakeTurns               = 1    *  readConfig("shakeTurns"              ,       config.shakeTurns              );
	config.threshold                = 1    *  readConfig("threshold"               ,       config.threshold               );
	config.offsetX                  = 1    *  readConfig("offsetX"                 ,       config.offsetX                 );
	config.offsetY                  = 1    *  readConfig("offsetY"                 ,       config.offsetY                 );
}

function windowAdded(client) {
	if (client.specialWindow) return;
	compat.interactiveMoveResizeStarted_connect(client, interactiveMoveResizeStarted);
	if (config.liveUpdate || config.shakeEnabled)
		compat.interactiveMoveResizeStepped_connect(client, interactiveMoveResizeStepped);
	compat.interactiveMoveResizeFinished_connect(client, interactiveMoveResizeFinished);
}

function windowRemoved(client) {
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

function interactiveMoveResizeStarted(client) {
	function addIgnored(client) {
		if (config.opacityOfUnaffected === 1) return;
		var ignored = {
			client: client,
			opacity: 1,
			originalOpacity: client.opacity
		};
		if (!config.liveUpdate) {
			ignored.opacity = config.opacityOfUnaffected;
			client.opacity = config.opacityOfUnaffected * client.opacity;
		}
		ignoreds.push(ignored);
	}

	if (!enabledCurrently) return;
	if (!client.resize) return;
	snaps.length = 0;
	ignoreds.length = 0;
	firstClientStepUserMovedResized = true
	var g1 = compat.Window_frameGeometry(client);
	var l1 = g1.x;
	var r1 = g1.width + l1;
	var t1 = g1.y;
	var b1 = g1.height + t1;
	var l1IsSticky = true, r1IsSticky = true, t1IsSticky = true, b1IsSticky = true;
	if (config.ignoreBorderOfClientArea) {
		var clientArea = workspace.clientArea(KWin.PlacementArea, client);
		l1IsSticky = Math.abs(clientArea.x                     - l1) > config.threshold;
		r1IsSticky = Math.abs(clientArea.x + clientArea.width  - r1) > config.threshold;
		t1IsSticky = Math.abs(clientArea.y                     - t1) > config.threshold;
		b1IsSticky = Math.abs(clientArea.y + clientArea.height - b1) > config.threshold;
	}
	resizedClientInfo = { lOrig : l1   , rOrig : r1   , tOrig : t1   , bOrig : b1
	                    , lMoved: false, rMoved: false, tMoved: false, bMoved: false
	                    , wShake: {count: 0, direction: 0, val: g1.width , turnVal: g1.width }
	                    , hShake: {count: 0, direction: 0, val: g1.height, turnVal: g1.height} };
	var clients = compat.workspace_windowList();
	for (var i = 0; i < clients.length; i++) {
		var c = clients[i];
		var g2 = compat.Window_frameGeometry(c);
		var l2 = g2.x;
		var r2 = g2.width + l2;
		var t2 = g2.y;
		var b2 = g2.height + t2;

		// filter invisible unaffected windows
		if (c == client) continue;
		if (c.specialWindow) continue;
		if (config.ignoreNoncurrentDesktops && !compat.Window_onCurrentDesktop(c)) continue;
		if (c.screen !== client.screen) continue;
		if (config.ignoreMinimized && c.minimized) continue;
		if (c.activities.length !== 0 && c.activities.indexOf(workspace.currentActivity) === -1) continue;

		// filter potentially visible unaffected windows
		if (  c.fullScreen
		   || config.ignoreShaded && c.shade
		   || config.ignoreMaximized && rectEquals(g2, workspace.clientArea(KWin.MaximizeArea, c))
		) {
			addIgnored(c);
			continue;
		}

		var lrDist = Math.abs(l1 - r2 - config.offsetX);
		var llDist = Math.abs(l1 - l2                 );
		var rlDist = Math.abs(r1 - l2 + config.offsetX);
		var rrDist = Math.abs(r1 - r2                 );
		var tbDist = Math.abs(t1 - b2 - config.offsetY);
		var ttDist = Math.abs(t1 - t2                 );
		var btDist = Math.abs(b1 - t2 + config.offsetY);
		var bbDist = Math.abs(b1 - b2                 );
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
			originalGeometry: shallowCopy(g2),
			requestedGeometry: shallowCopy(g2)
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

function finish(client, abort) {
	enabledCurrently = config.enabledUsually;
	if (resizedClientInfo === null) return;
	firstClientStepUserMovedResized = false;
	for (var i = 0; i < snaps.length; ++i) {
		if (snaps[i].minimizeWhenFinished) {
			snaps[i].client.minimized = true;
		}
		if (snaps[i].opacity !== 1) {
			snaps[i].client.opacity = snaps[i].originalOpacity;
		}
		if (abort) {
			compat.Window_frameGeometry_set(snaps[i].client, snaps[i].originalGeometry);
		}
	}
	snaps.length = 0;
	for (i = 0; i < ignoreds.length; ++i) {
		if (ignoreds[i].opacity !== 1) {
			ignoreds[i].client.opacity = ignoreds[i].originalOpacity;
		}
	}
	ignoreds.length = 0;
	resizedClientInfo = null;
}

function updateShake(shake, val) {
	if (shake.turnVal < val) {
		if (shake.val < val)
			shake.val = val
	} else if (shake.turnVal > val) {
		if (shake.val > val)
			shake.val = val
	}
	var distance = shake.val - val;
	var direction = compat.Math_sign(distance);
	if (direction !== shake.direction && Math.abs(distance) >= config.shakeThreshold) {
		shake.turnVal = shake.val;
		shake.val = val
		shake.count += 1;
		shake.direction = direction;
	}
	return config.shakeEnabled && shake.count >= config.shakeTurns;
}

function interactiveMoveResizeStepped(client, rect) {
	if (resizedClientInfo === null) return;
	if (!client.resize) return;

	if (  updateShake(resizedClientInfo.wShake, rect.width)
	   || updateShake(resizedClientInfo.hShake, rect.height)) {
		finish(client, true);
		return;
	}

	if (config.liveUpdate)
		clientResized(client, rect);

	firstClientStepUserMovedResized = false;
}

function interactiveMoveResizeFinished(client) {
	finish(client, false);
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
		if (resizedClientInfo.lMoved && s.lr) moveRto(g, rect.x               - config.offsetX);
		if (resizedClientInfo.lMoved && s.ll) moveLto(g, rect.x                               );
		if (resizedClientInfo.rMoved && s.rl) moveLto(g, rect.x + rect.width  + config.offsetX);
		if (resizedClientInfo.rMoved && s.rr) moveRto(g, rect.x + rect.width                  );
		if (resizedClientInfo.tMoved && s.tb) moveBto(g, rect.y               - config.offsetY);
		if (resizedClientInfo.tMoved && s.tt) moveTto(g, rect.y                               );
		if (resizedClientInfo.bMoved && s.bt) moveTto(g, rect.y + rect.height + config.offsetY);
		if (resizedClientInfo.bMoved && s.bb) moveBto(g, rect.y + rect.height                 );
		if (setGeometry(s, g, s.lr || s.rr, s.tb || s.bb)) {
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
		for (i = 0; i < ignoreds.length; ++i) {
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

function rectEquals(a, b) {
	return a.x      === b.x
	    && a.y      === b.y
	    && a.width  === b.width
	    && a.height === b.height;
}

/* Rename properties of QSize to `w` and `h`.
 *
 * The property names of QSize changed with KWin 5.22.
 */
function sanitizeQSize(size) {
	if ("width" in size && "height" in size) {  // KWin ≥ 5.22
		return {w: size.width, h: size.height};
	} else if ("w" in size && "h" in size) {    // KWin < 5.22
		return size;
	} else {
		print("sanitizeQSize: Argument does not have the expected properties.");
		return undefined;
	}
}

/* returns true if the client’s geometry is changed, otherwise returns false */
function setGeometry(snap, geometry, pinRightInsteadLeft, pinBottomInsteadTop) {
	var client = snap.client;
	var oldGeometry = snap.originalGeometry;
	var minSize = {
		w: Math.max(sanitizeQSize(client.minSize).w, Math.min(50, oldGeometry.width)),
		h: Math.max(sanitizeQSize(client.minSize).h, Math.min(50, oldGeometry.height))
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
	var ca = workspace.clientArea(KWin.PlacementArea, client);
	// each updated border position is restricted to the client area except it already lies outside of it
	var left   = Math.min(ca.x, oldGeometry.x);
	var top    = Math.min(ca.y, oldGeometry.y);
	var right  = Math.max(ca.x + ca.width , oldGeometry.x + oldGeometry.width );
	var bottom = Math.max(ca.y + ca.height, oldGeometry.y + oldGeometry.height);
	if (geometry.x                   < left  ) { moveLto(geometry, left  ); pinRightInsteadLeft = false; }
	if (geometry.y                   < top   ) { moveTto(geometry, top   ); pinBottomInsteadTop = false; }
	if (geometry.x + geometry.width  > right ) { moveRto(geometry, right ); pinRightInsteadLeft = true;  }
	if (geometry.y + geometry.height > bottom) { moveBto(geometry, bottom); pinBottomInsteadTop = true;  }
	applySizeConstraints();

	if (rectEquals(snap.requestedGeometry, geometry)) {
		return false;
	} else {
		snap.requestedGeometry = geometry;
		compat.Window_frameGeometry_set(client, geometry);
		return true;
	}
}

function shallowCopy(obj) {
	if ("assign" in Object) {  // KWin ≥ 5.22
		return Object.assign({}, obj);
	} else {  // KWin < 5.22
		var ret = {};
		for (var p in obj) {
			ret[p] = obj[p];
		}
		return ret;
	}
}

init();

})();
