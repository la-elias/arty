'use client';
import '@ant-design/v5-patch-for-react-19';
import React, {useState} from 'react';
import { InboxOutlined } from '@ant-design/icons';
import type { UploadProps } from 'antd/es/upload/interface';
import { message, Upload, Skeleton, Button, Image, Result } from 'antd';
import { createClient } from '@/lib/supabase/client';
import { StyleSelector } from './StyleSelector';
// import ImgCrop from 'antd-img-crop';

const { Dragger } = Upload;

export const ImageUpload = () => {
  const supabase = createClient();
  // States tp store the image URLs.
  const [uploadedImageUrl,setUploadedImageUrl] = useState<string|null>(null);
  const [isUploading,setIsUploading] = useState<boolean>(false);
  const [showStyleSelector,setShowStyleSelector] = useState<boolean>(false);

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

  const uploadProps: UploadProps = {
    name: 'file',
    accept: '.jpg,.jpeg,.png',
    multiple: false,
    listType: 'picture',
    maxCount: 1,
    className: 'dark:bg-gray-900 dark:text-gray-300',
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

  if (showStyleSelector && uploadedImageUrl) {
    return <StyleSelector uploadedImageUrl={uploadedImageUrl} />;
  }

  return (
    <div className="p-8 max-w-4xl mx-auto flex flex-col md:flex-row gap-8 items-center">
      {/* Left column: Preview area with skeleton during upload */}
      <div className="md:w-1/3 w-full flex justify-center">
        {isUploading ? (
          <Skeleton.Image active className="w-full dark:bg-gray-900" />
        ) : uploadedImageUrl ? (
          <Image
            src={uploadedImageUrl}
            alt="Uploaded"
            style={{ width: '100%', height: 'auto' }}
            className="w-full h-auto rounded-md border dark:border-gray-700"
          />
        ) : (
          <div className="w-full h-80 bg-gray-100 rounded-md flex items-center justify-center dark:bg-gray-800">
            <span className="text-gray-500 dark:text-gray-400">
            No image uploaded
            </span>
          </div>
        )}
      </div>
      {/* Right column: Dragger area or Result component when image is ready */}
      <div className="md:w-2/3 w-full">
        {uploadedImageUrl ? (
          <Result
            className='dark:bg-gray-900 dark:text-gray-300'
            status="success"
            title={<p className='text-black dark:text-gray-400'>Image uploaded successfully</p>}
            subTitle={<p className='text-black dark:text-gray-400'>Your image is ready. You can change it or continue to trigger ComfyDeploy.</p>}
            extra={[
              <Button className="border dark:border-gray-900 dark:bg-gray-400" key="change" onClick={() => setUploadedImageUrl(null)}>
                Change Image
              </Button>,
              <Button className="dark:bg-blue-800 dark:border-transparent" key="continue" type="primary" onClick={() => setShowStyleSelector(true)}>
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
              <p className="text-lg dark:text-gray-300">
                Click or drag file to upload your image
              </p>
              <p className="text-sm dark:text-gray-400">
                Support for a single upload. Strictly prohibited from uploading company data or other banned files.
              </p>
            </Dragger>
          </div>
        )}
      </div>
    </div>
  );
};
