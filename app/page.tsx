"use client";
import { useState, useRef, useEffect } from "react";
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Clipboard,
    Download,
    Trash2,
    ImageIcon,
    FileTextIcon,
    GithubIcon,
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import Image from "next/image";

type TabValue = "paste" | "preview";

export default function ClipboardToPNG(): JSX.Element {
    const [content, setContent] = useState<string>("");
    const [imageData, setImageData] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<TabValue>("paste");
    const [showSuccess, setShowSuccess] = useState<boolean>(false);
    const containerRef = useRef<HTMLDivElement | null>(null);
    const textAreaRef = useRef<HTMLTextAreaElement | null>(null);
    const canvasRef = useRef<HTMLCanvasElement | null>(null);

    // Handle pasting from clipboard
    const handlePaste = (e: React.ClipboardEvent): void => {
        e.preventDefault();

        // Handle image data in clipboard
        if (e.clipboardData.items) {
            for (const item of Array.from(e.clipboardData.items)) {
                if (item.type.indexOf("image") !== -1) {
                    const blob = item.getAsFile();
                    if (blob) {
                        const reader = new FileReader();
                        reader.onload = (event: ProgressEvent<FileReader>) => {
                            if (event.target?.result) {
                                setImageData(event.target.result as string);
                                setContent("");
                                setActiveTab("preview");
                            }
                        };
                        reader.readAsDataURL(blob);
                        return;
                    }
                }
            }
        }

        // Handle text data in clipboard
        const text = e.clipboardData.getData("text/plain");
        if (text) {
            setContent(text);
            setImageData(null);
            setActiveTab("preview");
        }
    };

    // Generate PNG from content
    const generatePNG = (): void => {
        if (imageData) {
            // If we already have image data, just download it
            downloadImage(imageData);
            return;
        }

        if (!content) {
            alert("Please paste some content first!");
            return;
        }

        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        // Create a temporary container to measure text dimensions
        const temp = document.createElement("div");
        temp.style.position = "absolute";
        temp.style.visibility = "hidden";
        temp.style.whiteSpace = "pre-wrap";
        temp.style.fontFamily = "monospace";
        temp.style.fontSize = "16px";
        temp.style.padding = "20px";
        temp.style.maxWidth = "800px";
        temp.style.wordWrap = "break-word";
        temp.innerHTML = content.replace(/\n/g, "<br>").replace(/ /g, "&nbsp;");

        document.body.appendChild(temp);

        // Set canvas dimensions based on text size
        const padding = 40;
        const width = Math.min(800, temp.clientWidth + padding);
        const height = temp.clientHeight + padding;

        canvas.width = width;
        canvas.height = height;

        // Draw background
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, width, height);

        // Draw text
        ctx.fillStyle = "#000000";
        ctx.font = "16px monospace";

        const lines = content.split("\n");
        const lineHeight = 20;
        const startY = 30;
        const startX = 20;

        lines.forEach((line, i) => {
            ctx.fillText(line, startX, startY + i * lineHeight);
        });

        // Clean up
        document.body.removeChild(temp);

        // Convert canvas to data URL and download
        const dataURL = canvas.toDataURL("image/png");
        downloadImage(dataURL);
    };

    // Download the image
    const downloadImage = (dataURL: string): void => {
        const link = document.createElement("a");
        link.download = "clipboard-content.png";
        link.href = dataURL;
        link.click();

        // Show success message
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 3000);
    };

    // Focus textarea on mount
    useEffect(() => {
        if (textAreaRef.current && activeTab === "paste") {
            textAreaRef.current.focus();
        }
    }, [activeTab]);

    // Reset function
    const handleReset = (): void => {
        setContent("");
        setImageData(null);
        setActiveTab("paste");
    };

    return (
        <div className="flex flex-col min-h-screen items-end justify-center gap-5 max-w-3xl mx-auto">
            <Button asChild>
                <a
                    href="https://github.com/azkriven16/paste2image"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex text-sm"
                >
                    <span>Source</span>
                    <GithubIcon />
                </a>
            </Button>
            <TooltipProvider>
                <Card className="w-full">
                    <CardHeader>
                        <div className="flex items-center">
                            <Image
                                src={"/logo.png"}
                                alt="Logo"
                                width={60}
                                height={60}
                                className="object-cover"
                            />
                            <CardTitle>
                                Paste2Image(Clipboard to PNG Converter)
                            </CardTitle>
                        </div>
                        <CardDescription>
                            Paste content from your clipboard and download it as
                            a PNG image
                        </CardDescription>
                    </CardHeader>

                    <Tabs
                        value={activeTab}
                        onValueChange={(value) =>
                            setActiveTab(value as TabValue)
                        }
                        className="w-full"
                    >
                        <div className="px-6 pt-0">
                            <TabsList className="grid w-full grid-cols-2">
                                <TabsTrigger
                                    value="paste"
                                    className="flex items-center"
                                >
                                    <Clipboard className="mr-2" size={16} />
                                    Paste
                                </TabsTrigger>
                                <TabsTrigger
                                    value="preview"
                                    className="flex items-center"
                                >
                                    <ImageIcon className="mr-2" size={16} />
                                    Preview
                                </TabsTrigger>
                            </TabsList>
                        </div>

                        <CardContent className="p-6">
                            {showSuccess && (
                                <Alert className="mb-4">
                                    <Clipboard className="h-4 w-4" />
                                    <AlertTitle>Success!</AlertTitle>
                                    <AlertDescription>
                                        Your PNG has been downloaded
                                        successfully.
                                    </AlertDescription>
                                </Alert>
                            )}

                            <TabsContent value="paste" className="mt-0">
                                <div
                                    className="w-full border-2 border-dashed border-input rounded-lg p-4 min-h-64 bg-muted focus-within:border-primary focus-within:bg-background transition-colors"
                                    onPaste={handlePaste}
                                    tabIndex={0}
                                    ref={containerRef}
                                >
                                    <Textarea
                                        ref={textAreaRef}
                                        value={content}
                                        onChange={(e) =>
                                            setContent(e.target.value)
                                        }
                                        onPaste={handlePaste}
                                        className="w-full h-64 resize-none border-none bg-transparent p-0 focus-visible:ring-0 focus-visible:ring-offset-0 font-mono"
                                        placeholder="Paste content here (Ctrl+V or Cmd+V)..."
                                    />
                                </div>

                                <div className="flex items-center justify-center mt-4 text-sm text-muted-foreground">
                                    <FileTextIcon size={16} className="mr-1" />{" "}
                                    Text or{" "}
                                    <ImageIcon size={16} className="mx-1" />{" "}
                                    images from clipboard are supported
                                </div>
                            </TabsContent>

                            <TabsContent value="preview" className="mt-0">
                                <div className="w-full border rounded-lg p-4 min-h-64 bg-background">
                                    {imageData ? (
                                        <div className="flex justify-center">
                                            <img
                                                src={imageData}
                                                alt="Pasted from clipboard"
                                                className="max-w-full max-h-96 object-contain"
                                            />
                                        </div>
                                    ) : content ? (
                                        <pre className="whitespace-pre-wrap font-mono text-sm overflow-auto max-h-96">
                                            {content}
                                        </pre>
                                    ) : (
                                        <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
                                            <ImageIcon
                                                size={48}
                                                className="mb-2 opacity-50"
                                            />
                                            <p>No content to preview</p>
                                            <p className="text-sm">
                                                Switch to the Paste tab to add
                                                content
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </TabsContent>
                        </CardContent>
                    </Tabs>

                    <CardFooter className="flex justify-between p-6 bg-muted/50">
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    variant="outline"
                                    onClick={handleReset}
                                    className="flex items-center"
                                >
                                    <Trash2 className="mr-2" size={16} />
                                    Clear
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>Clear all content</TooltipContent>
                        </Tooltip>

                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    onClick={generatePNG}
                                    className="flex items-center"
                                    disabled={!content && !imageData}
                                >
                                    <Download className="mr-2" size={16} />
                                    Download PNG
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                                Save content as PNG image
                            </TooltipContent>
                        </Tooltip>
                    </CardFooter>
                </Card>

                <canvas ref={canvasRef} className="hidden" />
            </TooltipProvider>
        </div>
    );
}
