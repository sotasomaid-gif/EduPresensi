
import { GoogleGenAI, Type } from "@google/genai";
import { gasService } from "./gasService";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Mendapatkan Base64 gambar dari URL Drive secara aman melalui Proxy GAS
 */
const urlToBase64 = async (url: string): Promise<string> => {
  // Jika sudah format base64
  if (url.startsWith('data:')) return url.split(',')[1];
  
  // Jika URL Google Drive, ambil ID filenya
  if (url.includes('drive.google.com')) {
    const match = url.match(/id=([^&]+)/);
    const fileId = match ? match[1] : null;
    
    if (fileId) {
      const base64 = await gasService.getFileAsBase64(fileId);
      if (base64) return base64;
    }
  }
  
  // Fallback ke fetch (untuk URL publik selain Drive yang mungkin mendukung CORS)
  try {
    const response = await fetch(url);
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = (reader.result as string).split(',')[1];
        resolve(base64String);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error("Gagal mengonversi URL ke Base64:", error);
    throw new Error("Gagal mengunduh foto master melalui server.");
  }
};

/**
 * Verifikasi wajah baru (Saat Registrasi)
 */
export const analyzeEnrollmentFace = async (base64Image: string): Promise<{ isVerified: boolean; message: string }> => {
  try {
    const imageData = base64Image.includes(',') ? base64Image.split(',')[1] : base64Image;
    
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: {
        parts: [
          { inlineData: { data: imageData, mimeType: 'image/jpeg' } },
          { text: "Analisis foto ini untuk pendaftaran sistem absensi. Apakah ini wajah manusia yang jelas, menghadap depan, dan tidak tertutup masker/kacamata hitam? Berikan jawaban dalam JSON." }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            isFace: { type: Type.BOOLEAN },
            message: { type: Type.STRING }
          },
          required: ['isFace', 'message'],
        }
      }
    });

    const result = JSON.parse(response.text || '{}');
    return {
      isVerified: result.isFace || false,
      message: result.message || "Gagal menganalisis wajah."
    };
  } catch (error) {
    console.error("Enrollment Face Analysis Error:", error);
    return { isVerified: false, message: "Kesalahan sistem analisis wajah." };
  }
};

/**
 * Pencocokan Wajah (Saat Presensi)
 */
export const matchFace = async (registeredFace: string, currentSelfie: string): Promise<{ isMatch: boolean; confidence: number; message: string }> => {
  try {
    // 1. Siapkan data gambar via Proxy GAS untuk menghindari CORS
    const masterData = await urlToBase64(registeredFace);
    const selfieData = currentSelfie.includes(',') ? currentSelfie.split(',')[1] : currentSelfie;

    // 2. Kirim ke Gemini untuk verifikasi multimodal
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: {
        parts: [
          { inlineData: { data: masterData, mimeType: 'image/jpeg' } }, 
          { inlineData: { data: selfieData, mimeType: 'image/jpeg' } },
          { text: `Tugas: Verifikasi Identitas Biometrik.
          Bandingkan 'Gambar 1' (Master) dengan 'Gambar 2' (Selfie).
          Fokus pada struktur wajah permanen. Skor 0.0-1.0. Jika orang yang sama isMatch=true.
          Jawab dalam JSON.` }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            isMatch: { type: Type.BOOLEAN },
            confidence: { type: Type.NUMBER },
            message: { type: Type.STRING }
          },
          required: ['isMatch', 'confidence', 'message'],
        }
      }
    });

    const result = JSON.parse(response.text || '{}');
    const isActuallyMatch = result.isMatch === true && (result.confidence || 0) >= 0.8;

    return {
      isMatch: isActuallyMatch,
      confidence: result.confidence || 0,
      message: isActuallyMatch ? "Wajah terverifikasi." : (result.message || "Wajah tidak cocok.")
    };
  } catch (error: any) {
    console.error("Match Face Error:", error);
    return { 
      isMatch: false, 
      confidence: 0, 
      message: `Kesalahan Sistem: ${error.message || "Gagal memproses biometrik"}` 
    };
  }
};
