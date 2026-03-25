import { supabase } from "../../lib/customSupabaseClient"; // Assuming this is your Supabase client setup

export async function uploadImageFromURL(imageUrl, pageName, pictureName, bucket = 'agency-assets', folder = 'website-photos', pictureId) {
  try {
    const { data, error } = await supabase.functions.invoke('upload-team-image', {
      body: JSON.stringify({
        imageUrl,
        pageName,
        pictureName,
        bucket,
        folder,
        pictureId
      }),
    });

    if (error) {
      console.error('Error invoking upload-team-image edge function:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Failed to upload and register image:', error);
    throw error;
  }
}