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

var config =
	{ enabledCurrently : true
	, enabledUsually : true
	, liveUpdate : true
	, opacityOfSnapped : 0.75
	};

/****************************************************************************/

var snaps =
	{ ll : []
	, lr : []
	, rl : []
	, rr : []
	, tt : []
	, tb : []
	, bt : []
	, bb : []
	};

init();

function init() {
	var clients = workspace.clientList(); 
	for (var i = 0; i < clients.length; i++) {
		connectClient(clients[i]);
	}
	workspace.clientAdded.connect(connectClient);
	workspace.clientRemoved.connect(clientRemoved);

	var shortcutPrefix = "KWin Script: Sticky Window Snapping: ";
	registerShortcut
		( shortcutPrefix + "enable/disable"
		, shortcutPrefix + "enable/disable"
		, "Meta+Shift+S"
		, function () {
				config.enabledUsually = !config.enabledUsually;
				config.enabledCurrently = config.enabledUsually;
			}
		)
	registerShortcut
		( shortcutPrefix + "enable/disable temporarily"
		, shortcutPrefix + "enable/disable temporarily"
		, "Ctrl+Shift+S"
		, function () { config.enabledCurrently = !config.enabledCurrently; }
		)
}

function connectClient(client) {
	if (client.specialWindow) return;
	client.clientStartUserMovedResized.connect(clientStartUserMovedResized);
	if (config.liveUpdate)
		client.clientStepUserMovedResized.connect(clientStepUserMovedResized);
	client.clientFinishUserMovedResized.connect(clientFinishUserMovedResized);
	print("connected to " + client.caption);
}

function clientRemoved(client) {
	for (var snap in snaps) {
		for (;;) {
			var i = snaps[snap].indexOf(client);
			if (i == -1)
				break;
			else
				snaps[snap].splice(i, 1);
		}
	}
}

function clientStartUserMovedResized(client) {
	if (!config.enabledCurrently) return;
	if (!client.resize) return;
	clear();
	var l = client.geometry.x;
	var r = client.geometry.width + l;
	var t = client.geometry.y;
	var b = client.geometry.height + t;
	var clients = workspace.clientList();
	for (var i = 0; i < clients.length; i++) {
		if (clients[i] == client) continue;
		if (clients[i].specialWindow) continue;
		if (clients[i].fullScreen) continue;
		if (clients[i].desktop != workspace.currentDesktop) continue;
		if (clients[i].activities.length != 0 && clients[i].activities.indexOf(workspace.currentActivity) == -1) continue;
		var g = clients[i].geometry;
		if (l == g.x + g.width ) snaps.lr.push(clients[i]);
		if (l == g.x           ) snaps.ll.push(clients[i]);
		if (r == g.x           ) snaps.rl.push(clients[i]);
		if (r == g.x + g.width ) snaps.rr.push(clients[i]);
		if (t == g.y + g.height) snaps.tb.push(clients[i]);
		if (t == g.y           ) snaps.tt.push(clients[i]);
		if (b == g.y           ) snaps.bt.push(clients[i]);
		if (b == g.y + g.height) snaps.bb.push(clients[i]);
	}
	if (config.opacityOfSnapped != 1) {
		forallSnaps(function (c) { c.originalOpacity = c.opacity; });
		forallSnaps(function (c) { c.opacity = config.opacityOfSnapped * c.originalOpacity; });
	}
}

function clientStepUserMovedResized(client, rect) {
	if (!client.resize) return;
	clientResized(client, rect);
}

function clientFinishUserMovedResized(client) {
	clientResized(client, client.geometry);
	if (config.opacityOfSnapped != 1) {
		forallSnaps(function (c) { c.opacity = c.originalOpacity; });
	}
	config.enabledCurrently = config.enabledUsually;
	clear();
}

function clientResized(client, rect) {
	for (var i = 0; i < snaps.lr.length; ++i) moveRto(snaps.lr[i], rect.x, false);
	for (var i = 0; i < snaps.ll.length; ++i) moveLto(snaps.ll[i], rect.x, true);
	for (var i = 0; i < snaps.rl.length; ++i) moveLto(snaps.rl[i], rect.x + rect.width, true);
	for (var i = 0; i < snaps.rr.length; ++i) moveRto(snaps.rr[i], rect.x + rect.width, false);
	for (var i = 0; i < snaps.tb.length; ++i) moveBto(snaps.tb[i], rect.y, false);
	for (var i = 0; i < snaps.tt.length; ++i) moveTto(snaps.tt[i], rect.y, true);
	for (var i = 0; i < snaps.bt.length; ++i) moveTto(snaps.bt[i], rect.y + rect.height, true);
	for (var i = 0; i < snaps.bb.length; ++i) moveBto(snaps.bb[i], rect.y + rect.height, false);
}

function clear() {
	for (var snap in snaps) {
		snaps[snap].length = 0;
	}
}

function moveLto(client, x, pinRightInsteadLeft) {
	var rect = client.geometry;
	rect.x = x;
	rect.width = client.geometry.width + client.geometry.x - x;
	setGeometry(client, rect, pinRightInsteadLeft, false);
}

function moveRto(client, x, pinRightInsteadLeft) {
	var rect = client.geometry;
	rect.width = x - client.geometry.x;
	setGeometry(client, rect, pinRightInsteadLeft, false);
}

function moveTto(client, y, pinBottomInsteadTop) {
	var rect = client.geometry;
	rect.y = y;
	rect.height = client.geometry.height + client.geometry.y - y;
	setGeometry(client, rect, false, pinBottomInsteadTop);
}

function moveBto(client, y, pinBottomInsteadTop) {
	rect = client.geometry;
	rect.height = y - client.geometry.y;
	setGeometry(client, rect, false, pinBottomInsteadTop);
}

function setGeometry(client, geometry, pinRightInsteadLeft, pinBottomInsteadTop) {
	var old = geometry.width;
	minSize = client.minSize;
	if (minSize.w < 50) minSize.w = 50;
	if (minSize.h < 50) minSize.h = 50;
	if (geometry.width  <        minSize.w) geometry.width  =        minSize.w;
	if (geometry.width  > client.maxSize.w) geometry.width  = client.maxSize.w;
	if (pinRightInsteadLeft) geometry.x = geometry.x + old - geometry.width;
	old = geometry.height;
	if (geometry.height <        minSize.h) geometry.height =        minSize.h;
	if (geometry.height > client.maxSize.h) geometry.height = client.maxSize.h;
	if (pinBottomInsteadTop) geometry.y = geometry.y + old - geometry.height;
	if (client.geometry != geometry) client.geometry = geometry;
}

function forallSnaps(f) {
	for (var snap in snaps) {
		for (var i = 0; i < snaps[snap].length; ++i) {
			f(snaps[snap][i]);
		}
	}
}
