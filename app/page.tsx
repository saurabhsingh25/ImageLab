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
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"

/**
 * ImageState defines the structure for holding the original, processed, and intermediate images.
 */
interface ImageState {
  original: string | null
  processed: string | null
  intermediateSteps: string[]
}

interface TransformParams {
  blur: number
  threshold: number
  contrast: number
  brightness: number
  sharpen: number
  cropX: number
  cropY: number
  cropWidth: number
  cropHeight: number
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
  const [selectedTransform, setSelectedTransform] = useState<string>("")
  const [transformParams, setTransformParams] = useState<TransformParams>(DEFAULT_PARAMS)
  const [transformPipeline, setTransformPipeline] = useState<TransformStep[]>([])
  const [showCodeExport, setShowCodeExport] = useState(false)
  const [showMathSection, setShowMathSection] = useState(false)
  const [selectedPipelineStep, setSelectedPipelineStep] = useState<string>("")
  const fileInputRef = useRef<HTMLInputElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const generateId = () => Math.random().toString(36).substr(2, 9)

  /**
   * Handles image upload and initializes state.
   */
  const handleImageUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file && file.type.startsWith("image/")) {
      const reader = new FileReader()
      reader.onload = (e) => {
        const result = e.target?.result as string
        setImages({ original: result, processed: result, intermediateSteps: [] })
        setTransformPipeline([])
      }
      reader.readAsDataURL(file)
    }
  }, [])

  const addTransformToPipeline = useCallback(() => {
    if (!selectedTransform) return

    const newStep: TransformStep = {
      id: generateId(),
      type: selectedTransform,
      params: { ...transformParams },
      name: TRANSFORM_OPTIONS.find((t) => t.value === selectedTransform)?.label || selectedTransform,
    }

    setTransformPipeline((prev) => [...prev, newStep])
    setSelectedTransform("")
  }, [selectedTransform, transformParams])

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
  const applyTransformPipeline = useCallback(() => {
    if (!images.original || transformPipeline.length === 0) return

    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const img = new Image()
    img.crossOrigin = "anonymous"
    img.onload = () => {
      canvas.width = img.width
      canvas.height = img.height
      ctx.drawImage(img, 0, 0)

      const intermediateSteps: string[] = []
      let currentImageData = ctx.getImageData(0, 0, canvas.width, canvas.height)

      // Apply each transform in sequence
      transformPipeline.forEach((step, index) => {
        const data = currentImageData.data

        switch (step.type) {
          case "brightness":
            const brightnessFactor = (step.params.brightness || 100) / 100
            for (let i = 0; i < data.length; i += 4) {
              data[i] = Math.min(255, Math.max(0, data[i] * brightnessFactor))
              data[i + 1] = Math.min(255, Math.max(0, data[i + 1] * brightnessFactor))
              data[i + 2] = Math.min(255, Math.max(0, data[i + 2] * brightnessFactor))
            }
            break
          case "contrast":
            const contrastFactor = (step.params.contrast || 100) / 100
            for (let i = 0; i < data.length; i += 4) {
              data[i] = Math.min(255, Math.max(0, (data[i] - 128) * contrastFactor + 128))
              data[i + 1] = Math.min(255, Math.max(0, (data[i + 1] - 128) * contrastFactor + 128))
              data[i + 2] = Math.min(255, Math.max(0, (data[i + 2] - 128) * contrastFactor + 128))
            }
            break
          case "threshold":
            const threshold = step.params.threshold || 128
            for (let i = 0; i < data.length; i += 4) {
              const gray = (data[i] + data[i + 1] + data[i + 2]) / 3
              const value = gray > threshold ? 255 : 0
              data[i] = data[i + 1] = data[i + 2] = value
            }
            break
          case "blur":
            // Simplified blur implementation
            const blurRadius = step.params.blur || 1
            const originalData = new Uint8ClampedArray(data)
            for (let y = blurRadius; y < canvas.height - blurRadius; y++) {
              for (let x = blurRadius; x < canvas.width - blurRadius; x++) {
                let r = 0,
                  g = 0,
                  b = 0,
                  count = 0
                for (let dy = -blurRadius; dy <= blurRadius; dy++) {
                  for (let dx = -blurRadius; dx <= blurRadius; dx++) {
                    const idx = ((y + dy) * canvas.width + (x + dx)) * 4
                    r += originalData[idx]
                    g += originalData[idx + 1]
                    b += originalData[idx + 2]
                    count++
                  }
                }
                const idx = (y * canvas.width + x) * 4
                data[idx] = r / count
                data[idx + 1] = g / count
                data[idx + 2] = b / count
              }
            }
            break
        }

        ctx.putImageData(currentImageData, 0, 0)
        intermediateSteps.push(canvas.toDataURL())
        currentImageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
      })

      setImages((prev) => ({
        ...prev,
        processed: canvas.toDataURL(),
        intermediateSteps,
      }))
    }
    img.src = images.original
  }, [images.original, transformPipeline])

  /**
   * Resets the workbench to its initial state.
   */
  const handleReset = useCallback(() => {
    setImages({ original: null, processed: null, intermediateSteps: [] })
    setSelectedTransform("")
    setTransformPipeline([])
    setTransformParams(DEFAULT_PARAMS)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }, [])

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
    if (transformPipeline.length === 0) return null

    const selectedStep =
      transformPipeline.find((step) => step.id === selectedPipelineStep) ||
      transformPipeline[transformPipeline.length - 1]
    if (!selectedStep) return null

    const explanations = {
      blur: {
        title: "Gaussian Blur",
        description:
          "Applies a Gaussian kernel to smooth the image by averaging neighboring pixels with weighted contributions.",
        kernel: [
          [1, 2, 1],
          [2, 4, 2],
          [1, 2, 1],
        ],
        kernelDivisor: 16,
        formula: "G(x,y) = (1/(2πσ²)) * e^(-(x²+y²)/(2σ²))",
        explanation:
          "Each pixel is replaced by a weighted average of its neighbors. The Gaussian function ensures closer pixels have more influence.",
      },
      threshold: {
        title: "Binary Threshold",
        description: "Converts grayscale image to binary by comparing each pixel against a threshold value.",
        formula: "f(x,y) = { 255 if I(x,y) > T, 0 otherwise }",
        explanation:
          "Simple conditional operation where T is the threshold value. Pixels above threshold become white (255), others become black (0).",
      },
      contrast: {
        title: "Contrast Adjustment",
        description:
          "Multiplies pixel values by a contrast factor to increase or decrease the difference between light and dark areas.",
        formula: "I'(x,y) = α * (I(x,y) - 128) + 128",
        explanation:
          "Linear transformation where α controls contrast (>1 increases, <1 decreases) around the midpoint (128).",
      },
      brightness: {
        title: "Brightness Adjustment",
        description: "Multiplies pixel values by a brightness factor.",
        formula: "I'(x,y) = α * I(x,y)",
        explanation: "Simple multiplication operation where α is the brightness factor. Values >1 brighten, <1 darken.",
      },
      sharpen: {
        title: "Sharpening Filter",
        description: "Enhances edges and fine details by emphasizing high-frequency components.",
        kernel: [
          [-1, -1, -1],
          [-1, 9, -1],
          [-1, -1, -1],
        ],
        kernelDivisor: 1,
        formula: "Laplacian: ∇²f = ∂²f/∂x² + ∂²f/∂y²",
        explanation:
          "Subtracts a smoothed version from the original image to enhance edges. The center weight is positive, surrounding weights are negative.",
      },
      crop: {
        title: "Image Cropping",
        description: "Extracts a rectangular region from the original image.",
        formula: "I'(x,y) = I(x+x₀, y+y₀) for (x,y) ∈ [0,w] × [0,h]",
        explanation:
          "Simple geometric transformation that selects a sub-region defined by starting coordinates (x₀,y₀) and dimensions (w,h).",
      },
    }

    return explanations[selectedStep.type as keyof typeof explanations] || null
  }, [transformPipeline, selectedPipelineStep])

  const currentTransform = TRANSFORM_OPTIONS.find((t) => t.value === selectedTransform)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation Bar */}
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="w-full px-4 sm:px-8 lg:px-16">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <img src="/github-mark.svg" alt="GitHub" className="h-8 w-8" />
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                VisionPreprocessor
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

            <Card className="w-full p-4 sm:p-6">
              <h3 className="text-lg font-semibold mb-4">Add Transform</h3>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="transform-select">Operation</Label>
                  <Select value={selectedTransform} onValueChange={setSelectedTransform}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select transform" />
                    </SelectTrigger>
                    <SelectContent>
                      {TRANSFORM_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {currentTransform && (
                  <div className="space-y-4">
                    {currentTransform.params.map((param) => (
                      <div key={param} className="space-y-2">
                        <Label htmlFor={param}>
                          {param.charAt(0).toUpperCase() + param.slice(1)}:{" "}
                          {transformParams[param as keyof TransformParams]}
                        </Label>
                        <Slider
                          id={param}
                          min={param === "threshold" ? 0 : param.includes("crop") ? 0 : 0}
                          max={param === "threshold" ? 255 : param.includes("crop") ? 100 : param === "blur" ? 20 : 200}
                          step={1}
                          value={[transformParams[param as keyof TransformParams]]}
                          onValueChange={(value) => setTransformParams((prev) => ({ ...prev, [param]: value[0] }))}
                        />
                      </div>
                    ))}
                    <Button onClick={addTransformToPipeline} className="w-full">
                      <Plus className="h-4 w-4 mr-2" />
                      Add to Pipeline
                    </Button>
                  </div>
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
  if (!explanation) return null

  return (
    <div className="space-y-4">
      <h4 className="text-md font-semibold">{explanation.title}</h4>
      <p className="text-sm text-gray-700">{explanation.description}</p>

      {explanation.kernel && (
        <div className="space-y-2">
          <h5 className="text-sm font-semibold">Kernel:</h5>
          <div className="grid grid-cols-3 gap-1 w-fit">
            {explanation.kernel.flat().map((value: number, index: number) => (
              <div key={index} className="text-center text-xs font-mono border border-gray-300 rounded p-1">
                {value}
              </div>
            ))}
          </div>
          {explanation.kernelDivisor && <p className="text-xs text-gray-500">Divisor: {explanation.kernelDivisor}</p>}
        </div>
      )}

      <div className="space-y-2">
        <h5 className="text-sm font-semibold">Formula:</h5>
        <p className="text-xs font-mono bg-gray-100 p-2 rounded-md">{explanation.formula}</p>
      </div>

      <div className="space-y-2">
        <h5 className="text-sm font-semibold">Explanation:</h5>
        <p className="text-xs text-gray-700">{explanation.explanation}</p>
      </div>
    </div>
  )
}
