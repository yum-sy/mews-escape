import {playCinematic} from './cinematic';
import {INTRO} from './story';
import './shell.css';
interface InstallEvent extends Event{prompt:()=>Promise<void>;userChoice:Promise<{outcome:string}>}
let installEvent:InstallEvent|null=null;let offlineReady=false;
window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();installEvent=e as InstallEvent});
const standalone=()=>matchMedia('(display-mode: standalone)').matches||Boolean((navigator as Navigator&{standalone?:boolean}).standalone);
export function setupShell(start:()=>void){
 const shell=document.getElementById('shell')!;
 let sceneIndex=0,timer:number|undefined;let stopFilm=()=>{};
 const clear=()=>{stopFilm();window.clearTimeout(timer);shell.replaceChildren()};
 const menu=()=>{
  clear();document.body.dataset.screen='menu';shell.hidden=false;
  shell.innerHTML=`<section class="menu-screen"><div class="menu-mark">PROJECT 151 / THE ASCENT</div><img class="menu-mew" src="./assets/mew.png" alt="뮤"><h2>MEW’S<br><em>ESCAPE</em></h2><p>가장 깊은 곳에서, 다시 하늘로.</p><div class="menu-actions"><button id="start-game">게임 시작 <span>↗</span></button><button id="show-help">게임 설명 <small>이야기 · 조작법</small></button><button id="show-install">게임 설치 <small>${standalone()?'앱으로 실행 중':'권장 · 더 넓은 화면'}</small></button></div><footer>B6 원본 격리 구역 · PHASE 03</footer></section>`;
  document.getElementById('start-game')!.onclick=()=>{shell.hidden=true;document.body.dataset.screen='game';start()};
  document.getElementById('show-help')!.onclick=help;document.getElementById('show-install')!.onclick=install;
 };
 const help=()=>{
  clear();shell.innerHTML=`<section class="info-screen"><div class="menu-mark">FIELD NOTES / 151</div><h2>위로, 빛이 있는 곳으로.</h2><p>연구소가 무너진 날, 가장 깊은 B6의 격리 장치도 부서졌습니다. 풀려난 실험체들은 경보음과 발소리에 과민하게 반응합니다. 방을 탐험하고 기술을 모아 각 층의 팬텀이 지키는 승강기를 확보해 B1로 올라가세요.</p><div class="help-grid"><article><h3>키보드</h3><p><b>WASD</b> 이동<br><b>방향키</b> 8방향 공격<br><b>E</b> 가까운 기록 조사<br><b>Esc</b> 일시정지</p></article><article><h3>터치</h3><p>왼쪽 스틱으로 이동<br>오른쪽 스틱으로 360° 조준<br>조사 버튼으로 기록 읽기<br>가로 화면 플레이 권장</p></article><article><h3>연구소의 규칙</h3><p>전투방을 정리하면 문 개방<br>보상 기술은 기존 효과에 누적<br>그 층의 전투방을 정리하면 팬텀 구역 개방<br>사망하면 이번 판의 성장 초기화</p></article></div><p class="muted">혈흔·실험의 흔적과 불안한 분위기를 포함합니다. 현재 데모는 B6~B2 구역까지이며, 새로고침하면 진행 중인 판은 초기화됩니다.</p><div class="info-actions"><button id="replay-intro">오프닝 다시 보기</button><button id="info-back">돌아가기</button></div></section>`;
  document.getElementById('replay-intro')!.onclick=()=>{sceneIndex=0;intro()};document.getElementById('info-back')!.onclick=menu;
 };
 const install=()=>{
  clear();shell.innerHTML=`<section class="info-screen install-screen"><div class="menu-mark">TAKE THE EXIT WITH YOU</div><h2>${standalone()?'홈 화면에서 실행 중입니다':'주소창 없이, 더 넓게.'}</h2><p>홈 화면에 추가하면 독립된 게임 창으로 실행됩니다. 주요 리소스의 캐싱이 완료되면 오프라인에서도 시작할 수 있습니다.</p><div class="help-grid"><article><h3>iPhone · iPad</h3><p>Safari에서 게임을 열고 <b>공유 → 홈 화면에 추가</b>를 선택하세요. 추가된 아이콘으로 실행하면 주소창이 사라집니다.</p></article><article><h3>Android · PC</h3><p>지원되는 Chrome·Edge에서는 아래 설치 버튼이나 브라우저 메뉴의 <b>앱 설치 / 홈 화면에 추가</b>를 사용하세요.</p></article></div><p id="offline-state" class="muted">${offlineReady?'오프라인 준비 완료 · 게임 리소스 저장됨':'오프라인 리소스를 준비하는 중입니다. 첫 실행에는 인터넷이 필요합니다.'}</p><p id="install-state" class="muted">${standalone()?'이미 독립 창으로 실행 중입니다.':'설치하지 않아도 현재 화면 크기에 맞춰 플레이할 수 있습니다.'}</p><div class="info-actions"><button id="install-native">${standalone()?'설치됨':installEvent?'지금 설치':'설치 가능 여부 확인'}</button><button id="info-back">돌아가기</button></div><small>진행 중인 판 저장은 아직 지원하지 않습니다. 일부 앱 내 브라우저는 설치를 지원하지 않으므로 Safari/Chrome에서 열어 주세요.</small></section>`;
  document.getElementById('info-back')!.onclick=menu;
  document.getElementById('install-native')!.onclick=async()=>{const message=document.getElementById('install-state')!;if(standalone()){message.textContent='이미 앱 창으로 실행하고 있습니다.';return}if(!installEvent){message.textContent='이 브라우저에서는 자동 설치 창을 열 수 없습니다. 위의 기기별 홈 화면 추가 방법을 이용해 주세요.';return}try{const event=installEvent;installEvent=null;await event.prompt();const choice=await event.userChoice;message.textContent=choice.outcome==='accepted'?'설치를 요청했습니다. 홈 화면의 아이콘으로 실행해 주세요.':'설치를 취소했습니다. 브라우저에서도 계속 플레이할 수 있습니다.'}catch{message.textContent='브라우저 메뉴에서 직접 홈 화면에 추가해 주세요.'}};
 };
 const intro=()=>{
  clear();document.body.dataset.screen='intro';shell.hidden=false;const shot=INTRO[sceneIndex];
  shell.innerHTML=`<section class="intro-screen ${shot.id}"><div class="intro-top"><span>${shot.tag}</span><button id="skip-intro">건너뛰기 →</button></div><div class="story-stage" aria-hidden="true"></div><div class="intro-caption" aria-live="polite"><span>0${sceneIndex+1} / 06</span><h2>${shot.title}</h2><p>${shot.text}</p><button id="next-intro">${sceneIndex===INTRO.length-1?'시작 화면으로':'다음 장면 →'}</button></div><div class="intro-progress"><i style="width:${(sceneIndex+1)/INTRO.length*100}%"></i></div></section>`;
  stopFilm=playCinematic(shell.querySelector('.story-stage')!,shot.id);
  const next=()=>{sceneIndex++;if(sceneIndex>=INTRO.length)menu();else intro()};document.getElementById('next-intro')!.onclick=next;document.getElementById('skip-intro')!.onclick=menu;
  if(!matchMedia('(prefers-reduced-motion: reduce)').matches)timer=window.setTimeout(next,8200);
 };
 document.addEventListener('keydown',e=>{if(e.code==='Escape'&&document.body.dataset.screen==='intro')menu()});
 document.addEventListener('visibilitychange',()=>{if(document.hidden)window.clearTimeout(timer)});
 // Browser chrome and safe-area changes resize the game without assuming a fixed mobile height.
 const resize=()=>{document.documentElement.style.setProperty('--viewport-height',`${window.visualViewport?.height??window.innerHeight}px`)};
 resize();window.visualViewport?.addEventListener('resize',resize);window.addEventListener('resize',resize);
 intro();return menu;
}
export function registerOffline(){
 if(import.meta.env.PROD&&'serviceWorker' in navigator){window.addEventListener('load',()=>{void navigator.serviceWorker.register('./sw.js',{scope:'./'}).then(()=>navigator.serviceWorker.ready).then(()=>{offlineReady=true;const label=document.getElementById('offline-state');if(label)label.textContent='오프라인 준비 완료 · 게임 리소스 저장됨'}).catch(()=>{/* Network-only play remains available. */})})}
}
