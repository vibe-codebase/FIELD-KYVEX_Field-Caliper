(function(){
'use strict';
var d=document,root=d.documentElement,rm=window.matchMedia('(prefers-reduced-motion: reduce)');
/* phone menu */
var btn=d.querySelector('.menu-btn'),list=d.getElementById('nav-list');
function setMenu(o){btn.setAttribute('aria-expanded',o?'true':'false');root.classList.toggle('menu-open',o);}
if(btn&&list){
  btn.addEventListener('click',function(){setMenu(btn.getAttribute('aria-expanded')!=='true');});
  d.addEventListener('keydown',function(e){if(e.key==='Escape'&&root.classList.contains('menu-open')){setMenu(false);btn.focus();}});
  list.addEventListener('click',function(e){if(e.target.closest('a'))setMenu(false);});
  d.addEventListener('click',function(e){if(root.classList.contains('menu-open')&&!e.target.closest('.nav'))setMenu(false);});
  window.addEventListener('resize',function(){if(window.innerWidth>860)setMenu(false);});
}
/* header hides while reading down, back-to-top, gentle parallax */
var up=d.querySelector('.totop'),last=window.scrollY,tick=false,par=[].slice.call(d.querySelectorAll('[data-par]'));
function onScroll(){
  tick=false;var y=window.scrollY,dy=y-last;
  if(up)up.hidden=y<window.innerHeight*1.1;
  if(!root.classList.contains('menu-open')){if(y<140)root.classList.remove('hd-hide');else if(dy>6)root.classList.add('hd-hide');else if(dy<-6)root.classList.remove('hd-hide');}
  if(!rm.matches)par.forEach(function(el){var r=el.getBoundingClientRect();if(r.bottom<0||r.top>window.innerHeight)return;el.style.transform='translate3d(0,'+(r.top*-parseFloat(el.getAttribute('data-par'))).toFixed(1)+'px,0) scale(1.08)';});
  last=y;
}
window.addEventListener('scroll',function(){if(!tick){tick=true;window.requestAnimationFrame(onScroll);}},{passive:true});
onScroll();
if(up)up.addEventListener('click',function(){window.scrollTo({top:0,behavior:rm.matches?'auto':'smooth'});var m=d.getElementById('main');if(m)m.focus({preventScroll:true});});
/* sections ease in as they arrive */
var rv=[].slice.call(d.querySelectorAll('.rv'));
if('IntersectionObserver' in window&&!rm.matches){
  var io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target);}});},{rootMargin:'0px 0px -6% 0px',threshold:0.01});
  rv.forEach(function(el){io.observe(el);});
}else rv.forEach(function(el){el.classList.add('in');});
/* lottie: play only while visible; a still frame for reduced motion */
function lots(){
  if(!window.lottie||!window.LOT)return;
  [].slice.call(d.querySelectorAll('[data-lot]')).forEach(function(el){
    var data=window.LOT[el.getAttribute('data-lot')];if(!data)return;
    var a=window.lottie.loadAnimation({container:el,renderer:'svg',loop:true,autoplay:false,animationData:JSON.parse(JSON.stringify(data)),rendererSettings:{preserveAspectRatio:'xMidYMid meet',progressiveLoad:false}});
    var still=function(){a.goToAndStop(Math.round(a.totalFrames*parseFloat(el.getAttribute('data-still')||'0.5')),true);};
    a.addEventListener('DOMLoaded',function(){
      if(rm.matches){still();return;}
      if('IntersectionObserver' in window){new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting)a.play();else a.pause();});}).observe(el);}else a.play();
    });
    if(rm.addEventListener)rm.addEventListener('change',function(){if(rm.matches){a.pause();still();}else a.play();});
  });
}
if(d.readyState==='loading')d.addEventListener('DOMContentLoaded',lots);else lots();
/* screen rail buttons */
var rail=d.getElementById('rail');
[].slice.call(d.querySelectorAll('[data-rail]')).forEach(function(b){
  b.addEventListener('click',function(){if(rail)rail.scrollBy({left:parseInt(b.getAttribute('data-rail'),10)*rail.clientWidth*0.8,behavior:rm.matches?'auto':'smooth'});});
});
/* copy the support address */
[].slice.call(d.querySelectorAll('[data-copy]')).forEach(function(b){
  b.addEventListener('click',function(){
    var t=b.getAttribute('data-copy'),out=d.querySelector('.copied');
    function done(ok){if(out)out.textContent=ok?'Address copied.':'Select the address above to copy it.';}
    function pick(){var a=d.getElementById('addr');if(!a)return done(false);var r=d.createRange();r.selectNodeContents(a);var s=window.getSelection();s.removeAllRanges();s.addRange(r);var ok=false;try{ok=d.execCommand('copy');}catch(e){}done(ok);}
    if(navigator.clipboard&&window.isSecureContext)navigator.clipboard.writeText(t).then(function(){done(true);},pick);else pick();
  });
});
/* privacy contents: mark the section in view */
var toc=[].slice.call(d.querySelectorAll('.toc a'));
if(toc.length&&'IntersectionObserver' in window){
  var tocIO=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting)toc.forEach(function(a){a.classList.toggle('on',a.getAttribute('href')==='#'+e.target.id);});});},{rootMargin:'-20% 0px -70% 0px'});
  toc.forEach(function(a){var h=d.getElementById(a.getAttribute('href').slice(1));if(h)tocIO.observe(h);});
}
})();
