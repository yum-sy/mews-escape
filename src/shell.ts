import {unlockSummary} from './progression-unlocks';
import {prepareCinematic} from './cinematic-assets';
import {enterLandscape} from './mobile';
import {readProfile} from './profile';
import {LAB_RECORDS} from './story';
import {openingAudio} from './cinematic-audio';
import {readCheckpoint,browserStorage} from './save';
import {playCinematic} from './cinematic';
import {INTRO} from './story';
import './shell.css';
interface InstallEvent extends Event{prompt:()=>Promise<void>;userChoice:Promise<{outcome:string}>}
let installEvent:InstallEvent|null=null;let offlineReady=false;let offlineError='';
const offlineStatus=()=>offlineReady?'오프라인 준비 완료 · 게임 리소스 저장됨':offlineError||(!('serviceWorker' in navigator)?'이 브라우저에서는 오프라인 저장을 지원하지 않습니다. Safari 또는 Chrome에서 열어 주세요.':'오프라인 리소스를 준비하는 중입니다. 첫 실행에는 인터넷이 필요합니다.');
window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();installEvent=e as InstallEvent;const b=document.getElementById('install-native');if(b)b.textContent='지금 설치'});
window.addEventListener('appinstalled',()=>{installEvent=null;const b=document.getElementById('install-native');if(b){b.textContent='설치 완료';(b as HTMLButtonElement).disabled=true}const label=document.getElementById('install-state');if(label)label.textContent='홈 화면의 아이콘을 열어 가로로 플레이하세요.'});
const standalone=()=>matchMedia('(display-mode: standalone)').matches||Boolean((navigator as Navigator&{standalone?:boolean}).standalone);
export function setupShell(start:(resume:boolean)=>void){
 const shell=document.getElementById('shell')!;
 let heardOpening=false,waiting=true;
 let sceneIndex=0,timer:number|undefined;let nextShot:(()=>void)|null=null,deadline=0,remaining=8200;let stopFilm=()=>{};
 const clear=()=>{nextShot=null;stopFilm();window.clearTimeout(timer);shell.replaceChildren()};
 const menu=()=>{
  waiting=false;clear();document.body.dataset.screen='menu';shell.hidden=false;const saved=readCheckpoint(browserStorage);
  shell.innerHTML=`<section class="menu-screen"><div class="menu-mark">PROJECT 151 / THE ASCENT</div><img class="menu-mew" src="./assets/mew.png" alt="뮤"><h2>MEW’S<br><em>ESCAPE</em></h2><p>가장 깊은 곳에서, 다시 하늘로.</p><div class="menu-actions"><button id="start-game">${saved.save?'이어하기':'게임 시작'} <span>${saved.save?'B'+saved.save.floor+(saved.save.route?.mode==='depth'?'−X':saved.save.route?'◇':''):'↗'}</span></button><button id="show-help">게임 설명 <small>이야기 · 조작법</small></button><button id="show-install">게임 설치 <small>${standalone()?'앱으로 실행 중':'권장 · 더 넓은 화면'}</small></button></div><footer>여섯 층의 어둠을 지나, 다시 하늘로</footer></section>`;
  document.getElementById('start-game')!.onclick=()=>{if(saved.save)chooseRun();else launch(false)};
  if(saved.status){const status=document.createElement('p');status.className='save-warning';status.textContent=saved.status;shell.querySelector('.menu-screen')!.append(status)}
  document.getElementById('show-help')!.onclick=help;document.getElementById('show-install')!.onclick=install;
 };
 const launch=(resume:boolean)=>{void enterLandscape();clear();shell.hidden=true;document.body.dataset.screen='game';start(resume)};
 const chooseRun=()=>{clear();const saved=readCheckpoint(browserStorage).save;shell.innerHTML=`<section class="info-screen"><div class="menu-mark">CHECKPOINT / CONTINUE</div><h2>멈췄던 곳에서, 다시.</h2><p>${saved?`B${saved.floor} · 기술 ${saved.moves.length}개 · 체력 ${saved.hp}/6${saved.ending?' · 엔딩':saved.floor===1?' · 뮤츠 '+saved.phase+'단계':''}`:'저장을 찾을 수 없습니다.'}</p><p>방 진입·클리어·보상 선택·보스 단계 전환 때 자동 저장됩니다. 전투 중 종료하면 마지막 체크포인트부터 재개합니다. 새 게임은 현재 저장을 덮어씁니다.</p><div class="info-actions"><button id="continue-run">이어하기</button><button id="new-run">새로운 탈출 시작</button><button id="run-back">돌아가기</button></div><small>저장은 이 브라우저에 보관됩니다. 다른 기기와 동기화되지 않으며 브라우저 데이터 삭제 시 사라집니다.</small></section>`;document.getElementById('continue-run')!.onclick=()=>launch(true);document.getElementById('new-run')!.onclick=()=>{const button=document.getElementById('new-run')!;button.textContent='현재 진행을 지우고 시작';button.classList.add('destructive');button.onclick=()=>launch(false)};document.getElementById('run-back')!.onclick=menu};
 const help=()=>{
  clear();const archive=readProfile(browserStorage);shell.innerHTML=`<section class="info-screen"><div class="menu-mark">FIELD NOTES / 151</div><h2>위로, 빛이 있는 곳으로.</h2><p>연구소가 무너진 날, 가장 깊은 B6의 격리 장치도 부서졌습니다. 풀려난 실험체들은 경보음과 발소리에 과민하게 반응합니다. 방을 탐험하고 기술을 모아 각 층의 무작위 보스가 지키는 승강기를 확보해 B1로 올라가세요.</p><div class="help-grid"><article><h3>키보드</h3><p><b>WASD</b> 이동<br><b>방향키</b> 8방향 공격<br><b>Space</b> 사용형 기술<br><b>E</b> 캡슐·기록·차단기·승강기<br><b>Esc</b> 일시정지</p></article><article><h3>터치</h3><p>왼쪽 스틱을 조금 밀면 천천히 이동<br>오른쪽 스틱으로 360° 조준<br>가까이에서 표시되는 상호작용 버튼<br>방패 버튼으로 사용형 기술 발동<br>가로 화면 플레이 권장</p></article><article><h3>연구소의 규칙</h3><p>전투방을 정리하면 문 개방<br>보관실: 열쇠로 기술 해제<br>일반방: 보급품 또는 무보상<br>보스까지 길을 찾으면 바로 도전 가능<br>남은 방 탐험은 선택<br>사망하면 이번 판의 성장 초기화</p></article></div><div class="help-grid"><article><h3>겹쳐 익히는 기술</h3><p>새 기술은 기존 효과와 하나의 공격으로 합쳐집니다. 불꽃과 냉기는 공격을 놓을 때 <b>열충격</b>, 물과 전기는 젖은 적 사이 <b>전도 수류</b>. 독성 흡수는 중독된 적에서 효율이 높고, 섀도볼+반사는 벽을 맞힌 뒤 관통이 증가합니다. 일시정지에서 지금 조합을 확인하세요.</p></article><article><h3>넓게 맞힐까, 강하게 맞힐까</h3><p>트라이어택은 공격을 여러 갈래로, 스피드스타는 유도로 바꿉니다. 대신 <b>직접 화력이 줄어듭니다.</b> 모아 둔 효과를 넓게 전달할 때 선택하세요.</p></article><article><h3>열쇠를 쓸 순간</h3><p>보관실 봉인을 풀 때 <b>열쇠 1개</b>를 씁니다. 제시된 기술이 조합에 맞지 않으면 포기할 수 있지만 열쇠는 돌아오지 않습니다. 의무실에서는 기술 대신 체력 2 회복을 선택할 수 있습니다. 기술 습득 자체는 체력을 회복하지 않습니다.</p></article></div><details class="archive"><summary>보급품과 강화 규칙 자세히 보기</summary><p>일반 전투방은 기술 캡슐 8%, 무보상 47%, 열쇠 25%, 회복제 20%입니다. 기술 보상은 기본 두 개 중 하나를 선택합니다. 일반 몬스터는 총 32종이며 B6부터 7·15·23·29·32종으로 출현 후보가 늘어나고 상층은 현재 층 몬스터 85%, 이전 층 몬스터 합계 15%로 배정됩니다. 서로 다른 연구 기록 두 개를 조사하면 숨겨진 보관실이 열립니다. 보관실은 무료 3지선다 보상이며, B4부터 열쇠 2개로 폐쇄 실험층에 도전할 수 있습니다. 그곳은 서로 다른 보스 두 마리가 함께 등장하며 일반 전투방과 보스방 모두 희귀 전투 기술만 보상으로 제공합니다. 입장 시 경계 +2, 희귀 기술 습득마다 +1이 누적되어 본층과 뮤츠전까지 적이 강해집니다. 정리한 방의 단말에서 본층으로 돌아올 수 있습니다. B6~B2 보스는 전용 9종 중 모험마다 중복 없이 배정되고, B1에서는 뮤츠를 만납니다. 보스를 넘으면 강화 선택과 열쇠를 얻습니다. 같은 강화를 반복할수록 성장 효율이 줄어듭니다. 보상 카드의 직접 화력 비교는 모든 갈래가 적중했을 때의 값이며, 화상·중독·연쇄 등 부가 피해는 포함하지 않습니다.</p></details><p class="muted">혈흔·실험의 흔적과 불안한 분위기를 포함합니다. B6~B1을 올라 뮤츠의 세 단계를 돌파하면 엔딩에 도달합니다. 새로고침 후에는 마지막 체크포인트에서 이어할 수 있습니다. 사망 시 진행 저장은 삭제됩니다.</p><details class="archive"><summary>탈출 기록 · ${archive.wins}회 성공 / ${archive.runs}회 도전 · 연구 기록 ${archive.records.length}/6</summary><p>최고 도달 B${archive.bestFloor} · 최고 처치 ${archive.bestKills}${archive.bestTime!==null?' · 최단 탈출 '+Math.floor(archive.bestTime/60)+'분 '+Math.floor(archive.bestTime%60)+'초':''}</p>${LAB_RECORDS.map((r,i)=>archive.records.includes(i)?'<article><h3>'+r.title+'</h3><p>'+r.text+'</p></article>':'<p class="muted">미발견 연구 기록 '+(i+1)+'</p>').join('')}<small>기록은 같은 브라우저에 보관되며 능력치를 영구 강화하지 않습니다.</small></details><details class="archive"><summary>다음 탈출의 목표 · 해금</summary><p style="white-space:pre-line">${unlockSummary(browserStorage)}</p><p>리플렉터는 2초간 탄환을 차단합니다. 두 아이템 모두 0개로 시작합니다. 기물 보상을 얻으면 1개 충전되며, 현재 상한까지 가득 찬 상태에서 더 얻으면 상한도 1칸 늘어납니다. 리플렉터는 최대 4개, 대타출동은 최대 2개입니다. 대타출동은 2.8초간 조준을 유인합니다. 장착 변경은 정리한 방의 일시정지에서 가능합니다. 해금은 능력치를 영구 강화하지 않습니다.</p></details><p class="muted icon-credit">아이콘 그림: <b>@hitofutarai</b> · <a href="https://www.facebook.com/official.tajiri/posts/mew-taking-on-the-role-of-a-parent-to-mewtwo-artist-hitofutarai/519856910993612/" target="_blank" rel="noopener noreferrer">출처 게시물</a><br>Pokémon 비공식 팬 게임</p><div class="info-actions"><button id="replay-intro">오프닝 다시 보기</button><button id="info-back">돌아가기</button></div></section>`;
  document.getElementById('replay-intro')!.onclick=()=>{sceneIndex=0;intro()};document.getElementById('info-back')!.onclick=menu;
 };
 const install=()=>{
  clear();shell.innerHTML=`<section class="info-screen install-screen"><div class="menu-mark">TAKE THE EXIT WITH YOU</div><h2>${standalone()?'홈 화면에서 실행 중입니다':'주소창 없이, 더 넓게.'}</h2><p>홈 화면에 추가하면 독립된 게임 창으로 실행됩니다. 주요 리소스의 캐싱이 완료되면 오프라인에서도 시작할 수 있습니다.</p><div class="help-grid"><article><h3>iPhone · iPad</h3><p>Safari에서 게임을 열고 <b>공유 → 홈 화면에 추가</b>를 선택하세요. 추가된 아이콘으로 실행하면 주소창이 사라집니다.</p></article><article><h3>Android · PC</h3><p>지원되는 Chrome·Edge에서는 아래 설치 버튼이나 브라우저 메뉴의 <b>앱 설치 / 홈 화면에 추가</b>를 사용하세요.</p></article></div><p id="offline-state" class="muted">${offlineStatus()}</p><p id="install-state" class="muted">${standalone()?'이미 독립 창으로 실행 중입니다.':'설치하지 않아도 현재 화면 크기에 맞춰 플레이할 수 있습니다.'}</p><div class="info-actions"><button id="install-native">${standalone()?'설치됨':installEvent?'지금 설치':'설치 가능 여부 확인'}</button><button id="info-back">돌아가기</button></div><small>설치 후 아이콘을 열고 기기를 가로로 돌려 주세요. 왼손으로 이동하며 오른손으로 동시에 조준합니다. 화면 회전 잠금이 켜져 있으면 해제해 주세요.<br>진행은 방 단위로 저장됩니다. 기기·브라우저 간 동기화는 없으며, 설치된 앱에 브라우저 진행이 이어지지 않을 수도 있습니다. 일부 앱 내 브라우저는 설치를 지원하지 않으므로 Safari/Chrome에서 열어 주세요.</small></section>`;
  document.getElementById('info-back')!.onclick=menu;
  document.getElementById('install-native')!.onclick=async()=>{const message=document.getElementById('install-state')!;if(standalone()){message.textContent='이미 앱 창으로 실행하고 있습니다.';return}if(!installEvent){message.textContent='이 브라우저에서는 자동 설치 창을 열 수 없습니다. 위의 기기별 홈 화면 추가 방법을 이용해 주세요.';return}try{const event=installEvent;installEvent=null;await event.prompt();const choice=await event.userChoice;message.textContent=choice.outcome==='accepted'?'설치를 요청했습니다. 홈 화면의 아이콘으로 실행해 주세요.':'설치를 취소했습니다. 브라우저에서도 계속 플레이할 수 있습니다.'}catch{message.textContent='브라우저 메뉴에서 직접 홈 화면에 추가해 주세요.'}};
 };
 const intro=()=>{
  clear();document.body.dataset.screen='intro';shell.hidden=false;const shot=INTRO[sceneIndex];
  shell.innerHTML=`<section class="intro-screen ${shot.id}"><div class="intro-top"><span>${shot.tag}</span><div class="intro-audio-actions"><button id="intro-sound" aria-pressed="${openingAudio.enabled}" title="${heardOpening?'오프닝 소리 켜기 또는 끄기':'소리를 켜고 오프닝을 처음부터 재생'}">${openingAudio.enabled?'소리 끄기':heardOpening?'소리 켜기':'소리 켜고 보기'}</button><button id="skip-intro">건너뛰기 →</button></div></div><div class="story-stage" aria-hidden="true"></div><div class="intro-caption" aria-live="polite"><span>0${sceneIndex+1} / 06</span><h2>${shot.title}</h2><p>${shot.text}</p><button id="next-intro">${sceneIndex===INTRO.length-1?'시작 화면으로':'다음 장면 →'}</button></div><div class="intro-progress"><i style="width:${(sceneIndex+1)/INTRO.length*100}%"></i></div></section>`;
  stopFilm=playCinematic(shell.querySelector('.story-stage')!,shot.id);
  const sound=document.getElementById('intro-sound') as HTMLButtonElement;
  sound.onclick=async()=>{sound.disabled=true;const enabled=await openingAudio.toggle();sound.disabled=false;
   const liveSound=document.getElementById('intro-sound') as HTMLButtonElement|null;if(!liveSound)return;
   if(enabled&&!heardOpening){heardOpening=true;sceneIndex=0;intro();return}
   liveSound.setAttribute('aria-pressed',String(enabled));liveSound.textContent=enabled?'소리 끄기':'소리 켜기';
   if(!enabled&&!heardOpening){liveSound.textContent='소리 다시 켜기';liveSound.title='오디오를 시작하지 못했습니다. 다시 눌러 주세요.'}
  };
  const next=()=>{sceneIndex++;if(sceneIndex>=INTRO.length)menu();else intro()};document.getElementById('next-intro')!.onclick=next;document.getElementById('skip-intro')!.onclick=menu;
  if(!matchMedia('(prefers-reduced-motion: reduce)').matches){nextShot=next;remaining=8200;deadline=Date.now()+remaining;timer=window.setTimeout(next,remaining)}
 };
 document.addEventListener('keydown',e=>{if(e.code==='Escape'&&document.body.dataset.screen==='intro')menu()});
 document.addEventListener('visibilitychange',()=>{if(document.hidden){remaining=Math.max(0,deadline-Date.now());window.clearTimeout(timer)}else if(nextShot){deadline=Date.now()+remaining;timer=window.setTimeout(nextShot,remaining)}});
 // Browser chrome and safe-area changes resize the game without assuming a fixed mobile height.
 const resize=()=>{document.documentElement.style.setProperty('--viewport-height',`${window.visualViewport?.height??window.innerHeight}px`)};
 resize();window.visualViewport?.addEventListener('resize',resize);window.addEventListener('resize',resize);
 // Decode once before the first timeline, while keeping a route straight to play.
 shell.innerHTML='<section class="info-screen"><h2>기억을 불러오는 중…</h2><p>첫 오프닝의 그림을 준비하고 있습니다.</p><button id="loading-skip">바로 시작 화면으로</button></section>';
 document.getElementById('loading-skip')!.onclick=()=>{waiting=false;menu()};
 void prepareCinematic().then(()=>{if(waiting){waiting=false;intro()}}).catch(()=>{if(waiting){waiting=false;menu()}});return menu;
}
export function registerOffline(){
 if(import.meta.env.PROD&&'serviceWorker' in navigator){window.addEventListener('load',()=>{void navigator.serviceWorker.register('./sw.js',{scope:'./'}).then(()=>navigator.serviceWorker.ready).then(()=>{offlineReady=true;const label=document.getElementById('offline-state');if(label)label.textContent='오프라인 준비 완료 · 게임 리소스 저장됨'}).catch(()=>{offlineError='오프라인 준비에 실패했습니다. 인터넷 연결 후 다시 열어 주세요.';const label=document.getElementById('offline-state');if(label)label.textContent=offlineError})})}
}
