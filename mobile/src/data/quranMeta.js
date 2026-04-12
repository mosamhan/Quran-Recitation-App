// Standard Madani Mushaf: starting page for each surah (1-indexed by surah number)
// Source: https://github.com/zonetecde/mushaf-layout (604-page Hafs Mushaf)
const SURAH_START_PAGE = [
  0,   // placeholder for index 0
  1,   // 1  Al-Fatihah
  2,   // 2  Al-Baqarah
  50,  // 3  Ali 'Imran
  77,  // 4  An-Nisa
  106, // 5  Al-Ma'idah
  128, // 6  Al-An'am
  151, // 7  Al-A'raf
  177, // 8  Al-Anfal
  187, // 9  At-Tawbah
  208, // 10 Yunus
  221, // 11 Hud
  235, // 12 Yusuf
  249, // 13 Ar-Ra'd
  255, // 14 Ibrahim
  262, // 15 Al-Hijr
  267, // 16 An-Nahl
  282, // 17 Al-Isra
  293, // 18 Al-Kahf
  305, // 19 Maryam
  312, // 20 Taha
  322, // 21 Al-Anbya
  332, // 22 Al-Hajj
  342, // 23 Al-Mu'minun
  350, // 24 An-Nur
  359, // 25 Al-Furqan
  367, // 26 Ash-Shu'ara
  377, // 27 An-Naml
  385, // 28 Al-Qasas
  396, // 29 Al-'Ankabut
  404, // 30 Ar-Rum
  411, // 31 Luqman
  415, // 32 As-Sajdah
  418, // 33 Al-Ahzab
  428, // 34 Saba
  434, // 35 Fatir
  440, // 36 Ya-Sin
  446, // 37 As-Saffat
  453, // 38 Sad
  458, // 39 Az-Zumar
  467, // 40 Ghafir
  477, // 41 Fussilat
  483, // 42 Ash-Shuraa
  489, // 43 Az-Zukhruf
  496, // 44 Ad-Dukhan
  499, // 45 Al-Jathiyah
  502, // 46 Al-Ahqaf
  507, // 47 Muhammad
  511, // 48 Al-Fath
  515, // 49 Al-Hujurat
  518, // 50 Qaf
  520, // 51 Adh-Dhariyat
  523, // 52 At-Tur
  526, // 53 An-Najm
  528, // 54 Al-Qamar
  531, // 55 Ar-Rahman
  534, // 56 Al-Waqi'ah
  537, // 57 Al-Hadid
  542, // 58 Al-Mujadila
  545, // 59 Al-Hashr
  549, // 60 Al-Mumtahanah
  551, // 61 As-Saf
  553, // 62 Al-Jumu'ah
  554, // 63 Al-Munafiqun
  556, // 64 At-Taghabun
  558, // 65 At-Talaq
  560, // 66 At-Tahrim
  562, // 67 Al-Mulk
  564, // 68 Al-Qalam
  566, // 69 Al-Haqqah
  568, // 70 Al-Ma'arij
  570, // 71 Nuh
  572, // 72 Al-Jinn
  574, // 73 Al-Muzzammil
  575, // 74 Al-Muddaththir
  577, // 75 Al-Qiyamah
  578, // 76 Al-Insan
  580, // 77 Al-Mursalat
  582, // 78 An-Naba
  583, // 79 An-Nazi'at
  585, // 80 'Abasa
  586, // 81 At-Takwir
  587, // 82 Al-Infitar
  587, // 83 Al-Mutaffifin
  589, // 84 Al-Inshiqaq
  590, // 85 Al-Buruj
  591, // 86 At-Tariq
  591, // 87 Al-A'la
  592, // 88 Al-Ghashiyah
  593, // 89 Al-Fajr
  594, // 90 Al-Balad
  595, // 91 Ash-Shams
  595, // 92 Al-Layl
  596, // 93 Ad-Duhaa
  596, // 94 Ash-Sharh
  597, // 95 At-Tin
  597, // 96 Al-'Alaq
  598, // 97 Al-Qadr
  598, // 98 Al-Bayyinah
  599, // 99 Az-Zalzalah
  599, // 100 Al-'Adiyat
  600, // 101 Al-Qari'ah
  600, // 102 At-Takathur
  601, // 103 Al-'Asr
  601, // 104 Al-Humazah
  601, // 105 Al-Fil
  602, // 106 Quraysh
  602, // 107 Al-Ma'un
  602, // 108 Al-Kawthar
  603, // 109 Al-Kafirun
  603, // 110 An-Nasr
  603, // 111 Al-Masad
  604, // 112 Al-Ikhlas
  604, // 113 Al-Falaq
  604, // 114 An-Nas
];

/**
 * Get the page range for a given surah number (1-114).
 * Returns { startPage, endPage }.
 */
export function getSurahPageRange(surahNumber) {
  const startPage = SURAH_START_PAGE[surahNumber];
  // End page is (next surah's start page - 1), or 604 for the last surah
  const nextSurah = surahNumber + 1;
  const endPage = nextSurah <= 114
    ? SURAH_START_PAGE[nextSurah] - 1
    : 604;
  // Some surahs share a starting page with the next surah
  return { startPage, endPage: Math.max(endPage, startPage) };
}

/**
 * Get the starting page for a surah.
 */
export function getSurahStartPage(surahNumber) {
  return SURAH_START_PAGE[surahNumber] || 1;
}

export default SURAH_START_PAGE;
