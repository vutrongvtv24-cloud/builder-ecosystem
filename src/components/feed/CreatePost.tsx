"use client";

import { useState, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Image as ImageIcon, X } from "lucide-react";
import { compressImage } from "@/lib/imageUtils";

interface CreatePostProps {
    onPost: (content: string, image?: File) => Promise<void>;
    user: {
        avatar?: string;
        name: string;
        handle?: string;
    } | null;
    placeholder?: string;
    disabled?: boolean;
}

export function CreatePost({ onPost, user, placeholder = "What are you building today?", disabled = false }: CreatePostProps) {
    const [content, setContent] = useState("");
    const [isPosting, setIsPosting] = useState(false);
    const [selectedImage, setSelectedImage] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Preview immediate
        const objectUrl = URL.createObjectURL(file);
        setImagePreview(objectUrl);

        try {
            const compressed = await compressImage(file);
            setSelectedImage(compressed);
        } catch (error) {
            console.error("Compression failed, using original", error);
            setSelectedImage(file);
        }
    };

    const clearImage = () => {
        setSelectedImage(null);
        if (imagePreview) URL.revokeObjectURL(imagePreview);
        setImagePreview(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    const handleSubmit = async () => {
        if ((!content.trim() && !selectedImage) || isPosting) return;

        try {
            setIsPosting(true);
            await onPost(content, selectedImage || undefined);
            setContent("");
            clearImage();
        } finally {
            setIsPosting(false);
        }
    };

    if (!user) return null;

    return (
        <Card className={disabled ? "opacity-60 pointer-events-none" : ""}>
            <CardContent className="pt-6">
                <div className="flex gap-4">
                    <Avatar>
                        <AvatarImage src={user.avatar || ""} />
                        <AvatarFallback>{user.name?.[0] || "U"}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 space-y-4">
                        <textarea
                            className="w-full bg-transparent border-none resize-none focus:outline-none text-base text-foreground placeholder:text-muted-foreground min-h-[80px]"
                            placeholder={placeholder}
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            disabled={disabled}
                        />

                        {imagePreview && (
                            <div className="relative w-full mb-4">
                                <img src={imagePreview} alt="Preview" className="rounded-md max-h-[300px] object-cover" />
                                <Button
                                    size="icon"
                                    variant="secondary"
                                    className="absolute top-2 right-2 h-6 w-6 rounded-full"
                                    onClick={clearImage}
                                >
                                    <X className="h-3 w-3" />
                                </Button>
                            </div>
                        )}

                        <div className="flex justify-between items-center border-t pt-4">
                            <div className="flex gap-2">
                                <input
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    ref={fileInputRef}
                                    onChange={handleImageSelect}
                                    disabled={disabled}
                                />
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-muted-foreground hover:text-primary"
                                    onClick={() => fileInputRef.current?.click()}
                                    disabled={disabled}
                                >
                                    <ImageIcon className="h-4 w-4 mr-2" />
                                    Media
                                </Button>
                            </div>
                            <Button size="sm" onClick={handleSubmit} disabled={(!content.trim() && !selectedImage) || isPosting || disabled}>
                                {isPosting ? "Posting..." : "Post Update"}
                            </Button>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
