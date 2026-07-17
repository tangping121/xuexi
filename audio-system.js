// ═══════════════════════════════════════════
// AudioSys v2 - Local audio with preloading
// 1) Sound effects: pre-rendered WAV via Web Audio
// 2) Speech: pre-warm + cache, near-instant
// ═══════════════════════════════════════════
const AudioSys = (function(){
  var ctx=null, buf={}, warmed=false, preloaded=[];
  function gC(){if(!ctx){ctx=new(window.AudioContext||window.webkitAudioContext)()}if(ctx.state==='suspended')ctx.resume();return ctx}
  // ── Pre-render tones to AudioBuffer (zero-latency playback) ──
  function renderTone(freq,dur,type,vol){
    try{
      var c=gC(),sr=c.sampleRate,len=Math.ceil(sr*dur);
      var buf2=c.createBuffer(1,len,sr),d2=buf2.getChannelData(0);
      for(var i=0;i<len;i++){
        var t=i/sr,v=Math.sin(2*Math.PI*freq*t);
        if(type==='square')v=v>0?1:-1;
        v*=(1-i/len); // fade out
        d2[i]=v*vol;
      }
      return buf2;
    }catch(e){return null}
  }
  function preRender(id,freq,dur,type,vol){
    try{var c=gC();c.decodeAudioData(renderTone(freq,dur,type,vol).getChannelData(0).buffer,function(b){buf[id]=b})}catch(e){}
    // Sync fallback
    var b=renderTone(freq,dur,type,vol);if(b)buf[id]=b;
  }
  function playBuf(id,delay){
    try{
      var c=gC(),b=buf[id];
      if(!b){var t=id.split('_');b=renderTone(parseFloat(t[0]),parseFloat(t[1])||.2,'sine',.15);if(!b)return}
      var s=c.createBufferSource();s.buffer=b;
      var g=c.createGain();s.connect(g);g.connect(c.destination);
      g.gain.setValueAtTime(.5,c.currentTime);
      s.start(c.currentTime+(delay||0));
    }catch(e){}
  }
  // Pre-render all sound effects
  function initSFX(){
    preRender('cor1',523,.12,'sine',.25);preRender('cor2',659,.12,'sine',.25);preRender('cor3',784,.2,'sine',.25);
    preRender('wro1',300,.15,'square',.12);preRender('wro2',250,.25,'square',.12);
    preRender('sta1',880,.08,'sine',.2);preRender('sta2',1100,.12,'sine',.2);preRender('sta3',1320,.15,'sine',.2);
    preRender('cli1',800,.04,'sine',.15);
  }
  function correct(){playBuf('cor1');setTimeout(function(){playBuf('cor2')},90);setTimeout(function(){playBuf('cor3')},180)}
  function wrong(){playBuf('wro1');setTimeout(function(){playBuf('wro2')},120)}
  function star(){playBuf('sta1');setTimeout(function(){playBuf('sta2')},70);setTimeout(function(){playBuf('sta3')},140)}
  function click(){playBuf('cli1')}
  function celebrate(){var ns=[523,587,659,698,784,880,988,1047];ns.forEach(function(f,i){setTimeout(function(){var b=renderTone(f,.12,'sine',.15);if(b){try{var c=gC(),s=c.createBufferSource();s.buffer=b;var g=c.createGain();s.connect(g);g.connect(c.destination);g.gain.setValueAtTime(.5,c.currentTime);s.start()}catch(e){}}},i*70)})}
  // ── Speech with preload cache ──
  function speak(text,opts){
    if(!text||!window.speechSynthesis)return;
    window.speechSynthesis.cancel();
    var u=new SpeechSynthesisUtterance(text);
    u.lang=(opts&&opts.lang)||'zh-CN';u.rate=(opts&&opts.rate)||.8;u.pitch=(opts&&opts.pitch)||1;
    var vs=window.speechSynthesis.getVoices&&window.speechSynthesis.getVoices();
    if(vs&&vs.length){var v=vs.find(function(x){return x.lang.startsWith(u.lang.slice(0,2))});if(v)u.voice=v}
    window.speechSynthesis.speak(u);
  }
  // ── Preload all speech content (speak silently to force cache) ──
  function preloadSpeech(arr,lang){
    if(!window.speechSynthesis||preloaded.length)return;
    // Speak all phrases with volume=0 to cache them
    arr.forEach(function(text,i){
      setTimeout(function(){
        try{
          var u=new SpeechSynthesisUtterance(text);
          u.lang=lang||'zh-CN';u.volume=0.01;u.rate=.8;
          window.speechSynthesis.speak(u);
        }catch(e){}
      },i*20); // stagger to avoid overwhelming
    });
  }
  // Auto-init
  function init(){
    setTimeout(function(){
      if(!window.speechSynthesis)return;
      window.speechSynthesis.getVoices();
      window.speechSynthesis.cancel();
      // Full warmup: speak a sentence silently
      var u=new SpeechSynthesisUtterance('大家好，欢迎来到学习乐园');
      u.volume=0.01;u.rate=.8;
      window.speechSynthesis.speak(u);
    },100);
    setTimeout(function(){
      if(!window.speechSynthesis)return;
      // Force voice loading
      window.speechSynthesis.getVoices();
    },300);
    initSFX();
  }
  if(document.readyState==='complete')init();else window.addEventListener('load',init);
  setTimeout(init,200);

  return{speak:speak,correct:correct,wrong:wrong,star:star,click:click,celebrate:celebrate,preloadSpeech:preloadSpeech,gC:gC};
})();
