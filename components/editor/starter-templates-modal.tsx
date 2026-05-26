"use client"

import type { CSSProperties } from "react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { CanvasNodeShape } from "./canvas-node-shape"
import {
  CANVAS_TEMPLATES,
  cloneCanvasTemplate,
  getTemplateBounds,
  type CanvasTemplate,
} from "./starter-templates"
import { SHAPE_DEFAULTS } from "@/types/canvas"

interface StarterTemplatesModalProps {
  isOpen: boolean
  onImport: (template: CanvasTemplate) => void
  onOpenChange: (open: boolean) => void
}

const PREVIEW_WIDTH = 280
const PREVIEW_HEIGHT = 160
const PREVIEW_PADDING = 20

export function StarterTemplatesModal({
  isOpen,
  onImport,
  onOpenChange,
}: StarterTemplatesModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-5xl rounded-3xl border border-surface-border bg-surface p-0 text-copy-primary ring-0 sm:max-w-5xl"
      >
        <DialogHeader className="border-b border-surface-border px-6 py-5">
          <DialogTitle>Starter templates</DialogTitle>
          <DialogDescription className="text-copy-muted">
            Replace the current canvas with a prebuilt system design.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[70vh]">
          <div className="grid gap-4 px-6 py-6 md:grid-cols-2 xl:grid-cols-3">
            {CANVAS_TEMPLATES.map((template) => (
              <article
                key={template.id}
                className="overflow-hidden rounded-2xl border border-surface-border bg-base/60 shadow-sm"
              >
                <TemplatePreview template={template} />
                <div className="flex flex-col gap-4 px-4 py-4">
                  <div className="space-y-1.5">
                    <h3 className="text-sm font-medium text-copy-primary">
                      {template.name}
                    </h3>
                    <p className="text-sm leading-6 text-copy-muted">
                      {template.description}
                    </p>
                  </div>
                  <Button
                    type="button"
                    className="w-full"
                    onClick={() => {
                      onImport(cloneCanvasTemplate(template))
                      onOpenChange(false)
                    }}
                  >
                    Import template
                  </Button>
                </div>
              </article>
            ))}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}

function TemplatePreview({ template }: { template: CanvasTemplate }) {
  const bounds = getTemplateBounds(template.nodes)
  const scale = Math.min(
    (PREVIEW_WIDTH - PREVIEW_PADDING * 2) / bounds.width,
    (PREVIEW_HEIGHT - PREVIEW_PADDING * 2) / bounds.height
  )
  const contentWidth = bounds.width * scale
  const contentHeight = bounds.height * scale
  const offsetX = (PREVIEW_WIDTH - contentWidth) / 2
  const offsetY = (PREVIEW_HEIGHT - contentHeight) / 2

  return (
    <div className="border-b border-surface-border bg-[radial-gradient(circle_at_top,_rgba(0,200,212,0.12),_transparent_48%),linear-gradient(180deg,rgba(24,24,28,0.95),rgba(8,8,9,0.98))] p-4">
      <div
        className="relative overflow-hidden rounded-2xl border border-surface-border bg-base/80"
        style={{ width: PREVIEW_WIDTH, height: PREVIEW_HEIGHT }}
      >
        <svg
          className="absolute inset-0 h-full w-full"
          aria-hidden="true"
          viewBox={`0 0 ${PREVIEW_WIDTH} ${PREVIEW_HEIGHT}`}
        >
          {template.edges.map((edge) => {
            const source = template.nodes.find((node) => node.id === edge.source)
            const target = template.nodes.find((node) => node.id === edge.target)

            if (!source || !target) {
              return null
            }

            const sourceShape = source.data.shape ?? "rectangle"
            const targetShape = target.data.shape ?? "rectangle"
            const sourceWidth = source.width ?? SHAPE_DEFAULTS[sourceShape].width
            const sourceHeight = source.height ?? SHAPE_DEFAULTS[sourceShape].height
            const targetWidth = target.width ?? SHAPE_DEFAULTS[targetShape].width
            const targetHeight = target.height ?? SHAPE_DEFAULTS[targetShape].height

            const x1 =
              offsetX + (source.position.x - bounds.minX + sourceWidth / 2) * scale
            const y1 =
              offsetY + (source.position.y - bounds.minY + sourceHeight / 2) * scale
            const x2 =
              offsetX + (target.position.x - bounds.minX + targetWidth / 2) * scale
            const y2 =
              offsetY + (target.position.y - bounds.minY + targetHeight / 2) * scale

            return (
              <line
                key={edge.id}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke="rgba(237, 237, 237, 0.42)"
                strokeWidth="2"
                strokeLinecap="round"
              />
            )
          })}
        </svg>

        {template.nodes.map((node) => {
          const shape = node.data.shape ?? "rectangle"
          const width = (node.width ?? SHAPE_DEFAULTS[shape].width) * scale
          const height = (node.height ?? SHAPE_DEFAULTS[shape].height) * scale
          const x = offsetX + (node.position.x - bounds.minX) * scale
          const y = offsetY + (node.position.y - bounds.minY) * scale

          return (
            <div
              key={node.id}
              className="absolute"
              style={
                {
                  left: x,
                  top: y,
                  width,
                  height,
                  "--preview-scale": `${scale}`,
                } as CSSProperties
              }
            >
              <div
                className="h-full w-full origin-top-left"
                style={{
                  transform: "scale(var(--preview-scale))",
                  transformOrigin: "top left",
                  width: `${100 / scale}%`,
                  height: `${100 / scale}%`,
                }}
              >
                <CanvasNodeShape
                  label={node.data.label}
                  color={node.data.color}
                  textColor={node.data.textColor}
                  shape={shape}
                />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
