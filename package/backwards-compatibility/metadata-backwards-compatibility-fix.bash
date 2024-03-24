#!/usr/bin/env bash

set -Ceux

mkdir --parents --verbose ~/.local/share/kservices5/

rm --force --verbose -- ~/.local/share/kservices5/kwin-script-sticky-window-snapping.desktop

sed 's/^X-KDE-ConfigModule=/X-KDE-Library=/g'  \
	~/.local/share/kwin/scripts/sticky-window-snapping/backwards-compatibility/metadata.desktop  \
> ~/.local/share/kservices5/kwin-script-sticky-window-snapping.desktop
