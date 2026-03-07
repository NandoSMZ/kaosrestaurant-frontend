'use client';

import React, { useCallback } from 'react';
import Image from 'next/image';
import { useDropzone } from 'react-dropzone';

interface ImageUploadProps {
  imagePreview: string;
  onImageChange: (file: File) => void;
  disabled?: boolean;
}

export default function ImageUpload({ imagePreview, onImageChange, disabled }: ImageUploadProps) {
  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      onImageChange(acceptedFiles[0]);
    }
  }, [onImageChange]);

  const { getRootProps, getInputProps, isDragActive, isDragReject, isDragAccept } = useDropzone({
    accept: {
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
    },
    onDrop,
    maxFiles: 1,
    disabled,
  });

  return (
    <div>
      <label className="block text-sm font-semibold text-gray-700 mb-2">
        Imagen del Producto *
      </label>
      
      <div
        {...getRootProps()}
        className={`w-full px-4 py-8 border-2 border-dashed rounded-lg transition-all duration-200 cursor-pointer ${
          isDragActive
            ? isDragAccept
              ? 'border-green-500 bg-green-50'
              : isDragReject
              ? 'border-red-500 bg-red-50'
              : 'border-[#e86b07] bg-[#e86b07]/10'
            : 'border-gray-300 bg-gray-50 hover:border-[#e86b07] hover:bg-[#e86b07]/5'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        <input {...getInputProps()} />
        <div className="text-center">
          {imagePreview ? (
            <div className="space-y-3">
              <div className="w-32 h-32 relative rounded-lg border border-gray-300 overflow-hidden mx-auto">
                <Image
                  src={imagePreview}
                  alt="Preview"
                  fill
                  className="object-cover"
                  sizes="128px"
                />
              </div>
              <div className="text-gray-700 text-sm">
                <p className="font-medium">Imagen cargada</p>
                <p className="text-gray-500">Haz clic o arrastra una nueva imagen para cambiar</p>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="text-4xl">📷</div>
              <div className="text-gray-700">
                <p className="font-medium">
                  {isDragActive
                    ? isDragAccept
                      ? 'Suelta la imagen aquí'
                      : 'Archivo no válido'
                    : 'Arrastra una imagen aquí o haz clic'}
                </p>
                <p className="text-sm text-gray-500 mt-1">Solo archivos JPG y PNG</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
