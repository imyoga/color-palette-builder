"use client"

import { useState, useRef } from "react"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Copy, Palette, Download, Upload, Image as ImageIcon } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export default function ColorPalette() {
  const [colors, setColors] = useState<string[]>(Array(10).fill(""))
  const [pickerColor, setPickerColor] = useState("#3b82f6")
  const [extractedColors, setExtractedColors] = useState<string[]>([])
  const [uploadedImage, setUploadedImage] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const { toast } = useToast()

  const isValidHex = (color: string): boolean => {
    const hex = color.startsWith("#") ? color : `#${color}`
    return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(hex)
  }

  const normalizeHex = (color: string): string => {
    if (!color) return ""
    const hex = color.startsWith("#") ? color : `#${color}`
    return isValidHex(hex) ? hex : ""
  }

  const handleColorChange = (index: number, value: string) => {
    const newColors = [...colors]
    newColors[index] = value
    setColors(newColors)
  }

  const addColorFromPicker = (index: number) => {
    const newColors = [...colors]
    newColors[index] = pickerColor
    setColors(newColors)
    toast({
      title: "Color added",
      description: `Added ${pickerColor} to row ${index + 1}`,
    })
  }

  const addExtractedColor = (color: string, index?: number) => {
    const newColors = [...colors]
    const targetIndex = index !== undefined ? index : colors.findIndex((c) => !c)
    
    if (targetIndex !== -1) {
      newColors[targetIndex] = color
      setColors(newColors)
      toast({
        title: "Color added",
        description: `Added ${color} to row ${targetIndex + 1}`,
      })
    } else {
      toast({
        title: "Palette full",
        description: "All color slots are filled",
        variant: "destructive"
      })
    }
  }

  const copyColor = (color: string) => {
    const normalizedColor = normalizeHex(color)
    if (normalizedColor) {
      navigator.clipboard.writeText(normalizedColor)
      toast({
        title: "Copied!",
        description: `${normalizedColor} copied to clipboard`,
      })
    }
  }

  const rgbToHex = (r: number, g: number, b: number): string => {
    // Ensure values are valid and within range
    const clampedR = Math.max(0, Math.min(255, Math.floor(r)))
    const clampedG = Math.max(0, Math.min(255, Math.floor(g)))
    const clampedB = Math.max(0, Math.min(255, Math.floor(b)))
    
    return "#" + [clampedR, clampedG, clampedB].map(x => {
      const hex = x.toString(16).toLowerCase()
      return hex.length === 1 ? "0" + hex : hex
    }).join("")
  }

  const extractColorsFromImage = (imageElement: HTMLImageElement) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Set canvas size to image size (but limit for performance)
    const maxSize = 300
    const ratio = Math.min(maxSize / imageElement.width, maxSize / imageElement.height)
    canvas.width = imageElement.width * ratio
    canvas.height = imageElement.height * ratio

    // Draw image on canvas
    ctx.drawImage(imageElement, 0, 0, canvas.width, canvas.height)

    // Get image data
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
    const pixels = imageData.data

    // Color frequency map
    const colorMap = new Map<string, { r: number, g: number, b: number, count: number }>()

    // Sample pixels (every 4th pixel for performance)
    for (let i = 0; i < pixels.length; i += 16) {
      const r = pixels[i]
      const g = pixels[i + 1]
      const b = pixels[i + 2]
      const alpha = pixels[i + 3]

      // Skip transparent or invalid pixels
      if (alpha < 128 || r === undefined || g === undefined || b === undefined) continue

      // Group similar colors (reduce precision for better grouping)
      const groupedR = Math.round(r / 20) * 20
      const groupedG = Math.round(g / 20) * 20
      const groupedB = Math.round(b / 20) * 20

      const colorKey = `${groupedR}-${groupedG}-${groupedB}`
      
      if (colorMap.has(colorKey)) {
        const existing = colorMap.get(colorKey)!
        existing.count += 1
      } else {
        colorMap.set(colorKey, { r: groupedR, g: groupedG, b: groupedB, count: 1 })
      }
    }

    // Sort colors by frequency and get top 5
    const sortedColors = Array.from(colorMap.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)
      .map(({ r, g, b }) => rgbToHex(r, g, b))
      .filter(color => color.length === 7) // Ensure valid hex format

    setExtractedColors(sortedColors)
    toast({
      title: "Colors extracted!",
      description: `Found ${sortedColors.length} dominant colors from the image`,
    })
  }

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid file",
        description: "Please upload an image file",
        variant: "destructive"
      })
      return
    }

    const reader = new FileReader()
    reader.onload = (e) => {
      const imageUrl = e.target?.result as string
      setUploadedImage(imageUrl)

      // Create image element to extract colors
      const img = new Image()
      img.onload = () => extractColorsFromImage(img)
      img.src = imageUrl
    }
    reader.readAsDataURL(file)
  }

  const exportPalette = () => {
    const validColors = colors.filter((color) => normalizeHex(color))
    const paletteData = {
      name: "My Color Palette",
      colors: validColors.map((color) => normalizeHex(color)),
      created: new Date().toISOString(),
    }

    const blob = new Blob([JSON.stringify(paletteData, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "color-palette.json"
    a.click()
    URL.revokeObjectURL(url)

    toast({
      title: "Palette exported",
      description: "Your color palette has been downloaded as JSON",
    })
  }

  const clearAll = () => {
    setColors(Array(10).fill(""))
    toast({
      title: "Palette cleared",
      description: "All colors have been removed from the palette",
    })
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Color Palette Creator</h1>
          <p className="text-gray-600">
            Create your custom color palette by entering hex codes, using the color picker, or extracting colors from images
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Color Table */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Palette className="h-5 w-5" />
                  Color Palette
                </CardTitle>
                <div className="flex gap-2">
                  <Button onClick={clearAll} variant="outline" size="sm">
                    Clear All
                  </Button>
                  <Button onClick={exportPalette} variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-2" />
                    Export
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-16">#</TableHead>
                      <TableHead>Hex Code</TableHead>
                      <TableHead className="w-32">Color Preview</TableHead>
                      <TableHead className="w-24">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {colors.map((color, index) => {
                      const normalizedColor = normalizeHex(color)
                      const isValid = color === "" || normalizedColor !== ""

                      return (
                        <TableRow key={index}>
                          <TableCell className="font-medium">{index + 1}</TableCell>
                          <TableCell>
                            <Input
                              value={color}
                              onChange={(e) => handleColorChange(index, e.target.value)}
                              placeholder="e.g., #3b82f6 or 3b82f6"
                              className={`font-mono ${!isValid ? "border-red-500" : ""}`}
                            />
                            {!isValid && <p className="text-xs text-red-500 mt-1">Invalid hex color</p>}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div
                                className="w-12 h-8 rounded border-2 border-gray-200"
                                style={{
                                  backgroundColor: normalizedColor || "#ffffff",
                                }}
                              />
                              {normalizedColor && (
                                <span className="text-xs font-mono text-gray-600">{normalizedColor}</span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => addColorFromPicker(index)}
                                className="h-8 w-8 p-0"
                              >
                                +
                              </Button>
                              {normalizedColor && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => copyColor(color)}
                                  className="h-8 w-8 p-0"
                                >
                                  <Copy className="h-3 w-3" />
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>

          {/* Right Panel */}
          <div className="lg:col-span-1 space-y-4">
            {/* Color Picker - More Compact */}
            <Card className="h-fit">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Color Picker</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <input
                    type="color"
                    value={pickerColor}
                    onChange={(e) => setPickerColor(e.target.value)}
                    className="w-full h-16 rounded-lg border-2 border-gray-200 cursor-pointer"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <Input 
                    value={pickerColor} 
                    onChange={(e) => setPickerColor(e.target.value)} 
                    className="font-mono text-sm" 
                  />
                  <Button size="sm" variant="outline" onClick={() => copyColor(pickerColor)}>
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const emptyIndex = colors.findIndex((c) => !c)
                      if (emptyIndex !== -1) {
                        addColorFromPicker(emptyIndex)
                      } else {
                        toast({
                          title: "Palette full",
                          description: "All color slots are filled",
                        })
                      }
                    }}
                  >
                    Add to Next
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => copyColor(pickerColor)}>
                    Copy Hex
                  </Button>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Popular Colors:</label>
                  <div className="grid grid-cols-4 gap-1">
                    {["#ef4444", "#f97316", "#eab308", "#22c55e", "#06b6d4", "#3b82f6", "#8b5cf6", "#ec4899"].map(
                      (suggestedColor) => (
                        <button
                          key={suggestedColor}
                          className="w-6 h-6 rounded border border-gray-200 hover:border-gray-400 transition-colors"
                          style={{ backgroundColor: suggestedColor }}
                          onClick={() => setPickerColor(suggestedColor)}
                          title={suggestedColor}
                        />
                      ),
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Image Color Extractor */}
            <Card className="h-fit">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <ImageIcon className="h-4 w-4" />
                  Extract from Image
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <Button
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full"
                  >
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

                {uploadedImage && (
                  <div className="space-y-2">
                    <img
                      src={uploadedImage}
                      alt="Uploaded"
                      className="w-full h-32 object-cover rounded border"
                    />
                  </div>
                )}

                {extractedColors.length > 0 && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Extracted Colors:</label>
                    <div className="space-y-1">
                      {extractedColors.map((color, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <div
                            className="w-6 h-6 rounded border border-gray-200"
                            style={{ backgroundColor: color }}
                          />
                          <span className="text-xs font-mono flex-1">{color}</span>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => addExtractedColor(color)}
                            className="h-6 px-2 text-xs"
                          >
                            Add
                          </Button>
                        </div>
                      ))}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        extractedColors.forEach((color) => addExtractedColor(color))
                      }}
                      className="w-full"
                    >
                      Add All Colors
                    </Button>
                  </div>
                )}

                <canvas ref={canvasRef} className="hidden" />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
