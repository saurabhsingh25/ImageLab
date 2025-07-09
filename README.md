# ImageLab

[![CI](https://github.com/saurabhsingh25/ImageLab/actions/workflows/ci.yml/badge.svg)](https://github.com/saurabhsingh25/ImageLab/actions/workflows/ci.yml)

An open-source, interactive web application for building, visualizing, and exporting multi-step image preprocessing pipelines for computer vision tasks. Built with Next.js, React, and Tailwind CSS.

---

## 🚀 Overview

The Multi-Image Preprocessing Workbench lets you:
- Upload images and apply a sequence of common preprocessing transforms (blur, threshold, contrast, brightness, sharpen, crop)
- Visualize each step and preview the final result
- Export the entire pipeline as ready-to-use Python (OpenCV + PIL) code
- Explore the mathematical intuition behind each transform

This tool is ideal for computer vision practitioners, students, and educators who want to experiment with preprocessing pipelines before deploying them in Python projects.

---

## ✨ Features

- **Drag-and-drop or click to upload images**
- **Pipeline builder:** Add, reorder, and remove transforms
- **Supported transforms:**
  - Gaussian Blur
  - Binary Threshold
  - Contrast Adjustment
  - Brightness Adjustment
  - Sharpening
  - Cropping
- **Parameter controls:** Fine-tune each transform's parameters
- **Live preview:** See the effect of each step instantly
- **Mathematical explanations:** Learn the math behind each operation
- **Python code export:** Generate Python code for your pipeline (OpenCV + PIL)
- **Download processed images**
- **Responsive UI:** Works on desktop and mobile

---

## 🖥️ Project Structure

```
app/                # Next.js app directory (pages, layout, main UI)
components/         # Reusable React components (UI, mathematical explanations, etc.)
hooks/              # Custom React hooks
lib/                # Utility functions
public/             # Static assets (images, icons)
styles/             # Global and Tailwind CSS
```

---

## 🛠️ Getting Started

### Prerequisites
- Node.js (v18+ recommended)
- pnpm, npm, or yarn

### Installation

1. **Clone the repo:**
   ```bash
   git clone https://github.com/saurabhsingh25/multi-image-preprocessing-workbench.git
   cd multi-image-preprocessing-workbench
   ```
2. **Install dependencies:**
   ```bash
   pnpm install   # or npm install or yarn install
   ```
3. **Run the development server:**
   ```bash
   pnpm dev      # or npm run dev or yarn dev
   ```
4. **Open in your browser:**
   Visit [http://localhost:3000](http://localhost:3000)

---

## 🧑‍💻 Usage

1. Upload an image (PNG, JPG, etc.)
2. Add transforms to the pipeline and adjust their parameters
3. Preview the result after each step
4. Download the processed image or export the pipeline as Python code
5. Explore the mathematical intuition for each transform

---

## 🤝 Contributing

Contributions, issues, and feature requests are welcome!
- Fork the repo and create your branch
- Submit a pull request describing your changes

---

## 📄 License

This project is licensed under the MIT License.

---

## 🙏 Acknowledgements
- [OpenCV](https://opencv.org/), [Pillow](https://python-pillow.org/)
- [Next.js](https://nextjs.org/), [React](https://react.dev/), [Tailwind CSS](https://tailwindcss.com/)
- [shadcn/ui](https://ui.shadcn.com/) for UI components

---

## CI/CD

This project uses GitHub Actions for continuous integration. Every push and pull request runs lint, build, and test checks automatically. See `.github/workflows/ci.yml` for details.

---

> Created by [saurabhsingh25](https://github.com/saurabhsingh25) for the computer vision community. 