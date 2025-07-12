// Multi-Image Preprocessing Workbench Main Page
// This file implements the main UI and logic for building and visualizing image preprocessing pipelines.
// Built with React, Next.js, and Tailwind CSS.

"use client"

import type React from "react"

import { useState, useRef, useCallback } from "react"
import {
  Upload,
  Download,
  Code,
  RotateCcw,
  ImageIcon,
  BookOpen,
  ChevronRight,
  ChevronLeft,
  Plus,
  X,
  ArrowUp,
  ArrowDown,
  Calculator,
  Info,
  Grid3x3,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { useOpenCv } from '../hooks/useOpenCv';
import { dataUrlToMat, matToDataUrl } from '../lib/utils';
import ReactMarkdown from 'react-markdown';

// --- TRANSFORM CATEGORIES & OPTIONS ---
// Each category contains a list of operations with their params and display info
export const TRANSFORM_CATEGORIES = [
  {
    category: "Basic Operations",
    operations: [
      { value: "grayscale", label: "Grayscale", params: [] },
      { value: "resize", label: "Resize", params: ["resizeWidth", "resizeHeight"] },
      { value: "crop", label: "Crop", params: ["cropX", "cropY", "cropWidth", "cropHeight"] },
      { value: "flip", label: "Flip", params: ["flipDirection"] },
      { value: "rotate", label: "Rotate", params: ["rotateAngle"] },
    ],
  },
  {
    category: "Color Spaces",
    operations: [
      { value: "hsv", label: "Convert to HSV", params: [] },
      { value: "lab", label: "Convert to LAB", params: [] },
      { value: "ycrcb", label: "Convert to YCrCb", params: [] },
      { value: "hed", label: "Convert to HED", params: [] },
      { value: "cmyk", label: "Convert to CMYK", params: [] },
    ],
  },
  {
    category: "Point Operations",
    operations: [
      { value: "brightness", label: "Brightness Adjustment", params: ["brightness"] },
      { value: "contrast", label: "Contrast Adjustment", params: ["contrast"] },
      { value: "gamma", label: "Gamma Correction", params: ["gamma"] },
      { value: "hist_eq", label: "Histogram Equalization", params: [] },
    ],
  },
  {
    category: "Blurring",
    operations: [
      { value: "gaussian_blur", label: "Gaussian Blur", params: ["blur"] },
      { value: "median_blur", label: "Median Blur", params: ["blur"] },
      { value: "bilateral", label: "Bilateral Filter", params: ["bilateralDiameter", "bilateralSigmaColor", "bilateralSigmaSpace"] },
      { value: "nl_means", label: "Non-local Means Denoising", params: ["nlStrength"] },
    ],
  },
  {
    category: "Edge Detection",
    operations: [
      { value: "canny", label: "Canny Edge", params: ["cannyThreshold1", "cannyThreshold2"] },
      { value: "sobel", label: "Sobel Edge", params: ["sobelDx", "sobelDy"] },
      { value: "laplacian", label: "Laplacian Edge", params: [] },
    ],
  },
  {
    category: "Thresholding",
    operations: [
      { value: "simple_thresh", label: "Simple Threshold", params: ["threshold"] },
      { value: "adaptive_thresh", label: "Adaptive Threshold", params: ["adaptiveBlockSize", "adaptiveC"] },
      { value: "otsu", label: "Otsu Threshold", params: [] },
    ],
  },
  {
    category: "Morphological",
    operations: [
      { value: "erode", label: "Erosion", params: ["morphKernelSize"] },
      { value: "dilate", label: "Dilation", params: ["morphKernelSize"] },
      { value: "open", label: "Opening", params: ["morphKernelSize"] },
      { value: "close", label: "Closing", params: ["morphKernelSize"] },
    ],
  },
  {
    category: "Geometric",
    operations: [
      { value: "translate", label: "Translation", params: ["translateX", "translateY"] },
      { value: "perspective", label: "Perspective Transform", params: ["perspectivePoints"] },
      { value: "affine", label: "Affine Transform", params: ["affinePoints"] },
    ],
  },
  {
    category: "Blending & Arithmetic",
    operations: [
      { value: "add_weighted", label: "AddWeighted Blend", params: ["blendAlpha", "blendBeta"] },
    ],
  },
  {
    category: "Contours & Annotation",
    operations: [
      { value: "find_contours", label: "Find Contours", params: [] },
      { value: "draw_text", label: "Draw Text", params: ["text", "textX", "textY", "textFontSize", "textColor"] },
      { value: "feature_detect", label: "Feature Detection", params: [] },
    ],
  },
]

// --- EXPANDED TRANSFORM PARAMS ---
export interface TransformParams {
  // Basic
  resizeWidth?: number
  resizeHeight?: number
  cropX?: number
  cropY?: number
  cropWidth?: number
  cropHeight?: number
  flipDirection?: "horizontal" | "vertical"
  rotateAngle?: number
  // Point
  brightness?: number
  contrast?: number
  gamma?: number
  // Blurring
  blur?: number
  bilateralDiameter?: number
  bilateralSigmaColor?: number
  bilateralSigmaSpace?: number
  nlStrength?: number
  // Edge
  cannyThreshold1?: number
  cannyThreshold2?: number
  sobelDx?: number
  sobelDy?: number
  // Threshold
  threshold?: number
  adaptiveBlockSize?: number
  adaptiveC?: number
  // Morph
  morphKernelSize?: number
  // Geometric
  translateX?: number
  translateY?: number
  perspectivePoints?: number[][]
  affinePoints?: number[][]
  // Blending
  blendAlpha?: number
  blendBeta?: number
  // Annotation
  text?: string
  textX?: number
  textY?: number
  textFontSize?: number
  textColor?: string
  // Legacy
  sharpen?: number
  [key: string]: any;
}

// Restore ImageState interface
interface ImageState {
  original: string | null
  processed: string | null
  intermediateSteps: string[]
}

interface TransformStep {
  id: string
  type: string
  params: Partial<TransformParams>
  name: string
}

/**
 * List of available image transforms and their parameter keys.
 */
const TRANSFORM_OPTIONS = [
  { value: "blur", label: "Blur", params: ["blur"] },
  { value: "threshold", label: "Threshold", params: ["threshold"] },
  { value: "contrast", label: "Contrast", params: ["contrast"] },
  { value: "brightness", label: "Brightness", params: ["brightness"] },
  { value: "sharpen", label: "Sharpen", params: ["sharpen"] },
  { value: "crop", label: "Crop", params: ["cropX", "cropY", "cropWidth", "cropHeight"] },
]

const DEFAULT_PARAMS: TransformParams = {
  blur: 5,
  threshold: 128,
  contrast: 120,
  brightness: 110,
  sharpen: 1,
  cropX: 10,
  cropY: 10,
  cropWidth: 80,
  cropHeight: 80,
}

/**
 * Props for the MathematicalExplanation component.
 */
interface MathematicalExplanationProps {
  explanation: {
    title: string
    description: string
    formula: string
    explanation: string
    parameterEffects?: string
    example?: string
    kernel?: number[][]
    kernelDivisor?: number
  } | null
}

/**
 * Main React component for the image preprocessing workbench UI.
 * Handles image upload, pipeline management, preview, and code export.
 */
export default function ImagePreprocessingWorkbench() {
  const [images, setImages] = useState<ImageState>({ original: null, processed: null, intermediateSteps: [] })
  const [transformPipeline, setTransformPipeline] = useState<TransformStep[]>([])
  const [showCodeExport, setShowCodeExport] = useState(false)
  const [showMathSection, setShowMathSection] = useState(false)
  const [selectedPipelineStep, setSelectedPipelineStep] = useState<string>("")
  const fileInputRef = useRef<HTMLInputElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  // Add new state for category/operation selection
  const [selectedCategory, setSelectedCategory] = useState<string>("")
  const [selectedOperation, setSelectedOperation] = useState<string>("")

  // Find the selected category object
  const currentCategory = TRANSFORM_CATEGORIES.find(cat => cat.category === selectedCategory)
  // Find the selected operation object
  const currentOperation = currentCategory?.operations.find(op => op.value === selectedOperation)

  const generateId = () => Math.random().toString(36).substr(2, 9)

  const [transformParams, setTransformParams] = useState<TransformParams>({});
  const { isReady: isCvReady, error: cvError, cv } = useOpenCv();
  const [originalMat, setOriginalMat] = useState<any>(null);

  /**
   * Handles image upload and initializes state.
   */
  const handleImageUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const result = e.target?.result as string;
        if (cv) {
          const mat = await dataUrlToMat(result, cv);
          setOriginalMat(mat);
        }
        setImages({ original: result, processed: result, intermediateSteps: [] });
        setTransformPipeline([]);
      };
      reader.readAsDataURL(file);
    }
  }, [cv]);

  const addTransformToPipeline = useCallback(() => {
    if (!selectedOperation) return

    const newStep: TransformStep = {
      id: generateId(),
      type: selectedOperation,
      params: { ...DEFAULT_PARAMS }, // Use DEFAULT_PARAMS for new steps
      name: currentOperation?.label || selectedOperation,
    }

    setTransformPipeline((prev: TransformStep[]) => [...prev, newStep])
    setSelectedOperation("")
  }, [selectedOperation, currentOperation])

  const removeTransformFromPipeline = useCallback((id: string) => {
    setTransformPipeline((prev) => prev.filter((step) => step.id !== id))
  }, [])

  const moveTransformInPipeline = useCallback((id: string, direction: "up" | "down") => {
    setTransformPipeline((prev) => {
      const index = prev.findIndex((step) => step.id === id)
      if (index === -1) return prev

      const newIndex = direction === "up" ? index - 1 : index + 1
      if (newIndex < 0 || newIndex >= prev.length) return prev

      const newPipeline = [...prev]
      const [movedStep] = newPipeline.splice(index, 1)
      newPipeline.splice(newIndex, 0, movedStep)
      return newPipeline
    })
  }, [])

  /**
   * Applies the current transform pipeline to the uploaded image.
   */
  const applyTransformPipeline = useCallback(async () => {
    if (!originalMat || !cv) return;
    if (transformPipeline.length === 0) {
      setImages((prev) => ({ ...prev, processed: prev.original, intermediateSteps: [] }));
      return;
    }
    // Clear processed image while processing
    setImages((prev) => ({ ...prev, processed: null }));
    let mat = originalMat.clone();
    let matsToRelease: any[] = [mat];
    try {
      for (const step of transformPipeline) {
        try {
          // Basic Operations
          if (step.type === 'grayscale') {
            let gray = new cv.Mat();
            cv.cvtColor(mat, gray, cv.COLOR_RGBA2GRAY);
            cv.cvtColor(gray, mat, cv.COLOR_GRAY2RGBA);
            gray.delete();
          } else if (step.type === 'resize') {
            let resized = new cv.Mat();
            const width = step.params.resizeWidth || mat.cols;
            const height = step.params.resizeHeight || mat.rows;
            cv.resize(mat, resized, new cv.Size(width, height), 0, 0, cv.INTER_LINEAR);
            mat.delete();
            mat = resized;
            matsToRelease.push(mat);
          } else if (step.type === 'crop') {
            const x = Math.max(0, Math.floor((step.params.cropX ?? 0) / 100 * mat.cols));
            const y = Math.max(0, Math.floor((step.params.cropY ?? 0) / 100 * mat.rows));
            const w = Math.max(1, Math.floor((step.params.cropWidth ?? 100) / 100 * mat.cols));
            const h = Math.max(1, Math.floor((step.params.cropHeight ?? 100) / 100 * mat.rows));
            let roi = mat.roi(new cv.Rect(x, y, w, h));
            mat.delete();
            mat = roi;
            matsToRelease.push(mat);
          } else if (step.type === 'flip') {
            let flipped = new cv.Mat();
            const flipCode = step.params.flipDirection === 'horizontal' ? 1 : 0;
            cv.flip(mat, flipped, flipCode);
            mat.delete();
            mat = flipped;
            matsToRelease.push(mat);
          } else if (step.type === 'rotate') {
            let rotated = new cv.Mat();
            const angle = step.params.rotateAngle || 0;
            if (angle === 90) {
              cv.rotate(mat, rotated, cv.ROTATE_90_CLOCKWISE);
            } else if (angle === 180) {
              cv.rotate(mat, rotated, cv.ROTATE_180);
            } else if (angle === 270) {
              cv.rotate(mat, rotated, cv.ROTATE_90_COUNTERCLOCKWISE);
            } else {
              // Arbitrary angle: use warpAffine
              const center = new cv.Point(mat.cols / 2, mat.rows / 2);
              const M = cv.getRotationMatrix2D(center, angle, 1);
              cv.warpAffine(mat, rotated, M, new cv.Size(mat.cols, mat.rows));
              M.delete();
            }
            mat.delete();
            mat = rotated;
            matsToRelease.push(mat);
          }
          // Color Spaces
          else if (step.type === 'hsv') {
            let out = new cv.Mat();
            cv.cvtColor(mat, out, cv.COLOR_RGBA2HSV);
            cv.cvtColor(out, mat, cv.COLOR_HSV2RGBA);
            out.delete();
          } else if (step.type === 'lab') {
            let out = new cv.Mat();
            cv.cvtColor(mat, out, cv.COLOR_RGBA2Lab);
            cv.cvtColor(out, mat, cv.COLOR_Lab2RGBA);
            out.delete();
          } else if (step.type === 'ycrcb') {
            let out = new cv.Mat();
            cv.cvtColor(mat, out, cv.COLOR_RGBA2YCrCb);
            cv.cvtColor(out, mat, cv.COLOR_YCrCb2RGBA);
            out.delete();
          } else if (step.type === 'hed' || step.type === 'cmyk') {
            // Not natively supported in OpenCV.js; skip or show warning
          }
          // Point Operations
          else if (step.type === 'contrast' || step.type === 'brightness') {
            let alpha = (step.params.contrast ?? 100) / 100;
            let beta = ((step.params.brightness ?? 100) - 100) * 2.55;
            mat.convertTo(mat, -1, alpha, beta);
          } else if (step.type === 'gamma') {
            let gamma = step.params.gamma ?? 1.0;
            let lut = new cv.Mat(1, 256, cv.CV_8UC1);
            for (let i = 0; i < 256; i++) lut.data[i] = Math.pow(i / 255, gamma) * 255;
            let channels = new cv.MatVector();
            cv.split(mat, channels);
            for (let i = 0; i < channels.size(); i++) {
              cv.LUT(channels.get(i), lut, channels.get(i));
            }
            cv.merge(channels, mat);
            lut.delete();
            channels.delete();
          } else if (step.type === 'hist_eq') {
            let ycrcb = new cv.Mat();
            cv.cvtColor(mat, ycrcb, cv.COLOR_RGBA2YCrCb);
            let channels = new cv.MatVector();
            cv.split(ycrcb, channels);
            cv.equalizeHist(channels.get(0), channels.get(0));
            cv.merge(channels, ycrcb);
            cv.cvtColor(ycrcb, mat, cv.COLOR_YCrCb2RGBA);
            ycrcb.delete();
            channels.delete();
          }
          // Blurring
          else if (step.type === 'gaussian_blur') {
            let out = new cv.Mat();
            let ksize = step.params.blur || 5;
            cv.GaussianBlur(mat, out, new cv.Size(ksize|1, ksize|1), 0);
            mat.delete();
            mat = out;
            matsToRelease.push(mat);
          } else if (step.type === 'median_blur') {
            let out = new cv.Mat();
            let ksize = step.params.blur || 5;
            cv.medianBlur(mat, out, ksize|1);
            mat.delete();
            mat = out;
            matsToRelease.push(mat);
          } else if (step.type === 'bilateral') {
            let out = new cv.Mat();
            // Convert RGBA to RGB if needed
            let input = mat;
            let converted = null;
            if (mat.type() === cv.CV_8UC4) {
              converted = new cv.Mat();
              cv.cvtColor(mat, converted, cv.COLOR_RGBA2RGB);
              input = converted;
            }
            // Clamp and validate parameters
            let d = Math.max(1, Math.round(Number(step.params.bilateralDiameter) || 9));
            let sigmaColor = Math.max(1, Number(step.params.bilateralSigmaColor) || 75);
            let sigmaSpace = Math.max(1, Number(step.params.bilateralSigmaSpace) || 75);
            try {
              cv.bilateralFilter(
                input, out,
                d,
                sigmaColor,
                sigmaSpace
              );
              // Convert back to RGBA if original was RGBA
              if (mat.type() === cv.CV_8UC4) {
                cv.cvtColor(out, mat, cv.COLOR_RGB2RGBA);
              } else {
                out.copyTo(mat);
              }
            } catch (err: any) {
              console.error('Bilateral filter error:', err);
              throw new Error('Bilateral filter failed. Please check parameter values.');
            } finally {
              out.delete();
              if (converted) converted.delete();
            }
          } else if (step.type === 'nl_means') {
            // Not natively supported in OpenCV.js; skip or show warning
          }
          // Edge Detection
          else if (step.type === 'canny') {
            let out = new cv.Mat();
            cv.Canny(
              mat, out,
              step.params.cannyThreshold1 || 50,
              step.params.cannyThreshold2 || 150
            );
            cv.cvtColor(out, mat, cv.COLOR_GRAY2RGBA);
            out.delete();
          } else if (step.type === 'sobel') {
            // Convert to grayscale first
            let gray = new cv.Mat();
            cv.cvtColor(mat, gray, cv.COLOR_RGBA2GRAY);
            let grad = new cv.Mat();
            cv.Sobel(
              gray, grad,
              cv.CV_16S,
              step.params.sobelDx || 1,
              step.params.sobelDy || 0
            );
            let absGrad = new cv.Mat();
            cv.convertScaleAbs(grad, absGrad);
            cv.cvtColor(absGrad, mat, cv.COLOR_GRAY2RGBA);
            gray.delete();
            grad.delete();
            absGrad.delete();
          } else if (step.type === 'laplacian') {
            let gray = new cv.Mat();
            cv.cvtColor(mat, gray, cv.COLOR_RGBA2GRAY);
            let lap = new cv.Mat();
            cv.Laplacian(gray, lap, cv.CV_16S);
            let absLap = new cv.Mat();
            cv.convertScaleAbs(lap, absLap);
            cv.cvtColor(absLap, mat, cv.COLOR_GRAY2RGBA);
            gray.delete();
            lap.delete();
            absLap.delete();
          }
          // Thresholding
          else if (step.type === 'simple_thresh') {
            let gray = new cv.Mat();
            cv.cvtColor(mat, gray, cv.COLOR_RGBA2GRAY);
            let out = new cv.Mat();
            cv.threshold(gray, out, step.params.threshold || 128, 255, cv.THRESH_BINARY);
            cv.cvtColor(out, mat, cv.COLOR_GRAY2RGBA);
            gray.delete();
            out.delete();
          } else if (step.type === 'adaptive_thresh') {
            let gray = new cv.Mat();
            cv.cvtColor(mat, gray, cv.COLOR_RGBA2GRAY);
            let out = new cv.Mat();
            cv.adaptiveThreshold(
              gray, out, 255,
              cv.ADAPTIVE_THRESH_GAUSSIAN_C,
              cv.THRESH_BINARY,
              step.params.adaptiveBlockSize || 11,
              step.params.adaptiveC || 2
            );
            cv.cvtColor(out, mat, cv.COLOR_GRAY2RGBA);
            gray.delete();
            out.delete();
          } else if (step.type === 'otsu') {
            let gray = new cv.Mat();
            cv.cvtColor(mat, gray, cv.COLOR_RGBA2GRAY);
            let out = new cv.Mat();
            cv.threshold(gray, out, 0, 255, cv.THRESH_BINARY + cv.THRESH_OTSU);
            cv.cvtColor(out, mat, cv.COLOR_GRAY2RGBA);
            gray.delete();
            out.delete();
          }
          // Morphological
          else if (["erode", "dilate", "open", "close"].includes(step.type)) {
            let out = new cv.Mat();
            let ksize = step.params.morphKernelSize || 3;
            let kernel = cv.getStructuringElement(cv.MORPH_RECT, new cv.Size(ksize, ksize));
            if (step.type === 'erode') cv.erode(mat, out, kernel);
            if (step.type === 'dilate') cv.dilate(mat, out, kernel);
            if (step.type === 'open') cv.morphologyEx(mat, out, cv.MORPH_OPEN, kernel);
            if (step.type === 'close') cv.morphologyEx(mat, out, cv.MORPH_CLOSE, kernel);
            mat.delete();
            mat = out;
            matsToRelease.push(mat);
            kernel.delete();
          }
          // Geometric
          else if (step.type === 'translate') {
            let out = new cv.Mat();
            let M = cv.matFromArray(2, 3, cv.CV_64F, [1, 0, step.params.translateX || 0, 0, 1, step.params.translateY || 0]);
            cv.warpAffine(mat, out, M, new cv.Size(mat.cols, mat.rows));
            mat.delete();
            mat = out;
            matsToRelease.push(mat);
            M.delete();
          } else if (step.type === 'perspective') {
            // Not implemented: requires 4 source/dest points
          } else if (step.type === 'affine') {
            // Not implemented: requires 3 source/dest points
          }
          // Blending & Arithmetic
          else if (step.type === 'add_weighted') {
            // Not implemented: requires two images
          }
          // Contours & Annotation
          else if (step.type === 'find_contours') {
            // Not implemented: would require drawing contours
          } else if (step.type === 'draw_text') {
            cv.putText(
              mat,
              step.params.text || '',
              new cv.Point(step.params.textX || 10, step.params.textY || 30),
              cv.FONT_HERSHEY_SIMPLEX,
              (step.params.textFontSize || 1) / 10,
              [0, 0, 0, 255],
              2
            );
          } else if (step.type === 'feature_detect') {
            // Not implemented: would require ORB/SIFT/AKAZE, not in OpenCV.js by default
          }
        } catch (err: any) {
          console.error(`Error in operation '${step.type}':`, err);
          setImages((prev) => ({ ...prev, processed: null }));
          alert(`Error in operation '${step.name}': ${err.message || err}`);
          break;
        }
      }
      const processedUrl = matToDataUrl(mat, cv);
      setImages((prev) => ({ ...prev, processed: processedUrl, intermediateSteps: [] }));
    } finally {
      matsToRelease.forEach((m) => { if (m && typeof m.delete === 'function') m.delete(); });
    }
  }, [originalMat, cv, transformPipeline]);

  /**
   * Resets the workbench to its initial state.
   */
  const handleReset = useCallback(async () => {
    setImages((prev) => ({ original: prev.original, processed: null, intermediateSteps: [] }));
    setTransformPipeline([]);
    setTransformParams({});
    setSelectedCategory("");
    setSelectedOperation("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    // Reset originalMat to the original image
    if (cv && images.original) {
      const mat = await dataUrlToMat(images.original, cv);
      setOriginalMat(mat);
    }
  }, [cv, images.original]);

  /**
   * Downloads the processed image as a PNG file.
   */
  const handleDownload = useCallback(() => {
    if (!images.processed) return

    const link = document.createElement("a")
    link.download = "processed-image.png"
    link.href = images.processed
    link.click()
  }, [images.processed])

  /**
   * Generates Python code for the current transform pipeline.
   * @returns {string} Python code as a string
   */
  const generatePythonCode = useCallback(() => {
    if (transformPipeline.length === 0) return ""

    let code = `import cv2
import numpy as np
from PIL import Image, ImageEnhance

# Load image
image = cv2.imread('input_image.jpg')
processed_image = image.copy()

# Apply transform pipeline
`

    transformPipeline.forEach((step, index) => {
      code += `\n# Step ${index + 1}: ${step.name}\n`

      switch (step.type) {
        case "blur":
          code += `processed_image = cv2.GaussianBlur(processed_image, (${(step.params.blur || 1) * 2 + 1}, ${(step.params.blur || 1) * 2 + 1}), 0)\n`
          break
        case "threshold":
          code += `gray = cv2.cvtColor(processed_image, cv2.COLOR_BGR2GRAY)
_, processed_image = cv2.threshold(gray, ${step.params.threshold || 128}, 255, cv2.THRESH_BINARY)
processed_image = cv2.cvtColor(processed_image, cv2.COLOR_GRAY2BGR)\n`
          break
        case "contrast":
          code += `pil_image = Image.fromarray(cv2.cvtColor(processed_image, cv2.COLOR_BGR2RGB))
enhancer = ImageEnhance.Contrast(pil_image)
processed_image = cv2.cvtColor(np.array(enhancer.enhance(${(step.params.contrast || 100) / 100})), cv2.COLOR_RGB2BGR)\n`
          break
        case "brightness":
          code += `processed_image = cv2.convertScaleAbs(processed_image, alpha=${(step.params.brightness || 100) / 100}, beta=0)\n`
          break
        case "sharpen":
          code += `kernel = np.array([[-1,-1,-1], [-1,9,-1], [-1,-1,-1]])
processed_image = cv2.filter2D(processed_image, -1, kernel)\n`
          break
        case "crop":
          code += `height, width = processed_image.shape[:2]
x = int(width * ${(step.params.cropX || 0) / 100})
y = int(height * ${(step.params.cropY || 0) / 100})
w = int(width * ${(step.params.cropWidth || 100) / 100})
h = int(height * ${(step.params.cropHeight || 100) / 100})
processed_image = processed_image[y:y+h, x:x+w]\n`
          break
      }
    })

    code += `\n# Save final processed image
cv2.imwrite('output_image.jpg', processed_image)`

    return code
  }, [transformPipeline])

  /**
   * Returns the mathematical explanation for the selected transform step.
   */
  const getMathematicalExplanation = useCallback(() => {
    if (transformPipeline.length === 0) return null;

    // Default to first step if none selected
    const selectedStep =
      transformPipeline.find((step) => step.id === selectedPipelineStep) ||
      transformPipeline[0];
    if (!selectedStep) return null;

    // Detailed explanations for all operations
    const explanations: Record<string, any> = {
      grayscale: {
        title: "Grayscale Conversion",
        description: `Converts a color image to grayscale by removing hue and saturation while retaining luminance. This is done by taking a weighted sum of the red, green, and blue channels for each pixel. The weights (0.299, 0.587, 0.114) reflect human sensitivity to each color.`,
        formula: "Y = 0.299R + 0.587G + 0.114B",
        explanation: `For each pixel, the output intensity is calculated as: Y = 0.299*R + 0.587*G + 0.114*B. This means green contributes most, blue least. The result is a single-channel image.`,
        parameterEffects: `No parameters for grayscale conversion.`,
        example: `A red pixel (255,0,0) becomes 76.\nA green pixel (0,255,0) becomes 150.\nA blue pixel (0,0,255) becomes 29.`
      },
      gaussian_blur: {
        title: "Gaussian Blur",
        description: `Smooths the image by averaging pixels with their neighbors, weighted by a Gaussian (bell curve) kernel. This reduces noise and detail.`,
        kernel: [ [1,2,1], [2,4,2], [1,2,1] ],
        kernelDivisor: 16,
        formula: "G(x,y) = (1/(2πσ²))·e^{-(x²+y²)/(2σ²)}",
        explanation: `For each pixel, take a square neighborhood (e.g., 3x3, 5x5). Multiply each neighbor by the corresponding kernel value, sum, and divide by the kernel sum.`,
        parameterEffects: `**Parameter: blur (kernel size)**\n- Increasing kernel size (e.g., 3→7) makes the blur stronger: more pixels are averaged, so the image becomes smoother and details are lost.\n- Decreasing kernel size makes the blur weaker: less smoothing, more detail.`,
        example: `- blur=3: only immediate neighbors are averaged.\n- blur=11: a much larger area is averaged, so even large features become blurry.\n\n**Intuition:** Like looking through frosted glass: higher blur = thicker glass.`
      },
      median_blur: {
        title: "Median Blur",
        description: `Reduces noise by replacing each pixel with the median value in its neighborhood. Especially effective for salt-and-pepper noise.`,
        formula: "I'(x,y) = median(\mathcal{N}(x,y))",
        explanation: `For each pixel, sort the values in its neighborhood and pick the median.`,
        parameterEffects: `**Parameter: blur (kernel size)**\n- Larger kernel = stronger noise reduction, but more detail lost.\n- Too large a kernel can make the image look cartoonish.`,
        example: `- A single white pixel in a black area will be removed if the kernel is large enough.`
      },
      bilateral: {
        title: "Bilateral Filter",
        description: `Blurs the image while preserving edges by combining spatial and intensity information.`,
        formula: "I'(x) = Σ w_s(x,i)·w_r(I(x),I(i))·I(i)",
        explanation: `Each neighbor is weighted by both distance (spatial) and color similarity (range).`,
        parameterEffects: `**Parameters:**\n- Diameter: size of the neighborhood.\n- SigmaColor: how much color difference is tolerated.\n- SigmaSpace: how much spatial distance is tolerated.\n\n**Effects:**\n- Higher SigmaColor = more smoothing across colors (can blur across edges).\n- Higher SigmaSpace = more spatial smoothing.`,
        example: `- Good for smoothing skin in portraits without blurring edges.`
      },
      canny: {
        title: "Canny Edge Detection",
        description: `Detects edges by finding areas of rapid intensity change. Uses gradient calculation, non-maximum suppression, and hysteresis thresholding.`,
        formula: "Gradient = sqrt((∂I/∂x)^2 + (∂I/∂y)^2)",
        explanation: `1. Convert to grayscale.\n2. Compute gradients (Sobel).\n3. Thin edges (non-maximum suppression).\n4. Use two thresholds: strong edges (above high), weak edges (between low and high).\n5. Track edges by hysteresis.`,
        parameterEffects: `**Parameters:**\n- Threshold1: lower bound.\n- Threshold2: upper bound.\n\n**Effects:**\n- Lower thresholds = more edges, more noise.\n- Higher thresholds = fewer, cleaner edges.`,
        example: `- Threshold1=50, Threshold2=150 is typical for natural images.`
      },
      sobel: {
        title: "Sobel Edge Detection",
        description: `Highlights edges by computing the gradient in x and y directions using Sobel kernels.`,
        kernel: [ [-1,0,1], [-2,0,2], [-1,0,1] ],
        formula: "Gx = [-1 0 1; -2 0 2; -1 0 1], Gy = Gx^T",
        explanation: `For each pixel, apply the kernel to compute the gradient in x (horizontal) or y (vertical).`,
        parameterEffects: `**Parameters:**\n- Dx: order of derivative x (1 = horizontal edges).\n- Dy: order of derivative y (1 = vertical edges).\n\n**Effects:**\n- Dx=1, Dy=0: horizontal edges.\n- Dx=0, Dy=1: vertical edges.\n- Both=1: diagonal edges.`,
        example: `- A white square on black: Sobel will highlight the square's edges.`
      },
      laplacian: {
        title: "Laplacian Edge Detection",
        description: `Detects edges by computing the second derivative (Laplacian) of the image. Sensitive to noise.`,
        kernel: [ [0,1,0], [1,-4,1], [0,1,0] ],
        formula: "∇²I = ∂²I/∂x² + ∂²I/∂y²",
        explanation: `For each pixel, apply the Laplacian kernel.`,
        parameterEffects: `- Highlights regions of rapid intensity change (edges).\n- Sensitive to noise: may need smoothing first.`,
        example: `- On a sharp edge, Laplacian gives a strong response.`
      },
      simple_thresh: {
        title: "Simple Thresholding",
        description: `Converts grayscale image to binary using a fixed threshold.`,
        formula: "I'(x,y) = 255 if I(x,y) > T else 0",
        explanation: `For each pixel, if its value > threshold, set to 255 (white), else 0 (black).`,
        parameterEffects: `**Parameter: threshold**\n- Lower threshold = more white pixels.\n- Higher threshold = more black pixels.`,
        example: `- Threshold=128: mid-gray becomes white, darker becomes black.`
      },
      adaptive_thresh: {
        title: "Adaptive Thresholding",
        description: `Threshold is determined for smaller regions, allowing for varying lighting.`,
        formula: "T(x,y) = mean(I(x,y) in block) - C",
        explanation: `For each block, compute the mean (or weighted mean) and subtract C.`,
        parameterEffects: `**Parameters:**\n- BlockSize: size of the region.\n- C: constant subtracted.\n\n**Effects:**\n- Smaller block = more local adaptation, but more noise.\n- Larger block = smoother, but may miss small features.\n- Higher C = more black pixels.`,
        example: `- Good for documents with uneven lighting.`
      },
      otsu: {
        title: "Otsu's Thresholding",
        description: `Automatically determines the optimal threshold value by maximizing between-class variance.`,
        formula: "Maximize σ_b^2 = w_0(μ_0-μ_T)^2 + w_1(μ_1-μ_T)^2",
        explanation: `Tries all possible thresholds and picks the one that best separates foreground and background.`,
        parameterEffects: `- No parameter: works best for bimodal histograms.`,
        example: `- Useful for segmenting objects from background.`
      },
      erode: {
        title: "Erosion",
        description: `Shrinks bright regions using a structuring element (kernel).`,
        kernel: [ [1,1,1], [1,1,1], [1,1,1] ],
        formula: "I'(x,y) = min(I(x+i, y+j) | (i,j) in kernel)",
        explanation: `For each pixel, replace with the minimum value in the neighborhood.`,
        parameterEffects: `**Parameter: kernel size**\n- Larger kernel = more erosion.`,
        example: `- Removes small white noise, disconnects objects.`
      },
      dilate: {
        title: "Dilation",
        description: `Expands bright regions using a structuring element (kernel).`,
        kernel: [ [1,1,1], [1,1,1], [1,1,1] ],
        formula: "I'(x,y) = max(I(x+i, y+j) | (i,j) in kernel)",
        explanation: `For each pixel, replace with the maximum value in the neighborhood.`,
        parameterEffects: `**Parameter: kernel size**\n- Larger kernel = more dilation.`,
        example: `- Fills small holes, connects objects.`
      },
      open: {
        title: "Opening",
        description: `Erosion followed by dilation. Removes small objects from the foreground.`,
        formula: "I_open = dilate(erode(I))",
        explanation: `First erode, then dilate.`,
        parameterEffects: `**Parameter: kernel size**\n- Larger kernel = removes larger objects.`,
        example: `- Cleans up salt-and-pepper noise.`
      },
      close: {
        title: "Closing",
        description: `Dilation followed by erosion. Closes small holes in the foreground.`,
        formula: "I_close = erode(dilate(I))",
        explanation: `First dilate, then erode.`,
        parameterEffects: `**Parameter: kernel size**\n- Larger kernel = closes larger holes.`,
        example: `- Fills gaps in text or objects.`
      },
      translate: {
        title: "Translation",
        description: `Shifts the image by a given offset.`,
        formula: "I'(x,y) = I(x-tx, y-ty)",
        explanation: `Moves the image horizontally and/or vertically.`,
        parameterEffects: `**Parameters:**\n- translateX: right (+) or left (-)\n- translateY: down (+) or up (-)\n\n**Example:**\n- translateX=10 moves image 10 pixels right.`,
        example: `- translateX=10 moves image 10 pixels right.`
      },
      draw_text: {
        title: "Draw Text",
        description: `Draws text on the image at a specified location.`,
        formula: "N/A",
        explanation: `Renders a string using a font at the given coordinates.`,
        parameterEffects: `**Parameters:**\n- text: the string\n- textX, textY: position\n- textFontSize: size\n- textColor: color\n\n**Example:**\n- text="Hello", textX=50, textY=50 draws 'Hello' at (50,50).`,
        example: `- text="Hello", textX=50, textY=50 draws 'Hello' at (50,50).`
      },
      // Add more as needed...
    };

    return explanations[selectedStep.type] || null;
  }, [transformPipeline, selectedPipelineStep]);

  // Remove: currentTransform

  // Show loading state if OpenCV.js is not ready
  if (!isCvReady) {
    return <div className="flex items-center justify-center h-screen text-lg">Loading OpenCV.js...</div>;
  }
  if (cvError) {
    return <div className="flex items-center justify-center h-screen text-lg text-red-600">{cvError}</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation Bar */}
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="w-full px-4 sm:px-8 lg:px-16">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <img src="/github-mark.svg" alt="GitHub" className="h-8 w-8" />
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                ImageLab
                <span className="text-base font-normal text-gray-500 flex items-center gap-1">
                  <span className="hidden sm:inline">by</span>
                  <a href="https://github.com/saurabhsingh25" target="_blank" rel="noopener noreferrer" className="hover:underline flex items-center gap-1">
                    <span className="font-mono">saurabhsingh25</span>
                  </a>
                </span>
              </h1>
            </div>
            <div className="text-sm text-gray-500 hidden md:block">Multi-Transform Image Processing Pipeline</div>
          </div>
        </div>
      </nav>

      <div className="w-full px-4 sm:px-8 lg:px-16 py-4">
        <div className="grid grid-cols-1 lg:grid-cols-6 gap-6 h-[calc(100vh-8rem)]">
          {/* Left Panel - Controls */}
          <div className={`${showMathSection ? 'lg:col-span-2' : 'lg:col-span-2'} w-full space-y-6 overflow-y-auto`}>
            <Card className="w-full p-4 sm:p-6">
              <h3 className="text-lg font-semibold mb-4">Image Upload</h3>
              <div className="space-y-4">
                <Button onClick={() => fileInputRef.current?.click()} className="w-full" variant="outline">
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Image
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </div>
            </Card>

            {/* New Add Transform UI (above the old one) */}
            <Card className="w-full p-4 sm:p-6 mb-4">
              <h3 className="text-lg font-semibold mb-4">Add Transform</h3>
              <div className="space-y-4">
                {/* Category Dropdown */}
                <div>
                  <Label htmlFor="category-select">Category</Label>
                  <Select value={selectedCategory} onValueChange={value => {
                    setSelectedCategory(value)
                    setSelectedOperation("") // Reset operation when category changes
                  }}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {TRANSFORM_CATEGORIES.map(cat => (
                        <SelectItem key={cat.category} value={cat.category}>{cat.category}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {/* Operation Dropdown */}
                {selectedCategory && (
                  <div>
                    <Label htmlFor="operation-select">Operation</Label>
                    <Select value={selectedOperation} onValueChange={value => {
                      setSelectedOperation(value)
                      if (currentCategory) {
                        const op = currentCategory.operations.find(op => op.value === value)
                        if (op) {
                          const defaults: Partial<TransformParams> = {}
                          op.params.forEach(param => {
                            defaults[param] = DEFAULT_PARAMS[param as keyof TransformParams] ?? 0
                          })
                          setTransformParams(defaults)
                        }
                      }
                    }}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select operation" />
                      </SelectTrigger>
                      <SelectContent>
                        {currentCategory?.operations.map(op => (
                          <SelectItem key={op.value} value={op.value}>{op.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                {/* Parameter Controls */}
                {currentOperation && currentOperation.params.length > 0 && (
                  <div className="space-y-4">
                    {currentOperation.params.map((param) => {
                      const typedParam = param as keyof TransformParams;
                      // Custom slider settings for bilateral filter
                      let min = 0, max = 200, step = 1;
                      if (param === 'bilateralDiameter') { min = 1; max = 15; step = 2; }
                      if (param === 'bilateralSigmaColor' || param === 'bilateralSigmaSpace') { min = 1; max = 200; step = 1; }
                      return (
                        <div key={param} className="space-y-2">
                          <Label htmlFor={param}>
                            {param.charAt(0).toUpperCase() + param.slice(1)}: {transformParams[typedParam] ?? ""}
                          </Label>
                          <Slider
                            id={param}
                            min={min}
                            max={max}
                            step={step}
                            value={[typeof transformParams[typedParam] === 'number' ? (transformParams[typedParam] as number) : min]}
                            onValueChange={value => setTransformParams((prev: TransformParams) => ({ ...prev, [typedParam]: value[0] }))}
                          />
                        </div>
                      );
                    })}
                  </div>
                )}
                {/* Add to Pipeline Button */}
                {currentOperation && (
                  <Button
                    onClick={() => {
                      if (!selectedOperation) return
                      const newStep: TransformStep = {
                        id: generateId(),
                        type: selectedOperation,
                        params: { ...DEFAULT_PARAMS }, // Use DEFAULT_PARAMS for new steps
                        name: currentOperation.label,
                      }
                      setTransformPipeline((prev: TransformStep[]) => [...prev, newStep])
                      setSelectedOperation("")
                    }}
                    className="w-full"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add to Pipeline
                  </Button>
                )}
              </div>
            </Card>

            {/* Transform Pipeline */}
            <Card className="w-full p-4 sm:p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Transform Pipeline</h3>
                <Badge variant="secondary">{transformPipeline.length} steps</Badge>
              </div>

              {transformPipeline.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-4">No transforms added yet</p>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {transformPipeline.map((step, index) => (
                    <div key={step.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline" className="text-xs">
                          {index + 1}
                        </Badge>
                        <span className="text-sm font-medium">{step.name}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => moveTransformInPipeline(step.id, "up")}
                          disabled={index === 0}
                        >
                          <ArrowUp className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => moveTransformInPipeline(step.id, "down")}
                          disabled={index === transformPipeline.length - 1}
                        >
                          <ArrowDown className="h-3 w-3" />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => removeTransformFromPipeline(step.id)}>
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {transformPipeline.length > 0 && (
                <>
                  <Button onClick={applyTransformPipeline} className="w-full mt-4">
                    Apply Pipeline
                  </Button>
                  <Button onClick={handleReset} variant="outline" className="w-full mt-2">
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Reset All
                  </Button>
                </>
              )}
            </Card>

            {/* Mathematical Intuition Toggle */}
            <Card className="w-full p-4">
              <Button
                onClick={() => setShowMathSection(!showMathSection)}
                variant="outline"
                className={`w-full ${showMathSection ? 'bg-muted' : ''}`}
              >
                <BookOpen className="h-4 w-4 mr-2" />
                Mathematical Intuition
              </Button>
            </Card>
          </div>

          {/* Mathematical Intuition Panel */}
          {showMathSection && (
            <div className="lg:col-span-2 space-y-6">
              <Card className="p-6 h-full overflow-y-auto">
                <h3 className="text-lg font-semibold mb-4 flex items-center">
                  <BookOpen className="h-5 w-5 mr-2" />
                  Mathematical Intuition
                </h3>

                {transformPipeline.length > 0 && (
                  <div className="mb-4">
                    <Label>Select Step to Analyze:</Label>
                    <Select value={selectedPipelineStep} onValueChange={setSelectedPipelineStep}>
                      <SelectTrigger>
                        <SelectValue placeholder="Latest step" />
                      </SelectTrigger>
                      <SelectContent>
                        {transformPipeline.map((step, index) => (
                          <SelectItem key={step.id} value={step.id}>
                            Step {index + 1}: {step.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {transformPipeline.length > 0 ? (
                  <MathematicalExplanation explanation={getMathematicalExplanation()} />
                ) : (
                  <div className="text-center text-gray-500 py-8">
                    <BookOpen className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>Add transforms to see mathematical explanation</p>
                  </div>
                )}
              </Card>
            </div>
          )}

          {/* Main Preview Area */}
          <div className={`${showMathSection ? "lg:col-span-2" : "lg:col-span-4"}`}>
            <Card className="p-6 h-full">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Preview</h3>
                <div className="flex flex-col w-full gap-2 md:flex-row md:w-auto md:gap-2">
                  <Button onClick={handleDownload} disabled={!images.processed} variant="outline" className="w-full md:w-auto">
                    <Download className="h-4 w-4 mr-2" />
                    Download Image
                  </Button>
                  <Button onClick={() => setShowCodeExport(!showCodeExport)} disabled={transformPipeline.length === 0} className="w-full md:w-auto">
                    <Code className="h-4 w-4 mr-2" />
                    Export Pipeline Code
                  </Button>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-[calc(100%-3rem)]">
                {/* Original Image */}
                <div className="space-y-2 h-full flex flex-col">
                  <Label>Original</Label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg flex-1 flex items-center justify-center bg-gray-50 overflow-hidden min-h-[200px] max-h-full">
                    {images.original ? (
                      <img
                        src={images.original || "/placeholder.svg"}
                        alt="Original"
                        className="w-full h-full object-contain rounded-lg"
                      />
                    ) : (
                      <div className="text-center text-gray-500">
                        <ImageIcon className="h-12 w-12 mx-auto mb-2 opacity-50" />
                        <p>Upload an image to get started</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Processed Image */}
                <div className="space-y-2 h-full flex flex-col">
                  <Label>
                    Processed
                    {transformPipeline.length > 0 && (
                      <Badge variant="secondary" className="ml-2">
                        {transformPipeline.length} transforms applied
                      </Badge>
                    )}
                  </Label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg flex-1 flex items-center justify-center bg-gray-50 overflow-hidden min-h-[200px] max-h-full">
                    {images.processed && images.processed !== images.original ? (
                      <img
                        src={images.processed || "/placeholder.svg"}
                        alt="Processed"
                        className="w-full h-full object-contain rounded-lg"
                      />
                    ) : (
                      <div className="text-center text-gray-500">
                        <ImageIcon className="h-12 w-12 mx-auto mb-2 opacity-50" />
                        <p>Apply transforms to see results</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>

        {/* Code Export Modal */}
        {showCodeExport && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <Card className="w-full max-w-4xl max-h-[80vh] overflow-hidden">
              <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold">
                    Python Pipeline Code Export
                    <Badge variant="secondary" className="ml-2">
                      {transformPipeline.length} steps
                    </Badge>
                  </h3>
                  <Button onClick={() => setShowCodeExport(false)} variant="outline" size="sm">
                    Close
                  </Button>
                </div>
                <div className="bg-gray-900 text-green-400 p-4 rounded-lg overflow-auto max-h-96 font-mono text-sm">
                  <pre>{generatePythonCode()}</pre>
                </div>
                <div className="mt-4 flex gap-2">
                  <Button
                    onClick={() => {
                      navigator.clipboard.writeText(generatePythonCode())
                    }}
                    size="sm"
                  >
                    Copy to Clipboard
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Hidden canvas for image processing */}
        <canvas ref={canvasRef} className="hidden" />
      </div>
    </div>
  )
}

/**
 * MathematicalExplanation component renders the mathematical intuition for a given transform.
 */
function MathematicalExplanation({ explanation }: MathematicalExplanationProps) {
  if (!explanation) return null;

  return (
    <div className="rounded-xl shadow bg-white p-6 space-y-6 border border-gray-200">
      <div className="flex items-center gap-2 mb-2">
        <BookOpen className="h-5 w-5 text-blue-600" />
        <h4 className="text-lg font-bold">{explanation.title}</h4>
      </div>
      <div className="mb-2">
        <Info className="inline h-4 w-4 text-gray-500 mr-1" />
        <span className="text-gray-700 text-base">{explanation.description}</span>
      </div>
      {explanation.kernel && (
        <div className="mb-2">
          <div className="flex items-center gap-2 mb-1">
            <Grid3x3 className="h-4 w-4 text-green-600" />
            <span className="font-semibold text-sm">Kernel/Matrix:</span>
          </div>
          <div className="inline-block border border-gray-300 rounded bg-gray-50 p-2">
            <table className="border-spacing-1">
              <tbody>
                {explanation.kernel.map((row: number[], i: number) => (
                  <tr key={i}>
                    {row.map((val: number, j: number) => (
                      <td key={j} className="text-center text-xs font-mono px-2 py-1 border border-gray-200 rounded">
                        {val}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
            {explanation.kernelDivisor && (
              <div className="text-xs text-gray-500 mt-1">Divisor: {explanation.kernelDivisor}</div>
            )}
          </div>
        </div>
      )}
      <div className="mb-2">
        <Calculator className="inline h-4 w-4 text-purple-600 mr-1" />
        <span className="font-semibold text-sm">Formula:</span>
        <pre className="bg-gray-100 text-xs font-mono rounded-md p-2 mt-1 overflow-x-auto">{explanation.formula}</pre>
      </div>
      <div className="mb-2">
        <Info className="inline h-4 w-4 text-orange-500 mr-1" />
        <span className="font-semibold text-sm">Intuitive Explanation:</span>
        <div className="bg-orange-50 text-base text-gray-800 rounded-md p-3 mt-1">
          <ReactMarkdown>{explanation.explanation}</ReactMarkdown>
        </div>
      </div>
      {explanation.parameterEffects && (
        <div className="mb-2">
          <Info className="inline h-4 w-4 text-blue-500 mr-1" />
          <span className="font-semibold text-sm">Parameter Effects:</span>
          <div className="bg-blue-50 text-base text-gray-800 rounded-md p-3 mt-1">
            <ReactMarkdown>{explanation.parameterEffects}</ReactMarkdown>
          </div>
        </div>
      )}
      {explanation.example && (
        <div className="mb-2">
          <Info className="inline h-4 w-4 text-green-500 mr-1" />
          <span className="font-semibold text-sm">Example:</span>
          <div className="bg-green-50 text-base text-gray-800 rounded-md p-3 mt-1">
            <ReactMarkdown>{explanation.example}</ReactMarkdown>
          </div>
        </div>
      )}
    </div>
  );
}

