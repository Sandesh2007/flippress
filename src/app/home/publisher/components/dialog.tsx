'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogTrigger,
  DialogFooter,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { InfoIcon } from 'lucide-react'

export default function InfoDialog() {
  const [open, setOpen] = useState(false)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="cursor-pointer items-center justify-center"
        >
          <InfoIcon className="h-4 w-4" />
        </Button>
      </DialogTrigger>

      <DialogContent
        onEscapeKeyDown={(e) => e.preventDefault()}
        onCloseAutoFocus={(e) => e.preventDefault()}
        className="w-full bg-neutral-300 dark:bg-neutral-900 max-w-md sm:max-w-lg md:max-w-xl lg:max-w-2xl h-fit p-6 sm:p-8"
      >
        <div className="aspect-video w-full rounded-lg overflow-hidden">
          <iframe
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            src="https://www.youtube.com/embed/3pxD6h16I_I?rel=0"
            className="w-full h-full"
            title="How to upload files to flippress"
          />
        </div>

        <DialogFooter>
          <div className="flex flex-col gap-2 text-center sm:text-left">
            <h2 className="text-2xl sm:text-3xl font-semibold text-black dark:text-white">
              Start creating by uploading a file.
            </h2>
            <p className="text-sm text-muted-foreground">
              Upload a file to turn it into your own sharable publication. From
              there, you can customize and share your publications in a range of
              unique and creative ways.
            </p>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
