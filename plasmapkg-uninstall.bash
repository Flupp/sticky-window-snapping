#!/bin/bash

set -x

plasmapkg2 --type kwinscript --remove .
plasmapkg  --type kwinscript --remove .
rm --recursive --verbose  \
	~/.local/share/kwin/scripts/sticky-window-snapping  \
	~/.local/share/kservices5/kwin-script-sticky-window-snapping.desktop
