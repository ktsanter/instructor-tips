//-------------------------------------------------------------------
// Particle class
//-------------------------------------------------------------------
// TODO: 
//-------------------------------------------------------------------

class Particle {
  constructor (ctx, x, y, vx, vy, ax, ay, color) {
    const particleRadius = 3;
    
    this.ctx = ctx;
		this.x = x;
		this.y = y;
		this.vx = vx;
		this.vy = vy;
		this.ax = ax;
		this.ay = ay;
    this.LIFE = 150, //life time of firework
		this.life = this.LIFE; //only here for opacity in .draw() method
		this.path = [];
		this.color = color;
		this.r = particleRadius;
    this.trailLength = 15;
  }  
  
  update() {
    this.life--;

    // add point to path but if full, remove a point first
    if (this.path.length >= this.trailLength) this.path.shift();
    this.path.push([this.x, this.y])

    // update speed n position n stuff
    this.vy += this.ay;
    this.vx += this.ax;
    this.x += this.vx;
    this.y += this.vy;
  }
  
  draw() {
    var opacity = ~~(this.life * 100 / this.LIFE) / 100;
    var ctx = this.ctx;

    // tail      
    ctx.fillStyle = 'rgba(' + this.color + (opacity * 0.4) + ')';
    if (this.life > this.LIFE * 0.95) ctx.fillStyle = '#fff';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(this.x - this.r, this.y);
    var i = this.path.length - 1;
    ctx.lineTo(this.path[0][0], this.path[0][1]);
    ctx.lineTo(this.x + this.r, this.y);
    ctx.closePath();
    ctx.fill();
    
    // main dot
    ctx.fillStyle = 'rgba(' + this.color + opacity + ')';
    if (this.life > this.LIFE * 0.95) ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(~~this.x, ~~this.y, this.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.closePath();
  }

  //---------------------------------------
  // utility functions
  //----------------------------------------  

}
