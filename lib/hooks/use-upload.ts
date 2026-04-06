import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

const supabase = createClient();

export function useUpload() {
  const [uploading, setUploading] = useState(false);

  const upload = async (
    bucket: string,
    folder: string,
    file: File
  ): Promise<string> => {
    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const fileName = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

      const { error } = await supabase.storage
        .from(bucket)
        .upload(fileName, file);

      if (error) throw error;

      const {
        data: { publicUrl },
      } = supabase.storage.from(bucket).getPublicUrl(fileName);

      return publicUrl;
    } finally {
      setUploading(false);
    }
  };

  return { upload, uploading };
}
