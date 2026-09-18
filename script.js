/* =============================================
   KARTU SEMBUH — Kids Recovery Card
   Interactive Script
   ============================================= */

'use strict';

/* =============================================
   VOICE PRE-WARM — Chrome Fix
   Chrome tidak memuat daftar voice sampai ada
   interaksi user pertama. Kita pancing segera
   setelah user pertama kali menyentuh halaman,
   jauh sebelum tombol narator ditekan.
   ============================================= */
(function prewarmVoices() {
  if (!window.speechSynthesis) return;

  let warmed = false;

  function doWarm() {
    if (warmed) return;
    warmed = true;

    // Paksa Chrome muat daftar voice
    const voices = window.speechSynthesis.getVoices();
    if (voices.length > 0) return; // sudah ada, tidak perlu lagi

    // Belum ada — trigger load dengan utterance sunyi (volume 0, teks 1 spasi)
    const silent = new SpeechSynthesisUtterance(' ');
    silent.volume = 0;
    silent.lang = 'id-ID';
    // Jangan sampai terdengar — cancel langsung setelah start
    silent.onstart = () => {
      setTimeout(() => window.speechSynthesis.cancel(), 50);
    };
    window.speechSynthesis.speak(silent);

    // Juga daftarkan onvoiceschanged untuk cache voice list
    window.speechSynthesis.onvoiceschanged = () => {
      window.speechSynthesis.getVoices(); // populate cache
      window.speechSynthesis.onvoiceschanged = null;
    };
  }

  // Trigger saat interaksi pertama apapun — scroll, klik, sentuh
  ['click', 'touchstart', 'scroll', 'keydown'].forEach(evt => {
    window.addEventListener(evt, doWarm, { once: true, passive: true });
  });
})();

/* ---- 1. CONFETTI BUTTON ---- */
const btnConfetti = document.getElementById('btn-confetti');

/**
 * Fires a multi-origin confetti burst covering all four screen corners
 * plus the centre-bottom, giving a full-screen celebration effect.
 */
function launchConfetti() {
  const defaults = {
    spread: 100,
    ticks: 200,
    gravity: 0.8,
    decay: 0.94,
    startVelocity: 45,
    colors: ['#ffd6a5', '#caffbf', '#a0c4ff', '#ffadad', '#fdffb6', '#bde0fe'],
  };

  // Bottom-left corner
  confetti({ ...defaults, particleCount: 70, angle: 60, origin: { x: 0, y: 1 } });

  // Bottom-right corner
  confetti({ ...defaults, particleCount: 70, angle: 120, origin: { x: 1, y: 1 } });

  // Top-left corner
  confetti({ ...defaults, particleCount: 50, angle: -30, origin: { x: 0, y: 0 } });

  // Top-right corner
  confetti({ ...defaults, particleCount: 50, angle: 210, origin: { x: 1, y: 0 } });

  // Centre-bottom burst
  confetti({ ...defaults, particleCount: 100, angle: 90, spread: 160, origin: { x: 0.5, y: 1 } });

  // Add a second wave slightly delayed for extra flair
  setTimeout(() => {
    confetti({ ...defaults, particleCount: 60, angle: 75, origin: { x: 0.2, y: 0.9 } });
    confetti({ ...defaults, particleCount: 60, angle: 105, origin: { x: 0.8, y: 0.9 } });
  }, 350);
}

if (btnConfetti) {
  btnConfetti.addEventListener('click', launchConfetti);
}


/* ---- 2. WEB SPEECH API NARRATOR ---- */
const btnSpeak = document.getElementById('btn-speak');

/**
 * Semua teks narasi dipecah jadi segmen-segmen pendek.
 * Ini menghindari bug Chrome/Edge yang menghentikan speech
 * otomatis setelah ~15 detik jika teks terlalu panjang.
 */
