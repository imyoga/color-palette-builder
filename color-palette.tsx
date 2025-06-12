"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Copy, Palette, Download } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export default function ColorPalette() {
  const [colors, setColors] = useState<string[]>(Array(10).fill(""))
  const [pickerColor, setPickerColor] = useState("#3b82f6")
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
            Create your custom color palette by entering hex codes or using the color picker
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

          {/* Color Picker */}
          <div className="lg:col-span-1">
            <Card className="h-fit">
              <CardHeader>
                <CardTitle>Color Picker</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Pick a color:</label>
                  <input
                    type="color"
                    value={pickerColor}
                    onChange={(e) => setPickerColor(e.target.value)}
                    className="w-full h-32 rounded-lg border-2 border-gray-200 cursor-pointer"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Selected Color:</label>
                  <div className="flex items-center gap-2">
                    <Input value={pickerColor} onChange={(e) => setPickerColor(e.target.value)} className="font-mono" />
                    <Button size="sm" variant="outline" onClick={() => copyColor(pickerColor)}>
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Quick Actions:</label>
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
                </div>

                {/* Color Suggestions */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Popular Colors:</label>
                  <div className="grid grid-cols-4 gap-2">
                    {["#ef4444", "#f97316", "#eab308", "#22c55e", "#06b6d4", "#3b82f6", "#8b5cf6", "#ec4899"].map(
                      (suggestedColor) => (
                        <button
                          key={suggestedColor}
                          className="w-8 h-8 rounded border-2 border-gray-200 hover:border-gray-400 transition-colors"
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
          </div>
        </div>
      </div>
    </div>
  )
}
