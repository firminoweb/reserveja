"use client"

import { useRef, useState } from "react"
import Image from "next/image"
import { ImagePlus, Loader2, X } from "lucide-react"
import { toast } from "sonner"

import { cn } from "@/lib/utils"

type Props = {
  value: string
  onChange: (url: string) => void
  className?: string
}

export function ImageUpload({ value, onChange, className }: Props) {
  const [uploading, setUploading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  async function handleFile(file: File) {
    if (file.size > 1 * 1024 * 1024) {
      toast.error("Imagem muito grande (máximo 1 MB)")
      return
    }

    setUploading(true)
    try {
      const form = new FormData()
      form.append("file", file)
      const res = await fetch("/api/upload", { method: "POST", body: form })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        if (data.error === "invalid_type") toast.error("Formato não suportado. Use JPG, PNG ou WebP.")
        else if (data.error === "too_large") toast.error("Imagem muito grande (máximo 1 MB)")
        else if (data.error === "still_too_large") toast.error("Não foi possível comprimir abaixo de 30 KB. Tente uma imagem mais simples.")
        else toast.error("Erro ao enviar imagem")
        return
      }
      const { url } = await res.json()
      onChange(url)
      toast.success("Imagem enviada")
    } catch {
      toast.error("Erro ao enviar imagem")
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className={cn("relative", className)}>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/svg+xml"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) handleFile(file)
          e.target.value = ""
        }}
      />

      {value ? (
        <div className="relative group inline-block">
          <Image
            src={value}
            alt="Logo"
            width={80}
            height={80}
            unoptimized
            className="size-20 rounded-xl object-cover border"
          />
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl flex items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="rounded-full bg-white/90 p-1.5 text-foreground hover:bg-white"
            >
              <ImagePlus className="size-4" />
            </button>
            <button
              type="button"
              onClick={() => onChange("")}
              className="rounded-full bg-white/90 p-1.5 text-destructive hover:bg-white"
            >
              <X className="size-4" />
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          disabled={uploading}
          onClick={() => inputRef.current?.click()}
          className="flex size-20 items-center justify-center border-2 border-dashed rounded-xl text-muted-foreground hover:border-primary hover:text-primary transition-colors cursor-pointer"
        >
          {uploading ? (
            <Loader2 className="size-5 animate-spin" />
          ) : (
            <div className="flex flex-col items-center gap-1">
              <ImagePlus className="size-5" />
              <span className="text-xs">Logo</span>
            </div>
          )}
        </button>
      )}
    </div>
  )
}
