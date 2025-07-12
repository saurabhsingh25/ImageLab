import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Convert a data URL (base64 image) to an OpenCV.js cv.Mat.
 * @param dataUrl - The image data URL
 * @param cv - The OpenCV.js object
 * @returns Promise<cv.Mat>
 */
export async function dataUrlToMat(dataUrl: string, cv: any): Promise<any> {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return reject('No canvas context');
      ctx.drawImage(img, 0, 0);
      const imageData = ctx.getImageData(0, 0, img.width, img.height);
      const mat = new cv.Mat(img.height, img.width, cv.CV_8UC4);
      mat.data.set(imageData.data);
      resolve(mat);
    };
    img.onerror = reject;
    img.src = dataUrl;
  });
}

/**
 * Convert an OpenCV.js cv.Mat to a data URL (PNG).
 * @param mat - The cv.Mat
 * @param cv - The OpenCV.js object
 * @returns string (data URL)
 */
export function matToDataUrl(mat: any, cv: any): string {
  const canvas = document.createElement('canvas');
  canvas.width = mat.cols;
  canvas.height = mat.rows;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('No canvas context');
  const imgData = ctx.createImageData(mat.cols, mat.rows);
  // If mat is not 4 channel, convert
  let rgbaMat = mat;
  if (mat.type() !== cv.CV_8UC4) {
    rgbaMat = new cv.Mat();
    cv.cvtColor(mat, rgbaMat, cv.COLOR_RGBA2BGRA);
  }
  imgData.data.set(rgbaMat.data);
  ctx.putImageData(imgData, 0, 0);
  if (rgbaMat !== mat) rgbaMat.delete();
  return canvas.toDataURL('image/png');
}
