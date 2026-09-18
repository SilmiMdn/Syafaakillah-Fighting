/* =============================================
   KARTU SEMBUH — Kids Recovery Card
   Interactive Script (ResponsiveVoice edition)
   ============================================= */

'use strict';

/* =============================================
   VOICE HELPER — ResponsiveVoice wrapper
   Stabil di Android Chrome, iOS Safari, Desktop.
   Gunakan "Indonesian Female" sebagai suara utama.
   ============================================= */

const RV_VOICE = 'Indonesian Female';
const RV_PARAMS = { rate: 1.1, pitch: 1.2, volume: 1 };

/**
 * Cek apakah ResponsiveVoice tersedia (butuh koneksi internet).
 * Kalau tidak ada, fallback ke Web Speech API native.
 */
function rvAvailable() {
  return typeof responsiveVoice !== 'undefined' && responsiveVoice.voiceSupport();
}

/**
 * Bicara satu teks. onDone dipanggil setelah selesai.
 * Otomatis memilih ResponsiveVoice atau Web Speech API.
 */
function speakText(text, onDone) {
  if (rvAvailable()) {
    responsiveVoice.speak(text, RV_VOICE, {
      ...RV_PARAMS,
      onend: onDone || (() => { }),
      onerror: onDone || (() => { }),
    });
  } else {
    // Fallback: Web Speech API (desktop tanpa internet)
    const utt = new SpeechSynthesisUtterance(text);
    utt.lang = 'id-ID';
    utt.rate = 1.1;
    utt.pitch = 1.2;
    utt.volume = 1;
    utt.onend = onDone || (() => { });
    utt.onerror = onDone || (() => { });
    window.speechSynthesis.speak(utt);
  }
}

/** Hentikan semua narasi yang sedang berjalan */
function stopAllSpeech() {
  if (rvAvailable()) responsiveVoice.cancel();
  if (window.speechSynthesis) window.speechSynthesis.cancel();
}

/**
 * Putar antrian segmen teks satu per satu.
 * Mengembalikan objek { stop } untuk memberhentikan dari luar.
 */
/**
 * Putar semua segmen sebagai SATU string panjang.
 * Ini mencegah Android memotong audio di jeda antar segmen.
 * Mengembalikan objek { stop }.
 */
function playQueue(segments, onAllDone) {
  let stopped = false;

  // Gabung semua segmen dengan spasi — satu utterance tanpa henti
  const fullText = segments.join(' ');

  speakText(fullText, () => {
    if (!stopped && onAllDone) onAllDone();
  });

  return {
    stop() {
      stopped = true;
      stopAllSpeech();
    }
  };
}


/* =============================================
   1. CONFETTI BUTTON
   ============================================= */
const btnConfetti = document.getElementById('btn-confetti');

function launchConfetti() {
  const defaults = {
    spread: 100, ticks: 200, gravity: 0.8, decay: 0.94, startVelocity: 45,
    colors: ['#ffd6a5', '#caffbf', '#a0c4ff', '#ffadad', '#fdffb6', '#bde0fe'],
  };
  confetti({ ...defaults, particleCount: 70, angle: 60, origin: { x: 0, y: 1 } });
  confetti({ ...defaults, particleCount: 70, angle: 120, origin: { x: 1, y: 1 } });
  confetti({ ...defaults, particleCount: 50, angle: -30, origin: { x: 0, y: 0 } });
  confetti({ ...defaults, particleCount: 50, angle: 210, origin: { x: 1, y: 0 } });
  confetti({ ...defaults, particleCount: 100, angle: 90, spread: 160, origin: { x: 0.5, y: 1 } });
  setTimeout(() => {
    confetti({ ...defaults, particleCount: 60, angle: 75, origin: { x: 0.2, y: 0.9 } });
    confetti({ ...defaults, particleCount: 60, angle: 105, origin: { x: 0.8, y: 0.9 } });
  }, 350);
}

if (btnConfetti) btnConfetti.addEventListener('click', launchConfetti);


/* =============================================
   2. NARATOR 1 — Dengarkan Cerita (Header)
   Membacakan pembuka + kartu nutrisi
   ============================================= */
const btnSpeak = document.getElementById('btn-speak');

