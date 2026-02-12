"use client";

import { useState, useEffect, useRef } from "react";
import { bip39Words } from "../bip39"; 
import { 
  RotateCcw, ArrowUpDown, Keyboard, MousePointerClick, ShieldCheck, CheckCircle2, 
  Home as HomeIcon, WifiOff, Lock, Zap, EyeOff, Smartphone, MousePointer2, 
  Search, Cpu, CopyX, Moon, Layout, Download, Binary, 
  TriangleAlert, ExternalLink // 👈 여기 2개 추가!
} from "lucide-react";

export default function Home() {
  const [bits, setBits] = useState<boolean[]>(Array(12).fill(false));
  const [inputValue, setInputValue] = useState("");
  const [matchedWord, setMatchedWord] = useState(""); 
  const [isValid, setIsValid] = useState(false);
  const [currentNumber, setCurrentNumber] = useState(0);

  // 🛡️ 1. 오프라인 보안 및 상태 감지
  const [isOffline, setIsOffline] = useState(true);
  const [isMounted, setIsMounted] = useState(false);

  // 🖐️ 2. 드래그/클릭 상태 관리를 위한 Refs
  const lastTouchedIndex = useRef<number | null>(null);
  const isDragging = useRef(false);
  const ignoreMouseUntil = useRef<number>(0);
  const bitsRef = useRef<boolean[]>(Array(12).fill(false));

  useEffect(() => {
    setIsMounted(true);
    setIsOffline(!navigator.onLine);

    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // 🚨 보안 강화: visibilitychange 외에 pagehide, beforeunload 추가
    const handleClearData = () => resetAll();
    
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) handleClearData();
    });
    window.addEventListener("pagehide", handleClearData);
    window.addEventListener("beforeunload", handleClearData);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("pagehide", handleClearData);
      window.removeEventListener("beforeunload", handleClearData);
    };
  }, []);

  const updateBits = (newBits: boolean[]) => {
    bitsRef.current = newBits;
    setBits(newBits);
  };

  // 🧮 로직 개선: parseInt 대신 비트 연산(Bitwise Operation) 사용
  // 교육적 목적과 명확성을 위해 MSB(Most Significant Bit)부터 계산
  const updateWordFromInt = (bitsArray: boolean[]) => {
    // reduce를 사용하여 2진수 배열을 정수로 변환
    // 예: [true, false, ...] -> 1*(2^11) + 0*(2^10) ...
    const intVal = bitsArray.reduce((acc, bit, i) => {
      return acc + (bit ? 1 << (11 - i) : 0);
    }, 0);

    setCurrentNumber(intVal);
    
    // BIP-39는 1-2048 범위 사용
    const arrayIndex = intVal - 1;
    
    if (intVal === 0) {
      setInputValue("");
      setMatchedWord("");
      setIsValid(false);
    } else if (arrayIndex >= 0 && arrayIndex < bip39Words.length) {
      const word = bip39Words[arrayIndex];
      setInputValue(word);
      setMatchedWord(word);
      setIsValid(true);
    } else {
      setMatchedWord("");
      setIsValid(false);
    }
  };

  const toggleDot = (index: number) => {
    const newBits = [...bitsRef.current];
    newBits[index] = !newBits[index];
    updateBits(newBits);
    updateWordFromInt(newBits); // 변경된 비트 배열을 바로 전달
  };

  const handleAction = (index: number) => {
    if (lastTouchedIndex.current !== index) {
      lastTouchedIndex.current = index;
      toggleDot(index);
    }
  };

  const handleMouseDown = (index: number, e: React.MouseEvent) => {
    if (Date.now() < ignoreMouseUntil.current) return;
    e.preventDefault(); 
    isDragging.current = true;
    lastTouchedIndex.current = null;
    handleAction(index); 
  };

  const handleMouseEnter = (index: number) => {
    if (isDragging.current) {
      handleAction(index);
    }
  };

  const handleTouchStart = (index: number) => {
    ignoreMouseUntil.current = Date.now() + 600;
    isDragging.current = true;
    lastTouchedIndex.current = null;
    handleAction(index);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    const element = document.elementFromPoint(touch.clientX, touch.clientY);
    const button = element?.closest('button[data-index]');
    
    if (button) {
      const index = parseInt(button.getAttribute('data-index') || "-1", 10);
      if (index >= 0) {
        handleAction(index);
      }
    }
  };

  const stopDragging = () => {
    isDragging.current = false;
    lastTouchedIndex.current = null;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const text = e.target.value.toLowerCase().trim();
    setInputValue(text);
    if (!text) { resetAll(); return; }
    let targetWord = null;
    if (bip39Words.includes(text)) { targetWord = text; } 
    else {
      const startsWithMatches = bip39Words.filter(w => w.startsWith(text));
      if (startsWithMatches.length === 1) { targetWord = startsWithMatches[0]; }
    }
    if (targetWord) {
      setIsValid(true);
      setMatchedWord(targetWord);
      const idx = bip39Words.indexOf(targetWord);
      const targetInt = idx + 1; 
      setCurrentNumber(targetInt);
      // 역변환 로직
      const newBits = Array(12).fill(false).map((_, i) => {
        // (targetInt >> (11 - i)) & 1 : i번째 비트가 1인지 확인
        return ((targetInt >> (11 - i)) & 1) === 1;
      });
      updateBits(newBits);
    } else {
      setIsValid(false);
      setMatchedWord("");
      setCurrentNumber(0);
      updateBits(Array(12).fill(false));
    }
  };

  const resetAll = () => {
    updateBits(Array(12).fill(false));
    setInputValue("");
    setMatchedWord("");
    setIsValid(false);
    setCurrentNumber(0);
  };

  const preventClipboard = (e: React.ClipboardEvent) => {
    e.preventDefault();
  };

  const unifiedButtonClass = "flex items-center justify-center gap-1.5 px-4 py-2 rounded-full bg-slate-800 text-white text-[12px] font-bold hover:bg-slate-700 shadow-sm transition-all active:scale-95";

  if (!isMounted) return null;

  if (!isOffline) {
    return (
      <main className="min-h-screen w-full bg-[#450a0a] flex flex-col items-center justify-center p-6 text-white text-center select-none">
        {/* 👇 [수정됨] 경고 박스 내용 보강 */}
        <div className="bg-red-500/20 border border-red-500/50 rounded-xl p-4 mb-8 max-w-sm w-full flex flex-col gap-3 text-red-100 shadow-lg text-left">
           <div className="flex items-center gap-3">
             <TriangleAlert size={24} className="shrink-0 text-red-500 animate-pulse" />
             <span className="text-sm font-bold leading-tight">
               절대 온라인 상태의 기기에<br/>니모닉을 입력하지 마세요!
             </span>
           </div>
           {/* 👇 추가된 권장 문구 */}
           <div className="text-[11px] opacity-80 border-t border-red-500/30 pt-2 leading-relaxed">
             <strong>💡 공기계 사용 권장:</strong><br/>
             해킹 위험이 없는 초기화된 공기계에서 <span className="underline decoration-red-400/50 underline-offset-2">비행기 모드</span>로 사용하시길 강력히 권장합니다.
           </div>
        </div>
        {/* 👆 [수정됨] 끝 */}
        <WifiOff size={80} strokeWidth={1.5} className="mb-6 opacity-80 animate-pulse text-red-500" />
        <h1 className="text-3xl font-black tracking-tight mb-4 text-red-100">
          NETWORK DETECTED
        </h1>
        <p className="text-base font-bold mb-8 opacity-70 text-red-200">
          보안을 위해 <span className="bg-red-900/40 px-2 py-1 rounded-md text-red-100 border border-red-900/50">비행기 모드</span>를 켜야만<br/>앱이 활성화됩니다.
        </p>
        <div className="bg-black/40 p-5 rounded-2xl text-sm text-left max-w-sm w-full backdrop-blur-sm border border-white/5">
          <ul className="space-y-3 font-medium opacity-60 list-disc list-inside text-red-100">
            <li>데이터와 Wi-Fi를 모두 꺼주세요.</li>
            <li>앱은 서버와 통신하지 않는 오프라인 상태로만 작동합니다.</li>
            <li>인터넷이 끊기면 화면이 자동으로 열립니다.</li>
          </ul>
        </div>
      </main>
    );
  }

  return (
    <main 
      className="min-h-screen w-full bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white flex flex-col items-center py-6 px-4 sm:py-8 select-none"
      onContextMenu={(e) => e.preventDefault()}
      onMouseUp={stopDragging}   
      onMouseLeave={stopDragging}
      onTouchEnd={stopDragging}
      onTouchCancel={stopDragging}
    >
      <div className="w-full max-w-lg flex flex-col items-center">
        {/* 👇 [수정됨] 메인 상단 경고 배너 */}
        <div className="w-full bg-red-600 dark:bg-red-900/80 text-white px-4 py-3 mb-6 rounded-xl flex flex-col gap-1.5 shadow-lg shadow-red-200 dark:shadow-none text-center">
          <div className="flex items-center justify-center gap-2">
            <TriangleAlert size={18} className="shrink-0 text-yellow-300 animate-pulse" />
            <span className="text-[12px] sm:text-[13px] font-black tracking-wide">
              경고: 온라인 상태의 기기에 절대 입력 금지!
            </span>
          </div>
          {/* 👇 추가된 권장 문구 */}
          <p className="text-[10px] sm:text-[11px] opacity-90 font-medium leading-tight">
            해킹 위험이 없는 <strong>초기화된 공기계(비행기 모드)</strong> 사용을 권장합니다.
          </p>
        </div>
        {/* 👆 [수정됨] 끝 */}
        <header className="mb-6 text-center flex flex-col items-center w-full">
          <h1 className="text-3xl sm:text-4xl font-[900] tracking-tighter text-slate-900 dark:text-white">
            DotDecoder
          </h1>
          <p className="text-[10px] sm:text-xs font-bold mt-1 tracking-[0.3em] uppercase text-slate-400">
            BIP-39 Binary Decoder
          </p>

          <div className="mt-4 flex items-center justify-center gap-3 w-full">
            <a href="https://store.btcmap.kr/stores/TINSB/" target="_blank" rel="noopener noreferrer" className={unifiedButtonClass}>
              <HomeIcon size={14} className="mb-[1px]" />
               Designed for TINSB
            </a>
            <a href="https://t.me/self_custard" target="_blank" rel="noopener noreferrer" className={unifiedButtonClass}>
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="#24A1DE" viewBox="0 0 16 16">
                <path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0zM8.287 5.906c-.778.324-2.334.994-4.666 2.01-.378.15-.577.298-.595.442-.03.243.275.339.69.47l.175.055c.408.133.958.288 1.243.294.26.006.549-.1.868-.32 2.179-1.471 3.304-2.214 3.374-2.23.05-.012.12-.026.166.016.047.041.042.12.037.141-.03.129-1.227 1.241-1.846 1.817-.193.18-.33.307-.358.336a8.154 8.154 0 0 1-.188.186c-.38.366-.664.64.015 1.088.327.216.589.393.85.571.284.194.568.387.936.629.093.06.183.125.27.187.331.236.63.448.997.414.214-.02.435-.22.547-.82.265-1.417.786-4.486.906-5.751a1.426 1.426 0 0 0-.013-.315.337.337 0 0 0-.114-.217.526.526 0 0 0-.31-.093c-.3.005-.763.166-2.984 1.09z"/>
              </svg>
              Help
            </a>
          </div>
        </header>

        <div className="w-full bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] dark:shadow-none border border-slate-100 dark:border-slate-800 overflow-hidden relative">
          
          <div className="bg-slate-50/50 dark:bg-slate-950/20 p-5 sm:p-6 text-center border-b border-slate-100 dark:border-slate-800 relative">
            <div className="flex justify-between items-center mb-2 px-1">
               {/* 💡 개선점: MSB / LSB 라벨 추가로 명확성 확보 */}
               <div className="flex items-center gap-1 text-slate-400 dark:text-slate-500 text-[10px] font-bold tracking-widest uppercase">
                 <MousePointerClick size={14} />
                 Swipe to Select
               </div>
            </div>

            <div 
              className="flex justify-between items-center w-full px-1 sm:px-2 mb-1 touch-none"
              onTouchMove={handleTouchMove}
            >
              {bits.map((isOn, i) => (
                <button 
                  key={i} 
                  data-index={i}
                  onMouseDown={(e) => handleMouseDown(i, e)}
                  onMouseEnter={() => handleMouseEnter(i)}
                  onTouchStart={() => handleTouchStart(i)}
                  className="group flex-1 py-5 flex justify-center items-center outline-none cursor-pointer"
                >
                  <div className={`w-5 h-5 sm:w-8 sm:h-8 rounded-full border-2 flex items-center justify-center transition-all duration-200 pointer-events-none ${
                    isOn 
                      ? "!bg-orange-500 !border-orange-500 shadow-md scale-110"  
                      : "!bg-white !border-slate-300 group-hover:!border-slate-400" 
                  }`}>
                    {!isOn && <div className="w-1 h-1 rounded-full !bg-slate-200" />}
                  </div>
                </button>
              ))}
            </div>

            <div className="absolute left-1/2 bottom-0 translate-y-1/2 -translate-x-1/2 z-10">
              <div className="bg-white dark:bg-slate-800 p-1.5 rounded-full shadow-md border border-slate-100 dark:border-slate-700 flex items-center justify-center">
                <ArrowUpDown size={16} className="text-slate-300 dark:text-slate-500" />
              </div>
            </div>
          </div>

          <div className="p-6 sm:p-8 pt-8 sm:pt-10 bg-white dark:bg-slate-900">
            <div className="flex justify-center items-center gap-2 mb-4 text-slate-400 dark:text-slate-500 text-[10px] font-bold tracking-widest uppercase">
              <Keyboard size={14} />
              Type & Result
            </div>

            <div className={`flex w-full items-stretch rounded-2xl border-2 transition-all overflow-hidden ${
              isValid ? "border-blue-500 shadow-md dark:shadow-blue-900/20" : "border-slate-200 dark:border-slate-700"
            }`}>
              <div className="w-[35%] py-4 border-r-2 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 flex items-center justify-center">
                <span className={`text-2xl sm:text-3xl font-black ${isValid ? "text-blue-600 dark:text-blue-400" : "text-slate-300 dark:text-slate-600"}`}>
                  {isValid ? `#${currentNumber}` : "#-"}
                </span>
              </div>
              
              <div className="w-[65%] relative flex flex-col justify-center bg-white dark:bg-slate-900">
                <input
                  type="text"
                  value={inputValue}
                  onChange={handleInputChange}
                  onCopy={preventClipboard}
                  onPaste={preventClipboard}
                  autoComplete="off"
                  autoCorrect="off"
                  autoCapitalize="none"
                  spellCheck="false"
                  placeholder="BIP-39 word 입력"
                  className={`w-full text-center text-2xl sm:text-3xl font-bold py-4 focus:outline-none bg-transparent transition-colors placeholder:text-slate-200 dark:placeholder:text-slate-700 ${
                    isValid ? "text-slate-900 dark:text-white" : "text-slate-400 dark:text-slate-500"
                  }`}
                />
                {isValid && inputValue !== matchedWord && (
                  <div className="absolute bottom-1 w-full text-center text-[10px] font-bold text-blue-500">
                    <CheckCircle2 size={10} className="inline mb-[2px] mr-1" />
                    {matchedWord}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="w-full flex flex-col items-center mt-8 gap-5 pb-10">
          <button onClick={resetAll} className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-400 font-bold text-sm shadow-sm active:scale-95 transition-all">
            <RotateCcw size={16} /> Reset All
          </button>

          <div className="w-full space-y-4 mt-2">
            
            {/* 1. 핵심 기능 (Core Features) */}
            <div className="bg-white/80 dark:bg-slate-900/60 p-5 rounded-2xl border border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2 mb-4 text-slate-800 dark:text-slate-200 font-bold text-sm uppercase tracking-wider">
                <Zap size={16} className="text-yellow-500" /> Core Features
              </div>
              <ul className="space-y-4">
                <li className="flex gap-3 text-[13px] text-slate-600 dark:text-slate-400 leading-relaxed">
                  <ArrowUpDown size={18} className="shrink-0 mt-0.5 opacity-70" />
                  <span>
                    <strong className="text-slate-800 dark:text-slate-200 block mb-1">양방향 변환 (Bi-directional Conversion)</strong>
                    <span className="block mb-1">• Dot to Word: 점을 찍으면 실시간으로 BIP-39 단어와 번호를 찾습니다.</span>
                    <span>• Word to Dot: 단어를 입력하면 점 패턴(이진수)을 시각적으로 보여줍니다.</span>
                  </span>
                </li>
                <li className="flex gap-3 text-[13px] text-slate-600 dark:text-slate-400 leading-relaxed">
                  <Search size={18} className="shrink-0 mt-0.5 opacity-70" />
                  <span>
                    <strong className="text-slate-800 dark:text-slate-200 block mb-1">스마트 검색 (Smart Search)</strong>
                    BIP-39 표준에 따라 <strong className="text-blue-600 dark:text-blue-400">첫 4글자</strong>만 입력해도 전체 단어를 자동으로 완성합니다. (예: aban → abandon)
                  </span>
                </li>
                <li className="flex gap-3 text-[13px] text-slate-600 dark:text-slate-400 leading-relaxed">
                  <MousePointer2 size={18} className="shrink-0 mt-0.5 opacity-70" />
                  <span>
                    <strong className="text-slate-800 dark:text-slate-200 block mb-1">스와이프 입력 (Swipe to Dot)</strong>
                    하나하나 탭 할 필요 없이, 손가락으로 문지르기만 해도 연속으로 점이 선택됩니다.
                  </span>
                </li>
                <li className="flex gap-3 text-[13px] text-slate-600 dark:text-slate-400 leading-relaxed">
                  <Cpu size={18} className="shrink-0 mt-0.5 opacity-70" />
                  <span>
                    <strong className="text-slate-800 dark:text-slate-200 block mb-1">TINSB 맞춤형 설계</strong>
                    <strong className="text-blue-600 dark:text-blue-400">1-based index</strong> 방식을 사용합니다.(예시: 1번 단어 abandon = 맨 끝 구멍 1개 타공)
                  </span>
                </li>
              </ul>
            </div>

            {/* 2. 보안 권장 수칙 (Security Guide) - 여기가 변경됨 */}
            <div className="bg-white/80 dark:bg-slate-900/60 p-5 rounded-2xl border border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2 mb-4 text-slate-800 dark:text-slate-200 font-bold text-sm uppercase tracking-wider">
                <ShieldCheck size={16} className="text-amber-500" /> Security Guide
              </div>
              <ul className="space-y-4">
                <li className="flex gap-3 text-[13px] text-slate-600 dark:text-slate-400 leading-relaxed">
                  <Smartphone size={18} className="shrink-0 mt-0.5 opacity-70 text-blue-500" />
                  <span>
                    <strong className="text-slate-800 dark:text-slate-200 block mb-1">1. 공기계 사용 (Clean Device)</strong>
                    해킹 위험이 없는 초기화된 공기계에서 사용하시길 강력히 권장합니다.
                  </span>
                </li>
                <li className="flex gap-3 text-[13px] text-slate-600 dark:text-slate-400 leading-relaxed">
                  <EyeOff size={18} className="shrink-0 mt-0.5 opacity-70 text-blue-500" />
                  <span>
                    <strong className="text-slate-800 dark:text-slate-200 block mb-1">2. 시크릿 모드 (Incognito)</strong>
                    기록이 남지 않는 브라우저의 <span className="underline decoration-slate-400 underline-offset-2">시크릿(개인정보 보호) 모드</span>를 이용하세요.
                  </span>
                </li>
                <li className="flex gap-3 text-[13px] text-slate-600 dark:text-slate-400 leading-relaxed">
                  <WifiOff size={18} className="shrink-0 mt-0.5 opacity-70 text-blue-500" />
                  <span>
                    <strong className="text-slate-800 dark:text-slate-200 block mb-1">3. 비행기 모드 유지</strong>
                    앱 실행 중에는 데이터가 차단됩니다. 작업을 마칠 때까지 <strong className="text-red-500 dark:text-red-400">비행기 모드를 유지</strong>하세요.
                  </span>
                </li>
                <li className="flex gap-3 text-[13px] text-slate-600 dark:text-slate-400 leading-relaxed">
                  <CopyX size={18} className="shrink-0 mt-0.5 opacity-70 text-blue-500" />
                  <span>
                    <strong className="text-slate-800 dark:text-slate-200 block mb-1">4. 안전한 종료 (Secure Exit)</strong>
                    사용 후 인터넷을 다시 연결하기 전에 <strong className="text-red-500 dark:text-red-400">브라우저 탭을 완전히 닫아 </strong>세션을 종료하세요. 가능하다면 브라우저를 재시작하면 더 안전합니다.
                  </span>
                </li>
                <li className="flex gap-3 text-[13px] text-slate-600 dark:text-slate-400 leading-relaxed">
                  <ExternalLink size={18} className="shrink-0 mt-0.5 opacity-70 text-blue-500" />
                  <span>
                    <strong className="text-slate-800 dark:text-slate-200 block mb-1">5. TINSB 구입처나 문의관련 외부 링크 접속 시</strong>
                    링크 클릭 → <strong className="text-red-500 dark:text-red-400">DotDecoder 창 닫기</strong> → 비행기 모드 해제 순서를 지켜주세요.
                  </span>
                </li>
              </ul>
            </div>

            {/* 3. UI/UX 및 편의성 */}
            <div className="bg-white/80 dark:bg-slate-900/60 p-5 rounded-2xl border border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2 mb-4 text-slate-800 dark:text-slate-200 font-bold text-sm uppercase tracking-wider">
                <Smartphone size={16} className="text-blue-500" /> UI / UX
              </div>
              <ul className="space-y-4">
                <li className="flex gap-3 text-[13px] text-slate-600 dark:text-slate-400 leading-relaxed">
                  <Moon size={18} className="shrink-0 mt-0.5 opacity-70" />
                  <span>
                    <strong className="text-slate-800 dark:text-slate-200 block mb-1">다크 모드 (Dark Mode)</strong>
                    시스템 설정에 따라 눈이 편안한 다크 모드를 지원합니다.
                  </span>
                </li>              
                <li className="flex gap-3 text-[13px] text-slate-600 dark:text-slate-400 leading-relaxed">
                  <Download size={18} className="shrink-0 mt-0.5 opacity-70" />
                  <span>
                    <strong className="text-slate-800 dark:text-slate-200 block mb-1">앱 설치 지원 (PWA)</strong>
                    홈 화면에 추가하여 인터넷 주소창 없이 진짜 앱처럼 전체 화면으로 사용할 수 있습니다.
                  </span>
                </li>
              </ul>
            </div>

          </div>
          
          <div className="text-[10px] text-slate-300 dark:text-slate-600 pb-8 pt-4">
            2026 DotDecoder. There is no second best.
          </div>

        </div>
      </div>
    </main>
  );
}