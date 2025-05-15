"use client"

import { useState, useRef } from "react"
import { Upload, X, Image as ImageIcon } from "lucide-react"

interface ImageUploadProps {
  value: string | null
  onChange: (value: string | null) => void
  onFileChange?: (file: File | null) => void
  className?: string
  previewSize?: number
}

export function ImageUpload({
  value,
  onChange,
  onFileChange,
  className = "",
  previewSize = 150
}: ImageUploadProps) {
  const [dragActive, setDragActive] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }
  
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0])
    }
  }
  
  const handleFileChange = (file: File) => {
    if (file) {
      // Create a preview URL
      const url = URL.createObjectURL(file)
      onChange(url)
      
      // Pass the file to parent component if needed
      if (onFileChange) {
        onFileChange(file)
      }
    }
  }
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileChange(e.target.files[0])
    }
  }
  
  const handleRemove = () => {
    onChange(null)
    
    // Pass null to parent component if needed
    if (onFileChange) {
      onFileChange(null)
    }
    
    // Reset the input
    if (inputRef.current) {
      inputRef.current.value = ""
    }
  }
  
  return (
    <div className={`relative ${className}`}>
      <input
        type="file"
        accept="image/*"
        className="sr-only"
        ref={inputRef}
        onChange={handleInputChange}
      />
      
      {value ? (
        <div className="relative" style={{ width: previewSize, height: previewSize }}>
          <img
            src={value}
            alt="Preview"
            className="w-full h-full object-cover rounded-md"
          />
          <button
            type="button"
            onClick={handleRemove}
            className="absolute top-1 right-1 bg-destructive rounded-full p-1 text-destructive-foreground shadow-sm hover:opacity-90 transition-opacity"
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Remove image</span>
          </button>
        </div>
      ) : (
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          className={`flex flex-col items-center justify-center border-2 border-dashed rounded-md cursor-pointer transition-colors ${
            dragActive ? "border-primary bg-primary/5" : "border-muted-foreground/25"
          }`}
          style={{ width: previewSize, height: previewSize }}
        >
          <ImageIcon className="h-8 w-8 text-muted-foreground/50 mb-2" />
          <div className="text-xs text-center text-muted-foreground">
            <p>Drag and drop an image</p>
            <p>or click to browse</p>
          </div>
        </div>
      )}
    </div>
  )
} 