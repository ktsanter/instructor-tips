//-------------------------------------------------------------------
// CannonBall class
//-------------------------------------------------------------------
// TODO: 
//-------------------------------------------------------------------

class CannonBall {
  constructor(cvs, ctx, x, y, angle, speed, fgColor, bgColor, fontFamily, fontSize, msg, delay) {
    this.canvas = cvs;
    this.ctx = ctx;
    this.x = x;
    this.y = y;
    this.angle = angle * Math.PI / 180.0;
    this.delta = speed;
    
    this.fgColor = fgColor;
    this.bgColor = bgColor;
    this.fontFamily = fontFamily;
    this.fontSize = fontSize;
    this.msg = msg;
    
    this.ax = 0;
    this.ay = 0;
    this.vx = this.delta * Math.cos(this.angle);
    this.vy = -this.delta * Math.sin(this.angle);
    
    this.delay = delay;
  }  
  
  update() {
    this.delay--;
    
    if (this.delay <= 0) {
      this.delay = 0;
      
      this.vx += this.ax;
      this.vy += this.ay;
      
      this.x += this.vx;
      this.y += this.vy;
    }
  }
  
  draw() {
    if (this.delay > 0) return;
    
    var ctx = this.ctx;
    var msg = this.msg;
    
    ctx.font = this.fontSize + 'px ' + this.fontFamily;
    var twidth = Math.ceil(ctx.measureText(msg).width);
    var theight = Math.ceil(1.1 * ctx.measureText('M').width);    

    ctx.strokeStyle = this.fgColor;
    ctx.fillStyle = this.bgColor;

    var eWidth = 0.8 * (twidth + 2 * this.fontSize);
    var eHeight = 0.9 * (theight + this.fontSize);

    this._drawEllipseByCenter(ctx, this.x, this.y, eWidth, eHeight, true, this.bgColor);
    ctx.fillStyle = this.fgColor;
    ctx.fillText(msg, this.x - twidth / 2, this.y + (eHeight / 5));
  }
  
  atEdge() {
    var ctx = this.ctx;
    
    var x = this.x;
    var y = this.y;
    var width = this.canvas.width;
    var height = this.canvas.height;
    
    var nearEdge = (x < 20 || x > width - 20 || y < 20 || y > height - 20);
    
    return nearEdge;
  }

  //---------------------------------------
  // utility functions
  //----------------------------------------  
  _drawEllipseByCenter(ctx, x, y, w, h, fill, fillStyle) {
    this._drawEllipse(ctx, x - w/2.0, y - h/2.0, w, h, fill, fillStyle);
  }

  _drawEllipse(ctx, x, y, w, h, fill, fillStyle) {
    var kappa = .5522848,
        ox = (w / 2) * kappa, // control point offset horizontal
        oy = (h / 2) * kappa, // control point offset vertical
        xe = x + w,           // x-end
        ye = y + h,           // y-end
        xm = x + w / 2,       // x-middle
        ym = y + h / 2;       // y-middle

     ctx.beginPath();

    if (fill) {
      ctx.fillStyle = fillStyle;
    }

    ctx.moveTo(x, ym);
    ctx.bezierCurveTo(x, ym - oy, xm - ox, y, xm, y);
    ctx.bezierCurveTo(xm + ox, y, xe, ym - oy, xe, ym);
    ctx.bezierCurveTo(xe, ym + oy, xm + ox, ye, xm, ye);
    ctx.bezierCurveTo(xm - ox, ye, x, ym + oy, x, ym);
    
    ctx.closePath();
    ctx.stroke();
    if (fill) ctx.fill();
    /*
    if (fill) {
      ctx.fill();
    } else {
      ctx.closePath();
      ctx.stroke();
    }
    */
  }
}