const SEGMENTS_INTRO = [
  'Halo, Pahlawan Cilik! Selamat datang di cerita kehebatanmu!',
  'Wooow! Kamu sudah berhasil mengalahkan virus-virus nakal itu! Luar biasa sekali!',
  'Sekarang waktunya kamu membangun kembali markasmu yang gagah perkasa!',
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
  'Nah, sekarang kamu sudah tahu rahasianya! ' +
  'Makan bergizi setiap hari adalah caramu menjadi semakin kuat. ' +
  'Dan kalau mau tahu kisah heroik lengkap di dalam tubuhmu, ' +
  'klik tombol Putar Cerita di bawah ya! Kamu pasti suka!',
];

function setNarratorUI(btn, speaking, labelOn, labelOff) {
  if (!btn) return;
  const span = btn.querySelector('span');
  if (speaking) {
    btn.classList.add('speaking');
    if (span) span.textContent = 'Berhenti';
  } else {
    btn.classList.remove('speaking');
    if (span) span.textContent = labelOff || 'Dengarkan';
  }
}

(function initNarrator1() {
  if (!btnSpeak) return;
  let controller = null;

  btnSpeak.addEventListener('click', () => {
    if (controller) {
      controller.stop();
      controller = null;
      setNarratorUI(btnSpeak, false, '', 'Dengarkan Cerita');
    } else {
      stopAllSpeech();
      setNarratorUI(btnSpeak, true);
      controller = playQueue(SEGMENTS_INTRO, () => {
        controller = null;
        setNarratorUI(btnSpeak, false, '', 'Dengarkan Cerita');
      });
    }
  });
})();


/* =============================================
   3. SCROLL REVEAL — Timeline Steps
   ============================================= */
(function initScrollReveal() {
  const steps = document.querySelectorAll('.tl-step');
  if (!steps.length) return;

  if (!('IntersectionObserver' in window)) {
    steps.forEach(s => s.classList.add('tl-visible'));
    return;
  }

  const observer = new IntersectionObserver(
    entries => entries.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add('tl-visible'); observer.unobserve(e.target); }
    }),
    { threshold: 0.18 }
  );
  steps.forEach(s => observer.observe(s));
})();


/* =============================================
   4. NARATOR 2 — Putar Cerita (Timeline)
   Setiap kartu punya narasi sendiri, dibacakan
   satu per satu saat kartu di-highlight.
   ============================================= */
const TIMELINE_NARRATION = [
  'Tahap satu! Serangan Dimulai! ' +
  'Bakteri jahat bernama Salmonella typhi masuk ke tubuhmu lewat makanan atau minuman yang kotor. ' +
  'Mereka nakal banget, langsung bersembunyi di usus halus dan berkembang biak dengan super cepat!',

  'Tahap dua! Perang Dimulai! ' +
  'Tapi tubuhmu tidak mau diam! ' +
  'Pasukan sel darah putih yang gagah langsung berteriak: Seraaaang! ' +
  'Tubuh menaikkan suhu menjadi demam, supaya bakteri-bakteri jahat itu tidak betah!',

  'Tahap tiga! Inilah gejala yang kamu rasakan saat berperang. ' +
  'Demam tinggi, mual, badan lemas banget, sakit kepala, dan sakit perut. ' +
  'Tapi ingat ya, semua itu tanda bahwa tubuhmu sedang berjuang keras sekali untuk kamu!',

  'Tahap empat! Bantuan datang! Namanya Infus! ' +
  'Dokter yang baik hati memberikan selang kecil ajaib bernama infus. ' +
  'Cairan, energi, dan pasukan antibiotik langsung masuk ke darahmu! ' +
  'Kamu sangat berani! Kamu keren banget!',

  'Tahap lima! Bala bantuan datang lagi! Obat dan makanan bergizi! ' +
  'Antibiotik terus memburu sisa bakteri yang bersembunyi. ' +
  'Bubur hangat, telur, buah segar, dan air putih adalah bahan bakar kemenangan!',

  'Tahap enam! Ini yang paling seru! Kamu Menang! ' +
  'Yeeee! Tubuhmu berhasil mengalahkan Salmonella! ' +
  'Sistem imunmu sekarang lebih kuat dan lebih pintar! ' +
  'Kamu adalah pahlawan sejati!',
];

