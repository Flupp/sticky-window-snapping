#!/bin/bash

set -x

plasmapkg2 --type KWin/Script --remove .
plasmapkg  --type KWin/Script --remove .
rm --recursive --verbose  \
	~/.local/share/kwin/scripts/sticky-window-snapping  \
	~/.local/share/kservices5/kwin-script-sticky-window-snapping.desktop
