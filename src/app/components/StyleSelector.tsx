'use client';
import React, { useState } from 'react';
import { Card, Button, Row, Col, message, Image } from 'antd';
import { RunOutputsGrid } from './RunOutputsGrid';

const { Meta } = Card;

// Array of style options (adjust the image URLs as needed).
const stylesList = [
  { id: 'pop_art', title: 'Pop Art', image: 'https://njmwforcfbhxzrnntock.supabase.co/storage/v1/object/public/public_styles/styles/pop_art_style.jpg' },
  { id: 'picasso', title: 'Cubism', image: 'https://njmwforcfbhxzrnntock.supabase.co/storage/v1/object/public/public_styles/styles/picasso_style.jpg' },
  { id: 'aquarelle', title: 'Aquarelle', image: 'https://njmwforcfbhxzrnntock.supabase.co/storage/v1/object/public/public_styles/styles/aquarelle_style.JPG' },
  { id: 'van_gogh', title: 'Van Gogh', image: 'https://njmwforcfbhxzrnntock.supabase.co/storage/v1/object/public/public_styles/styles/van_gogh_style.jpg' }
];

interface StyleSelectorProps {
  uploadedImageUrl: string;
}

export const StyleSelector: React.FC<StyleSelectorProps> = ({ uploadedImageUrl }) => {
  const [selectedStyles, setSelectedStyles] = useState<string[]>([]);
  const [triggeredRunIds, setTriggeredRunIds] = useState<string[]>([]);

  // Toggle selection of a card.
  const handleCardClick = (id: string) => {
    if (selectedStyles.includes(id)) {
      setSelectedStyles(selectedStyles.filter((item) => item !== id));
    } else {
      setSelectedStyles([...selectedStyles, id]);
    }
  };

  // Handle submission of selected styles.
  const handleSubmit = async () => {
    if (selectedStyles.length === 0) {
      message.error('Please select at least one style.');
      return;
    }
    const newRunIds: string[] = [];
    for (const styleId of selectedStyles) {
        const style = stylesList.find((s) => s.id === styleId);
        if (!style) continue;
        try {
          const response = await fetch('/api/img2img-style-transfer', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              input_image: uploadedImageUrl,
              input_image_style: style.image,
            }),
          });
          const result = await response.json();
          if (response.ok && result.runId) {
            message.success(`Triggered style transfer for ${style.title}.`);
            newRunIds.push(result.runId);
            // console.log('ComfyDeploy runId:', result.runId);
          } else {
            message.error(`Failed to trigger style transfer for ${style.title}.`);
          }
        } catch (error: unknown) {
          console.log('Error triggering style transfer:', error);
          message.error(`Error triggering style transfer for ${style.title}.`);
        }
    }
    setTriggeredRunIds(newRunIds);
  };

  // If runIds are available, display the OutputViewer component.
    if (triggeredRunIds.length > 0) {
        return (
            <div className="p-8">
                <h2 className="text-2xl font-semibold text-center mb-4">Style Transfer Outputs</h2>
                <RunOutputsGrid runIds={triggeredRunIds} />
            </div>
        );
    }

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-6">
      <h2 className="text-2xl font-semibold text-center">Select a Style</h2>
      <Row gutter={[16, 16]}>
        {stylesList.map((style) => (
          <Col xs={24} sm={12} md={12} lg={6} key={style.id}>
            <Card
              hoverable
              onClick={() => handleCardClick(style.id)}
              cover={
                <div className="w-full aspect-square overflow-hidden"> 
                    <Image
                    alt={style.title}
                    src={style.image}
                    preview={false}
                    className="object-cover h-full w-full"
                    />
                </div>
              }
              className={`cursor-pointer ${
                selectedStyles.includes(style.id)
                  ? 'border-blue-500 border-2 bg-blue-50'
                  : ''
              }`}
            >
              <Meta title={style.title} />
            </Card>
          </Col>
        ))}
      </Row>
      <div className="flex justify-center mt-4">
        <Button
          type="primary"
          onClick={handleSubmit}
          disabled={selectedStyles.length === 0}
        >
          Submit Selection
        </Button>
      </div>
    </div>
  );
};
