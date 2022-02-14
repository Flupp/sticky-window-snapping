#!/usr/bin/env bash

set -Ceux

sed --in-place 's/^X-KDE-ConfigModule=/X-KDE-Library=/g'  \
	~/.local/share/kwin/scripts/sticky-window-snapping/metadata.desktop

mkdir --parents --verbose ~/.local/share/kservices5/

ln --relative --symbolic --verbose  \
	~/.local/share/kwin/scripts/sticky-window-snapping/metadata.desktop  \
	~/.local/share/kservices5/kwin-script-sticky-window-snapping.desktop
