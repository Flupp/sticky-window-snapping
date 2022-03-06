# Sticky Window Snapping

KWin script to let snapped window edges stick together when one window is resized.

The script provides an easy to use configuration dialog, which can be reached via `systemsettings`.
(However, note section “Bugs and Workarounds”.)

When windows stick accidentally, you can release them by shaking the mouse while still resizing. The exact behavior is configurable. This feature can also be disabled.

Additionally, the script registers two global shortcuts: one for enabling/disabling the script permanently, and one for enabling/disabling the script only for the next resize.
By default, no key combinations are assigned.
You can change this using `systemsettings` (or `kcmshell6 keys`); the shortcuts are associated with the component “KWin”.
Their names are prefixed by “KWin Script: Sticky Window Snapping”.


## Bugs and Workarounds

* If the configuration dialog is not reachable via `systemsettings`, then try running the following included script and restart `systemsettings`:

      ~/.local/share/kwin/scripts/sticky-window-snapping/metadata-backwards-compatibility-fix.bash

* If the script does not work, increasing the threshold in the configuration dialog might help.


## Known issues

* There is no optical feedback when a shortcut is pressed.
  I do not know how to initiate a KNotify notification from a KWin script.
  There is the function `callDBus`, but I do not know if or how it can be used for that purpose.
  KNotify provides the method `event` via D-Bus, but it expects arguments of types for which I do not know how to produce values with JavaScript.
* Currently, not only snapped window edges are considered as connected, but even edges which are only on the same row/column are considered as connected.
  I have not decided yet if this is a bug or a feature.
