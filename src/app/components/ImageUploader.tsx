'use client';
import '@ant-design/v5-patch-for-react-19';
import React, {useState} from 'react';
import { InboxOutlined } from '@ant-design/icons';
import type { UploadProps } from 'antd/es/upload/interface';
import { message, Upload, Skeleton, Button, Image, Result } from 'antd';
import { createClient } from '@/lib/supabase/client';
// import ImgCrop from 'antd-img-crop';

const { Dragger } = Upload;

export const ImageUpload = () => {
  const supabase = createClient();
  // States tp store the image URLs.
  const [uploadedImageUrl,setUploadedImageUrl] = useState<string|null>(null);
  const [isUploading,setIsUploading] = useState<boolean>(false);

  const handleUpload = async (file: File) => {
    const { data,error } = await supabase.storage.from('photos_arty').upload(`user_uploads/${file.name}`,file);
    // console.log(data,error);
    if (error) {
      message.error(`Upload failed: ${error.message}`);
      throw error;
    } else {
      message.success('Upload successful');
      return data; // Contains the file path, etc.
    }
  };

  // Function to get the public URL for a given file path.
  const getPublicUrl = async (path: string) => {
    const { data } = await supabase.storage.from('photos_arty').createSignedUrl(path, 3600);
    return data?.signedUrl;
  };

  // Called when the user clicks "Continue" to trigger ComfyDeploy.
  const handleContinue = async () => {
    if (!uploadedImageUrl) {
      message.error('No image available');
      return;
    }
    const styleImageUrl = await getPublicUrl('styles/pop_art_style.jpg');
    if (!styleImageUrl) {
      message.error('Failed to get style image URL');
      return;
    }
    try {
      const response = await fetch('/api/trigger-comfydeploy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          input_image: uploadedImageUrl,
          input_image_style: styleImageUrl,
        }),
      });
      const result = await response.json();
      if (response.ok) {
        message.success('ComfyDeploy triggered successfully.');
        console.log('ComfyDeploy runId:', result.runId);
      } else {
        message.error('Failed to trigger ComfyDeploy.');
      }
    } catch (error: unknown) {
      console.error('Error triggering ComfyDeploy:', error);
      message.error('Error triggering ComfyDeploy: ');
    }
  };

  const uploadProps: UploadProps = {
    name: 'file',
    multiple: false,
    listType: 'picture',
    maxCount: 1,
    customRequest: async (options) => {
        const { file, onSuccess, onError } = options;
        try {
            setIsUploading(true);
            await handleUpload(file as File);
            // Manually trigger onSuccess so that onChange will reflect status "done".
            onSuccess?.('ok');
        } catch (error) {
            onError?.(error as Error);
        }
    },
    // onChange handler to process the file status updates.
    onChange: async (info) => {
    const { status } = info.file;
    if (status === 'uploading') {
        setIsUploading(true);
        console.log(info.file, info.fileList);
    }
    if (status === 'done') {
        setIsUploading(false);
        message.success(`${info.file.name} file uploaded successfully.`);
        // Retrieve the public URL for the uploaded image.
        const userImageUrl = await getPublicUrl(`user_uploads/${info.file.name}`);
        if (!userImageUrl) {
          message.error('Failed to get the public URL for the uploaded image.');
          return;
        }
        setUploadedImageUrl(userImageUrl);
    } else if (status === 'error') {
        setIsUploading(false);
        message.error(`${info.file.name} file upload failed.`);
    }
    },
    onDrop(e) {
      console.log('Dropped files', e.dataTransfer.files);
    },
  };

  return (
    <div className="p-8 max-w-4xl mx-auto flex flex-col md:flex-row gap-8 items-center">
      {/* Left column: Preview area with skeleton during upload */}
      <div className="md:w-1/3 w-full">
        {isUploading ? (
          <Skeleton.Image active className="w-full h-40" />
        ) : uploadedImageUrl ? (
          <Image
            src={uploadedImageUrl}
            alt="Uploaded"
            style={{ width: '100%', height: 'auto' }}
            className="w-full h-auto rounded-md border"
          />
        ) : (
          <div className="w-full h-80 bg-gray-100 rounded-md flex items-center justify-center">
            <span className="text-gray-500">No image uploaded</span>
          </div>
        )}
      </div>
      {/* Right column: Dragger area or Result component when image is ready */}
      <div className="md:w-2/3 w-full">
        {uploadedImageUrl ? (
          <Result
            status="success"
            title="Image uploaded successfully"
            subTitle="Your image is ready. You can change it or continue to trigger ComfyDeploy."
            extra={[
              <Button key="change" onClick={() => setUploadedImageUrl(null)}>
                Change Image
              </Button>,
              <Button key="continue" type="primary" onClick={handleContinue}>
                Continue
              </Button>,
            ]}
          />
        ) : (
          <div className="space-y-6 flex flex-col items-center">
            <h1 className="text-2xl font-semibold text-center mb-4">
              Upload an Image
            </h1>
            <Dragger {...uploadProps}>
              <p className="ant-upload-drag-icon text-4xl text-blue-500">
                <InboxOutlined />
              </p>
              <p className="ant-upload-text text-lg">
                Click or drag file to upload your image
              </p>
              <p className="ant-upload-hint text-sm">
                Support for a single upload. Strictly prohibited from uploading company data or other banned files.
              </p>
            </Dragger>
          </div>
        )}
      </div>
    </div>
  );
};
