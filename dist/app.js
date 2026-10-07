'use strict';
const body=document.body,cover=document.querySelector('#cover'),content=document.querySelector('#content');
body.classList.add('locked');
// The first visible cover is the decoded, embedded artwork, never its fallback.
const coverImage=new Image();
coverImage.onload=async()=>{if(coverImage.decode){try{await coverImage.decode()}catch{}}requestAnimationFrame(()=>body.classList.add('cover-art-ready'));};
coverImage.onerror=()=>body.classList.add('cover-art-ready');
const coverSource=document.querySelector('#initial-cover-art').textContent.match(/url\("([^"]+)"\)/);
coverImage.src=coverSource?coverSource[1]:'assets/cover-luxe.webp';

let opening=false,openingTimers=[];
const reducedMotion=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const skipButton=document.querySelector('#skip-intro');
// Load the decorative layers before the cover opens, preventing a blank reveal.
const artworkReady=Promise.all(['assets/silk-valance.webp','assets/curtain-silk.webp','assets/garden.webp','assets/heart-blush-pearl.webp'].map(src=>new Promise(resolve=>{const image=new Image();image.onload=image.onerror=resolve;image.src=src;})));
function later(fn,delay){openingTimers.push(setTimeout(fn,delay));}
function finishReveal(){openingTimers.forEach(clearTimeout);openingTimers=[];body.classList.add('opened','revealing','reveal-complete');cover.classList.add('gone');content.inert=false;body.classList.remove('locked');skipButton.hidden=true;document.querySelector('#toolbar').hidden=false;document.querySelector('h1').focus({preventScroll:true});}
async function openInvitation(){
 if(opening)return;opening=true;
 const label=document.querySelector('.seal-label');label.textContent='OPENING…';
 await Promise.race([artworkReady,new Promise(resolve=>setTimeout(resolve,3500))]);
 label.textContent='TAP TO OPEN';
 if(reducedMotion){finishReveal();return;}
 cover.classList.add('opening');
 later(()=>{cover.classList.add('gone');content.inert=false;skipButton.hidden=false;skipButton.focus({preventScroll:true});},1800);
 later(()=>body.classList.add('opened'),2150);
 later(()=>body.classList.add('revealing'),3300);
 later(finishReveal,9800);
}
document.querySelector('#open').addEventListener('click',openInvitation);
skipButton.addEventListener('click',finishReveal);
document.querySelector('#replay').addEventListener('click',()=>{
 openingTimers.forEach(clearTimeout);openingTimers=[];
 window.scrollTo({top:0,behavior:'instant'});content.inert=true;
 body.classList.add('replay-reset');body.classList.remove('opened','revealing','reveal-complete');body.classList.add('locked');
// The first visible cover is the decoded, embedded artwork, never its fallback.
const coverImage=new Image();
coverImage.onload=async()=>{if(coverImage.decode){try{await coverImage.decode()}catch{}}requestAnimationFrame(()=>body.classList.add('cover-art-ready'));};
coverImage.onerror=()=>body.classList.add('cover-art-ready');
const coverSource=document.querySelector('#initial-cover-art').textContent.match(/url\("([^"]+)"\)/);
coverImage.src=coverSource?coverSource[1]:'assets/cover-luxe.webp';

 void document.querySelector('.hero').offsetWidth;requestAnimationFrame(()=>body.classList.remove('replay-reset'));
 cover.classList.remove('gone','opening');document.querySelector('#toolbar').hidden=true;
 skipButton.hidden=true;opening=false;document.querySelector('#open').focus({preventScroll:true});
});
const observer=new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting){e.target.classList.add('visible');observer.unobserve(e.target)}}),{threshold:.12});document.querySelectorAll('.reveal').forEach(e=>observer.observe(e));
// Real touch and pointer scratching, with a keyboard-accessible alternative.
const canvas=document.querySelector('#scratch'),ctx=canvas.getContext('2d');
const heart=new Path2D('M280 468C230 414 28 276 28 154C28 12 206 -6 280 124C354 -6 532 12 532 154C532 276 330 414 280 468Z');
function paintScratch(art){
 ctx.globalCompositeOperation='source-over';ctx.clearRect(0,0,560,500);
 ctx.save();ctx.clip(heart);
 if(art){ctx.drawImage(art,0,0,560,500);}else{const foil=ctx.createLinearGradient(0,0,560,500);foil.addColorStop(0,'#8d9871');foil.addColorStop(.5,'#607049');foil.addColorStop(1,'#9b9d70');ctx.fillStyle=foil;ctx.fillRect(0,0,560,500);}
 ctx.strokeStyle='#dec995';ctx.lineWidth=5;ctx.stroke(heart);
 ctx.save();ctx.translate(280,250);ctx.scale(.945,.94);ctx.translate(-280,-250);ctx.lineWidth=1.3;ctx.strokeStyle='#f8e8bc';ctx.stroke(heart);ctx.restore();
 const glow=ctx.createRadialGradient(280,258,18,280,258,160);glow.addColorStop(0,'#34452b66');glow.addColorStop(1,'#34452b00');ctx.fillStyle=glow;ctx.fillRect(0,0,560,500);
 ctx.fillStyle='#fff0d0';ctx.textAlign='center';ctx.shadowColor='#263520';ctx.shadowBlur=4;ctx.font='italic 36px Georgia';ctx.fillText('A little love,',280,230);ctx.fillText('a little surprise.',280,275);ctx.font='15px Arial';ctx.fillText('SCRATCH TO REVEAL',280,325);ctx.restore();
}
let scratching=false,revealed=false,last=null,strokes=0;
paintScratch();
const heartArt=new Image();heartArt.onload=()=>{if(!strokes&&!revealed)paintScratch(heartArt)};heartArt.src='assets/heart-embossed.webp';
function revealDate(){if(revealed)return;revealed=true;document.querySelector('.heart-wrap').classList.add('date-revealed');canvas.style.transition='opacity .7s';canvas.style.opacity='0';canvas.style.pointerEvents='none';document.querySelector('#scratch-hint').textContent='A beautiful day to begin forever.';document.querySelector('#reveal-date').hidden=true;}
function point(e){const r=canvas.getBoundingClientRect();return {x:(e.clientX-r.left)*canvas.width/r.width,y:(e.clientY-r.top)*canvas.height/r.height};}
function scratch(e){if(!scratching||revealed)return;e.preventDefault();const p=point(e);ctx.globalCompositeOperation='destination-out';ctx.lineWidth=55;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(last?last.x:p.x,last?last.y:p.y);ctx.lineTo(p.x,p.y);ctx.stroke();last=p;if(++strokes%20===0){const data=ctx.getImageData(0,0,560,500).data;let left=0;for(let i=3;i<data.length;i+=40)if(data[i]>0)left++;if(left<5800)revealDate();}}
canvas.addEventListener('pointerdown',e=>{scratching=true;canvas.setPointerCapture(e.pointerId);last=point(e);scratch(e)});canvas.addEventListener('pointermove',scratch);canvas.addEventListener('pointerup',()=>{scratching=false;last=null});canvas.addEventListener('pointercancel',()=>{scratching=false;last=null});document.querySelector('#reveal-date').addEventListener('click',revealDate);
const weddingDate=new Date('2026-11-06T18:00:00+05:30');function tick(){let s=Math.max(0,Math.floor((weddingDate-Date.now())/1000));document.querySelector('#days').textContent=String(Math.floor(s/86400)).padStart(2,'0');document.querySelector('#hours').textContent=String(Math.floor(s/3600)%24).padStart(2,'0');document.querySelector('#minutes').textContent=String(Math.floor(s/60)%60).padStart(2,'0');document.querySelector('#seconds').textContent=String(s%60).padStart(2,'0');}tick();setInterval(tick,1000);
document.querySelector('#rsvp').addEventListener('submit',e=>{e.preventDefault();const data=Object.fromEntries(new FormData(e.target));let saved=false;try{localStorage.setItem('afridi-wedding-rsvp',JSON.stringify(data));saved=true}catch{}const status=document.querySelector('#rsvp-result');status.hidden=false;status.textContent=saved?'Thank you, '+data.name+'! Your response has been saved.':'Your response could not be saved on this device. Please share your wishes directly with the couple.';status.scrollIntoView({behavior:'smooth',block:'center'});});
// A quiet original plucked melody; starts only on an explicit button press.
let audioCtx,musicTimer,musicOn=false,step=0;const musicButton=document.querySelector('#music');const notes=[261.63,329.63,392,523.25,440,392,329.63,293.66];function playNote(){if(!musicOn)return;const osc=audioCtx.createOscillator(),gain=audioCtx.createGain();osc.type='sine';osc.frequency.value=notes[step++%notes.length];gain.gain.setValueAtTime(0,audioCtx.currentTime);gain.gain.linearRampToValueAtTime(.035,audioCtx.currentTime+.04);gain.gain.exponentialRampToValueAtTime(.0001,audioCtx.currentTime+2);osc.connect(gain);gain.connect(audioCtx.destination);osc.start();osc.stop(audioCtx.currentTime+2.1)}musicButton.addEventListener('click',async()=>{try{if(!audioCtx)audioCtx=new(window.AudioContext||window.webkitAudioContext)();await audioCtx.resume();musicOn=!musicOn;musicButton.setAttribute('aria-pressed',String(musicOn));musicButton.setAttribute('aria-label',musicOn?'Pause background music':'Play gentle background music');if(musicOn){playNote();musicTimer=setInterval(playNote,700)}else{clearInterval(musicTimer);await audioCtx.suspend();}}catch{musicButton.textContent='♪';musicButton.title='Music is unavailable in this browser';}});
