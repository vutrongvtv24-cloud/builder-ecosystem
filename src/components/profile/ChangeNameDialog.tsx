"use client";

import { useState } from "react";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateProfileName } from "@/lib/profile";
import { toast } from "sonner";
import { Pencil, AlertTriangle } from "lucide-react";

interface ChangeNameDialogProps {
    userId: string;
    currentName: string;
    canChange: boolean;
    onNameChanged?: (newName: string) => void;
}

export function ChangeNameDialog({ userId, currentName, canChange, onNameChanged }: ChangeNameDialogProps) {
    const [open, setOpen] = useState(false);
    const [newName, setNewName] = useState(currentName);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async () => {
        if (!newName.trim()) {
            toast.error("Please enter a name");
            return;
        }

        setLoading(true);
        const result = await updateProfileName(userId, newName);
        setLoading(false);

        if (result.success) {
            toast.success("Name updated successfully! 🎉");
            onNameChanged?.(newName.trim());
            setOpen(false);
        } else {
            toast.error(result.error || "Failed to update name");
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button
                    variant="ghost"
                    size="sm"
                    className={`h-6 w-6 p-0 ml-2 ${!canChange ? 'opacity-50' : ''}`}
                    title={canChange ? "Change name (one-time only)" : "Name change already used"}
                >
                    <Pencil className="h-3 w-3" />
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>
                        {canChange ? "Change Your Name" : "Name Change Unavailable"}
                    </DialogTitle>
                    <DialogDescription>
                        {canChange ? (
                            <>
                                ⚠️ <strong>One-time change only!</strong> You can only change your display name once.
                                Choose wisely!
                            </>
                        ) : (
                            <div className="flex items-center gap-2 text-destructive">
                                <AlertTriangle className="h-4 w-4" />
                                <span>You have already used your one-time name change.</span>
                            </div>
                        )}
                    </DialogDescription>
                </DialogHeader>

                {canChange ? (
                    <>
                        <div className="grid gap-4 py-4">
                            <div className="grid gap-2">
                                <Label htmlFor="name">New Display Name</Label>
                                <Input
                                    id="name"
                                    value={newName}
                                    onChange={(e) => setNewName(e.target.value)}
                                    placeholder="Enter your new name"
                                    maxLength={50}
                                />
                                <p className="text-xs text-muted-foreground">
                                    {newName.length}/50 characters
                                </p>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setOpen(false)}>
                                Cancel
                            </Button>
                            <Button onClick={handleSubmit} disabled={loading || !newName.trim()}>
                                {loading ? "Updating..." : "Confirm Change"}
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
