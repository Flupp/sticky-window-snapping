#!/usr/bin/env bash
# shellcheck disable=SC2317  # Command appears to be unreachable.

set -Ceu
set -o pipefail
shopt -s failglob
shopt -s shift_verbose

function cmd_x_install() {
	local -; set -x
	"kpackagetool${V}" --type=KWin/Script --install package
}

function cmd_x_remove() {
	local -; set -x
	"kpackagetool${V}" --type=KWin/Script --remove "${ID}"
}

function cmd_x_disable() {
	local -; set -x
	"kwriteconfig${V}" --file kwinrc --group Plugins --key "${ID}Enabled" false
	qdbus org.kde.KWin /KWin reconfigure
}

function cmd_x_enable() {
	local -; set -x
	"kwriteconfig${V}" --file kwinrc --group Plugins --key "${ID}Enabled" true
	qdbus org.kde.KWin /KWin reconfigure
}

function cmd_x_reconfigure() {
	cmd disable
	sleep 0.3
	cmd enable
}

function cmd_x_reinstall() {
	cmd disable
	sleep 0.3
	cmd remove || true
	cmd install
	cmd enable
}

function cmd_x_kcm() {
	local -; set -x
	"kcmshell${V}" kcm_kwin_scripts
}

function cmd_x_console() {
	local -; set -x
	plasma-interactiveconsole --kwin  \
	|| qdbus org.kde.plasmashell /PlasmaShell showInteractiveKWinConsole &
}

function cmd_x_log() {
	echo 'Open kdebugsettings and ensure KWin Scripting is set to Full Debug. Also ensure that QT_LOGGING_RULES does not overwrite those settings. A re-login might be required after changing the settings.'
	echo 'For old Plasma versions that do not log to journal, use kwin command instead.'
	local -; set -x
	journalctl -f QT_CATEGORY=js QT_CATEGORY=kwin_scripting
}

# for old Plasma versions that do not log to journal
function cmd_x_kwin() {
	local -; set -x
	QT_LOGGING_RULES='*=false; js=true; kwin_scripting=true' kwin_x11 --replace
}

function cmd() {
	if [[ $(type -t "cmd_x_${1}") == function ]]
	then
		"cmd_x_${1}"
	elif [[ $(type -t "cmd_${V}_${1}") == function ]]
	then
		"cmd_${V}_${1}"
	else
		echo "Command not found for Plasma ${V}: ${1}" >&2
		return 1
	fi
}

function main() {
	if ((${#} <= 0))
	then
		echo "Usage: ${0##*/} <command> …"
		echo
		echo 'If several commands are given, they are executed from left to right.'
		echo
		echo 'Available commands:'
		declare -F | sed -En 's/^declare -f cmd_._/\t/p'
	fi
	if ! [[ $(plasmashell --version) =~ ^plasmashell\ ([0-9]+)\. ]]
	then
		echo 'Plasma version could not be determined.' >&2
		exit 1
	fi
	declare -gr V=${BASH_REMATCH[1]}
	declare -g ID
	ID=$(jq --raw-output '.KPlugin.Id' < package/metadata.json)
	while ((${#} > 0))
	do
		cmd "${1}"
		shift
	done
	exit
}

main "${@}"
