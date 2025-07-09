// Mathematical Explanation Component
// Provides detailed mathematical intuition and visualization for image transforms.

"use client"

import type React from "react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

/**
 * MathExplanation interface defines the structure for mathematical explanations of transforms.
 */
interface MathExplanation {
  title: string
  description: string
  kernel?: number[][]
  kernelDivisor?: number
  formula: string
  explanation: string
}

interface MathematicalExplanationProps {
  explanation: MathExplanation | null
}

/**
 * FormulaDisplay renders a mathematical formula in a styled box.
 */
const FormulaDisplay: React.FC<{ formula: string; title?: string }> = ({ formula, title = "Mathematical Formula" }) => {
  return (
    <div className="space-y-1">
      <h5 className="text-sm font-semibold">{title}</h5>
      <div className="bg-gray-100 p-2 rounded-md font-mono text-xs">{formula}</div>
    </div>
  )
}

/**
 * KernelVisualization renders a visual representation of a convolution kernel.
 */
const KernelVisualization: React.FC<{ kernel: number[][]; divisor?: number }> = ({ kernel, divisor = 1 }) => {
  return (
    <div className="space-y-2">
      <h4 className="font-semibold text-sm">Convolution Kernel:</h4>
      <div className="bg-gray-50 p-4 rounded-lg">
        <div className="grid gap-1 justify-center" style={{ gridTemplateColumns: `repeat(${kernel[0].length}, 1fr)` }}>
          {kernel.flat().map((value: number, index: number) => (
            <div
              key={index}
              className={`w-12 h-12 flex items-center justify-center text-xs font-mono border rounded ${
                value > 0
                  ? "bg-blue-100 border-blue-300"
                  : value < 0
                    ? "bg-red-100 border-red-300"
                    : "bg-gray-100 border-gray-300"
              }`}
            >
              {value}
            </div>
          ))}
        </div>
        {divisor !== 1 && (
          <div className="text-center mt-2 text-sm text-gray-600">÷ {divisor} (normalization factor)</div>
        )}
      </div>
      <div className="text-xs text-gray-600">
        <p>
          <strong>How it works:</strong> Each pixel is replaced by the weighted sum of its neighbors using this kernel.
        </p>
        <p className="mt-1">
          The kernel is centered on each pixel and multiplied element-wise with the surrounding pixels.
        </p>
      </div>
    </div>
  )
}

/**
 * OperationSteps renders a step-by-step breakdown of the image processing operation.
 */
const OperationSteps: React.FC<{ operation: string }> = ({ operation }) => {
  const steps = {
    blur: [
      "Convert image to grayscale (if needed)",
      "Apply Gaussian kernel to each pixel",
      "Normalize by kernel sum",
      "Handle border pixels (padding/reflection)",
    ],
    threshold: [
      "Convert to grayscale",
      "Compare each pixel with threshold T",
      "Set pixel to 255 if > T, else 0",
      "Result is binary image",
    ],
    contrast: [
      "For each pixel I(x,y)",
      "Multiply by contrast factor α",
      "Add brightness offset β",
      "Clamp values to [0, 255]",
    ],
    brightness: [
      "For each pixel I(x,y)",
      "Add brightness value β",
      "Clamp result to [0, 255]",
      "Apply to all color channels",
    ],
    sharpen: [
      "Apply sharpening kernel",
      "Emphasize center pixel",
      "Subtract surrounding pixels",
      "Enhance edge information",
    ],
    crop: [
      "Define crop rectangle (x, y, w, h)",
      "Extract pixels within bounds",
      "Create new image with cropped dimensions",
      "Preserve original pixel values",
    ],
  }

  const operationSteps = steps[operation as keyof typeof steps] || []

  return (
    <div className="space-y-2">
      <h4 className="font-semibold text-sm">Processing Steps:</h4>
      <ol className="space-y-1">
        {operationSteps.map((step: string, index: number) => (
          <li key={index} className="flex items-start text-sm">
            <Badge variant="outline" className="mr-2 text-xs min-w-[20px] h-5 flex items-center justify-center">
              {index + 1}
            </Badge>
            <span className="text-gray-700">{step}</span>
          </li>
        ))}
      </ol>
    </div>
  )
}

/**
 * MathematicalExplanation renders the full mathematical explanation UI for a given transform.
 */
export default function MathematicalExplanation({ explanation }: MathematicalExplanationProps) {
  if (!explanation) return null

  return (
    <div className="space-y-6">
      {/* Title and Description */}
      <div>
        <h4 className="text-lg font-semibold text-blue-600 mb-2">{explanation.title}</h4>
        <p className="text-sm text-gray-600 leading-relaxed">{explanation.description}</p>
      </div>

      {/* Kernel Visualization (if applicable) */}
      {explanation.kernel && <KernelVisualization kernel={explanation.kernel} divisor={explanation.kernelDivisor} />}

      {/* Mathematical Formula */}
      <FormulaDisplay formula={explanation.formula} />

      {/* Processing Steps */}
      <OperationSteps operation={explanation.title.toLowerCase().replace(/\s+/g, "")} />

      {/* Detailed Explanation */}
      <div className="space-y-2">
        <h4 className="font-semibold text-sm">Intuitive Explanation:</h4>
        <Card className="p-3 bg-blue-50 border-blue-200">
          <p className="text-sm text-blue-800 leading-relaxed">{explanation.explanation}</p>
        </Card>
      </div>

      {/* Additional Mathematical Insights */}
      <div className="space-y-2">
        <h4 className="font-semibold text-sm">Key Mathematical Concepts:</h4>
        <div className="space-y-2 text-sm">
          {explanation.title === "Gaussian Blur" && (
            <div className="space-y-1">
              <p>
                <strong>Convolution:</strong> Mathematical operation combining two functions
              </p>
              <p>
                <strong>Gaussian Function:</strong> Bell-shaped curve for natural smoothing
              </p>
              <p>
                <strong>Separability:</strong> 2D Gaussian = 1D horizontal × 1D vertical
              </p>
            </div>
          )}
          {explanation.title === "Binary Threshold" && (
            <div className="space-y-1">
              <p>
                <strong>Histogram Analysis:</strong> Choose T based on pixel distribution
              </p>
              <p>
                <strong>Otsu's Method:</strong> Automatic threshold selection
              </p>
              <p>
                <strong>Adaptive Thresholding:</strong> Local threshold computation
              </p>
            </div>
          )}
          {explanation.title === "Contrast Adjustment" && (
            <div className="space-y-1">
              <p>
                <strong>Linear Transformation:</strong> y = ax + b mapping
              </p>
              <p>
                <strong>Histogram Stretching:</strong> Expand dynamic range
              </p>
              <p>
                <strong>Gamma Correction:</strong> Non-linear contrast adjustment
              </p>
            </div>
          )}
          {explanation.title === "Sharpening Filter" && (
            <div className="space-y-1">
              <p>
                <strong>High-pass Filter:</strong> Emphasizes rapid intensity changes
              </p>
              <p>
                <strong>Laplacian Operator:</strong> Second derivative for edge detection
              </p>
              <p>
                <strong>Unsharp Masking:</strong> Original + α × (Original - Blurred)
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
