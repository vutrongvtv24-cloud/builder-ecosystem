import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Bold, Italic, List, Code, Eye, Edit2 } from "lucide-react";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useLanguage } from "@/context/LanguageContext";

interface MarkdownEditorProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    disabled?: boolean;
    minHeight?: string;
}

export function MarkdownEditor({
    value,
    onChange,
    placeholder,
    disabled = false,
    minHeight = "min-h-[80px]"
}: MarkdownEditorProps) {
    const { language } = useLanguage();
    const [isPreview, setIsPreview] = useState(false);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const insertFormat = (format: 'bold' | 'italic' | 'list' | 'code') => {
        const textarea = textareaRef.current;
        if (!textarea) return;

        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const selectedText = value.substring(start, end);
        const before = value.substring(0, start);
        const after = value.substring(end);

        let newText = '';
        let cursorOffset = 0;

        switch (format) {
            case 'bold':
                newText = `**${selectedText || 'bold text'}**`;
                cursorOffset = selectedText ? newText.length : 2;
                break;
            case 'italic':
                newText = `_${selectedText || 'italic text'}_`;
                cursorOffset = selectedText ? newText.length : 1;
                break;
            case 'list':
                newText = `\n- ${selectedText || 'list item'}`;
                cursorOffset = newText.length;
                break;
            case 'code':
                newText = `\`${selectedText || 'code'}\``;
                cursorOffset = selectedText ? newText.length : 1;
                break;
        }

        const nextContent = before + newText + after;
        onChange(nextContent);

        // Restore focus and cursor
        setTimeout(() => {
            textarea.focus();
            if (!selectedText) {
                textarea.setSelectionRange(start + cursorOffset, start + newText.length - cursorOffset);
            } else {
                textarea.setSelectionRange(start + newText.length, start + newText.length);
            }
        }, 0);
    };

    return (
        <div className="w-full">
            {/* Markdown Toolbar */}
            {!disabled && !isPreview && (
                <div className="flex gap-1 mb-2 border-b pb-2">
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => insertFormat('bold')} title="Bold">
                        <Bold className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => insertFormat('italic')} title="Italic">
                        <Italic className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => insertFormat('list')} title="List">
                        <List className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => insertFormat('code')} title="Code">
                        <Code className="h-4 w-4" />
                    </Button>
                    <div className="ml-auto">
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 px-2 text-xs gap-1"
                            onClick={() => setIsPreview(true)}
                        >
                            <Eye className="h-3 w-3" />
                            {language === 'vi' ? 'Xem trước' : 'Preview'}
                        </Button>
                    </div>
                </div>
            )}

            {/* Preview Mode Toolbar */}
            {!disabled && isPreview && (
                <div className="flex justify-end gap-1 mb-2 border-b pb-2">
                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 px-2 text-xs gap-1 text-primary"
                        onClick={() => setIsPreview(false)}
                    >
                        <Edit2 className="h-3 w-3" />
                        {language === 'vi' ? 'Sửa' : 'Edit'}
                    </Button>
                </div>
            )}

            {isPreview ? (
                <div className={`${minHeight} prose prose-sm dark:prose-invert max-w-none p-2 border rounded-md bg-muted/20 overflow-y-auto`}>
                    {value ? (
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {value}
                        </ReactMarkdown>
                    ) : (
                        <span className="text-muted-foreground italic">Nothing to preview</span>
                    )}
                </div>
            ) : (
                <textarea
                    ref={textareaRef}
                    className={`w-full bg-transparent border-none resize-none focus:outline-none text-base text-foreground placeholder:text-muted-foreground ${minHeight}`}
                    placeholder={placeholder}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    disabled={disabled}
                />
            )}
        </div>
    );
}
