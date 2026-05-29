/* extension.js
 *
 * SPDX-License-Identifier: GPL-2.0-or-later
 */

import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import { Extension } from 'resource:///org/gnome/shell/extensions/extension.js';

import { Animator } from './animator.js';
import { setInterval, clearInterval } from './utils.js';

// GNOME 46 removed Clutter.Actor.find_child_by_name(); reimplement a
// depth-first recursive search by actor name.
function findChildByName(actor, name) {
  if (!actor) return null;
  if (actor.name === name) return actor;
  let children = actor.get_children ? actor.get_children() : [];
  for (let i = 0; i < children.length; i++) {
    let found = findChildByName(children[i], name);
    if (found) return found;
  }
  return null;
}

export default class DashAnimatorExtension extends Extension {
  enable() {
    this.animator = new Animator();
    this.animator.extension = this;

    // animator setting
    this.animation_fps = 0;
    this.animation_magnify = 0.5;
    this.animation_spread = 0.6;
    this.animation_rise = 0.2;

    this.enabled = true;
    this._dragging = false;
    this._oneShotId = null;

    this._layoutManagerEvents = [];
    if (!this._findDashContainer()) {
      this._layoutManagerEvents.push(
        Main.layoutManager.connect('startup-complete', () => {
          console.log('dash-animator: startup-complete');
          this._findDashContainer();
        })
      );
      // A manual shell reload (Alt+F2 r) does not re-fire 'startup-complete',
      // and dash-to-dock may enable after us, so poll until the dock container
      // appears. _findDashContainer() clears this interval once it succeeds.
      this._findDashIntervalId = setInterval(
        this._findDashContainer.bind(this),
        500
      );
    }

    this._displayEvents = [];
    this._displayEvents.push(
      global.display.connect(
        'notify::focus-window',
        this._onFocusWindow.bind(this)
      )
    );
    this._displayEvents.push(
      global.display.connect(
        'in-fullscreen-changed',
        this._onFullScreen.bind(this)
      )
    );

    this.animator.enable();
  }

  disable() {
    this.enabled = false;
    this.animator.disable();
    this.animator = null;

    if (this._findDashIntervalId) {
      clearInterval(this._findDashIntervalId);
      this._findDashIntervalId = null;
    }

    if (this._intervals) {
      this._intervals.forEach((id) => {
        clearInterval(id);
      });
      this._intervals = [];
    }
    if (this._oneShotId) {
      clearInterval(this._oneShotId);
      this._oneShotId = null;
    }

    if (this._displayEvents) {
      this._displayEvents.forEach((id) => {
        global.display.disconnect(id);
      });
      this._displayEvents = [];
    }

    if (this.dashContainer) {
      // unhook
      this.dashContainer._animateIn = this.dashContainer.__animateIn;
      this.dashContainer._animateOut = this.dashContainer.__animateOut;
      this.dashContainer.set_reactive(false);
      this.dashContainer.set_track_hover(false);
      this.dashContainerEvents.forEach((id) => {
        if (this.dashContainer) {
          // needed?
          this.dashContainer.disconnect(id);
        }
      });
      this.dashContainerEvents = [];
      this.dashContainer = null;
    }

    if (this._iconsContainer) {
      Main.uiGroup.remove_child(this._iconsContainer);
      delete this._iconsContainer;
      this._iconsContainer = null;
    }

    if (this.dash) {
      this.dashEvents.forEach((id) => {
        if (this.dash) {
          this.dash.disconnect(id);
        }
      });
      this.dashEvents = [];
      this.dash = null;
    }

    if (this._layoutManagerEvents) {
      this._layoutManagerEvents.forEach((id) => {
        Main.layoutManager.disconnect(id);
      });
    }
    this._layoutManagerEvents = [];

    // log('disable animator');
  }

