// Copyright 2014 Bo Johansson. All rights reserved
// Mail: bo(stop)johansson(at)lsn(stop)se
// (browse-url "s:/wp/wpJavascriptEat/phs/PHS.html")

"use strict;";
var boj = boj || {};

boj.PHS_inpar_wci = (function (document) {

  const phs = boj.PHS;
  const pdo = boj.par_data_object;
  const parw = boj.par_wci(document);
  const humid = boj.humidity_obj;
  const mrad = boj.mrad_obj;

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

  // add remove class in html element class attribute ---------------------

  function html_class_get(e) {
    return e.className;
  }

  function html_class_set(e, classString) {
    e.className = classString;
  }

  function html_class_has(className, classString) {
    const re = /\s+/;
    const name = classString.split(re);
    const ix = name.indexOf(className);
    return ix !== -1;
  }

  function html_class_remove(className, classString) {
    const re = /\s+/;
    const name = classString.split(re);
    const ix = name.indexOf(className);
    if (ix === -1) {
      return classString;
    }
    name.splice(ix, 1);
    classString = name.join(' ');
    return classString;
  }

  function html_class_add(className, classString) {
    const re = /\s+/;
    const name = classString.split(re);
    const ix = name.indexOf(className);
    if (ix === -1) {
      classString += ' ' + className;
    }
    return classString;
  }

  // variable specifications --------------------------------------------------------------

  let body_Adu;
  let Met_W = NaN;

  const par_spec_local = [['Adu', 'float', function () {
    return body_Adu;
  }, function (val) {
    body_Adu = val;
  }, {
    def_val: NaN,
    unit: 'm2',
    symbol: 'Adu',
    output: 1,
    descr: 'Body surface area'
  }], ['Met_W', 'float', function () {
    return Met_W;
  }, function (val) {
    Met_W = val;
  }, {
    def_val: 150,
    min: 0,
    max: 400,
    unit: 'W',
    symbol: 'Met_W',
    descr: 'Metabolic energy production'
  }]];

  const CONST = {
    Patm: 101325.0
  };

  const par_spec_mod = [['humid_Pws',
    {min: 0.02, max: 619.0, dec_nof: 2, unit: 'hPa', output: 1}],
    ['humid_Patm', {
      def_val: CONST.Patm * 0.01,
      min: Math.round(CONST.Patm * 0.001),
      max: Math.round(CONST.Patm * 0.015),
      dec_nof: 0,
      unit: 'hPa'
    }], ['humid_Pw', {max: 619.0, dec_nof: 2, unit: 'hPa'}],
    ['humid_W', {max: 985.0, dec_nof: 2, unit: 'g/kg'}]];

  const par_spec_humid = pdo.util.par_spec_modify(humid.util.par_spec_humid,
      par_spec_mod);

  // used parameters ---------------------------------------------------

  const par_swarm_sim = phs.par_swarm_sim;
  const par_swarm_step = phs.par_swarm_step;
  const par_swarm_local = pdo.new_par_swarm('local').create_parameter(
      par_spec_local);

  const par_data_humid = pdo.new_par_store('humid').create_parameter(
      par_spec_humid);

  const par_data_mrad = pdo.new_par_store('globe').create_parameter(
      mrad.util.par_spec_globe);

  const parref = par_swarm_sim.new_parref(par_swarm_step, par_swarm_local,
      par_data_humid, par_data_mrad);

  function par_set_default() {
    [par_swarm_sim, par_swarm_step, par_data_mrad].map(function (swarm) {
      swarm.set_default_all();
    });
  }

  const phs_pid_sim_par = par_swarm_sim.pid_all();
  const phs_pid_step_par = par_swarm_step.pid_all();
  const phs_pid_par = phs_pid_sim_par.concat(phs_pid_step_par);

  // web interface ======================================================

  const par_wci_obj = parw.new_par_wci_obj('phs');
  par_wci_obj.parref(parref);
  par_wci_obj.html_data_create();

  // calculations =======================================================

  // humidity state --------------------------------------------------

  const humid_obj = humid.new_humidity_obj();
  humid.util.log_func_set(console.log);

  // val_in_par_obj = val_in_humid_obj  * scale
  const humid_par = // { pid : [ attid_in_hobj, scale? ]}
      {
        humid_Tdb: ['tdb'], humid_Pws: ['pwsat', 0.01], // hPa
        humid_Patm: ['patm', 0.01], // hPa
        humid_RH: ['RH'], humid_Pw: ['pw', 0.001], // kPa
        humid_W: ['w', 1000.0], // g/Kg
        humid_Tdew: ['tdew'], humid_Twb: ['twb']
      };

  function humid_obj_inpar(pid) {
    const arr = humid_par[pid];
    if (!arr) {
      alert('humid_obj_inpar( pid ) missing pid: ' + pid);
      return undefined;
    }
    const val_par = par_wci_obj.par_get(pid);
    let val_hobj = val_par;
    const aid = arr[0];
    const scale = arr[1];
    if (!(scale === undefined)) {
      val_hobj = val_par / scale;
    }
    let res = humid_obj.set(aid, val_hobj);
    if (!(scale === undefined)) {
      res = res * scale;
    }
    //if ( pid === 'humid_Pw' ) console.log( 'humid_Pw ' + val_par + ' ' + val_hobj+ ' ' +  res);
    par_wci_obj.par_set_refresh_wci(pid, res);
    return res;
  }

  function humid_obj_all_outpar_set_ui_refresh() {
    for (const pid in humid_par) {
      const arr = humid_par[pid];
      const aid = arr[0];
      const scale = arr[1];
      let val = humid_obj.get(aid);
      if (!(scale === undefined)) {
        val = scale * val;
      }
      // val_par = scale * val_hobj
      par_wci_obj.par_set_refresh_wci(pid, val);
      //if ( pid === 'humid_Pw' ) console.log( 'humid_Pw ' + val );
      //console.log( pid + ' = ' + val );
    }
  }

  function humid_val_to_users() {
    const humid_Pw = par_wci_obj.par_get('humid_Pw');
    par_wci_obj.par_get_set('humid_Pw', 'Pw_air');
    const Pw_air = par_wci_obj.par_get('Pw_air');
    if (humid_Pw !== Pw_air) {
      par_wci_obj.par_set('humid_Pw', Pw_air);
      humid_obj_inpar('humid_Pw');
      humid_obj_all_outpar_set_ui_refresh();
    }
    par_wci_obj.par_refresh_wci('humid_Pw');
    par_wci_obj.par_refresh_wci('Pw_air');
  }

  let humi_update_phs_pwair = false; // not used

  function humid_toggel_use_eh() { // not used
    const val = this.value;
    if (this.value === 'showing') {
      this.value = 'updateing Pw_air';
      humi_update_phs_pwair = true;
      //humid_calc_useinphs( 'humid_RH', true );
      //humid_obj_all_outpar_set_ui_refresh();
    } else {
      this.value = 'updateing Pw_air';
      //this.value = 'showing';
      humi_update_phs_pwair = false;
    }
  }

  function humid_onload() {
    const e = $('#humid_ext_show_use');
    //e.value = 'showing';
    //e.addEventListener('click', humid_toggel_use_eh, false);
  }

  // mean radiation temperature ---------------------------------------

  const mean_rad_obj = mrad.new_mean_rad_obj();

  let mean_rad_use_trad = true;

  function mean_rad_toggel_use_eh() { // not used
    const val = this.value;
    if (this.value === 'showing') {
      this.value = 'updateing Trad';
      mean_rad_use_trad = true;
    } else {
      this.value = 'showing';
      mean_rad_use_trad = false;
    }
  }

  function mean_rad_onload() { // not used
    const e = $('#mean_rad_ext_show_use');
    e.value = 'showing';
    e.addEventListener('click', mean_rad_toggel_use_eh, false);
  }

  const mean_rad_inpar_pid = [ // pid, accessid in mean_rad_obj
    ['globe_Tg', 'tglobe', false], ['Tair', 'tair', true],
    ['v_air', 'vair', true], ['globe_emi', 'emi', false],
    ['globe_diam', 'diam', false]];

  function mean_rad_obj_set_inpar() { // set input parameters
    mean_rad_inpar_pid.map(function (arr) {
      const pid = arr[0];
      const att = arr[1];
      const val = mean_rad_obj.access(att, par_wci_obj.par_get(pid));
      par_wci_obj.par_set(pid, val);
    });
  }

  function mean_rad_inpar_refresh() {
    mean_rad_inpar_pid.map(function (ce) {
      const pid = ce[0];
      par_wci_obj.par_refresh_wci(pid);
    });
  }

  function mean_rad_obj_to_users() {
    const trad = mean_rad_obj.get_trad();
    par_wci_obj.par_set_refresh_wci('globe_Trad', trad);
    if (!isNaN(par_wci_obj.par_get('globe_Tg'))) {
      par_wci_obj.par_set_refresh_wci('Trad', trad);
    }
  }

  // Adu, Body surface area

  function calc_adu() {
    const Adu = 0.202 * Math.pow(par_wci_obj.par_get('mass'), 0.425) * Math.pow(
        par_wci_obj.par_get('height'), 0.725);
    par_wci_obj.par_set_refresh_wci('Adu', Adu);
  }

  // calculations for Met and Met_W ---------------------

  // The PHS calculation is using Met as input
  // If MetW is entered, Met is calculated from MetW

  let calc_metabolic_alt = 0; // 0 = Met, 1 = Met_W used as input

  function calc_metabolic_set_used(e, bool) {
    const classString = html_class_get(e);
    const className = 'parameter_used_as_input';
    const classString_new = bool ? html_class_add(className, classString)
        : html_class_remove(className, classString);
    if (classString_new !== classString) {
      html_class_set(e, classString_new);
    }
  }

  function calc_metabolic_input(alt) {
    calc_metabolic_alt = alt === 0 ? 0 : 1;
    calc_metabolic_class();
  }

  const htmldata = par_wci_obj.get_html_data();

  function calc_metabolic_class() {
    const use_Met = calc_metabolic_alt === 0;
    const use_Met_W = !(calc_metabolic_alt === 0);
    for (let ix = 0; ix < htmldata.length; ++ix) {
      const div = htmldata[ix][0];
      const pid = htmldata[ix][1];
      if (pid === 'Met') {
        calc_metabolic_set_used(div, use_Met);
      } else if (pid === 'Met_W') {
        calc_metabolic_set_used(div, use_Met_W);
      }
    }
  }

  function calc_metabolic() {
    let Met;
    let Met_W;
    const Adu = par_wci_obj.par_get('Adu');
    if (calc_metabolic_alt === 0) {
      Met = par_wci_obj.par_get('Met');
      Met_W = Met * Adu;
      par_wci_obj.par_set_refresh_wci('Met_W', Met_W);
    } else {
      Met_W = par_wci_obj.par_get('Met_W');
      Met = Met_W / Adu;
      par_wci_obj.par_set_refresh_wci('Met', Met);
    }
  }

  // called from html ========================================================

  let trad_from_globe_Trad = false;

  function onload(wtab_id) {
    par_set_default();
    par_wci_obj.onload();
    $('#ext_humidity').style.display = 'block';
    $('#ext_Trad').style.display = 'block';
    humid_obj_all_outpar_set_ui_refresh(); // initialize humid par_wci_obj
    par_wci_obj.par_get_set('Tair', 'humid_Tdb');
    humid_obj_inpar('humid_Tdb');
    par_wci_obj.par_set('humid_RH', 50);
    humid_obj_inpar('humid_RH');
    humid_obj_all_outpar_set_ui_refresh();
    const db = par_wci_obj.par_get('humid_Pw');
    humid_val_to_users();
    par_wci_obj.par_set_refresh_wci('globe_Tg', NaN);
    calc_adu();
    calc_metabolic_input(0);
    calc_metabolic();
    par_wci_obj.par_refresh_wci();
  }

  function par_update(this_val) {
    const pid = par_wci_obj.par_update_wci(this_val);
    let val;
    // humidity
    if (par_data_humid.is_pid(pid)) {
      val = humid_obj_inpar(pid);
      humid_obj_all_outpar_set_ui_refresh();
      humid_val_to_users();
    }
    if (pid === 'Pw_air') { // Pw_air => humid_Pw
      par_wci_obj.par_get_set('Pw_air', 'humid_Pw');
      humid_obj_inpar('humid_Pw');
      humid_obj_all_outpar_set_ui_refresh();
      humid_val_to_users();
    } else if (pid === 'Tair') { // Tair => humid_Tdb, Pw_air =>  humid_Pw
      par_wci_obj.par_get_set('Tair', 'humid_Tdb');
      humid_obj_inpar('humid_Tdb');
      humid_obj_all_outpar_set_ui_refresh();
      humid_val_to_users();
      // 'globe_Tair' is fetched from 'Tair'
      // by mean_rad_obj_set_inpar(); below
    } else if (pid === 'globe_Tg') { //
      if (!trad_from_globe_Trad) {
        trad_from_globe_Trad = true;
        par_wci_obj.par_get_set('Trad', 'globe_Tg');
        par_wci_obj.par_refresh_wci('globe_Tg');
      }
    }
    // Trad
    mean_rad_inpar_pid.map(function (arr) {
      const pidtodo = arr[0];
      if (pid === pidtodo) {
        mean_rad_obj_set_inpar();
        mean_rad_inpar_refresh();
        mean_rad_obj_to_users();
      }
    });
    if (pid === 'v_air') { // v_air => globe_vair
      // 'globe_vair' is fetched from 'v_air'
      // by mean_rad_obj_set_inpar();
      mean_rad_obj_set_inpar();
      mean_rad_obj_to_users();
    } else if (pid === 'Trad') { // mark globe_Tg not calculated
      trad_from_globe_Trad = false;
      par_wci_obj.par_set_refresh_wci('globe_Tg', NaN);
    }
    // Adu, Met, Met_W
    else if (pid === 'height' || pid === 'mass') {
      calc_adu();
      calc_metabolic();
    } else if (pid === 'Met') {
      calc_metabolic_input(0);
      calc_metabolic();
    } else if (pid === 'Met_W') {
      calc_metabolic_input(1);
      calc_metabolic();
    }
  }

  // external interface =======================================================

  const self = {
    onload: onload,
    phs_pid_par: phs_pid_par,
    phs_pid_sim_par: phs_pid_sim_par,
    phs_pid_step_par: phs_pid_step_par,
    par_wci_obj: par_wci_obj,
    par_update: par_update
  };

  return self;
})(document);    
