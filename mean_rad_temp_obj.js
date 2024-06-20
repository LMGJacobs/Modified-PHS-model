// Copyright 2014 Bo Johansson. All rights reserved
// Mail: bo(stop)johansson(at)lsn(stop)se

"use strict;";

var boj = boj || {};

boj.mrad_obj = ( function () {
    
    // Tg - black-globe temperature [C]
    // Tair - air temperature [C]
    // v_air - air velocity at the level of the globe [m/s]
    // emi - emissivity of the globe []
    // diam - the diameter of the globe [m]
    // standard globe (diam = 0.15 m, emi = 0.95)

    const par_spec_globe = [
        ['globe_Tg', 'float',
            {
                def_val: 20, min: -60, max: 200, dec_nof: 1,
                symbol: 'globe_Tg', unit: 'C', descr: 'Globe temperature'
            }
        ],
        ['globe_Tair', 'float',
            {
                def_val: 20, min: -60, max: 200, dec_nof: 1,
                symbol: 'globe_Tair', unit: 'C', descr: 'Air temperature'
            }
        ],
        ['globe_vair', 'float',
            {
                def_val: 0.3, min: 0.0, max: 3.0, dec_nof: 1,
                symbol: 'globe_vair', unit: 'm/s', descr: 'Air temperature'
            }
        ],
        ['globe_emi', 'float',
            {
                def_val: 0.95, min: 0.0, max: 1.0, dec_nof: 2,
                symbol: 'globe_emi', unit: '', descr: 'Emissivity of the globe'
            }
        ],
        ['globe_diam', 'float',
            {
                def_val: 0.15, min: 0.0, dec_nof: 2,
                symbol: 'globe_diam', unit: 'm', descr: 'Diameter of the globe'
            }
        ],
        ['globe_Trad', 'float',
            {
                def_val: NaN, dec_nof: 1, output: 1,
                symbol: 'globe_Trad', unit: 'C', descr: 'Radiant temperature'
            }
        ]
    ];

    function mean_radiant_temp( Tg, Tair, emi, diam, v_air ){
        if (typeof emi === "undefined") {emi = 0.95;}
        if (typeof diam === "undefined") {diam = 0.15;}
        let TgK4 = Tg + 273;
        TgK4 = TgK4 * TgK4;
        TgK4 = TgK4 * TgK4;
        const t1 = 110000000 * Math.pow(v_air, 0.6);
        const t2 = emi * Math.pow(diam, 0.4);
        const t3 = TgK4 + (t1 / t2) * (Tg - Tair);
        const MrtK = Math.pow(t3, 0.25);
        return MrtK - 273;
    }

    // natural_convection v_air < 0.15 m/s

    function mean_radiant_temp_natural_conv( Tg, Tair, emi, diam ){
        if (typeof emi === "undefined") {emi = 0.95;}
        if (typeof diam === "undefined") {diam = 0.15;}
        let TgK4 = Tg + 273;
        TgK4 = TgK4 * TgK4;
        TgK4 = TgK4 * TgK4;
        const t1 = 25000000 / emi;
        const t2 = Math.pow(Math.abs(Tg - Tair) / diam, 0.25);
        const t3 = TgK4 + (t1 * t2 * (Tg - Tair));
        const MrtK = Math.pow(t3, 0.25);
        return MrtK - 273;
    }

    function mean_radiant_temp_best_try( Tg, Tair, emi, diam, v_air ){
        if (typeof v_air === "undefined") {
            return mean_radiant_temp_natural_conv( Tg, Tair, emi, diam );
        }
        const MRT = mean_radiant_temp(Tg, Tair, emi, diam, v_air);
        const MRT_nc = mean_radiant_temp_natural_conv(Tg, Tair, emi, diam);
        const c1 = (Tg < Tair && MRT_nc < MRT); // use natural_conv
        const c2 = (Tg >= Tair && MRT_nc > MRT); // use natural_conv
        if ( c1 || c2 ) {
            return MRT_nc;
        }
        return MRT;
    }

    // mean radiation temperature object =============================================

        function new_mean_rad_obj(){
        return new mean_rad_obj();
    }

    function mean_rad_obj(){ // constructor
        this.tglobe = 20;
        this.tair = 20;
        this.emi = 0.95;
        this.diam = 0.15;
    }

    mean_rad_obj.prototype.get_trad =
        function(){
            return mean_radiant_temp_best_try(
                this.tglobe,  this.tair, this.emi, this.diam, this.vair);  
        };

    const attribute_id = ['tglobe', 'tair', 'emi', 'diam', 'vair'];

    mean_rad_obj.prototype.access =
        function( pid /*, val */ ){
            if ( attribute_id.indexOf( pid ) >= 0 ){
                if ( arguments.length === 1 ){ // only pid
                    return this[pid];
                }
                else{
                    return this[pid] =  arguments[ 1 ];
                }
            }
            return undefined;
        };
    
    // Reveal public pointers to 
    // private functions and properties
    return{
        new_mean_rad_obj : new_mean_rad_obj,
        util : {
            par_spec_globe : par_spec_globe,
            mean_radiant_temp : mean_radiant_temp,
            mean_radiant_temp_natural_conv : mean_radiant_temp_natural_conv,
            mean_radiant_temp_best_try : mean_radiant_temp_best_try
        }
    };
})();

