'use client';

import React, { useState, useRef } from 'react';
import Image from 'next/image';
import Button from '@/components/ui/Button';
import Alert from '@/components/ui/Alert';
import Spinner from '@/components/ui/Spinner';
import {
  getCloudinarySignature,
  uploadToCloudinary,
  CloudinaryUploadResponse,
} from '@/lib/api/cloudinary.api';

export interface UploadedImage {
  url: string;
  publicId: string;
  isPrimary?: boolean;
  order?: number;
}

interface ImageUploadProps {
  folder?: string;
  maxImages?: number;
  existingImages?: UploadedImage[];
  onImagesChange: (images: UploadedImage[]) => void;
  disabled?: boolean;
}

export default function ImageUpload({
  folder = 'products',
  maxImages = 10,
  existingImages = [],
  onImagesChange,
  disabled = false,
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{ [key: string]: number }>({});
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const totalImages = existingImages.length + files.length;
    if (totalImages > maxImages) {
      setError(`Maximum ${maxImages} images allowed`);
      return;
    }

    setError(null);
    setUploading(true);

    try {
      // Get upload signature from backend
      const signatureResponse = await getCloudinarySignature(folder);
      if (!signatureResponse.success) {
        throw new Error('Failed to get upload signature');
      }

      const signature = signatureResponse.data;
      const uploadPromises: Promise<UploadedImage>[] = [];

      // Upload each file
      Array.from(files).forEach((file, index) => {
        const uploadPromise = uploadToCloudinary(
          file,
          signature,
          (progress) => {
            setUploadProgress((prev) => ({
              ...prev,
              [file.name]: progress,
            }));
          }
        ).then((response: CloudinaryUploadResponse) => {
          return {
            url: response.secure_url,
            publicId: response.public_id,
            isPrimary: existingImages.length === 0 && index === 0,
            order: existingImages.length + index,
          };
        });

        uploadPromises.push(uploadPromise);
      });

      const newImages = await Promise.all(uploadPromises);
      const updatedImages = [...existingImages, ...newImages];

      // Set first image as primary if no primary exists
      if (!updatedImages.some((img) => img.isPrimary)) {
        updatedImages[0].isPrimary = true;
      }

      onImagesChange(updatedImages);
      setUploadProgress({});

      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (err: any) {
      setError(err.message || 'Failed to upload images');
      console.error('Upload error:', err);
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveImage = (publicId: string) => {
    const updatedImages = existingImages.filter((img) => img.publicId !== publicId);
    
    // If we removed the primary image, set the first remaining image as primary
    if (updatedImages.length > 0 && !updatedImages.some((img) => img.isPrimary)) {
      updatedImages[0].isPrimary = true;
    }

    onImagesChange(updatedImages);
  };

  const handleSetPrimary = (publicId: string) => {
    const updatedImages = existingImages.map((img) => ({
      ...img,
      isPrimary: img.publicId === publicId,
    }));
    onImagesChange(updatedImages);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const fakeEvent = {
        target: { files },
      } as React.ChangeEvent<HTMLInputElement>;
      handleFileSelect(fakeEvent);
    }
  };

  const canAddMore = existingImages.length < maxImages;

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Product Images
          <span className="text-gray-500 ml-1">
            ({existingImages.length}/{maxImages})
          </span>
        </label>

        {error && (
          <Alert variant="error" className="mb-4">
            {error}
          </Alert>
        )}

        {/* Upload Area */}
        {canAddMore && (
          <div
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            className={`
              border-2 border-dashed rounded-lg p-6 text-center
              transition-colors
              ${
                disabled || uploading
                  ? 'border-gray-300 bg-gray-50 cursor-not-allowed'
                  : 'border-gray-300 hover:border-primary-400 hover:bg-primary-50 cursor-pointer'
              }
            `}
            onClick={() => !disabled && !uploading && fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleFileSelect}
              disabled={disabled || uploading}
              className="hidden"
            />

            {uploading ? (
              <div className="space-y-2">
                <Spinner size="md" />
                <p className="text-sm text-gray-600">Uploading images...</p>
                {Object.keys(uploadProgress).length > 0 && (
                  <div className="space-y-1">
                    {Object.entries(uploadProgress).map(([fileName, progress]) => (
                      <div key={fileName} className="text-xs text-gray-500">
                        <div className="flex justify-between mb-1">
                          <span className="truncate max-w-[200px]">{fileName}</span>
                          <span>{Math.round(progress)}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-1.5">
                          <div
                            className="bg-primary-600 h-1.5 rounded-full transition-all"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                <svg
                  className="mx-auto h-12 w-12 text-gray-400"
                  stroke="currentColor"
                  fill="none"
                  viewBox="0 0 48 48"
                >
                  <path
                    d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-4h4m-4-4v4m0 4v4m0-4h4m-4 4h4"
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <div className="text-sm text-gray-600">
                  <span className="font-medium text-primary-600">Click to upload</span> or drag
                  and drop
                </div>
                <p className="text-xs text-gray-500">
                  PNG, JPG, GIF up to 5MB (max {maxImages} images)
                </p>
              </div>
            )}
          </div>
        )}

        {/* Image Grid */}
        {existingImages.length > 0 && (
          <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {existingImages.map((image, index) => (
              <div
                key={image.publicId}
                className="relative group aspect-square rounded-lg overflow-hidden border-2 border-gray-200 bg-gray-100"
              >
                <Image
                  src={image.url}
                  alt={`Product image ${index + 1}`}
                  fill
                  className="object-cover"
                />

                {/* Primary Badge */}
                {image.isPrimary && (
                  <div className="absolute top-2 left-2">
                    <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-primary-600 text-white">
                      Primary
                    </span>
                  </div>
                )}

                {/* Overlay Actions */}
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-opacity flex items-center justify-center gap-2">
                  {!image.isPrimary && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSetPrimary(image.publicId);
                      }}
                      disabled={disabled}
                      className="text-white hover:text-white hover:bg-white/20"
                    >
                      Set Primary
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveImage(image.publicId);
                    }}
                    disabled={disabled}
                    className="text-error-600 hover:text-error-700 hover:bg-white/20"
                  >
                    Remove
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