(function initTimelinePlay() {
  const btnPlay = document.getElementById('btn-play-timeline');
  const steps = Array.from(document.querySelectorAll('.tl-step'));
  if (!btnPlay || !steps.length) return;

  const SCROLL_OFFSET = 100;
  let isPlaying = false;
  let currentIdx = 0;
  let stopCurrentStep = null; // fungsi stop narasi step aktif

  function scrollToStep(el) {
    const top = el.getBoundingClientRect().top + window.scrollY - SCROLL_OFFSET;
    window.scrollTo({ top, behavior: 'smooth' });
  }

  function playStep(idx) {
    steps.forEach(s => s.classList.remove('tl-playing'));
    if (idx >= steps.length) { finishPlay(); return; }

    const step = steps[idx];
    step.classList.add('tl-visible');
    step.classList.add('tl-playing');
    scrollToStep(step);

    const text = TIMELINE_NARRATION[idx] || '';
    let done = false;

    function onSegmentDone() {
      if (done || !isPlaying) return;
      done = true;
      stopCurrentStep = null;
      setTimeout(() => { if (isPlaying) { currentIdx++; playStep(currentIdx); } }, 300);
    }

    speakText(text, onSegmentDone);
    stopCurrentStep = () => { done = true; stopAllSpeech(); };
  }

  function finishPlay() {
    stopPlay();
    if (typeof confetti === 'function') {
      confetti({
        particleCount: 100, spread: 120, origin: { x: 0.5, y: 0.6 },
        colors: ['#ffe66d', '#4cc9f0', '#2dc653', '#f9844a']
      });
    }
    setTimeout(() => {
      speakText('Selamat! Kamu sudah melihat semua cerita heroikmu! Kamu luar biasa!');
    }, 600);
  }

  function startPlay() {
    isPlaying = true;
    currentIdx = 0;
    btnPlay.textContent = '⏹ Berhenti';
    btnPlay.classList.add('playing');
    stopAllSpeech();

    setTimeout(() => {
      if (!isPlaying) return;
      speakText('Siap-siap! Yuk kita saksikan kisah heroik di dalam tubuhmu!', () => {
        if (isPlaying) playStep(currentIdx);
      });
    }, 80);
  }

  function stopPlay() {
    isPlaying = false;
    if (stopCurrentStep) { stopCurrentStep(); stopCurrentStep = null; }
    stopAllSpeech();
    steps.forEach(s => s.classList.remove('tl-playing'));
    btnPlay.textContent = '▶ Putar Cerita';
    btnPlay.classList.remove('playing');
  }

  btnPlay.addEventListener('click', () => {
    if (isPlaying) { stopPlay(); } else { startPlay(); }
  });
})();


/* =============================================
   5. NARATOR 3 — Pesan Semangat (CTA)
   ============================================= */
(function initNarratorCTA() {
  const btn = document.getElementById('btn-speak-cta');
  if (!btn) return;
  let controller = null;

  const segments = [
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
    'Jadi tersenyum ya! Kamu pasti bisa! Semangat terus, Pahlawan Cilik!',
  ];

  btn.addEventListener('click', () => {
    if (controller) {
      controller.stop(); controller = null;
      setNarratorUI(btn, false, '', 'Dengarkan Pesan Semangat');
    } else {
      stopAllSpeech();
      setNarratorUI(btn, true);
      controller = playQueue(segments, () => {
        controller = null;
        setNarratorUI(btn, false, '', 'Dengarkan Pesan Semangat');
      });
    }
  });
})();


/* =============================================
   6. NARATOR 4 — Pesan Doa
   ============================================= */
(function initNarratorDoa() {
  const btn = document.getElementById('btn-speak-doa');
  if (!btn) return;
  let controller = null;

  const segments = [
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
    'InsyaAllah, kesembuhan itu sudah menunggumu. Aamiin ya Rabbal aalamiin.',
  ];

  btn.addEventListener('click', () => {
    if (controller) {
      controller.stop(); controller = null;
      setNarratorUI(btn, false, '', 'Dengarkan Pesan Doa');
    } else {
      stopAllSpeech();
      setNarratorUI(btn, true);
      controller = playQueue(segments, () => {
        controller = null;
        setNarratorUI(btn, false, '', 'Dengarkan Pesan Doa');
      });
    }
  });
})();


/* =============================================
   7. SCROLL REVEAL — Doa Section
   ============================================= */
(function initDoaReveal() {
  const doaSection = document.getElementById('doa-sembuh');
  if (!doaSection) return;

  if (!('IntersectionObserver' in window)) {
    doaSection.classList.add('doa-visible');
    return;
  }

  const observer = new IntersectionObserver(
    entries => entries.forEach(e => {
      if (e.isIntersecting) { doaSection.classList.add('doa-visible'); observer.unobserve(doaSection); }
    }),
    { threshold: 0.15 }
  );
  observer.observe(doaSection);
})();


/* =============================================
   8. STOP semua saat navigasi pergi
   ============================================= */
window.addEventListener('beforeunload', stopAllSpeech);