function getNarrativeSegments() {
  return [
    // Pembuka — semangat!
    'Halo, Pahlawan Cilik! Selamat datang di cerita kehebatanmu!',
    'Wooow! Kamu sudah berhasil mengalahkan virus-virus nakal itu! Luar biasa sekali!',
    'Sekarang waktunya kamu membangun kembali markasmu yang gagah perkasa!',

    // Kartu nutrisi
    'Yuk, kenali senjata rahasia yang akan membantu tubuhmu pulih lebih cepat!',
    'Senjata pertama: Batu Bata Kuat! ' +
    'Daging, telur, dan tempe adalah tim pembangun super. ' +
    'Mereka menambal setiap luka kecil di dalam tubuhmu dan membangun otot-ototmu yang kuat lagi!',
    'Senjata kedua: Perisai Ajaib! ' +
    'Sayur dan buah-buahan adalah perisai super canggih milikmu. ' +
    'Mereka memastikan virus-virus nakal tidak berani datang lagi ke tubuhmu!',
    'Senjata ketiga: Sungai Pembersih! ' +
    'Air putih adalah pahlawan tersembunyi yang sering dilupakan. ' +
    'Ia menyapu bersih semua kotoran dan sisa-sisa perang dari dalam tubuhmu!',

    // Penutup
    'Nah, sekarang kamu sudah tahu rahasianya! ' +
    'Makan bergizi setiap hari adalah caramu menjadi semakin kuat. ' +
    'Dan kalau mau tahu kisah heroik lengkap di dalam tubuhmu, ' +
    'klik tombol Putar Cerita di bawah ya! Kamu pasti suka!',
  ];
}

let narratorQueue = [];   // array of segment strings still to be spoken
let narratorActive = false;

/**
 * Pick the most natural/expressive voice available.
 * Priority:
 *   1. Google Indonesia (paling natural di Chrome Android/Desktop)
 *   2. Microsoft Indonesia online (Edge)
 *   3. Suara Indonesia lainnya
 *   4. Google US English female (fallback natural, lebih hidup dari robot)
 *   5. Suara pertama yang tersedia
 */
function pickBestVoice() {
  const voices = window.speechSynthesis.getVoices();

  // 1. Google Indonesia — paling natural
  const googleId = voices.find(v =>
    v.lang.startsWith('id') && /google/i.test(v.name)
  );
  if (googleId) return googleId;

  // 2. Microsoft Indonesia online (Edge)
  const msId = voices.find(v =>
    v.lang.startsWith('id') && /microsoft/i.test(v.name) && v.localService === false
  );
  if (msId) return msId;

  // 3. Suara Indonesia apapun
  const anyId = voices.find(v => v.lang.startsWith('id'));
  if (anyId) return anyId;

  // 4. Google US English female — fallback paling "hidup"
  const googleEn = voices.find(v =>
    v.lang.startsWith('en') && /google.*female|google us english/i.test(v.name)
  );
  if (googleEn) return googleEn;

  // 5. Apapun yang ada
  return voices[0] || null;
}

/**
 * Speak one segment, then chain to the next automatically.
 * This avoids the Chrome ~15s cutoff bug by keeping each utterance short.
 */
function speakNext() {
  if (!narratorActive || narratorQueue.length === 0) {
    // All done
    setNarratorUI(false);
    narratorActive = false;
    return;
  }

  const text = narratorQueue.shift();
  const utterance = new SpeechSynthesisUtterance(text);

  utterance.lang = 'id-ID';
  utterance.rate = 1.08;   // sedikit di atas normal — semangat tapi tidak terburu
  utterance.pitch = 1.25;   // ceria tanpa terdengar palsu
  utterance.volume = 1;

  const voice = pickBestVoice();
  if (voice) utterance.voice = voice;

  // Chain: when this segment ends, speak the next one
  utterance.onend = () => {
    if (narratorActive) speakNext();
  };

  utterance.onerror = (e) => {
    // 'interrupted' fires when we cancel manually — that's expected, ignore it
    if (e.error === 'interrupted') return;
    if (narratorActive) speakNext(); // skip bad segment, continue
  };

  window.speechSynthesis.speak(utterance);
}

