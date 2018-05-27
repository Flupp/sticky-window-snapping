#!/bin/bash

set -x

plasmapkg2 --type KWin/Script --install .
ln --relative --symbolic ~/.local/share/kwin/scripts/sticky-window-snapping/metadata.desktop ~/.local/share/kservices5/kwin-script-sticky-window-snapping.desktop
