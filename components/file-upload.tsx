"use client"
import { UploadDropzone } from "@/lib/uploadthing";
import { X } from "lucide-react";
import Image from "next/image";


type FileUploadProps = {
  value: string
  onChange: (url?: string) => void
  onFileNameChange?: (name: string) => void
  endpoint: 'serverImage' | 'messageFile' | 'userProfilePicture'
}

export default function FileUpload({
  value,
  onChange,
  onFileNameChange,
  endpoint
}: FileUploadProps) {
  const fileType = value?.split(".")?.pop()?.toLowerCase();
  const imageExtensions = ["png", "jpg", "jpeg", "gif", "webp", "svg", "bmp"];
  const isImage = fileType && imageExtensions.includes(fileType);

  if (value && isImage) {
    return (
      <div className="relative h-20 w-20">
        <Image
          fill
          src={value}
          alt="upload"
          className="rounded-full"
        />
        <button onClick={() => onChange('')}
          className="bg-rose-500 text-white p-1 rounded-full absolute top-0 right-0 shadow-sm"
          type="button"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    )
  }

  if (value && !isImage) {
    return (
      <div className="relative flex items-center p-2 mt-2 rounded-md bg-primary/10">
        <div className="h-10 w-10 flex items-center justify-center">
          <X className="h-5 w-5 fill-primary/20 stroke-primary" />
        </div>
        <span className="ml-2 text-sm text-primary truncate max-w-[200px]">
          {value.split("/").pop() || "Uploaded file"}
        </span>
        <button onClick={() => onChange('')}
          className="bg-rose-500 text-white p-1 rounded-full absolute -top-2 -right-2 shadow-sm"
          type="button"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    )
  }
  return (
    <UploadDropzone
      endpoint={endpoint}
      onClientUploadComplete={(res) => {
        onChange(res?.[0].ufsUrl);
        if (res?.[0].name && onFileNameChange) {
          onFileNameChange(res[0].name);
        }
      }}
      onUploadError={(error: Error) => {
        console.log(error)
      }}
    />
  )
}
