# Changelog


## 2.0

* new:
  * Plasma 6 support
  * release sticking windows by shaking the mouse
  * option for (not) ignoring windows that are not on the current desktop
  * configurable offsets allowing for gaps or overlapping windows
* changed:
  * restructured configuration dialog
  * no key sequences assigned to shortcuts anymore by default
* fixed:
  * fix installation issues with newer Plasma versions by switching to new metadata format (`metadata.json`)


## 1.0.1

* fixed:
  * KWin 5.22 compatibility issues


## 1.0

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


## 0.2.1

* fixed resizing for windows spanning multiple screens


## 0.2

* maximized windows are ignored now
* shaded windows are ignored now
* windows on other screens are ignored now
* changed behavior when windows get very small while resizing


## 0.1

* initial release
