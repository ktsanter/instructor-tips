//-------------------------------------------------------------------
// Firework class
//-------------------------------------------------------------------
// TODO: 
//-------------------------------------------------------------------

class Firework {
  constructor (canvas, ctx) {
		const minStrength = 1.5; //lowest firework power
		const maxStrength = 7; //highest firework power
		const minTrails = 7; //min particles
		const maxTrails = 30; //max particles
    
    const g = 5e-2; //strength of gravity
    const D = 1e-3; //strength of drag (air resistance)
    
    this.canvas = canvas;
    this.ctx = ctx;
    
    this.x = canvas.width * (Math.random() * 0.8 + 0.1); // from 0.1-0.9 widths
    this.y = canvas.height * (Math.random() * 0.8 + 0.1); // from 0.1-0.9 heights
    this.strength = Math.random() * (maxStrength - minStrength) + minStrength;
    this.color = ~~(Math.random() * 255) + ',' +
      ~~(Math.random() * 255) + ',' +
      ~~(Math.random() * 255) + ',';
    this.life = 0;
    
		this.particles = (function(ctx, x, y, strength, color, g, D) {;
			var p = [];

			var n = ~~(Math.random() * (maxTrails - minTrails)) + minTrails;
			var ay = g;
			for (var i = n; i--;) {
				var ax = D;
				var angle = i * Math.PI * 2 / n;
				if (angle < Math.PI) ax *= -1;
				var vx = strength * Math.sin(angle);
				var vy = strength * Math.cos(angle);
				p.push(new Particle(ctx, x, y, vx, vy, ax, ay, color));
			}

			return p;
		})(this.ctx, this.x, this.y, this.strength, this.color, g, D);    
  }  
  
  update() {
    this.life++;
    if (this.life < 0) return; //allows life to be delayed

    for (var i = this.particles.length; i--;) {
      this.particles[i].update();
      this.particles[i].draw();
    }
  }


  //---------------------------------------
  // utility functions
  //----------------------------------------  

}
