//-------------------------------------------------------------------
// TreasureHunt effect class
//-------------------------------------------------------------------
// TODO: 
//-------------------------------------------------------------------
class TreasureHuntEffect {
  constructor (config) {
    this._config = config;
    
    this._requestAnimationFrame = window.requestAnimationFrame || 
                                window.mozRequestAnimationFrame || 
                                window.webkitRequestAnimationFrame || 
                                window.msRequestAnimationFrame;
    this._cancelAnimationFrame = window.cancelAnimationFrame || window.mozCancelAnimationFrame;  

    this._mainCanvas = CreateElement._createElement('canvas', null, 'effectcanvas');
    this._mainContext = this._mainCanvas.getContext('2d');
    this._initialize();
  }  
  
  _initialize() {
    window.addEventListener('resize', this._resizeCanvas(this), false);
    this._resizeCanvas(this);
     
    var handler = (e, me) => {return this.cleanup(e, this);}
    this._mainCanvas.addEventListener('click', handler);
  }

  
  _resizeCanvas(me) {
    me._mainCanvas.width = window.innerWidth;
    me._mainCanvas.height = window.innerHeight;
  }
  
  cleanup(e, me) {
    window.cancelAnimationFrame(me.animationRequest);
    me._mainCanvas.parentNode.removeChild(me._mainCanvas);
    e.preventDefault();
    e.stopPropagation();
  }


  //-----------------------------------------------------------------------------
  // effect methods
  //-----------------------------------------------------------------------------  
  doEffect () {
    var router = {
      'fireworks': this._effectFireworks,
      'bouncing_text': this._effectScatterText,
      'cannon_text': this._effectCannonText
    };
    
    var effect = this._config.effect;

    if (router.hasOwnProperty(effect)) {
      router[effect](this); 
      
    } else {
      console.log('no router entry for effect: ' + effect);
      this._badEffect();
    }
  }  
  
  _effectFireworks(me) {
    me._config.container.appendChild(me._mainCanvas);
    
		me.fw1 = new Firework(me._mainCanvas, me._mainContext);
		me.fw2 = new Firework(me._mainCanvas, me._mainContext);
    me.LIFE = 150;
    me.delay = 0.5;
    me.fw2.life = -me.LIFE * me.delay;
    me._updateFireworks(me);    
    me.fw1.update();
    me.fw2.update();    
  }

  _updateFireworks(me) {
    me._mainContext.clearRect(0, 0, me._mainCanvas.width, me._mainCanvas.height);
    
    me.fw1.update();
    me.fw2.update();
    
    if (me.fw1.life == me.LIFE * me.delay) {
      me.fw2 = new Firework(me._mainCanvas, me._mainContext);
    }
    if (me.fw2.life == me.LIFE * me.delay) {
      me.fw1 = new Firework(me._mainCanvas, me._mainContext);
    }
    
    var callback = (x) => {return this._updateFireworks(me);}
    me.animationRequest = window.requestAnimationFrame(callback);
  }
   
  _effectScatterText(me) {
    me._config.container.appendChild(me._mainCanvas);
    me.delayCount = 1;
    me._updateScatterText(me);
  }

  _updateScatterText(me) {
    me.delayCount--;
    if (me.delayCount <= 0) {
      me.delayCount = 25;
      
      var ctx = me._mainContext;    
      var msg = me._config.arg1;

      var fontList = ['Arial', 'Roboto', '"Times New Roman"', 'Courier New"', 'Verdana', 'Georgia', 'Palatino', 'Bookman', '"Comic Sans MS"'];
      var fontFamily = fontList[~~(Math.random() * fontList.length)];
      var fontSize = ~~((Math.random() * 60) + 10);
      ctx.font = fontSize + 'px ' + fontFamily;
      
      ctx.strokeStyle = 'rgb(' + ~~(Math.random() * 255) + ',' + ~~(Math.random() * 255) + ',' + ~~(Math.random() * 255) + ')';
      ctx.fillStyle = 'rgb(' + ~~(Math.random() * 255) + ',' + ~~(Math.random() * 255) + ',' + ~~(Math.random() * 255) + ')';

      var twidth = Math.ceil(ctx.measureText(msg).width);
      var theight = Math.ceil(1.1 * ctx.measureText('M').width);
      
      var x = ~~((Math.random() * (me._mainCanvas.width - twidth)) + 1);
      var y = ~~((Math.random() * (me._mainCanvas.height - theight)) + 10);

      ctx.fillText(msg, x, y);
      ctx.strokeText(msg, x, y);
    }

    var callback = (x) => {return this._updateScatterText(me);}
    me.animationRequest = window.requestAnimationFrame(callback);
  }
  
  _effectCannonText(me) {
    me._config.container.appendChild(me._mainCanvas);
    
    me.cannonBalls = [];
    for (var i = 0; i < 10; i++) {
      me.cannonBalls[i] = me._launchCannonText(me, i * 50);
      me.cannonBalls[i].draw();
    }
    
    me._updateCannonText(me);
  }
  
  _launchCannonText(me, delay) {
    var msg = me._config.arg1;
    var x = 20;
    var y = me._mainCanvas.height - 20;
    var fontFamily = 'Arial';
    var fontSize = 20;
    
    var r = ~~(Math.random() * 255);
    var g = ~~(Math.random() * 255);
    var b = ~~(Math.random() * 255);
    var bgColor = 'rgb(' + r + ',' + g + ',' + b + ')';
    var fgColor = 'rgb(255, 255, 255)';
    
    var angle = ~~((Math.random() * (70)) + 10);
    var speed = 5;

    return new CannonBall(me._mainCanvas, me._mainContext, x, y, angle, speed, fgColor, bgColor, fontFamily, fontSize, msg, delay);
  }

  _updateCannonText(me) {
    me._mainContext.clearRect(0, 0, me._mainCanvas.width, me._mainCanvas.height);

    for (var i = 0; i < me.cannonBalls.length; i++) {
      me.cannonBalls[i].update();
      if (me.cannonBalls[i].atEdge()) {
        me.cannonBalls[i] = me._launchCannonText(me, 0);
      }
      me.cannonBalls[i].draw();
    }
    
    var callback = (x) => {return this._updateCannonText(me);}
    me.animationRequest = window.requestAnimationFrame(callback);
  }
  
  _badEffect() {
    console.log('_badEffect');
  }


  //---------------------------------------
  // drawing methods
  //----------------------------------------  

  //---------------------------------------
  // utility functions
  //----------------------------------------  
  _setDisplay(elem, display) {
    if (elem.classList.contains('egghide')) {
      elem.classList.remove('egghide');
    }
    if (!display) {
      elem.classList.add('egghide');
    }
  }  
  
  _clearElement(elem) {
    while (elem.firstChild) elem.removeChild(elem.firstChild);
  }
}
