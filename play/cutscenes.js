/* Sass Attack — cutscene module. Built from the approved preview.
   API: SassCutscenes.bind(ctx,W,H,FS) · setAudio(fn) · has(id) · dur(id) · start(id) · draw(tMs) · stop()
*/
window.SassCutscenes=(function(){
'use strict';
let ctx=null,W=0,H=0,FS=40;
let acGet=null;
function bind(c,w,h,f){ ctx=c; W=w; H=h; FS=f; }
function setAudio(fn){ acGet=fn; }
function ac(){ return acGet?acGet():null; }
let musicOn=true;
/* ---------- engine helpers ---------- */
const lerp=(a,b,k)=>a+(b-a)*k;
const clamp01=v=>Math.max(0,Math.min(1,v));
const ease=k=>k<0.5?2*k*k:1-Math.pow(-2*k+2,2)/2;
// seg: progress 0..1 between t0..t1 (ms), eased
const seg=(t,t0,t1)=>ease(clamp01((t-t0)/(t1-t0)));
// E: draw emoji at fractional coords
function E(e,fx,fy,scale=1,alpha=1,rot=0){
  ctx.save(); ctx.globalAlpha=alpha;
  ctx.translate(fx*W,fy*H); if(rot)ctx.rotate(rot);
  ctx.textAlign='center'; ctx.textBaseline='middle';
  ctx.font=`bold ${FS*scale}px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif`;
  ctx.fillText(e,0,0); ctx.restore();
}
const bob=(t,amp=0.008,spd=0.012)=>Math.sin(t*spd)*amp; // walk bounce
function caption(txt,alpha=1){
  ctx.save(); ctx.globalAlpha=alpha; ctx.textAlign='center';
  ctx.font=`900 ${Math.max(13,FS*0.42)}px Trebuchet MS,sans-serif`;
  ctx.fillStyle='rgba(255,210,63,.95)';
  ctx.shadowColor='rgba(0,0,0,.8)'; ctx.shadowBlur=8;
  ctx.fillText(txt, W/2, H*0.93); ctx.restore();
}
function bubble(fx,fy,txt,alpha=1){
  ctx.save(); ctx.globalAlpha=alpha;
  ctx.font=`bold ${FS*0.8}px "Apple Color Emoji","Segoe UI Emoji",sans-serif`;
  const w=ctx.measureText(txt).width+FS*0.7, h=FS*1.25;
  const x=fx*W, y=fy*H;
  ctx.fillStyle='rgba(255,255,255,.94)';
  ctx.beginPath();
  if(ctx.roundRect) ctx.roundRect(x-w/2,y-h/2,w,h,h*0.4);
  else { // older Safari fallback
    const r=h*0.4, L=x-w/2, T=y-h/2;
    ctx.moveTo(L+r,T); ctx.arcTo(L+w,T,L+w,T+h,r); ctx.arcTo(L+w,T+h,L,T+h,r);
    ctx.arcTo(L,T+h,L,T,r); ctx.arcTo(L,T,L+w,T,r);
  }
  ctx.moveTo(x-FS*0.18,y+h/2); ctx.lineTo(x+FS*0.18,y+h/2); ctx.lineTo(x,y+h/2+FS*0.3);
  ctx.fill();
  ctx.fillStyle='#111'; ctx.textAlign='center'; ctx.textBaseline='middle';
  ctx.fillText(txt,x,y+1); ctx.restore();
}
// disco: ball at (0.5, yFrac), sweeping light dots + dim
function disco(t,yFrac,intensity=1){
  ctx.save();
  ctx.globalAlpha=0.35*intensity; ctx.fillStyle='#000';
  ctx.fillRect(0,0,W,H);
  ctx.restore();
  const bx=0.5*W, by=yFrac*H;
  for(let i=0;i<10;i++){
    const a=t*0.0012+i*(Math.PI*2/10);
    const len=Math.max(W,H)*1.2;
    ctx.save(); ctx.globalAlpha=0.10*intensity;
    ctx.strokeStyle=['#00e0ff','#ff3b6b','#ffd23f','#37ffb0'][i%4];
    ctx.lineWidth=FS*0.35;
    ctx.beginPath(); ctx.moveTo(bx,by); ctx.lineTo(bx+Math.cos(a)*len, by+Math.sin(a)*len); ctx.stroke();
    ctx.restore();
  }
  for(let i=0;i<24;i++){
    const a=t*0.002+i*2.62; const r=(t*0.06+i*60)%(Math.max(W,H)*0.7);
    ctx.save(); ctx.globalAlpha=0.5*intensity*(1-r/(Math.max(W,H)*0.7));
    ctx.fillStyle=['#9be9ff','#ffd9e3','#fff3c4','#d2ffe9'][i%4];
    ctx.beginPath(); ctx.arc(bx+Math.cos(a)*r, by+Math.sin(a)*r, 3,0,7); ctx.fill(); ctx.restore();
  }
  E('🪩',0.5,yFrac,1.3,1,t*0.0006);
  ctx.save(); ctx.strokeStyle='rgba(255,255,255,.4)'; ctx.lineWidth=2;
  ctx.beginPath(); ctx.moveTo(bx,0); ctx.lineTo(bx,by-FS*0.8); ctx.stroke(); ctx.restore();
}
// deterministic pseudo-random per index
const pr=i=>{const x=Math.sin(i*127.1)*43758.5453; return x-Math.floor(x);};
function hearts(t,t0,cx,cy,n=18,spread=0.35){
  if(t<t0)return;
  for(let i=0;i<n;i++){
    const life=(t-t0)-pr(i)*600; if(life<0||life>2400)continue;
    const k=life/2400;
    const a=pr(i+50)*Math.PI*2, d=pr(i+99)*spread;
    E(pr(i)<0.5?'❤️':'💕',
      cx+Math.cos(a)*d*k, cy+Math.sin(a)*d*k-k*0.18,
      0.5+pr(i+7)*0.4, 1-k);
  }
}
function shards(t,t0,cx,cy,n=26){
  if(t<t0)return;
  for(let i=0;i<n;i++){
    const life=(t-t0)-pr(i)*300; if(life<0||life>2000)continue;
    const k=life/2000;
    const a=pr(i+31)*Math.PI*2, d=0.05+pr(i+63)*0.3;
    ctx.save(); ctx.globalAlpha=1-k;
    ctx.fillStyle=['#9be9ff','#ffffff','#ffd23f'][i%3];
    ctx.fillRect((cx+Math.cos(a)*d*k)*W,(cy+Math.sin(a)*d*k+k*k*0.25)*H,3,3);
    ctx.restore();
  }
}
function stars(t){
  for(let i=0;i<70;i++){
    const x=pr(i)*W, y=((pr(i+200)*H)+t*0.012*(0.3+pr(i+400)))%H;
    ctx.save(); ctx.globalAlpha=0.2+pr(i+300)*0.3; ctx.fillStyle='#cfe3ff';
    ctx.fillRect(x,y,1.6,1.6); ctx.restore();
  }
}
function flash(t,t0,dur=250){
  if(t<t0||t>t0+dur)return;
  ctx.save(); ctx.globalAlpha=0.6*(1-(t-t0)/dur); ctx.fillStyle='#fff';
  ctx.fillRect(0,0,W,H); ctx.restore();
}
function minus69(t,n=26){
  ctx.save(); ctx.font=`900 ${FS*0.45}px Trebuchet MS,sans-serif`; ctx.textAlign='center';
  for(let i=0;i<n;i++){
    const y=((pr(i+11)*1.4 + t*0.00012*(0.6+pr(i+77)))%1.2)-0.1;
    ctx.globalAlpha=0.75; ctx.fillStyle=['#ff3b6b','#ffd23f','#00e0ff'][i%3];
    ctx.fillText('−69', pr(i)*W, y*H);
  }
  ctx.restore();
}

/* ---------- chiptune engine ---------- */
let musicGain=null;
const FREQ=m=>440*Math.pow(2,(m-69)/12);   // midi -> Hz
// midi note shorthand
const N={C2:36,G2:43,A2:45,F2:41,E2:40,C3:48,D3:50,E3:52,F3:53,G3:55,A3:57,B3:59,
  C4:60,D4:62,E4:64,F4:65,G4:67,A4:69,B4:71,C5:72,D5:74,E5:76,F5:77,G5:79,A5:81,B5:83,
  C6:84,D6:86,E6:88};
function tone(t,midi,d,type='square',vol=0.18){
  const A=ac(); if(!A||!musicGain)return;
  const o=A.createOscillator(), g=A.createGain(), t0=A.currentTime+t;
  o.type=type; o.frequency.setValueAtTime(FREQ(midi),t0);
  g.gain.setValueAtTime(0.0001,t0);
  g.gain.linearRampToValueAtTime(vol,t0+0.012);
  g.gain.exponentialRampToValueAtTime(0.0001,t0+d);
  o.connect(g); g.connect(musicGain); o.start(t0); o.stop(t0+d+0.02);
}
function kick(t,vol=0.3){
  const A=ac(); if(!A||!musicGain)return;
  const o=A.createOscillator(), g=A.createGain(), t0=A.currentTime+t;
  o.type='square'; o.frequency.setValueAtTime(120,t0); o.frequency.exponentialRampToValueAtTime(45,t0+0.1);
  g.gain.setValueAtTime(vol,t0); g.gain.exponentialRampToValueAtTime(0.0001,t0+0.12);
  o.connect(g); g.connect(musicGain); o.start(t0); o.stop(t0+0.14);
}
function hat(t){ tone(t,N.C6+15,0.03,'square',0.05); }

/* track builders: schedule one pattern starting at offset (s), return pattern length (s) */
const TRACKS={
  love(off){ // 90 BPM sweet ballad — C Am F G
    const b=60/90;
    [[N.C3,0],[N.C3,1],[N.A2,2],[N.A2,3],[N.F2,4],[N.F2,5],[N.G2,6],[N.G2,7]]
      .forEach(([m,i])=>tone(off+i*b,m,b*0.9,'triangle',0.14));
    const mel=[[N.E5,0,.5],[N.G5,.5,.5],[N.C6,1,1],[N.B5,2,.5],[N.A5,2.5,.5],[N.E5,3,1],
               [N.F5,4,.5],[N.A5,4.5,.5],[N.C6,5,1],[N.D6,6,.75],[N.B5,6.75,.25],[N.G5,7,1]];
    mel.forEach(([m,beat,len])=>tone(off+beat*b,m,len*b*0.92,'triangle',0.12));
    tone(off+1.5*b,N.E6,0.1,'sine',0.06); tone(off+5.5*b,N.E6,0.1,'sine',0.06); // sparkle
    return 8*b;
  },
  arcade(off){ // 150 BPM driving
    const b=60/150;
    for(let i=0;i<8;i++) tone(off+i*b,[N.C3,N.C3,N.G3,N.C3][i%4],b*0.55,'square',0.12);
    const mel=[[N.C5,0,.5],[N.E5,.5,.5],[N.G5,1,.5],[N.A5,1.5,.5],[N.G5,2,.5],[N.E5,2.5,.5],[N.D5,3,1],
               [N.C5,4,.5],[N.E5,4.5,.5],[N.G5,5,.5],[N.C6,5.5,.5],[N.B5,6,.5],[N.G5,6.5,.5],[N.C6,7,1]];
    mel.forEach(([m,beat,len])=>tone(off+beat*b,m,len*b*0.85,'square',0.10));
    return 8*b;
  },
  disco(off){ // 115 BPM four-on-floor + octave bass + stabs
    const b=60/115;
    for(let i=0;i<4;i++){ kick(off+i*b); hat(off+i*b+b/2); }
    for(let i=0;i<8;i++) tone(off+i*b/2,[N.C2,N.C3][i%2],b*0.4,'square',0.15);
    [[0.5,N.E4],[0.5,N.G4],[0.5,N.B4],[2.5,N.F4],[2.5,N.A4],[2.5,N.C5]]
      .forEach(([beat,m])=>tone(off+beat*b,m,b*0.3,'sawtooth',0.05));
    return 4*b;
  },
  tense(off){ // standoff: low drone fifth + sparse pings
    tone(off,N.C2,2.4,'sawtooth',0.07); tone(off,N.G2,2.4,'sawtooth',0.05);
    tone(off+0.9,N.C6,0.12,'triangle',0.07); tone(off+1.8,N.B5,0.12,'triangle',0.07);
    return 2.4;
  }
};
function startMusic(name,durMs,stopAtMs){
  const A=ac(); if(!A||!musicOn||!name)return;
  stopMusic();
  musicGain=A.createGain(); musicGain.gain.value=1; musicGain.connect(A.destination);
  const cap=(stopAtMs!=null?stopAtMs:durMs)/1000;
  let t=0;
  while(t<cap){ const len=TRACKS[name](t); t+=len; }
  if(stopAtMs!=null){ // hard cut + sad sting (the disco dies)
    const t0=A.currentTime+stopAtMs/1000;
    musicGain.gain.setValueAtTime(1,t0); musicGain.gain.linearRampToValueAtTime(0.0001,t0+0.05);
    const g2=A.createGain(); g2.gain.value=1; g2.connect(A.destination);
    const sting=(tt,m,d,v)=>{ const o=A.createOscillator(),g=A.createGain();
      o.type='triangle'; o.frequency.setValueAtTime(FREQ(m),A.currentTime+tt);
      g.gain.setValueAtTime(0.0001,A.currentTime+tt); g.gain.linearRampToValueAtTime(v,A.currentTime+tt+0.02);
      g.gain.exponentialRampToValueAtTime(0.0001,A.currentTime+tt+d);
      o.connect(g); g.connect(g2); o.start(A.currentTime+tt); o.stop(A.currentTime+tt+d+0.02); };
    sting(stopAtMs/1000+0.5,N.G4,0.5,0.12); sting(stopAtMs/1000+1.0,N.E4,0.5,0.10); sting(stopAtMs/1000+1.5,N.C4,1.2,0.10);
    stingGain=g2;
  }
}
let stingGain=null;
function stopMusic(){
  if(musicGain){ try{ musicGain.gain.linearRampToValueAtTime(0.0001,(ac()?ac().currentTime:0)+0.08);
    const g=musicGain; setTimeout(()=>{try{g.disconnect();}catch{}},150); }catch{} musicGain=null; }
  if(stingGain){ try{ const g=stingGain; g.gain.linearRampToValueAtTime(0.0001,ac().currentTime+0.08);
    setTimeout(()=>{try{g.disconnect();}catch{}},150); }catch{} stingGain=null; }
}

/* ---------- the scenes ---------- */
/* each: {id,e,title,note,dur,draw(t)} — t in ms from scene start */
const SCENES=[
{grp:'ROTATION — between early waves'},
{id:'chase',music:'arcade',e:'🌭',title:'The Chase',note:'after wave 1 · 6s',dur:6000,draw(t){
  stars(t);
  if(t<2700){ // L -> R
    const k=seg(t,0,2700);
    E('😈', lerp(-0.1,1.1,k), 0.55+bob(t), 1.1);
    E('🌭', lerp(-0.28,0.92,k), 0.55, 1, 1, t*0.02);
    E('🐣', lerp(-0.46,0.74,k), 0.55+bob(t,0.012), 1.15);
  } else { // R -> L, the return trip: she's eating it as she runs
    const k=seg(t,3100,5800);
    const sx=lerp(1.15,-0.15,k);
    E('🐣', sx, 0.55+bob(t,0.012), 1.15);
    E('🌭', sx+0.09, 0.545, Math.max(0.25,1-k*0.9), 1); // shrinking: being eaten
    E('😈', 0.88, 0.18, 0.9, 0.8); // watching from the corner, confused
    if(k>0.3) bubble(0.88,0.10,'?',Math.min(1,(k-0.3)*4));
  }
  if(t>5200) caption('…', seg(t,5200,5600));
}},
{id:'audience',music:'arcade',e:'👹',title:'The Audience',note:'boss wave · 7s · the first tell',dur:7000,draw(t){
  stars(t);
  const rise=seg(t,200,1800), sink=seg(t,4300,5600);
  const ky=lerp(1.25,0.5,rise)+lerp(0,0.75,sink);
  E('👹',0.62,ky,3.0);
  E('🐣',0.18,0.85+bob(t),1.15);
  if(t>=3000&&t<4200){ // one hot dog, bounces off forehead
    const k=seg(t,3000,3700);
    if(k<1) E('🌭', lerp(0.18,0.60,k), lerp(0.78,0.40,k), 0.9, 1, k*9);
    else { const k2=seg(t,3700,4200); E('🌭', lerp(0.60,0.70,k2), lerp(0.40,0.78,k2), 0.9, 1-k2, 4+k2*5); }
    if(t>3650) E('⭐',0.61,0.38,0.7,1-seg(t,3700,4200));
  }
  if(t>=5400){ // the tiny heart… and the swat
    const hk=seg(t,5400,5900);
    if(t<6100) E('❤️',0.62,lerp(0.92,0.84,hk),0.55,Math.min(1,hk*2));
    else E('💨',0.66,0.85,0.6,1-seg(t,6100,6700));
  }
  if(t>4600) caption('no retaliation.', seg(t,4600,5100));
}},
{id:'discobreak',music:'disco',e:'🪩',title:'Disco Break',note:'mid-run · 7s',dur:7000,draw(t){
  stars(t);
  const drop=seg(t,0,1500), riseK=seg(t,5400,6800);
  const ballY=lerp(-0.15,0.22,drop)-lerp(0,0.4,riseK);
  const inten=Math.min(drop,1-riseK);
  if(inten>0.02) disco(t,ballY,inten);
  const hop=(ph)=>t>1500&&t<5400 ? -Math.abs(Math.sin(t*0.006+ph))*0.035 : 0;
  E('😈',0.25,0.72+hop(0),1.1);
  E('🐣',0.50,0.72+hop(0),1.2); // perfectly in sync — that's the gag
  E('😈',0.75,0.72+hop(0),1.1);
  if(t>5600) caption('everyone needs a minute.', seg(t,5600,6100));
}},
{id:'tax',music:'arcade',e:'💸',title:'The Sass Tax',note:'mid-run · 6s',dur:6000,draw(t){
  stars(t); minus69(t);
  const tilt=t>4150&&t<5200 ? Math.sin(seg(t,4150,5200)*Math.PI)*0.3 : 0;
  E('🐣',0.5,0.74+bob(t,0.004),1.3,1,tilt);
  if(t>1800&&t<2600) bubble(0.5,0.58,'🤷',seg(t,1800,2100)*(1-seg(t,2300,2600)));
  if(t>=3000&&t<4200){ // defiant shot up… and back down
    const up=seg(t,3000,3500);
    if(up<1) E('🌭',0.5,lerp(0.66,0.05,up),0.9);
    else { const dn=seg(t,3550,4150); E('🌭',0.5,lerp(0.05,0.66,dn),0.9,1,dn*6); }
  }
  if(t>4100&&t<5000) E('⭐',0.5,0.62,0.8,1-seg(t,4200,5000));
  if(t>4600) caption('worth it.', seg(t,4600,5100));
}},
{grp:'ROTATION — deep waves'},
{id:'bed',music:'love',e:'☕',title:'Breakfast in Bed',note:'deep waves · 7s · the truce',dur:7000,draw(t){
  stars(t);
  const k=seg(t,400,6200);
  const x=lerp(-0.2,1.2,k);
  // a boss-sized demon attempting to be small. it is not working.
  E('👹', x, 0.86+bob(t,0.004,0.02), 2.1);
  E('☕', x+0.13, 0.80, 0.8);
  E('🐣', 0.15, 0.16, 1.1); // watching the entire crossing
  // pointedly not making eye contact
  if(t>2500&&t<3400) bubble(0.15,0.05,'👀',seg(t,2500,2800)*(1-seg(t,3100,3400)));
  if(t>5000) caption('an unspoken truce.', seg(t,5000,5500));
}},
{id:'inferno',music:'disco',musicStop:3000,e:'💥',title:'Disco Inferno',note:'deep waves · 7s',dur:7000,draw(t){
  stars(t);
  const drop=seg(t,0,1800);
  const alive=t<3000;
  if(alive) disco(t, lerp(-0.15,0.25,drop), drop);
  if(t>=2200&&t<3050){ // the diver
    const k=seg(t,2200,3000);
    E('👿', lerp(1.1,0.5,k), lerp(-0.1,0.25,k), 1.1, 1, k*3);
  }
  flash(t,3000);
  shards(t,3000,0.5,0.25,40);
  // sass mourns
  const bow=t>3600?Math.min(0.25,seg(t,3600,4600)*0.25):0;
  E('🐣',0.5,0.78,1.25,1,bow);
  if(t>4400) caption('moment of silence for the ball.', seg(t,4400,4900));
}},
{id:'nego',music:'tense',e:'🍗',title:'The Negotiation',note:'boss wave · 8s',dur:8000,draw(t){
  stars(t);
  E('👹',0.74,0.45,2.8);
  E('🐣',0.2,0.8+bob(t,0.004),1.2);
  const show=(t0,t1)=>seg(t,t0,t0+300)*(1-seg(t,t1-300,t1));
  if(t>800 &&t<2300) bubble(0.74,0.20,'🍗?', show(800,2300));
  if(t>2500&&t<4000) bubble(0.20,0.62,'🌭.', show(2500,4000));
  if(t>4200&&t<5500) bubble(0.74,0.20,'🍗🍗?', show(4200,5500));
  if(t>=5600&&t<6500){ // she fires, he blocks WITH A DRUMSTICK
    const k=seg(t,5600,6100);
    if(k<1) E('🌭', lerp(0.2,0.60,k), lerp(0.74,0.50,k), 0.9, 1, k*8);
    else { const k2=seg(t,6100,6500); E('🌭', lerp(0.60,0.52,k2), lerp(0.50,0.85,k2), 0.9, 1-k2, 8+k2*6); }
  }
  if(t>5900) E('🍗',0.62,0.50,1.2,1, t>6200?0.15:0); // the block, then a proud little tilt
  if(t>6700) caption('some negotiations fail.', seg(t,6700,7200));
}},
{grp:'THE LOVE ARC'},
{id:'offering',music:'love',e:'🌭',title:'The Offering',note:'boss wave · 8s',dur:8000,draw(t){
  stars(t);
  const rise=seg(t,200,1500), sink=seg(t,3000,4000);
  const ky=lerp(1.25,0.5,rise)+lerp(0,0.75,sink);
  if(t<4600){
    E('👹',0.5,ky,2.8);
    // looks both ways
    if(t>1500&&t<2400) E('👀',0.5+Math.sin(t*0.01)*0.05,0.30,0.6,0.7);
  } else {
    E('👹',0.5,1.06,2.8); // sunk: just the horn tips visible, watching
  }
  if(t>=2300){ // the hot dog placed gently on the ground
    const place=seg(t,2300,2900);
    const eaten=t>6600?Math.max(0.2,1-seg(t,6600,7400)):1;
    if(t<7400) E('🌭',0.5,lerp(0.58,0.86,place),0.9*eaten);
  }
  if(t>=4200){ // sass arrives, inspects, eats
    const walk=seg(t,4200,5600);
    E('🐣', lerp(-0.15,0.42,walk), 0.84+bob(t,walk<1?0.01:0.002), 1.2);
    if(t>5800&&t<6500) bubble(0.42,0.68,'🤨',seg(t,5800,6100)*(1-seg(t,6300,6500)));
    hearts(t,6900,0.46,0.80,6,0.12);
  }
  if(t>6900) caption('he waited.', seg(t,6900,7400));
}},
{id:'madly',music:'love',e:'❤️',title:'Madly',note:'late run · 8s · the showpiece',dur:8000,draw(t){
  stars(t);
  const drop=seg(t,0,1400);
  disco(t, lerp(-0.15,0.18,drop), drop);
  const rise=seg(t,800,2600);
  E('👹',0.66,lerp(1.25,0.46,rise),3.0);
  E('🐣',0.2,0.82+bob(t,0.004),1.2);
  if(t>3000&&t<5000) bubble(0.66,0.17,'❤️🐣?', seg(t,3000,3300)*(1-seg(t,4700,5000)));
  if(t>=5000&&t<5900){ // she answers in the only language she has
    const k=seg(t,5000,5800);
    E('🌭', lerp(0.2,0.60,k), lerp(0.76,0.50,k), 0.9, 1, k*6);
  }
  if(t>=5800){ E('🌭',0.615,0.50,0.9,1,5.6); } // caught. in his mouth.
  hearts(t,6000,0.5,0.5,30,0.55);
  if(t>6300){ // the synchronized hop from the dance scene
    const hop=-Math.abs(Math.sin(t*0.006))*0.03;
    E('🐣',0.2,0.82+hop,1.2);
  }
  flash(t,6000,180);
  if(t>6600) caption("that's a yes.", seg(t,6600,7100));
}},
{grp:'FIXED SLOTS — the Mirror Match'},
{id:'reflection',music:'tense',e:'🪞',title:'The Reflection',note:'always right before the Mirror · 7s',dur:7000,draw(t){
  stars(t);
  ctx.save(); ctx.globalAlpha=0.45*seg(t,0,800); ctx.fillStyle='#000'; ctx.fillRect(0,0,W,H); ctx.restore();
  const w1=seg(t,300,2100), w2=seg(t,300,2100);
  const x1=lerp(-0.15,0.35,w1), x2=lerp(1.15,0.65,w2);
  // she moves; it moves. perfectly.
  const hop=t>3000&&t<3500?-Math.abs(Math.sin(seg(t,3000,3500)*Math.PI))*0.04:0;
  E('🐣',x1,0.62+bob(t,w1<1?0.01:0)+hop,1.3);
  E('🐣',x2,0.62+bob(t,w2<1?0.01:0)+hop,1.3);
  if(t>=4800){ // both draw, gunslinger style
    const k=seg(t,4800,5300);
    E('🌭',x1+0.10,0.60,0.8*k,k, 0.6);
    E('🌭',x2-0.10,0.60,0.8*k,k,-0.6);
  }
  flash(t,5900,300);
  if(t>5900) caption('outmaneuver yourself.', seg(t,5900,6400));
}},
{id:'selflove',music:'love',e:'💛',title:'Self Love',note:'after beating the Mirror · 7s',dur:7000,draw(t){
  stars(t); shards(t,0,0.62,0.45,30);
  const walk=seg(t,300,2400);
  const sx=lerp(-0.15,0.56,walk);
  E('🐣',sx,0.78+bob(t,walk<1?0.01:0.002),1.25);
  if(t<4200) E('🌭',0.62,0.84,0.9,1,0.4); // her double's, dropped
  if(t>=3000&&t<4200){ const k=seg(t,3000,4000); E('🌭',lerp(0.62,0.58,k),lerp(0.84,0.74,k),0.9*(1-k*0.5),1-k*0.6,0.4); }
  hearts(t,4400,0.58,0.70,8,0.14);
  if(t>=4800){ // walks off with the only positive 69 in the game
    const off=seg(t,4800,6600);
    const ox=lerp(0.56,1.2,off);
    E('🐣',ox,0.78+bob(t,0.01),1.25);
    ctx.save(); ctx.globalAlpha=1-off*0.4; ctx.font=`900 ${FS*0.5}px Trebuchet MS,sans-serif`;
    ctx.fillStyle='#37ffb0'; ctx.textAlign='center';
    ctx.fillText('+69',(ox)*W,(0.62-off*0.06)*H); ctx.restore();
  }
  if(t>5200) caption('the only positive 69 in the game.', seg(t,5200,5700));
}},
{id:'proud',music:'love',e:'🥹',title:'Proud Demon',note:'post-Mirror variant · 6s',dur:6000,draw(t){
  stars(t); shards(t,0,0.4,0.4,24);
  const rise=seg(t,400,1700), sink=seg(t,4300,5500);
  const ky=lerp(1.25,0.72,rise)+lerp(0,0.6,sink);
  const nod=t>2800&&t<3700?Math.sin(seg(t,2800,3700)*Math.PI)*0.05:0;
  E('👹',0.82,ky+nod,2.4);
  if(t>=3900){ // and this time, he lets it stay
    const k=seg(t,3900,5800);
    E('❤️',0.82,lerp(0.55,0.30,k),0.7,1);
  }
  if(t>4300) caption('this time he let it stay.', seg(t,4300,4800));
}},
{id:'outnumbered',music:'tense',e:'❓',title:'Outnumbered',note:'Sass Death only, post-double-Mirror · 6s',dur:6000,draw(t){
  stars(t);
  shards(t,0,0.35,0.4,20); shards(t,200,0.65,0.4,20);
  // faint disco light, no ball. nothing is explained.
  if(t>1500&&t<4200){
    const k=Math.min(seg(t,1500,2000),1-seg(t,3700,4200));
    for(let i=0;i<3;i++){
      E('🐣',0.3+i*0.2,0.32,1.4,0.18*k);
    }
  }
  E('🐣',0.5,0.8,1.25);
  if(t>2600&&t<4000) bubble(0.5,0.64,'🤨',seg(t,2600,2900)*(1-seg(t,3700,4000)));
  if(t>4300) caption('nothing is explained.', seg(t,4300,4800));
}},
];


const BYID={}; SCENES.forEach(s=>{ if(!s.grp) BYID[s.id]=s; });
let current=null;
function has(id){ return !!BYID[id]; }
function dur(id){ return BYID[id]?BYID[id].dur:0; }
function start(id){ current=BYID[id]||null; if(current) startMusic(current.music,current.dur,current.musicStop); return current?current.dur:0; }
function draw(t){ if(current&&ctx) current.draw(t); }
function stop(){ stopMusic(); current=null; }
return {bind,setAudio,has,dur,start,draw,stop};
})();
