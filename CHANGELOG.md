# Changelog


## v1.0

* new:
  * configuration dialog
  * configurable transparency of unaffected windows
  * configurable threshold defining a maximal distance to consider edges as snapped
  * option to ignore maximized windows
  * option to ignore window edges that touch an edge of the screen
  * restore affected minimized windows temporarily
* changed:
  * highlight a snapped window only when its size is changed
  * also consider windows that are on all desktops
  * delay transparency changes until first resize step to prevent flickering
  * do not restrict a window to the client area (typically the screen size) if it already exceeds it
* fixed:
  * crash on resize when a snapped window disappears


## v0.2.1

* fixed resizing for windows spanning multiple screens


## v0.2

* maximized windows are ignored now
* shaded windows are ignored now
* windows on other screens are ignored now
* changed behavior when windows get very small while resizing


## v0.1

* initial release
