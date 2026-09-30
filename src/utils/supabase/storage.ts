import { supabase } from "./client";

/**
 * Uploads a File or a Base64 string to the Supabase "product-images" storage bucket.
 * @returns The public CDN URL of the uploaded image.
 */
export async function uploadProductImage(fileOrBase64: File | string, fileName?: string): Promise<string> {
  try {
    let fileBody: File | Blob;
    let extension = "jpg";
    let calculatedFileName = fileName || `img-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;

    if (typeof fileOrBase64 === "string") {
      // Verify if it is indeed a data URL or base64 string
      if (!fileOrBase64.startsWith("data:")) {
        // Not a data URL, return original string (might already be an HTTP URL)
        return fileOrBase64;
      }
      
      const mimeType = fileOrBase64.match(/data:([^;]+);/)?.[1] || "image/jpeg";
      extension = mimeType.split("/")[1] || "jpg";
      const base64Data = fileOrBase64.replace(/^data:[^;]+;base64,/, "");
      
      // Convert base64 to binary blob
      const byteCharacters = atob(base64Data);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      fileBody = new Blob([byteArray], { type: mimeType });
    } else {
      fileBody = fileOrBase64;
      extension = fileOrBase64.name.split(".").pop() || "jpg";
    }

    const fullPath = `${calculatedFileName}.${extension}`;

    // Upload to 'product-images' bucket
    const { data, error } = await supabase.storage
      .from("product-images")
      .upload(fullPath, fileBody, {
        cacheControl: "3600",
        upsert: true,
      });

    if (error) {
      console.warn("[Supabase Storage] Bucket upload returned warning, falling back to persistent data URL:", error.message);
      if (typeof fileOrBase64 === "string") return fileOrBase64;
      return new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = () => resolve(URL.createObjectURL(fileOrBase64));
        reader.readAsDataURL(fileOrBase64);
      });
    }

    // Get public URL
    const { data: publicUrlData } = supabase.storage
      .from("product-images")
      .getPublicUrl(fullPath);

    return publicUrlData.publicUrl;
  } catch (err) {
    console.warn("[Supabase Storage] Unexpected error, returning original image:", err);
    return typeof fileOrBase64 === "string" ? fileOrBase64 : "";
  }
}