/**
 * Workaround for another Chrome bug: speechSynthesis pauses after ~30s
 * in some Chrome versions. Nudge it every 10s to keep it alive.
 */
let keepAliveTimer = null;
function startKeepAlive() {
  stopKeepAlive();
  keepAliveTimer = setInterval(() => {
    if (window.speechSynthesis.speaking && narratorActive) {
      window.speechSynthesis.pause();
      window.speechSynthesis.resume();
    }
  }, 10000);
}
function stopKeepAlive() {
  if (keepAliveTimer) { clearInterval(keepAliveTimer); keepAliveTimer = null; }
}

function setNarratorUI(speaking) {
  if (!btnSpeak) return;
  if (speaking) {
    btnSpeak.classList.add('speaking');
    btnSpeak.querySelector('span').textContent = 'Berhenti';
  } else {
    btnSpeak.classList.remove('speaking');
    btnSpeak.querySelector('span').textContent = 'Dengarkan Cerita';
  }
}

function startNarration() {
  if (!window.speechSynthesis) {
    alert('Maaf, perambanmu belum mendukung fitur suara. Coba gunakan Chrome atau Edge ya!');
    return;
  }

  window.speechSynthesis.cancel();
  narratorQueue = getNarrativeSegments();
  narratorActive = true;

  setNarratorUI(true);
  startKeepAlive();

  // Setelah pre-warm, voices sudah pasti tersedia — langsung speak
  // Kalau ternyata belum (edge case), tunggu sebentar lalu mulai
  if (window.speechSynthesis.getVoices().length > 0) {
    speakNext();
  } else {
    const wait = (resolve) => {
      window.speechSynthesis.onvoiceschanged = () => {
        window.speechSynthesis.onvoiceschanged = null;
        resolve();
      };
      // Fallback: mulai saja setelah 500ms meski voices belum ada
      setTimeout(resolve, 500);
    };
    new Promise(wait).then(speakNext);
  }
}

function stopNarration() {
  narratorActive = false;
  narratorQueue = [];
  stopKeepAlive();
  window.speechSynthesis.cancel();
  setNarratorUI(false);
}

if (btnSpeak) {
  btnSpeak.addEventListener('click', () => {
    if (narratorActive) {
      stopNarration();
    } else {
      startNarration();
    }
  });
}

window.addEventListener('beforeunload', () => {
  if (window.speechSynthesis) window.speechSynthesis.cancel();
});


/* =============================================
   TIMELINE — Scroll Reveal & Auto-Play
   ============================================= */

/* ---- 3. SCROLL REVEAL ---- */
/**
 * Uses IntersectionObserver to fade-in each timeline step as it
 * enters the viewport. Falls back to showing all steps immediately
 * on older browsers.
 */
(function initScrollReveal() {
  const steps = document.querySelectorAll('.tl-step');
  if (!steps.length) return;

  if (!('IntersectionObserver' in window)) {
    // Fallback: show everything immediately
    steps.forEach(s => s.classList.add('tl-visible'));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('tl-visible');
          observer.unobserve(entry.target); // only animate once
        }
      });
    },
    { threshold: 0.18 }
  );

  steps.forEach(step => observer.observe(step));
})();


/* ---- 4. AUTO-PLAY TIMELINE (with per-step narrator) ---- */
/**
 * Narasi per tahap — teks yang dibacakan saat setiap kartu muncul.
 * Setelah narasi selesai bicara, baru pindah ke step berikutnya.
 */
