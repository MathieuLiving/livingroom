import React, { useCallback, useEffect, useState } from 'react';
import { useToast } from "../../components/ui/use-toast";
import { UploadCloud, X, Image } from 'lucide-react';
import PropTypes from 'prop-types';

const MAX_FILE_SIZE_MB = 5;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

const PhotoUploader = ({ photos = [], setPhotos, max = 3 }) => {
  const { toast } = useToast();
  const [previews, setPreviews] = useState([]);

  useEffect(() => {
    const generatePreviews = () => {
      const objectUrls = photos.map(photo => {
        if (photo instanceof File) {
          return URL.createObjectURL(photo);
        }
        return photo; // It's already a URL string
      });
      setPreviews(objectUrls);

      return () => {
        objectUrls.forEach(url => {
          if (url && typeof url === 'string' && url.startsWith('blob:')) {
            URL.revokeObjectURL(url);
          }
        });
      };
    };

    if (photos && photos.length > 0) {
      const cleanup = generatePreviews();
      return cleanup;
    } else {
      setPreviews([]);
    }
  }, [photos]);

  const handleFiles = useCallback((files) => {
    const validFiles = [];
    const oversizedFiles = [];

    files.forEach(file => {
      if (file.size > MAX_FILE_SIZE_BYTES) {
        oversizedFiles.push(file.name);
      } else {
        validFiles.push(file);
      }
    });

    if (oversizedFiles.length > 0) {
      toast({
        variant: "destructive",
        title: "Fichiers trop volumineux",
        description: `Certains fichiers dépassent la limite de ${MAX_FILE_SIZE_MB} Mo : ${oversizedFiles.join(', ')}`,
      });
    }
    
    if (photos.length + validFiles.length > max) {
      toast({
        variant: "destructive",
        title: "Limite de photos atteinte",
        description: `Vous ne pouvez téléverser que ${max} photos au maximum.`,
      });
      const remainingSlots = max - photos.length;
      if (remainingSlots > 0) {
        setPhotos(prev => [...prev, ...validFiles.slice(0, remainingSlots)]);
      }
    } else {
       setPhotos(prev => [...prev, ...validFiles]);
    }
  }, [photos.length, setPhotos, toast, max]);


  const handleFileChange = useCallback((event) => {
    const files = Array.from(event.target.files);
    if (files.length > 0) {
      handleFiles(files);
    }
    event.target.value = ''; // Reset input to allow re-uploading the same file
  }, [handleFiles]);

  const removePhoto = useCallback((index) => {
    setPhotos(prev => prev.filter((_, i) => i !== index));
  }, [setPhotos]);

  const onDrop = useCallback((event) => {
    event.preventDefault();
    event.stopPropagation();
    const files = Array.from(event.dataTransfer.files).filter(file => file.type.startsWith('image/'));
    if (files.length > 0) {
       handleFiles(files);
    }
  }, [handleFiles]);

  const onDragOver = (event) => {
    event.preventDefault();
    event.stopPropagation();
  };


  return (
    <div className="space-y-4">
      <div
        className="relative border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-brand-blue transition-colors"
        onClick={() => document.getElementById('photo-upload').click()}
        onDrop={onDrop}
        onDragOver={onDragOver}
      >
        <input
          id="photo-upload"
          type="file"
          multiple
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
          disabled={photos.length >= max}
        />
        <div className="flex flex-col items-center justify-center space-y-2 text-gray-500">
          <UploadCloud className="w-10 h-10" />
          <p className="font-semibold">Glissez-déposez ou cliquez pour téléverser</p>
          <p className="text-xs">JPG, PNG, WEBP. Max {max} photos, {MAX_FILE_SIZE_MB}Mo par photo.</p>
        </div>
      </div>
      {previews.length > 0 && (
        <div className="grid grid-cols-3 gap-4">
          {previews.map((preview, index) => (
            <div key={index} className="relative aspect-square">
              <img src={preview} alt={`Aperçu ${index + 1}`} className="w-full h-full object-cover rounded-md" />
              <button
                type="button"
                onClick={() => removePhoto(index)}
                className="absolute top-1 right-1 bg-black bg-opacity-50 text-white rounded-full p-1 hover:bg-opacity-75"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
          {Array.from({ length: max - previews.length }).map((_, index) => (
            <div key={`placeholder-${index}`} className="aspect-square bg-slate-100 rounded-md flex items-center justify-center">
              <Image className="h-8 w-8 text-slate-400" />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

PhotoUploader.propTypes = {
    photos: PropTypes.array,
    setPhotos: PropTypes.func.isRequired,
    max: PropTypes.number,
};

export default PhotoUploader;