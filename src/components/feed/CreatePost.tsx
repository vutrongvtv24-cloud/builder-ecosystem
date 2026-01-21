"use client";

import { useState, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Image as ImageIcon, X } from "lucide-react";
import { compressImage } from "@/lib/imageUtils";
import { useLanguage } from "@/context/LanguageContext";

interface CreatePostProps {
    onPost: (content: string, image?: File, title?: string, minLevel?: number) => Promise<void>;
    user: {
        avatar?: string;
        name: string;
        handle?: string;
    } | null;
    placeholder?: string;
    disabled?: boolean;
    maxLevel?: number;
}

export function CreatePost({ onPost, user, placeholder, disabled = false, maxLevel = 0 }: CreatePostProps) {
    const { t, language } = useLanguage();
    const [content, setContent] = useState("");
    const [title, setTitle] = useState("");
    const [minLevel, setMinLevel] = useState(0);
    const [isPosting, setIsPosting] = useState(false);
    const [selectedImage, setSelectedImage] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Use i18n placeholder if not provided
    const finalPlaceholder = placeholder || t.feed.shareWhatYouLearned;

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
        if ((!content.trim() && !selectedImage && !title.trim()) || isPosting) return;

        try {
            setIsPosting(true);
            await onPost(content, selectedImage || undefined, title, minLevel);
            setContent("");
            setTitle("");
            setMinLevel(0);
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
                        <input
                            className="w-full bg-transparent border-none focus:outline-none text-lg font-semibold placeholder:text-muted-foreground mb-2"
                            placeholder={language === 'vi' ? "Tiêu đề bài viết (Tùy chọn)" : "Post Title (Optional)"}
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            disabled={disabled}
                        />
                        <textarea
                            className="w-full bg-transparent border-none resize-none focus:outline-none text-base text-foreground placeholder:text-muted-foreground min-h-[80px]"
                            placeholder={finalPlaceholder}
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
                            <div className="flex gap-4 items-center">
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
                                        {language === 'vi' ? 'Ảnh' : 'Media'}
                                    </Button>
                                </div>

                                <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/30 px-2 py-1 rounded-md">
                                    <span className="whitespace-nowrap">{language === 'vi' ? 'Level tối thiểu:' : 'Min Level:'}</span>
                                    <input
                                        type="number"
                                        min="0"
                                        max={maxLevel}
                                        value={minLevel}
                                        onChange={(e) => {
                                            const val = parseInt(e.target.value);
                                            if (!isNaN(val) && val >= 0 && val <= maxLevel) {
                                                setMinLevel(val);
                                            }
                                        }}
                                        className="w-12 bg-transparent text-center border-b border-muted-foreground/50 focus:outline-none focus:border-primary"
                                    />
                                    <span className="text-xs opacity-70">({language === 'vi' ? 'Tối đa' : 'Max'}: {maxLevel})</span>
                                </div>
                            </div>

                            <Button size="sm" onClick={handleSubmit} disabled={(!content.trim() && !selectedImage && !title.trim()) || isPosting || disabled}>
                                {isPosting
                                    ? (language === 'vi' ? 'Đang đăng...' : 'Posting...')
                                    : t.feed.post}
                            </Button>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
