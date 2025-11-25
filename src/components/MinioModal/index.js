import { useEffect, useState } from 'react'
import { BsCopy } from 'react-icons/bs'
import Modal, { ModalContent } from '../Modal'
import {popAlert} from '../Main'
import Button from '../Button'
import { Col, Row } from '../Layout'
import Input from '../Input'

MinioModal.defaultProps = {
    visible: false,
    closeModal: null,
    data: {}
}

export default function MinioModal(props = MinioModal.defaultProps) {

    const [_isProcessing, _setIsProcessing] = useState(false);
    const [bucket, setBucket] = useState("damri");
    const [objects, setObjects] = useState([]);
    const [nextToken, setNextToken] = useState(null);
    const [file, setFile] = useState(null);
    const [key, setKey] = useState("");

    useEffect(() => {
        (async () => {
            // const res = await fetch("/api/s3/buckets/route");
            // const json = await res.json();
            // setBuckets(json.buckets || []);
            loadObjects()
        })();
    }, []);

    async function loadObjects(token) {
        if (!bucket) return;
        const url = new URL(window.location.origin + "/api/s3/buckets/route");
        url.searchParams.set("bucket", bucket);
        if (token) url.searchParams.set("continuationToken", token);
        const res = await fetch(url);
        const json = await res.json();
        if (token) {
            setObjects(prev => [...prev, ...(json.objects || [])]);
        } else {
            setObjects(json.objects || []);
        }
        setNextToken(json.nextContinuationToken || null);
    }

    async function uploadServer() {
        if (!file || !bucket || !key) return alert("Pick bucket, file, and set key");
        _setIsProcessing(true)
        const fd = new FormData();
        fd.append("bucket", bucket);
        fd.append("folder", key);
        fd.append("file", file);
        const res = await fetch("/api/upload", { method: "POST", body: fd });
        const json = await res.json();
        if (json.key) {
            popAlert({"message": "Berhasil upload", type: "success"})
            loadObjects();
            _setIsProcessing(false)
        } else {
            alert("Upload failed: " + json.error);
            _setIsProcessing(false)
        }
    }


    function formatFileSize(bytes) {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    }

    function getFileIcon(isFolder, extension) {
        if (isFolder) return '📁';

        const iconMap = {
            // Images
            'jpg': '🖼️', 'jpeg': '🖼️', 'png': '🖼️', 'gif': '🖼️', 'svg': '🖼️', 'webp': '🖼️',
            // Documents
            'pdf': '📄', 'doc': '📝', 'docx': '📝', 'txt': '📄', 'rtf': '📄',
            // Spreadsheets
            'xls': '📊', 'xlsx': '📊', 'csv': '📊',
            // Presentations
            'ppt': '📊', 'pptx': '📊',
            // Code
            'js': '📜', 'jsx': '📜', 'ts': '📜', 'tsx': '📜', 'html': '📜', 'css': '📜', 'json': '📜',
            'py': '🐍', 'java': '☕', 'cpp': '⚙️', 'c': '⚙️', 'php': '🐘',
            // Archives
            'zip': '🗜️', 'rar': '🗜️', '7z': '🗜️', 'tar': '🗜️', 'gz': '🗜️',
            // Media
            'mp4': '🎬', 'avi': '🎬', 'mov': '🎬', 'wmv': '🎬',
            'mp3': '🎵', 'wav': '🎵', 'flac': '🎵', 'aac': '🎵'
        };

        return iconMap[extension] || '📄';
    }

    function handleObjectClick(object) {
        console.log('Object clicked:', object);
        // Add your custom logic here (e.g., preview, navigate to folder, etc.)
    }

    async function handleCopy(object) {
        try {
            let copy = "https://cdn.bisku.net/damri/"+object.Key
            await navigator.clipboard.writeText(copy);
            popAlert({message: "Salin " + copy, "type": "success" })
        } catch (error) {
            // Fallback for older browsers
            const textArea = document.createElement('textarea');
            textArea.value = object.Key;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            alert('Key copied to clipboard: ' + object.Key);
        }
    }

    return (
        <Modal
            visible={props.visible}
            onBackdropClick={props.closeModal}
            extraLarge
            centeredContent
        >

            <ModalContent
                header={{
                    title: 'Bucket S3',
                    closeModal: props.closeModal
                }}
            >


                <div style={{ padding: 24, fontFamily: "sans-serif" }}>

                    <Row
                    spaceBetween
                    >
                        <Col>
                            <h2>Bucket damri</h2>
                        </Col>
                        <Col
                        alignEnd
                        >
                            <Button
                            small
                            title={"Refresh"}
                            onClick={() => {
                                loadObjects()
                            }}
                            />
                        </Col>
                    </Row>
                   

                    <div style={{
                        border: '1px solid #ddd',
                        borderRadius: '4px',
                        maxHeight: '400px',
                        overflowY: 'auto',
                        backgroundColor: '#fafafa'
                    }}>
                        {objects.length === 0 ? (
                            <div style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
                                No objects found in this bucket
                            </div>
                        ) : (
                            objects.map(o => {
                                const isFolder = o.Key.endsWith('/');
                                const fileName = o.Key.split('/').pop() || o.Key;
                                const fileExtension = fileName.split('.').pop()?.toLowerCase();
                                const fileSize = formatFileSize(o.Size);
                                const lastModified = o.LastModified ? new Date(o.LastModified).toLocaleDateString() : '';

                                return (
                                    <div
                                        key={o.Key}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            padding: '8px 12px',
                                            borderBottom: '1px solid #eee',
                                            cursor: 'pointer',
                                            transition: 'background-color 0.2s'
                                        }}
                                        onMouseEnter={(e) => e.target.style.backgroundColor = '#f0f0f0'}
                                        onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                                        onClick={() => handleObjectClick(o)}
                                    >
                                        <div style={{ marginRight: '12px', fontSize: '16px' }}>
                                            {getFileIcon(isFolder, fileExtension)}
                                        </div>
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{
                                                fontWeight: '500',
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis',
                                                whiteSpace: 'nowrap'
                                            }}>
                                                {fileName || o.Key}
                                            </div>
                                            {o.Key !== fileName && (
                                                <div style={{
                                                    fontSize: '12px',
                                                    color: '#666',
                                                    overflow: 'hidden',
                                                    textOverflow: 'ellipsis',
                                                    whiteSpace: 'nowrap'
                                                }}>
                                                    {o.Key}
                                                </div>
                                            )}
                                        </div>
                                        <div style={{
                                            display: 'flex',
                                            flexDirection: 'column',
                                            alignItems: 'flex-end',
                                            fontSize: '12px',
                                            color: '#666',
                                            minWidth: '80px'
                                        }}>
                                            <div>{fileSize}</div>
                                            {lastModified && <div>{lastModified}</div>}
                                        </div>
                                        <div style={{ marginLeft: '12px' }}>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleCopy(o);
                                                }}
                                                style={{
                                                    background: 'none',
                                                    border: 'none',
                                                    cursor: 'pointer',
                                                    padding: '4px',
                                                    borderRadius: '2px',
                                                    fontSize: '14px'
                                                }}
                                                title="Copy Key"
                                            >
                                                <BsCopy />
                                            </button>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>

                    {nextToken && <button onClick={() => loadObjects(nextToken)}>Load more…</button>}

                    <h2 style={{ marginTop: 24 }}>Upload</h2>

                    <Row
                    verticalCenter
                    >
                        <Col
                        withPadding
                        >
                            <Input
                            note={"Kosongkan jika diluar folder"}
                            placeholder={"Contoh nama-folder/"}
                            title={"Folder object"}
                            value={key}
                            onChange={(value) => {
                                setKey(value)
                            }}
                            />
                        </Col>

                        <Col
                        withPadding
                        >
                            <input type="file" onChange={e => setFile(e.target.files?.[0] ?? null)} />
                        </Col>

                        <Col
                        withPadding
                        >
                            <Button
                            onProcess={_isProcessing}
                            small
                            title={"Unggah"}
                            onClick={() => {
                                uploadServer()
                            }}
                            />
                        </Col>
                    </Row>

                   
                </div>

            </ModalContent>
        </Modal>
    )
}