"use client"

import * as React from "react"
import { AlertTriangle, Trash2 } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

interface AlertDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title?: string
  description?: string
  confirmText?: string
  cancelText?: string
  onConfirm: () => void
  onCancel?: () => void
  variant?: "destructive" | "warning" | "info"
  isLoading?: boolean
}

export default function AlertDialog({
  open,
  onOpenChange,
  title = "Are you sure?",
  description = "This action cannot be undone.",
  confirmText = "Continue",
  cancelText = "Cancel",
  onConfirm,
  onCancel,
  variant = "destructive",
  isLoading = false
}: AlertDialogProps) {
  const handleConfirm = () => {
    onConfirm()
    onOpenChange(false)
  }

  const handleCancel = () => {
    onCancel?.()
    onOpenChange(false)
  }

  const getVariantStyles = () => {
    switch (variant) {
      case "destructive":
        return {
          icon: <Trash2 className="h-6 w-6 text-red-500" />,
          confirmButton: "bg-red-600 hover:bg-red-700 text-white cursor-pointer",
          titleColor: "text-red-900 dark:text-red-100"
        }
      case "warning":
        return {
          icon: <AlertTriangle className="h-6 w-6 text-yellow-500" />,
          confirmButton: "bg-yellow-600 hover:bg-yellow-700 text-white cursor-pointer",
          titleColor: "text-yellow-900 dark:text-yellow-100"
        }
      default:
        return {
          icon: <AlertTriangle className="h-6 w-6 text-blue-500" />,
          confirmButton: "bg-blue-600 hover:bg-blue-700 text-white cursor-pointer",
          titleColor: "text-blue-900 dark:text-blue-100"
        }
    }
  }

  const styles = getVariantStyles()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]"
      onInteractOutside={(e) => e.preventDefault()}
      onEscapeKeyDown={(e) => e.preventDefault()}
      onCloseAutoFocus={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <div className="flex items-center gap-3">
            {styles.icon}
            <DialogTitle className={styles.titleColor}>
              {title}
            </DialogTitle>
          </div>
          <DialogDescription className="pt-2">
            {description}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={handleCancel}
            disabled={isLoading}
            className="cursor-pointer"
          >
            {cancelText}
          </Button>
          <Button
            className={styles.confirmButton}
            onClick={handleConfirm}
            disabled={isLoading}
          >
            {isLoading ? (
              <div className="flex items-center gap-2">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Deleting...
              </div>
            ) : (
              confirmText
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
