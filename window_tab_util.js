// Copyright 2014 Bo Johansson. All rights reserved
// Mail: bo(stop)johansson(at)lsn(stop)se
"use strict;";

var boj = boj || {};

boj.wtab_util = (function (d) {

  function $$(selector, el) {
    if (!el) {
      el = d;
    }
    return Array.prototype.slice.call(el.querySelectorAll(selector));
  }

  const wtab_menu = {};    // id : element
  const wtab_content = {}; // id : element
  let active = {};      // id : true

  function do_it() {
    let tid;
    for (tid in wtab_menu) {
      if (active[tid]) {
        wtab_menu[tid].className = "wtab_active";
      } else {
        wtab_menu[tid].className = "";
      }
    }
    for (tid in wtab_content) {
      if (active[tid]) {
        wtab_content[tid].className = "wtab_cont wtab_active";
      } else {
        wtab_content[tid].className = "wtab_cont";
      }
    }
  }

  function onload(show_at_start) {
    const menu = $$('.wtab_menu li');
    const cont = $$('.wtab_cont');

    let i, e, tid;
    for (i = 0; i < menu.length; i++) {
      e = menu[i];
      tid = e.id.replace('wtab_menu_', '');
      wtab_menu[tid] = e;
    }
    for (i = 0; i < cont.length; i++) {
      e = cont[i];
      tid = e.id.replace('wtab_cont_', '');
      wtab_content[tid] = e;
    }

    active = {};
    if (show_at_start) {
      active[show_at_start] = true;
    }
    do_it();
  }

  function select(this_wtab) {
    active = {};
    const id = this_wtab.id;
    const tid_sel = id.replace('wtab_menu_', '');
    active[tid_sel] = true;
    do_it();
  }

  function select_all(id_list) {
    active = {};
    if (id_list) {
      id_list.map(function (id) {
        active[id] = true;
      });
    } else {
      for (const id in wtab_content) {
        active[id] = true;
      }
    }
    do_it();
  }

  return {
    onload: onload, select: select, select_all: select_all
  };
}(document));