const TIMELINE_NARRATION = [
  // Step 1 — Serangan
  'Tahap satu! Serangan Dimulai! ' +
  'Bakteri jahat bernama Salmonella typhi masuk ke tubuhmu lewat makanan atau minuman yang kotor. ' +
  'Mereka nakal banget, langsung bersembunyi di usus halus dan berkembang biak dengan super cepat!',

  // Step 2 — Perang
  'Tahap dua! Perang Dimulai! ' +
  'Tapi tubuhmu tidak mau diam! ' +
  'Pasukan sel darah putih yang gagah langsung berteriak: Seraaaang! ' +
  'Tubuh menaikkan suhu menjadi demam, supaya bakteri-bakteri jahat itu tidak betah!',

  // Step 3 — Gejala
  'Tahap tiga! Inilah gejala yang kamu rasakan saat berperang. ' +
  'Demam tinggi, mual, badan lemas banget, sakit kepala, dan sakit perut. ' +
  'Tapi ingat ya, semua itu tanda bahwa tubuhmu sedang berjuang keras sekali untuk kamu!',

  // Step 4 — Infus
  'Tahap empat! Bantuan datang! Namanya Infus! ' +
  'Dokter yang baik hati memberikan selang kecil ajaib bernama infus. ' +
  'Cairan, energi, dan pasukan antibiotik langsung masuk ke darahmu! ' +
  'Kamu sangat berani! Kamu keren banget!',

  // Step 5 — Obat & Makanan
  'Tahap lima! Bala bantuan datang lagi! Obat dan makanan bergizi! ' +
  'Antibiotik terus memburu sisa bakteri yang bersembunyi. ' +
  'Bubur hangat, telur, buah segar, dan air putih adalah bahan bakar kemenangan!',

  // Step 6 — Menang
  'Tahap enam! Ini yang paling seru! Kamu Menang! ' +
  'Yeeee! Tubuhmu berhasil mengalahkan Salmonella! ' +
  'Sistem imunmu sekarang lebih kuat dan lebih pintar! ' +
  'Kamu adalah pahlawan sejati!',
];

(function initTimelinePlay() {
  const btnPlay = document.getElementById('btn-play-timeline');
  const steps = Array.from(document.querySelectorAll('.tl-step'));
  if (!btnPlay || !steps.length) return;

  const SCROLL_OFFSET = 100;  // px atas elemen saat scroll
  const PAUSE_AFTER = 600;  // ms jeda kecil setelah narasi sebelum lanjut

  let currentIdx = 0;
  let isPlaying = false;

  function scrollToStep(el) {
    const top = el.getBoundingClientRect().top + window.scrollY - SCROLL_OFFSET;
    window.scrollTo({ top, behavior: 'smooth' });
  }

  /**
   * Ucapkan satu segmen narasi untuk step ini.
   * Gunakan engine narasi yang sama (speakNext pattern) agar
   * konsisten dengan tombol 🔊 dan tidak bentrok.
   * Setelah selesai bicara, panggil callback onDone.
   */
  function speakStepNarration(idx, onDone) {
    if (!window.speechSynthesis) { onDone(); return; }

    // Hentikan narasi utama kalau sedang berjalan
    if (narratorActive) stopNarration();

    const text = TIMELINE_NARRATION[idx] || '';
    if (!text) { setTimeout(onDone, 800); return; }

    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'id-ID';
    utterance.rate = 1.08;
    utterance.pitch = 1.25;
    utterance.volume = 1;

    const voice = pickBestVoice();
    if (voice) utterance.voice = voice;

    utterance.onend = () => setTimeout(onDone, PAUSE_AFTER);
    utterance.onerror = (e) => {
      if (e.error !== 'interrupted') setTimeout(onDone, PAUSE_AFTER);
    };

    window.speechSynthesis.speak(utterance);
  }

  function highlightStep(idx) {
    // Bersihkan highlight sebelumnya
    steps.forEach(s => s.classList.remove('tl-playing'));

    if (idx >= steps.length) {
      finishPlay();
      return;
    }

    const step = steps[idx];
    step.classList.add('tl-visible');
    step.classList.add('tl-playing');
    scrollToStep(step);

    // Bicara dulu, baru lanjut ke step berikutnya setelah selesai
    speakStepNarration(idx, () => {
      if (!isPlaying) return;   // user sudah stop di tengah
      currentIdx++;
      highlightStep(currentIdx);
    });
  }

  function finishPlay() {
    stopPlay();
    if (typeof confetti === 'function') {
      confetti({
        particleCount: 100,
        spread: 120,
        origin: { x: 0.5, y: 0.6 },
        colors: ['#ffe66d', '#4cc9f0', '#2dc653', '#f9844a'],
      });
    }
    // Ucapkan penutup kemenangan
    setTimeout(() => {
      const outro = new SpeechSynthesisUtterance(
        'Selamat! Kamu sudah melihat semua cerita heroikmu! Kamu luar biasa!'
      );
      outro.lang = 'id-ID';
      outro.rate = 1.08;
      outro.pitch = 1.25;
      const v = pickBestVoice();
      if (v) outro.voice = v;
      window.speechSynthesis.speak(outro);
    }, 500);
  }

  function startPlay() {
    isPlaying = true;
    currentIdx = 0;
    btnPlay.textContent = '⏹ Berhenti';
    btnPlay.classList.add('playing');

    // Intro singkat sebelum step pertama
    if (window.speechSynthesis) {
      const intro = new SpeechSynthesisUtterance(
        'Siap-siap! Yuk kita saksikan kisah heroik di dalam tubuhmu!'
      );
      intro.lang = 'id-ID';
      intro.rate = 1.08;
      intro.pitch = 1.25;
      const v = pickBestVoice();
      if (v) intro.voice = v;
      intro.onend = () => { if (isPlaying) highlightStep(currentIdx); };
      intro.onerror = () => { if (isPlaying) highlightStep(currentIdx); };

      // Voices sudah pre-warm — langsung speak dengan jeda 80ms setelah cancel
      window.speechSynthesis.cancel();
      setTimeout(() => {
        if (isPlaying) window.speechSynthesis.speak(intro);
      }, 80);
    } else {
      highlightStep(currentIdx);
    }
  }

  function stopPlay() {
    isPlaying = false;
    window.speechSynthesis && window.speechSynthesis.cancel();
    steps.forEach(s => s.classList.remove('tl-playing'));
    btnPlay.textContent = '▶ Putar Cerita';
    btnPlay.classList.remove('playing');
  }

  btnPlay.addEventListener('click', () => {
    if (isPlaying) {
      stopPlay();
    } else {
      startPlay();
    }
  });
})();






