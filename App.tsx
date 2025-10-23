import React, { useState, useEffect, useRef } from 'react';
import { generateVideo, fileToBase64 } from './services/geminiService';
import { LoaderIcon, UploadIcon } from './components/icons';

type AspectRatio = '16:9' | '9:16';
type Status = 'idle' | 'loading' | 'success' | 'error';

const loadingMessages = [
    "Initializing temporal matrix...",
    "Calibrating neural pathways...",
    "Assembling photonic streams...",
    "Rendering digital consciousness...",
    "Compiling future-vision...",
    "Finalizing ethereal sequence...",
];

export default function App() {
    const [hasApiKey, setHasApiKey] = useState(false);
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [prompt, setPrompt] = useState('futuristic animation for this logo, make it reveals in a futuristic style with low motion slow zoom in');
    const [aspectRatio, setAspectRatio] = useState<AspectRatio>('16:9');
    const [status, setStatus] = useState<Status>('idle');
    const [loadingMessage, setLoadingMessage] = useState(loadingMessages[0]);
    const [videoUrl, setVideoUrl] = useState<string | null>(null);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    
    const videoRef = useRef<HTMLVideoElement>(null);

    useEffect(() => {
        const checkApiKey = async () => {
            if (window.aistudio) {
                const hasKey = await window.aistudio.hasSelectedApiKey();
                setHasApiKey(hasKey);
            }
        };
        checkApiKey();
    }, []);

    useEffect(() => {
        // FIX: Replaced NodeJS.Timeout with ReturnType<typeof setInterval> for browser compatibility.
        let interval: ReturnType<typeof setInterval> | null = null;
        if (status === 'loading') {
            let i = 0;
            interval = setInterval(() => {
                i = (i + 1) % loadingMessages.length;
                setLoadingMessage(loadingMessages[i]);
            }, 3000);
        }
        return () => {
            if (interval) {
                clearInterval(interval);
            }
        };
    }, [status]);

    const handleSelectKey = async () => {
        await window.aistudio.openSelectKey();
        setHasApiKey(true);
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (!file.type.startsWith('image/')) {
                setErrorMessage('Please upload a valid image file (PNG, JPG, etc.).');
                return;
            }
            setErrorMessage(null);
            setImageFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async () => {
        if (!imageFile) {
            setErrorMessage("Please upload a logo image first.");
            return;
        }
        if (!prompt.trim()) {
            setErrorMessage("Please enter a prompt.");
            return;
        }

        setStatus('loading');
        setErrorMessage(null);
        setVideoUrl(null);

        try {
            const base64Data = await fileToBase64(imageFile);
            
            const downloadLink = await generateVideo({
                prompt,
                image: {
                    imageBytes: base64Data,
                    mimeType: imageFile.type,
                },
                aspectRatio,
            });

            const response = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
            if (!response.ok) {
                throw new Error(`Failed to fetch video: ${response.statusText}`);
            }
            const videoBlob = await response.blob();
            const objectUrl = URL.createObjectURL(videoBlob);
            setVideoUrl(objectUrl);
            setStatus('success');

        } catch (error: any) {
            console.error(error);
            const errorMsg = error.message || "An unknown error occurred.";
            setErrorMessage(errorMsg);
            setStatus('error');

            if (errorMsg.includes("Requested entity was not found")) {
                setErrorMessage("Your API key is invalid or expired. Please select a valid key.");
                setHasApiKey(false);
            }
        }
    };
    
    const ApiKeySelector = () => (
        <div className="flex flex-col items-center justify-center h-full text-center py-12">
            <h2 className="text-2xl font-orbitron mb-4 text-cyan-300">Welcome to the Logo Animator</h2>
            <p className="mb-6 max-w-md text-gray-300">To generate videos with Veo, you need to select a Google AI Studio API key. Billing must be enabled for your project.</p>
            <button
                onClick={handleSelectKey}
                className="bg-purple-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-purple-700 transition-all duration-300 shadow-[0_0_15px_rgba(168,85,247,0.5)] hover:shadow-[0_0_25px_rgba(168,85,247,0.8)]"
            >
                Select API Key
            </button>
            <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noopener noreferrer" className="mt-4 text-sm text-cyan-400 hover:text-cyan-200 underline">
                Learn more about billing
            </a>
        </div>
    );

    const UploaderAndForm = () => (
        <div className="space-y-6">
            <div>
                <label htmlFor="file-upload" className="block text-sm font-bold text-cyan-300 mb-2">1. Upload Your Logo</label>
                <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-600 border-dashed rounded-md hover:border-cyan-400 transition-colors duration-300">
                    <div className="space-y-1 text-center">
                        {imagePreview ? (
                            <img src={imagePreview} alt="Logo preview" className="mx-auto h-24 w-auto object-contain"/>
                        ) : (
                            <UploadIcon className="mx-auto h-12 w-12 text-gray-400"/>
                        )}
                        <div className="flex text-sm text-gray-400 justify-center">
                            <label htmlFor="file-upload" className="relative cursor-pointer bg-gray-800 rounded-md font-medium text-purple-400 hover:text-purple-300 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-offset-gray-900 focus-within:ring-purple-500 px-1">
                                <span>Upload a file</span>
                                <input id="file-upload" name="file-upload" type="file" className="sr-only" onChange={handleFileChange} accept="image/*"/>
                            </label>
                        </div>
                        <p className="text-xs text-gray-500">PNG, JPG, GIF up to 10MB</p>
                    </div>
                </div>
            </div>

            <div>
                <label htmlFor="prompt" className="block text-sm font-bold text-cyan-300 mb-2">2. Describe the Animation</label>
                <textarea
                    id="prompt"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    rows={4}
                    className="w-full bg-gray-800 border border-gray-600 rounded-md p-3 text-white placeholder-gray-500 focus:ring-purple-500 focus:border-purple-500"
                    placeholder="e.g., a futuristic reveal with neon lights..."
                />
            </div>
            
            <div>
                <h3 className="block text-sm font-bold text-cyan-300 mb-2">3. Choose Aspect Ratio</h3>
                <div className="flex space-x-4">
                    {(['16:9', '9:16'] as AspectRatio[]).map((ratio) => (
                        <button
                            key={ratio}
                            onClick={() => setAspectRatio(ratio)}
                            className={`px-4 py-2 rounded-md border-2 transition-all duration-200 text-sm sm:text-base ${
                                aspectRatio === ratio
                                    ? 'bg-purple-600 border-purple-500 text-white shadow-[0_0_10px_rgba(168,85,247,0.6)]'
                                    : 'bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600 hover:border-purple-500'
                            }`}
                        >
                           {ratio} {ratio === '16:9' ? '(Landscape)' : '(Portrait)'}
                        </button>
                    ))}
                </div>
            </div>

            <button
                onClick={handleSubmit}
                disabled={status === 'loading' || !imageFile}
                className="w-full font-orbitron flex items-center justify-center bg-cyan-500 text-black font-bold py-3 px-6 rounded-lg hover:bg-cyan-400 transition-all duration-300 shadow-[0_0_15px_rgba(34,211,238,0.5)] hover:shadow-[0_0_25px_rgba(34,211,238,0.8)] disabled:bg-gray-600 disabled:shadow-none disabled:cursor-not-allowed"
            >
                {status === 'loading' ? (
                    <>
                        <LoaderIcon className="mr-2" /> Generating...
                    </>
                ) : 'Generate Video'}
            </button>
            {errorMessage && <p className="text-red-400 text-sm mt-2">{errorMessage}</p>}
        </div>
    );
    
    const ResultDisplay = () => (
        <div className="flex items-center justify-center min-h-[300px] md:min-h-full bg-black bg-opacity-30 rounded-lg p-4">
            {status === 'loading' && (
                 <div className="text-center">
                    <LoaderIcon className="mx-auto h-12 w-12 text-cyan-400" />
                    <p className="mt-4 text-lg font-semibold text-white">{loadingMessage}</p>
                    <p className="text-sm text-gray-400 mt-2">Video generation can take a few minutes. Please wait.</p>
                </div>
            )}
            {status === 'success' && videoUrl && (
                <div className="w-full space-y-4">
                    <h3 className="text-xl font-orbitron text-center text-cyan-300">Animation Complete!</h3>
                    <video ref={videoRef} src={videoUrl} controls autoPlay loop className="w-full rounded-lg shadow-lg shadow-cyan-500/20" />
                     <a
                        href={videoUrl}
                        download={`logo-animation-${Date.now()}.mp4`}
                        className="w-full block text-center bg-purple-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-purple-700 transition-all duration-300 shadow-[0_0_15px_rgba(168,85,247,0.5)]"
                    >
                        Download Video
                    </a>
                </div>
            )}
             {status === 'idle' && (
                <div className="text-center text-gray-500">
                    <p className="text-lg">Your generated video will appear here.</p>
                </div>
             )}
             {status === 'error' && errorMessage && (
                <div className="text-center text-red-400 bg-red-900/20 p-4 rounded-lg">
                    <h3 className="font-bold text-lg mb-2">Generation Failed</h3>
                    <p>{errorMessage}</p>
                </div>
             )}
        </div>
    );

    return (
        <div className="bg-gray-900 min-h-screen text-white p-4 sm:p-6 lg:p-8" style={{backgroundImage: `radial-gradient(circle, rgba(14, 116, 144, 0.1) 1px, transparent 1px)`, backgroundSize: '20px 20px'}}>
            <div className="max-w-7xl mx-auto">
                <header className="text-center mb-8">
                    <h1 className="text-4xl md:text-5xl font-orbitron font-bold tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-cyan-400">
                        Futuristic Logo Animator
                    </h1>
                    <p className="mt-2 text-gray-400">Bring your logo to life with AI-powered video generation.</p>
                </header>
                
                <main className="bg-gray-800/50 backdrop-blur-sm p-6 rounded-2xl shadow-2xl shadow-black/50 border border-gray-700">
                    {!hasApiKey ? (
                        <ApiKeySelector />
                    ) : (
                        <div className="grid md:grid-cols-2 gap-8">
                            <UploaderAndForm />
                            <ResultDisplay />
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
}