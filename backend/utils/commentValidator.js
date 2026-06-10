export const validateComment = (text) => {
  // 1. Cek kosong / terlalu pendek
  if (!text || text.trim().length === 0) {
    return { valid: false, message: 'Komentar tidak boleh kosong' };
  }
  if (text.trim().length < 10) {
    return { valid: false, message: 'Komentar terlalu pendek (min. 10 karakter)' };
  }

  // 2. Cek Link / URL (Spam)
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  if (urlRegex.test(text)) {
    return { valid: false, message: 'Komentar tidak boleh mengandung link' };
  }

  // 3. Cek Capslock Berlebihan (>80% kapital & panjang >10)
  const chars = text.match(/[a-zA-Z]/g);
  if (chars) {
    const upperCount = chars.filter(c => c === c.toUpperCase()).length;
    const ratio = upperCount / chars.length;
    if (ratio > 0.8 && text.length > 10) {
      return { valid: false, message: 'Mohon jangan gunakan Capslock berlebihan' };
    }
  }

  // 4. Cek Karakter Berulang Aneh (Contoh: "Aaaaannnnnyy")
  if (/(.)\1{4,}/.test(text)) {
    return { valid: false, message: 'Terdeteksi spam karakter berulang' };
  }

  // 5. Cek Kata Kasar / Toxic
  const toxicWords = ['bodoh', 'goblok', 'anjing', 'babi', 'stupid', 'idiot', 'tolol', 'bangsat', 'jelek banget', 'buruk'];
  const lowerText = text.toLowerCase();
  const foundToxic = toxicWords.find(word => lowerText.includes(word));
  
  if (foundToxic) {
    return { valid: false, message: 'Komentar mengandung kata yang tidak pantas' };
  }

  // ✅ Lolos semua validasi
  return { valid: true, message: 'Komentar aman' };
};