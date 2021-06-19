#!/bin/bash

set -Cux

kpackagetool5 --remove package

rm       --force --recursive --verbose ~/.local/share/kwin/scripts/sticky-window-snapping/
rm       --force             --verbose ~/.local/share/kservices5/kwin-script-sticky-window-snapping.desktop
rm --dir --force             --verbose ~/.local/share/kservices5/
