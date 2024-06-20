// Copyright 2014 Bo Johansson. All rights reserved
// Mail: bo(stop)johansson(at)lsn(stop)se

"use strict;";

var boj = boj || {};

boj.par_wci = (function (document) {

  const html_frag = boj.html_fragment;

  function $(selector, el) {
    if (!el) {
      el = document;
    }
    return el.querySelector(selector);
  }

  function $$(selector, el) {
    if (!el) {
      el = document;
    }
    return Array.prototype.slice.call(el.querySelectorAll(selector));
  }

  // generate html for parameter input ====================================================

  function par_html(parins, target) {
    const info = parins.get_info();
    const frag = html_frag.new_html_fragment();
    frag.add_top_tag('span');
    frag.set_att("class", 'parameter_symbol');
    frag.add_txt('symbol' in info ? info.symbol : '');
    frag.add_top_tag('input');
    frag.set_att("class", 'parameter_value');
    frag.set_att("type", "number");
    frag.set_att("onchange", "wci.par_update(this);");
    frag.set_att("onfocus", "this.select();");
    if ('dec_nof' in info) {
      const dec_nof = info.dec_nof;
      if (dec_nof === 1) {
        frag.set_att('step', 0.1);
      }
      if (dec_nof === 2) {
        frag.set_att('step', 0.01);
      }
      if (dec_nof === 3) {
        frag.set_att('step', 0.001);
      }
      if (dec_nof === 4) {
        frag.set_att('step', 0.0001);
      }
    }
    if ('output' in info) {
      frag.set_att("readonly", '');
    }
    frag.add_top_tag('span');
    frag.set_att("class", 'parameter_unit');
    frag.add_txt('unit' in info ? info.unit : '');
    let description = 'descr' in info ? info.descr : '';
    const min = 'min' in info ? info.min : '';
    const max = 'max' in info ? info.max : '';
    if (min !== '' || max !== '') {
      description += ' ( ' + min + ' - ' + max + ' )';
    }
    frag.add_top_tag('span');
    frag.set_att("class", 'parameter_description');
    frag.set_att("title", description);
    frag.add_txt(description);
    frag.add_to_target(target, false); // replace
  }

  // parameter web client interface object ============================

  function new_par_wci_obj(id) {
    return new Par_wci_obj(id);
  }

  function Par_wci_obj(_id) { // constructor
    this.id = _id;
  }

  // config ----------------------------------------------------------
  Par_wci_obj.prototype.parref = function (_parref) {
    this.parref = _parref;
  };

  Par_wci_obj.prototype.set_html_data = function (_html_data) {
    this.html_data = _html_data;
  };

  Par_wci_obj.prototype.get_html_data = function () {
    return this.html_data;
  };

  function par_htmldata() {
    // return: [ [ html_elem, pid ], ... ]
    const res = [];
    const el = $$('.parameter');
    let div;
    let pid;
    for (let i = 0; i < el.length; i++) {
      div = el[i];
      pid = div.getAttribute('id').replace('par_', '');
      res.push([div, pid]);
    }
    return res;
  }

  Par_wci_obj.prototype.html_data_create = function () {
    this.html_data = par_htmldata();
  };

  // use ------------------------------------------------------------------

  Par_wci_obj.prototype.onload = function () {
    const parref = this.parref;
    const html_data = this.html_data;
    for (let ix = 0; ix < html_data.length; ++ix) {
      const div = html_data[ix][0];
      const pid = html_data[ix][1];
      const parins = parref.parins_pid(pid);
      if (parins) {
        par_html(parins, div);
      } else {
        alert("ERROR Par_wci_obj.onload, parameter id: " + pid);
      }
    }
  };

  Par_wci_obj.prototype.par_refresh_wci = function (pid) {
    const all = pid === undefined; // one pid or all parmeters
    const parref = this.parref;
    const html_data = this.html_data;
    for (let ix = 0; ix < html_data.length; ++ix) {
      const pid_e = html_data[ix][1];
      if (all || pid_e === pid) {
        const div = html_data[ix][0];
        const parins = parref.parins_pid(pid_e);
        if (parins) {
          const str = parins.as_string();
          $('.parameter_value', div).value = str;
        }
      }
    }
    return this;
  };

  const re = /^par_/;

  function pid_html_node(node) { // get pid from html id
    const html_id = node.getAttribute('id');
    if (!re.test(html_id)) {
      alert('ERROR html-id: ' + html_id);
    }
    return html_id.replace(re, '');
  }

  Par_wci_obj.prototype.par_update_wci = function (node) { // called from html, return pid
    const pid = pid_html_node(node.parentNode);
    const parins = this.parref.parins_pid(pid);
    if (parins) {
      let val = node.value;
      val = parins.set(val);
      node.value = val;
    }
    return pid;
  };

  Par_wci_obj.prototype.par_get = function (pid) {
    return this.parref.get_pid(pid);
  };

  Par_wci_obj.prototype.par_set = function (pid, val) {
    return this.parref.set_pid(pid, val);
  };

  Par_wci_obj.prototype.par_get_set = // get g_pid and set s_pid
      function (g_pid, s_pid) {
        const val = this.par_get(g_pid);
        return this.par_set(s_pid, val);
      };

  Par_wci_obj.prototype.par_set_refresh_wci = // parmeter value set and refresh wci
      function (pid, val) {
        this.par_set(pid, val);
        this.par_refresh_wci(pid);
      };

  Par_wci_obj.prototype.par_set_default = // set default for one pid or all parmeters
      function (pid) {
        if (pid === undefined) {
          this.parref.set_default_all();
        } else {
          this.parins[pid].set_default_pid(pid);
        }
      };

  // external interface =======================================================

  const self = {
    new_par_wci_obj: new_par_wci_obj
  };

  return self;
});
