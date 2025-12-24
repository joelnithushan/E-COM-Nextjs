import apiClient from './client';

export interface CloudinarySignature {
  signature: string;
  timestamp: number;
  folder: string;
  cloudName: string;
  apiKey: string;
}

export interface CloudinarySignatureResponse {
  success: boolean;
  data: CloudinarySignature;
}

export interface CloudinaryUploadResponse {
  public_id: string;
  secure_url: string;
  url: string;
  width: number;
  height: number;
  format: string;
}

/**
 * Get Cloudinary upload signature
 */
export const getCloudinarySignature = async (
  folder: string = 'products'
): Promise<CloudinarySignatureResponse> => {
  return apiClient.post('/cloudinary/signature', { folder });
};

/**
 * Upload image directly to Cloudinary
 * This function uploads the file to Cloudinary using the signature
 */
export const uploadToCloudinary = async (
  file: File,
  signature: CloudinarySignature,
  onProgress?: (progress: number) => void
): Promise<CloudinaryUploadResponse> => {
  return new Promise((resolve, reject) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('api_key', signature.apiKey);
    formData.append('timestamp', signature.timestamp.toString());
    formData.append('signature', signature.signature);
    formData.append('folder', signature.folder);

    const xhr = new XMLHttpRequest();

    // Track upload progress
    if (onProgress) {
      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          const progress = (e.loaded / e.total) * 100;
          onProgress(progress);
        }
      });
    }

    xhr.addEventListener('load', () => {
      if (xhr.status === 200) {
        try {
          const response = JSON.parse(xhr.responseText);
          resolve(response);
        } catch (error) {
          reject(new Error('Failed to parse Cloudinary response'));
        }
      } else {
        try {
          const error = JSON.parse(xhr.responseText);
          reject(new Error(error.error?.message || 'Upload failed'));
        } catch {
          reject(new Error(`Upload failed with status ${xhr.status}`));
        }
      }
    });

    xhr.addEventListener('error', () => {
      reject(new Error('Network error during upload'));
    });

    xhr.addEventListener('abort', () => {
      reject(new Error('Upload aborted'));
    });

    xhr.open('POST', `https://api.cloudinary.com/v1_1/${signature.cloudName}/image/upload`);
    xhr.send(formData);
  });
};

