"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Camera, AlertTriangle, Loader2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { createClient } from "@/lib/supabase/client";
import imageCompression from "browser-image-compression";

interface ChangeAvatarDialogProps {
    userId: string;
    currentAvatar: string;
    currentName: string;
    canChange: boolean;
    onAvatarChanged?: (newUrl: string) => void;
}

export function ChangeAvatarDialog({ userId, currentAvatar, currentName, canChange, onAvatarChanged }: ChangeAvatarDialogProps) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [preview, setPreview] = useState<string | null>(null);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith('image/')) {
            toast.error("Please select an image file");
            return;
        }

        // Compress image
        try {
            const options = {
                maxSizeMB: 0.5,
                maxWidthOrHeight: 400,
                useWebWorker: true,
            };
            const compressedFile = await imageCompression(file, options);
            setSelectedFile(compressedFile);

            // Create preview
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreview(reader.result as string);
            };
            reader.readAsDataURL(compressedFile);
        } catch (error) {
            toast.error("Failed to process image");
        }
    };

    const handleSubmit = async () => {
        if (!selectedFile) {
            toast.error("Please select an image");
            return;
        }

        setLoading(true);
        const supabase = createClient();

        try {
            // Upload to Supabase Storage
            const fileName = `${userId}/avatar_${Date.now()}.webp`;
            const { data: uploadData, error: uploadError } = await supabase.storage
                .from('avatars')
                .upload(fileName, selectedFile, {
                    cacheControl: '3600',
                    upsert: true
                });

            if (uploadError) {
                throw new Error(uploadError.message);
            }

            // Get public URL
            const { data: { publicUrl } } = supabase.storage
                .from('avatars')
                .getPublicUrl(fileName);

            // Update profile with new avatar URL and mark as changed
            const { error: updateError } = await supabase
                .from('profiles')
                .update({
                    avatar_url: publicUrl,
                    avatar_changed: true
                })
                .eq('id', userId);

            if (updateError) {
                throw new Error(updateError.message);
            }

            toast.success("Avatar updated successfully! 🎉");
            onAvatarChanged?.(publicUrl);
            setOpen(false);
            setPreview(null);
            setSelectedFile(null);
        } catch (error: any) {
            toast.error(error.message || "Failed to update avatar");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button
                    variant="secondary"
                    size="icon"
                    className={`absolute bottom-0 right-0 h-8 w-8 rounded-full ${!canChange ? 'opacity-50' : ''}`}
                    title={canChange ? "Change avatar (one-time only)" : "Avatar change already used"}
                >
                    <Camera className="h-4 w-4" />
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>
                        {canChange ? "Change Your Avatar" : "Avatar Change Unavailable"}
                    </DialogTitle>
                    <DialogDescription>
                        {canChange ? (
                            <>
                                ⚠️ <strong>One-time change only!</strong> You can only change your avatar once.
                                Choose a great photo!
                            </>
                        ) : (
                            <div className="flex items-center gap-2 text-destructive">
                                <AlertTriangle className="h-4 w-4" />
                                <span>You have already used your one-time avatar change.</span>
                            </div>
                        )}
                    </DialogDescription>
                </DialogHeader>

                {canChange ? (
                    <>
                        <div className="flex flex-col items-center gap-4 py-4">
                            {/* Preview Avatar */}
                            <div className="relative">
                                <Avatar className="h-32 w-32 border-4 border-background shadow-lg">
                                    <AvatarImage src={preview || currentAvatar} />
                                    <AvatarFallback className="text-3xl">{currentName?.[0]}</AvatarFallback>
                                </Avatar>
                            </div>

                            {/* File Input */}
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                onChange={handleFileChange}
                                className="hidden"
                            />
                            <Button
                                variant="outline"
                                onClick={() => fileInputRef.current?.click()}
                                disabled={loading}
                            >
                                Select New Photo
                            </Button>

                            {preview && (
                                <p className="text-sm text-muted-foreground">
                                    ✓ New photo selected
                                </p>
                            )}
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => {
                                setOpen(false);
                                setPreview(null);
                                setSelectedFile(null);
                            }}>
                                Cancel
                            </Button>
                            <Button
                                onClick={handleSubmit}
                                disabled={loading || !selectedFile}
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Uploading...
                                    </>
                                ) : (
                                    "Confirm Change"
                                )}
                            </Button>
                        </DialogFooter>
                    </>
                ) : (
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setOpen(false)}>
                            Close
                        </Button>
                    </DialogFooter>
                )}
            </DialogContent>
        </Dialog>
    );
}
