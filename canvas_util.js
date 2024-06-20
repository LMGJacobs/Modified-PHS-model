// Copyright 2014 Bo Johansson. All rights reserved
// Mail: bo(stop)johansson(at)lsn(stop)se

"use strict;";

var boj = boj || {};

boj.canvas_util = (function () {

  // Matrices for homogeneous coordinates and affine transformations
  // mh = [ xx, yx, xy, yy, xt, yt ]
  //         0   1   2   3   4   5
  //        sx          sy  tx  ty  scale translate
  //        c   s   -s  c           rotate cos sin

  function new_mat_hom(mh) {
    return new mat_hom(mh);
  }

  function mat_hom(mh) { // constructor
    this.mat = mh;
    if (!mh || mh.length !== 6) {
      this.reset();
    }
  }

  mat_hom.prototype.reset = mat_hom.prototype.set_identity = function () {
    this.mat = [1, 0, 0, 1, 0, 0];
    return this;
  };

  mat_hom.prototype.as_array = function () {
    return this.mat;
  };

  mat_hom.prototype.as_string = function () {
    const str = [];
    const th_mat = this.mat;
    for (let ix = 0; ix < th_mat.length; ++ix) {
      str.push(th_mat[ix]);
    }
    return '[ ' + str.join(', ') + ' ]';
  };

  mat_hom.prototype.set_mat = function (mh) {
    this.mat = mh;
    if (!mh || mh.length !== 6) {
      this.reset();
    }
    return this;
  };

  mat_hom.prototype.translate = function (x, y) {
    const mh = this.mat;
    const xx = mh[0];
    const yx = mh[1];
    const xy = mh[2];
    const yy = mh[3];
    const xt = xx * x + xy * y;
    const yt = yx * x + yy * y;
    this.mat[4] = xt;
    this.mat[5] = yt;
    return this;
  };

  mat_hom.prototype.scale = function (sx, sy) {
    this.mat[0] *= sx;
    this.mat[1] *= sx;
    this.mat[2] *= sy;
    this.mat[3] *= sy;
    return this;
  };

  mat_hom.prototype.rotate_deg = function (deg) {
    const rad = deg * Math.PI / 180;
    this.rotate_rad(rad);
    return this;
  };

  mat_hom.prototype.rotate_deg90 = function (deg90) {
    if (deg90 === 0 || deg90 === undefined) {
      return this; // no rotation, no change
    }
    const mh = this.mat;
    const xx = mh[0];
    const yx = mh[1];
    const xy = mh[2];
    const yy = mh[3];
    if (deg90 === 1) { // s = 1; c = 0
      this.mat[0] = xy;
      this.mat[1] = yy;
      this.mat[2] = -xx;
      this.mat[3] = -yx;
    } else if (deg90 === 2) {// s = 0; c = -1
      this.mat[0] = -xx;
      this.mat[1] = -yx;
      this.mat[2] = -xy;
      this.mat[3] = -yy;
    } else if (deg90 === 3) {// s = -1; c = 0
      this.mat[0] = -xy;
      this.mat[1] = -yy;
      this.mat[2] = xx;
      this.mat[3] = yx;
    }
    return this;
  };

  mat_hom.prototype.rotate_rad = function (rad) {
    const c = Math.cos(rad);
    const s = Math.sin(rad);
    const mh = this.mat;
    const xx = mh[0];
    const yx = mh[1];
    const xy = mh[2];
    const yy = mh[3];
    const xt = mh[4];
    const yt = mh[5];
    this.mat[0] = xx * c + xy * s;
    this.mat[1] = yx * c + yy * s;
    this.mat[2] = xx * -s + xy * c;
    this.mat[3] = yx * -s + yy * c;
    return this;
  };

  function mat_hom_invert(mh) {
    const xx = mh[0];
    const yx = mh[1];
    const xy = mh[2];
    const yy = mh[3];
    const xt = mh[4];
    const yt = mh[5];
    const det = 1 / (xx * yy - xy * yx);
    return [yy * det, (-yx * det), (-xy * det), xx * det,
      (xy * yt - yy * xt) * det, (yx * xt - xx * yt) * det];
  }

  mat_hom.prototype.invers = function () {
    const mh = this.mat;
    const mh_inv = mat_hom_invert(mh);
    return new mat_hom(mh_inv);
  };

  mat_hom.prototype.multiply = function (mhobj) {
    const mh = mhobj.mat;
    const xx = mh[0];
    const yx = mh[1];
    const xy = mh[2];
    const yy = mh[3];
    const xt = mh[4];
    const yt = mh[5];

    const mh1 = this.mat;
    const xx1 = mh1[0];
    const yx1 = mh1[1];
    const xy1 = mh1[2];
    const yy1 = mh1[3];
    const xt1 = mh1[4];
    const yt1 = mh1[5];

    this.mat = [xx * xx1 + xy * yx1, yx * xx1 + yy * yx1, xx * xy1 + xy * yy1,
      yx * xy1 + yy * yy1, xx * xt1 + xy * yt1 + xt, yx * xt1 + yy * yt1 + yt];
    return this;
  };

  mat_hom.prototype.copy = function () {
    const that = new mat_hom(this.mat);
    return that;
  };

  mat_hom.prototype.transform_ctx = function (ctx) {
    const mh = this.mat;
    ctx.transform(mh[0], mh[1], mh[2], mh[3], mh[4], mh[5]);
    //ctx.transform.apply( null, mh );
    return this;
  };

  mat_hom.prototype.set_transform_ctx = function (ctx) {
    const mh = this.mat;
    ctx.setTransform(mh[0], mh[1], mh[2], mh[3], mh[4], mh[5]);
    //ctx.setTransform.apply( null, mh );
    return this;
  };

  function transform_point(x, y, mh) {
    const xx = mh[0];
    const yx = mh[1];
    const xy = mh[2];
    const yy = mh[3];
    const xt = mh[4];
    const yt = mh[5];
    return [xx * x + xy * y + xt, yx * x + yy * y + yt];
  }

  mat_hom.prototype.convert_point = function (x, y) {
    return transform_point(x, y, this.mat);
  };

  mat_hom.prototype.revert_point = function (x, y) {
    const mh_inv = mat_hom_invert(this.mat);
    return transform_point(x, y, mh_inv);
  };

  // subcanvas and canport =======================================================
  // subcanvas is a part of a canvas
  // canport is a part of a subcanvas or another canport
  // lefthanded coordinate system is used as in the canvas
  //
  // posincan = pos in canvas
  // posinpar = pos in parent subcanvas or canport
  // posin(can|par) = [ cx, cy, sx, sy ]
  // position is rectangle: upper left corner in ( cx, cy ),
  // width = sx and height = sy

  function new_subcanvas(canvas, x, y, sx, sy) {
    return new subcanvas(canvas, x, y, sx, sy);
  }

  function subcanvas(_canvas, x, y, sx, sy) {  // constructor
    this.canvas = _canvas;
    this.cansx = _canvas.width;
    this.cansy = _canvas.height;
    this.ctxcan = _canvas.getContext("2d");
    // create the port which is the top port
    const port = new canport(this);
    delete port.partof;    // the port is not part of a port
    port.subcanvas = this; // refernce to
    port.posinpar = [x, y];
    port.size = [sx, sy];
    port.posincan = port.posinpar;
    this.port = port;
  }

  subcanvas.prototype.ctx = function () {
    const ctx = this.ctxcan;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    return ctx;
  };

  subcanvas.prototype.new_canport = // create a port which is a subport to the top port
      function (x, y, sx, sy) {
        const port = new canport(this.port);
        port.config(x, y, sx, sy);
        return port;
      };

  // canport ------------------------------------------------------

  function canport(_parent) { // constructor
    this.partof = _parent;
  }

  canport.prototype.new_canport = function (x, y, sx, sy) {
    const port = new canport(this);
    port.config(x, y, sx, sy);
    return port;
  };

  canport.prototype.config = function (x, y, sx, sy) {
    this.posinpar = [x, y];
    this.size = [sx, sy];
    posincan.call(this);
  };

  function posincan() {
    if (this.subcanvas) {
      this.posincan = this.posinpar;
    } else {
      const pos = this.posinpar;
      const ppos = this.partof.posincan;
      const x = pos[0];
      const y = pos[1];
      const px = ppos[0];
      const py = ppos[1];
      this.posincan = [px + x, py + y];
    }
  }

  canport.prototype.path = function () {
    const res = [];
    let that = this.partof;
    while (that) {
      res.push(that);
      that = that.partof;
    }
    return [res, that.subcanvas];
  };

  canport.prototype.get_subcanvas = function () {
    if (this.subcanvas) {
      return this.subcanvas;
    }
    let that = this;
    while (that.partof) {
      that = that.partof;
    }
    return that.subcanvas;
  };

  // ctx -----------------------------------------------------------
  subcanvas.prototype.ctx_can = function () {
    return this.ctx();
  };

  canport.prototype.ctx_can = function () {
    const subcanvas = this.get_subcanvas();
    return subcanvas.ctx();
  };

  subcanvas.prototype.ctx_port = function () {
    return this.port.ctx_port();
  };

  canport.prototype.ctx_port = function () {
    const ctx_can = this.ctx_can();
    const pos = this.posincan;
    const tx = pos[0];
    const ty = pos[1];
    const mat_hom = new_mat_hom();
    mat_hom.translate(tx, ty);
    mat_hom.set_transform_ctx(ctx_can);
    return ctx_can;
  };

  subcanvas.prototype.ctx_port_deg90 = function (deg90) {
    return this.port.ctx_port_deg90(deg90);
  };

  canport.prototype.ctx_port_deg90 = function (deg90) {
    const ctx_can = this.ctx_can();
    const pos = this.posincan;
    const size = this.size;
    const x = pos[0];
    const y = pos[1];
    const sx = size[0];
    const sy = size[1];
    let tx, ty;
    if (deg90 === 1) {
      tx = x + sx;
      ty = y;
    } else if (deg90 === 2) {
      tx = x + sx;
      ty = y + sy;
    } else if (deg90 === 3) {
      tx = x;
      ty = y + sy;
    } else {
      tx = x;
      ty = y;
    }
    const mat_hom = new_mat_hom();
    mat_hom.translate(tx, ty);
    mat_hom.rotate_deg90(deg90);
    mat_hom.set_transform_ctx(ctx_can);
    return ctx_can;
  };

  // clear, draw_extent

  subcanvas.prototype.clear = function () {
    return this.port.clear();
  };

  canport.prototype.clear = function () {
    const size = this.size;
    const ctx = this.ctx_port();
    ctx.clearRect(0, 0, size[0], size[1]);
  };

  subcanvas.prototype.draw_extent = function () {
    return this.port.draw_extent();
  };

  canport.prototype.draw_extent = function () {
    const pos = this.posincan;
    const size = this.size;
    let ctx = this.ctx_can();
    ctx.save();
    ctx.strokeStyle = "red";
    ctx.beginPath();
    ctx.rect(pos[0], pos[1], size[0], size[1]);
    ctx.stroke();
    ctx.restore();
    ctx = this.ctx_port();
    ctx.strokeStyle = "black";
    ctx.beginPath();
    ctx.rect(0, 0, size[0], size[1]);
    ctx.stroke();
    ctx.restore();
  };

//======================================================================================    
  //  rectangle area coordinates
  //  rac = [ xlt, ylt, xrb, yrb ]
  //  lt = left_top
  //  rb = right_bottom
  //  $_rac; $ m = model, p = parent

  function mh_from_rac_keep_aspect_ratio(p_rac, m_rac) {
    const m_xlt = m_rac[0];
    const m_ylt = m_rac[1];
    const m_xrb = m_rac[2];
    const m_yrb = m_rac[3];
    const xlt = p_rac[0];
    const ylt = p_rac[1];
    const xrb = p_rac[2];
    const yrb = p_rac[3];
    let scale_x = (xrb - xlt) / (m_xrb - m_xlt);
    let scale_y = (yrb - ylt) / (m_yrb - m_ylt);
    const scale = scale_x * scale_x < scale_y * scale_y ? scale_x : scale_y;
    scale_x = scale_x * scale > 0 ? scale : -scale;
    scale_y = scale_y * scale > 0 ? scale : -scale;
    return [scale_x, 0, 0, scale_y, xlt - m_xlt * scale_x,
      ylt - m_ylt * scale_y];
  }

  // create path ----------------------------------------------

  function line_path(ctx, x1, y1, x2, y2) {
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
  }

  function line_seq_path_xyc(ctx, xyc_arr) {
    ctx.moveTo(xyc_arr[0][0], xyc_arr[0][1]);
    for (let ix = 1; ix < xyc_arr.length; ++ix) {
      ctx.lineTo(xyc_arr[ix][0], xyc_arr[ix][1]);
    }
  }

  // draw path ----------------------------------------------

  function line_draw(ctx, x1, y1, x2, y2) {
    ctx.beginPath();
    line_path(ctx, x1, y1, x2, y2);
    ctx.stroke();
  }

  function rectangle_draw(ctx, x1, y1, x2, y2) {
    ctx.beginPath();
    const xyc_arr = [[x1, y1], [x1, y2], [x2, y2], [x2, y1], [x1, y1]];
    line_seq_path_xyc(ctx, xyc_arr);
    ctx.stroke();
  }

  function line_seq_draw_xyc(ctx, xyc_arr) {
    ctx.beginPath();
    line_seq_path_xyc(ctx, xyc_arr);
    //ctx.closePath();
    ctx.stroke();
    //ctx.fill();
  }

  // Reveal public pointers to
  // private functions and properties
  return {
    new_mat_hom: new_mat_hom,
    new_subcanvas: new_subcanvas,
    line_path: line_path,
    line_seq_path_xyc: line_seq_path_xyc,
    line_draw: line_draw,
    rectangle_draw: rectangle_draw,
    line_seq_draw_xyc: line_seq_draw_xyc
  };
})();
