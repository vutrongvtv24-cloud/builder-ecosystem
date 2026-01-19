
import imageCompression from 'browser-image-compression';

export async function compressImage(file: File): Promise<File> {
    const options = {
        maxSizeMB: 1,           // Max size 1MB (very generous for web, usually results in <500KB)
        maxWidthOrHeight: 1920, // Max dimension 1920px (HD)
        useWebWorker: true,     // Use multi-threading
        fileType: "image/webp"  // Convert to WebP
    };

    try {
        const compressedFile = await imageCompression(file, options);
        return compressedFile;
    } catch (error) {
        console.error("Image compression error:", error);
        return file; // Return original if compression fails
    }
}
