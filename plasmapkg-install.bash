#!/bin/bash

set -x

plasmapkg2 --type KWin/Script --install .
cp metadata.desktop ~/.local/share/kservices5/kwin-script-sticky-window-snapping.desktop
