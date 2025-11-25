import { useState } from "react";

export default function DragDropUpload(){
    const [dragActive, setDragActive] = useState(false)
    const [files, setFiles] = useState([]);

    function handleDragEnter(e) {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(true);
    }

    function removeFile(fileName, idx) {
        const newArr = [...files];
        newArr.splice(idx, 1);
        setFiles([]);
        setFiles(newArr);
    }

    function handleDrop(e) {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
          for (let i = 0; i < e.dataTransfer.files["length"]; i++) {
            setFiles((prevState) => [...prevState, e.dataTransfer.files[i]]);
          }
        }
    }

    function handleDragLeave(e) {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
    }

    function handleDragOver(e) {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(true);
    }
    
    function handleChange(e) {
        e.preventDefault();
        console.log("File has been added");
        if (e.target.files && e.target.files[0]) {
          for (let i = 0; i < e.target.files["length"]; i++) {
            setFiles((prevState) => [...prevState, e.target.files[i]]);
          }
        }
    }
 
    return (
        <div>
            <form
            onDragEnter={handleDragEnter}
            onSubmit={(e) => e.preventDefault()}
            onDrop={handleDrop}
            onDragLeave={handleDragLeave}
            onDragOver={handleDragOver}
            >
                <input
                placeholder="fileInput"
                className="hidden"
                // ref={inputRef}
                type="file"
                multiple={true}
                onChange={handleChange}
                accept=".xlsx,.xls,image/*,.doc, .docx,.ppt, .pptx,.txt,.pdf"
                />
            </form>
        </div>
    )
}