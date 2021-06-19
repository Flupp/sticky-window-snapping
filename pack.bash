#!/bin/bash

set -Ceux

cd package

zip ../sticky-window-snapping.kwinscript  \
	contents/code/main.js  \
	contents/config/main.xml  \
	contents/ui/config.ui  \
	gpl-2.0.txt  \
	metadata.desktop
