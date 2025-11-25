import dynamic from 'next/dynamic';
import React, { useState, useEffect } from 'react';

import { EditorState, convertToRaw, ContentState, convertFromHTML  } from 'draft-js';
import draftToHtml from 'draftjs-to-html';
import 'react-draft-wysiwyg/dist/react-draft-wysiwyg.css';
import Styles from './Wysiwyg.module.scss'

const Editor = dynamic(
    () => import('react-draft-wysiwyg').then((mod) => mod.Editor),
    { ssr: false }
);

const htmlToDraft = dynamic(
    () => import('html-to-draftjs').then((mod) => mod.default),
    { ssr: false }
);


const defaultProps = {
    visible: false,
    closeModal: null,
    data: "",
    onSuccess: null,
    onChange: () => {},
}

export default function Wysiwyg(props = defaultProps){
    const [editorState, setEditorState] = useState(EditorState.createEmpty());
    const [_tempBody, _setTempBody] = useState("")

    // Assuming 'data' has the HTML text you need to view

    useEffect(() => {

        if(props.data){

            const contentBlocks = convertFromHTML(props.data);  // Change 'data' variable here as needed
            const contentState = ContentState.createFromBlockArray(
                contentBlocks?.contentBlocks,
                contentBlocks?.entityMap
            );
    
            setEditorState(EditorState.createWithContent(contentState));
        }
    }, [props.data])
    

    useEffect(() => {
        if(!props.visible){
            setEditorState(EditorState.createEmpty())
        }
    }, [props.visible])


    const onEditorStateChange = (newEditorState) => {
        setEditorState(newEditorState);
        const rawContentState = convertToRaw(newEditorState.getCurrentContent());
        const html = draftToHtml(rawContentState);
        if (props.onChange) {
            props.onChange(html);
        }
    };

    
    return (

        <>
          <Editor
            editorState={editorState}
            wrapperClassName={Styles.wrapper}
            editorClassName="demo-editor"
            onEditorStateChange={onEditorStateChange}
          />
            
        </>

    );
}