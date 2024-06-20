// Copyright 2014 Bo Johansson. All rights reserved
// Mail: bo(stop)johansson(at)lsn(stop)se

"use strict;";

var boj = boj || {};

boj.humidity_obj = (function () {

  function extend(Child, Parent) {
    Child.prototype = inherit(Parent.prototype);
    Child.prototype.constructor = Child;
    Child.o_par = Parent.prototype;
  }

  function inherit(proto) {
    function F() {
    }

    F.prototype = proto;
    return new F;
  }

  let log = function () {
  };

  function log_func_set(func) {
    log = func;
  }

  /*
    The bisection method is a method for finding roots of an equation f(x) = 0
    given that a root occurs in the interval [a,b]. The method is slow but sure
    given that such an interval can be found and that f(x) is continuous on this interval.
    First the midpoint c = a + (b-a)/2 of the interval is calculated.
    Then the function is evaluated at this midpoint. There are three cases:
    f(c) is zero. Here c is the root
    f(b) and f(c) have opposite signs. In this case the root lies in the interval [b,c].
    f(b) and f(c) have the same signs. In this case the root lies in the interval [a,c].

    This bisection procedure is repeated until the interval containing the root becomes small enough.
    As a rule of thumb for base 10 arithmetic you need 3.3 bisections for each decimal digit of accuracy.
  */

  function bisect(func, xl, xr, yeps, iter_max) {
    const xl_start = xl;
    const xr_start = xr;
    let xmid, yxmid;
    let yxl = func(xl);
    let yxr = func(xr);
    const abs = Math.abs;
    for (let i = 1; i <= iter_max; i++) {
      xmid = xl + 0.5 * (xr - xl);
      yxmid = func(xmid);
      // undefined, NaN ?
      if (abs(yxmid) < yeps) {
        return xmid;
      }
      if ((yxl <= 0 && yxmid >= 0) || (yxl >= 0 && yxmid <= 0)) {
        xr = xmid;        // next interval is the left half
        yxr = yxmid;
      } else {
        xl = xmid;        // next interval is the right half
        yxl = yxmid;
      }
    }
    const temp = (xr - xl) / (xr_start - xl_start);
    if (abs((xr - xl) / (xr_start - xl_start)) > 0.00000001) {
      log('bisect overrun ' + JSON.stringify(
          [yeps, iter_max, 'x', xl, xr, 'y', yxl, yxmid, yxr]));
    }
    return xmid;
  }

  const CONST = {
    Patm: 101325.0,
    CpAir: 1004.0,
    CpWat: 4186.0,
    CpVap: 1805.0,
    Hfg: 2501000.0,
    RAir: 287.055,
    TKelConv: 273.15
  };

  /* Parmeters

     W [] Humidity ratio (alternatively, the moisture content or mixing ratio)
       ratio of the mass of water vapor to the mass of dry air

       (Specific humidity
       is the ratio of the mass of water vapor to the total mass of the moist air sample)

       (Saturation
       is when the air contains the maximum amount of water vapor at its current temperature.)

     rW [] Degree of saturation
       ratio of the air humidity ratio W to the humidity ratio Ws of saturated moist air
       at the same temperature and pressure
       = W / Ws
       < rw >

     rh [] Relative humidity
       ratio of the partial pressure of the water vapor to the saturation pressure
       at the same temperature
       = Pw / Pws

    T [C] Temperature in Celsius
    K [K] Temperature in Kelvin

    Tdb [C] Dry-bulb temperature of moist air
       temperature of air measured by a thermometer freely exposed to the air but
       shielded from radiation
       < tdb >

    Tas [C] Adiabatic Saturation Temperature
       temperature at which liquid water would evaporate into the moist air
       without any heat addition to the system
       < tas >

    Twb [C] Wet-bulb temperature of moist air
       temperature reached by evaporative cooling
       Twb is a close approximation to Tas
       < twb >

  */

  const par_spec_humid = [// state at saturation ---------------------------------------------
    ['humid_Tdb', 'float', //{ min : -55, max : 86.8, dec_nof : 1,
      {
        min: -60.0,
        max: 86.0,
        dec_nof: 1,
        symbol: 'Tdb',
        unit: 'C',
        descr: 'Dry-bulb (air) temperature'
      }], // Pws [Pa] pressure of saturated pure water
    // : pressure of water vapor in the absence of air at the given temperature t
    // : differs slightly from the vapor pressure of water in saturated moist air.
    // : Pws( tdb )
    // < pwsat, pressat >
    ['humid_Pws', 'float', {
      min: 1.08,
      max: 618270,
      dec_nof: 0,
      symbol: 'Pws',
      unit: 'Pa',
      descr: 'Pressure of saturated pure water'
    }], // Atmospheric pressure  ---------------------------------------------
    // Patm [Pa] atmospheric pressure
    // : standard atmospheric pressure is defined as 101,300 Pa
    ['humid_Patm', 'float', {
      def_val: CONST.Patm,
      min: CONST.Patm * 0.1,
      max: 1.5 * CONST.Patm,
      dec_nof: 0,
      symbol: 'Patm',
      unit: 'Pa',
      descr: 'Atmospheric pressure'
    }], // degree of sturation ---------------------------------------------
    // rh [] Relative humidity
    // : {mole fraction of water vapor} / {mole fraction of air}
    // = Pw / Pws
    ['humid_rh', 'float', {
      min: 0.0,
      max: 1.0,
      dec_nof: 2,
      symbol: 'rh',
      unit: '',
      descr: 'Relative humidity'
    }], // RH [%] Relative humidity (0 - 100)
    // = 100 * rh
    ['humid_RH', 'float', {
      min: 0.0,
      max: 100.0,
      dec_nof: 0,
      symbol: 'RH',
      unit: '%',
      descr: 'Relative humidity'
    }], // Pw [Pa] partial pressure of water vapor in moist air
    ['humid_Pw', 'float', {
      min: 0.0,
      max: 618270,
      dec_nof: 0,
      symbol: 'Pw',
      unit: 'Pa',
      descr: 'Partial pressure of water vapor'
    }], // W [] Humidity ratio (moisture content, mixing ratio)
    // : {mass of water vapor} / {mass of dry air}
    // < w, humrat >
    ['humid_W', 'float', {
      min: 0.0,
      max: 0.02,
      dec_nof: 4,
      symbol: 'W',
      unit: 'kg/kg',
      descr: 'Humidity ratio'
    }], // rW, Degree of saturation
    // rW = W / Ws
    ['humid_rW', 'float', {
      min: 0.0,
      max: 1.0,
      dec_nof: 2,
      symbol: 'rW',
      unit: '',
      descr: 'Degree of saturation'
    }],
    // Specific humidity (sH) is defined as the proportion of the mass of water vapour
    // in the moist air
    // = mass of water vapour / ( mass of water vapour + mass of dry air )
    // = W / ( 1 + W )
    ['humid_sH', 'float', {
      min: 0.0,
      max: 200,
      dec_nof: 2,
      symbol: 'sH',
      unit: 'kg/kg',
      descr: 'Specific humidity'
    }], // Tdew [C] Dew-point temperature
    // : Tdew( W, Patm ); solve  Ws( Tdew, Patm ) = W
    ['humid_Tdew', 'float', {
      min: -60,
      max: 200,
      dec_nof: 1,
      symbol: 'Tdew',
      unit: 'C',
      descr: 'Dew-point temperature'
    }], // Twb [C] Wet-bulb temperature
    ['humid_Twb', 'float', {
      min: -60,
      max: 200,
      dec_nof: 1,
      symbol: 'Twb',
      unit: 'C',
      descr: 'Wet-bulb temperature'
    }]

  ];

  // Pws, saturated partial pressure of water vapour -----------------------------------

  function Pws_from_Tdb(tdb) { // Pressure of saturated pure water
    if (tdb < -100.0 || tdb > 200.0) {
      return undefined;
    }
    const exp = Math.exp;
    const log = Math.log;
    const pow = Math.pow;
    let K = tdb + CONST.TKelConv, C1 = -5674.5359, C2 = 6.3925247,
        C3 = -9.677843 * pow(10, -3), C4 = 6.2215701 * pow(10, -7),
        C5 = 2.0747825 * pow(10, -9), C6 = -9.484024 * pow(10, -13),
        C7 = 4.1635019, C8 = -5800.2206, C9 = 1.3914993, C10 = -0.048640239,
        C11 = 4.1764768 * pow(10, -5), C12 = -1.4452093 * pow(10, -8),
        C13 = 6.5459673, pascals;

    if (K < CONST.TKelConv) {
      // The saturation pressure over ice for the temperature range of -100 to 0C
      pascals = exp(
          C1 / K + C2 + K * (C3 + K * (C4 + K * (C5 + C6 * K))) + C7 * log(K));
    } else { //if (K >= CONST.TKelConv)
      // The saturation pressure over liquid water for the temperature range of 0 to 200C
      pascals = exp(
          C8 / K + C9 + K * (C10 + K * (C11 + K * C12)) + C13 * log(K));
    }
    return pascals;
  }

  const Pws_min = Pws_from_Tdb(-100.0); // 0.001405102123874154
  const Pws_max = Pws_from_Tdb(200.0); // 1555073.745636215

  // Tdew, temperature dewpoint ----------------------------------------------------------

  function Tdew_from_Pw(pw) {
    if (pw < Pws_min) {
      log('Tdew_from_Pw: Pw out of range. Pw: ' + pw);
      return NaN;
    }
    if (pw > Pws_max) {
      log('Tdew_from_Pw: Pw out of range. Pw: ' + pw);
      return NaN;
    }
    let tdew_l = -99.99, tdew_r = 199.9, yeps = 0.001, pwsat;
    const func = function (t) {
      return Pws_from_Tdb(t) - pw;
    };
    const Tdew = bisect(func, tdew_l, tdew_r, yeps, 40);
    return Tdew;
  }

  /* Alternatively, the dew-point temperature can be calculated
     directly by one of the following equations (Peppers 1988):
     For the dew-point temperature range of 0 to 93C,
     Tdew = C14 + C15 * alfa + C16 * alfa ^2 + C17 * alfa ^3 + C18 * ( Pw ) ^0.1984
     For temperatures below 0C,
     Tdew = 6.09 + 12.608 * alfa + 0.4959 * alfa ^2
     where
     Tdew = dew-point temperature, C
     alfa = ln Pw
     Pw = water vapor partial pressure, kPa
     C 14 = 6.54
     C 15 = 14.526
     C 16 = 0.7389
     C 17 = 0.09486
     C 18 = 0.4569
  */

  function Tdew_from_Pw_1(Pw) {
    if (Pw < 0.1) { //!!
      return -68;
    }
    Pw = 0.001 * Pw; // => kPa
    const ln_Pw = Math.log(Pw);
    const C14 = 6.54, C15 = 14.526, C16 = 0.7389, C17 = 0.09486, C18 = 0.4569;
    // dew-point temperature range of 0 to 93C
    let tdew1 = C14 + (C15 + (C16 + C17 * ln_Pw) * ln_Pw) * ln_Pw;
    tdew1 += C18 * Math.pow(Pw, 0.1984);
    //  temperatures below 0C
    const tdew2 = 6.09 + (12.608 + 0.4959 * ln_Pw) * ln_Pw;
    if (tdew1 >= 0 && tdew1 <= 93) {
      return tdew1;
    } else if (tdew2 < 0.1) {
      return tdew2;
    }
    return NaN;
  }

  // rW, Degree of saturation --------------------------------------------------------
  //     ratio of the air humidity ratio W to the humidity ratio Ws of saturated moist air
  //     at the same temperature and pressure
  //
  // Saturation
  //     is when the air contains the maximum amount of water vapor at its current temperature

  function rW_from_W_Ws(W, Ws) {
    const rW = W / Ws;
    if (rW < 0.0) {
      log('rW out of range. rW: ' + rW);
      return 0.0;
    }
    if (rW > 1.0) {
      log('rW out of range. rW: ' + rW);
      return 1.0;
    }
    return rW;
  }

  function rW_from_rh_Pws_Patm(rh, Pws, Patm) {
    //var Pw = Pw_from_rh_Pws( rh, Pws);
    const Pw = rh * Pws;
    const W = W_from_Pw_Patm(Pw, Patm);
    const Ws = W_from_Pw_Patm(Pws, Patm);
    return rW_from_W_Ws(W, Ws);
  }

  // W, humidity ratio --------------------------------------------------------------
  //     ( moisture content or mixing ratio )
  //    ratio of the mass of water vapor to the mass of dry air

  function W_range(W, tag) {
    if (W < 0.0) {
      if (W > -0.01) {
        log(tag + ': W out of range. W: ' + W);
      }
      return 0.0;
    }
    if (W > 1.0) {
      if (W > 1.01) {
        log(tag + ': W out of range. W: ' + W);
      }
      return 1.0;
    }
    return W;
  }

  function W_from_Pw_Patm(pw, patm) {
    const w = W_from_Pw_Patm_norange(pw, patm)
    return W_range(w, 'W_from_Pw_Patm');
  }

  function W_from_Pw_Patm_norange(pw, patm) {
    return 0.62198 * pw / (patm - pw);
  }

  function W_from_rW_Ws(rW, Ws) {
    const W = rW * Ws;
    return W_range(W, 'W_from_rW_Ws');
  }

  function W_from_rh_Pws_Patm(rh, pwsat, patm) {
    //var pw = Pw_from_rh_Pws( rh, pwsat);
    const pw = rh * pwsat;
    const w = W_from_Pw_Patm(pw, patm);
    return W_range(w, 'W_from_rh_Pws_Patm');
  }

  function W_from_Twb_WsTwb_Tdb(Twb, Ws_Twb, Tdb) { // not used
    if (Twb > Tdb) {
      log('W_from_Twb_WsTwb_Tdb: Twb > Tdb ' + Twb + '>' + Tdb);
      return NaN;
    }
    const W = (((2501 - (2.326 * Twb)) * Ws_Twb) - (1.006 * (Tdb - Twb)))
        / (2501 + (1.86 * Tdb) - (4.186 * Twb));
    return W_range(W, 'W_from_Twb_WsTwb_Tdb');
  }

  function W_from_Twb_WsTwb_Tdb_norange(Twb, Ws_Twb, Tdb) {
    if (Twb > Tdb) {
      log('W_from_Twb_WsTwb_Tdb: Twb > Tdb ' + Twb + '>' + Tdb);
      //return NaN;
    }
    const W = (((2501 - (2.326 * Twb)) * Ws_Twb) - (1.006 * (Tdb - Twb)))
        / (2501 + (1.86 * Tdb) - (4.186 * Twb));
    return W;
  }

  function W_from_Twb_Tdb_Patm(Twb, Tdb, Patm) { // not used
    if (Twb > Tdb) {
      log('W_from_Twb_Tdb_Patm: Twb > Tdb ' + Twb + '>' + Tdb);
      return NaN;
    } else {
      const PwsTwb = Pws_from_Tdb(Twb);
      const WsTwb = W_from_Pw_Patm(PwsTwb, Patm);
      const W = W_from_Twb_WsTwb_Tdb(Twb, WsTwb, Tdb);
      return W_range(W, 'W_from_Twb_Tdb_Patm');
    }
  }

  function W_from_sH(sH) {
    const W = sH / (1 - sH);
    return W;
  }

  // sH, Specific humidity --------------------------------------------------------------
  // = W / ( 1 + W )

  function sH_from_W(W) {
    const sH = W / (1 + W);
    return sH;
  }

  // rh, Relative humidity ---------------------------------------------------------------

  function rh_range(rh, tag) {
    if (rh < 0.0) {
      if (rh > -0.01) {
        log(tag + ': rh out of range. rh: ' + rh);
      }
      return 0.0;
    }
    if (rh > 1.0) {
      if (rh > 1.01) {
        log(tag + ': rh out of range. rh: ' + rh);
      }
      return 1.0;
    }
    return rh;
  }

  function rh_from_rW_Pws_Patm(rW, Pws, Patm) {
    const rh = rW / (1 - ((1 - rW) * (Pws / Patm)));
    return rh_range(rh, 'rh_from_rW_Pws_Patm');
  }

  function rh_from_Pw_Pws(pw, pwsat) {
    const rh = pw / pwsat;
    return rh_range(rh, 'rh_from_Pw_Pws');
  }

  function rh_from_Twb_Tdb_Patm(Twb, Tdb, Patm) {
    if (Twb >= Tdb) {
      return 1.0;
    }
    if (Twb === Tdb) {
      return 1.0;
    }
    const cfact = 0.00066 * (1.0 + 0.00115 * Twb);
    const Pws_Twb = Pws_from_Tdb(Twb);
    const Pw_dep = Pws_Twb - cfact * Patm * (Tdb - Twb);
    const Pws_Tdb = Pws_from_Tdb(Tdb);
    let rh = Pw_dep / Pws_Tdb;
    if (rh < 0 && rh > -0.01) {
      rh = 0;
    }
    return rh_range(rh, 'rh_from_Twb_Tdb_Patm');
  }

  function rh_from_Twb_Tdb_Patm_1(Twb, Tdb, Patm) {
    const A = 0.00066 * (1.0 + 0.00115 * Twb);
    const Pws_Twb = Math.exp((16.78 * Twb - 116.9) / (Twb + 237.3));
    const Pw = Pws_Twb - A * Patm * (Tdb - Twb);
    const Pws_Tdb = Math.exp((16.78 * Tdb - 116.9) / (Twb + 237.3));
    const rh = Pw / Pws_Tdb;
    return rh_range(rh, 'rh_from_Twb_Tdb_Patm_1');
  }

  function rh_from_W_Pws_Patm(w, pwsat, patm) { // not used
    const pw = Pw_from_W_Patm(w, patm);
    const rh = rh_from_Pw_Pws(pw, pwsat);
    return rh_range(rh, 'rh_from_W_Pws_Patm');
  }

  function rh_from_Tdew_Tdb(Tdew, Tdb, Patm) { // not used
    if (Tdew > Tdb) {
      log('rh_from_Tdew_Tdb: Tdew > Tdb ', Tdew, Tdb);
      return NaN;
    }
    if (Tdew === Tdb) {
      return 1.0;
    }
    const Pw = Pws_from_Tdb(Tdew);
    const Pws = Pws_from_Tdb(Tdb);
    const rh = rh_from_Pw_Pws(Pw, Pws);
    return rh_range(rh, 'rh_from_Tdew_Tdb');
  }

  // Pw,  Partial pressure of water vapor -----------------------------------------------------

  function Pw_from_W_Patm(w, patm) {
    return w * patm / (0.62198 + w);
  }

  //function Pw_from_rh_Pws( rh, pwsat){
  //    return rh * pwsat;
  //}

  function Pw_from_Twb_Tdb_Patm(Twb, Tdb, Patm) {
    const Pws_Twb = Pws_from_Tdb(Twb);
    const i1 = 1.8 * (Patm - Pws_Twb) * (Tdb - Twb);
    const i2 = 2800 - 1.3 * (1.8 * Twb + 32);
    return Pws_Twb - i1 / i2;
  }

  // Wet-bulb temperature --------------------------------------------------------------------

  function Twb_from_Pw_Tdb_Patm(Pw, Tdb, Patm) {
    const func = function (twb) {
      const W_Tdb = W_from_Pw_Patm_norange(Pw, Patm);
      const Pws_Twb = Pws_from_Tdb(twb);
      const Ws_Twb = W_from_Pw_Patm_norange(Pws_Twb, Patm);
      const W = W_from_Twb_WsTwb_Tdb_norange(twb, Ws_Twb, Tdb);
      return W - W_Tdb;
    };
    const xl = -60, eps = 0.00001;
    return bisect(func, xl, Tdb, eps, 40);
  }

  function Twb_from_Pw_Tdb_Patm_1(Pw, Tdb, Patm) {
    const xl = -61, xr = 200, eps = 0.00001;
    const func = function (Twb) {
      return Pw_from_Twb_Tdb_Patm(Twb, Tdb, Patm) - Pw;
    };
    return bisect(func, xl, xr, eps, 40);
  }

  // humidity object ======================================================================

  function new_humidity_obj() {
    return new humidity_obj();
  }

  function humidity_obj() { // constructor
    // This is the attribute kept. The others are calculated
    // Always keep this.tdb and this.pwsat updated,
    // one of them defines the state at saturation
    this.tdb = 20;
    this.pwsat = Pws_from_Tdb(this.tdb);
    // this.rh defines the level of saturation
    this.rh = 0.5;
    this.patm = CONST.Patm;
  }

  const parid = ['tdb', 'pwsat', 'patm', 'pw', 'w', 'rw', 'rh', 'RH', 'sh',
    'twb', 'tdew'];

  humidity_obj.prototype.get = function (pid) {
    if (parid.indexOf(pid) >= 0) {
      const fun = 'get_' + pid;
      return this[fun]();
    }
    return undefined;
  };

  humidity_obj.prototype.set = function (pid, val) {
    if (parid.indexOf(pid) >= 0) {
      const fun = 'set_' + pid;
      return this[fun](val);
    }
    return undefined;
  };

  // Tdb or Pws defines saturation ------------------------------------------

  humidity_obj.prototype.get_tdb =  // Tdb, Dry-bulb (air) temperature
      function () {
        return this.tdb;
      };

  humidity_obj.prototype.set_tdb = function (tdb) {
    this['tdb'] = tdb;
    this.pwsat = Pws_from_Tdb(tdb); // always keep this.tdb and this.pwsat updated
    return this.tdb;
  };

  humidity_obj.prototype.get_pwsat =  // Pws, Pressure of saturated pure water
      function () {
        return this.pwsat;
      };

  humidity_obj.prototype.set_pwsat = function (pwsat) {
    this['pwsat'] = pwsat;
    this.tdb = Tdew_from_Pw(pwsat); // always keep this.tdb and this.pwsat updated
    return this['pwsat'];
  };

  // Patm, Atmospheric pressure ------------------------------------------------

  humidity_obj.prototype.get_patm = function () {
    return this.patm;
  };

  humidity_obj.prototype.set_patm = function (patm) {
    return this.patm = patm;
  };

  //  rh, RH, Pw, W, rW, sH, Tdew or Twb  defines level of saturation ------------------------------

  humidity_obj.prototype.get_rh = // rh, Relative humidity ( 0.0 - 1.0 )
      function () {
        return this.rh;
      };

  humidity_obj.prototype.set_rh = function (_rh) {
    if (_rh < 0.0) {
      _rh = 0.0;
    }
    if (_rh > 1.0) {
      _rh = 1.0;
    }
    this.rh = _rh;
    return this.get_rh();
  };

  humidity_obj.prototype.get_RH = // RH Relative humidity in percent
      function () {
        return 100 * this.get_rh();
      };

  humidity_obj.prototype.set_RH = function (RH) {
    this.set_rh(RH / 100.0);
    return this.get_RH();
  };

  humidity_obj.prototype.get_pw = // Pw, Partial pressure of water vapor
      function () {
        return this.rh * this.pwsat;
      };

  humidity_obj.prototype.set_pw = function (pw) {
    if (pw > this.pwsat) {
      this.rh = 1.0;
    } else {
      this.rh = rh_from_Pw_Pws(pw, this.pwsat);
    }
    return this.get_pw();
  };

  humidity_obj.prototype.get_w = // W, Humidity ratio
      function () {
        return W_from_rh_Pws_Patm(this.rh, this.pwsat, this.patm);
      };

  humidity_obj.prototype.set_w = function (w) {
    const Pw = Pw_from_W_Patm(w, this.patm);
    if (Pw > this.pwsat) {
      this.rh = 1.0;
    } else {
      this.rh = rh_from_Pw_Pws(Pw, this.pwsat);
    }
    return this.get_w();
  };

  humidity_obj.prototype.get_rw = // rW, Degree of saturation
      function () {
        return rW_from_rh_Pws_Patm(this.rh, this.pwsat, this.patm);
      };

  humidity_obj.prototype.set_rw = function (rW) {
    const rh = rh_from_rW_Pws_Patm(rW, this.pwsat, this.patm);
    this.rh = rh;
    return this.get_rw();
  };

  humidity_obj.prototype.get_sh = // sH, Specific humidity
      function () {
        const W = this.get_w();
        const sH = sH_from_W(W);
        return sH;
      };

  humidity_obj.prototype.set_sh = function (sH) {
    const W = W_from_sH(sH);
    this.set_w(W);
    return this.get_sh();
  };

  humidity_obj.prototype.get_twb = // Twb, Wet-bulb temperature
      function () {
        const pw = this.rh * this.pwsat;
        return Twb_from_Pw_Tdb_Patm(pw, this.tdb, this.patm);
      };

  humidity_obj.prototype.set_twb = function (Twb) {
    if (Twb > this.tdb) {
      return NaN;
    }
    const _rh = rh_from_Twb_Tdb_Patm(Twb, this.tdb, this.patm);
    this.rh = _rh;
    const _Twb = this.get_twb();
    return _Twb;
  };

  humidity_obj.prototype.get_tdew = // Tdew, Dew-point temperature
      function () {
        const pw = this.rh * this.pwsat;
        return Tdew_from_Pw(pw);
      };

  humidity_obj.prototype.set_tdew = function (Tdew) {
    if (Tdew > this.tdb) {
      return NaN;
    } else {
      const Pw = Pws_from_Tdb(Tdew);
      if (Pw > this.pwsat) {
        this.rh = 1.0;
      } else {
        this.rh = rh_from_Pw_Pws(Pw, this.pwsat);
      }
    }
    return this.get_tdew();
  };

  // Reveal public pointers to
  // private functions and properties
  return {
    new_humidity_obj: new_humidity_obj, util: {
      bisect: bisect,
      log_func_set: log_func_set,
      par_spec_humid: par_spec_humid,
      Pws_from_Tdb: Pws_from_Tdb,
      Tdew_from_Pw: Tdew_from_Pw,
      Tdew_from_Pw_1: Tdew_from_Pw_1,
      rW_from_W_Ws: rW_from_W_Ws,
      rW_from_rh_Pws_Patm: rW_from_rh_Pws_Patm,
      W_from_Pw_Patm: W_from_Pw_Patm,
      W_from_rh_Pws_Patm: W_from_rh_Pws_Patm,
      rh_from_rW_Pws_Patm: rh_from_rW_Pws_Patm,
      rh_from_Pw_Pws: rh_from_Pw_Pws,
      rh_from_Twb_Tdb_Patm: rh_from_Twb_Tdb_Patm,
      rh_from_Twb_Tdb_Patm_1: rh_from_Twb_Tdb_Patm_1,
      rh_from_W_Pws_Patm: rh_from_W_Pws_Patm,
      rh_from_Tdew_Tdb: rh_from_Tdew_Tdb,
      Pw_from_W_Patm: Pw_from_W_Patm, //Pw_from_rh_Pws : Pw_from_rh_Pws,
      Pw_from_Twb_Tdb_Patm: Pw_from_Twb_Tdb_Patm,
      Twb_from_Pw_Tdb_Patm: Twb_from_Pw_Tdb_Patm,
      Twb_from_Pw_Tdb_Patm_1: Twb_from_Pw_Tdb_Patm_1
    }
  };
})();
