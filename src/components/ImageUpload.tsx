import { useState } from 'react';
import { supabase } from '../lib/supabaseClient';

interface ImageUploadProps {
  images: string[];
  onImagesChange: (images: string[]) => void;
  maxImages?: number;
}

export default function ImageUpload({ images, onImagesChange, maxImages = 5 }: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);

  const uploadImage = async (file: File): Promise<string | null> => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `properties/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('property-images')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('property-images')
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (error) {
      console.error('Error uploading image:', error);
      return null;
    }
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    if (images.length + files.length > maxImages) {
      alert(`Solo puedes subir un máximo de ${maxImages} imágenes`);
      return;
    }

    setUploading(true);

    const newImages: string[] = [];
    
    for (const file of Array.from(files)) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        alert(`La imagen ${file.name} es muy grande. Máximo 5MB.`);
        continue;
      }

      if (!file.type.startsWith('image/')) {
        alert(`${file.name} no es una imagen válida.`);
        continue;
      }

      const imageUrl = await uploadImage(file);
      if (imageUrl) {
        newImages.push(imageUrl);
      }
    }

    if (newImages.length > 0) {
      onImagesChange([...images, ...newImages]);
    }

    setUploading(false);
    
    // Reset input
    event.target.value = '';
  };

  const removeImage = async (imageUrl: string, index: number) => {
    try {
      // Extraer el path de la URL pública
      const urlParts = imageUrl.split('/');
      const fileName = urlParts[urlParts.length - 1];
      const filePath = `properties/${fileName}`;

      // Eliminar del storage
      const { error } = await supabase.storage
        .from('property-images')
        .remove([filePath]);

      if (error) {
        console.error('Error deleting image from storage:', error);
      }

      // Eliminar de la lista local
      const newImages = images.filter((_, i) => i !== index);
      onImagesChange(newImages);
    } catch (error) {
      console.error('Error removing image:', error);
    }
  };

  return (
    <div>
      <div style={{ marginBottom: 15 }}>
        <label style={{ display: 'block', marginBottom: 5, fontWeight: 'bold' }}>
          Imágenes ({images.length}/{maxImages})
        </label>
        
        <input
          type="file"
          accept="image/*"
          multiple
          onChange={handleFileSelect}
          disabled={uploading || images.length >= maxImages}
          style={{
            width: '100%',
            padding: '10px',
            border: '2px dashed #ddd',
            borderRadius: '4px',
            cursor: uploading ? 'not-allowed' : 'pointer',
            backgroundColor: uploading ? '#f5f5f5' : 'white'
          }}
        />
        
        {uploading && (
          <p style={{ color: '#666', fontSize: '14px', margin: '5px 0 0 0' }}>
            📤 Subiendo imágenes...
          </p>
        )}
        
        <p style={{ color: '#666', fontSize: '12px', margin: '5px 0 0 0' }}>
          Máximo {maxImages} imágenes, 5MB cada una. Formatos: JPG, PNG, GIF, WebP
        </p>
      </div>

      {/* Vista previa de imágenes */}
      {images.length > 0 && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
          gap: 10,
          marginBottom: 15
        }}>
          {images.map((image, index) => (
            <div
              key={index}
              style={{
                position: 'relative',
                aspectRatio: '1',
                borderRadius: '8px',
                overflow: 'hidden',
                border: '1px solid #ddd'
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={image}
                alt={`Propiedad ${index + 1}`}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover'
                }}
              />
              
              <button
                type="button"
                onClick={() => removeImage(image, index)}
                style={{
                  position: 'absolute',
                  top: '4px',
                  right: '4px',
                  width: '24px',
                  height: '24px',
                  borderRadius: '50%',
                  backgroundColor: 'rgba(220, 53, 69, 0.8)',
                  color: 'white',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
                title="Eliminar imagen"
              >
                ✕
              </button>
              
              {index === 0 && (
                <div style={{
                  position: 'absolute',
                  bottom: '4px',
                  left: '4px',
                  backgroundColor: 'rgba(52, 152, 219, 0.8)',
                  color: 'white',
                  padding: '2px 6px',
                  borderRadius: '4px',
                  fontSize: '10px',
                  fontWeight: 'bold'
                }}>
                  Principal
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