/* ---- SCROLL REVEAL: Doa Section ---- */
(function initDoaReveal() {
  const doaSection = document.getElementById('doa-sembuh');
  if (!doaSection) return;

  if (!('IntersectionObserver' in window)) {
    doaSection.classList.add('doa-visible');
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          doaSection.classList.add('doa-visible');
          observer.unobserve(doaSection);
        }
      });
    },
    { threshold: 0.15 }
  );

  observer.observe(doaSection);
})();


/* =============================================
   NARATOR TAMBAHAN — CTA & DOA
   ============================================= */

/**
 * Fungsi generik untuk memutar antrian segmen narasi
 * pada tombol manapun, tanpa mengganggu narator lain.
 */
function createSectionNarrator(btn, segments) {
  if (!btn) return;

  let queue = [];
  let active = false;
  let kaTimer = null;

  function setUI(speaking) {
    if (speaking) {
      btn.classList.add('speaking');
      btn.querySelector('span').textContent = 'Berhenti';
    } else {
      btn.classList.remove('speaking');
      btn.querySelector('span').textContent = btn.dataset.label || 'Dengarkan';
    }
  }

  function keepAlive() {
    kaTimer = setInterval(() => {
      if (window.speechSynthesis.speaking && active) {
        window.speechSynthesis.pause();
        window.speechSynthesis.resume();
      }
    }, 10000);
  }

  function stopKA() {
    if (kaTimer) { clearInterval(kaTimer); kaTimer = null; }
  }

  function next() {
    if (!active || queue.length === 0) {
      setUI(false); active = false; stopKA(); return;
    }
    const text = queue.shift();
    const utt = new SpeechSynthesisUtterance(text);
    utt.lang = 'id-ID';
    utt.rate = 1.08;
    utt.pitch = 1.25;
    utt.volume = 1;
    const v = pickBestVoice();
    if (v) utt.voice = v;
    utt.onend = () => { if (active) next(); };
    utt.onerror = (e) => { if (e.error !== 'interrupted' && active) next(); };
    window.speechSynthesis.speak(utt);
  }

  function start() {
    if (!window.speechSynthesis) return;
    // Hentikan semua narator lain
    narratorActive = false;
    narratorQueue = [];
    window.speechSynthesis.cancel();

    queue = [...segments];
    active = true;
    setUI(true);
    keepAlive();

    // Voices sudah pre-warm — jeda 80ms setelah cancel lalu langsung speak
    setTimeout(next, 80);
  }

  function stop() {
    active = false; queue = []; stopKA();
    window.speechSynthesis.cancel();
    setUI(false);
  }

  // Simpan label asli untuk reset UI
  btn.dataset.label = btn.querySelector('span').textContent;

  btn.addEventListener('click', () => {
    if (active) { stop(); } else { start(); }
  });
}

