#!/usr/bin/env bash

set -Ceu

mkdir --parents --verbose ~/.local/share/kservices5/

for branch in metadata.desktop_c metadata.desktop_cl master metadata.desktop_lc metadata.json
do
	git switch "${branch}"
	grep --color -EH 'X-KDE-Library|X-KDE-ConfigModule' package/metadata.*

	kpackagetool5 --install package
	read -rp "${branch} / no symlink. Press return to continue."
	echo '--------------------------------------------------------------------'

	ln --relative --symbolic --verbose  \
		~/.local/share/kwin/scripts/sticky-window-snapping/metadata.desktop  \
		~/.local/share/kservices5/kwin-script-sticky-window-snapping.desktop
	read -rp "${branch} / with symlink. Press return to continue."
	echo '--------------------------------------------------------------------'

	rm --force --verbose ~/.local/share/kservices5/kwin-script-sticky-window-snapping.desktop
	kpackagetool5 --remove package
	read -rp "Uninstalled. Press return to continue."
	echo '===================================================================='
done
