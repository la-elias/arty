'use client';
import '@ant-design/v5-patch-for-react-19';
import React from 'react';
import { InboxOutlined } from '@ant-design/icons';
import type { UploadProps } from 'antd/es/upload/interface';
import { message, Upload } from 'antd';
import { createClient } from '@/lib/supabase/client';

const { Dragger } = Upload;

export const ImageUpload = () => {
  const supabase = createClient();

  const handleUpload = async (file: File) => {
    const { data,error } = await supabase.storage.from('photos_arty').upload(`user_uploads/${file.name}`,file);
    console.log(data,error);
    if (error) {
      message.error(`Upload failed: ${error.message}`);
    } else {
      message.success('Upload successful');
      return data; // Contains the file path, etc.
    }
  };

  // Function to get the public URL for a given file path.
  const getPublicUrl = (path: string) => {
    const { data } = supabase.storage.from('photos_arty').getPublicUrl(path);
    return data.publicUrl;
  };

  // Function to call the comfydeploy trigger endpoint with the image URLs.
  const triggerComfyDeploy = async (input_image: string, input_image_style: string) => {
    try {
      const response = await fetch('/api/img2img-style-transfer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input_image, input_image_style }),
      });
      const result = await response.json();
      if (response.ok) {
        message.success('ComfyDeploy triggered successfully.');
        console.log('ComfyDeploy runId:', result.runId);
      } else {
        message.error('Failed to trigger ComfyDeploy.');
      }
    } catch (error: unknown) {
      console.log('Error triggering ComfyDeploy:', error);
      message.error('Error triggering ComfyDeploy');
    }
  };

  const uploadProps: UploadProps = {
    name: 'file',
    multiple: false,
    customRequest: async (options) => {
        const { file, onSuccess, onError } = options;
        try {
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
    if (status !== 'uploading') {
        console.log(info.file, info.fileList);
    }
    if (status === 'done') {
        message.success(`${info.file.name} file uploaded successfully.`);
        // Retrieve the public URL for the uploaded image.
        const userImageUrl = getPublicUrl(`user_uploads/${info.file.name}`);
        // Assume a static style image is stored in the "styles" folder.
        const styleImageUrl = getPublicUrl('styles/pop_art_style.jpg');
        console.log('User image URL:', userImageUrl);
        console.log('Style image URL:', styleImageUrl);
        // Trigger the comfydeploy endpoint with the image URLs.
        await triggerComfyDeploy(userImageUrl, styleImageUrl);
    } else if (status === 'error') {
        message.error(`${info.file.name} file upload failed.`);
    }
    },
    onDrop(e) {
      console.log('Dropped files', e.dataTransfer.files);
    },
  };

  return (
    <div className="p-4">
      <Dragger {...uploadProps}>
        <p className="ant-upload-drag-icon text-4xl text-blue-500">
          <InboxOutlined />
        </p>
        <p className="ant-upload-text text-lg">Click or drag file to this area to upload</p>
        <p className="ant-upload-hint text-sm">
          Support for a single or bulk upload. Strictly prohibited from uploading company data or other banned files.
        </p>
      </Dragger>
    </div>
  );
};