/* ---- Narator CTA: Pesan Semangat ---- */
createSectionNarrator(
  document.getElementById('btn-speak-cta'),
  [
    'Hei, Pahlawan Cilik! Kamu luar biasa!',
    'Kamu sudah berjuang sangat keras, dan sekarang kamu hampir sampai di garis kemenangan!',
    'Jangan khawatir ya. Sakit itu memang tidak enak, tapi ini hanya sementara. ' +
    'Tubuhmu sedang bekerja keras untuk pulih, dan kamu tidak sendirian.',
    'Yang paling penting sekarang adalah banyak istirahat. ' +
    'Tidur dan istirahat adalah cara terbaik tubuhmu memperbaiki diri. ' +
    'Jadi jangan paksa diri untuk banyak bergerak dulu ya!',
    'Makan pelan-pelan, minum air yang cukup, dan percayakan sisanya pada tubuhmu yang hebat. ' +
    'Setiap hari yang kamu lalui adalah satu langkah lebih dekat menuju sembuh.',
    'Keluargamu ada di sisimu, dokter sudah membantumu, dan Allah selalu menjagamu. ' +
    'Jadi tersenyum ya! Kamu pasti bisa! ' +
    'Semangat terus, Pahlawan Cilik!',
  ]
);

/* ---- Narator Doa ---- */
createSectionNarrator(
  document.getElementById('btn-speak-doa'),
  [
    'Dan yang terakhir, jangan pernah lupa untuk berdoa.',
    'Kamu tahu tidak, obat yang paling mujarab di seluruh alam semesta ini adalah doa? ' +
    'Karena hanya Allah-lah yang benar-benar bisa menyembuhkan.',
    'Dokter hanya membantu, obat hanya perantara, tapi kesembuhan sejati datangnya dari Allah. ' +
    'Maka mintalah kesembuhan langsung kepada-Nya dengan sepenuh hati.',
    'Bacalah doa ini dengan sungguh-sungguh: ' +
    'Allahumma rabban naas, adzhibil baas, isyfihi wa antasy syaafi, ' +
    'laa syifaa a illaa syifaa uk, syifaa an laa yughaadiru saqamaa.',
    'Artinya: Ya Allah, Tuhan seluruh manusia, hilangkanlah penyakit ini. ' +
    'Sembuhkanlah, Engkaulah Yang Maha Menyembuhkan. ' +
    'Tidak ada kesembuhan kecuali kesembuhan dari-Mu, ' +
    'kesembuhan yang tidak meninggalkan penyakit sedikit pun.',
    'Yakinlah, Allah mendengar setiap doa yang keluar dari hatimu. ' +
    'Berdoalah setiap hari, setiap saat, terutama setelah sholat. ' +
    'InsyaAllah, kesembuhan itu sudah menunggumu. ' +
    'Aamiin ya Rabbal aalamiin.',
  ]
);
