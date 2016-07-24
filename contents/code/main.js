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
	enabledCurrently: true,
	enabledUsually: true,
	ignoreMaximized: true,
	ignoreShaded: true,
	liveUpdate: true,
	opacityOfSnapped: 0.75
};

/****************************************************************************/

var snaps = [];

function init() {
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
			config.enabledCurrently = config.enabledUsually;
		}
	);
	registerShortcut(
		shortcutPrefix + "enable/disable temporarily",
		shortcutPrefix + "enable/disable temporarily",
		"Ctrl+Shift+S",
		function () { config.enabledCurrently = !config.enabledCurrently; }
	);
}

function connectClient(client) {
	if (client.specialWindow) return;
	client.clientStartUserMovedResized.connect(clientStartUserMovedResized);
	if (config.liveUpdate)
		client.clientStepUserMovedResized.connect(clientStepUserMovedResized);
	client.clientFinishUserMovedResized.connect(clientFinishUserMovedResized);
}

function clientRemoved(client) {
	var i = 0;
	while (i < snaps.length) {
		if (snaps[i].client === client) {
			snaps.splice(i, 1);
		} else {
			++i;
		}
	}
}

function clientStartUserMovedResized(client) {
	if (!config.enabledCurrently) return;
	if (!client.resize) return;
	snaps.length = 0;
	var l1 = client.geometry.x;
	var r1 = client.geometry.width + l1;
	var t1 = client.geometry.y;
	var b1 = client.geometry.height + t1;
	var clients = workspace.clientList();
	for (var i = 0; i < clients.length; i++) {
		var c = clients[i];
		var g = c.geometry;
		var l2 = g.x;
		var r2 = g.width + l2;
		var t2 = g.y;
		var b2 = g.height + t2;

		if (c == client) continue;
		if (c.specialWindow) continue;
		if (c.fullScreen) continue;
		if (c.desktop !== workspace.currentDesktop) continue;
		if (c.screen !== client.screen) continue;
		if (config.ignoreShaded && c.shade) continue;
		if (config.ignoreMaximized && shallowEquals(g, workspace.clientArea(workspace.MaximizeArea, c))) continue;
		if (c.activities.length !== 0 && c.activities.indexOf(workspace.currentActivity) === -1) continue;

		var snap = {
			lr: l1 === r2,
			ll: l1 === l2,
			rl: r1 === l2,
			rr: r1 === r2,
			tb: t1 === b2,
			tt: t1 === t2,
			bt: b1 === t2,
			bb: b1 === b2,
			client: c,
			originalGeometry: c.geometry
		};
		if (snap.lr || snap.ll || snap.rl || snap.rr || snap.tb || snap.tt || snap.bt || snap.bb) {
			snaps.push(snap);
			if (config.opacityOfSnapped !== 1) {
				snap.originalOpacity = c.opacity;
				c.opacity = config.opacityOfSnapped * c.opacity;
			}
		}
	}
}

function clientStepUserMovedResized(client, rect) {
	if (!client.resize) return;
	clientResized(client, rect);
}

function clientFinishUserMovedResized(client) {
	clientResized(client, client.geometry);
	for (var i = 0; i < snaps.length; ++i) {
		if (snaps[i].originalOpacity !== undefined) {
			snaps[i].client.opacity = snaps[i].originalOpacity;
		}
	}
	config.enabledCurrently = config.enabledUsually;
	snaps.length = 0;
}

function clientResized(client, rect) {
	for (var i = 0; i < snaps.length; ++i) {
		var s = snaps[i];
		var og = s.originalGeometry;
		var g = {x: og.x, y: og.y, width: og.width, height: og.height};
		if (s.lr) moveRto(g, rect.x);
		if (s.ll) moveLto(g, rect.x);
		if (s.rl) moveLto(g, rect.x + rect.width);
		if (s.rr) moveRto(g, rect.x + rect.width);
		if (s.tb) moveBto(g, rect.y);
		if (s.tt) moveTto(g, rect.y);
		if (s.bt) moveTto(g, rect.y + rect.height);
		if (s.bb) moveBto(g, rect.y + rect.height);
		setGeometry(s.client, g, s.lr || s.rr, s.tb || s.bb);
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
	if (geometry.x < ca.x) { moveLto(geometry, ca.x); pinRightInsteadLeft = false; }
	if (geometry.y < ca.y) { moveTto(geometry, ca.y); pinBottomInsteadTop = false; }
	if (geometry.x + geometry.width  > ca.x + ca.width ) { moveRto(geometry, ca.x + ca.width ); pinRightInsteadLeft = true; }
	if (geometry.y + geometry.height > ca.y + ca.height) { moveBto(geometry, ca.y + ca.height); pinBottomInsteadTop = true; }
	applySizeConstraints();

	if (!shallowEquals(client.geometry, geometry)) client.geometry = geometry;
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