  _findDashContainer() {
    console.log('dash-animator: searching for dash container');

    if (this.dashContainer) {
      return false;
    }

    this.dashContainer = findChildByName(Main.uiGroup, 'dashtodockContainer');
    if (!this.dashContainer) {
      return false;
    }

    if (this._findDashIntervalId) {
      clearInterval(this._findDashIntervalId);
      this._findDashIntervalId = null;
    }

    this.scale = 1;
    this.dashContainer.delegate = this;
    this.animator.dashContainer = this.dashContainer;

    console.log('dash-animator: dashtodockContainer found!');

    this.dash = findChildByName(this.dashContainer, 'dash');
    this.dashEvents = [];
    this.dashEvents.push(
      this.dash.connect('icon-size-changed', this._startAnimation.bind(this))
    );

    this.dashContainer.set_reactive(true);
    this.dashContainer.set_track_hover(true);

    this.dashContainerEvents = [];
    this.dashContainerEvents.push(
      this.dashContainer.connect('motion-event', this._onMotionEvent.bind(this))
    );
    this.dashContainerEvents.push(
      this.dashContainer.connect('enter-event', this._onEnterEvent.bind(this))
    );
    this.dashContainerEvents.push(
      this.dashContainer.connect('leave-event', this._onLeaveEvent.bind(this))
    );
    this.dashContainerEvents.push(
      this.dashContainer.connect('destroy', () => {
        this.animator.disable();
        this.animator.enable();
        this.dashContainer = null;
        this._findDashIntervalId = setInterval(
          this._findDashContainer.bind(this),
          500
        );
      })
    );

    // hooks
    this.dashContainer.__animateIn = this.dashContainer._animateIn;
    this.dashContainer.__animateOut = this.dashContainer._animateOut;

    this.dashContainer._animateIn = (time, delay) => {
      this._startAnimation();
      this.dashContainer.__animateIn(time, delay);
    };
    this.dashContainer._animateOut = (time, delay) => {
      this._startAnimation();
      this.dashContainer.__animateOut(time, delay);
    };

    this.animator._animate();
    return true;
  }

  _findIcons() {
    if (!this.dash || !this.dashContainer) return [];

    // hook on showApps
    if (this.dash.showAppsButton && !this.dash.showAppsButton._checkEventId) {
      this.dash.showAppsButton._checkEventId = this.dash.showAppsButton.connect(
        'notify::checked',
        () => {
          if (!Main.overview.visible) {
            findChildByName(Main.uiGroup, 'overview')
              ._controls._toggleAppsPage();
          }
        }
      );
    }

    let icons = this.dash._box.get_children().filter((actor) => {
      if (actor.child && actor.child._delegate && actor.child._delegate.icon) {
        return true;
      }
      return false;
    });

    icons.forEach((c) => {
      let label = c.label;
      let appwell = c.first_child;
      let draggable = appwell._draggable;
      let widget = appwell.first_child;
      let icongrid = widget.first_child;
      let boxlayout = icongrid.first_child;
      let bin = boxlayout.first_child;
      if (!bin) return; // ??
      let icon = bin.first_child;

      c._bin = bin;
      c._label = label;
      c._draggable = draggable;
      c._appwell = appwell;
      if (icon) {
        c._icon = icon;
      }
    });

    try {
      // this.dash._showAppsIcon;
      let apps = Main.overview.dash.last_child.last_child;
      if (apps) {
        let widget = apps.child;
        // account for JustPerfection & dash-to-dock hiding the app button
        if (widget && widget.width > 0 && widget.get_parent().visible) {
          let icongrid = widget.first_child;
          let boxlayout = icongrid.first_child;
          let bin = boxlayout.first_child;
          let icon = bin.first_child;
          let c = {};
          c.child = widget;
          c._bin = bin;
          c._icon = icon;
          c._label = widget._delegate.label;
          icons.push(c);
        }
      }
    } catch (err) {
      // could happen if ShowApps is hidden
    }

    this.dashContainer._icons = icons;
    return icons;
  }

  _beginAnimation() {
    this.animator._beginAnimation();
  }

  _endAnimation() {
    this.animator._endAnimation();
  }

  _debounceEndAnimation() {
    this.animator._debounceEndAnimation();
  }

  _onMotionEvent() {
    this.animator._onMotionEvent();
  }

  _onEnterEvent() {
    this.animator._onEnterEvent();
  }

  _onLeaveEvent() {
    this.animator._onLeaveEvent();
  }

  _onFocusWindow() {
    this.animator._onFocusWindow();
  }

  _onFullScreen() {
    this.animator._onFullScreen();
  }

  _startAnimation() {
    this.animator._startAnimation();
  }
}
